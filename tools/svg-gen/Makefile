# Small SVG generator kit for concept figures (issue #96): generators
# emit build/*.svg, `make check` lints them, `make png` rasterizes them
# for eyeballing. Node 26 (runs .ts directly) and rsvg-convert; no install.

NODE ?= node
RSVG ?= rsvg-convert
FIGS := $(patsubst fig-%.ts,build/fig-%.svg,$(wildcard fig-*.ts))

.PHONY: all svg check png clean help

all: svg check png

## svg: run every fig-*.ts generator into build/
svg: $(FIGS)

build/fig-%.svg: fig-%.ts svg.ts
	@mkdir -p build
	$(NODE) $<

## check: lint every SVG in build/ (viewBox, ids, banned constructs)
check: svg
	$(NODE) check.ts build/*.svg

## png: rasterize every SVG for visual inspection
png: $(FIGS:.svg=.png)

build/%.png: build/%.svg
	$(RSVG) --background-color white $< -o $@

clean:
	rm -rf build

help:
	@sed -n 's/^## //p' $(MAKEFILE_LIST)
