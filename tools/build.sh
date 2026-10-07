#!/usr/bin/env bash
# Rebuild the trip data and the single-file pages: plan JSON -> site/data.js -> dist/*.html
set -euo pipefail
cd "$(dirname "$0")/../scratchpad/plan"
node build-guide.mjs
node build-classic.mjs
node build-foliage.mjs > /dev/null
node build-grandloop.mjs
node build-island.mjs
node validate.mjs
node build-data.mjs
cd ../..
node tools/bundle.mjs
