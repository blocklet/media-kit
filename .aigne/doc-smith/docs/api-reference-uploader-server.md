# Backend: @blocklet/uploader-server

The `@blocklet/uploader-server` package provides a collection of Express middleware functions to handle file storage, remote source integration, and resource serving for your blocklet's backend. It is designed to work seamlessly with the frontend [`@blocklet/uploader`](./api-reference-uploader.md) component.

This package leverages the power and flexibility of [Uppy](https://uppy.io/), a modular open-source file uploader. It simplifies backend setup by providing pre-configured middleware for common upload and file-serving scenarios.

## Available Middleware

The package exports several middleware initializers, each serving a distinct purpose. You can use them individually or combine them to build a complete file management solution.

<x-cards data-columns="2">
  <x-card data-title="initLocalStorageServer" data-icon="lucide:save" data-href="/api-reference/uploader-server/local-storage">
    Handles direct file uploads from the client and saves them to the server's local filesystem. This is the core middleware for handling uploads.
  </x-card>
  <x-card data-title="initCompanion" data-icon="lucide:link" data-href="/api-reference/uploader-server/companion">
    Integrates Uppy's Companion to allow users to import files from remote sources like URLs and cloud services.
  </x-card>
  <x-card data-title="initStaticResourceMiddleware" data-icon="lucide:folder-static" data-href="/api-reference/uploader-server/static-resource">
    Serves static assets from other installed blocklets, which is useful for creating a unified resource endpoint.
  </x-card>
  <x-card data-title="initDynamicResourceMiddleware" data-icon="lucide:folder-sync" data-href="/api-reference/uploader-server/dynamic-resource">
    Serves files from a specified directory and watches for real-time changes, making it ideal for development environments.
  </x-card>
</x-cards>

## Basic Setup Example

Here is an example of how to integrate the local storage and Companion middleware into your Express application router.

```javascript
import { initLocalStorageServer, initCompanion } from '@blocklet/uploader-server';
import express from 'express';

const router = express.Router();

// 1. Initialize the local storage server for direct uploads
const localStorageServer = initLocalStorageServer({
  path: env.uploadDir, // Directory to save uploaded files
  express,
  // Optional: A callback to execute after an upload is finished
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

    // Here you would typically save file metadata to your database
    // const doc = await Upload.insert({ ... }); 

    const resData = { url: obj.href, /* ...doc */ };

    return resData; // This data is sent back to the client
  },
});

// Mount the local storage handler on the '/uploads' route
router.use('/uploads', localStorageServer.handle);

// 2. Initialize Companion for remote sources
const companion = initCompanion({
  path: env.uploadDir, // A temporary directory for downloaded files
  express,
  providerOptions: env.providerOptions, // Configuration for providers like Unsplash, Google Drive etc.
  uploadUrls: [env.appUrl], // Your server's public URL
});

// Mount the Companion handler on the '/companion' route
router.use('/companion', companion.handle);
```

This example demonstrates a standard setup where direct uploads are handled by `initLocalStorageServer` and remote file imports are managed by `initCompanion`. The `onUploadFinish` callback is used to process file metadata and construct a public URL after a file is successfully saved.

## Next Steps

For detailed configuration options and advanced usage for each middleware, explore their individual API reference pages:

- **[initLocalStorageServer(options)](./api-reference-uploader-server-local-storage.md)**
- **[initCompanion(options)](./api-reference-uploader-server-companion.md)**
- **[initStaticResourceMiddleware(options)](./api-reference-uploader-server-static-resource.md)**
- **[initDynamicResourceMiddleware(options)](./api-reference-uploader-server-dynamic-resource.md)**