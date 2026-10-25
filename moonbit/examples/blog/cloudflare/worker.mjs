// The Worker around the MoonBit Wasm (../worker), run by the adapter of
// ../../../pkg/http/wasm, which passes the request and the response
// through the Wasm's memory. See docs/sketch/ja/moonbit-workers-adapter.md
// and docs/sketch/ja/moonbit-workers-http.md for why.
import wasm from "./build/app.wasm";
import { wasmApp, toResponse } from "../../../pkg/http/wasm/adapter.mjs";

const app = wasmApp(wasm);

// assetURL is the URL to ask the ASSETS binding for path, a path under
// build/content. The binding ignores the host, and each segment is escaped
// so that a name with "#" or "?" still finds its file.
function assetURL(path) {
  return new URL(path.split("/").map(encodeURIComponent).join("/"), "https://assets.local");
}

// loadContent reads the Static Assets once per isolate: files.txt lists
// them (the build makes it), and each file goes to the Wasm, which builds
// the site from them on the first request. A failure is not kept, so the
// next request tries again.
let loading;

function loadContent(env) {
  if (!loading) {
    const pending = fetchContent(env);
    loading = pending;
    pending.catch(() => {
      if (loading === pending) loading = undefined;
    });
  }
  return loading;
}

async function fetchContent(env) {
  if (!env.ASSETS) throw new Error("the ASSETS binding is not configured");
  const list = await env.ASSETS.fetch(assetURL("/files.txt"));
  if (!list.ok) throw new Error(`files.txt: ${list.status} ${list.statusText}`);
  const names = (await list.text()).split("\n").filter((name) => name !== "");
  if (names.length === 0) throw new Error("files.txt lists no files");
  const contents = await Promise.all(
    names.map(async (name) => {
      const res = await env.ASSETS.fetch(assetURL(`/${name}`));
      if (!res.ok) throw new Error(`${name}: ${res.status} ${res.statusText}`);
      return new Uint8Array(await res.arrayBuffer());
    }),
  );
  app.load(names.map((name, i) => [name, contents[i]]));
}

// cache holds the 200 responses to GET and HEAD by path, for this isolate.
// The content comes from Static Assets, which only change on a deploy, so
// a path's page never changes; the query only matters to redirects.
// Spelling a path with different escapes makes a new key, so the cache
// starts over when it is full.
const cache = new Map();
const cacheLimit = 1024;
let cachedBaseURL;

// assetOnly lists the paths served from Static Assets without the Wasm:
// the preview page's renderers. They are not in files.txt, so the Wasm
// never loads them as content, and it never sees their requests either —
// they are binary files the String-based ABI could not carry.
const assetOnly = new Set(["/preview.wasm", "/preview.mjs"]);

export default {
  async fetch(request, env) {
    if (env.ASSETS && assetOnly.has(new URL(request.url).pathname)) {
      return env.ASSETS.fetch(request);
    }
    try {
      await loadContent(env);
    } catch (e) {
      // Like the Wasm's own 500 for content it cannot load.
      return new Response(`${e.message}\n`, {
        status: 500,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
    const baseURL = env.BASE_URL ?? "";
    if (baseURL !== cachedBaseURL || cache.size >= cacheLimit) {
      cache.clear();
      cachedBaseURL = baseURL;
    }
    const cacheable = request.method === "GET" || request.method === "HEAD";
    const path = cacheable ? new URL(request.url).pathname : undefined;
    let res = cacheable ? cache.get(path) : undefined;
    if (!res) {
      // The blog reads no request body (POST and the like get 404), so it
      // is left behind rather than copied into the Wasm's memory.
      // Only the method and the headers: new Request(request, { body: null })
      // would keep the body.
      const { url, method, headers } = request;
      const bodiless = request.body ? new Request(url, { method, headers }) : request;
      res = await app.call(bodiless, env);
      if (cacheable && res.status === 200) cache.set(path, res);
    }
    return toResponse(res);
  },
};
