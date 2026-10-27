# moonbit/experiments/pkg-graph

The package graph of the MoonBit module in `../..`, drawn by mermaid with
its two layout engines, by beautiful-mermaid, and by d2 with its three,
to compare how each lays the same graph out (issue
[#85](https://github.com/podhmo/html-sandbox/issues/85#issuecomment-6421445157)).

## What is in `graph.json`

`graph.json` is the graph itself, so that every renderer starts from the
same data:

- `packages` — the module's own packages, as named by `moon tree`, each
  with its kind (`library` for `pkg/`, `application` for `examples/blog`,
  `generated` for the packages the embed scripts write) and its size:
  source files, test files, declarations, and public declarations, counted
  from `moon ide outline`'s output.
- `edges` — the imports between them. An edge whose `kinds` include
  `source` is needed by the package's code; one that is only
  `blackbox-test` is needed by its tests and is drawn dashed and labelled
  `test`.
- `external` — imports of packages outside the module (for now only the
  compare CLI's three `moonbitlang/async` packages), kept so that nothing
  is silently dropped, but not drawn.

`moon tree` reports no nodes for the standard library, so the graph holds
only what the module itself writes. Regenerate it after adding, removing,
or renaming a package or an import with `make graph`; `graph.json` is
committed so the renderers can run without building the module.

## The drawings

All six are written to `build/` (ignored by git) with the same 17 packages
and 21 edges, asked for left to right, with libraries as rectangles,
applications as rounded boxes, and generated content as cylinders (d2
keeps them all rectangles). The canvas each layout engine picks, and the
counts read back from the SVG by `scripts/measure.mjs`:

<!-- BEGIN measurements -->
| Renderer | Layout | Canvas | Nodes | Edges | SVG |
| --- | --- | ---: | ---: | ---: | ---: |
| beautiful-mermaid | elk | 1005x632 | 17 | 21 | 19.8 KiB |
| d2 | dagre | 1324x1261 | 17 | 21 | 21.9 KiB |
| d2 | elk | 1736x1044 | 17 | 21 | 22.3 KiB |
| d2 | tala | 917x1323 | 17 | 21 | 20.8 KiB |
| mermaid | dagre | 1085x1105 | 17 | 21 | 47.9 KiB |
| mermaid | elk | 1361x827 | 17 | 21 | 46.9 KiB |

<!-- END measurements -->

The order of the files:

- `build/mermaid-{dagre,elk}.svg` — mermaid 12.2 in headless Chrome, with
  `@mermaid-js/layout-elk` registered for `layout: "elk"`; the source is
  `build/mermaid.mmd`
- `build/beautiful-mermaid-elk.svg` — beautiful-mermaid 1.1, which always
  lays out with ELK and needs no browser; the source is
  `build/beautiful-mermaid.mmd`
- `build/d2-{dagre,elk,tala}.svg` — d2 0.9 with `--layout`; the source is
  `build/graph.d2`

## Running

```sh
make install   # npm install, then the Chrome puppeteer drives
make all       # rewrite graph.json, then render all six SVGs
make help
```

The other requirements are `d2` in `PATH` (0.9 has all three layout
engines bundled; see <https://d2lang.com/tour/install>) and `moon` for
`make graph`. The mermaid renderer starts a local HTTP server for the page
that imports mermaid and the ELK loader, since Chrome will not import ES
modules from `file://` URLs; `PUPPETEER_EXECUTABLE_PATH` picks a Chrome
other than the one puppeteer installed. Only mermaid needs a browser;
beautiful-mermaid and d2 do not.

## What differed

- mermaid's dagre layout gives a nearly square canvas (1085x1105): with
  left-to-right ranks, the 17 packages spread over few, tall columns. ELK
  keeps the same direction but spreads them into a wide canvas
  (1361x827), and routes the nine edges that leave `examples/blog/site`
  as shared orthogonal trunks instead of curves; it reads better.
- d2's dagre and ELK repeat mermaid's split — 1324x1261 against
  1736x1044 — and have the two largest canvases of the six. ELK makes
  `examples/blog/site` a very tall box, for the same fan-out that mermaid
  ELK bundles.
- TALA is the outlier. With `direction: right` it still packs the graph
  nearly vertically (917x1323), but its orthogonal edges cross the least
  of the six and the dependencies are easy to follow.
- beautiful-mermaid (ELK) is by far the most compact: 1005x632, about half
  the area of the next smallest, with all 17 nodes, both dashed `test`
  edges with their labels, and the `classDef` colors intact. The cost is
  that it only draws flowcharts, where mermaid and d2 cover more diagram
  types.
- mermaid's SVGs are twice the size of the others (about 47 KiB against
  20 KiB): it writes its CSS, fonts, and markers into every file, where d2
  and beautiful-mermaid keep theirs shorter.
- All six are readable at 17 nodes; the differences are in edge routing
  and in how much of the canvas the `examples/blog/site` fan-out takes.
