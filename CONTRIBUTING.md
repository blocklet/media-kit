# Contributing to Media Kit

Thank you for your interest in contributing to Media Kit! This document provides guidelines and instructions for contributing to this project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Version Management](#version-management)

## 🤝 Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please be respectful and professional in all interactions.

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.x
- **pnpm** >= 8.x (required - this project uses pnpm workspaces)
- **@blocklet/cli** >= 1.16.29
- **Git**

### Initial Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/image-bin.git
   cd image-bin
   ```

2. **Install Dependencies**
   ```bash
   # This will install dependencies and build shared packages
   make init
   # Or manually:
   pnpm install
   ```

3. **Setup Blocklet Server**
   ```bash
   # Initialize in debug mode for development
   blocklet server init --mode=debug
   blocklet server start
   ```

4. **Start Development**
   ```bash
   cd blocklets/image-bin
   npm run dev
   ```

## 🔄 Development Workflow

### Working with the Monorepo

This is a pnpm workspace monorepo with the following structure:

```
image-bin/
├── blocklets/
│   └── image-bin/          # Main application
├── packages/
│   ├── uploader/           # @blocklet/uploader package
│   ├── uploader-server/    # @blocklet/uploader-server package
│   └── xss/                # @blocklet/xss package
└── websites/               # Documentation sites
```

### Common Commands

**Root Level Commands:**

```bash
# Install all dependencies
pnpm install

# Build all shared packages
pnpm run build:lib

# Lint all packages
pnpm run lint

# Fix linting issues
pnpm run lint:fix

# Update dependencies
pnpm run update:deps

# Remove all node_modules
pnpm run remove:node_modules

# Deduplicate dependencies
pnpm run deduplicate
```

**Main Blocklet Commands** (run in `blocklets/image-bin/`):

```bash
# Start development server with blocklet dev
npm run dev

# Start API server with nodemon (development)
npm start

# Build frontend
npm run build

# Lint code
npm run lint

# Create production bundle
npm run bundle

# Bundle and deploy to Blocklet Server
npm run deploy

# Bundle and upload to Blocklet Store
npm run upload
```

**Package Development Commands** (run in `packages/*/`):

```bash
# Build package
npm run build

# Start development mode (watch)
npm run dev

# Lint package
npm run lint
```

### Working on Shared Packages

When developing shared packages (`@blocklet/uploader`, `@blocklet/uploader-server`, `@blocklet/xss`):

1. **Make changes** in the package directory
2. **Build the package**: `npm run build` or `npm run dev` (watch mode)
3. **The main blocklet** will automatically use the updated package via pnpm workspace

**Note**: In development mode, Vite is configured to use source files directly via aliases, so you may not need to rebuild packages for frontend changes.

## 📁 Project Structure

### Main Blocklet (`blocklets/image-bin/`)

```
blocklets/image-bin/
├── api/
│   ├── index.js           # Express app entry
│   ├── routes/            # API route handlers
│   ├── store/             # Database models and migrations
│   ├── libs/              # Utility libraries
│   └── hooks/             # Blocklet lifecycle hooks
├── src/
│   ├── app.jsx            # React app entry
│   ├── pages/             # Route components
│   ├── components/        # React components
│   ├── contexts/          # React contexts
│   ├── libs/              # Frontend utilities
│   └── locales/           # Internationalization
├── blocklet.yml           # Blocklet configuration
├── blocklet.prefs.json    # User preferences schema
└── vite.config.mjs        # Vite configuration
```

### Shared Packages

- **`packages/uploader/`**: React components for file uploads using Uppy
- **`packages/uploader-server/`**: Express middleware for handling uploads via @tus/server
- **`packages/xss/`**: XSS protection utilities for sanitizing SVG and other content

## 💻 Coding Standards

### Code Style

- **JavaScript/JSX**: Follow [@arcblock/eslint-config](https://www.npmjs.com/package/@arcblock/eslint-config)
- **Formatting**: Use Prettier (configured in `.prettierrc`)
- **Git Hooks**: Husky runs linting and formatting on commit

### Best Practices

1. **React Components**
   - Use functional components with hooks
   - Implement proper error boundaries
   - Use lazy loading for route components
   - Follow Material-UI (MUI) patterns

2. **API Development**
   - Use async/await with proper error handling
   - Implement middleware for reusable logic
   - Validate all user inputs
   - Use Sequelize ORM for database operations

3. **Security**
   - Sanitize all user-generated content (especially SVG)
   - Validate file paths to prevent directory traversal
   - Use CSRF protection for state-changing operations
   - Remove EXIF metadata from uploaded images

4. **Performance**
   - Implement pagination for large datasets
   - Use LRU cache for frequently accessed data
   - Optimize images and media automatically
   - Use streaming for file operations

### File Naming Conventions

- **React Components**: `kebab-case.jsx` (e.g., `media-item.jsx`)
- **Utility Files**: `kebab-case.js` (e.g., `file-utils.js`)
- **API Routes**: `kebab-case.js` (e.g., `upload.js`)
- **Database Migrations**: `YYYYMMDDHHMM-description.js` (e.g., `2025060401-genesis.js`)

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Writing Tests

- Write unit tests for utility functions
- Write integration tests for API endpoints
- Write component tests for React components
- Aim for at least 80% code coverage

## 📤 Submitting Changes

### Creating a Pull Request

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make Changes**
   - Follow coding standards
   - Write meaningful commit messages
   - Add tests for new features
   - Update documentation

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   # or
   git commit -m "fix: resolve issue with..."
   ```

4. **Push to GitHub**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open Pull Request**
   - Go to GitHub and create a pull request
   - Fill out the PR template
   - Link related issues
   - Request review from maintainers

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(upload): add AI image generation support
fix(security): enhance XSS filtering with recursive sanitization
docs(readme): update installation instructions
chore(deps): upgrade @aigne/aigne-hub dependency
```

### Pull Request Guidelines

- **Title**: Use conventional commit format
- **Description**: Clearly describe what and why
- **Screenshots**: Include for UI changes
- **Breaking Changes**: Clearly document any breaking changes
- **Tests**: Ensure all tests pass
- **Linting**: Ensure code passes linting
- **Documentation**: Update relevant documentation

## 🔖 Version Management

### Updating Version

```bash
# Bump version across all packages
npm run bump-version
```

This script will:
- Prompt you for the new version
- Update version in all `package.json` files
- Update version in `blocklet.yml`
- Create a git tag
- Update changelog

### Version Scheme

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Releasing

1. **Update Version**
   ```bash
   npm run bump-version
   ```

2. **Update Changelog**
   - Add release notes to `CHANGELOG.md`
   - Document breaking changes, new features, and bug fixes

3. **Create Release**
   - Tag the commit
   - Push tags: `git push --tags`
   - Create GitHub release with changelog

4. **Publish to Blocklet Store**
   ```bash
   cd blocklets/image-bin
   npm run upload
   ```

## 🆘 Getting Help

- **💬 [Community Forum](https://community.arcblock.io)** - Ask questions
- **📧 Email**: blocklet@arcblock.io
- **🐛 [GitHub Issues](https://github.com/blocklet/image-bin/issues)** - Report bugs
- **📚 [Documentation](https://www.arcblock.io/docs/media-kit)** - Read the docs

## 📜 License

By contributing to Media Kit, you agree that your contributions will be licensed under the Apache License 2.0.

---

Thank you for contributing to Media Kit! 🎉
