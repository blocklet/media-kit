# initCompanion(options)

The `initCompanion` function initializes and configures the server-side middleware responsible for fetching files from remote sources like direct URLs, Unsplash, Google Drive, and others. It is a wrapper around the official [@uppy/companion](https://uppy.io/docs/companion/) package, tailored for use within Blocklets.

This middleware works by downloading a file from a remote source to a temporary directory on your server and then streaming it back to the Uppy instance in the user's browser. From there, the file is uploaded to your final destination using the primary upload middleware, such as `initLocalStorageServer`.

### How It Works

The following diagram illustrates the data flow when a user selects a file from a remote source:

```d2
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
    shape: hexagon
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
Frontend.Uploader-Component -> Backend.Companion-Middleware: "2. Request file download"
Backend.Companion-Middleware -> Remote-Source: "3. Fetch file"
Remote-Source -> Backend.Companion-Middleware: "4. Stream file data"
Backend.Companion-Middleware -> Frontend.Uploader-Component: "5. Stream file to browser"
Frontend.Uploader-Component -> Backend.Local-Storage-Middleware: "6. Upload file via Tus"
```

### Prerequisites

Companion requires `body-parser` and `express-session` to function correctly. Ensure these are included in the same subpath as your Companion middleware.

```javascript
import bodyParser from 'body-parser';
import session from 'express-session';

// ... inside your router setup
router.use(bodyParser.json());
router.use(session({ secret: 'your-secret-key', resave: false, saveUninitialized: true }));
```

### Usage

Here is a basic example of how to initialize and mount the Companion middleware in an Express application.

```javascript
import express from 'express';
import { initCompanion } from '@blocklet/uploader-server';

const router = express.Router();

const companion = initCompanion({
  path: '/path/to/your/temp/uploads',
  express,
  providerOptions: {
    unsplash: {
      key: process.env.UNSPLASH_KEY,
      secret: process.env.UNSPLASH_SECRET,
    },
  },
  uploadUrls: [process.env.APP_URL], // The public URL of your blocklet
});

router.use('/companion', companion.handle);
```

### Options

| Parameter         | Type       | Description                                                                                                                                                                                             |
| ----------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `path`            | `string`   | **Required.** The absolute path to a temporary directory on the server where files from remote sources will be stored before being sent to the client.                                                       |
| `express`         | `Function` | **Required.** The Express application constructor.                                                                                                                                                       |
| `providerOptions` | `Object`   | An object containing the configuration (keys, secrets, etc.) for each remote provider you want to enable. For detailed options for each provider, refer to the [Uppy Companion documentation](https://uppy.io/docs/companion/providers/). |
| `uploadUrls`      | `string[]` | **Required.** An array of trusted base URLs where the frontend Uploader component is running. This is a crucial security measure to prevent misuse of your Companion instance.                                 |
| `...restProps`    | `Object`   | Any other valid options from the official Uppy Companion configuration can be passed here. This includes `server`, `filePath`, `secret`, etc.                                                              |

### Return Value

The `initCompanion` function returns a Companion instance with the following properties:

- **`handle`**: The Express middleware function that processes all Companion-related requests. You should mount this on a specific path (e.g., `/companion`).
- **`setProviderOptions(options)`**: A method that allows you to dynamically update the `providerOptions` after initialization. This is useful if you need to load credentials asynchronously or change them at runtime.

#### Example: Using `setProviderOptions`

```javascript
const companion = initCompanion({
  path: env.uploadDir,
  express,
  uploadUrls: [env.appUrl],
});

// Later, you can dynamically set the provider options
async function configureProviders() {
  const credentials = await fetchCredentialsFromSomeService();
  companion.setProviderOptions({
    unsplash: {
      key: credentials.unsplash.key,
      secret: credentials.unsplash.secret,
    },
  });
}

configureProviders();

router.use('/companion', user, auth, companion.handle);
```

### Next Steps

<x-cards>
  <x-card data-title="Handling Uploads" data-icon="lucide:upload-cloud" data-href="/guides/handling-uploads">
    Learn how to process files on the backend after they are successfully uploaded.
  </x-card>
  <x-card data-title="initLocalStorageServer()" data-icon="lucide:server" data-href="/api-reference/uploader-server/local-storage">
    Explore the API for handling direct file uploads from the user's computer.
  </x-card>
</x-cards>