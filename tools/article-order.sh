#!/bin/sh
# article-order.sh prints the names of the articles of the collection
# directory DIR — every *.md file and *.md directory directly under it —
# one per line, the most recently added first, as "git log" says they
# entered the repository. A file's time is the author date of the commit
# that added it; a bundle directory takes the earliest add of its
# members. One git call answers for every file. Times compare as
# seconds: offset-laden date strings do not sort chronologically across
# timezones.
#
#   sh tools/article-order.sh DIR
#
# The blog's pack steps (go generate, examples/blog/scripts/content.sh,
# examples/blog/scripts/embed.sh) run this to carry the order into the
# packed content as a ".order" file, so same-day articles list in
# addition order rather than slug order. When git cannot say the order —
# no git binary, not a repository, or a checkout without the history —
# nothing is printed and the loaders fall back to slug order. The Go
# twin of this script is go/pkg/gitorder.
set -eu

if [ $# -ne 1 ]; then
  echo "usage: article-order.sh DIR" >&2
  exit 1
fi
dir=${1%/}

LC_ALL=C
export LC_ALL

if ! git -C "$dir" rev-parse --git-dir >/dev/null 2>&1; then
  exit 0
fi

# git log walks the commits that added files under the directory, newest
# first; each block is a "@<author time in seconds>" line and the added
# paths, relative to the directory. The last write to added[] is the
# first commit to touch the entry.
if ! log=$(git -C "$dir" log --diff-filter=A --format='@%at' --name-only --relative -- .); then
  echo "article-order.sh: $dir: git log failed" >&2
  exit 0
fi
printf '%s\n' "$log" |
  awk '
    /^@/ { ts = substr($0, 2); next }
    NF {
      slash = index($0, "/")
      entry = slash ? substr($0, 1, slash - 1) : $0
      added[entry] = ts
    }
    END {
      for (entry in added) printf "%s\t%s\n", added[entry], entry
    }' |
  sort -k 1,1nr -k 2,2 |
  cut -f 2-
