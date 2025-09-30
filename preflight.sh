#!/usr/bin/env bash

# Preflight CLI wrapper script
# This script runs the bundled CLI tool

if [ ! -f dist/bin/preflight.js ]; then
    echo "❌ CLI not built. Run: bash build-cli.sh"
    exit 1
fi

# Find node executable (supports various environments)
NODE_BIN=$(command -v node 2>/dev/null || command -v nodejs 2>/dev/null || echo "")

if [ -z "$NODE_BIN" ]; then
    # Try common Replit/Nix paths
    for path in /nix/store/*/bin/node ~/.nix-profile/bin/node; do
        if [ -x "$path" ]; then
            NODE_BIN="$path"
            break
        fi
    done
fi

if [ -z "$NODE_BIN" ]; then
    echo "❌ Node.js not found. Please ensure Node.js is installed."
    exit 1
fi

"$NODE_BIN" dist/bin/preflight.js "$@"
