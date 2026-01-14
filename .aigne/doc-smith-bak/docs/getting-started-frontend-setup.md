# Frontend Setup (@blocklet/uploader)

This guide will walk you through the process of installing and integrating the `@blocklet/uploader` React component into your Blocklet. This component provides a feature-rich user interface for file uploads, built upon the robust and extensible [Uppy](https://uppy.io/) file uploader.

By the end of this guide, you will have a working Uploader component in your application, ready to be connected to a backend service. For a seamless experience, we recommend using our companion backend package, which you can learn about in the [Backend Setup](./getting-started-backend-setup.md) guide.

## 1. Installation

First, add the `@blocklet/uploader` package to your project's dependencies. Open your terminal in your project's root directory and run the following command:

```bash pnpm icon=logos:pnpm
pnpm add @blocklet/uploader
```

## 2. Importing Styles

The Uploader component relies on several CSS files from the Uppy ecosystem for its appearance and functionality. You need to import these stylesheets into your application's entry point (e.g., `src/index.js` or `src/App.js`) to ensure the component renders correctly.

```javascript App Entry Point (e.g., src/App.js) icon=logos:javascript
// Import Uppy's core and plugin styles
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import '@uppy/webcam/dist/style.min.css';
import '@uppy/image-editor/dist/style.min.css';
import '@uppy/drag-drop/dist/style.min.css';
import '@uppy/drop-target/dist/style.min.css';
import '@uppy/status-bar/dist/style.min.css';

// ... the rest of your application's entry file
```

## 3. Basic Usage: Modal Uploader

The simplest way to use the uploader is to render it as a modal dialog. We'll use React's `lazy` loading to improve performance by only loading the component when it's needed.

Here is a complete example of a component that includes a button to open the uploader.

```jsx UploaderButton.js icon=logos:react
import { lazy, useRef, Suspense } from 'react';

// Lazily import the Uploader component
const UploaderComponent = lazy(() => import('@blocklet/uploader').then((res) => ({ default: res.Uploader })));

export default function UploaderButton() {
  const uploaderRef = useRef(null);

  const handleUploadFinish = (result) => {
    // The 'result' object contains details about the uploaded file
    console.log('Upload successful!', result);
    // You can now use the file URL from result.uploadURL or result.data
    alert(`File uploaded to: ${result.uploadURL}`);
  };

  const openUploader = () => {
    // The uploader instance has an `open` method
    uploaderRef.current?.getUploader()?.open();
  };

  return (
    <div>
      <button type="button" onClick={openUploader}>
        Open Uploader
      </button>

      {/* The Uploader component is rendered but hidden until opened */}
      {/* Use Suspense to handle the lazy loading of the component */}
      <Suspense fallback={<div>Loading...</div>}>
        <UploaderComponent
          ref={uploaderRef}
          popup // This prop makes the uploader a modal dialog
          onUploadFinish={handleUploadFinish}
        />
      </Suspense>
    </div>
  );
}
```

In this example:
- We create a `ref` (`uploaderRef`) to get access to the Uploader component's instance methods.
- The `popup` prop configures the uploader to work as a modal dialog, which is managed internally.
- A button's `onClick` handler calls the `open()` method on the uploader instance to make it visible.
- The `onUploadFinish` callback function is triggered after each file successfully uploads, receiving the file's metadata as an argument.

## 4. Advanced Usage: Using the Provider

For more complex applications, you might want to trigger the uploader from various components without passing refs down the component tree. The `@blocklet/uploader` package provides a context-based solution for this scenario with `UploaderProvider` and `UploaderTrigger`.

This approach separates the uploader's state from the components that trigger it.

```jsx App.js icon=logos:react
import { UploaderProvider, UploaderTrigger } from '@blocklet/uploader';

function MyPageComponent() {
  return (
    <div>
      <h2>My Page</h2>
      <p>Click the button below to upload a file.</p>
      {/* UploaderTrigger is a simple wrapper that opens the uploader on click */}
      <UploaderTrigger>
        <button type="button">Upload File</button>
      </UploaderTrigger>
    </div>
  );
}

export default function App() {
  const handleUploadFinish = (result) => {
    console.log('File uploaded from Provider:', result.uploadURL);
  };

  return (
    // Wrap your application or a part of it with UploaderProvider
    <UploaderProvider popup onUploadFinish={handleUploadFinish}>
      <h1>My Application</h1>
      <MyPageComponent />
      {/* You can have another trigger here */}
      <UploaderTrigger>
        <a>Or click this link</a>
      </UploaderTrigger>
    </UploaderProvider>
  );
}

```

### How It Works

1.  **`UploaderProvider`**: This component initializes and holds the Uploader instance. It should be placed high up in your component tree. All props for the `Uploader` component (like `popup` and `onUploadFinish`) are passed to the provider.
2.  **`UploaderTrigger`**: Any component wrapped by `UploaderTrigger` becomes a clickable element that will open the uploader modal. It can wrap buttons, links, or any other element.

This pattern is highly flexible and helps keep your component logic clean.

---

## Next Steps

You now have a fully functional frontend uploader component. However, to actually store the uploaded files, you need a backend service to receive them.

<x-card data-title="Backend Setup (@blocklet/uploader-server)" data-icon="lucide:server" data-href="/getting-started/backend-setup" data-cta="Continue">
  Learn how to install and configure the necessary backend middleware in your Express-based blocklet to handle file uploads.
</x-card>