// Command slops-fmt normalizes tinymarkdown source the way gofmt
// normalizes Go: pass a file through it and common AI artifacts are fixed
// instead of flagged.
//
//   - "*" emphasis — "**bold**", "*em*", "***both***" — loses its markers;
//     tinymarkdown has no emphasis, so the asterisks would render
//     literally. A "* " list marker, a "*" inside a `code span` or a
//     fenced code block, an escaped "\*", and a "*" that cannot be an
//     emphasis delimiter under CommonMark's flanking rules ("fig-*.ts",
//     "a * b") are left alone.
//   - An unlabeled ``` fence whose body's first non-blank line starts
//     with "<svg" gains the "svg" label, so the block renders as an
//     image. An intentionally unlabeled example keeps its label off when
//     the body starts with another line, such as a comment.
//
// With no arguments slops-fmt reads stdin and writes to stdout. With file
// or directory arguments — a directory is walked for *.md files — each
// file that would change is listed and the exit status is 1; -w rewrites
// the files in place.
//
//	go run . < draft.md
//	go run . -w ../../slops
package main

import (
	"flag"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"unicode"
	"unicode/utf8"
)

func main() {
	flag.Usage = func() {
		fmt.Fprintln(flag.CommandLine.Output(), "usage: slops-fmt [-w] [file or directory ...]")
		flag.PrintDefaults()
	}
	write := flag.Bool("w", false, "rewrite files in place")
	flag.Parse()

	if flag.NArg() == 0 {
		src, err := io.ReadAll(os.Stdin)
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		fmt.Print(Normalize(string(src)))
		return
	}

	var changed []string
	for _, arg := range flag.Args() {
		files, err := collect(arg)
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		for _, f := range files {
			src, err := os.ReadFile(f)
			if err != nil {
				fmt.Fprintln(os.Stderr, err)
				os.Exit(1)
			}
			out := Normalize(string(src))
			if out == string(src) {
				continue
			}
			changed = append(changed, f)
			if *write {
				if err := os.WriteFile(f, []byte(out), 0o644); err != nil {
					fmt.Fprintln(os.Stderr, err)
					os.Exit(1)
				}
			}
		}
	}
	for _, f := range changed {
		fmt.Println(f)
	}
	switch {
	case len(changed) == 0:
		fmt.Println("ok")
	case !*write:
		fmt.Printf("%d file(s) would change; run with -w to fix\n", len(changed))
		os.Exit(1)
	default:
		fmt.Printf("%d file(s) rewritten\n", len(changed))
	}
}

// collect expands arg into the *.md files it covers: arg itself when it is
// a file, or every *.md under it when it is a directory. Hidden
// directories are skipped.
func collect(arg string) ([]string, error) {
	info, err := os.Stat(arg)
	if err != nil {
		return nil, err
	}
	if !info.IsDir() {
		return []string{arg}, nil
	}
	var out []string
	err = filepath.WalkDir(arg, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			if path != arg && strings.HasPrefix(d.Name(), ".") {
				return filepath.SkipDir
			}
			return nil
		}
		if strings.HasSuffix(path, ".md") {
			out = append(out, path)
		}
		return nil
	})
	return out, err
}

// Normalize applies the fixes described above to src and returns the
// result. It is idempotent.
func Normalize(src string) string {
	lines := strings.Split(src, "\n")

	// code[i] marks the lines of a fenced code block, fences included.
	code := make([]bool, len(lines))
	inCode := false
	for i, l := range lines {
		t := strings.TrimSpace(l)
		if inCode {
			code[i] = true
			if t == fence {
				inCode = false
			}
			continue
		}
		if strings.HasPrefix(t, fence) {
			code[i] = true
			inCode = true
			if info := strings.TrimSpace(t[len(fence):]); info == "" && startsSVG(lines[i+1:]) {
				indent := l[:len(l)-len(strings.TrimLeft(l, " \t"))]
				lines[i] = indent + fence + "svg"
			}
		}
	}

	for i := 0; i < len(lines); {
		if code[i] || strings.TrimSpace(lines[i]) == "" {
			i++
			continue
		}
		j := i
		for j < len(lines) && !code[j] && strings.TrimSpace(lines[j]) != "" {
			j++
		}
		seg := stripEmphasis(strings.Join(lines[i:j], "\n"))
		copy(lines[i:j], strings.Split(seg, "\n"))
		i = j
	}
	return strings.Join(lines, "\n")
}

const fence = "```"

// startsSVG reports whether the first non-blank line of a fence's body —
// which runs until the closing fence or the end of the input — starts
// with "<svg".
func startsSVG(body []string) bool {
	for _, l := range body {
		t := strings.TrimSpace(l)
		if t == fence {
			return false
		}
		if t == "" {
			continue
		}
		return strings.HasPrefix(strings.TrimLeft(l, " \t"), "<svg")
	}
	return false
}

// stripEmphasis removes the asterisks of "*" emphasis pairs from seg, a
// run of consecutive non-blank text lines. The pairing follows
// CommonMark's flanking rules, with "*" runs matched by length: "**bold**"
// loses two asterisks per side, "*em*" one. Delimiters inside code spans
// are not seen.
func stripEmphasis(seg string) string {
	if !strings.Contains(seg, "*") {
		return seg
	}

	// vis is seg with every code span folded into a single placeholder
	// byte; orig maps a position in vis back to the range it covers in
	// seg. Emphasis is paired on vis, so a delimiter may wrap a code span
	// but can never live inside one.
	var vis []byte
	var orig [][2]int
	for i := 0; i < len(seg); {
		if seg[i] == '`' {
			n := runLen(seg, i, '`')
			if end := closingRun(seg, i+n, n); end >= 0 {
				vis = append(vis, 'x')
				orig = append(orig, [2]int{i, end + n})
				i = end + n
				continue
			}
		}
		vis = append(vis, seg[i])
		orig = append(orig, [2]int{i, i + 1})
		i++
	}

	del := map[int]bool{} // positions in vis to drop
	var stack []run       // "*" runs that opened and still wait for a match
	for i := 0; i < len(vis); {
		if vis[i] != '*' {
			i++
			continue
		}
		n := runLen(vis, i, '*')
		j := i + n
		// "\*" is an escaped asterisk, never a delimiter.
		if i > 0 && vis[i-1] == '\\' {
			i = j
			continue
		}
		prev, next := flank(vis, i, j)
		// A "*" sandwiched between punctuation, as in "fig-*.ts", is a
		// literal: CommonMark would let it open and close, but inside a
		// symbol cluster it is never meant as emphasis.
		if isPunct(prev) && isPunct(next) {
			i = j
			continue
		}
		canOpen := !isSpace(next) && (!isPunct(next) || isSpace(prev) || isPunct(prev))
		canClose := !isSpace(prev) && (!isPunct(prev) || isSpace(next) || isPunct(next))
		i = j
		if canClose {
			// Match the nearest opener of the same length.
			k := len(stack) - 1
			for ; k >= 0 && stack[k].n != n; k-- {
			}
			if k >= 0 {
				for d := 0; d < n; d++ {
					del[stack[k].pos+d] = true
					del[i-n+d] = true
				}
				stack = append(stack[:k], stack[k+1:]...)
				continue
			}
		}
		if canOpen {
			stack = append(stack, run{pos: i - n, n: n})
		}
	}
	if len(del) == 0 {
		return seg
	}
	var b strings.Builder
	b.Grow(len(seg))
	for i := 0; i < len(vis); i++ {
		if !del[i] {
			b.WriteString(seg[orig[i][0]:orig[i][1]])
		}
	}
	return b.String()
}

// flank returns the runes around the vis run [from, to): the last rune
// before and the first after, 0 at the string's ends.
func flank(vis []byte, from, to int) (prev, next rune) {
	if from > 0 {
		prev, _ = utf8.DecodeLastRune(vis[:from])
	}
	if to < len(vis) {
		next, _ = utf8.DecodeRune(vis[to:])
	}
	return prev, next
}

// run is a "*" run held while it waits for a matching closer: its
// position in vis and its length.
type run struct {
	pos, n int
}

// runLen returns the length of the run of c starting at s[i].
func runLen[S ~string | ~[]byte](s S, i int, c byte) int {
	j := i
	for j < len(s) && s[j] == c {
		j++
	}
	return j - i
}

// closingRun returns the index of the first run of exactly n backquotes
// in s[from:], or -1 — the same rule tinymarkdown's Inlines uses.
func closingRun(s string, from, n int) int {
	for j := from; j < len(s); {
		if s[j] != '`' {
			j++
			continue
		}
		m := runLen(s, j, '`')
		if m == n {
			return j
		}
		j += m
	}
	return -1
}

func isSpace(r rune) bool { return r == 0 || unicode.IsSpace(r) }
func isPunct(r rune) bool { return unicode.IsPunct(r) }
