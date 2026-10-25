package site

import (
	"strconv"
	"strings"
	"unicode"

	"github.com/podhmo/html-sandbox/go/pkg/el"
	pe "github.com/podhmo/html-sandbox/go/pkg/picoel"
)

// anchorIDs assigns an id to each heading on a page: the title is slugified
// as on GitHub, and repeats of the same slug get "-1", "-2", ... suffixes.
// Ids must be unique per page, so one anchorIDs covers the face document
// and every member section of a page.
type anchorIDs struct {
	seen map[string]int
}

func newAnchorIDs() *anchorIDs {
	return &anchorIDs{seen: map[string]int{}}
}

// id returns the anchor id for a heading titled title. A title that
// slugifies to nothing anchors as "sec".
func (a *anchorIDs) id(title string) string {
	base := slugify(title)
	if base == "" {
		base = "sec"
	}
	id := base
	for {
		if _, ok := a.seen[id]; !ok {
			break
		}
		a.seen[base]++
		id = base + "-" + strconv.Itoa(a.seen[base])
	}
	a.seen[id] = 0
	return id
}

// slugify turns a heading title into an anchor id in the GitHub/GitLab
// style: the title is lowercased, whitespace becomes "-", and punctuation,
// symbols, and emoji are dropped — letters, numbers, "-", and "_" are
// kept. Whitespace means Unicode whitespace, so a full-width space also
// becomes "-".
//
// The same rule is written without Unicode general categories so that the
// Go, MoonBit, and TypeScript sites agree exactly: ASCII keeps only
// letters, digits, "-", and "_", and non-ASCII is kept unless it falls in
// dropRanges or dropChars, which enumerate the punctuation and symbol
// blocks. A decomposed accent is kept, a composed one lowercased only in
// its ASCII/full-width part — É stays É, matching no platform exactly but
// matching each other.
func slugify(title string) string {
	var b strings.Builder
	b.Grow(len(title))
	for _, r := range title {
		switch {
		case unicode.IsSpace(r):
			b.WriteByte('-')
		case isASCIIKeeper(r):
			b.WriteRune(toLower(r))
		case r >= 0x80 && !inDrop(r):
			b.WriteRune(toLower(r))
		}
	}
	return b.String()
}

// isASCIIKeeper reports whether r is an ASCII letter, digit, "-", or "_".
func isASCIIKeeper(r rune) bool {
	return r == '-' || r == '_' ||
		'0' <= r && r <= '9' || 'a' <= r && r <= 'z' || 'A' <= r && r <= 'Z'
}

// toLower lowercases ASCII A-Z and full-width A-Z; other letters are
// returned unchanged, which is as far as the rule goes on every site.
func toLower(r rune) rune {
	switch {
	case 'A' <= r && r <= 'Z':
		return r + ('a' - 'A')
	case 'Ａ' <= r && r <= 'Ｚ':
		return r + ('ａ' - 'Ａ')
	}
	return r
}

// dropRange is a half-open [lo, hi) span of code points to drop: the
// Unicode punctuation and symbol blocks a blog heading might hold.
type dropRange struct{ lo, hi rune }

var dropRanges = []dropRange{
	{0x00A1, 0x00C0},   // Latin-1 punctuation and symbols: ¡–¿
	{0x2000, 0x2070},   // general punctuation
	{0x20A0, 0x20C0},   // currency symbols
	{0x20D0, 0x2100},   // combining marks for symbols
	{0x2100, 0x2150},   // letterlike symbols
	{0x2190, 0x2460},   // arrows, math operators, technical and control pictures
	{0x2500, 0x2C00},   // box drawing, blocks, geometric shapes, dingbats, more math and arrows
	{0x2E00, 0x2E80},   // supplemental punctuation
	{0x3001, 0x3004},   // CJK punctuation: 、。〃
	{0x3008, 0x3012},   // CJK brackets: 〈〉《》「」『』【】
	{0x3014, 0x3020},   // more CJK brackets and marks: 〔〕〖〗〘〙〚〛〜〝〞〟
	{0x3030, 0x3031},   // wavy dash 〰
	{0x303D, 0x303E},   // part alternation mark 〽
	{0xFE00, 0xFE10},   // variation selectors
	{0xFE10, 0xFE70},   // vertical forms, CJK compatibility forms, small form variants
	{0xFF01, 0xFF10},   // fullwidth punctuation: ！–／
	{0xFF1A, 0xFF21},   // fullwidth punctuation: ：–＠
	{0xFF3B, 0xFF41},   // fullwidth punctuation: ［–｀
	{0xFF5B, 0xFF66},   // fullwidth and halfwidth punctuation: ｛–･
	{0x1F000, 0x1FB00}, // emoji
	{0xE0000, 0xE1000}, // tags and variation selectors supplement
}

// dropChars holds punctuation outside the ranges above: ×, ÷, and the
// katakana middle dot ・, which sits inside the katakana letter block.
var dropChars = "×÷・"

// inDrop reports whether r is a non-ASCII punctuation or symbol to drop.
func inDrop(r rune) bool {
	if strings.ContainsRune(dropChars, r) {
		return true
	}
	for _, d := range dropRanges {
		if d.lo <= r && r < d.hi {
			return true
		}
	}
	return false
}

// permalink is the "#" link appended to a heading anchored at id. It stays
// visible so the anchor can be copied on a phone, where nothing hovers.
// Its glyph is raw markup: navigation chrome is not part of the text a
// PlainRenderer dumps.
func permalink(id string) pe.Node {
	return el.El(el.A,
		el.Attr(el.Class, "heading-permalink"),
		el.Attr(el.Href, "#"+id),
		el.Attr(el.AttrName("aria-label"), "permalink"),
		el.Raw(" #"))
}
