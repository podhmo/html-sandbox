// The host side of the http/wasm package: runs a MoonBit Wasm that
// exports serve and memory (see wire.mbt) as a fetch handler, for
// Cloudflare Workers or anything else with the Fetch API's Request and
// Response, such as Node.
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const noBody = new Uint8Array(0);
// Statuses whose Response must have a null body.
const nullBodyStatus = new Set([101, 103, 204, 205, 304]);

// wasmApp instantiates module and returns call, which answers a Request
// with the response's parts ({ status, headers, body }), fetch, which
// answers it with a Response, and load, which passes files to the Wasm
// before the first request if it exports file (see wire.mbt). env's string
// values cross as the request's env, like a Worker's variables and secrets.
//
// A body longer than maxBodySize bytes gets 413 without running the Wasm.
// The body is copied into the Wasm's memory, which never shrinks, so the
// limit keeps one large request from taking the isolate's memory.
export function wasmApp(module, { maxBodySize = 1 << 20 } = {}) {
  const { memory, serve, file } = new WebAssembly.Instance(module).exports;

  // grow makes room for size bytes at address 0.
  function grow(size) {
    const more = Math.ceil(size / 65536) - memory.buffer.byteLength / 65536;
    if (more > 0) memory.grow(more);
  }

  async function call(request, env = {}) {
    const body = request.body ? await readBody(request.body, maxBodySize) : noBody;
    if (!body) return tooLarge;
    let head = `${request.method}\n${request.url}\n`;
    for (const [name, value] of request.headers) head += `${name}\t${value}\n`;
    head += "\n";
    for (const [name, value] of Object.entries(env ?? {})) {
      if (typeof value === "string" && !/[\n\t]/.test(name) && !value.includes("\n")) {
        head += `${name}\t${value}\n`;
      }
    }
    head += "\n";
    // Room for the head at 3 bytes per UTF-16 code unit at most, and the body.
    const size = head.length * 3 + body.length;
    grow(size);
    const { written } = encoder.encodeInto(head, new Uint8Array(memory.buffer));
    new Uint8Array(memory.buffer).set(body, written);
    // serve may grow the memory, which detaches the memory.buffer before it.
    const n = serve(written + body.length);
    const out = new Uint8Array(memory.buffer, 0, n);
    let end = out.indexOf(10);
    while (out[end + 1] !== 10) end = out.indexOf(10, end + 1);
    const [status, ...lines] = decoder.decode(out.subarray(0, end)).split("\n");
    const headers = lines.map((line) => {
      const tab = line.indexOf("\t");
      return [line.slice(0, tab), line.slice(tab + 1)];
    });
    return { status: +status, headers, body: out.slice(end + 2) };
  }

  // load passes files, [name, Uint8Array] pairs, to the Wasm's file export
  // one at a time: it writes the name, a tab, and the content at address 0.
  // It rejects a name with a tab or a newline, and the Wasm rejects any
  // file it cannot take, with an error message; load throws an Error with
  // that message. Call it before the first call or fetch: the Wasm builds
  // its site from the files it has when it first serves.
  function load(files) {
    if (typeof file !== "function") {
      throw new Error("the Wasm does not export file");
    }
    let total = 0;
    for (const [name, content] of files) {
      const nameBytes = encoder.encode(name);
      if (nameBytes.includes(9) || nameBytes.includes(10)) {
        throw new Error(`${name}: the name must not hold a tab or a newline`);
      }
      const size = nameBytes.length + 1 + content.length;
      grow(size);
      const buffer = new Uint8Array(memory.buffer);
      buffer.set(nameBytes);
      buffer[nameBytes.length] = 9;
      buffer.set(content, nameBytes.length + 1);
      // file may grow the memory, which detaches memory.buffer before it
      // is read again.
      const n = file(size);
      if (n !== 0) throw new Error(decoder.decode(new Uint8Array(memory.buffer, 0, n)));
      total += size;
    }
    return total;
  }

  return {
    call,
    load,
    async fetch(request, env) {
      return toResponse(await call(request, env));
    },
  };
}

const tooLarge = {
  status: 413,
  headers: [["content-type", "text/plain; charset=utf-8"]],
  body: encoder.encode("413 Request Entity Too Large"),
};

// readBody reads stream up to max bytes, or returns null past them,
// without reading the rest.
async function readBody(stream, max) {
  const chunks = [];
  let size = 0;
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > max) {
      await stream.cancel().catch(() => {});
      return null;
    }
    chunks.push(chunk);
  }
  if (chunks.length === 1) return chunks[0];
  const body = new Uint8Array(size);
  let at = 0;
  for (const chunk of chunks) {
    body.set(chunk, at);
    at += chunk.length;
  }
  return body;
}

// toResponse makes a Response of the parts call returns. It can be called
// again on the same parts.
export function toResponse({ status, headers, body }) {
  return new Response(nullBodyStatus.has(status) ? null : body, { status, headers });
}
