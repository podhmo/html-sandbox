#!/bin/sh
# content.sh writes OUT, the Static Assets directory the MoonBit blog's
# Worker reads (examples/blog/cloudflare/build/content): the posts and the
# repository's documents, and files.txt, the list of them.
#
#   sh examples/blog/scripts/content.sh OUT POSTS_DIR SLOPS_DIR REPO_DIR [PATH...]
#
# The files go to OUT/posts/<name> (POSTS_DIR is the repository's posts/
# directory), OUT/slops/<name> (SLOPS_DIR), and OUT/docs/<path in the
# repository> (REPO_DIR is the
# repository root, and PATHs are what the repodocs embed, as embed.sh
# takes them). OUT/files.txt lists the paths under OUT, sorted, so the
# Worker can fetch every file: Static Assets has no API to list them.
#
# `make build` runs it before the Wasm is built, and wrangler uploads OUT
# with the Worker. Static Assets has no way to change them without a
# deploy, so files.txt is not committed; the build makes it anew.
#
# A file is copied beside OUT and renamed into place, and files.txt is
# written last, so a request while content.sh runs sees the old file or
# the new one, never a half-written one. A file the build no longer has
# stays in OUT but leaves files.txt, so the Worker does not read it: the
# build does not delete files, as `wrangler dev` can start another build
# while this one runs.
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

names=$out.names.$$
doc_names=$names.docs
tmp=$out.tmp.$$
trap 'rm -f "$names" "$names.posts" "$names.slops" "$doc_names"; rm -rf "$tmp"' EXIT

sh "$script/list-files.sh" "$repo" "$@" >"$doc_names"
: >"$names"
for collection in posts slops; do
  case "$collection" in posts) src=$posts ;; slops) src=$slops ;; esac
  sh "$script/list-files.sh" "$src" >"$names.$collection"
  while IFS= read -r name; do
    mkdir -p "$tmp/$collection/$(dirname "$name")" "$out/$collection/$(dirname "$name")"
    cp "$src/$name" "$tmp/$collection/$name"
    mv "$tmp/$collection/$name" "$out/$collection/$name"
    printf '%s/%s\n' "$collection" "$name" >>"$names"
  done <"$names.$collection"
done

while IFS= read -r name; do
  mkdir -p "$tmp/docs/$(dirname "$name")" "$out/docs/$(dirname "$name")"
  cp "$repo/$name" "$tmp/docs/$name"
  mv "$tmp/docs/$name" "$out/docs/$name"
  printf 'docs/%s\n' "$name" >>"$names"
done <"$doc_names"

sort -u -o "$names" "$names"
mv "$names" "$out/files.txt"
