# initDynamicResourceMiddleware(options)

The `initDynamicResourceMiddleware` function creates an Express middleware designed to serve resources from specified directories. Its key feature is the ability to watch for file system changes in real-time, automatically adding, updating, or removing resources without requiring a server restart. This is particularly useful for serving assets that are generated or modified dynamically during the application's lifecycle.

This middleware is ideal for scenarios like serving user-generated content, themes, or plugins that can change while the server is running. For assets that do not change, consider using the more performant [`initStaticResourceMiddleware`](./api-reference-uploader-server-static-resource.md).

```d2
direction: down

"File-System-Watcher": {
  shape: rectangle
  label: "File System Watcher\n(fs.watch)"
  "Monitors specified directories for changes"
}

"Dynamic-Resource-Map": {
  label: "In-Memory Resource Map\n(filename -> file details)"
  shape: cylinder
}

"File-System-Watcher" -> "Dynamic-Resource-Map": "Updates map on\nfile add/change/delete"

"Client-Request": {
  label: "HTTP GET /my-asset.png"
  shape: rectangle
}

"Express-Server": {
  shape: package

  "Dynamic-Middleware": {
    label: "initDynamicResourceMiddleware"
    shape: rectangle
  }

  "Next-Middleware": {
    label: "Next Middleware in chain"
    shape: oval
  }
}

"Client-Request" -> "Express-Server.Dynamic-Middleware": "1. Receives request"
"Express-Server.Dynamic-Middleware" -> "Dynamic-Resource-Map": "2. Looks up 'my-asset.png'"
"Dynamic-Resource-Map" -> "Express-Server.Dynamic-Middleware": "3a. Found: Returns file path"
"Express-Server.Dynamic-Middleware" -> "Client-Request": "4a. Serves file"

"Dynamic-Resource-Map" -> "Express-Server.Next-Middleware": "3b. Not Found"
"Express-Server.Dynamic-Middleware" -> "Express-Server.Next-Middleware": "Calls next()"
```

## Basic Usage

Here is a simple example of how to use the middleware in an Express application to serve all `.jpg` and `.png` files from a `public/images` directory.

```javascript
import express from 'express';
import { initDynamicResourceMiddleware } from '@blocklet/uploader-server';
import path from 'path';

const app = express();

const dynamicImagesMiddleware = initDynamicResourceMiddleware({
  resourcePaths: [
    {
      path: path.join(__dirname, 'public', 'images'),
      whitelist: ['.jpg', '.png'],
    },
  ],
});

app.use('/images', dynamicImagesMiddleware);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```

## Options

The `initDynamicResourceMiddleware` function accepts a single configuration object with the following properties:

| Parameter | Type | Description |
|---|---|---|
| `resourcePaths` | `DynamicResourcePath[]` | **Required.** An array of objects defining the directories to scan and watch for resources. |
| `componentDid` | `string` | Optional. If provided, the middleware will only be active if the current component's DID matches this value. |
| `watchOptions` | `object` | Optional. Configuration for the file watching behavior. |
| `cacheOptions` | `object` | Optional. Configuration for HTTP caching headers. |
| `onFileChange` | `(filePath: string, event: string) => void` | Optional. A callback function that is triggered when a file is added, changed, or deleted. |
| `onReady` | `(resourceCount: number) => void` | Optional. A callback function that is triggered after the initial scan is complete. |
| `setHeaders` | `(res, filePath, stat) => void` | Optional. A function to set custom headers on the response. |
| `conflictResolution` | `'first-match' \| 'last-match' \| 'error'` | Optional. Defines the strategy to use when the same filename is found in multiple directories. Defaults to `'first-match'`. |

### `resourcePaths`

This is the core configuration that tells the middleware where to find files. It is an array of `DynamicResourcePath` objects, each having the following properties:

- `path: string`: The absolute path to a directory. It supports glob patterns (e.g., `*`) to watch multiple matching directories.
- `whitelist?: string[]`: An array of file extensions to include (e.g., `['.png', '.svg']`). If provided, only files with these extensions will be served.
- `blacklist?: string[]`: An array of file extensions to exclude (e.g., `['.tmp', '.bak']`).

**Example with a wildcard path:**

This configuration scans for `assets` subdirectories within any directory under `plugins` and serves their images.

```javascript
const middleware = initDynamicResourceMiddleware({
  resourcePaths: [
    {
      path: path.join(__dirname, 'plugins', '*', 'assets'),
      whitelist: ['.jpg', '.gif', '.png'],
      blacklist: ['.psd'],
    },
  ],
});
```

### `watchOptions`

Customize the underlying `fs.watch` behavior.

- `ignorePatterns?: string[]`: An array of string patterns or regular expressions. Files or directories matching these patterns will be ignored by the watcher.
- `persistent?: boolean`: If `true` (the default), the Node.js process will continue to run as long as files are being watched.
- `depth?: number`: Specifies the depth of subdirectories to watch. If not set, it recursively watches all subdirectories.

### `cacheOptions`

Control the `Cache-Control` headers sent with each resource.

- `maxAge?: string | number`: Sets the `max-age` directive. Defaults to `'365d'`. Can be a number in milliseconds or a string like `'2 days'`. 
- `immutable?: boolean`: If `true` (the default), adds the `immutable` directive to the `Cache-Control` header.
- `etag?: boolean`: Whether to use ETag.
- `lastModified?: boolean`: Whether to use Last-Modified.

### Hooks (`onFileChange`, `onReady`)

These callback functions allow you to react to events within the middleware.

```javascript
const middleware = initDynamicResourceMiddleware({
  resourcePaths: [{ path: './uploads' }],
  onFileChange: (filePath, event) => {
    // event can be 'change', 'rename', or 'delete'
    console.log(`File ${event}: ${filePath}`);
  },
  onReady: (resourceCount) => {
    console.log(`Middleware is ready. ${resourceCount} resources loaded.`);
  },
});
```

### `conflictResolution`

This option determines how to handle filename collisions when multiple `resourcePaths` contain a file with the same name.

- `'first-match'` (Default): The first file found during the initial scan is used. Subsequent files with the same name from other directories are ignored.
- `'last-match'`: The last file found during the scan will overwrite any previously found file with the same name. This is useful when you want to allow overriding of default assets.
- `'error'`: Logs an error message to the console if a conflict is detected.

## Return Value

The function returns a standard Express middleware function. This returned middleware also has a `cleanup` method attached to it.

### `cleanup()`

The `cleanup()` function should be called to gracefully shut down the middleware. It stops all file system watchers and clears the internal resource map, preventing memory leaks. This is especially important in environments with hot-reloading or during automated tests.

```javascript
const middleware = initDynamicResourceMiddleware({
  resourcePaths: [{ path: './uploads' }],
});

app.use(middleware);

// Example of using cleanup during server shutdown
const server = app.listen(3000);

process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  middleware.cleanup();
  server.close();
});
```

## Advanced Example

This example configures the middleware to serve assets from two sets of directories: a default theme and a user-customizable theme. It uses `last-match` to allow the user's theme to override default assets. It also logs file changes.

```javascript
import express from 'express';
import { initDynamicResourceMiddleware } from '@blocklet/uploader-server';
import path from 'path';

const app = express();

const themesMiddleware = initDynamicResourceMiddleware({
  resourcePaths: [
    {
      // Default assets, scanned first
      path: path.join(__dirname, 'themes', 'default'),
    },
    {
      // User overrides, scanned last
      path: path.join(__dirname, 'themes', 'user'),
    },
  ],
  conflictResolution: 'last-match', // User theme files will replace default ones
  onFileChange: (filePath, event) => {
    console.log(`Theme file change detected: ${event} - ${filePath}`);
  },
  onReady: (count) => {
    console.log(`${count} theme assets loaded.`);
  },
  cacheOptions: {
    maxAge: '1h', // Shorter cache for potentially dynamic assets
    immutable: false,
  },
});

app.use('/theme', themesMiddleware);

app.listen(3000, () => {
  console.log('Server with theme support is running on port 3000');
});
```

---

Now that you understand how to serve dynamic resources, you might want to learn how to serve fixed assets. For that, please see the [initStaticResourceMiddleware](./api-reference-uploader-server-static-resource.md) documentation.