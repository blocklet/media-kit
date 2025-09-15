# Handling Uploads

After a file is successfully uploaded, you often need to perform actions on both the client and server. This guide explains how to use the `onUploadFinish` callback in both the `@blocklet/uploader` frontend component and the `@blocklet/uploader-server` middleware to process files and their metadata.

The frontend callback is ideal for updating the UI, while the backend callback is used for server-side tasks like saving file information to a database.

### The Upload Flow

The following diagram illustrates the complete process, from a user dropping a file to the final UI update, showing how the frontend and backend callbacks work together.

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
    }

    DB: {
      label: "Database"
      shape: cylinder
    }
  }
}

User -> App.Uploader-Component: "1. Drop file"
App.Uploader-Component -> App.Backend-Server.Uploader-Server: "2. Upload file (Tus)"
App.Backend-Server.Uploader-Server -> App.Backend-Server.Uploader-Server: "3. Trigger backend onUploadFinish"
App.Backend-Server.Uploader-Server -> App.Backend-Server.DB: "4. Save metadata"
App.Backend-Server.DB -> App.Backend-Server.Uploader-Server: "5. Return DB record"
App.Backend-Server.Uploader-Server -> App.Uploader-Component: "6. Send JSON response"
App.Uploader-Component -> App.Uploader-Component: "7. Trigger frontend onUploadFinish"
App.Uploader-Component -> User: "8. Update UI with file URL"
```

---

## Frontend: `onUploadFinish` Prop

The `Uploader` component accepts an `onUploadFinish` prop, which is a function that executes after each file upload is complete. This callback receives the JSON response sent from your backend's `onUploadFinish` handler.

This is the perfect place to update your application's state, display the uploaded image, or store the returned file URL.

**Prop Definition**

<x-field data-name="onUploadFinish" data-type="(result: any) => void" data-desc="A callback function that receives the final upload result object after the backend has processed the file."></x-field>

**Example Usage**

In this example, we use the `onUploadFinish` callback to receive the file URL from the backend and store it in the component's state.

```javascript Uploader Component icon=logos:react
import { Uploader } from '@blocklet/uploader/react';
import { useState } from 'react';

export default function MyComponent() {
  const [fileUrl, setFileUrl] = useState('');

  const handleUploadFinish = (result) => {
    // The 'result' object contains the JSON response from your backend
    console.log('Upload finished:', result);

    // 'result.data' contains the body returned by the server
    if (result.data && result.data.url) {
      setFileUrl(result.data.url);
    }
  };

  return (
    <div>
      <Uploader onUploadFinish={handleUploadFinish} />
      {fileUrl && (
        <div>
          <p>Upload successful!</p>
          <img src={fileUrl} alt="Uploaded content" width="200" />
        </div>
      )}
    </div>
  );
}
```

The `result` object passed to the frontend callback contains detailed information about the upload, including the response from the server.

**Example `result` Object**

```json
{
  "uploadURL": "http://localhost:3030/api/uploads/f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6.png",
  "data": {
    "url": "http://localhost:3030/uploads/f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6.png",
    "_id": "z2k...",
    "mimetype": "image/png",
    "originalname": "screenshot.png",
    "filename": "f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6.png",
    "size": 123456,
    "folderId": "component_did",
    "createdBy": "user_did",
    "updatedBy": "user_did",
    "createdAt": "2023-10-27T10:00:00.000Z",
    "updatedAt": "2023-10-27T10:00:00.000Z"
  },
  "method": "POST",
  "url": "http://localhost:3030/api/uploads/f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6.png",
  "status": 200,
  "headers": {},
  "file": { 
    "id": "uppy-screenshot-1N/png-1-1672531200000",
    "name": "screenshot.png",
    "size": 123456
   }
}
```

---

## Backend: `onUploadFinish` Option

On the server, you provide an `onUploadFinish` function when initializing the `initLocalStorageServer`. This function is triggered after a file has been fully received and stored on the server's local disk, but before a final response is sent to the client.

This is where you should handle your core business logic, such as:
- Validating the uploaded file.
- Saving file metadata to a database.
- Associating the file with the current user.
- Returning a custom JSON object to the frontend.

**Function Signature**

```typescript
(req: Request, res: Response, uploadMetadata: object) => Promise<any>
```

- `req`: The Express request object, containing headers and user information.
- `res`: The Express response object.
- `uploadMetadata`: An object containing details about the uploaded file.

**Example Usage**

This example demonstrates how to save file metadata to a database (using a fictional `Upload` model) and return the created record to the frontend.

```javascript Backend Server Setup icon=logos:nodejs
import { initLocalStorageServer } from '@blocklet/uploader-server';
import express from 'express';
import { joinUrl } from 'url-join';

// Assume 'Upload' is your database model
// import Upload from '../models/upload';

const app = express();

const localStorageServer = initLocalStorageServer({
  path: process.env.UPLOAD_DIR,
  express,
  onUploadFinish: async (req, res, uploadMetadata) => {
    const {
      id: filename, // The unique, hashed filename on disk
      size,
      metadata: { filename: originalname, filetype: mimetype },
    } = uploadMetadata;

    // Construct the public URL for the file
    const fileUrl = new URL(process.env.APP_URL);
    fileUrl.pathname = joinUrl('/api/uploads', filename);

    // Save file metadata to your database
    const doc = {
      mimetype,
      originalname,
      filename, // Hashed filename
      size,
      folderId: req.componentDid, // DID of the component where the upload happened
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user.did, // Assumes user authentication middleware
      updatedBy: req.user.did,
    };
    // await Upload.insert(doc);

    // The returned object will be sent as the JSON response to the frontend
    const responseData = { url: fileUrl.href, ...doc };

    return responseData;
  },
});

// Mount the uploader middleware
app.use('/api/uploads', localStorageServer.handle);
```

**`uploadMetadata` Object Details**

The `uploadMetadata` object provides crucial information about the file:

```json
{
  "id": "f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6.png",
  "size": 123456,
  "offset": 123456,
  "is_final": true,
  "metadata": {
    "relativePath": null,
    "name": "screenshot.png",
    "filename": "screenshot.png",
    "type": "image/png",
    "filetype": "image/png",
    "uploaderId": "Uploader"
  },
  "runtime": {
    "relativePath": null,
    "absolutePath": "/path/to/uploads/f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6.png",
    "size": 123456,
    "hashFileName": "f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6.png",
    "originFileName": "screenshot.png",
    "type": "image/png",
    "fileType": "image/png"
  }
}
```

By implementing both callbacks, you create a robust upload pipeline that seamlessly connects user actions in the browser with your server-side business logic.

<x-card data-title="Integrating Remote Sources (Companion)" data-icon="lucide:link" data-href="/guides/remote-sources">
Learn how to set up the Companion middleware to allow users to import files from direct URLs and other services.
</x-card>