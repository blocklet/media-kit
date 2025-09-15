# initLocalStorageServer(options)

The `initLocalStorageServer` function is the core middleware for handling direct file uploads from a user's device to your blocklet's local storage. It leverages the robust [Tus resumable upload protocol](https://tus.io/), ensuring that uploads are reliable and can be resumed after network interruptions.

This middleware is responsible for receiving file chunks, assembling them into a complete file on the server, and triggering callbacks for you to process the file metadata after the upload is complete.

### How It Works

The following diagram illustrates the typical data flow when a user uploads a file using the `Uploader` component connected to a backend with `initLocalStorageServer`.

```d2 Upload Flow Diagram
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
      label: "initLocalStorageServer"
    }

    DB: {
      label: "Database"
      shape: cylinder
    }
  }
}

User -> App.Uploader-Component: "1. Drop file"
App.Uploader-Component -> App.Backend-Server.Uploader-Server: "2. Upload file (Tus)"
App.Backend-Server.Uploader-Server -> App.Backend-Server.Uploader-Server: "3. Trigger onUploadFinish"
App.Backend-Server.Uploader-Server -> App.Backend-Server.DB: "4. Save file metadata"
App.Backend-Server.DB -> App.Backend-Server.Uploader-Server: "5. Return DB record"
App.Backend-Server.Uploader-Server -> App.Uploader-Component: "6. Send JSON response"
App.Uploader-Component -> App.Uploader-Component: "7. Trigger frontend hook"
App.Uploader-Component -> User: "8. Update UI with file URL"
```

### Basic Usage

To get started, initialize the middleware in your Express application and mount it on a specific route. The most critical option is `onUploadFinish`, which is where you'll define what happens after a file is successfully saved.

```javascript Basic Backend Setup icon=logos:express
import express from 'express';
import { initLocalStorageServer } from '@blocklet/uploader-server';
import Upload from '../models/upload'; // Your database model

const router = express.Router();

// Initialize the uploader server middleware
const localStorageServer = initLocalStorageServer({
  // The directory where uploaded files will be stored
  path: process.env.UPLOAD_DIR,
  express,

  // This callback executes after a file is successfully uploaded
  onUploadFinish: async (req, res, uploadMetadata) => {
    const {
      id: filename, // The unique, randomized filename on disk
      size,
      metadata: { filename: originalname, filetype: mimetype },
    } = uploadMetadata;

    // Construct the public URL for the uploaded file
    const fileUrl = new URL(process.env.APP_URL);
    fileUrl.pathname = `/uploads/${filename}`;

    // Save file information to your database
    const doc = await Upload.insert({
      mimetype,
      originalname,
      filename,
      size,
      url: fileUrl.href,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user.did,
    });

    // Return the database document as a JSON response
    // This data will be passed to the frontend's onUploadFinish callback
    return doc;
  },
});

// Mount the middleware on the '/uploads' route
// Ensure any necessary authentication/authorization middleware runs before it
router.use('/uploads', yourAuthMiddleware, localStorageServer.handle);

export default router;
```

### Configuration Options

The `initLocalStorageServer` function accepts an options object with the following properties:

<x-field data-name="path" data-type="string" data-required="true" data-desc="The absolute path to the directory where uploaded files will be stored."></x-field>

<x-field data-name="express" data-type="Function" data-required="true" data-desc="The Express application instance."></x-field>

<x-field data-name="onUploadFinish" data-type="Function" data-required="false" data-desc="An async callback that runs after a file upload is complete. It receives (req, res, uploadMetadata). The return value is sent as a JSON response to the frontend."></x-field>

<x-field data-name="onUploadCreate" data-type="Function" data-required="false" data-desc="An async callback that runs when a new upload is initiated but before any data is transferred. Useful for validation. It receives (req, res, uploadMetadata)."></x-field>

<x-field data-name="expiredUploadTime" data-type="Number" data-required="false" data-default="259200000" data-desc="The time in milliseconds after which incomplete uploads are considered expired and will be cleaned up by a background job. Defaults to 3 days."></x-field>

<x-field data-name="...restProps" data-type="object" data-required="false" data-desc="Any other valid options for the underlying @tus/server package will be passed through."></x-field>

### Callbacks in Detail

#### `onUploadFinish(req, res, uploadMetadata)`

This is the primary callback for processing completed uploads. It's the ideal place to save file metadata to your database, trigger webhooks, or perform other post-upload actions.

**`uploadMetadata` Object**

The `uploadMetadata` object passed to the callback contains detailed information about the uploaded file:

<x-field data-name="uploadMetadata" data-type="object" data-desc="Detailed information about the uploaded file.">
  <x-field data-name="id" data-type="string" data-desc="The unique, randomly generated filename on the server's disk."></x-field>
  <x-field data-name="size" data-type="number" data-desc="The total size of the file in bytes."></x-field>
  <x-field data-name="offset" data-type="number" data-desc="The current number of bytes uploaded. Should equal `size` in this callback."></x-field>
  <x-field data-name="metadata" data-type="object" data-desc="An object containing metadata provided by the client.">
    <x-field data-name="filename" data-type="string" data-desc="The original filename from the user's computer."></x-field>
    <x-field data-name="filetype" data-type="string" data-desc="The MIME type of the file (e.g., 'image/jpeg')."></x-field>
  </x-field>
  <x-field data-name="runtime" data-type="object" data-desc="An object with runtime information about the file's location.">
    <x-field data-name="absolutePath" data-type="string" data-desc="The full path to the file on the server's filesystem."></x-field>
  </x-field>
</x-field>

**Return Value**

The value you return from `onUploadFinish` will be serialized into JSON and sent back to the frontend `Uploader` component. This allows you to pass back the database record ID, the public URL, or any other relevant data.

### Key Features

#### Automatic Cleanup

The middleware automatically sets up a background cron job (`auto-cleanup-expired-uploads`) that runs hourly. This job safely removes any partial or expired uploads from the storage directory that have exceeded the `expiredUploadTime`, preventing your server from filling up with incomplete files.

#### EXIF Data Removal

For privacy and security, the middleware automatically attempts to strip EXIF (Exchangeable image file format) metadata from uploaded images (like JPEG and TIFF) after the upload is complete.

### Advanced Usage

#### Manual File Deletion

The returned server instance includes a `delete` method you can use to programmatically remove an uploaded file and its associated metadata file.

```javascript Manually Deleting a File icon=mdi:code-block-tags
import { localStorageServer } from './setup'; // Assuming you exported the instance

async function deleteFile(filename) {
  try {
    await localStorageServer.delete(filename);
    console.log(`Successfully deleted ${filename}`);
  } catch (error) {
    console.error(`Failed to delete ${filename}:`, error);
  }
}
```

---

Now that you know how to handle direct uploads, you might want to enable users to import files from external services.

<x-card data-title="Next: initCompanion(options)" data-icon="lucide:link" data-href="/api-reference/uploader-server/companion">
  Learn how to set up the Companion middleware to allow users to import files from remote sources like Unsplash and direct URLs.
</x-card>