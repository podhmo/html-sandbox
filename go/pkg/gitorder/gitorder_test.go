package gitorder

import (
	"os"
	"os/exec"
	"path/filepath"
	"testing"
)

func TestNames(t *testing.T) {
	if _, err := exec.LookPath("git"); err != nil {
		t.Skip("git not installed")
	}
	dir := t.TempDir()
	coll := filepath.Join(dir, "slops")
	if err := os.MkdirAll(coll, 0o755); err != nil {
		t.Fatal(err)
	}
	write := func(name, body string) {
		t.Helper()
		if err := os.MkdirAll(filepath.Join(coll, filepath.Dir(name)), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filepath.Join(coll, name), []byte(body), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	commit := func(msg, date string) {
		t.Helper()
		run := func(args ...string) {
			t.Helper()
			cmd := exec.Command("git", args...)
			cmd.Dir = coll
			cmd.Env = append(os.Environ(),
				"GIT_AUTHOR_NAME=t", "GIT_AUTHOR_EMAIL=t@t",
				"GIT_COMMITTER_NAME=t", "GIT_COMMITTER_EMAIL=t@t",
				"GIT_AUTHOR_DATE="+date, "GIT_COMMITTER_DATE="+date)
			if out, err := cmd.CombinedOutput(); err != nil {
				t.Fatalf("git %v: %s", args, out)
			}
		}
		run("add", "-A")
		run("commit", "-q", "-m", msg)
	}

	run := func(args ...string) {
		t.Helper()
		cmd := exec.Command("git", args...)
		cmd.Dir = coll
		if out, err := cmd.CombinedOutput(); err != nil {
			t.Fatalf("git %v: %s", args, out)
		}
	}
	run("init", "-q")
	run("config", "commit.gpgsign", "false")
	write("2026-11-03-b.md", "# b\n")
	commit("b", "2026-11-03T10:00:00+09:00")
	write("2026-11-03-a.md", "# a\n")
	write("2026-11-03-c.md/README.md", "# c\n")
	write("2026-11-03-c.md/notes.md", "x\n")
	commit("a+c", "2026-11-03T11:00:00+09:00")
	write("2026-11-03-d.md", "# d\n")

	got := Names(coll)
	want := []string{"2026-11-03-a.md", "2026-11-03-c.md", "2026-11-03-b.md"}
	// a and c share a commit: same time, name order. d is uncommitted and
	// not listed. b was added first, so it comes last.
	if len(got) != len(want) {
		t.Fatalf("got %v, want %v", got, want)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("got %v, want %v", got, want)
		}
	}
}

func TestNamesWithoutGit(t *testing.T) {
	if got := Names(t.TempDir()); got != nil {
		t.Errorf("got %v, want nil outside a repository", got)
	}
}
