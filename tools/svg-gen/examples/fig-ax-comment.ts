// fig-ax-comment.ts -- What the accessibility tree kept, before and after
// PR #16. A skipped comment under `content-visibility: auto`: when the
// rule hit the <li>, the listitem stayed but childless — head (permalink)
// and body were both notRendered. Scoping the rule to .comment-body keeps
// the listitem and its header link in the AX tree; only the body is
// skipped. Node colors: kept in the AX tree (green) vs dropped
// (vermillion, dashed).
import { writeFile } from "node:fs/promises";
import { Canvas, type Shape } from "../svg.ts";

const c = new Canvas();

const KEPT = 2; // green
const GONE = 3; // vermillion

const node = (x: number, y: number, label: string, kept: boolean): Shape =>
  c.box(x, y, "auto", 30, {
    label,
    color: c.color(kept ? KEPT : GONE),
    dash: kept ? undefined : "5 4",
    size: 12,
    padX: 10,
  });

const edge = (a: Shape, b: Shape, kept: boolean) =>
  c.line(c.anchor(a, "s"), c.anchor(b, "n"), {
    color: c.color(kept ? KEPT : GONE),
    dash: kept ? undefined : "5 4",
    opacity: kept ? 0.9 : 0.7,
  });

// ---- before: rule on the <li> ----
c.text(20, 20, "before: CV on <li>", { size: 13 });

const li1 = node(60, 50, "li.comment → listitem", true);
const head1 = node(30, 110, ".comment-head", false);
const body1 = node(190, 110, ".comment-body", false);
edge(li1, head1, false);
edge(li1, body1, false);
c.text(30, 160, "children=0 — head & body notRendered", { size: 11, opacity: 0.7 });

// ---- after: rule on .comment-body ----
c.text(420, 20, "after: CV on .comment-body", { size: 13 });

const li2 = node(460, 50, "li.comment → listitem", true);
const head2 = node(430, 110, ".comment-head", true);
const body2 = node(620, 110, ".comment-body", false);
edge(li2, head2, true);
edge(li2, body2, false);
c.text(430, 160, "children=2 — 番号・パーマリンクは残る", { size: 11, opacity: 0.7 });

// Legend.
const leg1 = node(250, 200, "AX に残る", true);
const leg2 = node(400, 200, "notRendered", false);
leg1; leg2;

await writeFile(new URL("../build/fig-ax-comment.svg", import.meta.url), c.toString({ label: "content-visibility を <li> から .comment-body に移すと AX ツリーに listitem とパーマリンクが残る図" }));
console.log("wrote fig-ax-comment.svg");
