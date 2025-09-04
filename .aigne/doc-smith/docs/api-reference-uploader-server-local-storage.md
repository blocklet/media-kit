# initLocalStorageServer(options)

The `initLocalStorageServer` function is the core middleware for handling direct file uploads to your blocklet's local storage. It sets up an Express-compatible server instance based on the [tus resumable upload protocol](https://tus.io/), providing a robust and reliable way to manage file uploads.

This middleware handles everything from receiving file chunks and reassembling them to cleaning up expired, incomplete uploads.

## Basic Usage

Here's a basic example of how to integrate the local storage server into your Express router.

```javascript
import { initLocalStorageServer } from '@blocklet/uploader-server';
import express from 'express';

const router = express.Router();

// Initialize the uploader server
const localStorageServer = initLocalStorageServer({
  // The absolute path where files will be stored
  path: '/path/to/your/uploads/directory',
  // Your Express app instance
  express,
  // Callback function executed after a file is successfully uploaded
  onUploadFinish: async (req, res, uploadMetadata) => {
    const {
      id: filename, // The unique filename on the server
      size,
      metadata: { filename: originalname, filetype: mimetype },
    } = uploadMetadata;

    // Construct the public URL for the uploaded file
    const fileUrl = new URL(process.env.APP_URL);
    fileUrl.pathname = `/uploads/${filename}`;

    // You can now save the file information to your database
    // For example:
    // const doc = await Upload.insert({
    //   mimetype,
    //   originalname,
    //   filename,
    //   size,
    //   url: fileUrl.href,
    //   // ... other user/component info
    // });

    console.log('Upload finished:', { filename, originalname, size, mimetype });

    // Return the data that should be sent back to the client
    const responseData = { url: fileUrl.href, filename, originalname, size };

    return responseData;
  },
});

// Mount the server middleware to handle requests on the '/uploads' path
router.use('/uploads', localStorageServer.handle);
```

## Configuration Options

The `initLocalStorageServer` function accepts an options object with the following properties:

| Option              | Type       | Description                                                                                                                                                             |
| ------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `path`              | `string`   | **Required.** The absolute path to the directory where uploads will be stored.                                                                                          |
| `express`           | `Function` | **Required.** The Express application instance.                                                                                                                         |
| `onUploadFinish`    | `Function` | An optional async callback that is executed after an upload is successfully completed. It receives `req`, `res`, and `uploadMetadata` as arguments.               |
| `onUploadCreate`    | `Function` | An optional async callback that is executed when a new upload is initiated, before any data is transferred. It receives `req`, `res`, and `uploadMetadata` as arguments.                        |
| `expiredUploadTime` | `Number`   | The time in milliseconds before an incomplete upload is considered expired and eligible for cleanup. Defaults to 3 days (`1000 * 60 * 60 * 24 * 3`).                     |
| `...restProps`      | `Object`   | Any other options compatible with the underlying `@tus/server` package. See the [tus-node-server documentation](https://github.com/tus/tus-node-server/blob/main/docs/ServerOptions.md) for a full list of available options. |

## Callbacks

### `onUploadFinish`

This is the most important callback for processing completed uploads. It's where you'll typically save file metadata to your database and return a response to the client.

**Note:** By default, the middleware automatically attempts to remove EXIF data from uploaded images for privacy and security. This happens just before the `onUploadFinish` callback is invoked. If an error occurs within your `onUploadFinish` function, the uploaded file will be automatically deleted to prevent orphaned files.

The `uploadMetadata` object passed to this function contains valuable information about the file:

```json
{
  "id": "e9a34b2f1f5d6c8b7a4e3d2c1b0a9f8e",
  "size": 123456,
  "offset": 123456,
  "metadata": {
    "filename": "example.jpg",
    "filetype": "image/jpeg",
    "name": "example.jpg",
    "type": "image/jpeg"
  },
  "runtime": {
    "relativePath": null,
    "absolutePath": "/path/to/your/uploads/directory/e9a34b2f1f5d6c8b7a4e3d2c1b0a9f8e",
    "size": 123456,
    "hashFileName": "e9a34b2f1f5d6c8b7a4e3d2c1b0a9f8e",
    "originFileName": "example.jpg",
    "fileType": "image/jpeg"
  }
}
```

### `onUploadCreate`

This callback is executed when a new upload is first initiated by the client but before any file data is transferred. It's an ideal place to perform validation or authorization checks, such as verifying user permissions or checking available storage quotas.

## Server Instance API

The `initLocalStorageServer` function returns a server instance with properties and methods you can use.

### `server.handle`

This is the Express middleware handler that processes all upload-related requests. You must mount it on a route as shown in the basic usage example.

### `server.delete(fileId)`

This function allows you to programmatically delete an uploaded file and its associated metadata file from the storage directory.

**Example**

```javascript
// Assuming `localStorageServer` is your initialized server instance
// and `fileId` is the unique filename (e.g., 'e9a34b2f1f5d6c8b7a4e3d2c1b0a9f8e')

async function deleteFile(fileId) {
  try {
    await localStorageServer.delete(fileId);
    console.log(`Successfully deleted file: ${fileId}`);
  } catch (error) {
    console.error(`Failed to delete file: ${fileId}`, error);
  }
}
```

## Automatic Cleanup

The server automatically configures a background job that runs hourly to clean up expired, incomplete uploads. This helps to free up disk space by removing partial files that were never finished. The expiration time can be configured with the `expiredUploadTime` option.

## Helper Functions

The `@blocklet/uploader-server` package also exports helper functions that can be used to serve and manage the uploaded files.

### `getLocalStorageFile`

This function creates a middleware to serve a file directly from the local storage directory. This is useful for creating a public access route for your uploads.

**Example**

```javascript
import { initLocalStorageServer, getLocalStorageFile } from '@blocklet/uploader-server';

// ... (server initialization)

// Create a route to serve files by their filename
// e.g., GET /uploads/e9a34b2f1f5d6c8b7a4e3d2c1b0a9f8e
router.get('/uploads/:fileName', getLocalStorageFile({ server: localStorageServer }));
```

---

Next, learn how to enable uploads from remote sources like URLs and cloud services by setting up the Companion middleware.

<x-card data-title="Next: initCompanion(options)" data-icon="lucide:link" data-href="/api-reference/uploader-server/companion" data-cta="Read More">
  API reference for the Companion middleware, detailing options for connecting to remote file sources.
</x-card>