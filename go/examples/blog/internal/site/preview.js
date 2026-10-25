/* The preview page's renderer driver. It renders #preview-src's text
 * into #preview-out with the site's own rendering, compiled to Wasm
 * (with js-string builtins) — experiments/browser-render proved the
 * load. The setup rides on #preview-data's data-* attributes (escaped
 * like any attribute value, so a file's name cannot inject markup):
 * data-wasm is the renderer's URL and data-files the site's file list,
 * which the renderer resolves relative links against. */
const src = document.getElementById("preview-src");
const out = document.getElementById("preview-out");
const file = document.getElementById("preview-file");
const engine = document.getElementById("preview-engine");
const { wasm, files } = document.getElementById("preview-data").dataset;

WebAssembly.instantiateStreaming(fetch(wasm), {}, {
  builtins: ["js-string"],
  importedStringConstants: "_",
}).then(({ instance }) => {
  const render = instance.exports.render;
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
  if (engine) engine.textContent = "rendered by wasm";
  renderNow();
}).catch(() => {
  if (engine) {
    engine.textContent =
      "this browser could not run the Wasm renderer";
  }
});
