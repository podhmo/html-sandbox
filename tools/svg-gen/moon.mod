name = "podhmo/svg-gen"

version = "0.1.0"

readme = "README.md"

repository = "https://github.com/podhmo/html-sandbox"

license = "MIT"

preferred_target = "native"

description = "A small SVG generator kit for concept figures: canvases that derive their own viewBox, chart frames, and shared figure helpers."

// The package is a library: its constructors are for the .mbtx
// figure scripts and external callers, not for itself.

warnings = "-unused_constructor"
