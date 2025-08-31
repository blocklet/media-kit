# initCompanion(options)

The `initCompanion(options)` function initializes the Uppy Companion middleware, which enables your application to handle file imports from remote sources. This includes services like Google Drive, Instagram, Unsplash, and direct URLs. This function is a wrapper around the standard `@uppy/companion` library, providing a convenient setup within a blocklet environment.

For a complete list of available providers and their specific configuration options, please refer to the official [Uppy Companion documentation](https://uppy.io/docs/companion/).

## Parameters

The function accepts a single options object with the following properties:

| Name            | Type             | Required | Description                                                                                                                                                           |
| --------------- | ---------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `path`          | `string`         | Yes      | The absolute path to a directory on the server where Companion will temporarily store files downloaded from remote sources before they are processed.                       |
| `express`       | `Function`       | Yes      | The Express application instance. Companion uses this to register its routes.                                                                                         |
| `providerOptions` | `Object`         | No       | An object containing configuration for the remote providers you want to enable. This is where you should place API keys and secrets.                                      |
| `uploadUrls`    | `Array<string>`  | No       | An array of trusted URLs that Companion is allowed to upload files to. This should typically include your blocklet's public URL.                                        |
| `...restProps`  | `Object`         | No       | Any additional options will be passed directly to the `@uppy/companion` configuration object, allowing for advanced customization.                                      |

## Returns

The function returns a Companion instance with two key properties:

- **`handle`**: The Express middleware that processes all Companion-related requests. You should mount this on a specific route (e.g., `/companion`).
- **`setProviderOptions(options)`**: A function that allows you to dynamically update the `providerOptions` after the server has started. This is useful if provider keys are fetched or changed at runtime.

## Example Usage

Here is an example of how to initialize and mount the Companion middleware in your Express application.

```javascript
import express from 'express';
import { initCompanion } from '@blocklet/uploader-server';

const router = express.Router();

// Assume env, user, auth, and ensureComponentDid are configured
const env = {
  uploadDir: '/tmp/uploads',
  providerOptions: {
    // Add your provider keys here, e.g., Unsplash
    unsplash: {
      key: 'YOUR_UNSPLASH_KEY',
      secret: 'YOUR_UNSPLASH_SECRET',
    },
  },
  appUrl: 'https://your-app.com',
};

// Initialize Companion
const companion = initCompanion({
  path: env.uploadDir, // A temporary directory for remote files
  express,
  providerOptions: env.providerOptions, // Provider keys from environment
  uploadUrls: [env.appUrl], // Your app's public URL
});

// Mount the Companion middleware on a specific route
// It's recommended to place it behind authentication middleware
router.use('/companion', user, auth, ensureComponentDid, companion.handle);
```

## Additional Notes

- **Middleware Dependencies**: `initCompanion` automatically includes the necessary `body-parser` and `express-session` middleware, so you do not need to add them separately for the Companion route.

- **Error Handling**: This middleware implementation rewrites server-side errors (HTTP 5xx) to client-side errors (HTTP 400). This behavior helps prevent leaking server implementation details and treats many provider configuration issues as client-side problems.

---

Now that you understand how to handle remote sources, you may want to learn how to serve static or dynamic files from your blocklet.

<x-cards>
  <x-card data-title="initStaticResourceMiddleware(options)" data-icon="lucide:folder-symlink" data-href="/api-reference/uploader-server/static-resource">
    Learn how to serve static assets from other installed blocklets.
  </x-card>
  <x-card data-title="initDynamicResourceMiddleware(options)" data-icon="lucide:folder-sync" data-href="/api-reference/uploader-server/dynamic-resource">
    Serve dynamic resources from specified directories with support for real-time file watching.
  </x-card>
</x-cards>.