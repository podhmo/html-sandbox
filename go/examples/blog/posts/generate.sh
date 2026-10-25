#!/bin/sh
# Copy dated Markdown files and bundles; an empty collection is valid.
set -eu
find files -mindepth 1 -maxdepth 1 ! -name .gitignore -exec rm -rf {} +
for file in ../../../../posts/*.md; do
  if [ -e "$file" ]; then cp -R "$file" files/; fi
done
