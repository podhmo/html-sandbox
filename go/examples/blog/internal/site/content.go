// Package site is the blog shared by its entry points: examples/blog (a
// standard HTTP server with -debug and -watch) and examples/blog/workers
// (Cloudflare Workers, built with TinyGo).
package site

import (
	"crypto/sha256"
	_ "embed"
	"encoding/hex"
	"io/fs"

	"github.com/podhmo/html-sandbox/go/examples/blog/posts"
	"github.com/podhmo/html-sandbox/go/examples/blog/repodocs"
	"github.com/podhmo/html-sandbox/go/examples/blog/slops"
)

//go:embed assets/favicon.svg
var favicon []byte

// siteCSS holds the rules pico cannot express and the typography tuned
// for Japanese, loaded after pico.
//
//go:embed assets/site.css
var siteCSS []byte

// siteCSSPath carries a hash of siteCSS, so browsers may cache it for long
// and still pick up a new version right after a deploy.
var siteCSSPath = func() string {
	sum := sha256.Sum256(siteCSS)
	return "/site.css?v=" + hex.EncodeToString(sum[:4])
}()

// codeCopyJS adds a copy-to-clipboard button to every code block, loaded
// after the document is parsed. It is the only script a normal page serves.
//
//go:embed assets/code-copy.js
var codeCopyJS []byte

// codeCopyJSPath carries a hash of codeCopyJS, like siteCSSPath.
var codeCopyJSPath = func() string {
	sum := sha256.Sum256(codeCopyJS)
	return "/code-copy.js?v=" + hex.EncodeToString(sum[:4])
}()

// previewJS runs the preview page's renderer.
//
//go:embed assets/preview.js
var previewJS []byte

// previewWasm renders Markdown on the preview page: the site's own
// rendering, compiled by the moonbit side to Wasm. It is a generated
// file, committed like tinymarkdown.mjs — `make -C moonbit preview`
// rebuilds it.
//
//go:embed assets/preview.wasm
var previewWasm []byte

// previewJSPath and previewWasmPath carry hashes of their files, like
// siteCSSPath.
var previewJSPath = "/preview.js?v=" + versionOf(previewJS)
var previewWasmPath = "/preview.wasm?v=" + versionOf(previewWasm)

// listenJS runs the listen page's player.
//
//go:embed assets/listen.js
var listenJS []byte

// listenJSPath carries a hash of listenJS, like siteCSSPath.
var listenJSPath = "/listen.js?v=" + versionOf(listenJS)

// skimJS runs the skim page's reader.
//
//go:embed assets/skim.js
var skimJS []byte

// skimJSPath carries a hash of skimJS, like siteCSSPath.
var skimJSPath = "/skim.js?v=" + versionOf(skimJS)

// versionOf is the first 4 bytes of b's SHA-256 in hex, as siteCSSPath
// uses it.
func versionOf(b []byte) string {
	sum := sha256.Sum256(b)
	return hex.EncodeToString(sum[:4])
}

// EmbeddedSources returns the posts and documents built into the binary.
// Every entry point serves these unless told to read files from disk.
func EmbeddedSources() (postsFS, slopsFS, docsFS fs.FS) {
	return posts.FS, slops.FS, repodocs.FS
}
