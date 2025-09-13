# initStaticResourceMiddleware(options)

The `initStaticResourceMiddleware` is a powerful Express middleware designed to serve static assets from other installed blocklets. This allows your application to access shared resources like images, stylesheets, or fonts from dependent components without needing to know their exact location on the file system.

The middleware works by scanning the directories of installed blocklets that match a specified resource type, creating an in-memory map of available files. When a request comes in, it efficiently looks up the file in this map and serves it.

### How It Works

Here’s a high-level overview of the process:

```d2
direction: down

Browser: {
  shape: c4-person
  label: "User's Browser"
}

Your-Blocklet: {
  label: "Your Blocklet"
  shape: rectangle

  Express-Server: {
    label: "Express Server"
  }

  Static-Middleware: {
    label: "initStaticResourceMiddleware"
  }
}

Dependent-Blocklets: {
    label: "Dependent Blocklets"
    shape: rectangle
    style.stroke-dash: 2
    grid-columns: 2

    Image-Bin: {
        label: "Image Bin Blocklet"
        shape: cylinder
        imgpack: {
            label: "imgpack/"
            "logo.png"
        }
    }

    Theme-Blocklet: {
        label: "Theme Blocklet"
        shape: rectangle
        assets: {
            label: "assets/"
            "style.css"
        }
    }
}

Your-Blocklet.Express-Server -> Your-Blocklet.Static-Middleware: "1. Initializes with config"
Your-Blocklet.Static-Middleware -> Dependent-Blocklets: "2. Scans for resources"
Browser -> Your-Blocklet.Express-Server: "3. GET /logo.png"
Your-Blocklet.Static-Middleware -> Browser: "4. Serves file from Image Bin"

```

### Usage

To use the middleware, import it and add it to your Express application. You need to configure which resource types it should look for.

```javascript server.js icon=logos:express
import express from 'express';
import { initStaticResourceMiddleware } from '@blocklet/uploader-server';

const app = express();

// Initialize the middleware to serve resources of type 'imgpack'
// from any installed blocklet that provides it.
app.use(
  initStaticResourceMiddleware({
    express,
    resourceTypes: ['imgpack'], // Simple configuration using a string
  })
);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

In this example, if another installed blocklet has a `blocklet.yml` entry for a resource of type `imgpack`, any file within that resource's directory will be served. For example, a request to `/example.png` would serve the `example.png` file from that blocklet.

### Options

The `initStaticResourceMiddleware` function accepts a configuration object with the following properties:

| Option | Type | Description |
| --- | --- | --- |
| `express` | `object` | **Required.** The Express application instance. |
| `resourceTypes` | `(string \| ResourceType)[]` | **Required.** An array defining the resource types to scan. See the `ResourceType` object details below. |
| `options` | `object` | Optional. A configuration object passed to the underlying `serve-static` handler. Common properties include `maxAge` (e.g., '365d') and `immutable` (e.g., `true`) to control cache headers. |
| `skipRunningCheck` | `boolean` | Optional. If `true`, the middleware will scan blocklets that are installed but not currently running. Defaults to `false`. |

### The `ResourceType` Object

For more granular control, you can provide an array of objects to the `resourceTypes` option instead of simple strings. Each object can have the following properties:

| Property | Type | Description |
| --- | --- | --- |
| `type` | `string` | **Required.** The name of the resource type, which should match the type defined in a dependent blocklet's `blocklet.yml`. |
| `did` | `string` | **Required.** The DID of the blocklet component that provides the resource. You can use `ImageBinDid` for the standard Media Kit. |
| `folder` | `string \| string[]` | Optional. A specific sub-folder or an array of sub-folders within the resource directory to scan. Defaults to the root (`''`) of the resource directory. |
| `whitelist` | `string[]` | Optional. An array of file extensions to include (e.g., `['.png', '.jpg']`). If provided, only files with these extensions will be served. |
| `blacklist` | `string[]` | Optional. An array of file extensions to exclude (e.g., `['.md', '.txt']`). |
| `setHeaders` | `(res, path, stat) => void` | Optional. A function to set custom response headers for a served file. |
| `immutable` | `boolean` | Optional. Overrides the top-level `options.immutable` for this specific resource type to control the `Cache-Control` header. |
| `maxAge` | `string` | Optional. Overrides the top-level `options.maxAge` for this specific resource type. |

### Advanced Example

This example demonstrates a more complex configuration serving two different types of resources with specific rules.

```javascript server.js icon=logos:express
import express from 'express';
import { initStaticResourceMiddleware } from '@blocklet/uploader-server';
import { ImageBinDid } from '@blocklet/uploader-server/constants';

const app = express();

app.use(
  initStaticResourceMiddleware({
    express,
    skipRunningCheck: true,
    resourceTypes: [
      {
        type: 'imgpack',
        did: ImageBinDid,
        folder: 'public/images',
        whitelist: ['.png', '.jpg', '.gif'],
      },
      {
        type: 'theme-assets',
        did: 'z2q...someThemeBlockletDid', // DID of a specific theme blocklet
        folder: ['css', 'fonts'],
        blacklist: ['.map'],
      },
    ],
    options: {
      maxAge: '7d', // Default cache for 7 days
    },
  })
);

app.listen(3000);
```

This configuration does the following:
1.  Scans for `imgpack` resources provided by the Media Kit (`ImageBinDid`), but only within the `public/images` sub-folder, and only serves `.png`, `.jpg`, and `.gif` files.
2.  Scans for `theme-assets` resources from a blocklet with a specific DID, looking in both the `css` and `fonts` sub-folders, and ignores any source map (`.map`) files.
3.  Sets a default `Cache-Control` max-age of 7 days for all matched files.

### Automatic Updates

This middleware is designed for a dynamic environment. It automatically listens for blocklet lifecycle events. If a component is added, removed, started, stopped, or updated, the middleware will automatically rescan and update its internal resource map, so you don't need to restart your application.

---

Next, learn how to serve files from a directory that can be updated in real-time without requiring an application restart.

<x-card data-title="initDynamicResourceMiddleware(options)" data-icon="lucide:file-diff" data-href="/api-reference/uploader-server/dynamic-resource" data-cta="Read More">
API reference for serving dynamic resources from specified directories with support for real-time file watching.
</x-card>
