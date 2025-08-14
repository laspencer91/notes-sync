#!/bin/bash

# Publish script for notes-sync packages

set -e

# Function to display usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --patch     Bump patch version (1.0.0 -> 1.0.1)"
    echo "  --minor     Bump minor version (1.0.0 -> 1.1.0)"
    echo "  --major     Bump major version (1.0.0 -> 2.0.0)"
    echo "  --version   Show current versions of all packages"
    echo "  --dry-run   Show what would be done without actually doing it"
    echo "  --help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Publish current versions"
    echo "  $0 --patch            # Bump patch version and publish"
    echo "  $0 --minor            # Bump minor version and publish"
    echo "  $0 --major            # Bump major version and publish"
    echo "  $0 --patch --dry-run  # Test version bumping without publishing"
    echo ""
}

# Function to get current version
get_version() {
    local package_path=$1
    node -p "require('$package_path/package.json').version"
}

# Function to bump version
bump_version() {
    local package_path=$1
    local bump_type=$2
    local current_version=$(get_version "$package_path")
    
    echo "📦 Bumping $package_path from $current_version..."
    
    # Use npm version to bump the version
    cd "$package_path"
    npm version "$bump_type" --no-git-tag-version
    cd - > /dev/null
    
    local new_version=$(get_version "$package_path")
    echo "✅ Bumped to $new_version"
}

# Function to update yarn lockfile
update_lockfile() {
    echo "🔄 Updating yarn lockfile..."
    yarn install --silent
    echo "✅ Lockfile updated"
}

# Function to show current versions
show_versions() {
    echo "📋 Current package versions:"
    echo "  - @notes-sync/shared@$(get_version './packages/shared')"
    echo "  - @notes-sync/service@$(get_version './packages/service')"
    echo "  - @notes-sync/cli@$(get_version './packages/cli')"
    echo ""
}

# Parse command line arguments
BUMP_TYPE=""
SHOW_VERSIONS=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --patch)
            BUMP_TYPE="patch"
            shift
            ;;
        --minor)
            BUMP_TYPE="minor"
            shift
            ;;
        --major)
            BUMP_TYPE="major"
            shift
            ;;
        --version)
            SHOW_VERSIONS=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help|-h)
            show_usage
            exit 0
            ;;
        *)
            echo "❌ Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Show versions if requested
if [ "$SHOW_VERSIONS" = true ]; then
    show_versions
    exit 0
fi

# Bump versions if requested
if [ -n "$BUMP_TYPE" ]; then
    echo "🚀 Bumping versions ($BUMP_TYPE) for all packages..."
    echo ""
    
    # Bump versions in dependency order
    bump_version "./packages/shared" "$BUMP_TYPE"
    bump_version "./packages/service" "$BUMP_TYPE"
    bump_version "./packages/cli" "$BUMP_TYPE"
    
    # Update yarn lockfile to sync with new versions
    update_lockfile
    
    echo ""
    echo "📋 New versions:"
    show_versions
    echo ""
fi

if [ "$DRY_RUN" = true ]; then
    echo "🔍 DRY RUN MODE - No actual publishing will occur"
    echo ""
    echo "📦 Would build packages..."
    echo "📦 Would publish @notes-sync/shared..."
    echo "📦 Would publish @notes-sync/service..."
    echo "📦 Would publish @notes-sync/cli..."
    echo ""
    echo "📋 Would publish packages:"
    show_versions
    echo "✅ Dry run completed successfully!"
    exit 0
fi

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
show_versions
echo "🎉 Installation instructions:"
echo "  npm install -g @notes-sync/cli"
echo "  npm install -g @notes-sync/service"
echo ""
echo "💡 To upgrade existing installations:"
echo "  notes-sync upgrade"
