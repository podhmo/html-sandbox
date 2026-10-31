# experiments/svg-gen

A small generator kit for hand-shaped SVG concept figures, from issue
[#96](https://github.com/podhmo/html-sandbox/issues/96): LLMs are not
actually good at writing SVG coordinates by hand, so instead of drawing,
the model writes a short generator and runs it.

The premise: a concept figure is a one-off, not something to mass-produce
in one format, so rather than adopting a full diagram DSL, each figure
gets a small throwaway generator sharing a thin helper.

## Layout

- `svg.ts` — the shared helper (~250 lines, zero deps). `Canvas` collects
  parts; `box`/`circle`/`text`/`line`/`arrow` draw them. The important
  properties:
  - `c.anchor(shape, "e")` and friends compute edge endpoints from shape
    geometry, so an arrow endpoint cannot drift off its box.
  - `box(x, y, "auto", h, {label})` sizes the box to the estimated label
    width, so a label cannot outgrow its box.
  - `arrow` takes `heads: "both"` (or `"start"`/`"none"`) for
    bidirectional edges such as request/response pairs, or `split` for
    two opposing arrows; `midpoint` finds label positions, and
    `label: [...]` gives multi-line box text.
  - `highlight(shape, {opacity, mode})` adds a low-key emphasis zone
    behind a shape: a translucent currentColor "wash" (grey in light
    theme, a light veil in dark) or a dashed "ring" — quieter than a
    marker. `width:` thickens a stroke, `underline:` underlines a label,
    and `fig-highlight.ts` compares the options side by side.
  - `rightOf`/`leftOf`/`above`/`below` place shapes relative to each
    other; the canvas derives the `viewBox` from everything drawn
    (including estimated text extents), so nothing falls outside it.
  - Output is `currentColor` + plain `<text>`, so figures follow the
    site's light/dark theme and stay searchable.
- `check.ts` — an SVG lint built from the failure modes recorded in
  `slops/2026-10-27-writing-slops.md/03-svg-pitfalls.md` (see below).
- `fig-*.ts` — example generators. `node fig-loop.ts` writes
  `build/fig-loop.svg`. Generators can also `assert` spatial claims the
  figure depends on ("these three boxes share the row") so the claim
  fails loudly at build time instead of silently in the picture.
- `Makefile` — `make all` runs every `fig-*.ts`, lints `build/*.svg`,
  and rasterizes them with `rsvg-convert`. Node 26 (runs `.ts`
  directly); no `npm install`.

## Pitfalls checklist

From `03-svg-pitfalls.md`, each recorded failure and where it is now
covered:

| Pitfall | Covered by |
| --- | --- |
| Label clipped by `viewBox` (`text-anchor="end"` at the edge) | viewBox is derived from drawn content; `check.ts` re-verifies every element, including estimated text boxes, sits inside it |
| Text wider than its box | `box` `w: "auto"` sizes to the label; `check.ts` finds the shape containing each text's anchor point and fails if the estimated box overflows it |
| Duplicate `id` across `<pattern>`/`<linearGradient>` | `check.ts` flags duplicate ids per file (bundle-level collision needs a page-level pass) |
| Literal colors in a `currentColor` figure | `check.ts` warns when literal `stroke`/`fill`/`color` values mix with `currentColor` |
| Forbidden constructs in an svg fence (script, `foreignObject`, handlers, remote refs) | `check.ts` fails on them |
| Axis direction inverted ("position means the wrong thing") | not automatable; `assert` in the generator at least states the intended spatial relation in code |
| One fill carrying two meanings | editorial, still manual |
| Schematic figure reading as measured data | editorial: caption/prose must say it is schematic |
| Prose describing the old version of a replaced figure | editorial, still manual |
| "Does not need to be SVG at all" | editorial, still manual |
| Light vs. dark theme appearance | `currentColor` by construction; visual check still needs a themed render (headless Chrome or the blog preview) |

## Verifying a figure

`make check` covers the mechanical half. For the visual half,
`rsvg-convert --background-color '#13171f'` on a copy with
`currentColor` substituted approximates the dark theme; the pitfalls
note used headless Chrome against the real blog CSS, which remains the
more faithful check.
