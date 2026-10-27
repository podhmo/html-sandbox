#!/usr/bin/env node
// Renders build/mermaid.mmd (from graph.json) twice with mermaid itself:
// once with its default dagre layout and once with the ELK layout from
// @mermaid-js/layout-elk.
//
// mermaid draws in a browser, so this needs the Chrome that puppeteer
// installed (`npx puppeteer browsers install chrome`); PUPPETEER_EXECUTABLE_PATH
// overrides it. The page is served over HTTP because Chrome refuses to
// import ES modules from file:// URLs.
import { createServer } from "node:http";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

import { loadGraph, mermaidSource } from "./graph.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const dir = resolve(here, "..");
const build = join(dir, "build");
const LAYOUTS = ["dagre", "elk"];

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
};

// Serves the whole experiment directory, node_modules included, so that
// the page can import mermaid and the ELK layout loader.
function serve() {
  const server = createServer((req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname));
    if (path.includes("..")) {
      res.writeHead(403).end();
      return;
    }
    const file = join(dir, path);
    try {
      const body = readFileSync(file);
      res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok(server)));
}

const code = mermaidSource(loadGraph());
mkdirSync(build, { recursive: true });
writeFileSync(join(build, "mermaid.mmd"), code);

const server = await serve();
const { port } = server.address();
const browser = await puppeteer.launch({
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
  headless: true,
});
try {
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.error("page error:", e.message));
  await page.goto(`http://127.0.0.1:${port}/scripts/mermaid-page.html`);
  await page.waitForFunction("window.ready === true");
  await page.evaluate(() => document.fonts.ready);

  for (const layout of LAYOUTS) {
    const svg = await page.evaluate(
      (code, layout) => window.renderDiagram(code, layout),
      code,
      layout,
    );
    const file = join(build, `mermaid-${layout}.svg`);
    writeFileSync(file, svg);
    console.log(`${file}: ${svg.length} bytes`);
  }
} finally {
  await browser.close();
  server.close();
}
