// fig-sarashina.ts -- the supervision figure from
// slops/2026-10-30-pi-sarashina-dogfooding.md/README.md redrawn with the
// generator. In the original, pi agent -> trace-proxy -> Sarashina API
// only had request-direction arrows; here they are bidirectional, since
// a response always comes back.
import { writeFile } from "node:fs/promises";
import { Canvas } from "./svg.ts";

const c = new Canvas();
const DASH = "4 3";

// Row 1: the people and the code
const human = c.box(20, 20, "auto", 40, { label: "人", size: 13 });
const devin = c.box(c.rightOf(human, 70), human.y, "auto", 40, {
  label: "Devin CLI",
  size: 13,
});
const ext = c.box(c.rightOf(devin, 60), human.y, "auto", 40, {
  label: "pi-sarashina 拡張",
  size: 13,
});

// Row 2: the runtime
const pi = c.box(devin.x, devin.y + 110, "auto", 44, {
  label: "pi agent",
  size: 13,
});
const proxy = c.box(c.rightOf(pi, 50), pi.y, "auto", 44, {
  label: "trace-proxy :8787",
  size: 12,
});
const api = c.box(c.rightOf(proxy, 45), pi.y, "auto", 44, {
  label: ["Sarashina", "API"],
  size: 11,
});

// Row 3: what pi writes
const files = c.box(pi.x, c.below(pi, 54), "auto", 40, {
  label: "main.go, *.txt",
  size: 12,
});

// Edges
const label = (s: string, [x, y]: [number, number], dy = -8, size = 11) =>
  c.text(x, y + dy, s, { anchor: "middle", size });

c.arrow(c.anchor(human, "e"), c.anchor(devin, "w"));
label("指示", c.midpoint(c.anchor(human, "e"), c.anchor(devin, "w")));

c.arrow(c.anchor(devin, "e"), c.anchor(ext, "w"));
label("実装", c.midpoint(c.anchor(devin, "e"), c.anchor(ext, "w")));

c.arrow(c.anchor(devin, "s"), c.anchor(pi, "n"), { dash: DASH });
{
  const [x, y] = c.midpoint(c.anchor(devin, "s"), c.anchor(pi, "n"));
  c.text(x - 8, y, "実行・監督", { anchor: "end", size: 11 });
}

c.arrow(c.anchor(ext, "s"), c.anchor(pi, "n"), {
  via: [
    [c.anchor(ext, "s")[0], pi.y - 44],
    [c.anchor(pi, "n")[0] + 40, pi.y - 44],
    [c.anchor(pi, "n")[0] + 40, c.anchor(pi, "n")[1]],
  ],
  dash: DASH,
});
c.text(c.anchor(ext, "s")[0] - 45, pi.y - 52, "pi -e でロード", {
  anchor: "middle",
  size: 11,
});

// Request and response as two opposing arrows, not one double-headed line.
const SPLIT = 12;
c.arrow(c.anchor(pi, "e"), c.anchor(proxy, "w"), { split: SPLIT });
c.arrow(c.anchor(proxy, "e"), c.anchor(api, "w"), { split: SPLIT });
for (const [a, b, s, size] of [
  [pi, proxy, "HTTP", 11],
  [proxy, api, "HTTPS", 10],
] as const) {
  const [x, y] = c.midpoint(c.anchor(a, "e"), c.anchor(b, "w"));
  c.text(x, y - SPLIT / 2 - 8, s, { anchor: "middle", size });
}

c.arrow(c.anchor(pi, "s"), c.anchor(files, "n"));
{
  const [x, y] = c.midpoint(c.anchor(pi, "s"), c.anchor(files, "n"));
  c.text(x + 8, y, "write/edit", { anchor: "start", size: 11 });
}

await writeFile(
  new URL("./build/fig-sarashina.svg", import.meta.url),
  c.toString({
    label:
      "作業の構造: 人は Devin に指示するだけで、Devin が拡張を実装し、pi を実行・監督する。pi は拡張をロードしてプロキシ越しに Sarashina API を呼びながら Go のファイルを書く",
  }),
);
