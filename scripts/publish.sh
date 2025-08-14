#!/bin/bash

# Publish script for notes-sync packages

set -e

echo "🚀 Publishing notes-sync packages..."

# Build all packages first
echo "📦 Building packages..."
yarn build

# Publish shared package first (dependency)
echo "📦 Publishing @notes-sync/shared..."
cd packages/shared
npm publish --access public
cd ../..

# Publish service package
echo "📦 Publishing @notes-sync/service..."
cd packages/service
npm publish --access public
cd ../..

# Publish CLI package last
echo "📦 Publishing @notes-sync/cli..."
cd packages/cli
npm publish --access public
cd ../..

echo "✅ All packages published successfully!"
echo ""
echo "📋 Published packages:"
echo "  - @notes-sync/shared@$(node -p "require('./packages/shared/package.json').version")"
echo "  - @notes-sync/service@$(node -p "require('./packages/service/package.json').version")"
echo "  - @notes-sync/cli@$(node -p "require('./packages/cli/package.json').version")"
echo ""
echo "🎉 Installation instructions:"
echo "  npm install -g @notes-sync/cli"
echo "  npm install -g @notes-sync/service"
