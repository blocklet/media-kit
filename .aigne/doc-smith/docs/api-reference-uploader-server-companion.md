# initCompanion(options)

The `initCompanion` function initializes and configures the Uppy Companion middleware, which is essential for enabling users to import files from remote sources like Unsplash, Google Drive, Instagram, or direct URLs. This function is a wrapper around the official [`@uppy/companion`](https://uppy.io/docs/companion/) library, tailored for seamless integration within a blocklet environment.

For a practical guide on setting this up, see [Integrating Remote Sources (Companion)](./guides-remote-sources.md).

### How It Works

Companion acts as a server-side proxy. When a user selects a file from a remote source, the request is sent to your backend's Companion endpoint. Your server then fetches the file from the remote source and streams it back to the user's browser. Once in the browser, the file is treated like a local file and uploaded to your final destination (e.g., the endpoint handled by `initLocalStorageServer`).

```d2 How Companion Works icon=mdi:diagram-outline
direction: down

User: {
  shape: c4-person
}

Frontend: {
  label: "Frontend (Browser)"
  shape: rectangle

  Uploader-Component: {
    label: "Uploader Component"
    shape: rectangle
  }
}

Backend: {
  label: "Backend Server"
  shape: rectangle

  Companion-Middleware: {
    label: "Companion Middleware\n(@blocklet/uploader-server)"
  }

  Local-Storage-Middleware: {
    label: "Local Storage Middleware"
    shape: rectangle
  }
}

Remote-Source: {
  label: "Remote Source\n(e.g., Unsplash, URL)"
  shape: cylinder
}

User -> Frontend.Uploader-Component: "1. Selects remote file"
Frontend.Uploader-Component -> Backend.Companion-Middleware: "2. Request file"
Backend.Companion-Middleware -> Remote-Source: "3. Fetch file"
Remote-Source -> Backend.Companion-Middleware: "4. Stream file data"
Backend.Companion-Middleware -> Frontend.Uploader-Component: "5. Stream back to browser"
Frontend.Uploader-Component -> Backend.Local-Storage-Middleware: "6. Upload file (Tus)"

```

### Usage

To use Companion, initialize it with your configuration options and then attach its `handle` to an Express router path. The frontend `Uploader` component must be configured with the same path for its `companionUrl` prop.

```javascript Basic Companion Setup icon=logos:javascript
import express from 'express';
import { initCompanion } from '@blocklet/uploader-server';

const router = express.Router();

// Basic configuration for Companion
const companion = initCompanion({
  // A temporary directory on your server for processing files
  path: '/tmp/uploads',
  express,
  // Provider options with necessary keys and secrets
  providerOptions: {
    unsplash: {
      key: process.env.UNSPLASH_KEY,
      secret: process.env.UNSPLASH_SECRET,
    },
  },
  // The public URL of your blocklet, required by some providers
  uploadUrls: [process.env.APP_URL],
});

// Mount the companion middleware on a specific path
// This path should match the `companionUrl` prop on the frontend
router.use('/companion', companion.handle);
```

### Parameters

The `initCompanion` function accepts a single options object with the following properties:

| Name              | Type       | Description                                                                                                                                                                                          |
| ----------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `path`            | `string`   | **Required.** The absolute path to a temporary directory on the server where files will be stored during processing. This corresponds to the `filePath` option in Uppy Companion.                        |
| `express`         | `Function` | **Required.** The Express application instance. This is used to create the necessary sub-app and middleware stack for Companion.                                                                        |
| `providerOptions` | `object`   | Optional. An object containing the configuration for each remote provider you want to enable. Each key is the provider name (e.g., `unsplash`), and the value is its configuration, like API keys and secrets. |
| `...restProps`    | `any`      | Any other valid option from the official [Uppy Companion options](https://uppy.io/docs/companion/options/) can be passed here. For example, `uploadUrls` is a common and often required option.          |

### Return Value

The function returns a `companion` instance with the following key properties:

| Property            | Type       | Description                                                                                                                                                                                                                              |
| ------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `handle`            | `Function` | An Express middleware that you must mount on a route (e.g., `/companion`). This handle contains all the logic for processing remote file requests.                                                                                |
| `setProviderOptions`| `(options: object) => void` | A method that allows you to dynamically update the `providerOptions` after initialization. This is useful if you need to load API keys from a database or change configurations without restarting the server. |

#### Example: Dynamic Provider Options

You can change the provider options at runtime, which is useful for multi-tenant applications or when secrets are loaded asynchronously.

```javascript Dynamic Provider Options icon=logos:javascript
// Initialize companion without provider options initially
const companion = initCompanion({
  path: '/tmp/uploads',
  express,
});

// Later, perhaps after fetching secrets from a database
async function updateCompanionConfig() {
  const secrets = await getSecretsFromDb();
  companion.setProviderOptions({
    unsplash: {
      key: secrets.unsplashKey,
      secret: secrets.unsplashSecret,
    },
  });
}
```

### Additional Features

- **Status Code Rewriting**: For security and better error handling, if a remote provider returns an error with a status code of 500 or higher, this middleware automatically rewrites it to `400 Bad Request`. This prevents potential server error details from leaking to the client.

---

With Companion set up, your uploader is now capable of handling files from a wide variety of sources. You might also need to serve static files from your blocklet or other blocklets.

<x-cards>
  <x-card data-title="Guide: Integrating Remote Sources" data-icon="lucide:link" data-href="/guides/remote-sources">
    A step-by-step guide to configure both the frontend and backend for remote uploads.
  </x-card>
  <x-card data-title="API: initStaticResourceMiddleware" data-icon="lucide:file-code" data-href="/api-reference/uploader-server/static-resource">
    Learn how to serve static assets from other installed blocklets.
  </x-card>
</x-cards>