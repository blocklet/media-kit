# Backend: @blocklet/uploader-server

The `@blocklet/uploader-server` package provides a set of Express middleware functions designed to handle file uploads and resource serving within a blocklet. It integrates services from [Uppy](https://uppy.io/docs/quick-start/), such as Companion, to offer versatile upload capabilities.

While it works seamlessly with the [`@blocklet/uploader`](./api-reference-uploader.md) frontend component, it is an independent package. You can use it to create upload endpoints for any HTTP client, allowing for flexible and custom backend implementations for handling file storage.

## Architecture Overview

The following diagram illustrates how the middleware functions within a typical Blocklet setup:

```d2
direction: down

Client: {
  label: "Frontend Client"
  shape: rectangle
  
  Uploader-UI: {
    label: "@blocklet/uploader or Custom UI"
    shape: rectangle
  }
}

Server: {
  label: "Blocklet Server (Express.js)"
  shape: rectangle
  grid-columns: 1

  Uploader-Server-Middleware: {
    label: "@blocklet/uploader-server"
    shape: package
    grid-columns: 2

    LocalStorage: {
      label: "initLocalStorageServer"
    }
    Companion: {
      label: "initCompanion"
    }
    StaticResource: {
      label: "initStaticResourceMiddleware"
    }
    DynamicResource: {
      label: "initDynamicResourceMiddleware"
    }
  }
}

Storage: {
  label: "File System / Storage"
  shape: cylinder
}

Remote-Providers: {
  label: "Remote Providers\n(e.g., Unsplash, Google Drive)"
  shape: cloud
}

Client.Uploader-UI -> Server.Uploader-Server-Middleware.LocalStorage: "Direct Upload"
Server.Uploader-Server-Middleware.LocalStorage -> Storage: "Saves file"

Client.Uploader-UI -> Server.Uploader-Server-Middleware.Companion: "Request remote file"
Server.Uploader-Server-Middleware.Companion -> Remote-Providers: "Fetches file"
Remote-Providers -> Server.Uploader-Server-Middleware.Companion: "File data"
Server.Uploader-Server-Middleware.Companion -> Storage: "Saves file"
```

## Installation

To get started, add the package to your blocklet's dependencies.

```bash
pnpm add @blocklet/uploader-server
```

## Basic Usage

Here is a basic example of how to integrate the local storage and companion middlewares into your Express router.

```javascript
import express from 'express';
import { initLocalStorageServer, initCompanion } from '@blocklet/uploader-server';

const router = express.Router();

// 1. Initialize the middleware for handling direct uploads to local storage
const localStorageServer = initLocalStorageServer({
  path: env.uploadDir, // Directory to save uploads
  express,
  onUploadFinish: async (req, res, uploadMetadata) => {
    // This callback runs after a file is successfully uploaded.
    // You can process metadata and save it to a database here.
    const { id: filename, size, metadata } = uploadMetadata;
    const doc = {
      filename,
      size,
      originalname: metadata.filename,
      mimetype: metadata.filetype,
      // ... add other custom fields
    };
    // For example, save `doc` to your database
    // const result = await Upload.insert(doc);
    return doc; // Return data to the client
  },
});

// 2. Initialize the Companion middleware for remote sources (e.g., URL, Unsplash)
const companion = initCompanion({
  path: env.uploadDir,
  express,
  providerOptions: env.providerOptions, // Your provider credentials
  uploadUrls: [env.appUrl], // Your app's public URL
});

// 3. Mount the middleware handlers on your desired routes
router.use('/uploads', localStorageServer.handle);
router.use('/companion', companion.handle);
```

## Middleware Functions

The package exports several functions to initialize different types of middleware. Choose the ones that fit your application's needs.

<x-cards data-columns="2">
  <x-card data-title="initLocalStorageServer" data-href="/api-reference/uploader-server/local-storage" data-icon="lucide:upload-cloud">
    Handles direct file uploads from a client to the server's local file system.
  </x-card>
  <x-card data-title="initCompanion" data-href="/api-reference/uploader-server/companion" data-icon="lucide:link">
    Integrates Uppy Companion to allow users to import files from remote sources like Google Drive, Unsplash, or direct URLs.
  </x-card>
  <x-card data-title="initStaticResourceMiddleware" data-href="/api-reference/uploader-server/static-resource" data-icon="lucide:folder-cog">
    Serves static assets from other installed blocklets, which is useful for creating shared resource libraries.
  </x-card>
  <x-card data-title="initDynamicResourceMiddleware" data-href="/api-reference/uploader-server/dynamic-resource" data-icon="lucide:folder-sync">
    Serves files from a specified directory with support for watching real-time file changes.
  </x-card>
</x-cards>

Each function provides a specific piece of functionality for handling files and resources on the server. Explore the detailed API reference for each function to see all available configuration options and advanced usage examples.