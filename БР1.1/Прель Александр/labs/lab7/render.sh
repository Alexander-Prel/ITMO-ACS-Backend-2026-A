#!/usr/bin/env bash
# Resolve image digests generated for this exact revision by the build workflow.
set -euo pipefail
cd "$(dirname "$0")"
images=${1:?Path to images.json}
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
cp ./*.yaml "$tmp/"
python3 - "$images" "$tmp/kustomization.yaml" <<'PY'
import json,re,sys
from pathlib import Path
images=json.loads(Path(sys.argv[1]).read_text())
names=['accounts','catalog','bookings','notifications','gateway']
if set(names)!=set(images): raise SystemExit('Expected exactly five service images')
with Path(sys.argv[2]).open('a') as f:
    print('images:',file=f)
    for name in names:
        value=images[name]
        if not isinstance(value,str) or not re.fullmatch(r'[a-z0-9.:/_-]+@sha256:[0-9a-f]{64}',value):
            raise SystemExit('Invalid immutable image for '+name)
        repo,digest=value.split('@')
        print(f'  - name: booking-{name}\n    newName: {repo}\n    digest: {digest}',file=f)
PY
kubectl kustomize "$tmp"
