# Frontend Setup (@blocklet/uploader)

This guide provides a step-by-step walkthrough for installing and rendering the `@blocklet/uploader` component in your React application. This package provides a feature-rich Uploader component built on the popular [Uppy](https://uppy.io/) library, offering a seamless file upload experience.

It's important to note that `@blocklet/uploader` is a frontend-only package. It can work independently without `@blocklet/uploader-server` if your blocklet already has endpoints to handle file uploads, such as those provided by the Media Kit blocklet.

## Step 1: Install the Package

First, add the `@blocklet/uploader` package to your project dependencies. You can use npm, yarn, or pnpm.

```bash
# With npm
npm install @blocklet/uploader

# With yarn
yarn add @blocklet/uploader

# With pnpm
pnpm add @blocklet/uploader
```

## Step 2: Import Required Styles

The uploader component relies on Uppy's stylesheets for its user interface. You need to import the core styles and the styles for any plugins you intend to use. Add these imports to your application's main entry point (e.g., `src/index.js` or `src/App.js`).

```javascript
// Import Uppy's core and dashboard styles
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';

// Import styles for any plugins you use
import '@uppy/webcam/dist/style.min.css';
import '@uppy/image-editor/dist/style.min.css';
import '@uppy/url/dist/style.min.css'; // For the URL import plugin
```

## Step 3: Render the Uploader

You have two primary ways to render the uploader: as an inline component or as a popup modal.

### Option A: Inline Component

This method embeds the uploader directly into your page layout. It's useful for dedicated upload pages.

```jsx
import React, { useRef, lazy, Suspense } from 'react';

// Lazily import the Uploader to improve initial load times
const UploaderComponent = lazy(() => import('@blocklet/uploader').then((res) => ({ default: res.Uploader })));

export default function UploadPage() {
  const uploaderRef = useRef(null);

  const handleUploadFinish = (result) => {
    console.log('Upload successful!', result.data);
    // You can now use the file URL from result.uploadURL
  };

  return (
    <div>
      <h2>Upload Your Files</h2>
      <Suspense fallback={<div>Loading Uploader...</div>}>
        <UploaderComponent
          ref={uploaderRef}
          onUploadFinish={handleUploadFinish}
          plugins={['ImageEditor', 'Url', 'Webcam']}
          coreProps={{
            restrictions: {
              maxFileSize: 10 * 1024 * 1024, // 10 MB
              allowedFileTypes: ['image/*', 'video/*'],
            },
          }}
          apiPathProps={{
            uploader: '/api/uploads', // Your backend upload endpoint
            companion: '/api/companion', // Your backend companion endpoint for remote sources
          }}
        />
      </Suspense>
    </div>
  );
}
```

### Option B: Popup Modal (Recommended)

For a more flexible user experience, you can render the uploader as a modal that is triggered by a button click. This is the recommended approach for most applications.

To do this, wrap your application or component tree with `UploaderProvider` and use the `UploaderTrigger` component to create the button that opens the modal.

```jsx
import React from 'react';
import { UploaderProvider, UploaderTrigger } from '@blocklet/uploader';

// Ensure you have imported the required CSS in your app's entry point

function App() {
  const handleUpload = (result) => {
    console.log('File uploaded via trigger:', result.data);
    // Update your component's state with the new file URL
  };

  return (
    <UploaderProvider
      popup // This prop enables the modal behavior
      onUploadFinish={handleUpload}
      apiPathProps={{
        uploader: '/api/uploads',
        companion: '/api/companion',
      }}
      coreProps={{
        restrictions: {
          maxNumberOfFiles: 5,
          allowedFileTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        },
      }}
    >
      <div>
        <h1>My Application</h1>
        <p>Click the button below to upload your documents.</p>
        <UploaderTrigger>
          <button type="button">Upload File</button>
        </UploaderTrigger>
      </div>
    </UploaderProvider>
  );
}

export default App;

```

## Key Configuration Props

Here are some of the essential props to configure the `Uploader` component:

| Prop | Description |
|---|---|
| `popup` | A boolean that, when `true`, renders the uploader as a popup modal instead of an inline component. |
| `onUploadFinish` | A callback function that is executed after each file successfully uploads. It receives an object containing the uploaded file's metadata and URL. |
| `apiPathProps` | An object that specifies the backend endpoints. `uploader` is the path for direct uploads (Tus protocol), and `companion` is for handling remote sources like Unsplash or URLs. |
| `coreProps` | An object to pass configuration directly to the Uppy core instance. This is where you set upload restrictions like `maxFileSize`, `maxNumberOfFiles`, and `allowedFileTypes`. |
| `plugins` | An array of strings to enable built-in Uppy plugins like `'Webcam'`, `'Url'`, `'ImageEditor'`, and `'Unsplash'`. |

## Next Steps

You now have a fully functional frontend uploader integrated into your React application. The next crucial step is to set up a backend that can receive and process these uploads. 

<x-cards>
  <x-card data-title="Backend Setup (@blocklet/uploader-server)" data-icon="lucide:server" data-href="/getting-started/backend-setup">
    If you need to build your own file handling logic, follow this guide to set up the backend middleware.
  </x-card>
  <x-card data-title="Uploader Component Props" data-icon="lucide:book-open" data-href="/api-reference/uploader/component-props">
    Explore the full range of available props to customize the uploader's behavior and appearance.
  </x-card>
</x-cards>