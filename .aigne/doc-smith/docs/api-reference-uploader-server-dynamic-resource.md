# initDynamicResourceMiddleware(options)

The `initDynamicResourceMiddleware` function creates an Express middleware designed to serve files from specified directories dynamically. Its key feature is the ability to watch the file system for real-time changes. When files are added, updated, or deleted in the monitored directories, the middleware updates its internal resource map automatically, without requiring a server restart. This makes it ideal for serving assets that can change during runtime, such as user-uploaded content, themes, or dynamically generated files.

## How It Works

The middleware operates through two main processes: a request-response cycle for serving files and a background file-watching process for keeping the resource list up-to-date.

```d2
direction: down

fs-watcher: {
  label: "File System Watcher\n(fs.watch)"
  shape: rectangle
}

dynamic-resource-map: {
  label: "Dynamic Resource Map\n(In-Memory)"
  shape: cylinder
}

middleware: {
  label: "Dynamic Resource Middleware"
  shape: hexagon
}

express-app: {
  label: "Express.js Application"
  shape: rectangle
}

client: {
  shape: c4-person
}

file-system: {
  label: "Monitored Directories\n(e.g., /data/themes/*)"
  shape: rectangle
}

fs-watcher -> file-system: {
  label: "Monitors for changes"
  style.stroke-dash: 4
}
fs-watcher -> dynamic-resource-map: "Updates map on file change\n(add/update/delete)"

client -> express-app: "1. GET /assets/style.css"
express-app -> middleware: "2. Request"
middleware -> dynamic-resource-map: "3. Lookup 'style.css'"
dynamic-resource-map -> middleware: "4. Resource found"
middleware -> client: "5. Serve file"

```

1.  **Initialization**: The middleware scans the directories defined in `resourcePaths`, including those matching glob patterns, and builds an in-memory map of available files.
2.  **File Watching**: It sets up file system watchers on these directories to detect any changes.
3.  **Request Handling**: When a request arrives, the middleware checks if the requested filename exists in its map. If found, it serves the file with appropriate cache headers. If not, it passes the request to the next middleware in the chain.
4.  **Real-time Updates**: If a file is added, changed, or removed, the watcher triggers an update to the in-memory map. Subsequent requests will reflect this change instantly.

## Usage

Here's how to set up the dynamic resource middleware in your Express application.

```javascript
import express from 'express';
import { initDynamicResourceMiddleware } from '@blocklet/uploader-server';
import path from 'path';

const app = express();

// Define the directories to monitor. This path supports glob patterns.
const dynamicResourceHandler = initDynamicResourceMiddleware({
  resourcePaths: [
    {
      path: path.join(__dirname, 'public', 'themes', '*'), // Watch all subdirectories in 'themes'
      whitelist: ['.css', '.js', '.png', '.jpg'],
    },
  ],
  watchOptions: {
    // Options for the file watcher
    persistent: true,
  },
  cacheOptions: {
    maxAge: '1d', // Set cache to 1 day
    immutable: false,
  },
  onFileChange: (filePath, event) => {
    console.log(`File ${event}: ${filePath}`);
  },
  onReady: (resourceCount) => {
    console.log(`${resourceCount} dynamic resources loaded and ready.`);
  },
  conflictResolution: 'last-match', // If a file exists in multiple theme folders, the last one found wins
});

// Register the middleware
// Any request for a file in the watched directories will be handled here
// e.g., GET /main.css will be served from one of the theme folders
app.use(dynamicResourceHandler);

const server = app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});

// It's important to clean up watchers on server shutdown to prevent memory leaks
process.on('SIGINT', () => {
  console.log('Cleaning up resources...');
  dynamicResourceHandler.cleanup();
  server.close();
});
```

## Configuration Options

The `initDynamicResourceMiddleware` function accepts a single options object with the following properties:

| Parameter | Type | Description | Required |
|---|---|---|:---:|
| `resourcePaths` | `DynamicResourcePath[]` | An array of objects defining the paths to monitor. | Yes |
| `componentDid` | `string` | If provided, the middleware will only activate if the current component's DID matches this value. | No |
| `watchOptions` | `object` | Configuration for the underlying file system watcher (`fs.watch`). | No |
| `cacheOptions` | `object` | Configuration for client-side caching headers (`Cache-Control`, `ETag`, `Last-Modified`). | No |
| `onFileChange` | `(filePath: string, event: string) => void` | A callback function executed when a file is added, changed, or deleted. The `event` can be `'change'`, `'rename'`, or `'delete'`. | No |
| `onReady` | `(resourceCount: number) => void` | A callback function executed after the initial scan is complete and the middleware is ready to serve files. It receives the total number of resources found. | No |
| `setHeaders` | `(res, filePath, stat) => void` | A function to set custom headers on the response before a file is served. | No |
| `conflictResolution` | `'first-match'` \| `'last-match'` \| `'error'` | Strategy to handle cases where files with the same name exist in multiple monitored directories. Defaults to `'first-match'`. | No |

### `DynamicResourcePath` Object

Each object in the `resourcePaths` array defines a location to source files from.

| Parameter | Type | Description |
|---|---|---|
| `path` | `string` | The absolute path to a directory. It supports glob patterns (e.g., `/path/to/assets/*`) to monitor multiple subdirectories. |
| `whitelist` | `string[]` | An array of file extensions to include (e.g., `['.css', '.js']`). If specified, only files with these extensions will be served. |
| `blacklist` | `string[]` | An array of file extensions to exclude (e.g., `['.log', '.tmp']`). Files with these extensions will be ignored. |

### `watchOptions` Object

These options fine-tune the behavior of the file system watcher.

| Parameter | Type | Description |
|---|---|---|
| `ignorePatterns` | `string[]` | An array of string patterns or regular expressions. Files or directories matching these patterns will be ignored by the watcher. |
| `persistent` | `boolean` | If `true`, the process will continue running as long as files are being watched. Defaults to `true`. |
| `usePolling` | `boolean` | Whether to use polling. Polling can be necessary for some network file systems but is generally less efficient. |
| `depth` | `number` | The depth of subdirectories to monitor. If not set, it recursively watches all subdirectories. |

### `cacheOptions` Object

Control how browsers cache the served resources.

| Parameter | Type | Description |
|---|---|---|
| `maxAge` | `string` \| `number` | Sets the `max-age` directive in the `Cache-Control` header. Can be a number in milliseconds or a string like `'365d'`. Defaults to `'365d'`. |
| `immutable` | `boolean` | If `true`, adds the `immutable` directive to the `Cache-Control` header, telling browsers the file will never change. Defaults to `true`. |
| `etag` | `boolean` | Whether to enable ETag generation for conditional requests. Defaults to `true` (if not `immutable`). |
| `lastModified` | `boolean` | Whether to set the `Last-Modified` header. Defaults to `true` (if not `immutable`). |

### Conflict Resolution

When multiple `resourcePaths` contain a file with the same name (e.g., `theme-a/style.css` and `theme-b/style.css`), the `conflictResolution` strategy determines which one is served:

-   `'first-match'` (Default): The first file found during the initial scan is used. Any subsequent files with the same name are ignored.
-   `'last-match'`: The last file found during the scan will overwrite any previously found versions. This is useful for theme overrides.
-   `'error'`: Logs an error to the console indicating a resource conflict. The behavior will be the same as `'first-match'`. 

## Cleanup

The `initDynamicResourceMiddleware` function returns the middleware handler, but with an added `cleanup` method. This method is crucial for gracefully shutting down your application.

```javascript
const dynamicResourceHandler = initDynamicResourceMiddleware(...);

// ... later, during server shutdown ...
dynamicResourceHandler.cleanup();
```

Calling `cleanup()` closes all active file system watchers, preventing memory leaks and ensuring your process can exit cleanly.

---

Next, learn how to serve static assets from other installed blocklets using the [initStaticResourceMiddleware(options)](./api-reference-uploader-server-static-resource.md) function.