# 🛠️ Development Guide

This guide explains how to develop and test the notes-sync packages locally.

## 🏗️ **Project Structure**

```
notes-sync-mono/
├── packages/
│   ├── shared/     # Shared types and utilities
│   ├── service/    # Background service
│   └── cli/        # Command-line interface
├── scripts/        # Build and publish scripts
└── LICENSE         # MIT License
```

## 🚀 **Local Development Setup**

### **1. Install Dependencies**

```bash
yarn install
```

### **2. Build All Packages**

```bash
yarn build
```

### **3. Development Workflow**

#### **Start Service in Development Mode**

```bash
# From workspace root
yarn dev:service

# Or from service directory
cd packages/service
yarn dev
```

#### **Test CLI Commands**

```bash
# From workspace root
yarn dev:cli

# Or from CLI directory
cd packages/cli
yarn dev
```

## 🔧 **Service Discovery in Development**

The CLI automatically detects when it's running in development mode and provides appropriate guidance:

### **Development Mode Detection**

- Checks for `yarn.lock` and `package.json` with workspaces
- Checks if running from a packages directory within a workspace
- Automatically assumes service is available locally

### **Development vs Production Behavior**

| Scenario        | Service Check              | Error Messages                                |
| --------------- | -------------------------- | --------------------------------------------- |
| **Development** | Assumes local service      | Suggests `yarn dev:service`                   |
| **Production**  | Checks global npm packages | Suggests `npm install -g @notes-sync/service` |

## 🧪 **Testing Workflow**

### **1. Start Service**

```bash
# Terminal 1: Start service
yarn dev:service
```

### **2. Test CLI Commands**

```bash
# Terminal 2: Test CLI
yarn dev:cli status
yarn dev:cli add -n "Test note"
yarn dev:cli daily --status
```

### **3. Test Service Discovery**

```bash
# Test with service running
yarn dev:cli status  # Should connect successfully

# Test with service stopped
# Stop service in Terminal 1, then:
yarn dev:cli status  # Should show development-specific error messages
```

## 📦 **Package Development**

### **Shared Package**

```bash
cd packages/shared
yarn dev  # Watch mode for TypeScript compilation
```

### **Service Package**

```bash
cd packages/service
yarn dev  # Start service in development mode
yarn build  # Build for production
```

### **CLI Package**

```bash
cd packages/cli
yarn dev  # Run CLI in development mode
yarn build  # Build for production
```

## 🔄 **Development vs Production**

### **Development Mode**

- Uses workspace dependencies (`workspace:*`)
- Service discovery assumes local service
- Error messages suggest development commands
- Hot reloading with `ts-node`

### **Production Mode**

- Uses published package dependencies (`^1.0.0`)
- Service discovery checks global npm packages
- Error messages suggest production commands
- Compiled JavaScript with `tsc`

## 🚀 **Publishing Workflow**

### **1. Update Dependencies for Publishing**

```bash
# Update CLI dependencies
cd packages/cli
# Change @notes-sync/shared from "*" to "^1.0.0"

# Update service dependencies
cd ../service
# Change @notes-sync/shared from "workspace:*" to "^1.0.0"
```

### **2. Build and Publish**

```bash
# Build all packages
yarn build

# Publish using script
./scripts/publish.sh

# Or publish manually
cd packages/shared && npm publish --access public
cd ../service && npm publish --access public
cd ../cli && npm publish --access public
```

### **3. Restore Development Dependencies**

```bash
# After publishing, restore workspace dependencies for development
cd packages/cli
# Change @notes-sync/shared back to "*"

cd ../service
# Change @notes-sync/shared back to "workspace:*"
```

## 🐛 **Debugging**

### **Service Discovery Issues**

```bash
# Check if development mode is detected
yarn dev:cli status

# Check service config
cat ~/.config/notes-sync/config.json

# Check if service is running
curl http://localhost:3127/status
```

### **Build Issues**

```bash
# Clean and rebuild
rm -rf packages/*/dist
yarn build

# Check TypeScript errors
cd packages/cli && yarn build
cd ../service && yarn build
cd ../shared && yarn build
```

## 📝 **Best Practices**

### **1. Always Test Both Modes**

- Test development mode with `yarn dev:service` + `yarn dev:cli`
- Test production mode with published packages

### **2. Update Dependencies Carefully**

- Use workspace dependencies for development
- Use versioned dependencies for publishing
- Remember to restore workspace dependencies after publishing

### **3. Service Discovery Testing**

- Test with service running
- Test with service stopped
- Test with different config locations

### **4. Error Message Testing**

- Verify development-specific error messages
- Verify production-specific error messages
- Test retry logic and user prompts

## 🎯 **Quick Commands**

```bash
# Development workflow
yarn dev:service &  # Start service in background
yarn dev:cli status  # Test CLI

# Build and test
yarn build
cd packages/cli && yarn dev

# Publish workflow
./scripts/publish.sh
```

This setup ensures smooth development while maintaining production-ready packages!
