#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
node -e 'if(Number(process.versions.node.split(".")[0])!==24){console.error("Please use Node.js 24 LTS.");process.exit(1)}'
if [ ! -d node_modules ]; then npm ci; fi
VITE_DATA_MODE=demo npm run dev
