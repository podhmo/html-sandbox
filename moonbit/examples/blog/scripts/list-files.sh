#!/bin/sh
# list-files.sh prints the names of the blog's content files under BASE,
# relative to BASE, one per line.
#
#   sh examples/blog/scripts/list-files.sh BASE [PATH...]
#
# With no PATH, it takes every *.md file directly in BASE, or every file of
# a directory named *.md directly in BASE (a bundle, given as dir/name).
# Each PATH is a file, or a directory whose files are all taken,
# subdirectories included, as long as they are *.md files, live under a
# *.md directory, or are metadata files named *.metadata.json (which may
# be absent); a PATH may be given relative to BASE or with BASE in front,
# and names are relative to BASE.
#
# Both embed.sh, which writes the files into MoonBit sources, and
# content.sh, which packs them into the Static Assets file, take the
# same files this way.
set -eu

base=${1#./}
shift

LC_ALL=C
export LC_ALL

if [ ! -d "$base" ]; then
  echo "list-files.sh: $base: no such directory" >&2
  exit 1
fi

if [ $# -eq 0 ]; then
  for f in "$base"/*.md; do
    if [ -f "$f" ]; then
      echo "${f##*/}"
    elif [ -d "$f" ]; then
      find "$f" -type f | sed "s|^$base/||"
    fi
  done
  exit 0
fi

for p; do
  p=${p#./}
  p=${p#"$base"/}
  if [ -d "$base/$p" ]; then
    find "$base/$p" -type f \( -name '*.md' -o -path '*.md/*' -o -name '*.metadata.json' \) | sed "s|^$base/||"
  elif [ -f "$base/$p" ]; then
    echo "$p"
  else
    echo "list-files.sh: $base/$p: no such file or directory" >&2
    exit 1
  fi
done
