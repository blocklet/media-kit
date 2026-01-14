# Integrating Remote Sources (Companion)

To allow users to import files from external sources like direct URLs or services like Unsplash, you need to set up Uppy's Companion service on your backend. The `@blocklet/uploader-server` package provides a convenient `initCompanion` function that simplifies this process.

Companion acts as a server-side proxy. It fetches files from remote providers on behalf of the user and then streams them to the frontend uploader component, which then proceeds with the normal upload process. While basic file uploads can be handled without a custom backend, enabling remote sources requires setting up the `@blocklet/uploader-server` package.

### How It Works

The following diagram illustrates the data flow when a user imports a file from a remote source:

```d2 Remote Source Integration Flow
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

User -> Frontend.Uploader-Component: "1. Selects file"
Frontend.Uploader-Component -> Backend.Companion-Middleware: "2. Request file"
Backend.Companion-Middleware -> Remote-Source: "3. Fetch file"
Remote-Source -> Backend.Companion-Middleware: "4. Stream file data"
Backend.Companion-Middleware -> Frontend.Uploader-Component: "5. Back to browser"
Frontend.Uploader-Component -> Backend.Local-Storage-Middleware: "6. Upload file"
```

## Step 1: Configure the Backend Middleware

First, you need to initialize and mount the Companion middleware in your blocklet's backend Express server. This involves calling `initCompanion` and adding it to your router.

```javascript Server-side Companion Setup icon=logos:nodejs
import express from 'express';
import { initCompanion } from '@blocklet/uploader-server';

const router = express.Router();

// Companion middleware for remote sources
const companion = initCompanion({
  path: env.uploadDir, // A temporary directory for file processing
  express,
  providerOptions: {
    // Configure providers here, e.g., Unsplash
    unsplash: {
      key: process.env.UNSPLASH_KEY,
      secret: process.env.UNSPLASH_SECRET,
    },
  },
  uploadUrls: [env.appUrl], // Your blocklet's public URL
});

// Mount the companion handler on a specific route
router.use('/companion', companion.handle);
```

### `initCompanion` Options

| Option | Type | Description |
| :--- | :--- | :--- |
| `path` | `string` | **Required.** The directory on your server where Companion will temporarily store files during transfer. |
| `express` | `Function` | **Required.** The Express app instance. |
| `providerOptions` | `Object` | Optional. Configuration for remote providers. To enable Unsplash, for instance, you would provide your API key and secret. For a complete list of providers and their options, refer to the [official Uppy Companion documentation](https://uppy.io/docs/companion/providers/). |
| `uploadUrls` | `string[]` | Optional but highly recommended for security. An array of URLs where your frontend uploader is running. This prevents others from using your Companion instance. |

## Step 2: Configure the Frontend Component

After setting up the backend, you need to configure the frontend `<Uploader />` component to communicate with your Companion instance. You do this by specifying the route in the `apiPathProps` prop and enabling the desired plugins.

```jsx Uploader Component with Companion icon=logos:react
import { Uploader } from '@blocklet/uploader';

function MyUploaderComponent() {
  return (
    <Uploader
      popup
      apiPathProps={{
        // This path must match the backend route
        companion: '/api/companion',
        // The uploader path for the final upload
        uploader: '/api/uploads',
      }}
      plugins={[
        'Url', // Enables importing from a direct URL
        'Unsplash', // Enables importing from Unsplash
        'Webcam',
      ]}
    />
  );
}
```

With both the backend middleware and frontend component configured, the Uploader's dashboard will now display tabs for "Link" (URL) and "Unsplash", allowing users to import files directly from those sources.

---

Now that you can handle uploads from both local and remote sources, you might want to extend the uploader's functionality even further. Learn how to add your own custom tabs to the Uploader interface in the next guide.

<x-card data-title="Creating a Custom Plugin" data-icon="lucide:puzzle" data-href="/guides/custom-plugin" data-cta="Read More">
  Extend the Uploader's functionality by creating your own custom plugin tab using the provided VirtualPlugin component.
</x-card>