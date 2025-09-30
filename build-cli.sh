#!/bin/bash

# Build the CLI tool for production use
echo "🔨 Building CLI tool..."

node_modules/.bin/esbuild bin/preflight.ts --bundle --platform=node --format=esm --outfile=dist/bin/preflight.js --packages=external

if [ -f dist/bin/preflight.js ]; then
    echo "✅ CLI built successfully: dist/bin/preflight.js"
    chmod +x dist/bin/preflight.js
    echo "✅ Made executable"
else
    echo "❌ Build failed"
    exit 1
fi
