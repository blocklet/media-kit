# Backend Setup (@blocklet/uploader-server)

This guide will walk you through setting up the `@blocklet/uploader-server` package in your Express.js-based blocklet. This package provides the necessary server-side middleware to handle file uploads initiated by the `@blocklet/uploader` frontend component.

While the frontend `@blocklet/uploader` can be used with any custom backend that supports the Tus resumable upload protocol, `@blocklet/uploader-server` offers a ready-to-use, integrated solution that handles local file storage, metadata processing, and cleanup of expired uploads.

## Upload Flow Overview

The following diagram illustrates the typical data flow when a user uploads a file using the frontend component and the backend server middleware.

```d2
direction: down

User: {
  shape: c4-person
}

App: {
  label: "Your Blocklet Application"
  shape: rectangle

  Uploader-Component: {
    label: "Uploader Component\n(Frontend)"
    shape: rectangle
  }

  Backend-Server: {
    label: "Backend Server (Express)"
    shape: rectangle

    Uploader-Middleware: {
      label: "@blocklet/uploader-server\n(initLocalStorageServer)"
    }

    File-System: {
      label: "Upload Directory"
      shape: cylinder
    }

    Database: {
      label: "Database"
      shape: cylinder
    }
  }
}

User -> App.Uploader-Component: "1. Selects & drops file"
App.Uploader-Component -> App.Backend-Server.Uploader-Middleware: "2. Uploads file chunks (Tus protocol)"
App.Backend-Server.Uploader-Middleware -> App.File-System: "3. Saves file to disk"
App.Backend-Server.Uploader-Middleware -> App.Backend-Server.Uploader-Middleware: "4. Triggers onUploadFinish callback"
App.Backend-Server.Uploader-Middleware -> App.Database: "5. Save file metadata"
App.Database -> App.Backend-Server.Uploader-Middleware: "6. Return saved record"
App.Backend-Server.Uploader-Middleware -> App.Uploader-Component: "7. Send JSON response with file URL"
App.Uploader-Component -> User: "8. Update UI with final file"
```

## Step 1: Installation

First, add the package to your blocklet's dependencies.

```bash
pnpm add @blocklet/uploader-server
```

## Step 2: Basic Configuration

The primary export from this package is `initLocalStorageServer`. This function creates an Express middleware that handles file uploads and stores them on the local filesystem.

Create a new route file in your blocklet (e.g., `routes/uploads.js`) and add the following basic configuration:

```javascript Basic upload endpoint icon=logos:javascript
import express from 'express';
import { initLocalStorageServer } from '@blocklet/uploader-server';

const router = express.Router();

// Initialize the uploader server middleware
const localStorageServer = initLocalStorageServer({
  path: process.env.UPLOAD_DIR, // A directory to store uploaded files
  express,
});

// Mount the uploader middleware to handle all requests to this route
router.use('/', localStorageServer.handle);

export default router;
```

In this minimal setup:
- We import `initLocalStorageServer`.
- We call it with a `path` option, which specifies the directory on the server where files will be stored. This should be an absolute path.
- We pass the `express` object itself to the middleware.
- Finally, we mount the returned handler on our router.

Now, you can mount this router in your main `app.js` file:

```javascript app.js icon=logos:javascript
// ... other imports
import uploadRouter from './routes/uploads';

// ... app setup
app.use('/api/uploads', uploadRouter);
```

With this in place, your backend is now ready to receive file uploads at the `/api/uploads` endpoint.

## Step 3: Handling Upload Completion

Simply saving a file isn't enough; you typically need to save its metadata to a database and return a publicly accessible URL to the frontend. This is done using the `onUploadFinish` callback.

The `onUploadFinish` function is executed after a file has been successfully and completely uploaded to the server.

Here is a more complete example demonstrating how to use it:

```javascript Full backend example icon=logos:javascript
import { initLocalStorageServer } from '@blocklet/uploader-server';
import express from 'express';
import url from 'url';
import path from 'path';

// Assume you have a database model for uploads
// import Upload from '../models/upload';

const router = express.Router();

const localStorageServer = initLocalStorageServer({
  path: process.env.UPLOAD_DIR,
  express,
  onUploadFinish: async (req, res, uploadMetadata) => {
    // 1. Destructure the metadata from the completed upload
    const {
      id: filename, // The unique, randomized filename on disk
      size,
      metadata: { filename: originalname, filetype: mimetype },
    } = uploadMetadata;

    // 2. Construct the public URL for the file
    const publicUrl = new URL(process.env.APP_URL);
    publicUrl.pathname = path.join('/api/uploads', filename);

    // 3. (Optional but recommended) Save the file metadata to your database
    /*
    const doc = await Upload.insert({
      mimetype,
      originalname,
      filename,
      size,
      url: publicUrl.href,
      createdAt: new Date().toISOString(),
      createdBy: req.user.did,
    });
    */

    // 4. Return a JSON object to the frontend. This object will be available
    // in the frontend's onUploadSuccess callback.
    const responseData = {
      url: publicUrl.href,
      // ...doc, // Include the database record if you created one
    };

    return responseData;
  },
});

// Mount the handler. Any middleware for authentication (like `user`, `auth`)
// should be placed before the handler.
router.use('/', localStorageServer.handle);

export default router;
```

### Key Points:

- **`uploadMetadata`**: This object contains all the information about the uploaded file, including its unique ID (which is also its filename on disk), size, and original metadata sent from the client (like `originalname` and `mimetype`).
- **Database Integration**: The callback is the perfect place to create a record in your database that links the uploaded file to a user or other resources in your application.
- **Return Value**: The object returned by `onUploadFinish` is serialized to JSON and sent as the response to the frontend. The frontend's `onUploadSuccess` callback will receive this object, which is how it learns the final URL of the uploaded file.

## Next Steps

With your backend configured, you are ready to explore more advanced features and customizations.

<x-cards>
  <x-card data-title="Handling Uploads" data-icon="lucide:upload-cloud" data-href="/guides/handling-uploads">
    Dive deeper into the `onUploadFinish` callback and learn how to process file metadata on both the client and server.
  </x-card>
  <x-card data-title="Integrating Remote Sources" data-icon="lucide:link" data-href="/guides/remote-sources">
    Learn how to set up the Companion middleware to allow users to import files from URLs, Unsplash, and more.
  </x-card>
  <x-card data-title="initLocalStorageServer() API" data-icon="lucide:book-open" data-href="/api-reference/uploader-server/local-storage">
    Explore the full API reference for all available options to customize the local storage middleware.
  </x-card>
</x-cards>