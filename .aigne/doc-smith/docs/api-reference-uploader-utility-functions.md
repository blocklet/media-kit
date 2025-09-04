# Utility Functions

The `@blocklet/uploader/utils` module exports a collection of helper functions designed to simplify common tasks such as file type conversion, URL generation, and advanced manipulation of the Uppy instance. These utilities are used internally by the Uploader component but are also available for use in your application.

---

## File Conversion and Handling

These functions assist in converting between different file formats (Blob, File, Base64) and extracting file metadata.

### `getObjectURL(fileBlob)`

Creates a DOMString containing a URL representing the given `Blob` object. This URL is temporary and tied to the `document` in which it was created.

*   **Parameters**: `fileBlob: Blob` - The file blob to create a URL for.
*   **Returns**: `string | null` - A URL string or null if the input is invalid.

```javascript
import { getObjectURL } from '@blocklet/uploader/utils';

const myBlob = new Blob(['Hello, world!'], { type: 'text/plain' });
const blobUrl = getObjectURL(myBlob);

if (blobUrl) {
  console.log('Blob URL:', blobUrl);
  // You can use this URL in an <a> tag's href or an <img> tag's src
}
```

### `blobToFile(blob, fileName)`

Converts a `Blob` object into a `File` object.

*   **Parameters**:
    *   `blob: Blob` - The source Blob.
    *   `fileName: string` - The name for the new File.
*   **Returns**: `File` - The newly created File object.

### `base64ToFile(base64, fileName)`

Converts a Base64 encoded string into a `File` object.

*   **Parameters**:
    *   `base64: string` - The Base64 string (e.g., from a data URL).
    *   `fileName: string` - The name for the new File.
*   **Returns**: `File` - The newly created File object.

### `getExt(uppyFile)`

Determines the file extension from an Uppy file object by checking its name and MIME type.

*   **Parameters**: `uppyFile: object` - The Uppy file object containing `name` and `type` properties.
*   **Returns**: `string | false` - The file extension or `false` if it cannot be determined.

### `isBlob(file)`

Checks if the provided value is an instance of a `Blob`.

*   **Parameters**: `file: any` - The value to check.
*   **Returns**: `boolean` - `true` if the value is a Blob, otherwise `false`.

### `isSvgFile(file)`

Asynchronously checks if a file is an SVG by inspecting its MIME type, extension, and content.

*   **Parameters**: `file: object` - A file-like object with `type`, `name`, and `data` (Blob) properties.
*   **Returns**: `Promise<boolean>` - A promise that resolves to `true` if the file is likely an SVG.

---

## URL and Path Management

Functions for constructing and manipulating URLs for uploaded files and API endpoints.

### `createImageUrl(filename, width, height, overwritePrefixPath)`

Constructs a URL for an image file stored in the `/uploads/` directory. It can append query parameters for server-side image resizing and respects the configured CDN host.

| Parameter | Type | Description |
|---|---|---|
| `filename` | `string` | The name of the image file. |
| `width` | `number` | Optional. The desired width for resizing. |
| `height` | `number` | Optional. The desired height for resizing. |
| `overwritePrefixPath` | `string` | Optional. A path to use instead of the default `prefixPath`. |

*   **Returns**: `string` - The complete image URL.

```javascript
import { createImageUrl } from '@blocklet/uploader/utils';

// Basic URL
const url = createImageUrl('my-photo.jpg');
// e.g., https://your-app.com/uploads/my-photo.jpg

// Resized URL
const thumbnailUrl = createImageUrl('my-photo.jpg', 200, 200);
// e.g., https://your-app.com/uploads/my-photo.jpg?imageFilter=resize&w=200&h=200
```

### `getDownloadUrl(src)`

Removes image resizing parameters (`w`, `h`, `q`) from a given URL to create a direct download link to the original file.

*   **Parameters**: `src: string` - The source image URL.
*   **Returns**: `string` - The cleaned download URL.

### `getUploaderEndpoint(apiPathProps)`

Generates the final URLs for the Uppy uploader endpoint and the Companion endpoint, taking into account the Media Kit mount point and other configuration.

*   **Parameters**: `apiPathProps: object` - An object containing `uploader` and `companion` path properties.
*   **Returns**: `object` - An object with `uploaderUrl` and `companionUrl` properties.

### `getUrl(...args)`

Joins multiple URL or path segments into a single, clean URL.

*   **Parameters**: `...args: string[]` - A sequence of path segments.
*   **Returns**: `string` - The combined URL.

### `setPrefixPath(apiPathProps)`

Dynamically sets the base path used for API requests, correctly resolving whether to use the application's prefix or the Media Kit's mount point.

*   **Parameters**: `apiPathProps: object` - An object with a `disableMediaKitPrefix` boolean property.

---

## Uppy Instance Enhancement

### `initUppy(currentUppy)`

This is a powerful function that enhances a standard Uppy instance with custom methods and improved behaviors tailored for the Blocklet environment. It adds robust event handling, programmatic controls, and more reliable progress calculation.

*   **Parameters**: `currentUppy: Uppy` - The Uppy instance to enhance.
*   **Returns**: `Uppy` - The enhanced Uppy instance.

**Added Methods and Features:**

*   **Custom Upload Success Events**: A dedicated event bus for upload success.
    *   `onUploadSuccess(file, callback)`: Listens for successful uploads, either for all files or a specific file.
    *   `onceUploadSuccess(file, callback)`: Same as `onUploadSuccess` but only triggers once.
    *   `emitUploadSuccess(file, response)`: Manually triggers the success event.

*   **Programmatic Upload**: A simplified method to upload a file blob directly.
    *   `uploadFile(blobFile: Blob): Promise<object>`: Adds a blob to the queue, uploads it, and returns a promise that resolves with the result upon completion.

*   **Programmatic Modal Control**:
    *   `onOpen(callback)` / `emitOpen()`: Handle opening the Uploader modal.
    *   `onClose(callback)` / `emitClose()`: Handle closing the Uploader modal.

*   **Improved Logic**:
    *   **Debounced `addFiles`**: Prevents issues from adding many files in rapid succession.
    *   **Rewritten `removeFiles`**: Ensures correct state updates and emits a `file-removed-success` event.
    *   **Enhanced `calculateTotalProgress`**: Provides a more accurate total progress percentage, even with files of unknown size.

```javascript
import Uppy from '@uppy/core';
import { initUppy } from '@blocklet/uploader/utils';

let uppy = new Uppy();
uppy = initUppy(uppy);

// Listen for any successful upload
uppy.onUploadSuccess(({ file, response }) => {
  console.log(`${file.name} uploaded successfully! URL: ${response.uploadURL}`);
});

// Programmatically upload a file
async function uploadMyFile() {
  const myBlob = new Blob(['test content'], { type: 'text/plain' });
  myBlob.name = 'test.txt';
  try {
    const result = await uppy.uploadFile(myBlob);
    console.log('Upload finished:', result);
  } catch (error) {
    console.error('Upload failed:', error);
  }
}
```

---

## API and Network

Pre-configured Axios instances for making HTTP requests.

*   `api`: An Axios instance configured for general API requests within the blocklet. It automatically uses the correct `baseURL` based on `prefixPath`.
*   `mediaKitApi`: An Axios instance specifically for communicating with the Media Kit blocklet. It sets the `baseURL` to the Media Kit's mount point and includes the `x-component-did` header required for folder-specific operations.

---

## Mocking and Testing

### `mockUploaderFileResponse(file)`

Generates a complete, mock Uppy file object and response structure from a simple file data object. This is useful for populating the uploader with pre-existing files or for testing purposes without performing an actual upload.

*   **Parameters**: `file: object` - An object containing file details like `fileUrl`, `originalname`, `size`, etc.
*   **Returns**: `object | null` - A comprehensive mock object that mimics the result of a successful TUS upload, or `null` if the input is invalid.

---

## Miscellaneous

### `parseStringToDot(str)`

Truncates a long string, inserting an ellipsis (...) in the middle to keep the beginning and end visible. Useful for displaying long filenames or IDs in a constrained space.

*   **Parameters**: `str: string` - The string to truncate.
*   **Returns**: `string` - The formatted string (e.g., `longstring...part.txt`).