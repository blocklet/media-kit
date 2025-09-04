# initCompanion(options)

The `initCompanion` function initializes and configures the Uppy Companion middleware. Companion is the server-side component that enables the uploader to import files from remote sources like Unsplash, Google Drive, Instagram, or direct URLs. It handles the communication with third-party APIs and streams the files to your server, where they can be processed by your upload handler.

For a deeper understanding of the underlying technology, you can refer to the [official Uppy Companion documentation](https://uppy.io/docs/companion/).

## Basic Usage

To enable remote file sources, you need to initialize Companion and mount its handler on an Express route. This route will serve as the endpoint for all remote provider interactions.

```javascript
// In your blocklet's Express setup file (e.g., server/routes/index.js)

import express from 'express';
import { initCompanion } from '@blocklet/uploader-server';

const router = express.Router();

// Initialize the Companion middleware
const companion = initCompanion({
  // A directory on your server for Companion to temporarily store files
  path: process.env.UPLOAD_DIR,
  express,
  // Whitelist your application's URL for security
  uploadUrls: [process.env.APP_URL],
  // Provide API keys for the remote sources you want to enable
  providerOptions: {
    unsplash: {
      key: process.env.UNSPLASH_KEY,
      secret: process.env.UNSPLASH_SECRET,
    },
    // Add other providers like Google Drive, Dropbox, etc.
  },
});

// Mount the Companion handler on a dedicated path
// This path must match the `companionUrl` prop on the frontend <Uploader /> component
router.use('/companion', companion.handle);

export default router;
```

In the example above, the Companion server will handle all requests made to `/companion/*` and process uploads from Unsplash.

## Options

The `initCompanion` function accepts an options object with the following properties:

| Parameter | Type | Required | Description |
|---|---|---|---|
| `path` | `string` | Yes | The absolute path to a directory on the server where Companion will temporarily store files during transfer. Ensure this directory is writable by your application. |
| `express` | `Function` | Yes | The Express constructor function itself. It is used internally to create the middleware router. |
| `providerOptions` | `object` | No | An object to configure remote providers. Each key is a provider ID (e.g., `unsplash`, `google`, `dropbox`), and the value is its configuration object containing API keys and secrets. |
| `uploadUrls` | `string[]` | No | An array of trusted hostnames or URLs from which uploads are allowed. This is a critical security setting to prevent server-side request forgery (SSRF). It should contain the URL of your application frontend. |
| `...restProps` | `object` | No | Any other valid options supported by the official Uppy Companion library will be passed through. This allows for advanced configurations. See the [official Companion options documentation](https://uppy.io/docs/companion/options/) for a complete list. |

## Return Value

The function returns a Companion instance with two key properties:

- **`handle`**: The Express middleware instance. You must mount this on a specific path in your router (e.g., `/companion`) to handle all requests from the frontend uploader's remote source plugins.

- **`setProviderOptions(options: Object)`**: A function that allows you to dynamically update the `providerOptions` after the middleware has been initialized. This is useful for scenarios where provider keys are request-specific or need to be fetched on-the-fly.

### Example: Dynamic Provider Options

You can use a preceding middleware to set provider options dynamically for each request, for example, based on the authenticated user.

```javascript
// ... companion is initialized as in the basic usage example

// A middleware that sets provider options based on the request
const dynamicProviderMiddleware = async (req, res, next) => {
  // Assume you have a function to get user-specific API keys
  const userApiKeys = await getUserApiKeys(req.user.did);

  const providerOptions = {
    dropbox: {
      key: userApiKeys.dropbox_key,
      secret: userApiKeys.dropbox_secret,
    },
  };

  // Set the options for the current request
  companion.setProviderOptions(providerOptions);

  next();
};

// Apply the dynamic middleware before the companion handler
router.use('/companion', dynamicProviderMiddleware, companion.handle);
```

---

Next, you may want to serve static assets from other blocklets. Learn how with the [initStaticResourceMiddleware(options)](./api-reference-uploader-server-static-resource.md) guide.