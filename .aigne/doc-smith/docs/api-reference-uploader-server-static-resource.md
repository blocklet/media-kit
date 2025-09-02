# initStaticResourceMiddleware(options)

The `initStaticResourceMiddleware` function creates an Express middleware designed to serve static assets from other installed blocklets. It works by scanning specified directories within other components, mapping their files, and serving them efficiently with appropriate caching headers.

This is particularly useful when your blocklet needs to access resources (like image packs, themes, or plugins) provided by other blocklets in the same environment.

## How It Works

The middleware operates in two main phases: initialization and request handling. The process is dynamic, automatically updating its file map when blocklets are added, removed, or updated.

```d2
direction: down

"Initialization Phase": {
  label: "On App Start & Component Changes"
  style.fill: "#f0f8ff"

  A: "initStaticResourceMiddleware() called"
  B: "mappingResource()"
  C: "@blocklet/sdk.getResources()"
  D: "Find blocklets matching resourceTypes"
  E: "Scan specified folders"
  F: "Build in-memory resourcesMap"

  A -> B -> C -> D -> E -> F
}

"Request Handling Phase": {
  label: "For Each Incoming Request"
  style.fill: "#fffbe6"

  Req: "GET /asset.png"
  Mid: "Middleware Intercepts"
  Lookup: "Look up 'asset.png' in resourcesMap"
  Found: "Found?"
  Serve: "Serve file with cache headers"
  Next: "Pass to next middleware"

  Req -> Mid -> Lookup -> Found
  Found -> Serve: "Yes"
  Found -> Next: "No"
}

"Initialization Phase".F -> "Request Handling Phase".Lookup: "Provides map for"

```


## Usage

To use the middleware, initialize it with your desired resource types and add it to your Express application.

```javascript
import express from 'express';
import { initStaticResourceMiddleware } from '@blocklet/uploader-server';

const app = express();

// Define the types of resources you want to serve.
// This example configures the middleware to find blocklets
// that provide 'imgpack' resources.
const staticResourceMiddleware = initStaticResourceMiddleware({
  express: app, // The express app instance
  resourceTypes: [
    {
      type: 'imgpack', // Matches blocklets with this resource type
      did: 'z2qa751x7g51f7v5s5k1d3xeenqf3a2p9kvm4', // Optional: filter by a specific blocklet DID
      folder: 'images', // Serve files from the 'images' subfolder
      whitelist: ['.png', '.jpg', '.jpeg', '.svg'], // Only serve these file types
    },
  ],
  options: {
    maxAge: '7d', // Set cache max-age to 7 days
    immutable: true, // Add the 'immutable' cache-control directive
  },
});

// Add the middleware to your app
app.use(staticResourceMiddleware);

// Your other routes...
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

In this example, if another installed blocklet has the resource type `imgpack` in its `blocklet.yml`, the middleware will scan its `images` subfolder and serve any whitelisted image files when requested.

## Function Signature

`initStaticResourceMiddleware(config)`

### `config` object

The configuration object accepts the following properties:

| Property | Type | Description |
|---|---|---|
| `express` | `object` | **Required.** The Express application instance. |
| `resourceTypes` | `(string \| ResourceType)[]` | An array defining the resources to map. Can be an array of strings (type names) or `ResourceType` objects for more detailed configuration. Defaults to a basic `imgpack` configuration. |
| `options` | `object` | An options object passed to the underlying file server, controlling caching and headers. See options table below. |
| `skipRunningCheck` | `boolean` | If `true`, the middleware will map resources from components even if they are not currently running. Defaults to `false`. |

### `options` object

These options control the behavior of the underlying `serveResource` function.

| Property | Type | Description |
|---|---|---|
| `maxAge` | `string` | Sets the `Cache-Control` max-age header. The value is a string like `'365d'` or `'7d'`. Defaults to `'365d'`. |
| `immutable` | `boolean` | If `true`, adds the `immutable` directive to the `Cache-Control` header. Defaults to `true`. |

### `ResourceType` object

When providing an object in the `resourceTypes` array, you can specify the following properties:

| Property | Type | Description |
|---|---|---|
| `type` | `string` | **Required.** The identifier for the resource type. This should match the `type` specified in the provider blocklet's `blocklet.yml`. |
| `did` | `string` | The DID of the component that provides the resource. Defaults to `ImageBinDid` if not set. |
| `folder` | `string \| string[]` | A subfolder or an array of subfolders inside the blocklet's directory to scan for files. Defaults to the root (`''`). |
| `whitelist` | `string[]` | An array of file extensions to include (e.g., `['.png', '.jpg']`). If set, only files with these extensions will be served. |
| `blacklist` | `string[]` | An array of file extensions to exclude (e.g., `['.md', '.txt']`). |
| `setHeaders`| `(res, path, stat) => void` | A function to set custom response headers. |
| `immutable` | `boolean` | Overrides the top-level `immutable` option for this specific resource type. |
| `maxAge` | `string` | Overrides the top-level `maxAge` option for this specific resource type. |

---

For serving dynamic assets that may change during runtime, see the next section on [`initDynamicResourceMiddleware(options)`](./api-reference-uploader-server-dynamic-resource.md).
