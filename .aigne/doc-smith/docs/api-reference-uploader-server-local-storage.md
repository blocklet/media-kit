# initLocalStorageServer(options)

The `initLocalStorageServer` function creates an Express middleware designed to handle direct file uploads to the local server's filesystem. It is built upon the robust `tus` resumable upload protocol, ensuring that file uploads are reliable and can be resumed even after network interruptions.

This middleware is the core component for accepting files uploaded directly from a user's device via the `@blocklet/uploader` frontend component.

## Basic Usage

To get started, import `initLocalStorageServer` and mount it as middleware in your Express application. You must provide a storage path and the Express constructor.

```javascript
import express from 'express';
import { initLocalStorageServer } from '@blocklet/uploader-server';

const router = express.Router();

// Initialize the uploader server middleware
const localStorageServer = initLocalStorageServer({
  path: process.env.UPLOAD_DIR, // A directory to store uploaded files
  express,
  onUploadFinish: async (req, res, uploadMetadata) => {
    const {
      id: filename,
      size,
      metadata: { filename: originalname, filetype: mimetype },
    } = uploadMetadata;

    // Construct the public URL for the uploaded file
    const obj = new URL(process.env.APP_URL);
    obj.pathname = `/uploads/${filename}`;

    // Here, you would typically save the file metadata to your database
    const fileRecord = {
      url: obj.href,
      mimetype,
      originalname,
      filename,
      size,
      // ... other fields like user DID, etc.
    };

    console.log('File uploaded and processed:', fileRecord);

    // The return value of this function is sent as the JSON response to the client
    return fileRecord;
  },
});

// Mount the handler on a specific route, e.g., '/uploads'
router.use('/uploads', localStorageServer.handle);
```

## Options

The `initLocalStorageServer` function accepts an options object with the following properties:

| Option | Type | Description | Default |
|---|---|---|---|
| `path` | `string` | **Required.** The absolute path to the directory where uploaded files will be stored. | - |
| `express` | `Function` | **Required.** The Express application constructor, imported from the `express` package. | - |
| `onUploadFinish` | `(req, res, meta) => Promise<any>` | An optional async callback executed after an upload completes. This is where you process the file, save metadata to a database, and return a JSON response to the client. | `undefined` |
| `onUploadCreate` | `(req, res, meta) => Promise<any>` | An optional async callback executed when a new upload is initiated, before data transfer begins. Useful for validation or setup. | `undefined` |
| `expiredUploadTime` | `number` | The time in milliseconds after which incomplete uploads are considered expired and are automatically cleaned up. | `259200000` (3 days) |
| `...restProps` | `ServerOptions` | Additional options are passed directly to the underlying `tus-node-server` instance. For advanced configurations, refer to the [official `tus` server options documentation](https://github.com/tus/tus-node-server/blob/main/docs/ServerOptions.md). | - |

## Callbacks

### `onUploadFinish(req, res, uploadMetadata)`

This is the primary callback for handling a successfully completed upload. It is triggered after the last chunk of a file has been received and saved.

**Parameters:**
- `req`: The Express request object.
- `res`: The Express response object.
- `uploadMetadata`: An object containing details about the uploaded file.

The `uploadMetadata` object has the following structure:

| Key | Type | Description |
|---|---|---|
| `id` | `string` | The unique, randomly generated filename on the server (e.g., `a1b2c3d4...`). |
| `size` | `number` | The total file size in bytes. |
| `offset` | `number` | The current offset in bytes, which should equal `size` on completion. |
| `metadata` | `object` | Metadata provided by the client, such as `filename` (the original name), `filetype` (MIME type), and `relativePath`. |
| `runtime` | `object` | Server-side information about the file, including `absolutePath`, `hashFileName`, and `originFileName`. |

### `onUploadCreate(req, res, uploadMetadata)`

This callback is triggered when the client first initiates an upload request. It's useful for performing initial checks, such as validating file types or user permissions, before any file data is accepted.

## Key Features

### Automatic Cleanup

The middleware automatically sets up a cron job (`auto-cleanup-expired-uploads`) that runs hourly. This job scans the upload directory and removes any incomplete uploads that have passed the `expiredUploadTime`, preventing disk space from being consumed by abandoned uploads.

### EXIF Data Removal

For enhanced user privacy and security, the middleware automatically attempts to strip EXIF (Exchangeable image file format) metadata from uploaded image files. This process removes potentially sensitive information like GPS location, camera model, and capture time.

---

## Next Steps

Now that you have configured local file uploads, you may want to explore other features of `@blocklet/uploader-server`.

<x-cards data-columns="2">
  <x-card data-title="initCompanion(options)" data-icon="lucide:link" data-href="/api-reference/uploader-server/companion">
    Learn how to enable file imports from remote sources like URLs and cloud services by setting up the Companion middleware.
  </x-card>
  <x-card data-title="Handling Uploads Guide" data-icon="lucide:book-open" data-href="/guides/handling-uploads">
    Dive into more practical examples and advanced scenarios for processing files on both the frontend and backend.
  </x-card>
</x-cards>