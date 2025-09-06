# Integrating Remote Sources (Companion)

To enhance the user experience, `@blocklet/uploader` can import files directly from remote sources like Unsplash or any public URL, in addition to local device uploads. This functionality is powered by [Uppy Companion](https://uppy.io/docs/companion/), a server-side component that handles the process of fetching files from third-party services.

The `@blocklet/uploader-server` package provides a convenient wrapper, `initCompanion`, to seamlessly integrate this feature into your blocklet's backend.

## How it Works

When a user selects a file from a remote source, the frontend Uploader component does not download it directly. Instead, it communicates with the Companion middleware on your backend. Companion then securely fetches the file on behalf of the user and streams it back to the frontend. Once the file is in the browser, it proceeds with the standard upload process (e.g., using the Tus protocol to the local storage server).

This flow keeps sensitive API keys and tokens on the server, ensuring they are never exposed to the client.

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

User -> Frontend.Uploader-Component: "1. Selects file"
Frontend.Uploader-Component -> Backend.Companion-Middleware: "2. Request file"
Backend.Companion-Middleware -> Remote-Source: "3. Fetch file"
Remote-Source -> Backend.Companion-Middleware: "4. Stream file data"
Backend.Companion-Middleware -> Frontend.Uploader-Component: "5. Back to browser"
Frontend.Uploader-Component -> Backend.Local-Storage-Middleware: "6. Upload file"
```

## Backend Setup

To enable remote sources, you need to initialize and mount the `initCompanion` middleware in your Express application. This should be done alongside your existing upload middleware, such as `initLocalStorageServer`.

Here is a typical setup in your blocklet's routes:

```javascript
import { initCompanion } from '@blocklet/uploader-server';

// ... other imports and router setup

// if you need to load file from remote
// companion
const companion = initCompanion({
  path: env.uploadDir, // A temporary directory for file processing
  express,
  providerOptions: env.providerOptions, // Object containing API keys for services
  uploadUrls: [env.appUrl], // An array of trusted frontend URLs
});

// Mount the companion middleware on a specific path
router.use('/companion', user, auth, ensureComponentDid, companion.handle);
```

### Configuration Options

The `initCompanion` function accepts an options object with the following properties:

| Option            | Type       | Description                                                                                                                                                                                                                                                                  |
|-------------------|------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `path`            | `string`   | **Required.** The absolute path to a directory on your server where Companion can temporarily store files during processing.                                                                                                                                                                |
| `express`         | `Function` | **Required.** The Express app instance.                                                                                                                                                                                                                                                      |
| `providerOptions` | `object`   | An object containing the configuration for various providers. For example, to enable Unsplash, you would provide your Unsplash API key here. The keys of this object correspond to the provider names (e.g., `unsplash`, `google`, `instagram`).                                                 |
| `uploadUrls`      | `string[]` | An array of URLs representing the domains where your frontend uploader is hosted. This is a crucial security measure to prevent abuse of your Companion instance from untrusted sites. For a blocklet, this is typically your blocklet's `appUrl`.                                         |

### Example: Enabling Unsplash

To allow users to import images from Unsplash, you need to provide your Unsplash Access Key in the `providerOptions`. This is typically managed through environment variables.

```javascript
// In your environment configuration (e.g., .env)
// UNSPLASH_KEY="your_unsplash_access_key"

// In your backend setup code
const companion = initCompanion({
  path: env.uploadDir,
  express,
  providerOptions: {
    unsplash: {
      key: process.env.UNSPLASH_KEY,
      secret: process.env.UNSPLASH_SECRET, // If required
    },
  },
  uploadUrls: [env.appUrl],
});

router.use('/companion', companion.handle);
```

## Frontend Configuration

On the frontend, the `<Uploader />` component is pre-configured to work with Companion. You just need to tell it where the Companion middleware is running by using the `apiPathProps` prop.

The `Url` and `Unsplash` plugins are enabled by default if they are included in the `plugins` prop and the backend is correctly configured.

```jsx
import Uploader from '@blocklet/uploader/react';

function MyComponent() {
  return (
    <Uploader
      popup
      apiPathProps={{
        uploader: '/api/uploads', // Your main upload endpoint
        companion: '/api/companion', // The endpoint where you mounted the companion middleware
      }}
      plugins={['Url', 'Webcam', 'Unsplash']} // Ensure remote plugins are in the list
    />
  );
}
```

With both backend and frontend configured, the Uploader UI will automatically display the tabs for enabled remote sources, allowing users to import files seamlessly.

---

Now that you know how to integrate with built-in remote sources, you might want to extend the Uploader's capabilities even further. To learn how to add your own custom tabs and functionality, proceed to the next guide.

<x-card data-title="Creating a Custom Plugin" data-icon="lucide:plus-circle" data-href="/guides/custom-plugin" data-cta="Read More">
  Learn to extend the Uploader's functionality by creating your own custom plugin tab using the provided VirtualPlugin component.
</x-card>