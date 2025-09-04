# Handling Uploads

Once a file is successfully uploaded, you often need to perform actions on both the client and server. On the frontend, you might want to update the UI with the new file's URL. On the backend, you'll almost certainly need to save the file's metadata to a database. This guide covers how to implement these post-upload callbacks.

This process involves distinct steps on the frontend and backend, which work together to create a complete workflow.

```d2
direction: down

Frontend: {
  shape: rectangle
  Uploader-Component: {
    label: "<Uploader />"
    shape: package
  }
}

Backend: {
  shape: rectangle
  Uploader-Server: {
    label: "@blocklet/uploader-server"
    shape: package
  }
  Database: {
    shape: cylinder
  }
}

Frontend.Uploader-Component -> Backend.Uploader-Server: "1. File uploaded"
Backend.Uploader-Server -> Backend.Database: "2. onUploadFinish hook saves metadata"
Backend.Uploader-Server -> Frontend.Uploader-Component: "3. Server responds with file data"
Frontend.Uploader-Component -> Frontend.Uploader-Component: "4. onUploadFinish prop updates UI"

```

## Frontend: The `onUploadFinish` Prop

The `<Uploader />` component provides an `onUploadFinish` prop, a callback function that fires on the client-side after each individual file upload is successfully completed. This is the ideal place to handle UI updates, such as closing the uploader modal or displaying the uploaded file's URL.

This callback receives a `result` object containing detailed information about the completed upload, including the response from the server.

**Example: Using `onUploadFinish` in a React Component**

```jsx
import React from 'react';
import Uploader from '@blocklet/uploader/react';

function MyComponent() {
  const handleUploadFinish = (result) => {
    console.log('File upload finished!');
    console.log('File details:', result.file);
    console.log('Final URL:', result.uploadURL);
    console.log('Server response:', result.data); // Data from your backend's onUploadFinish

    // Example: Display an alert with the new file URL
    if (result.data?.url) {
      alert(`Upload successful! File available at: ${result.data.url}`);
    }
  };

  return (
    <Uploader
      popup
      onUploadFinish={handleUploadFinish}
      // ... other props
    />
  );
}

export default MyComponent;
```

In this example, `handleUploadFinish` logs the file details and the server's response. The `result.data` field directly corresponds to the JSON object returned by your backend's `onUploadFinish` handler, connecting the client and server logic.

## Backend: The `onUploadFinish` Callback

For persistent actions, you must use the `onUploadFinish` callback when initializing the server middleware. This function runs on the server after a file is fully received, making it the correct place to save file metadata to your database, associate the file with a user, or perform other critical backend tasks.

When you configure `initLocalStorageServer`, you pass your custom `onUploadFinish` function in its options.

**Example: Saving File Metadata to a Database**

```javascript
import { initLocalStorageServer } from '@blocklet/uploader-server';
import express from 'express';

// Assume `Upload` is your database model
import Upload from '../models/upload';

const app = express();

const localStorageServer = initLocalStorageServer({
  path: env.uploadDir, // Your configured upload directory
  express,
  onUploadFinish: async (req, res, uploadMetadata) => {
    const {
      id: filename, // The unique filename on disk (e.g., hash + extension)
      size,
      metadata: { filename: originalname, filetype: mimetype },
    } = uploadMetadata;

    // Construct the public URL for the file
    const fileUrl = new URL(env.appUrl);
    fileUrl.pathname = `/uploads/${filename}`;

    // Save metadata to your database
    const doc = await Upload.insert({
      mimetype,
      originalname,
      filename,
      size,
      folderId: req.componentDid, // Associate with the component
      createdBy: req.user.did, // Associate with the logged-in user
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // This object will be sent as the JSON response to the frontend
    const responseData = { url: fileUrl.href, ...doc };

    return responseData;
  },
});

// Mount the middleware
router.use('/uploads', localStorageServer.handle);
```

### `uploadMetadata` Object

The `uploadMetadata` object passed to the backend callback contains essential information about the uploaded file:

| Property | Type | Description |
|---|---|---|
| `id` | `string` | The unique, hashed filename stored on the server's file system. |
| `size` | `number` | The total size of the file in bytes. |
| `metadata.filename` | `string` | The original filename from the user's computer. |
| `metadata.filetype` | `string` | The MIME type of the file (e.g., `image/jpeg`). |
| `metadata.relativePath` | `string` | The relative path if a folder was uploaded. |
| `runtime.absolutePath` | `string` | The absolute path to the file on the server. |

By returning a JSON object from this function, you send that data directly back to the frontend's `onUploadFinish` prop, completing the upload cycle.

---

With both frontend and backend handlers in place, you can build a robust upload workflow. To further enhance the uploader, you might want to allow users to import files from external services.

To learn how, proceed to the next guide.

<x-cards>
  <x-card data-title="Integrating Remote Sources (Companion)" data-icon="lucide:link" data-href="/guides/remote-sources">
    Set up Companion to let users import files from URLs and services like Unsplash.
  </x-card>
</x-cards>
