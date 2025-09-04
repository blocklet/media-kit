# Backend Setup (@blocklet/uploader-server)

This guide will walk you through setting up the `@blocklet/uploader-server` package in your Express-based blocklet. This middleware provides a robust backend to handle file uploads, giving you full control over how files are stored and what happens after an upload is complete.

It's important to note that `@blocklet/uploader-server` is not a strict requirement for using the frontend `@blocklet/uploader` component. If a Media Kit blocklet is installed, the frontend uploader will automatically use it for storage. You should use `@blocklet/uploader-server` when you need to implement custom file handling logic, such as storing files in a specific directory or saving file metadata to your own database.

## Step 1: Installation

First, add the package to your blocklet's dependencies.

```bash
npm install @blocklet/uploader-server
# or yarn add / pnpm add
```

## Step 2: Initialize the Middleware

The core of the package is the `initLocalStorageServer` function, which creates an Express middleware configured to handle file uploads and save them to the local filesystem.

You'll need to create a route file (e.g., `routes/upload.js`) and initialize the server.

```javascript
import { Router } from 'express';
import { initLocalStorageServer } from '@blocklet/uploader-server';

const router = Router();

// Assuming 'env.uploadDir' is the path where you want to store files.
const localStorageServer = initLocalStorageServer({
  path: env.uploadDir, // The directory to save uploaded files
  express: Router,      // Pass the Express Router constructor
  onUploadFinish: async (req, res, uploadMetadata) => {
    // This callback is triggered after a file is successfully uploaded.
    const {
      id: filename, // The unique, randomized filename on the server
      size,
      metadata: { filename: originalname, filetype: mimetype }, // Original file metadata
    } = uploadMetadata;

    // Construct the public URL for the uploaded file
    const fileUrl = new URL(env.appUrl);
    fileUrl.pathname = `/uploads/${filename}`;

    // Here, you can save the file details to your database.
    // For example, using a 'Upload' model:
    /*
    const doc = await Upload.insert({
      mimetype,
      originalname,
      filename,
      size,
      url: fileUrl.href,
      createdAt: new Date().toISOString(),
      createdBy: req.user.did,
    });
    */

    // The data returned here will be sent back to the frontend uploader.
    const responseData = { 
      url: fileUrl.href,
      filename,
      originalname,
      size,
      mimetype
    };

    return responseData;
  },
});

// Mount the uploader middleware on a specific route, e.g., '/uploads'
// You can add your own middleware for authentication or authorization before it.
router.use('/uploads', localStorageServer.handle);

export default router;
```

### How It Works

The following diagram illustrates the upload flow from the frontend to your backend storage.

```d2
direction: down

"User-Browser": {
  label: "User's Browser"
  shape: rectangle

  "React-App": {
    label: "Your React App"
    shape: rectangle

    "Uploader-Component": {
      label: "@blocklet/uploader"
      shape: package
    }
  }
}

"Blocklet-Server": {
  label: "Your Blocklet Server"
  shape: rectangle

  "Express-App": {
    label: "Your Express App"
    shape: rectangle

    "Uploader-Middleware": {
      label: "@blocklet/uploader-server\n(initLocalStorageServer)"
      shape: package

      "onUploadFinish-Callback": {
        label: "onUploadFinish Callback"
        shape: rectangle
      }
    }
  }
}

"Storage": {
  shape: package
  grid-columns: 2

  "File-System": {
    label: "File System"
    shape: cylinder
  }

  "Database": {
    label: "Database"
    shape: cylinder
  }
}

User-Browser.React-App.Uploader-Component -> Blocklet-Server.Express-App.Uploader-Middleware: "1. Uploads file"
Blocklet-Server.Express-App.Uploader-Middleware -> Storage."File-System": "2. Saves file"
Blocklet-Server.Express-App.Uploader-Middleware -> Blocklet-Server.Express-App.Uploader-Middleware."onUploadFinish-Callback": "3. Triggers callback"
Blocklet-Server.Express-App.Uploader-Middleware."onUploadFinish-Callback" -> Storage.Database: "4. Saves metadata to DB"
Blocklet-Server.Express-App.Uploader-Middleware."onUploadFinish-Callback" -> User-Browser.React-App.Uploader-Component: "5. Returns response\n(e.g., file URL)"
```

## Step 3: Mount the Route in Your App

Finally, import and mount your new upload router in your main Express application file (e.g., `app.js`).

```javascript
// In your app.js or server.js
import express from 'express';
import uploadRouter from './routes/upload'; // Import the router

const app = express();

// ... other middleware

app.use(uploadRouter); // Mount the upload router

// ... start server
```

Your backend is now configured to accept file uploads at the `/uploads` endpoint. The next step is to configure your frontend component to point to this endpoint.

## Next Steps

With the backend in place, you can now proceed to set up the user interface.

<x-cards>
  <x-card data-title="Frontend Setup" data-icon="lucide:layout-template" data-href="/getting-started/frontend-setup">
    Learn how to install and render the @blocklet/uploader component in your React application.
  </x-card>
  <x-card data-title="API Reference" data-icon="lucide:book-open" data-href="/api-reference/uploader-server/local-storage">
    Explore all the advanced configuration options available for the initLocalStorageServer function.
  </x-card>
</x-cards>