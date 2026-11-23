#!/bin/sh
# vendor.sh -- install podhmo/svg-gen into the local mooncakes-style
# registry so the examples/*.mbtx scripts can import it. .mbtx
# resolves imports only through the registry index (no local paths,
# no moon.work), so development vendors `moon package`'s zip into
# ~/.moon/registry. Once the module is published to mooncakes this
# step becomes unnecessary — the same `import { "podhmo/svg-gen" }`
# keeps working unchanged.
set -eu
cd "$(dirname "$0")"

MODULE=podhmo/svg-gen
VER=$(sed -n 's/^version = "\(.*\)"/\1/p' moon.mod)
ZIP="_build/publish/podhmo-svg-gen-$VER.zip"
REG="${MOON_HOME:-$HOME/.moon}/registry"
IDX="$REG/index/user/podhmo/svg-gen.index"
DST="$REG/cache/$MODULE/$VER.zip"

moon package
# sha256sum is GNU; macOS ships shasum instead. Fail loudly if neither
# is around — an empty checksum would vendor a package moon then
# rejects at import time.
if command -v sha256sum >/dev/null 2>&1; then
  SHA=$(sha256sum "$ZIP" | cut -d' ' -f1)
elif command -v shasum >/dev/null 2>&1; then
  SHA=$(shasum -a 256 "$ZIP" | cut -d' ' -f1)
else
  echo "vendor.sh: need sha256sum or shasum to checksum $ZIP" >&2
  exit 1
fi
OLD=$(sed -n 's/.*"checksum": "\([0-9a-f]*\)".*/\1/p' "$IDX" 2>/dev/null || true)

mkdir -p "$(dirname "$IDX")" "$(dirname "$DST")"
cp "$ZIP" "$DST"
printf '{"name": "%s", "version": "%s", "checksum": "%s"}\n' \
  "$MODULE" "$VER" "$SHA" > "$IDX"

# a changed checksum makes `moon run` fail on its cached dep graph
if [ -n "$OLD" ] && [ "$SHA" != "$OLD" ]; then
  moon clean --dep-cache
fi
