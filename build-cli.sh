#!/usr/bin/env bash

# Build the CLI tool for production use
echo "🔨 Building CLI tool..."

# Use local esbuild installation
if [ -x "node_modules/.bin/esbuild" ]; then
    node_modules/.bin/esbuild bin/preflight.ts --bundle --platform=node --format=esm --outfile=dist/bin/preflight.js --packages=external
elif command -v npx &> /dev/null; then
    npx esbuild bin/preflight.ts --bundle --platform=node --format=esm --outfile=dist/bin/preflight.js --packages=external
else
    echo "❌ esbuild not found. Please run: npm install"
    exit 1
fi

if [ -f dist/bin/preflight.js ]; then
    echo "✅ CLI built successfully: dist/bin/preflight.js"
    chmod +x dist/bin/preflight.js
    echo "✅ Made executable"
else
    echo "❌ Build failed"
    exit 1
fi
