#!/bin/sh
# Copy dated Markdown files and bundles; an empty collection is valid.
# Also pack the collection's addition order as files/.order, the way
# content.sh does for the Worker (see tools/article-order.sh); without
# git the file is left out and the loaders fall back to slug order.
set -eu
find files -mindepth 1 -maxdepth 1 ! -name .gitignore -exec rm -rf {} +
for file in ../../../../posts/*.md; do
  if [ -e "$file" ]; then cp -R "$file" files/; fi
done
if sh ../../../../tools/article-order.sh ../../../../posts >files/.order && [ -s files/.order ]; then
  :
else
  rm -f files/.order
fi
