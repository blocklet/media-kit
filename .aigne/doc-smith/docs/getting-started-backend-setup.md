# Backend Setup (@blocklet/uploader-server)

The `@blocklet/uploader-server` package provides a set of Express middleware to handle file uploads on the backend. It's built on the robust [tus protocol](https://tus.io/), enabling resumable file uploads, and is designed to work seamlessly with the `@blocklet/uploader` frontend component.

While the frontend uploader can connect to any Tus-compliant server, `@blocklet/uploader-server` is the recommended, pre-configured solution for blocklet development, offering helpers for local file storage, remote source integration (Companion), and more.

This guide will walk you through the basic setup for handling direct file uploads from your users and storing them on the server's local file system.

### 1. Installation

First, add the package to your blocklet's dependencies.

```bash
# Using pnpm
pnpm add @blocklet/uploader-server

# Using yarn
yarn add @blocklet/uploader-server

# Using npm
npm install @blocklet/uploader-server
```

### 2. Basic Configuration

To handle file uploads, you need to initialize the `initLocalStorageServer` middleware and attach it to an Express router. This middleware manages the entire upload process, from receiving file chunks to assembling the final file.

Here is a complete example of how to set it up in your blocklet's backend:

```javascript
// file: api/routes/upload.js
import express from 'express';
import { initLocalStorageServer } from '@blocklet/uploader-server';
import { join } from 'path';

const router = express.Router();

// A mock database model for demonstration
const Upload = {
  insert: async (data) => {
    console.log('Saving to database:', data);
    // In a real app, you would save this to your database
    // and return the created document.
    return { _id: 'mock_id', ...data };
  },
};

// Initialize the uploader server middleware
const localStorageServer = initLocalStorageServer({
  // Required: The directory where uploaded files will be stored.
  path: process.env.UPLOAD_DIR || './uploads',
  express,

  // This callback is triggered after a file is successfully uploaded.
  onUploadFinish: async (req, res, uploadMetadata) => {
    const {
      id: filename, // The unique, randomized filename on disk
      size,
      metadata: { filename: originalname, filetype: mimetype },
    } = uploadMetadata;

    // Construct the public URL for the uploaded file.
    const obj = new URL(process.env.APP_URL);
    obj.protocol = req.get('x-forwarded-proto') || req.protocol;
    obj.pathname = join('/api/uploads', filename); // Matches the GET route below

    // Save file metadata to your database.
    const doc = await Upload.insert({
      mimetype,
      originalname,
      filename,
      size,
      createdAt: new Date().toISOString(),
      createdBy: req.user.did, // Assuming user info is on the request
    });

    // The return value of this function is sent as a JSON response to the frontend.
    const resData = { url: obj.href, ...doc };
    return resData;
  },
});

// Mount the middleware to handle POST, PATCH, HEAD requests for uploads.
// The path '/uploads' must match the `endpoint` prop on the frontend <Uploader />.
router.use('/uploads', localStorageServer.handle);

export default router;
```

### 3. Understanding the Flow

The upload process involves several steps, managed automatically by the middleware and your custom callback.

```d2
direction: down

User: { 
  shape: c4-person 
}

App: {
  label: "Your Blocklet Application"
  shape: rectangle

  Uploader-Component: {
    label: "<Uploader /> Component"
    shape: rectangle
  }

  Backend-Server: {
    label: "Backend Server"
    shape: rectangle

    Uploader-Server: {
      label: "@blocklet/uploader-server"
      shape: hexagon
    }

    DB: {
      label: "Database"
      shape: cylinder
    }
  }
}

User -> App.Uploader-Component: "1. Drop file"
App.Uploader-Component -> App.Backend-Server.Uploader-Server: "2. Upload file (Tus)"
App.Backend-Server.Uploader-Server -> App.Backend-Server.Uploader-Server: "3. Backend onUploadFinish"
App.Backend-Server.Uploader-Server -> App.Backend-Server.DB: "4. Save metadata"
App.Backend-Server.DB -> App.Backend-Server.Uploader-Server: "5. Return record"
App.Backend-Server.Uploader-Server -> App.Uploader-Component: "6. Send JSON response"
App.Uploader-Component -> App.Uploader-Component: "7. Frontend onUploadFinish"
App.Uploader-Component -> User: "8. Update UI"
```

**Key Steps:**

1.  **Initialization**: `initLocalStorageServer` is called with your configuration. The `path` option is required and specifies the upload directory.
2.  **Request Handling**: The middleware is mounted on an Express route (e.g., `/uploads`). It automatically handles the complex Tus protocol for resumable uploads.
3.  **File Completion**: Once all chunks of a file have been received and assembled, the middleware triggers the `onUploadFinish` callback.
4.  **Custom Logic**: Inside `onUploadFinish`, you have access to the request (`req`), response (`res`), and detailed file metadata (`uploadMetadata`). This is where you should:
    *   Save the file's information (e.g., original name, size, path) to your database.
    *   Construct a public URL that can be used to access the file.
5.  **Frontend Response**: The data you return from `onUploadFinish` is automatically serialized to JSON and sent back to the frontend. The `@blocklet/uploader` component receives this data in its `onUploadSuccess` callback, allowing you to update the UI with the final file URL.

### 4. Serving Uploaded Files

The setup above only handles *receiving* files. You also need to create an endpoint to serve the uploaded files so they can be viewed in the browser. The package provides a `getLocalStorageFile` helper for this.

Add a GET route to your router that uses this helper.

```javascript
// file: api/routes/upload.js (continued)
import { initLocalStorageServer, getLocalStorageFile } from '@blocklet/uploader-server';

// ... (previous setup code) ...

// Mount the middleware for uploading
router.use('/uploads', localStorageServer.handle);

// Add a new route to serve the files by their unique filename
const serveFileMiddleware = getLocalStorageFile({ server: localStorageServer });
router.get('/uploads/:fileName', (req, res, next) => {
  // You can add custom logic here, like checking permissions
  console.log(`Serving file: ${req.params.fileName}`);
  serveFileMiddleware(req, res, next);
});

export default router;
```

With this route in place, a file uploaded as `unique-filename.jpg` can be accessed at the URL `/api/uploads/unique-filename.jpg` (assuming your router is mounted on `/api`).

### Next Steps

You now have a complete backend setup for handling file uploads and serving them. To explore more advanced features, check out the following guides:

<x-cards>
  <x-card data-title="Handling Uploads" data-icon="lucide:upload-cloud" data-href="/guides/handling-uploads">
    Dive deeper into the onUploadFinish callback and learn how to process file metadata on both the client and server.
  </x-card>
  <x-card data-title="Integrating Remote Sources" data-icon="lucide:link" data-href="/guides/remote-sources">
    Learn how to set up the Companion middleware to allow users to import files from URLs, Unsplash, and more.
  </x-card>
  <x-card data-title="API Reference" data-icon="lucide:code" data-href="/api-reference/uploader-server/local-storage">
    Explore all the available options for the initLocalStorageServer function for fine-grained control.
  </x-card>
</x-cards>