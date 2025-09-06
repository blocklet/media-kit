# initStaticResourceMiddleware(options)

The `initStaticResourceMiddleware` is an Express middleware designed to discover and serve static assets from other installed blocklets. It dynamically scans your environment for blocklets that provide specific resource types, maps their files, and makes them available through your application. This process is automatic and updates in real-time as blocklets are added, removed, or updated.

This is particularly useful for creating extensible applications where plugins or other blocklets can provide their own assets (like images, fonts, or stylesheets) without requiring manual configuration in the main application.

### How It Works

When your application starts, the middleware scans for other blocklets that match the `resourceTypes` you define. It builds an in-memory map of all discoverable files. When a request comes in, the middleware checks this map. If a match is found, it serves the file directly from the source blocklet's directory with appropriate cache headers.

```d2
direction: down

your-app: {
  label: "Your Blocklet\n(with @blocklet/uploader-server)"
  shape: rectangle

  initStaticResourceMiddleware: {
    label: "initStaticResourceMiddleware()"
    shape: hexagon
  }
}

other-blocklets: {
  label: "Other Installed Blocklets"
  shape: rectangle
  grid-columns: 2
  grid-gap: 50

  blocklet-a: {
    label: "Blocklet A\n(provides 'imgpack')"
    shape: cylinder
    file1: "logo.png"
  }
  blocklet-b: {
    label: "Blocklet B\n(provides 'fontpack')"
    shape: cylinder
    file2: "roboto.woff2"
  }
}

resourcesMap: {
  label: "In-Memory Resource Map"
  shape: parallelogram
  "logo.png -> /path/to/blocklet-a/imgpack/logo.png"
  "roboto.woff2 -> /path/to/blocklet-b/fontpack/roboto.woff2"
}

user-browser: {
  label: "User's Browser"
  shape: c4-person
}

your-app.initStaticResourceMiddleware -> other-blocklets: "1. Scans for resources on startup"
other-blocklets -> resourcesMap: "2. Builds map of all available files"
user-browser -> your-app: "3. GET /logo.png"
your-app -> resourcesMap: "4. Looks up 'logo.png'"
resourcesMap -> your-app: "5. Returns file path"
your-app -> other-blocklets.blocklet-a.file1: "6. Reads file from Blocklet A"
other-blocklets.blocklet-a.file1 -> user-browser: "7. Serves file to user"

```

### Usage

Here's how to configure the middleware in a standard Express application.

```javascript
const express = require('express');
const { initStaticResourceMiddleware } = require('@blocklet/uploader-server');
const { ImageBinDid } = require('@blocklet/uploader-server/constants');

const app = express();

// Define the types of resources you want to serve.
// This example will find any blocklet with the ImageBinDid
// and serve files from the root of its 'imgpack' directory.
const resourceTypes = [
  {
    type: 'imgpack', // The resource directory suffix
    did: ImageBinDid, // The DID of the blocklet providing the resource
    folder: '', // Serve from the root of the 'imgpack' directory
    whitelist: ['.png', '.jpg', '.jpeg', '.gif', '.svg'],
  },
  {
    type: 'fontpack',
    did: 'did:abt:z123abc...', // DID of a blocklet that provides fonts
    folder: 'public/fonts', // Serve only from a specific sub-folder
  }
];

app.use(initStaticResourceMiddleware({
  express, // The express instance
  resourceTypes,
  options: {
    maxAge: '1d', // Set Cache-Control header to 1 day
    immutable: true,
  },
  skipRunningCheck: false, // Set to true to include resources from stopped blocklets
}));

// ... your other routes

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```

### Parameters

The `initStaticResourceMiddleware` function accepts a single configuration object with the following properties:

| Name | Type | Description |
|---|---|---|
| `express` | `object` | **Required.** The Express application instance. |
| `resourceTypes` | `ResourceType[]` | **Required.** An array of objects defining the resource types to discover and serve. See details below. |
| `options` | `object` | Optional. An object containing cache control settings. |
| `skipRunningCheck` | `boolean` | Optional. If `true`, the middleware will also map resources from blocklets that are not currently running. Defaults to `false`. |

### The `resourceTypes` Option

This is the core configuration for the middleware. It's an array where each object defines a type of resource to look for across all installed blocklets.

| Property | Type | Description |
|---|---|---|
| `type` | `string` | **Required.** A string that identifies the resource type. The middleware looks for a directory ending with this string in other blocklets (e.g., a `type` of `'imgpack'` will match a directory named `.../some-component/imgpack`). |
| `did` | `string` | **Required.** The DID of the blocklet that is expected to provide this resource type. This ensures you only load resources from trusted sources. |
| `folder` | `string \| string[]` | **Required.** The sub-folder or folders within the resource directory to serve files from. Use `''` for the root of the resource directory. |
| `whitelist` | `string[]` | Optional. An array of file extensions to include (e.g., `['.png', '.jpg']`). If provided, only files with these extensions will be served. |
| `blacklist` | `string[]` | Optional. An array of file extensions to exclude (e.g., `['.md', '.txt']`). |
| `setHeaders` | `(res, path, stat) => void` | Optional. A function to set custom headers on the response. It receives the Express response object, the file path, and the file's stat object. |
| `immutable` | `boolean` | Optional. If `true`, adds the `immutable` directive to the `Cache-Control` header. Defaults to `true`. |
| `maxAge` | `string` | Optional. Sets the `max-age` for the `Cache-Control` header (e.g., `'365d'`, `'1h'`). Defaults to `'365d'`. |

### Cache Control Options

You can control browser caching by passing an `options` object. These settings are applied to all resources served by this middleware.

- `options.maxAge` (string): Sets the `max-age` directive. The format is a string like `'365d'` for 365 days or `'2h'` for 2 hours. Defaults to `'365d'`.
- `options.immutable` (boolean): If `true` (the default), the `immutable` directive is added to the `Cache-Control` header, which tells browsers the file will never change and they don't need to revalidate it.

For example, `{ maxAge: '1d', immutable: true }` results in the header `Cache-Control: public, max-age=86400, immutable`.

---

Next, learn how to serve files from a directory that can change in real-time by using the dynamic resource middleware.

<x-card data-title="Next: initDynamicResourceMiddleware(options)" data-icon="lucide:arrow-right-circle" data-href="/api-reference/uploader-server/dynamic-resource" data-cta="Read More">
API reference for serving dynamic resources from specified directories with support for real-time file watching.
</x-card>
