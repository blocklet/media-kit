# Backend Setup (@blocklet/uploader-server)

While the `@blocklet/uploader` frontend component works seamlessly with a Media Kit blocklet for automatic upload handling, you'll use `@blocklet/uploader-server` when you need to implement custom server-side logic. This package gives you full control over the upload process, allowing you to save file metadata to a database, trigger custom workflows, or apply unique validation rules.

This guide will walk you through setting up a custom local file upload endpoint.

## Step 1: Install the Package

First, add the `@blocklet/uploader-server` package to your blocklet's dependencies.

```bash
# Using pnpm (recommended), npm, or yarn
pnpm add @blocklet/uploader-server
```

## Step 2: Configure the Upload Middleware

The primary function for handling direct file uploads is `initLocalStorageServer`. This function creates an Express middleware that manages the entire upload process using the [tus resumable upload protocol](https://tus.io/).

Create a new route file in your blocklet (e.g., `routes/upload.js`) and add the following configuration:

```javascript
import { Router } from 'express';
import { initLocalStorageServer } from '@blocklet/uploader-server';

// Assume you have a database model for uploads
// import Upload from '../models/upload';

const router = Router();

// Initialize the uploader server middleware
const localStorageServer = initLocalStorageServer({
  // The directory where uploaded files will be stored
  path: process.env.UPLOAD_DIR || '/tmp/uploads',
  // Pass the Express Router constructor to the middleware
  express: Router,
  // A callback function that runs after each upload is complete
  onUploadFinish: async (req, res, uploadMetadata) => {
    const {
      id: filename,
      size,
      metadata: { filename: originalname, filetype: mimetype },
    } = uploadMetadata;

    console.log(`File uploaded: ${originalname} (${size} bytes) -> ${filename}`);

    // Construct the public URL for the uploaded file
    const fileUrl = new URL(process.env.APP_URL || '');
    // This example assumes files are served from a /uploads/ path
    fileUrl.pathname = `/uploads/${filename}`;

    // Here you can implement your custom logic, like saving to a database.
    /*
    const doc = await Upload.insert({
      mimetype,
      originalname,
      filename,
      size,
      url: fileUrl.href,
      // ... other fields like createdBy, tags, etc.
    });
    */

    // The data returned here will be sent to the frontend client.
    const responseData = {
      url: fileUrl.href,
      filename,
      originalname,
      mimetype,
      size,
    };

    return responseData;
  },
});

// Mount the middleware to handle requests on the /uploads path
router.use('/uploads', localStorageServer.handle);

export default router;
```

Finally, import and use this router in your main application file (e.g., `app.js`):

```javascript
// In your app.js or equivalent
import uploadRouter from './routes/upload';

// ... other middleware
app.use('/api', uploadRouter);
```

## Step 3: Understand the Configuration

The `initLocalStorageServer` function accepts an options object to customize its behavior. Here are the key options used in the example:

| Option | Type | Description |
|---|---|---|
| `path` | `string` | **Required.** The absolute path to the directory where files will be stored. Ensure your blocklet has write permissions to this directory. |
| `express` | `Function` | **Required.** The Express `Router` constructor. The middleware uses this to create its internal routes. |
| `onUploadFinish` | `(req, res, uploadMetadata) => Promise<any>` | An optional async function called after a file is successfully saved. It receives the request, response, and `uploadMetadata` objects. This is the ideal place to save file info to a database and return a JSON response to the client. |
| `onUploadCreate` | `(req, res, uploadMetadata) => Promise<any>` | An optional async function called when an upload is initiated (before any chunks are sent). It can be used for validation or setting initial metadata. |

### The `uploadMetadata` Object

The `onUploadFinish` callback receives a detailed `uploadMetadata` object containing valuable information about the completed upload:

```json
{
  "id": "f8c9b9e0a8d7b6c5a4b3c2d1e0f9a8b7",
  "size": 102400,
  "offset": 102400,
  "metadata": {
    "filename": "example.jpg",
    "filetype": "image/jpeg",
    "relativePath": null
  },
  "runtime": {
    "absolutePath": "/tmp/uploads/f8c9b9e0a8d7b6c5a4b3c2d1e0f9a8b7",
    "originFileName": "example.jpg"
  }
}
```

You can use this data to link the uploaded file to other resources in your application.

## What's Next?

With these steps, your backend is now configured to accept and store file uploads with custom server-side logic. You can further enhance the process by exploring more advanced features.

<x-cards>
  <x-card data-title="Handling Uploads" data-icon="lucide:settings-2" data-href="/guides/handling-uploads">
    Dive deeper into the `onUploadFinish` and `onUploadCreate` callbacks to add custom logic and validation.
  </x-card>
  <x-card data-title="Integrating Remote Sources" data-icon="lucide:cloud" data-href="/guides/remote-sources">
    Learn how to enable uploads from external services like Unsplash or direct URLs using the Companion middleware.
  </x-card>
  <x-card data-title="Local Storage API Reference" data-icon="lucide:book-marked" data-href="/api-reference/uploader-server/local-storage">
    Explore the full list of configuration options available for `initLocalStorageServer` for fine-grained control.
  </x-card>
</x-cards>