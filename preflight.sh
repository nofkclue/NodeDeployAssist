#!/bin/bash

# Preflight CLI wrapper script
# This script runs the bundled CLI tool

if [ ! -f dist/bin/preflight.js ]; then
    echo "❌ CLI not built. Run: bash build-cli.sh"
    exit 1
fi

node dist/bin/preflight.js "$@"
