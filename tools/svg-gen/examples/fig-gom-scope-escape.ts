// fig-gom-scope-escape.ts -- where a Scope handle `s` may go. The
// dashed region is the Scope.run body, the only stretch of time in
// which registering on `s` works; uses inside it are accepted, uses
// that carry `s` past its edge are E0418.
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas();
c.text(0, 0, "Scope のハンドル s が行ってよい場所", { size: 15 });
c.text(0, 20, "破線の枠が Scope.run の本体。枠の外へ s を運ぶものは E0418", { size: 11, opacity: 0.65 });

const body = c.box(0, 44, 330, 300, { dash: "6 4" });
c.text(body.x + 14, body.y + 22, "Scope.run <| fn s -> { ... }", { size: 12 });

const ok = c.color(2);
const ng = c.color(3);
const inside = [
  "Scope.defer s (fn () -> ...)",
  "helper s r",
  "List.iter (fn x -> ... s ...) xs",
  "(fn () -> ... s ...) ()",
  "add (read s)",
];
let y = body.y + 48;
const inBoxes = inside.map((t) => {
  const b = c.box(body.x + 20, y, "auto", 36, { label: t, size: 12, color: ok });
  y += 50;
  return b;
});
void inBoxes;

const outside = [
  "return s",
  "{ scope = s } / Some s",
  "Task.spawn (fn () -> ... s ...)",
  "外側の Scope の cleanup が s を捕捉",
  "reg s（s を持つ部分適用）",
];
const ox = body.x + body.w + 110;
y = body.y + 34;
for (const t of outside) {
  const b = c.box(ox, y, "auto", 36, { label: t, size: 12, color: ng, dash: "4 3" });
  c.arrow([body.x + body.w - 30, b.y + 18], c.anchor(b, "w"), { color: ng, width: 1.5 });
  y += 56;
}
c.text(body.x + body.w + 14, body.y + body.h + 22, "枠を越える矢印 = Scope が閉じた後まで s が残る", { size: 11, opacity: 0.75 });

await writeFile(
  new URL("../build/fig-gom-scope-escape.svg", import.meta.url),
  c.toString({
    label:
      "a dashed region for the Scope.run body holds the accepted uses of s (registration, passing to a helper, a non-escaping List.iter lambda, an immediate call, an eager argument); arrows cross its edge to the rejected uses (returning s, storing it, Task.spawn, an outer cleanup capturing it, a partial application holding it)",
  }),
);
