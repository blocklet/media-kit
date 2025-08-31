# Overview

The `@blocklet/uploader` ecosystem provides a file upload solution for your blocklets, built upon the robust and popular [Uppy](https://uppy.io/) file uploader. The solution is split into two distinct packages to provide clear separation between frontend and backend concerns:

- **`@blocklet/uploader`**: This is the core frontend package. It provides a React component that handles the entire user interface for uploads. It is designed to work standalone by connecting to any Uppy-compatible backend, such as a pre-existing Media Kit blocklet.
- **`@blocklet/uploader-server`**: This is an **optional** backend toolkit. You only need this package if you intend to build your own custom upload server with specific file-handling logic, rather than using an existing service.

```d2
direction: down

"User's Browser" {
  "React App" {
    uploader: "@blocklet/uploader\n(UI Component)" {
      shape: package
    }
  }
}

"Standard Integration (Recommended)" {
  "Media Kit Blocklet\n(or other Uppy-compatible service)"
}

"Custom Backend Integration (Optional)" {
  "Your Blocklet Backend" {
    server: "@blocklet/uploader-server\n(Middleware Toolkit)" {
      shape: package
    }
    "File Storage" {
      shape: cylinder
    }
    server -> "File Storage": "Persist file"
  }
}

uploader -> "Standard Integration (Recommended)": "Upload Request" {
  style.animated: true
}

uploader -> "Custom Backend Integration (Optional)": "Upload Request (if needed)" {
  style.animated: true
  style.stroke-dash: 4
}

"Custom Backend Integration (Optional)" -> uploader: "Return result (e.g., URL)"
```

## Core Packages

<x-cards>
  <x-card data-title="@blocklet/uploader (Frontend)" data-icon="lucide:component">
    A pre-built React component that provides the complete user interface for file selection, previews, and upload progress. It's designed to connect to any Uppy-compatible backend endpoint.
  </x-card>
  <x-card data-title="@blocklet/uploader-server (Backend)" data-icon="lucide:server">
    An **optional** set of Express middleware for building a custom backend. Use this only when you need to define your own logic for file processing, saving metadata, or integrating with remote sources.
  </x-card>
</x-cards>

## Key Features

- **Direct & Remote Uploads**: Allow users to upload files from their local device or import from external sources like URLs, Webcam, and Unsplash.
- **Client-Side Image Editing**: Users can perform basic image edits (crop, rotate, zoom) before the upload begins.
- **Extensible Plugin System**: Leverage Uppy's plugin architecture to enable or disable features as needed.
- **Custom Backend Hooks**: The `onUploadFinish` callback in `@blocklet/uploader-server` allows you to execute custom logic after a file is successfully uploaded.
- **Seamless Integration**: Designed to work effortlessly within the Blocklet ecosystem, providing a straightforward setup for both frontend and backend.

## Next Steps

Ready to integrate the uploader into your blocklet? Our Getting Started guide will walk you through the entire process, from installation to a working implementation.

<x-card data-title="Getting Started" data-icon="lucide:rocket" data-href="/getting-started" data-cta="Begin Setup">
  Follow a step-by-step guide to install and configure the frontend component and, if needed, the backend middleware in your application.
</x-card>