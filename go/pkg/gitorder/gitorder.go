// Package gitorder derives the article order of a collection directory —
// posts/ or slops/ — from the repository's history: every *.md file or
// *.md directory directly under it, in the order git added it, the most
// recently added first. The blog lists same-day articles by this order
// (it packs the result as a ".order" file), and tools/slops-nav builds
// its chain by it. Without git — no binary, not a repository, no
// history — it returns nothing and callers fall back to name order.
// tools/article-order.sh is the shell twin of this package for the pack
// scripts.
package gitorder

import (
	"bufio"
	"bytes"
	"cmp"
	"os/exec"
	"slices"
	"strings"
	"time"
)

// Names returns the names of dir's articles in addition order, the most
// recently added first; it is nil when git cannot say the order.
func Names(dir string) []string {
	added := addedAt(dir)
	if added == nil {
		return nil
	}
	names := make([]string, 0, len(added))
	for name := range added {
		names = append(names, name)
	}
	slices.SortFunc(names, func(a, b string) int {
		return cmp.Or(added[b].Compare(added[a]), strings.Compare(a, b))
	})
	return names
}

// OrderFile returns the ".order" file's content for dir: the names of
// Names joined by newlines, or nil without git.
func OrderFile(dir string) []byte {
	names := Names(dir)
	if names == nil {
		return nil
	}
	return []byte(strings.Join(names, "\n") + "\n")
}

// addedAt maps each of dir's article entries to the author date of the
// commit that first added it. git log walks the commits newest first, so
// overwriting keeps the earliest add.
func addedAt(dir string) map[string]time.Time {
	if exec.Command("git", "-C", dir, "rev-parse", "--git-dir").Run() != nil {
		return nil
	}
	out, err := exec.Command("git", "-C", dir, "log",
		"--diff-filter=A", "--format=@%aI", "--name-only", "--relative", "--", ".").Output()
	if err != nil {
		return nil
	}
	added := map[string]time.Time{}
	var ts time.Time
	for s := bufio.NewScanner(bytes.NewReader(out)); s.Scan(); {
		line := s.Text()
		switch {
		case strings.HasPrefix(line, "@"):
			ts, _ = time.Parse(time.RFC3339, line[1:])
		case line != "":
			name, _, _ := strings.Cut(line, "/") // a bundle member counts as its directory
			added[name] = ts
		}
	}
	return added
}
