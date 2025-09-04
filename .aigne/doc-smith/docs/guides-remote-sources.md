# Integrating Remote Sources (Companion)

To allow users to import files directly from external sources like a URL or services such as Unsplash, you need to set up the Companion middleware. Companion is a part of the `@blocklet/uploader-server` package that processes server-to-server file transfers, handling authentication and downloads from remote providers.

It is built on top of Uppy's [Companion](https://uppy.io/docs/companion/), acting as a bridge between the frontend uploader component and the various remote services.

## Backend Setup

The first step is to initialize and mount the Companion middleware in your backend Express application. The `initCompanion` function simplifies this process.

Here's a typical setup in your blocklet's routes:

```javascript
// file: routes/index.js
import { initCompanion } from '@blocklet/uploader-server';

// ... other imports and express setup

// Initialize companion
const companion = initCompanion({
  path: env.uploadDir, // A temporary directory for downloaded files
  express,
  providerOptions: {
    // Configuration for providers like Unsplash goes here
    unsplash: {
      key: process.env.UNSPLASH_KEY,       // Your Unsplash app's Access Key
      secret: process.env.UNSPLASH_SECRET, // Your Unsplash app's Secret Key
    },
  },
  uploadUrls: [env.appUrl], // An array of trusted domains where the uploader is hosted
});

// Mount the companion middleware on a specific path
router.use('/companion', user, auth, ensureComponentDid, companion.handle);
```

This code initializes Companion and attaches it to the `/companion` route. Any requests from the frontend uploader to this path will now be handled by Companion.

### `initCompanion(options)`

The `initCompanion` function accepts an options object with the following key properties:

| Option            | Type       | Description                                                                                                                              |
| ----------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `path`            | `string`   | **Required.** The absolute path to a directory on your server where Companion can temporarily store files before they are uploaded.         |
| `express`         | `Function` | **Required.** The Express app instance.                                                                                                  |
| `providerOptions` | `object`   | An object containing the configuration for each remote provider you want to enable, such as API keys for Unsplash.                       |
| `uploadUrls`      | `string[]` | An array of base URLs where your uploader is running. This is a security measure to prevent misuse from other websites.                  |

### How it Works

The diagram below illustrates the flow of data when a user imports a file from a remote source like Unsplash.

```d2
direction: right
shape: sequence_diagram

Frontend: "Uploader Component"
Backend: "Companion Middleware"
Unsplash: "Unsplash API"
Storage: "File Storage"

Frontend -> Backend: "User requests to browse Unsplash"
Backend -> Unsplash: "Request images using API key"
Unsplash -> Backend: "Returns list of images"
Backend -> Frontend: "Displays images to user"

User_Action: "User selects an image" {
  Frontend -> Backend: "Request to import selected image"
  Backend -> Unsplash: "Download the image file"
  Unsplash -> Backend: "Streams image data"
  Backend -> Storage: "Uploads file to final storage"
  Storage -> Backend: "Confirms successful upload"
  Backend -> Frontend: "Notifies that file is added"
}
```

## Frontend Integration

On the frontend, the `<Uploader />` component needs to know the endpoint where the Companion middleware is running. You can specify this using the `apiPathProps` prop.

```jsx
import { Uploader } from '@blocklet/uploader/react';

function MyUploaderComponent() {
  return (
    <Uploader
      popup
      apiPathProps={{
        uploader: '/api/uploads',
        companion: '/api/companion', // This must match the backend route
      }}
    />
  );
}
```

Once the `companion` path is provided, the uploader automatically enables the relevant remote source plugins:

- **URL Importer**: The `Url` plugin will be available by default, allowing users to paste a direct link to a file.
- **Unsplash**: The `Unsplash` plugin will appear automatically if you have configured the `providerOptions` on the backend and exposed your Unsplash Access Key to the frontend via `window.blocklet.UNSPLASH_KEY`.

With both backend and frontend configured, your uploader is now equipped to handle files from various remote sources, providing a more versatile user experience.

Next, you might want to learn how to create your own custom plugins to extend the uploader's functionality further. See the [Creating a Custom Plugin](./guides-custom-plugin.md) guide for more details.