// Storybook app mount: the storybook's HTTP mux keeps its own routes
// (index/story/static); every other path falls through a catch-all into
// the StoryHttpApp story, which rebuilds the request script-side and
// serves it through the real app mux on a fake store. The browser then
// exercises fetch -> fragment -> DOM swap without a database.
import { writeFile } from "node:fs/promises";
import { Canvas } from "../svg.ts";

const c = new Canvas();

c.text(14, 18, "one :6006 server, two kinds of traffic", {
  size: 12,
  opacity: 0.7,
});

const browser = c.box(20, 96, "auto", 56, {
  label: ["browser", "real requests"],
  color: c.color(0),
  size: 12,
});
const mux = c.box(300, 40, "auto", 56, {
  label: ["storybook mux", "GET /story/* /static/* …"],
  color: c.color(1),
  size: 12,
});
const story = c.box(620, 40, "auto", 56, {
  label: ["print / StoryHttp* stories", "markup & responses"],
  size: 12,
  dash: "5 4",
});
c.arrow(c.anchor(browser, "e"), c.anchor(mux, "w"), { width: 1.5 });
c.arrow(c.anchor(mux, "e"), c.anchor(story, "w"), { width: 1.5 });
c.text(555, 66, "storybook paths", { size: 10, opacity: 0.75, anchor: "middle" });

const app = c.box(300, 152, "auto", 56, {
  label: ["StoryHttpApp story", "New(storyStore).ServeHTTP"],
  color: c.color(3),
  size: 12,
});
c.arrow(c.anchor(mux, "s"), c.anchor(app, "n"), { width: 1.5 });
c.text(480, 126, "catch-all mux.Handle(\"/\")", {
  size: 10,
  opacity: 0.75,
});
const page = c.box(620, 152, "auto", 56, {
  label: ["real app pages", "/issues/2, POST …/comments"],
  color: c.color(3),
  size: 12,
});
c.arrow(c.anchor(app, "e"), c.anchor(page, "w"), {
  width: 1.5,
  heads: "both",
  split: 14,
});
c.text(505, 218, "fragment / 303 / 422", { size: 10, opacity: 0.75 });

c.arrow(c.anchor(browser, "s"), { x: 20, y: 240 }, { heads: "none" });
c.text(
  20,
  260,
  "fetch(POST, X-Partial) from the page lands on the same fake app — DOM swap is observable",
  { size: 11, opacity: 0.65 },
);
c.text(20, 296, "schematic — storyStore is an in-memory fake (ids fixed at 99)", {
  size: 10,
  opacity: 0.55,
});

await writeFile(
  new URL("../build/fig-storybook-app-mount.svg", import.meta.url),
  c.toString({ label: "storybook の mux が storybook パスを story に、それ以外のパスを catch-all 経由で StoryHttpApp（実アプリ mux + fake store）に流し、ブラウザの fetch→fragment→DOM swap を DB なしで検証できる構成図" }),
);
