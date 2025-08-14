# 📦 Publishing Guide

This guide explains how to publish the notes-sync packages to npm.

## 📋 Package Structure

The project consists of three npm packages:

1. **`@notes-sync/shared`** - Shared types and utilities
2. **`@notes-sync/service`** - Background service for note synchronization
3. **`@notes-sync/cli`** - Command-line interface

## 🚀 Publishing Process

### Prerequisites

1. **NPM Account**: Make sure you're logged in to npm

   ```bash
   npm login
   npm whoami
   ```

2. **Build All Packages**: Ensure all packages are built
   ```bash
   yarn build
   ```

### Publishing Commands

#### Option 1: Use the Publish Script (Recommended)

```bash
./scripts/publish.sh
```

#### Option 2: Publish Manually

```bash
# 1. Publish shared package first (dependency)
cd packages/shared
npm publish --access public

# 2. Publish service package
cd ../service
npm publish --access public

# 3. Publish CLI package last
cd ../cli
npm publish --access public
```

## 📦 Package Details

### @notes-sync/shared

- **Purpose**: Shared TypeScript types and interfaces
- **Dependencies**: None
- **Publish Order**: First (dependency for other packages)

### @notes-sync/service

- **Purpose**: Background service for note synchronization
- **Dependencies**: `@notes-sync/shared`
- **Publish Order**: Second
- **Default Port**: 3127

### @notes-sync/cli

- **Purpose**: Command-line interface
- **Dependencies**: `@notes-sync/shared`
- **Publish Order**: Last
- **Global Installation**: Yes (has `bin` field)

## 🔧 Service Discovery

The CLI automatically discovers the service using this logic:

1. **Read Service Config**: Look for config at `~/.config/notes-sync/config.json`
2. **Default Connection**: Try `localhost:3127` if no config found
3. **Check Installation**: Verify `@notes-sync/service` is installed globally
4. **User Prompts**: Guide user to install/start service if needed

## 📝 Version Management

### Updating Versions

```bash
# Update all packages to same version
yarn version 1.0.1

# Or update individually
cd packages/shared && npm version patch
cd packages/service && npm version patch
cd packages/cli && npm version patch
```

### Version Dependencies

- CLI and Service depend on Shared: `^1.0.0`
- When Shared updates, CLI and Service should update their dependency

## 🎯 Installation Instructions for Users

After publishing, users can install:

```bash
# Install CLI globally
npm install -g @notes-sync/cli

# Install service globally (optional, CLI will prompt if needed)
npm install -g @notes-sync/service

# Use CLI
notes-sync status
```

## 🔍 Troubleshooting

### Common Issues

1. **Package Already Exists**: Increment version numbers
2. **Build Errors**: Run `yarn build` first
3. **Permission Errors**: Check npm login status
4. **Dependency Issues**: Ensure shared package is published first

### Verification

```bash
# Check published packages
npm view @notes-sync/shared
npm view @notes-sync/service
npm view @notes-sync/cli

# Test installation
npm install -g @notes-sync/cli
notes-sync --help
```

## 📋 Pre-Publishing Checklist

- [ ] All packages build successfully (`yarn build`)
- [ ] Version numbers are updated
- [ ] Dependencies are correct
- [ ] README files are updated
- [ ] NPM login is active
- [ ] No sensitive data in packages
- [ ] All tests pass (if applicable)

## 🎉 Post-Publishing

After successful publishing:

1. **Update Documentation**: Update any installation guides
2. **Test Installation**: Verify packages install correctly
3. **Monitor**: Check for any user issues
4. **Version Tags**: Consider creating git tags for releases
