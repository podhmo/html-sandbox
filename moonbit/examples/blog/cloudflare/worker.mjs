// The Worker around the MoonBit Wasm (../worker), run by the adapter of
// ../../../pkg/http/wasm, which passes the request and the response
// through the Wasm's memory. See docs/sketch/ja/moonbit-workers-adapter.md
// and docs/sketch/ja/moonbit-workers-http.md for why.
import wasm from "./build/app.wasm";
import { wasmApp, toResponse } from "../../../pkg/http/wasm/adapter.mjs";

const app = wasmApp(wasm);

// loadContent reads the content once per isolate: content.bin, which the
// build packs from the posts and documents (see ../scripts/content.sh),
// goes to the Wasm file by file, and the Wasm builds the site from them on
// the first request. It is one fetch through the ASSETS binding however
// many posts there are: each fetch counts toward the subrequest limit (50
// per invocation on the Workers Free plan), which one fetch per file
// passed once there were 50 files. A failure is not kept, so the next
// request tries again.
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
  // The binding ignores the host.
  const res = await env.ASSETS.fetch(new URL("/content.bin", "https://assets.local"));
  if (!res.ok) throw new Error(`content.bin: ${res.status} ${res.statusText}`);
  const files = unpack(new Uint8Array(await res.arrayBuffer()));
  if (files.length === 0) throw new Error("content.bin holds no files");
  app.load(files);
}

// unpack splits content.bin into [name, content] pairs: each file is a
// header line "<size> <name>\n" followed by its <size> bytes. The contents
// are views into data, not copies.
function unpack(data) {
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const files = [];
  let pos = 0;
  while (pos < data.length) {
    const eol = data.indexOf(10, pos);
    if (eol < 0) throw new Error(`content.bin: no header at byte ${pos}`);
    const header = decoder.decode(data.subarray(pos, eol));
    const m = /^(\d+) (.+)$/.exec(header);
    if (!m) throw new Error(`content.bin: bad header at byte ${pos}: ${JSON.stringify(header)}`);
    const start = eol + 1;
    const end = start + Number(m[1]);
    if (end > data.length) throw new Error(`content.bin: ${m[2]} is cut short`);
    files.push([m[2], data.subarray(start, end)]);
    pos = end;
  }
  return files;
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
// the preview page's renderer. It is not in content.bin, so the Wasm never
// loads it as content, and it never sees its requests either — it is a
// binary file the String-based ABI could not carry. Only GET and HEAD go
// there, like the site's own routing, and the path is decoded first so
// that an escaped spelling (/preview%2Ewasm) finds its file too.
const assetOnly = new Set(["/preview.wasm"]);

export default {
  async fetch(request, env) {
    let decodedPath;
    try {
      decodedPath = decodeURIComponent(new URL(request.url).pathname);
    } catch {
      decodedPath = "";
    }
    if (
      env.ASSETS &&
      (request.method === "GET" || request.method === "HEAD") &&
      assetOnly.has(decodedPath)
    ) {
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
