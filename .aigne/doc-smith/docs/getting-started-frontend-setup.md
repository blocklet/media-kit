# Frontend Setup (@blocklet/uploader)

This guide will walk you through installing and integrating the `@blocklet/uploader` React component into your application. This component provides a complete user interface for file uploading, built on the powerful [Uppy](https://uppy.io/docs/quick-start/) library. It is designed to work out-of-the-box with a Media Kit blocklet, meaning you can often get a fully functional uploader without writing any backend code.

---

## Step 1: Install the Package

First, add the `@blocklet/uploader` package to your project. You can use your preferred package manager.

```bash
# Using pnpm
pnpm add @blocklet/uploader

# Using yarn
yarn add @blocklet/uploader

# Using npm
npm install @blocklet/uploader
```

## Step 2: Import Required Styles

The uploader component relies on several CSS files from Uppy for its appearance. For the component to render correctly, you must import these styles into your main application file (e.g., `App.js` or `main.js`).

```jsx
// Import core styles and styles for the UI components + plugins you are using.
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import '@uppy/webcam/dist/style.min.css';
import '@uppy/image-editor/dist/style.min.css';
import '@uppy/drag-drop/dist/style.min.css';
import '@uppy/drop-target/dist/style.min.css';
import '@uppy/status-bar/dist/style.min.css';
```

## Step 3: Render the Uploader

There are two primary ways to render the uploader: as a popup modal triggered by a button (recommended for most use cases) or as an inline component directly on the page.

### Recommended: Using `UploaderProvider` for a Popup Modal

For most applications, you'll want to trigger the uploader from a button, which then opens a modal. The recommended way to achieve this is by using the `UploaderProvider` and `UploaderTrigger` components. This approach decouples the uploader's state and modal from the button that triggers it.

1.  **Wrap your application or component tree with `UploaderProvider`**. Configure it with the `popup` prop and an `onUploadFinish` callback to handle completed uploads.

    ```jsx
    // In your main App.js or a layout component
    import { UploaderProvider } from '@blocklet/uploader';
    
    // Import Uppy CSS files here
    import '@uppy/core/dist/style.min.css';
    import '@uppy/dashboard/dist/style.min.css';

    function App() {
      return (
        <UploaderProvider
          popup // This is crucial for modal behavior
          onUploadFinish={(result) => {
            console.log('File uploaded:', result.uploadURL);
            // You can now use the result object, e.g., save the URL to your state
          }}
          // The apiPathProps are often not needed when a Media Kit is installed
          apiPathProps={{
            uploader: '/api/uploads',
            companion: '/api/companion',
          }}
        >
          {/* The rest of your application, e.g., <MyPage /> */}
          <MyPage />
        </UploaderProvider>
      );
    }
    ```

2.  **Use `UploaderTrigger` anywhere inside the provider** to create an element that opens the uploader modal when clicked.

    ```jsx
    // In any child component, like MyPage.js
    import { UploaderTrigger } from '@blocklet/uploader';
    
    function MyPage() {
      return (
        <div>
          <p>Click the button to upload a file.</p>
          <UploaderTrigger>
            <button type="button">Upload File</button>
          </UploaderTrigger>
        </div>
      );
    }
    ```

### Alternative: Inline Component

You can also render the uploader directly as an inline component. This is suitable for pages dedicated to file management where the uploader should always be visible.

```jsx
import { lazy } from 'react';

// Import Uppy CSS files here
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';

// Using lazy import for the Uploader component is a good practice
const UploaderComponent = lazy(() => import('@blocklet/uploader').then((res) => ({ default: res.Uploader })));

function UploadPage() {
  const handleUploadFinish = (result) => {
    console.log('Upload complete!', result);
    // The result object contains uploaded file data
    // result.data: the server response
    // result.uploadURL: the direct URL to the file
  };

  return (
    <UploaderComponent
      onUploadFinish={handleUploadFinish}
      apiPathProps={{
        uploader: '/api/uploads',
        companion: '/api/companion',
      }}
    />
  );
}
```

## How it Works

The `@blocklet/uploader` component is designed to be plug-and-play. When a Media Kit blocklet is installed and running, the uploader component automatically detects its API endpoints and sends files to it. No further configuration is typically needed.

The `apiPathProps` prop allows you to override these default endpoints if you are implementing a custom backend and need to direct uploads to specific URLs.

## Next Steps

You have now successfully set up the frontend uploader component. If a Media Kit is present in your development or production environment, your uploader should be fully functional.

If you are not using a Media Kit, or if you require custom server-side logic such as adding watermarks or saving file metadata to a separate database, you will need to implement a backend handler. The following guide explains how to build one using the optional `@blocklet/uploader-server` package.

<x-card data-title="Backend Setup (@blocklet/uploader-server)" data-icon="lucide:server" data-href="/getting-started/backend-setup">
  Learn how to install and configure a custom backend middleware to handle file uploads when not using a Media Kit or when special server-side processing is required.
</x-card>