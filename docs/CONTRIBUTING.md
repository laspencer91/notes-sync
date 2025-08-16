# Contributing to Notes Sync 🤝

Welcome to Notes Sync! We're excited to have you contribute to our project. This guide will help you get started and understand our development process.

## �� Quick Links

- **[Development Guide](./DEVELOPMENT.md)** - Complete setup and development workflow
- **[Issue Templates](#-issue-templates)** - Templates for bugs and features
- **[Code Style](#-code-style)** - Our coding standards
- **[Pull Request Process](#-pull-request-process)** - How to submit your work

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **Yarn** (for package management)
- **Git** (for version control)

### First Time Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/notes-sync.git
   cd notes-sync
   ```

2. **Install dependencies**

   ```bash
   yarn install
   ```

3. **Build the project**

   ```bash
   yarn build
   ```

4. **Set up development environment**
   ```bash
   # Follow the detailed setup in our Development Guide
   # See: ./DEVELOPMENT.md
   ```

## 🌿 Branch Strategy

We use **feature branches** for development. Here's our workflow:

### Branch Naming Convention

```
feature/issue-number-short-description
bugfix/issue-number-short-description
docs/issue-number-short-description
```

**Examples:**

- `feature/123-add-todo-blocks`
- `bugfix/456-fix-auto-save`
- `docs/789-update-readme`

### Branch Workflow

1. **Create a feature branch**

   ```bash
   git checkout -b feature/123-add-todo-blocks
   ```

2. **Make your changes**

   ```bash
   # Edit files, add tests, etc.
   git add .
   git commit -m "feat: add todo block support"
   ```

3. **Push your branch**

   ```bash
   git push origin feature/123-add-todo-blocks
   ```

4. **Create a Pull Request**
   - Go to GitHub and create a PR from your branch to `main`
   - Fill out the PR template
   - Request review from maintainers

## 🎯 Finding Issues to Work On

### Good First Issues

Look for issues labeled with `good first issue` - these are perfect for new contributors:

- [ ] Set up web package structure
- [ ] Implement basic markdown parser
- [ ] Add simple UI components
- [ ] Write documentation

### Issue Difficulty Levels

- **Beginner**: Setup, documentation, simple UI components
- **Intermediate**: Core features, API integration, complex components
- **Advanced**: Architecture changes, performance optimization, complex features

### Claiming an Issue

1. **Comment on the issue** you want to work on
2. **Wait for maintainer approval** (usually quick!)
3. **Create your branch** and start coding
4. **Link your PR** to the issue when you create it

## 📝 Code Style

### TypeScript

- **Strict mode**: Always enabled
- **Type everything**: No `any` types without justification
- **Interfaces over types**: Prefer interfaces for object shapes
- **Explicit returns**: Always specify return types for functions

```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
}

function getUser(id: string): User | null {
  // Implementation
}

// ❌ Avoid
function getUser(id: any): any {
  // Implementation
}
```

### React Components

- **Functional components**: Use hooks and functional components
- **Props interface**: Always define props interface
- **Default exports**: Use named exports for components

```typescript
// ✅ Good
interface TodoBlockProps {
  block: Block;
  onUpdate: (block: Block) => void;
}

export function TodoBlock({ block, onUpdate }: TodoBlockProps) {
  // Implementation
}

// ❌ Avoid
export default function TodoBlock(props: any) {
  // Implementation
}
```

### File Organization

```
packages/web/src/
├── components/
│   ├── Editor/
│   │   ├── MarkdownEditor.tsx
│   │   └── index.ts
│   └── Blocks/
│       ├── TodoBlock.tsx
│       └── index.ts
├── hooks/
│   ├── useAutoSave.ts
│   └── index.ts
├── utils/
│   ├── markdownParser.ts
│   └── index.ts
└── types/
    └── index.ts
```

### Naming Conventions

- **Files**: PascalCase for components, camelCase for utilities
- **Components**: PascalCase
- **Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Interfaces**: PascalCase with descriptive names

## 🧪 Testing

### Writing Tests

- **Unit tests**: Test individual functions and components
- **Integration tests**: Test component interactions
- **Coverage**: Aim for 80%+ code coverage

```typescript
// __tests__/markdownParser.test.ts
describe('MarkdownParser', () => {
  test('parses headings correctly', () => {
    const input = '# Title';
    const result = parseMarkdown(input);
    expect(result.blocks[0].type).toBe('heading');
  });
});
```

### Running Tests

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage

# Run tests for specific package
cd packages/web && yarn test
```

## 📦 Development Workflow

### Making Changes

1. **Check out your branch**

   ```bash
   git checkout feature/123-add-todo-blocks
   ```

2. **Make your changes**
   - Write code
   - Add tests
   - Update documentation

3. **Test your changes**

   ```bash
   yarn test
   yarn lint
   yarn build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add todo block support"
   ```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

feat(editor): add todo block support
fix(parser): resolve heading parsing issue
docs(readme): update installation instructions
test(blocks): add todo block tests
refactor(api): simplify service discovery
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

## 🔄 Pull Request Process

### Before Submitting

- [ ] **Tests pass**: All tests should be green
- [ ] **Linting passes**: No ESLint errors
- [ ] **Code builds**: TypeScript compilation successful
- [ ] **Documentation updated**: Update docs if needed
- [ ] **Issue linked**: Link PR to relevant issue

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing

- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] All tests pass

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes

## Related Issues

Closes #123
```

### Review Process

1. **Create PR**: Fill out the template completely
2. **Request review**: Tag maintainers for review
3. **Address feedback**: Respond to review comments
4. **Merge**: Once approved, maintainers will merge

## 🐛 Reporting Bugs

### Before Reporting

- [ ] Check existing issues for duplicates
- [ ] Try to reproduce the bug
- [ ] Check if it's a configuration issue

### Bug Report Template

```markdown
## Bug Description

Clear description of the bug

## Steps to Reproduce

1. Step 1
2. Step 2
3. Step 3

## Expected Behavior

What should happen

## Actual Behavior

What actually happens

## Environment

- OS: [macOS/Windows/Linux]
- Node.js Version: [version]
- Notes Sync Version: [version]

## Additional Information

Screenshots, logs, etc.
```

## 💡 Suggesting Features

### Feature Request Template

```markdown
## Feature Description

Clear description of the feature

## Use Case

Why this feature would be useful

## Proposed Implementation

Optional: suggest how to implement

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
```

## ��️ Issue Labels

### Understanding Labels

- `good first issue`: Perfect for new contributors
- `bug`: Something isn't working
- `enhancement`: New feature request
- `documentation`: Documentation improvements
- `help wanted`: Extra attention needed
- `priority: high`: Important to fix soon
- `priority: low`: Nice to have

## 🎉 Recognition

### Contributors

We recognize contributors in several ways:

- **Contributors list**: Added to README.md
- **Release notes**: Mentioned in release announcements
- **Discussions**: Invited to project discussions

### Getting Help

- **GitHub Discussions**: For questions and ideas
- **Issues**: For bugs and feature requests
- **Discord/Slack**: For real-time chat (if available)

## 📋 Development Checklist

Before submitting your work:

- [ ] Code follows TypeScript strict mode
- [ ] All tests pass
- [ ] ESLint runs without errors
- [ ] Documentation updated
- [ ] No breaking changes introduced
- [ ] Manual testing completed
- [ ] Commit messages follow conventional format
- [ ] PR template filled out completely

## 🚀 Ready to Contribute?

1. **Pick an issue** from our [Issues page](https://github.com/yourusername/notes-sync/issues)
2. **Comment on the issue** to claim it
3. **Follow the development guide** in [DEVELOPMENT.md](./DEVELOPMENT.md)
4. **Create your branch** and start coding
5. **Submit a PR** when ready

We're excited to see what you'll build! ��

---

**Questions?** Feel free to open a discussion or ask in the comments of any issue. We're here to help you succeed!
