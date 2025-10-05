# Media Kit - Self-Hosted Media Management Platform

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.13.31-green.svg)](https://github.com/blocklet/image-bin)
[![Blocklet Store](https://img.shields.io/badge/Blocklet%20Store-Launch-orange.svg)](https://store.blocklet.dev/blocklets/z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9)

**The complete media management solution that saves you $100s monthly while giving you total control over your files.**

Stop paying recurring fees to Big Tech. Media Kit transforms how you store, organize, and deliver media - all on your own infrastructure with enterprise-grade features that rival industry leaders.

## 🌟 Quick Links

- **🚀 [Launch on Blocklet Store](https://store.blocklet.dev/blocklets/z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9)** - Deploy in 60 seconds
- **📚 [Official Documentation](https://www.arcblock.io/docs/media-kit)** - Complete guides and API reference
- **💬 [Community Support](https://community.arcblock.io)** - Get help and share ideas
- **🐛 [Report Issues](https://github.com/blocklet/image-bin/issues)** - Bug reports and feature requests

## 📦 What's Inside

This is a monorepo containing the Media Kit blocklet and its shared packages:

```
image-bin/
├── blocklets/
│   └── image-bin/          # Main Media Kit application
│       ├── src/            # React frontend (Vite + React 19 + MUI v7)
│       ├── api/            # Express.js backend with SQLite/Sequelize
│       └── blocklet.yml    # Blocklet configuration
├── packages/
│   ├── uploader/           # @blocklet/uploader - React upload components
│   ├── uploader-server/    # @blocklet/uploader-server - Express middleware
│   └── xss/                # @blocklet/xss - XSS protection utilities
└── websites/               # Documentation and marketing sites
```

## ✨ Key Features

### 🤖 AI-Powered Media Creation

- **Built-in AI Image Generation**: Create images from text prompts using DALL-E and other AI models
- **Multi-Model Support**: Configure and switch between different AI providers
- **Seamless Integration**: AI-generated images automatically saved to your library
- **Powered by AIGNE Framework**: Advanced AI capabilities without external API management

### 📁 Intelligent Organization

- **Smart Folders & Tags**: Find any file in seconds with powerful search
- **Multiple Import Options**: Drag & drop, paste, Unsplash stock library, or AI generation
- **Universal Format Support**: Images, videos, PDFs, documents - handle everything
- **Auto-Deduplication**: Never store the same file twice

### 🌍 Professional Delivery

- **Smart Optimization**: Perfect quality, minimal file sizes automatically
- **CDN Ready**: Optional global content delivery network support
- **Flexible Sharing**: Public URLs, private access, or team collaboration
- **Mobile Perfect**: Flawless experience across all devices

### 🛡️ Enterprise Security

- **Privacy First**: Automatic EXIF metadata removal protects your privacy
- **Team Access Control**: Precise permissions for every user role
- **XSS Protection**: Recursive sanitization for uploaded content
- **Hotlink Protection**: Prevent unauthorized resource access

### 🔧 Developer Friendly

- **Full REST API**: Integrate with any website or application
- **Bulk Operations**: Manage thousands of files efficiently
- **Component Mode**: Embed Media Kit into other Blocklets
- **SDK Support**: Easy integration with @blocklet/sdk

## 🚀 Quick Start

### Prerequisites

1. **Install Blocklet CLI**

   ```bash
   npm install -g @blocklet/cli
   ```

2. **Initialize Blocklet Server**
   ```bash
   blocklet server init --mode=debug
   blocklet server start
   ```

### Installation

**Option 1: Launch from Blocklet Store (Recommended)**

Visit [Media Kit on Blocklet Store](https://store.blocklet.dev/blocklets/z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9) and click "Launch" - that's it!

**Option 2: Deploy from Source**

```bash
# Clone the repository
git clone https://github.com/blocklet/image-bin.git
cd image-bin

# Initialize project
make init

# Navigate to main blocklet
cd blocklets/image-bin

# Start development server
npm run dev

# Or build and deploy to production
npm run bundle
npm run deploy
```

## 🛠️ Technology Stack

### Frontend

- **React 19** with React Router DOM
- **Vite** for blazing-fast builds
- **Material-UI v7** for beautiful components
- **Emotion** for CSS-in-JS styling
- **@arcblock/ux** for Blocklet-specific UI components
- **Uppy** for advanced file upload handling

### Backend

- **Express.js** with async error handling
- **SQLite** with Sequelize ORM
- **Multer** for multipart file uploads
- **@blocklet/sdk** for platform integration
- **AIGNE Hub** for AI capabilities

### Development Tools

- **pnpm** for efficient package management
- **ESLint** with @arcblock/eslint-config
- **Prettier** for code formatting
- **Husky** for git hooks

## 📊 Package Structure

### Published Packages

- **[@blocklet/uploader](packages/uploader)** - React components for file uploads with Uppy integration
- **[@blocklet/uploader-server](packages/uploader-server)** - Express middleware for handling uploads
- **[@blocklet/xss](packages/xss)** - XSS protection utilities for sanitizing user content

### Main Application

- **[Media Kit Blocklet](blocklets/image-bin)** - Complete self-hosted media management solution

## 🔐 Security Features

- **XSS Protection**: Recursive SVG sanitization and content validation
- **CSRF Protection**: Built-in token validation via @blocklet/sdk
- **Authentication**: Blocklet-based user authentication with role-based access
- **Privacy**: Automatic EXIF metadata removal from uploaded images
- **Hotlink Protection**: Optional referer checking to prevent unauthorized access
- **Path Validation**: Strict file path validation to prevent directory traversal

## 🎯 Use Cases

| Role                | Replaces                    | Monthly Savings |
| ------------------- | --------------------------- | --------------- |
| 📸 Content Creators | Dropbox, Google Drive       | $15-50          |
| 🏢 Small Businesses | Cloudinary, AWS S3          | $50-200         |
| 👩‍💻 Web Developers   | ImageKit, Uploadcare        | $30-100         |
| 📈 Marketing Teams  | Adobe Creative Cloud Assets | $100-500        |
| 🚀 Growing Startups | Multiple SaaS tools         | $200-1000       |

## 📖 Documentation

- **[Getting Started Guide](https://www.arcblock.io/docs/media-kit)** - Step-by-step setup
- **[API Reference](https://www.arcblock.io/docs/media-kit/api)** - Complete API documentation
- **[Integration Guide](https://www.arcblock.io/docs/media-kit/integration)** - Embed Media Kit in your apps
- **[Configuration](https://www.arcblock.io/docs/media-kit/configuration)** - Environment variables and settings

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Development setup and workflow
- Code style guidelines
- Testing requirements
- Pull request process
- Version management

## 🙋 Support

- **💬 [Community Forum](https://community.arcblock.io)** - Ask questions and get help
- **🐛 [Bug Reports](https://github.com/blocklet/image-bin/issues)** - Report issues or request features
- **📚 [Documentation](https://www.arcblock.io/docs/media-kit)** - Comprehensive guides

## 🌟 Why Choose Media Kit?

### 💰 Massive Cost Savings

Replace expensive subscriptions ($50-500/month) with a one-time setup. No usage limits, no surprise bills.

### 🔒 Complete Data Ownership

Your media stays on YOUR servers. No vendor lock-in, no privacy concerns, no platform risks.

### ⚡ Enterprise Performance

Optional CDN support delivers your content faster than major cloud providers - without the enterprise price tag.

### 🚀 Join 10,000+ Users

Join thousands of creators, developers, and businesses who've already made the switch to true digital independence.

**[🚀 Launch Media Kit Now - Free Setup](https://store.blocklet.dev/blocklets/z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9)**

---

_Built with ❤️ by [ArcBlock](https://www.arcblock.io) | Powered by [Blocklet Platform](https://www.blocklet.io)_
