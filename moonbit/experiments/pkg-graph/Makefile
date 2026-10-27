# The package graph of the MoonBit module in ../.., drawn by mermaid
# (with its default dagre layout and with ELK), by beautiful-mermaid
# (ELK), and by d2 (dagre, ELK, and TALA). graph.json is what
# `moon tree --package --json` reports, annotated by `moon ide outline`;
# the renderers write their sources and SVG files to build/. Run
# `make install` once, and `make graph` after adding or removing a
# dependency. Run `make help` for the targets.

NODE ?= node
D2 ?= d2

.PHONY: all graph svg mermaid beautiful d2 install clean help

## all: regenerate graph.json and render every SVG into build/
all: graph svg

## graph: rewrite graph.json from `moon tree --package --json` and `moon ide outline`
graph:
	$(NODE) scripts/extract-graph.mjs

## svg: render every SVG, then check that all of them hold graph.json's nodes and edges
svg: mermaid beautiful d2 measure

## mermaid: build/mermaid-{dagre,elk}.svg with mermaid in headless Chrome
mermaid:
	$(NODE) scripts/render-mermaid.mjs

## beautiful: build/beautiful-mermaid-elk.svg with beautiful-mermaid (no browser)
beautiful:
	$(NODE) scripts/render-beautiful-mermaid.mjs

## d2: build/d2-{dagre,elk,tala}.svg with d2's three layout engines
d2:
	@command -v $(D2) >/dev/null || { echo "d2 not found in PATH; see https://d2lang.com/tour/install"; exit 1; }
	$(NODE) scripts/render-d2.mjs

## measure: print the canvas, node and edge counts, and size of each SVG
measure:
	$(NODE) scripts/measure.mjs

## install: npm install, then the Chrome that mermaid's renderer drives
install:
	npm install
	npx puppeteer browsers install chrome

clean:
	rm -rf build

help:
	@sed -n 's/^## //p' $(MAKEFILE_LIST)
