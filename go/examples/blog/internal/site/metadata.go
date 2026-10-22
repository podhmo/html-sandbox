package site

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"slices"
)

// metadataFile holds settings of the blog as a whole, one key per feature.
// It is optional.
const metadataFile = "docs/blog.metadata.json"

var (
	metadataKeys     = []string{"docs"}
	docsMetadataKeys = []string{"head", "tail"}
)

// orderDocs moves the documents listed in docs.head of the metadata file
// to the front and those in docs.tail to the back, each in the order
// written; the rest keep their order in between. Entries are file paths
// in the repository, as in Doc.Source.
func orderDocs(fsys fs.FS, docs []Doc) ([]Doc, error) {
	src, err := fs.ReadFile(fsys, metadataFile)
	if errors.Is(err, fs.ErrNotExist) {
		return docs, nil
	}
	if err != nil {
		return nil, err
	}
	head, tail, err := parseDocsOrder(src)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", metadataFile, err)
	}
	index := map[string]int{} // Source -> index in docs
	for i, d := range docs {
		index[d.Source] = i
	}
	listed := map[int]bool{}
	pick := func(key string, sources []string) ([]Doc, error) {
		var picked []Doc
		for _, s := range sources {
			i, ok := index[s]
			if !ok {
				return nil, fmt.Errorf("%s: docs.%s: %q is not a document", metadataFile, key, s)
			}
			if listed[i] {
				return nil, fmt.Errorf("%s: docs.%s: %q is listed twice", metadataFile, key, s)
			}
			listed[i] = true
			picked = append(picked, docs[i])
		}
		return picked, nil
	}
	first, err := pick("head", head)
	if err != nil {
		return nil, err
	}
	last, err := pick("tail", tail)
	if err != nil {
		return nil, err
	}
	ordered := make([]Doc, 0, len(docs))
	ordered = append(ordered, first...)
	for i, d := range docs {
		if !listed[i] {
			ordered = append(ordered, d)
		}
	}
	return append(ordered, last...), nil
}

// parseDocsOrder reads docs.head and docs.tail from the metadata file.
// Types and keys are checked by hand rather than by decoding into a
// struct, so that the messages match the MoonBit blog's.
func parseDocsOrder(src []byte) (head, tail []string, err error) {
	var v any
	if err := json.Unmarshal(src, &v); err != nil {
		return nil, nil, err
	}
	top, ok := v.(map[string]any)
	if !ok {
		return nil, nil, errors.New("want a JSON object")
	}
	if err := checkKeys("", top, metadataKeys); err != nil {
		return nil, nil, err
	}
	d, ok := top["docs"]
	if !ok {
		return nil, nil, nil
	}
	docs, ok := d.(map[string]any)
	if !ok {
		return nil, nil, errors.New(`"docs" must be an object`)
	}
	if err := checkKeys("docs.", docs, docsMetadataKeys); err != nil {
		return nil, nil, err
	}
	if head, err = stringList(docs, "head"); err != nil {
		return nil, nil, err
	}
	if tail, err = stringList(docs, "tail"); err != nil {
		return nil, nil, err
	}
	return head, tail, nil
}

// checkKeys reports the first key of m, in sorted order, not in want.
func checkKeys(prefix string, m map[string]any, want []string) error {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	slices.Sort(keys)
	for _, k := range keys {
		if !slices.Contains(want, k) {
			return fmt.Errorf("unknown key %q (want one of %v)", prefix+k, want)
		}
	}
	return nil
}

// stringList returns docs[key] as strings, or nil if it is absent.
func stringList(docs map[string]any, key string) ([]string, error) {
	v, ok := docs[key]
	if !ok {
		return nil, nil
	}
	xs, ok := v.([]any)
	if !ok {
		return nil, fmt.Errorf("%q must be an array of strings", "docs."+key)
	}
	ss := make([]string, len(xs))
	for i, x := range xs {
		if ss[i], ok = x.(string); !ok {
			return nil, fmt.Errorf("%q must be an array of strings", "docs."+key)
		}
	}
	return ss, nil
}
