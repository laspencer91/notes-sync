# 🔄 Git Pipeline Notes

## 📋 **Future Pipeline Validation Tasks**

### **1. Validate Example Config**

- [ ] Ensure `packages/service/config.example.json` is valid JSON
- [ ] Verify all required fields are present
- [ ] Test config loading in service
- [ ] Validate AI configuration structure
- [ ] Check port/host settings are reasonable

### **2. Build Validation**

- [ ] All packages build successfully (`yarn build`)
- [ ] No TypeScript errors
- [ ] CLI executable has proper shebang
- [ ] Service executable has proper shebang
- [ ] All dependencies resolve correctly

### **3. Package Validation**

- [ ] All package.json files are valid
- [ ] Version numbers are consistent
- [ ] Dependencies are properly specified
- [ ] Bin fields are correct
- [ ] License and metadata are present

### **4. Service Discovery Testing**

- [ ] CLI detects development mode correctly
- [ ] CLI connects to local service in dev
- [ ] CLI prompts for service installation in production
- [ ] Error messages are helpful and accurate

### **5. Integration Testing**

- [ ] CLI commands work with running service
- [ ] Service starts and stops correctly
- [ ] Config file is read properly
- [ ] AI features work when configured

## 🚀 **Pipeline Commands**

```bash
# Validation commands for CI/CD
yarn build                    # Build all packages
yarn format:check            # Check code formatting
node -c packages/service/config.example.json  # Validate example config
yarn workspace @notes-sync/cli run build      # Build CLI specifically
yarn workspace @notes-sync/service run build  # Build service specifically
```

## 📝 **Quick Notes**

- **Development Mode**: CLI automatically detects workspace and uses local service
- **Production Mode**: CLI checks for globally installed packages
- **Config Location**: `~/.config/notes-sync/config.json`
- **Default Port**: 3127 (updated from 3000)
- **Service Discovery**: Smart detection with fallback prompts

## 🔧 **Common Issues**

1. **Service not found**: Check if running in development mode
2. **Config not found**: Verify config file exists and is valid JSON
3. **Port conflicts**: Ensure port 3127 is available
4. **Build failures**: Check TypeScript errors and dependencies
