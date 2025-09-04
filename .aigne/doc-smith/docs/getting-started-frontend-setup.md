# Frontend Setup (@blocklet/uploader)

This guide provides a step-by-step walkthrough for installing and rendering the `@blocklet/uploader` component in your React application. This package provides a complete, Uppy-based UI for file uploads that integrates seamlessly with the Blocklet ecosystem.

## 1. Install the Package

First, add the `@blocklet/uploader` package to your project's dependencies. You can use pnpm, yarn, or npm.

```bash
pnpm add @blocklet/uploader
```

## 2. Import Uppy's CSS

The uploader component relies on the core stylesheets from Uppy for its appearance. You need to import them into your application's main entry point (e.g., `src/index.js` or `src/App.js`).

```javascript
// Import essential Uppy styles
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';

// If you plan to use specific plugins, you'll need their styles too
// import '@uppy/webcam/dist/style.min.css';
// import '@uppy/image-editor/dist/style.min.css';
```

## 3. Render the Uploader

The easiest way to integrate the uploader is by using the `UploaderProvider` and `UploaderTrigger` components. The `UploaderProvider` manages the uploader's state and configuration, while `UploaderTrigger` wraps the element that will open the upload modal.

Here is a basic example of a button that launches the uploader popup:

```jsx
import React from 'react';
import { UploaderProvider, UploaderTrigger } from '@blocklet/uploader';

function App() {
  const handleUploadFinish = (result) => {
    // The 'result' object contains the server response after a successful upload.
    // 'result.data' holds the file's metadata.
    console.log('File uploaded successfully:', result.data);
    alert(`Upload complete: ${result.data.filename}`);
  };

  return (
    <UploaderProvider popup onUploadFinish={handleUploadFinish}>
      <UploaderTrigger>
        <button type="button">Upload File</button>
      </UploaderTrigger>
    </UploaderProvider>
  );
}

export default App;
```

In this example:
- `UploaderProvider` wraps the part of your application that needs access to the uploader.
- The `popup` prop configures the uploader to appear as a modal dialog.
- `onUploadFinish` is a callback function that executes after each file is successfully uploaded, providing access to the file's final data.
- `UploaderTrigger` makes its child element (the `<button>`) clickable to open the uploader modal.

## How It Works

The `@blocklet/uploader` component is designed for easy integration. It operates in two main ways:

1.  **With Media Kit:** If a [Media Kit blocklet](./concepts-media-kit-integration.md) is installed in the same environment, the uploader will automatically detect it. It will then route all uploads to the Media Kit and enable additional features like AI image generation and browsing previously uploaded assets.

2.  **Standalone:** The `@blocklet/uploader` component does **not** require `@blocklet/uploader-server` to function. If no Media Kit is found, it will attempt to send files to a default endpoint (`/api/uploads`). You would only need to implement this backend endpoint yourself if you are building a custom upload handler outside of the Media Kit ecosystem.

## Next Steps

You now have a working frontend uploader. 

- If you need to build a custom backend to receive the uploaded files, proceed to the [Backend Setup (@blocklet/uploader-server)](./getting-started-backend-setup.md) guide.
- To learn how to enable features like the image editor, webcam, or URL importing, see the [Configuring Plugins](./guides-configuring-plugins.md) guide.
- For a complete list of all available settings, explore the [<Uploader /> Component Props](./api-reference-uploader-component-props.md) API reference.