# Integrating Remote Sources (Companion)

To enhance the user experience, the uploader can be configured to import files directly from remote sources like URLs or services like Unsplash. This functionality is powered by Uppy's [Companion](https://uppy.io/docs/companion/), a server-side component that handles the process of fetching files from third-party services. The `@blocklet/uploader-server` package provides a convenient wrapper, `initCompanion`, to integrate this feature into your blocklet's backend.

This guide will walk you through setting up the Companion middleware on your server and configuring the frontend uploader to communicate with it.

## How It Works

The integration involves both the frontend and backend components working together:

1.  **Frontend (`@blocklet/uploader`)**: The user selects a remote source (e.g., "Import from URL") in the Uppy Dashboard.
2.  **Request to Backend**: The uploader component sends a request to your blocklet's backend, specifically to the endpoint where the Companion middleware is running.
3.  **Backend (`@blocklet/uploader-server`)**: The Companion middleware receives the request, connects to the remote source (e.g., fetches the file from the specified URL), and streams the file data back to the frontend.
4.  **Upload**: The frontend uploader receives the file data and uploads it to your primary storage destination as if it were a local file.

```d2
direction: down

User-Browser: {
  label: "User's Browser"
  shape: rectangle

  Uploader-Component: {
    label: "@blocklet/uploader Component"
    shape: package
  }
}

Blocklet-Server: {
  label: "Your Blocklet Server"
  shape: rectangle

  Express-App: {
    label: "Express App"
    shape: rectangle

    Companion-Middleware: {
      label: "Companion Middleware\n(initCompanion)"
      shape: package
    }

    LocalStorage-Middleware: {
      label: "LocalStorage Middleware\n(initLocalStorageServer)"
      shape: package
    }
  }
}

Remote-Source: {
  label: "Remote Source\n(e.g., a URL, Unsplash)"
  shape: cloud
}

User-Browser.Uploader-Component -> Blocklet-Server.Express-App.Companion-Middleware: "1. Request file from URL"
Blocklet-Server.Express-App.Companion-Middleware -> Remote-Source: "2. Fetch file"
Remote-Source -> Blocklet-Server.Express-App.Companion-Middleware: "3. Stream file data"
Blocklet-Server.Express-App.Companion-Middleware -> User-Browser.Uploader-Component: "4. Stream file data"
User-Browser.Uploader-Component -> Blocklet-Server.Express-App.LocalStorage-Middleware: "5. Upload file like a local one"

```

## Backend Setup

First, you need to initialize and mount the Companion middleware in your Express application. This is done using the `initCompanion` function from `@blocklet/uploader-server`.

```javascript
// In your blocklet's backend router/app setup
import express from 'express';
import { initCompanion } from '@blocklet/uploader-server';

const router = express.Router();

// Assuming 'env' contains your environment configuration
const companion = initCompanion({
  path: env.uploadDir, // Temporary directory for processing files
  express,
  // Optional: For services like Unsplash that require API keys
  providerOptions: env.providerOptions,
  // The public URL of your blocklet, so Companion knows where to send files back to
  uploadUrls: [env.appUrl],
});

// Mount the companion middleware on a specific route
// The user, auth, and ensureComponentDid middleware are typically needed for security
router.use('/companion', user, auth, ensureComponentDid, companion.handle);
```

### Key `initCompanion` Options

| Option | Type | Description |
|---|---|---|
| `path` | `string` | **Required.** The server path where Companion can temporarily store files during processing. |
| `express` | `Function` | **Required.** The Express application instance. |
| `providerOptions` | `object` | Optional. Configuration for specific providers, such as API keys for Unsplash. |
| `uploadUrls` | `string[]` | **Required.** An array of trusted URLs that the frontend uploader is running on. This is a security measure to prevent misuse. It should typically be your blocklet's public URL. |

For more details on all available options, refer to the [`initCompanion(options)`](./api-reference-uploader-server-companion.md) API reference.

## Frontend Configuration

After setting up the backend, you need to configure the `<Uploader />` component to use it. This involves two steps:

1.  **Specify the Companion Path**: Use the `apiPathProps` prop to tell the uploader where your Companion middleware is located.
2.  **Enable Companion Plugins**: Include the desired remote source plugins (like `Url` or `Unsplash`) in the `plugins` prop.

Here is an example of a frontend component configured to allow imports from a URL:

```jsx
import React from 'react';
import { Uploader } from '@blocklet/uploader/react';
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';

function UploaderWithRemoteSources() {
  return (
    <Uploader
      popup
      // 1. Enable the 'Url' plugin to allow importing from URLs
      plugins={['Url', 'Webcam']} 
      apiPathProps={{
        uploader: '/api/uploads', // Your direct upload endpoint
        // 2. Point to the backend route where Companion is mounted
        companion: '/api/companion',
      }}
    />
  );
}

export default UploaderWithRemoteSources;
```

With this configuration, the Uppy dashboard will now show an "Import from URL" option. When a user provides a URL, the frontend will make a request to `/api/companion` on your server, which will handle the download and prepare the file for the final upload.

---

Next, you might want to extend the uploader's functionality further. Learn how to create your own custom panel within the uploader interface in the [Creating a Custom Plugin](./guides-custom-plugin.md) guide.