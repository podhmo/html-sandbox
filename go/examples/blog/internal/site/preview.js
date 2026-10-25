/* The preview page's renderer driver. It renders #preview-src's text
 * into #preview-out with the site's own rendering, compiled to Wasm
 * (with js-string builtins) when the browser can run it, and to JS
 * (an .mjs module) as the fallback — experiments/browser-render proved
 * the load. #preview-data's text carries the setup, one line each:
 * the .wasm's URL, the .mjs's URL, then the site's file list, which the
 * renderer resolves relative links against. */
const src = document.getElementById("preview-src");
const out = document.getElementById("preview-out");
const file = document.getElementById("preview-file");
const engine = document.getElementById("preview-engine");
const [wasmURL, mjsURL, ...fileLines] = document
  .getElementById("preview-data")
  .textContent.split("\n");
const files = fileLines.join("\n");

function mark(kind) {
  if (engine) engine.textContent = `rendered by ${kind}`;
}

async function loadRenderer() {
  try {
    const { instance } = await WebAssembly.instantiateStreaming(
      fetch(wasmURL),
      {},
      { builtins: ["js-string"], importedStringConstants: "_" },
    );
    mark("wasm");
    return instance.exports.render;
  } catch (_) {
    const { render } = await import(mjsURL);
    mark("mjs");
    return render;
  }
}

// Not a module (the pages load no modules), so no top-level await.
loadRenderer().then((render) => {
  const renderNow = () => {
    out.innerHTML = render(src.value, files);
  };
  src.addEventListener("input", renderNow);
  file.addEventListener("change", async () => {
    const f = file.files[0];
    if (!f) return;
    src.value = await f.text();
    renderNow();
  });
  renderNow();
});
