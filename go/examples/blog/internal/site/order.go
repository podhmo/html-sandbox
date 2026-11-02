package site

import (
	"bytes"
	"io/fs"
	"slices"
	"sort"
	"strings"
	"time"
)

// OrderFileName is the name of the optional file at a collection's root
// packing its addition order: entry names, the most recently added
// first, as the repository's git history reports them
// (tools/article-order.sh writes it when the content is packed).
// Same-day articles sort by it before slug order breaks the tie.
const OrderFileName = ".order"

// orderRanks reads OrderFileName from fsys: entry name -> position in
// the addition order (0 = most recently added). nil when absent.
func orderRanks(fsys fs.FS) map[string]int {
	src, err := fs.ReadFile(fsys, OrderFileName)
	if err != nil {
		return nil
	}
	ranks := map[string]int{}
	for i, name := range strings.Fields(string(src)) {
		if _, ok := ranks[name]; !ok {
			ranks[name] = i
		}
	}
	return ranks
}

// WithOrderFile returns an FS like fsys but holding OrderFileName at its
// root, so that -debug and -watch, which read the real collection
// directory, can serve the same addition order the packed content
// carries. A nil order leaves fsys alone — its own file, if any, stands.
func WithOrderFile(fsys fs.FS, order []byte) fs.FS {
	if order == nil {
		return fsys
	}
	return orderFS{FS: fsys, order: order}
}

// orderFS overlays a read-only OrderFileName on another FS.
type orderFS struct {
	fs.FS
	order []byte
}

func (f orderFS) Open(name string) (fs.File, error) {
	if name == OrderFileName {
		return &orderMemFile{Reader: bytes.NewReader(f.order)}, nil
	}
	return f.FS.Open(name)
}

func (f orderFS) ReadFile(name string) ([]byte, error) {
	if name == OrderFileName {
		return f.order, nil
	}
	return fs.ReadFile(f.FS, name)
}

func (f orderFS) Stat(name string) (fs.FileInfo, error) {
	if name == OrderFileName {
		return orderInfo{size: int64(len(f.order))}, nil
	}
	return fs.Stat(f.FS, name)
}

func (f orderFS) ReadDir(name string) ([]fs.DirEntry, error) {
	entries, err := fs.ReadDir(f.FS, name)
	if err != nil || name != "." {
		return entries, err
	}
	i := sort.Search(len(entries), func(i int) bool { return entries[i].Name() > OrderFileName })
	return slices.Insert(entries, i, fs.DirEntry(orderInfo{size: int64(len(f.order))})), nil
}

// orderInfo is the FileInfo and DirEntry of the overlaid OrderFileName.
type orderInfo struct {
	size int64
}

func (o orderInfo) Name() string               { return OrderFileName }
func (o orderInfo) Size() int64                { return o.size }
func (o orderInfo) Mode() fs.FileMode          { return 0o444 }
func (o orderInfo) ModTime() time.Time         { return time.Time{} }
func (o orderInfo) IsDir() bool                { return false }
func (o orderInfo) Sys() any                   { return nil }
func (o orderInfo) Type() fs.FileMode          { return 0 }
func (o orderInfo) Info() (fs.FileInfo, error) { return o, nil }

// orderMemFile is the overlaid OrderFileName opened for reading.
type orderMemFile struct {
	*bytes.Reader
}

func (f *orderMemFile) Stat() (fs.FileInfo, error) { return orderInfo{size: f.Size()}, nil }
func (f *orderMemFile) Close() error               { return nil }
