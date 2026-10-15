#!/usr/bin/env bash
# Build dist/echo-loop-web.zip: the playable game only (index.html, lib/ and src/).
# No build step is required to run the game -- this just bundles the static files
# for handing to someone or uploading somewhere.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

out="dist/echo-loop-web.zip"
mkdir -p dist
rm -f "$out"

# Find a python interpreter for the no-zip fallback.
PY=""
for c in python3 python py; do
  if command -v "$c" >/dev/null 2>&1; then PY="$c"; break; fi
done

if command -v zip >/dev/null 2>&1; then
  zip -r -q "$out" index.html lib src
elif [ -n "$PY" ]; then
  "$PY" - "$out" <<'PY'
import os, sys, zipfile
out = sys.argv[1]
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    z.write("index.html", "index.html")
    for base in ("lib", "src"):
        for dirpath, _dirs, files in os.walk(base):
            for name in files:
                p = os.path.join(dirpath, name)
                z.write(p, p)
PY
else
  echo "error: neither 'zip' nor python is available" >&2
  exit 1
fi

echo "Built $out:"
if [ -n "$PY" ]; then
  "$PY" - "$out" <<'PY'
import sys, zipfile
print("\n".join(sorted(zipfile.ZipFile(sys.argv[1]).namelist())))
PY
fi
