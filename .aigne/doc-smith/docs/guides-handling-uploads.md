# Handling Uploads

Once a file is selected and the upload process begins, you often need to perform actions on both the client and server. On the frontend, you might want to update the UI with the final URL of the uploaded file. On the backend, you'll likely need to save the file's metadata to a database. This guide covers the essential callbacks for managing the upload lifecycle.

This guide will walk you through:

*   Capturing upload completion events on the frontend using `@blocklet/uploader`.
*   Processing successfully uploaded files on the backend with `@blocklet/uploader-server`.

## Frontend: Reacting to Uploads

The `<Uploader />` component provides several callback props that allow you to hook into different stages of the upload process. The most important one for handling a completed upload is `onUploadFinish`.

### `onUploadFinish`

This function is called for each file after it has been successfully uploaded and the server has processed it. It receives the final response from the server, which is ideal for getting the permanent URL of the uploaded file.

**Prop Signature**

```typescript
onUploadFinish?: (result: any) => void;
```

The `result` object contains valuable information, including the file object and the server's response.

| Key         | Type     | Description                                                                 |
|-------------|----------|-----------------------------------------------------------------------------|
| `uploadURL` | `string` | The final, publicly accessible URL of the uploaded file.                    |
| `file`      | `object` | The Uppy file object with details like name, type, and size.                |
| `data`      | `object` | The JSON body returned by your backend's `onUploadFinish` handler.          |
| `status`    | `number` | The HTTP status code of the final upload request (e.g., 200).                 |
| `headers`   | `object` | The response headers from the server.                                       |

**Example Usage**

Here's how you can use `onUploadFinish` to capture the uploaded file's URL and store it in your component's state.

```jsx
import React, { useState } from 'react';
import { Uploader } from '@blocklet/uploader/react';

export default function MyComponent() {
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');

  const handleUploadFinish = (result) => {
    console.log('File uploaded successfully:', result);
    // The `data` field contains the JSON response from your server
    if (result.status === 200 && result.data?.url) {
      setUploadedFileUrl(result.data.url);
    }
  };

  return (
    <div>
      <Uploader onUploadFinish={handleUploadFinish} popup />
      {uploadedFileUrl && (
        <div>
          <p>Upload complete!</p>
          <img src={uploadedFileUrl} alt="Uploaded content" width="200" />
        </div>
      )}
    </div>
  );
}
```

### `onChange`

If you need to react to files being added or removed *before* an upload starts, you can use the `onChange` prop.

```typescript
onChange?: (file: object, files: object[]) => void;
```

This function is triggered whenever the list of files in Uppy changes. It receives the file that was just changed and an array of all current files.

## Backend: Processing Uploads

On the server, you process uploads by providing an `onUploadFinish` callback to the `initLocalStorageServer` function. This callback is the central point for integrating the upload process with your application's logic, such as saving file details to a database.

### `onUploadFinish`

This function is executed after a file has been completely received and stored in the specified directory. It's an `async` function where you can perform database operations and determine the final JSON response sent back to the client.

**Callback Signature**

```javascript
onUploadFinish: async (req, res, uploadMetadata) => { /* ... */ }
```

The `uploadMetadata` object is the most important parameter, containing all the necessary details about the uploaded file.

**`uploadMetadata` Object**

| Key                      | Type     | Description                                                              |
|--------------------------|----------|--------------------------------------------------------------------------|
| `id`                     | `string` | The unique, hashed filename used for storage on the server.              |
| `size`                   | `number` | The total size of the file in bytes.                                     |
| `metadata`               | `object` | An object containing metadata sent from the client.                      |
| `metadata.filename`      | `string` | The original name of the file.                                           |
| `metadata.filetype`      | `string` | The MIME type of the file (e.g., `image/jpeg`).                            |
| `runtime.absolutePath`   | `string` | The absolute file path on the server's disk.                             |

**Example Implementation**

In this example, after a file is uploaded, we construct its public URL, save its details to a database (using a fictional `Upload` model), and return the database document as the JSON response.

```javascript
import { initLocalStorageServer } from '@blocklet/uploader-server';
import express from 'express';
import joinUrl from 'url-join';

// Assume `Upload` is your database model
// import Upload from '../models/upload';

const localStorageServer = initLocalStorageServer({
  path: env.uploadDir, // Directory to store files
  express,
  onUploadFinish: async (req, res, uploadMetadata) => {
    const {
      id: filename, // The unique, stored filename
      size,
      metadata: { filename: originalname, filetype: mimetype },
    } = uploadMetadata;

    // Construct the public URL for the file
    const obj = new URL(env.appUrl);
    obj.pathname = joinUrl('/uploads', filename);

    // Save file metadata to the database
    const doc = await Upload.insert({
      mimetype,
      originalname,
      filename, // Stored filename
      size,
      url: obj.href,
      createdBy: req.user.did, // Assuming user is available on the request
      createdAt: new Date().toISOString(),
    });

    // The returned object will be sent as the JSON response to the frontend.
    // The frontend's onUploadFinish will receive this data.
    const resData = { url: obj.href, ...doc };
    return resData;
  },
});

router.use('/uploads', user, auth, localStorageServer.handle);
```

## End-to-End Upload Flow

The following diagram illustrates the complete interaction between the frontend and backend when a file is uploaded.

```d2
shape: sequence_diagram
direction: right

User: "User"
Uploader: "<Uploader /> Component"
Server: "Backend Server"
DB: "Database"

User -> Uploader: "1. Selects a file"
Uploader.t1 -> Uploader.t1: "onChange event fires"
User -> Uploader: "2. Clicks 'Upload'"
Uploader -> Server: "3. Uploads file via TUS protocol"

sub_process: "Backend Processing" {
  Server.t1 -> Server.t1: "4. File saved to disk"
  Server.t1 -> Server.t1: "5. Executes onUploadFinish callback"
  Server.t1 -> DB: "6. Saves metadata (URL, size, etc.)"
  DB -> Server.t1: "7. Returns saved document"
  Server.t1 -> Uploader: "8. Sends JSON response (e.g., { url, ... })" {style.stroke: green}
}

Uploader.t2 -> Uploader.t2: "9. `onUploadFinish` prop is called with server response" {style.stroke: green}
Uploader.t2 -> User: "10. UI is updated with final file URL"

```

By using the `onUploadFinish` hooks on both the client and server, you can create a robust and seamless upload experience that integrates fully with your application's data model.

Now that you know how to handle direct uploads, you might want to enable users to import files from other services. Proceed to the next guide to learn how to set up remote sources.

<x-card data-title="Integrating Remote Sources (Companion)" data-icon="lucide:external-link" data-href="/guides/remote-sources" data-cta="Read More">
  Set up the Companion middleware to allow users to import files from remote sources like Unsplash and direct URLs.
</x-card>