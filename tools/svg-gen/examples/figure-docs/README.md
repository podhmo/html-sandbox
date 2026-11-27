# figure-docs transcription probes

This directory contains mechanical transcription probes for the figure
catalogs in `u-ichi/agent-plugins` (`plugins/figure-docs/references`),
pinned to commit `c10dce225fe205bdacb64f754cc5b6fc61ead8f2`.

- `business-*.mbtx`: 112 business chart/framework figures
- `dev-*.mbtx`: 38 software engineering diagrams
- `generate.py`: regenerates both sets from the pinned upstream HTML

The probes intentionally keep the upstream coordinates and fixed light-theme
colors. They are capability probes, not redesigned `svg-gen` figures: each
upstream SVG element is emitted through the lowest-level `svg-gen` primitive
that can represent it. This makes missing primitive surface area visible, but
it also means the usual `currentColor`/palette guidance is deliberately not
followed here.

Regenerate after an upstream reference change:

```sh
python3 tools/svg-gen/examples/figure-docs/generate.py
```

Build and lint all probes:

```sh
make -C tools/svg-gen -j8 figure-docs-svg
make -C tools/svg-gen figure-docs-check
```

`figure-docs-check` currently warns about literal colors in every probe. That
is expected for this transcription pass. Warnings about unchecked curve
commands are not expected in principle and are part of the audit findings in
`docs/sketch/ja/figure-docs-svg-gen-audit.md`.
