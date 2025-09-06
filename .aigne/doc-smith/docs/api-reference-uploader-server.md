# Backend: @blocklet/uploader-server

The `@blocklet/uploader-server` package provides a suite of backend middleware for Express-based blocklets, designed to handle file uploads seamlessly. It integrates Uppy's server-side components, Companion and Tus, to offer robust solutions for both direct local uploads and importing files from remote sources.

While the frontend `@blocklet/uploader` component is designed to work perfectly with this server package, it is not a strict dependency. You can use `@blocklet/uploader` with any backend that supports the Tus resumable upload protocol. `@blocklet/uploader-server` is provided as a convenient, ready-to-use solution for blocklet developers who need to implement custom upload handling and storage logic.

This package exports several middleware initializers that you can plug into your application's routing.

## Key Middleware Functions

Explore the detailed API reference for each middleware to understand its configuration and capabilities.

<x-cards data-columns="2">
  <x-card data-title="initLocalStorageServer(options)" data-icon="lucide:server" data-href="/api-reference/uploader-server/local-storage">
    Handles direct file uploads from the client and stores them on the local file system. It uses the Tus protocol for resumable uploads.
  </x-card>
  <x-card data-title="initCompanion(options)" data-icon="lucide:link-2" data-href="/api-reference/uploader-server/companion">
    Enables importing files from remote sources like Google Drive, Dropbox, Unsplash, or any direct URL.
  </x-card>
  <x-card data-title="initStaticResourceMiddleware(options)" data-icon="lucide:folder" data-href="/api-reference/uploader-server/static-resource">
    Serves static assets from other installed blocklets, useful for creating resource browsers.
  </x-card>
  <x-card data-title="initDynamicResourceMiddleware(options)" data-icon="lucide:folder-sync" data-href="/api-reference/uploader-server/dynamic-resource">
    Serves files from a specified directory and can watch for real-time file changes, ideal for dynamic content.
  </x-card>
</x-cards>

## Installation

To add the package to your blocklet, run the following command:

```bash
pnpm add @blocklet/uploader-server
```

## Basic Usage

Here is a complete example of how to set up both the local storage server for direct uploads and the Companion middleware for remote sources in your blocklet's backend.

```javascript
import express from 'express';
import { initLocalStorageServer, initCompanion } from '@blocklet/uploader-server';

const router = express.Router();

// 1. Initialize the local storage server for direct uploads
const localStorageServer = initLocalStorageServer({
  path: env.uploadDir, // Directory to save uploaded files
  express,
  onUploadFinish: async (req, res, uploadMetadata) => {
    const {
      id: filename, // The unique filename on the server
      size,
      metadata: { filename: originalname, filetype: mimetype },
    } = uploadMetadata;

    // Construct the public URL for the uploaded file
    const obj = new URL(env.appUrl);
    obj.protocol = req.get('x-forwarded-proto') || req.protocol;
    obj.pathname = `/uploads/${filename}`;

    // Save file metadata to your database (example with a hypothetical Upload model)
    const doc = await Upload.insert({
      mimetype,
      originalname,
      filename,
      size,
      createdAt: new Date().toISOString(),
      createdBy: req.user.did,
    });

    const resData = { url: obj.href, ...doc };

    // This data will be sent back to the frontend's onUploadSuccess callback
    return resData;
  },
});

// 2. Initialize Companion for remote file sources
const companion = initCompanion({
  path: env.uploadDir, // Temporary storage for remote files before they are uploaded
  express,
  providerOptions: env.providerOptions, // API keys for services like Unsplash, Google Drive, etc.
  uploadUrls: [env.appUrl], // Your server's public URL
});

// 3. Mount the middleware onto your Express router
// Assuming you have middleware for user authentication (user, auth)
router.use('/uploads', user, auth, localStorageServer.handle);
router.use('/companion', user, auth, companion.handle);
```

### Explanation

1.  **`initLocalStorageServer`**: This function sets up the endpoint for handling file uploads. The `onUploadFinish` callback is crucial; it's triggered after a file is successfully saved. Inside this callback, you typically save file metadata to your database and return a JSON object that the frontend will receive.
2.  **`initCompanion`**: This function configures the middleware for handling remote sources. It requires `providerOptions` with the necessary API keys for any third-party services you want to enable.
3.  **`router.use`**: The handlers from the initialized servers are attached to specific routes (`/uploads` and `/companion`). The frontend Uploader component will be configured to use these endpoints.

## Upload Flow Diagram

This diagram illustrates how a file is processed when uploaded directly from a user's device.

```d2
direction: down

Frontend: {
  label: "Frontend\n(@blocklet/uploader)"
  shape: rectangle

  Uploader: {
    label: "Uploader Component"
  }
}

Backend: {
  label: "Backend Blocklet"
  shape: rectangle

  Express-Router: {
    label: "Express Router"
  }

  Uploader-Server: {
    label: "@blocklet/uploader-server\nMiddleware"
    shape: hexagon
  }

  onUploadFinish: {
    label: "onUploadFinish Callback"
    shape: parallelogram
  }
}

Data-Storage: {
  label: "Data Storage"
  shape: rectangle

  File-System: {
    label: "File System\n(env.uploadDir)"
    shape: cylinder
  }

  Database: {
    label: "Database"
    shape: cylinder
  }
}

Frontend.Uploader -> Backend.Express-Router: "1. Upload file (Tus)"
Backend.Express-Router -> Backend.Uploader-Server: "2. Handle request"
Backend.Uploader-Server -> Data-Storage.File-System: "3. Write file chunks"
Backend.Uploader-Server -> Backend.onUploadFinish: "4. Trigger on complete"
Backend.onUploadFinish -> Data-Storage.Database: "5. Save metadata"
Data-Storage.Database -> Backend.onUploadFinish: "6. Return saved document"
Backend.onUploadFinish -> Frontend.Uploader: "7. Send JSON response"

```

## Next Steps

Dive deeper into the specific configuration options for each middleware function:

-   **[initLocalStorageServer(options)](./api-reference-uploader-server-local-storage.md)**: For handling direct uploads.
-   **[initCompanion(options)](./api-reference-uploader-server-companion.md)**: For integrating remote sources.