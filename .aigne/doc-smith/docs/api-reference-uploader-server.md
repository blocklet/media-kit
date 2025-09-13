# Backend: @blocklet/uploader-server

The `@blocklet/uploader-server` package provides a suite of Express.js middleware designed to handle various file handling tasks on the backend of your blocklet. It serves as the server-side counterpart to the `@blocklet/uploader` frontend component, enabling features like direct file uploads, integration with remote sources, and resource serving.

While designed to work seamlessly with its frontend partner, it can also be used as a standalone solution for customized file upload logic. The package exports several modular middleware initializers that you can easily integrate into your Express application.

### Core Middleware Interaction

The following diagram illustrates how the primary middleware components interact with the frontend and external services during an upload process.

```d2
direction: down

Frontend-Uploader: {
  label: "@blocklet/uploader"
}

Backend-Server: {
  label: "Express Server"
  shape: rectangle

  uploader-server-middleware: {
    label: "@blocklet/uploader-server"

    initLocalStorageServer
    initCompanion
  }
}

Remote-Sources: {
  label: "Remote Sources\n(e.g., Unsplash)"
  shape: cylinder
}

File-Storage: {
  label: "Server File System"
  shape: cylinder
}

Frontend-Uploader -> Backend-Server.uploader-server-middleware.initLocalStorageServer: "Direct Upload"
Frontend-Uploader -> Backend-Server.uploader-server-middleware.initCompanion: "Remote Upload Request"
Backend-Server.uploader-server-middleware.initCompanion -> Remote-Sources: "Fetch File"
Backend-Server.uploader-server-middleware.initLocalStorageServer -> File-Storage: "Store File"

```

## Installation

To get started, add the package to your blocklet's dependencies.

```bash Installation icon=mdi:language-bash
pnpm add @blocklet/uploader-server
```

## General Usage

Here is a typical example of how to integrate the upload and companion middleware into your Express application's router. You can initialize the required middleware and then mount their handlers onto specific routes.

```javascript Express Router Example icon=logos:javascript
import { initLocalStorageServer, initCompanion } from '@blocklet/uploader-server';
import express from 'express';

// Assume `env`, `user`, `auth`, `ensureComponentDid`, and `Upload` model are defined elsewhere
const router = express.Router();

// 1. Initialize the local storage server for direct uploads
const localStorageServer = initLocalStorageServer({
  path: env.uploadDir, // Directory to save uploads
  express,
  // Optional: Callback executed after a file is successfully uploaded
  onUploadFinish: async (req, res, uploadMetadata) => {
    const {
      id: filename,
      size,
      metadata: { filename: originalname, filetype: mimetype },
    } = uploadMetadata;

    // Construct the public URL for the uploaded file
    const obj = new URL(env.appUrl);
    obj.protocol = req.get('x-forwarded-proto') || req.protocol;
    obj.pathname = `/uploads/${filename}`;

    // Save file metadata to the database
    const doc = await Upload.insert({
      mimetype,
      originalname,
      filename,
      size,
      // ... other metadata from the request
    });

    // Return a JSON response to the frontend
    const resData = { url: obj.href, ...doc };
    return resData;
  },
});

// Mount the upload handler on a specific route
router.use('/uploads', user, auth, ensureComponentDid, localStorageServer.handle);

// 2. Initialize Companion for remote sources (e.g., URL, Unsplash)
const companion = initCompanion({
  path: env.uploadDir,
  express,
  providerOptions: env.providerOptions, // Your provider keys (e.g., Unsplash)
  uploadUrls: [env.appUrl], // The URL of your app
});

// Mount the companion handler on its route
router.use('/companion', user, auth, ensureComponentDid, companion.handle);
```

## Available Middleware

The package exports several middleware initializers for different functionalities. Click on a card to view its detailed API reference and configuration options.

<x-cards data-columns="2">
  <x-card data-title="initLocalStorageServer" data-icon="lucide:hard-drive-upload" data-href="/api-reference/uploader-server/local-storage">
    Handles direct file uploads from the user's computer, saving them to the server's local storage.
  </x-card>
  <x-card data-title="initCompanion" data-icon="lucide:link" data-href="/api-reference/uploader-server/companion">
    Integrates with Uppy Companion to allow users to import files from remote sources like direct URLs and Unsplash.
  </x-card>
  <x-card data-title="initStaticResourceMiddleware" data-icon="lucide:folder-static" data-href="/api-reference/uploader-server/static-resource">
    Serves static assets (e.g., images, CSS) from other installed blocklets, enabling resource sharing.
  </x-card>
  <x-card data-title="initDynamicResourceMiddleware" data-icon="lucide:folder-sync" data-href="/api-reference/uploader-server/dynamic-resource">
    Serves resources from a specified directory and can watch for file changes in real-time, useful for development.
  </x-card>
</x-cards>

## Next Steps

The `@blocklet/uploader-server` package provides the essential server-side building blocks for a robust file handling system in your blocklet. By combining these middleware functions, you can create a feature-rich upload experience for your users.

To get started, we recommend exploring the [initLocalStorageServer](./api-reference-uploader-server-local-storage.md) documentation to set up the core direct upload functionality.