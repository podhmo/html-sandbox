#!/bin/sh
# Copy dated Markdown files and bundles; an empty collection is valid.
# Also pack the collection's addition order as files/.order, the way
# content.sh does for the Worker (see tools/article-order.sh); without
# git the file is left out and the loaders fall back to slug order.
set -eu
find files -mindepth 1 -maxdepth 1 ! -name .gitignore -exec rm -rf {} +
cp -R ../../../../slops/*.md files/
if sh ../../../../tools/article-order.sh ../../../../slops >files/.order && [ -s files/.order ]; then
  :
else
  rm -f files/.order
fi
