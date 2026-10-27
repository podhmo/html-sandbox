#!/bin/sh
# content.sh writes OUT/content.bin, the one Static Assets file the MoonBit
# blog's Worker reads (OUT is examples/blog/cloudflare/build/content): the
# posts and the repository's documents, packed into one file.
#
#   sh examples/blog/scripts/content.sh OUT POSTS_DIR SLOPS_DIR REPO_DIR [PATH...]
#
# The files are named posts/<name> (POSTS_DIR is the repository's posts/
# directory), slops/<name> (SLOPS_DIR), and docs/<path in the repository>
# (REPO_DIR is the repository root, and PATHs are what the repodocs embed,
# as embed.sh takes them), and packed in the order of their names.
#
# content.bin is, for each file, a header line "<size> <name>\n" followed
# by the file's <size> bytes, with nothing between one file and the next.
# The Worker gets every file with one fetch through the ASSETS binding,
# however many posts there are. It used to fetch each file on its own, and
# each fetch counts as a subrequest, which the Workers Free plan caps at 50
# per invocation: the site failed with "Too many subrequests" once there
# were more than 49 files (see docs/sketch/ja/moonbit-static-assets.md).
# A Static Assets file may be at most 25 MiB.
#
# `make build` runs it before the Wasm is built, and wrangler uploads OUT
# with the Worker. Static Assets has no way to change it without a deploy,
# so content.bin is not committed; the build makes it anew. It is written
# beside OUT and renamed into place, so a request while content.sh runs
# (`wrangler dev` can start another build while one runs) sees the old
# file or the new one, never a half-written one.
set -eu

out=$1
posts=${2#./}
slops=${3#./}
repo=${4#./}
shift 4
script=$(dirname "$0")

LC_ALL=C
export LC_ALL

if [ ! -d "$repo" ]; then
  echo "content.sh: $repo: no such directory" >&2
  exit 1
fi
# Make OUT's parent before the temporary files go beside OUT.
mkdir -p "$out"

# Each line of names is "<name in content.bin><tab><path to read>".
names=$out.names.$$
tmp=$out.bin.$$
trap 'rm -f "$names" "$names.unsorted" "$tmp"' EXIT

{
  sh "$script/list-files.sh" "$posts" | sed "s|.*|posts/&	$posts/&|"
  sh "$script/list-files.sh" "$slops" | sed "s|.*|slops/&	$slops/&|"
  sh "$script/list-files.sh" "$repo" "$@" | sed "s|.*|docs/&	$repo/&|"
} >"$names.unsorted"
sort -u -t '	' -k 1,1 "$names.unsorted" >"$names"

: >"$tmp"
while IFS='	' read -r name path; do
  size=$(wc -c <"$path" | tr -d ' ')
  printf '%s %s\n' "$size" "$name" >>"$tmp"
  cat "$path" >>"$tmp"
done <"$names"
mv "$tmp" "$out/content.bin"
