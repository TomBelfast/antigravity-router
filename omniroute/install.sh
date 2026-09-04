#!/usr/bin/env bash
#
# OmniRoute — install as a parallel AI gateway alongside antigravity-router.
#
# Installs (idempotent):
#   - nvm + Node.js 24 (OmniRoute requires Node >=22.22.2 / >=24; the system
#     Node 20 is left untouched)
#   - the published `omniroute` npm package, globally, with native build
#     scripts allow-listed (better-sqlite3, sharp, esbuild, @swc/core, ...)
#
# After install:
#   omniroute                      # start in foreground
#   ./omniroute/service.sh install # or run it as a systemd service
#
# Dashboard: http://localhost:20128        API: http://localhost:20128/v1
# Data dir:  ~/.omniroute  (storage.sqlite + auto-generated encryption keys)

set -euo pipefail

NODE_MAJOR=24
NVM_VERSION=v0.40.1

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  echo "==> Installing nvm $NVM_VERSION"
  curl -fsSL "https://raw.githubusercontent.com/nvm-sh/nvm/$NVM_VERSION/install.sh" | bash
fi

# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh"

if ! nvm ls "$NODE_MAJOR" >/dev/null 2>&1; then
  echo "==> Installing Node $NODE_MAJOR"
  nvm install "$NODE_MAJOR"
fi
nvm alias default "$NODE_MAJOR" >/dev/null
nvm use default >/dev/null

echo "==> Node $(node -v) / npm $(npm -v)"

# npm 11 blocks lifecycle scripts by default; OmniRoute needs native builds.
ALLOW_SCRIPTS=omniroute,keytar,onnxruntime-node,tls-client-node,sharp,@parcel/watcher,@swc/core,protobufjs,koffi,esbuild,better-sqlite3

echo "==> Installing omniroute (global)"
npm install -g omniroute --allow-scripts="$ALLOW_SCRIPTS"

echo
echo "==> Done. omniroute $(omniroute --version)"
echo "    Start:   omniroute"
echo "    Service: sudo ./omniroute/service.sh install"
