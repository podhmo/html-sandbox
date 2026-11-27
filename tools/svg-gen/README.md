# tools/svg-gen

A small generator kit for hand-shaped SVG concept figures, from issue
[#96](https://github.com/podhmo/html-sandbox/issues/96): LLMs are not
actually good at writing SVG coordinates by hand, so instead of drawing,
the model writes a short generator and runs it.

The premise: a concept figure is a one-off, not something to mass-produce
in one format, so rather than adopting a full diagram DSL, each figure
gets a small throwaway generator sharing a thin helper.

## Layout

- `svg.mbt` — the shared helper (zero deps beyond the stdlib). `Canvas` collects
  parts; `box`/`circle`/`text`/`line`/`arrow` draw them. The important
  properties:
  - `c.anchor(shape, @svg.E)` and friends compute edge endpoints from shape
    geometry, so an arrow endpoint cannot drift off its box.
  - `box(x, y, @svg.Auto, h, label=Some(...))` sizes the box to the estimated
    label width, so a label cannot outgrow its box.
  - `arrow` takes `ends=@svg.Single(@svg.Both)` (or `Start`/`NoHead`) for
    bidirectional edges such as request/response pairs, or `Pair` for
    two opposing arrows; `midpoint` finds label positions, and a
    `\n` inside a `label` string gives multi-line box text.
  - `hbars([{label, value}])` draws a horizontal bar chart sized from
    the values — benchmark-style figures where the scale cannot drift.
  - `highlight(shape, {opacity, mode})` adds a low-key emphasis zone
    behind a shape: a translucent currentColor "wash" (grey in light
    theme, a light veil in dark) or a dashed "ring" — quieter than a
    marker. `width:` thickens a stroke, `underline:` underlines a label,
    and `fig-highlight.mbtx` compares the options side by side.
  - `rightOf`/`leftOf`/`above`/`below` place shapes relative to each
    other; the canvas derives the `viewBox` from everything drawn
    (including estimated text extents), so nothing falls outside it.
    `render(..., viewbox=Some(...))` keeps an explicit fixed coordinate
    system when a figure needs one (small multiples, transcription
    probes).
  - `rect`/`circle`/`ellipse`/`polyline`/`polygon`/`path` cover the
    low-level SVG marks used by diagram probes, with independent stroke,
    fill, and opacity controls. `box` remains the higher-level labelled
    node primitive.
  - `PathBuilder` assembles typed `move_to`/`line_to`/`cubic_to`/
    `quadratic_to`/`arc_to`/`close` paths while tracking their bounds;
    `draw_path` emits them. `polyline_path`, `smooth_path`, `pie_slice`,
    and `donut_slice` cover common polyline, spline, and arc figures
    without hand-written SVG `d` strings (`fig-curve-builder.mbtx`).
  - Diagram connectors are shape-aware: `port` addresses points along a
    shape edge, `connect` routes orthogonal arrows with closed triangle
    heads, `point_along` gives stable edge-label anchors, and
    `elbow_arrow` exposes the bend routing directly
    (`fig-connectors.mbtx`).
  - `text_metrics`/`text_block_metrics` expose width/ascent/descent
    estimates, `label_side` places shape labels with baseline-aware gaps,
    and `label_edge` centers multi-line connector labels by arc length;
    south labels no longer overlap the shape border
    (`fig-text-placement.mbtx`).
  - Output is `currentColor` + plain `<text>` by default, so figures
    follow the site's light/dark theme and stay searchable. Text and
    marks can opt into explicit colors when a probe or categorical
    figure needs them.
- `chart.mbt` — the data-figure half (the "chart-gen" seed from issue
  #113's figure guideline, see `docs/sketch/ja/figure-guidelines.md`).
  `Scale` maps data to pixels (linear or log, with nice ticks);
  `Plot` draws the frame — axes, tick labels, series/step/dots,
  event and reference lines. Its constructor requires
  `{title, subtitle, footnote}` so the guideline's mandatory
  metadata is a mandatory argument. `fig-chart-*.mbtx` draw charts
  (ECDF, series, scatter, boxplot, histogram, heatmap) from
  seeded-PRNG virtual data; `data.mbt` holds the shared virtual
  datasets so "same data, different figure" comparisons cite one
  source; `ecdf_points` thins step vertices for inline embedding.
- Color is opt-in (the "colorful" option): `color: c.color(i)` on a
  stroke or fill picks from `PALETTE`, six categorical hues adjusted
  to stay legible on both themes. Text stays `currentColor`; use hue
  only to distinguish data marks and keep a dash/width fallback.
  `check.mbtx` warns on literal colors outside `PALETTE`.
- `check.mbtx` — an SVG lint built from the failure modes recorded in
  `slops/2026-10-27-writing-slops.md/03-svg-pitfalls.md` (see below).
  Its path checker understands line and curve commands including
  C/S/Q/T/A in absolute and relative forms.
- `examples/fig-*.mbtx` — example generators. `moon run
  examples/fig-loop.mbtx` writes `build/fig-loop.svg` to stdout.
  Generators can also `abort` spatial claims the
  figure depends on ("these three boxes share the row") so the claim
  fails loudly at build time instead of silently in the picture.
- `examples/figure-docs/` — mechanical transcription probes for the
  112 business and 38 development reference figures from
  `u-ichi/agent-plugins`. `make figure-docs` builds and lints them;
  see that directory's README for why their literal colors are
  intentional.
- `Makefile` — `make all` runs every `examples/fig-*.mbtx`, lints
  `build/*.svg`, and rasterizes them with `rsvg-convert`. The `moon`
  toolchain runs the generators; `vendor.sh` installs `podhmo/svg-gen`
  into the local moon registry so each `.mbtx` can import it
  (`make vendor` runs it and `svg` depends on it).

## Pitfalls checklist

From `03-svg-pitfalls.md`, each recorded failure and where it is now
covered:

| Pitfall | Covered by |
| --- | --- |
| Label clipped by `viewBox` (`text-anchor="end"` at the edge) | viewBox is derived from drawn content; `check.mbtx` re-verifies every element, including estimated text boxes, sits inside it |
| Text wider than its box | `box` `w: Auto` sizes to the label; `check.mbtx` finds the shape containing each text's anchor point and fails if the estimated box overflows it |
| Duplicate `id` across `<pattern>`/`<linearGradient>` | `check.mbtx` flags duplicate ids per file (bundle-level collision needs a page-level pass) |
| Literal colors in a `currentColor` figure | `check.mbtx` warns on `stroke`/`fill`/`color` values outside `PALETTE` (colorful figures mix `currentColor` text with palette marks on purpose) |
| Text anchor sitting on a data mark treated as a label container | `check.mbtx` skips shapes below `TEXT_MIN` (12px); scatter dots are marks, not containers |
| Forbidden constructs in an svg fence (script, `foreignObject`, handlers, remote refs) | `check.mbtx` fails on them |
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
