# initLocalStorageServer(options)

The `initLocalStorageServer` function is the core middleware for handling direct file uploads from the `@blocklet/uploader` frontend component to your blocklet's local storage. It leverages the robust [tus protocol](https://tus.io/) for resumable file uploads, ensuring reliability even over unstable network connections.

This middleware is responsible for receiving file chunks, assembling them into a complete file in a specified directory, and triggering callbacks upon completion.

## Basic Usage

To get started, initialize the middleware in your Express application and attach it to a route. You'll need to provide a storage path and the Express instance.

```javascript
// routes/upload.js
import express from 'express';
import { initLocalStorageServer } from '@blocklet/uploader-server';
import env from '../libs/env';

const router = express.Router();

// Initialize the uploader server
const localStorageServer = initLocalStorageServer({
  path: env.uploadDir, // The directory to store uploaded files
  express,
  // Callback triggered after a file is successfully uploaded
  onUploadFinish: async (req, res, uploadMetadata) => {
    const {
      id: filename, // The unique, randomized filename on the server
      size,
      metadata: { filename: originalname, filetype: mimetype }, // Original file metadata
    } = uploadMetadata;

    // Construct the public URL for the uploaded file
    const fileUrl = new URL(env.appUrl);
    fileUrl.pathname = `/uploads/${filename}`;

    // Here, you would typically save the file information to your database
    // For example: await Upload.insert({ ... });

    const responseData = { 
      url: fileUrl.href, 
      filename, 
      originalname, 
      size, 
      mimetype 
    };

    // The returned object will be sent as a JSON response to the frontend
    return responseData;
  },
});

// Attach the middleware to handle all requests on the '/uploads' path
router.use('/uploads', localStorageServer.handle);

export default router;
```

## How It Works

The following diagram illustrates the complete upload flow from the user's action in the browser to the final response from the server.

```d2
direction: down

User: { 
  shape: c4-person 
}

App: {
  label: "Your Blocklet Application"
  shape: rectangle

  Uploader-Component: {
    label: "Uploader Component"
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
App.Backend-Server.DB -> App.Backend-Server.Uploader-Server: "5. Return DB record"
App.Backend-Server.Uploader-Server -> App.Uploader-Component: "6. Send JSON response"
App.Uploader-Component -> App.Uploader-Component: "7. Frontend onUploadFinish"
App.Uploader-Component -> User: "8. Update UI"
```

## Configuration Options

The `initLocalStorageServer` function accepts an options object with the following properties. It also passes any unrecognized properties directly to the underlying `@tus/server` constructor.

| Option | Type | Required | Description |
|---|---|---|---|
| `path` | `string` | Yes | The absolute path to the directory where uploaded files will be stored. |
| `express` | `Function` | Yes | The Express application instance. |
| `onUploadFinish` | `(req, res, uploadMetadata) => Promise<any>` | No | An async function that is called after an upload is successfully completed. The return value is sent as the JSON response to the frontend. |
| `onUploadCreate` | `(req, res, uploadMetadata) => Promise<any>` | No | An async function that is called when an upload is first initiated (before any data is transferred). Can be used for validation. |
| `expiredUploadTime` | `number` | No | The time in milliseconds after which expired or incomplete uploads are eligible for cleanup. Defaults to 3 days (`1000 * 60 * 60 * 24 * 3`). |

### Callbacks in Detail

#### `onUploadFinish(req, res, uploadMetadata)`

This is the most important callback for processing completed uploads. It runs after the last byte of the file has been saved to disk.

-   `req`: The Express request object.
-   `res`: The Express response object.
-   `uploadMetadata`: An object containing detailed information about the uploaded file.

**`uploadMetadata` Object Structure:**

```json
{
  "id": "e8b5a5f76326e7b1e4e1e0b5a5f76326", // Unique filename on disk
  "size": 123456,
  "offset": 123456,
  "metadata": {
    "filename": "original-document.pdf",
    "filetype": "application/pdf",
    "relativePath": "documents/original-document.pdf",
    // ... other metadata from frontend
  },
  "runtime": {
    "absolutePath": "/path/to/your/uploads/e8b5a5f76326",
    "hashFileName": "e8b5a5f76326",
    "originFileName": "original-document.pdf",
    // ... other runtime details
  }
}
```

#### `onUploadCreate(req, res, uploadMetadata)`

This callback is triggered at the beginning of the upload process. It's useful for performing preliminary checks, such as validating authentication tokens or checking if the user has enough quota before allowing the upload to proceed.

## Automatic Cleanup

The middleware automatically sets up a daily cron job (`auto-cleanup-expired-uploads`) that removes incomplete upload files older than the specified `expiredUploadTime`. This prevents your server's storage from filling up with orphaned file chunks.

## Serving Uploaded Files

After uploading files, you'll need a way to serve them. The package exports a `getLocalStorageFile` helper to easily create a route for this purpose.

**Example:**

```javascript
// routes/upload.js (continued)
import { getLocalStorageFile } from '@blocklet/uploader-server';

// ... (localStorageServer initialization)

// Add a route to serve the uploaded files
// The server object is available on the initialized middleware
router.get('/uploads/:fileName', getLocalStorageFile({ server: localStorageServer }));
```

This will create an endpoint like `GET /uploads/e8b5a5f76326` that serves the corresponding file from your `uploadDir` with the correct `Content-Type` headers.

---

Now that you know how to handle direct uploads, you might want to enable uploads from remote sources. Continue to the [initCompanion(options)](./api-reference-uploader-server-companion.md) documentation to learn how.