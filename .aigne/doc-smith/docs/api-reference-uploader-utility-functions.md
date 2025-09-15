# Utility Functions

The `@blocklet/uploader/utils` module exports a collection of helper functions designed to simplify common tasks associated with file handling, URL manipulation, Uppy instance customization, and network configuration. These utilities are used internally by the Uploader component but are also available for you to use in your application for more advanced integrations.

## File & Blob Manipulation

These functions help you work with different file formats and representations, such as Blobs, base64 strings, and File objects.

| Function | Description |
| --- | --- |
| `isBlob(file)` | Checks if the given input is an instance of a `Blob`. |
| `getObjectURL(fileBlob)` | Creates a local object URL (e.g., `blob:http://...`) from a `Blob` or `File` object, which can be used for client-side previews. |
| `blobToFile(blob, fileName)` | Converts a `Blob` object into a `File` object, assigning it the specified file name. |
| `base64ToFile(base64, fileName)` | Converts a base64 encoded string into a `File` object. Useful for handling data URLs. |
| `isSvgFile(file)` | Asynchronously checks if a file is an SVG by examining its MIME type, extension, and content. |
| `getExt(uppyFile)` | Extracts the file extension from an Uppy file object, using both its name and MIME type for accuracy. |

### Example: Converting Base64 to a File

```javascript icon=logos:javascript
import { base64ToFile, getObjectURL } from '@blocklet/uploader/utils';

const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...';
const imageFile = base64ToFile(base64Image, 'my-image.png');

// Now you can use this file object, for example, to create a preview
const previewUrl = getObjectURL(imageFile);
console.log(previewUrl);

// Or add it to an Uppy instance
// uppy.addFile({ name: imageFile.name, type: imageFile.type, data: imageFile });
```

## URL & Path Management

Functions for constructing and manipulating URLs, especially for interacting with the Media Kit's CDN and the uploader's backend endpoints.

| Function | Description |
| --- | --- |
| `createImageUrl(filename, width, height, overwritePrefixPath)` | Constructs a URL for an image stored in the Media Kit. It can append query parameters for on-the-fly resizing (`w`, `h`). |
| `getDownloadUrl(src)` | Takes a Media Kit image URL and removes resizing parameters (`w`, `h`, `q`) to create a URL for downloading the original file. |
| `getUploaderEndpoint(apiPathProps)` | Generates the absolute URLs for the uploader (Tus) and Companion endpoints based on the props passed to the `Uploader` component. |
| `setPrefixPath(apiPathProps)` | Sets the internal prefix path used for API requests, allowing you to override the default behavior of using the Media Kit's mount point. |

### Example: Generating a Resized Image URL

```javascript icon=logos:javascript
import { createImageUrl } from '@blocklet/uploader/utils';

// Generates a URL for 'photo.jpg' with a width of 200px
const thumbnailUrl = createImageUrl('photo.jpg', 200);
// Result: https://your-cdn.com/uploads/photo.jpg?imageFilter=resize&w=200

// Generates a URL for the same image with both width and height
const sizedImageUrl = createImageUrl('photo.jpg', 400, 300);
// Result: https://your-cdn.com/uploads/photo.jpg?imageFilter=resize&w=400&h=300
```

## Uppy Instance Enhancement

### `initUppy(uppyInstance)`

This function enhances a standard Uppy core instance with custom methods, event handlers, and improved logic tailored for the Blocklet environment. It's automatically used by the `<Uploader />` component but can be used manually if you are creating your own Uppy instance.

**Key Enhancements:**

*   **Custom Success Events**: Adds a robust event system for handling successful uploads.
    *   `uppy.onUploadSuccess(file, callback)`: Listen for successful uploads, optionally for a specific file.
    *   `uppy.onceUploadSuccess(file, callback)`: Same as above, but the listener is removed after one execution.
    *   `uppy.emitUploadSuccess(file, response)`: Manually trigger the success event.
*   **Programmatic Upload**: Adds an `async` helper method for easy programmatic uploads.
    *   `uppy.uploadFile(blobFile)`: Takes a `Blob` or `File` object, adds it to Uppy, uploads it, and returns a Promise that resolves with the upload result.
*   **Custom Open/Close Events**: Provides a clean way to listen for the Uploader Dashboard being opened or closed.
    *   `uppy.onOpen(callback)` / `uppy.onClose(callback)`
*   **Improved Logic**: Overrides default Uppy methods like `removeFiles` and `calculateTotalProgress` to better integrate with the backend and provide more accurate progress reporting.

### Example: Programmatic Upload with `initUppy`

```javascript icon=logos:javascript
import Uppy from '@uppy/core';
import { initUppy } from '@blocklet/uploader/utils';

// 1. Create a standard Uppy instance
let uppy = new Uppy();

// 2. Enhance it with custom methods
uppy = initUppy(uppy);

async function uploadMyFile(fileBlob) {
  try {
    console.log('Starting upload...');
    const result = await uppy.uploadFile(fileBlob);
    console.log('Upload successful!', result.response.data.fileUrl);
  } catch (error) {
    console.error('Upload failed:', error);
  }
}

// Create a dummy file and upload it
const myFile = new File(['hello world'], 'hello.txt', { type: 'text/plain' });
uploadMyFile(myFile);
```

## Mocking & Testing

### `mockUploaderFileResponse(file)`

This utility is invaluable for testing or for adding pre-existing files to the Uploader's UI without actually uploading them. It takes a simple file object and generates a complete, Uppy-compatible response object that mimics a successful Tus upload.

This allows you to populate the dashboard with files that are already stored in your Media Kit.

### Example: Adding an Existing File to the UI

```javascript icon=logos:javascript
import { mockUploaderFileResponse } from '@blocklet/uploader/utils';

// Assume 'uppy' is your initialized Uppy instance

// 1. Define your existing file data
const existingFile = {
  fileUrl: 'https://domain.com/uploads/existing-image.png',
  originalname: 'existing-image.png',
  mimetype: 'image/png',
  size: 12345,
  _id: 'file123',
};

// 2. Generate the mock response
const mockResponse = mockUploaderFileResponse(existingFile);

// 3. Add the file to Uppy's state and emit the success event
if (mockResponse) {
  uppy.addFile(mockResponse.file);
  uppy.emit('upload-success', mockResponse.file, mockResponse.responseResult);
}
```

## Miscellaneous Helpers

| Function | Description |
| --- | --- |
| `parseStringToDot(str)` | Truncates a string that is longer than 12 characters with an ellipsis in the middle (e.g., `longstringname.txt` becomes `longst...e.txt`). Useful for display purposes. |
