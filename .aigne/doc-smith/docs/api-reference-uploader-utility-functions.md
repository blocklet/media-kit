# Utility Functions

The `@blocklet/uploader/utils` module exports a collection of helper functions designed to simplify common tasks such as file type conversions, URL generation, and direct manipulation of the Uppy instance. These utilities provide convenient shortcuts for functionalities you might otherwise need to implement yourself.

## File and Blob Manipulation

These functions help you convert between different file representations and extract file information.

### `getObjectURL(fileBlob)`

Creates a local, temporary URL for a `Blob` or `File` object. This is useful for creating client-side previews of images before they are uploaded.

| Parameter | Type | Description |
|---|---|---|
| `fileBlob` | `Blob` | The file blob to create a URL for. |

**Returns:** `string | null` - A temporary object URL, or `null` if the input is invalid.

```javascript
import { getObjectURL } from '@blocklet/uploader/utils';

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    const previewUrl = getObjectURL(file);
    // Now you can use previewUrl in an <img> tag
    console.log(previewUrl);
  }
};
```

### `blobToFile(blob, fileName)`

Converts a `Blob` object into a `File` object, which is required by Uppy for uploads.

| Parameter | Type | Description |
|---|---|---|
| `blob` | `Blob` | The source blob. |
| `fileName` | `string` | The desired file name for the new `File` object. |

**Returns:** `File`

### `base64ToFile(base64, fileName)`

Converts a Base64 encoded string into a `File` object.

| Parameter | Type | Description |
|---|---|---|
| `base64` | `string` | The Base64 string (e.g., from a canvas or data URL). |
| `fileName` | `string` | The desired file name. |

**Returns:** `File`

```javascript
import { base64ToFile } from '@blocklet/uploader/utils';

const dataURL = canvas.toDataURL('image/png');
const imageFile = base64ToFile(dataURL, 'canvas-image.png');
// Now imageFile can be added to Uppy
```

### `isSvgFile(file)`

Asynchronously checks if a file is an SVG by inspecting its MIME type, extension, and content.

| Parameter | Type | Description |
|---|---|---|
| `file` | `object` | An object with `type`, `name`, and `data` (Blob) properties. |

**Returns:** `Promise<boolean>`

### `getExt(uppyFile)`

Determines the file extension from an Uppy file object by looking at its MIME type and name.

| Parameter | Type | Description |
|---|---|---|
| `uppyFile` | `object` | An Uppy file object containing `type` and `name`. |

**Returns:** `string | false` - The file extension or `false` if it cannot be determined.

## URL Management

Functions for constructing and manipulating URLs for assets and API endpoints.

### `createImageUrl(filename, width, height, overwritePrefixPath)`

Constructs a complete URL for an uploaded image, optionally including query parameters for server-side resizing. This function automatically uses the `CDN_HOST` if available.

| Parameter | Type | Description |
|---|---|---|
| `filename` | `string` | The name of the file in the uploads directory. |
| `width` | `number` | Optional. The desired width for resizing. |
| `height` | `number` | Optional. The desired height for resizing. |
| `overwritePrefixPath` | `string` | Optional. A path to use instead of the default prefix. |

**Returns:** `string` - The full image URL.

```javascript
import { createImageUrl } from '@blocklet/uploader/utils';

// Generates a URL like: https://cdn.example.com/uploads/my-image.jpg?imageFilter=resize&w=300
const thumbnailUrl = createImageUrl('my-image.jpg', 300);
```

### `getDownloadUrl(src)`

Removes image resizing parameters (`w`, `h`, `q`) from a URL to create a link to the original, full-sized asset.

| Parameter | Type | Description |
|---|---|---|
| `src` | `string` | The source image URL. |

**Returns:** `string` - A clean URL for downloading the original file.

### `getUploaderEndpoint(apiPathProps)`

Constructs the `uploaderUrl` (for Tus uploads) and `companionUrl` (for remote sources) based on the component's props and the environment (e.g., whether Media Kit is present).

| Parameter | Type | Description |
|---|---|---|
| `apiPathProps` | `object` | An object containing paths like `uploader` and `companion`. |

**Returns:** `object` - An object with `uploaderUrl` and `companionUrl` properties.

## Uppy Instance Helpers

These functions are used to interact with or enhance the Uppy instance.

### `initUppy(currentUppy)`

This is a powerful function that enhances a standard Uppy instance with custom methods and event listeners. The `<Uploader />` component calls this internally, but you can use it if you are managing your own Uppy instance.

**Added Methods & Features:**

*   **Event Handling:** Adds robust `onUploadSuccess`, `onceUploadSuccess`, and `offUploadSuccess` methods for easier handling of successful uploads.
*   **Programmatic Uploads:** Adds an `async uploadFile(blobFile)` method that allows you to upload a file programmatically and get a promise that resolves with the result.
*   **Dashboard Events:** Adds `onOpen()` and `onClose()` helpers to listen for the Uploader's modal opening and closing.
*   **Improved Logic:** Overwrites internal methods like `removeFiles` and `calculateTotalProgress` for better integration.

```javascript
import Uppy from '@uppy/core';
import { initUppy } from '@blocklet/uploader/utils';

// 1. Create a standard Uppy instance
let uppy = new Uppy();

// 2. Enhance it with custom methods
uppy = initUppy(uppy);

// 3. Now you can use the added methods
uppy.onUploadSuccess(({ file, response }) => {
  console.log('File uploaded:', response.body.fileUrl);
});

async function uploadFromCanvas(canvasElement) {
  canvasElement.toBlob(async (blob) => {
    if (blob) {
      try {
        const result = await uppy.uploadFile(blob);
        console.log('Upload successful from function call', result);
      } catch (error) {
        console.error('Upload failed', error);
      }
    }
  }, 'image/png');
}
```

### `mockUploaderFileResponse(file)`

Creates a mock Uppy file response object. This is extremely useful for adding pre-existing files (e.g., files already uploaded and stored in a database) to the Uploader's UI, making them appear as if they were just successfully uploaded.

| Parameter | Type | Description |
|---|---|---|
| `file` | `object` | An object containing details of the existing file, such as `fileUrl`, `originalname`, `size`, `mimetype`, etc. |

**Returns:** `object | null` - A complete Uppy file object that can be passed to `uppy.addFile()` and used to emit a mock success event.

```javascript
import { mockUploaderFileResponse } from '@blocklet/uploader/utils';

// An existing file from your database
const existingFile = {
  fileUrl: 'https://example.com/uploads/existing.jpg',
  originalname: 'existing.jpg',
  size: 123456,
  mimetype: 'image/jpeg',
  _id: 'file123',
};

// Create the mock response
const mockResponse = mockUploaderFileResponse(existingFile);

if (mockResponse) {
  // Add the file to Uppy's state and UI
  uppy.addFile(mockResponse.file);
  // Manually emit the success event so it appears in the 'Uploaded' list
  uppy.emitUploadSuccess(mockResponse.file, mockResponse.responseResult);
}
```

## Miscellaneous

### `parseStringToDot(str)`

Truncates a long string with an ellipsis in the middle, preserving the beginning and end. This is useful for displaying long file names or hashes in a compact UI.

| Parameter | Type | Description |
|---|---|---|
| `str` | `string` | The input string. |

**Returns:** `string` - The truncated string (e.g., `long-fil...me.txt`).