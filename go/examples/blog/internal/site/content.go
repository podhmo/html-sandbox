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
)

//go:embed favicon.svg
var favicon []byte

// siteCSS holds the rules pico cannot express and the typography tuned
// for Japanese, loaded after pico.
//
//go:embed site.css
var siteCSS []byte

// searchJS is the client of the search page. Only /search loads it; other
// pages stay JavaScript-free.
//
//go:embed search.js
var searchJS []byte

// versionedPath carries a hash of data in the query, so browsers may cache
// it for long and still pick up a new version right after a deploy.
func versionedPath(name string, data []byte) string {
	sum := sha256.Sum256(data)
	return name + "?v=" + hex.EncodeToString(sum[:4])
}

// siteCSSPath and searchJSPath carry a hash of the file they serve.
var (
	siteCSSPath  = versionedPath("/site.css", siteCSS)
	searchJSPath = versionedPath("/search.js", searchJS)
)

// EmbeddedSources returns the posts and documents built into the binary.
// Every entry point serves these unless told to read files from disk.
func EmbeddedSources() (postsFS, docsFS fs.FS) {
	return posts.FS, repodocs.FS
}
