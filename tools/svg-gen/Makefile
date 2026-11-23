# Small SVG generator kit for concept figures (issue #96): generators
# are MoonBit .mbtx scripts that print SVG on stdout; `make svg`
# writes build/*.svg, `make check` lints them, `make png` rasterizes
# them for eyeballing. moon toolchain and rsvg-convert; the library
# is vendored into the local registry by vendor.sh (see vendor).

MOON ?= moon
RSVG ?= rsvg-convert
FIGS := $(patsubst examples/fig-%.mbtx,build/fig-%.svg,$(wildcard examples/fig-*.mbtx))

.PHONY: all svg check png clean vendor help

all: svg check png

## vendor: install podhmo/svg-gen into ~/.moon/registry for .mbtx imports
vendor:
	./vendor.sh

## svg: run every examples/fig-*.mbtx generator into build/
svg: vendor $(FIGS)

build/fig-%.svg: examples/fig-%.mbtx vendor
	@mkdir -p build
	# write beside the target and rename: a failed generator then
	# leaves the previous SVG in place instead of truncating it.
	$(MOON) run $< > $@.tmp
	mv $@.tmp $@

## check: lint every SVG in build/ (viewBox, ids, banned constructs)
check: svg
	$(MOON) run check.mbtx build/*.svg

## png: rasterize every SVG for visual inspection
png: $(FIGS:.svg=.png)

build/%.png: build/%.svg
	$(RSVG) --background-color white $< -o $@

clean:
	rm -rf build

help:
	@sed -n 's/^## //p' $(MAKEFILE_LIST)
