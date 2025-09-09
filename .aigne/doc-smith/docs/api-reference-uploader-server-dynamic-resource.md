# initDynamicResourceMiddleware(options)

The `initDynamicResourceMiddleware` is a powerful Express middleware designed to serve files from one or more specified directories dynamically. Unlike `initStaticResourceMiddleware`, it actively watches for file system changes (additions, deletions, modifications) in real-time, making it ideal for serving content that can change during runtime, such as user-uploaded files, themes, or plugins.

It builds an in-memory map of resources for fast lookups and handles caching, file filtering, and conflict resolution gracefully.

## How It Works

The middleware follows a clear lifecycle: initialization, scanning, watching, and serving. When a request comes in, it performs a quick lookup in its internal map. If a file is added or removed from a watched directory, the map is updated automatically.

```d2
direction: down

App-Startup: {
  label: "Application Startup"
  shape: oval
}

Middleware: {
  label: "Dynamic Resource Middleware"
  shape: rectangle

  scan: {
    label: "1. Scan Directories"
    shape: rectangle
  }

  map: {
    label: "2. Build Resource Map"
    shape: cylinder
  }

  watch: {
    label: "3. Watch for Changes"
  }
}

Request-Handling: {
  label: "Request Handling"
  shape: rectangle

  Request: {
    label: "Incoming Request\n(e.g., GET /my-asset.png)"
    shape: rectangle
  }

  Lookup: {
    label: "4. Lookup in Map"
  }

  Serve: {
    label: "5a. Serve Resource"
    shape: rectangle
  }

  Next: {
    label: "5b. Not Found, call next()"
    shape: rectangle
  }
}

File-System: {
  label: "File System Event\n(e.g., file added)"
  shape: rectangle
}

App-Startup -> Middleware.scan: "initDynamicResourceMiddleware(options)"
Middleware.scan -> Middleware.map
Middleware.scan -> Middleware.watch

Request-Handling.Request -> Request-Handling.Lookup
Request-Handling.Lookup -> Middleware.map: "Read"
Middleware.map -> Request-Handling.Lookup
Request-Handling.Lookup -> Request-Handling.Serve: "Found"
Request-Handling.Lookup -> Request-Handling.Next: "Not Found"

File-System -> Middleware.watch: "Triggers Event"
Middleware.watch -> Middleware.map: "Update Map"
```

## Basic Usage

Here's how to configure the middleware to serve images from a dynamic `uploads` directory.

```javascript Server Setup icon=mdi:code
import express from 'express';
import { initDynamicResourceMiddleware } from '@blocklet/uploader-server';
import path from 'path';

const app = express();

const dynamicResourceMiddleware = initDynamicResourceMiddleware({
  resourcePaths: [
    {
      path: path.join(__dirname, 'uploads/images'),
      whitelist: ['.jpg', '.jpeg', '.png', '.gif'],
    },
  ],
  onReady: (count) => {
    console.log(`${count} dynamic resources are ready to be served.`);
  },
  onFileChange: (filePath, event) => {
    console.log(`File ${filePath} was ${event}.`);
  },
});

// Mount the middleware
app.use('/uploads/images', dynamicResourceMiddleware);

// On server shutdown, clean up watchers
process.on('SIGINT', () => {
  if (dynamicResourceMiddleware.cleanup) {
    dynamicResourceMiddleware.cleanup();
  }
  process.exit();
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```

## Configuration Options

The `initDynamicResourceMiddleware` function accepts a single options object with the following properties:

| Option | Type | Description |
| --- | --- | --- |
| `componentDid` | `string` | Optional. If provided, the middleware will only activate if the current component's DID matches this value. |
| `resourcePaths` | `DynamicResourcePath[]` | **Required.** An array of objects defining the directories to watch and serve. See details below. |
| `watchOptions` | `object` | Optional. Configuration for the file system watcher. |
| `cacheOptions` | `object` | Optional. Configuration for HTTP caching headers. |
| `onFileChange` | `(filePath: string, event: string) => void` | Optional. A callback function that triggers when a file is changed, added, or deleted. The `event` can be `'change'`, `'rename'`, or `'delete'`. |
| `onReady` | `(resourceCount: number) => void` | Optional. A callback that runs after the initial scan is complete and when the resource map changes, providing the total count of available resources. |
| `setHeaders` | `(res, filePath, stat) => void` | Optional. A function to set custom headers on the response before serving a file. |
| `conflictResolution` | `'first-match'` \| `'last-match'` \| `'error'` | Optional. Strategy to handle filename collisions when multiple directories contain a file with the same name. Defaults to `'first-match'`. |

### `DynamicResourcePath` Object

Each object in the `resourcePaths` array defines a source for dynamic assets.

| Property | Type | Description |
| --- | --- | --- |
| `path` | `string` | **Required.** The absolute path to the directory. It supports glob patterns (e.g., `/path/to/plugins/*/assets`) to watch multiple matching directories. |
| `whitelist` | `string[]` | Optional. An array of file extensions (e.g., `['.png', '.svg']`) to include. If specified, only files with these extensions will be served. |
| `blacklist` | `string[]` | Optional. An array of file extensions to exclude. |

### `watchOptions` Object

| Property | Type | Description |
| --- | --- | --- |
| `ignorePatterns` | `string[]` | An array of string patterns or regular expressions to ignore during watching. |
| `persistent` | `boolean` | If `true`, the process will continue running as long as files are being watched. Defaults to `true`. |
| `usePolling` | `boolean` | Whether to use polling for watching files. Can be necessary for certain network file systems. |
| `depth` | `number` | The depth of subdirectories to watch. If `undefined`, it watches recursively. |

### `cacheOptions` Object

| Property | Type | Description |
| --- | --- | --- |
| `maxAge` | `string` \| `number` | Sets the `Cache-Control` max-age header. Can be a number in milliseconds or a string like `'365d'`. Defaults to `'365d'`. |
| `immutable` | `boolean` | If `true`, adds the `immutable` directive to the `Cache-Control` header. Defaults to `true`. |
| `etag` | `boolean` | Whether to enable ETag generation. |
| `lastModified` | `boolean` | Whether to enable the `Last-Modified` header. |

## Advanced Usage

### Using Glob Patterns

To serve assets from multiple plugin directories, you can use a glob pattern. The middleware will find all matching directories and watch them for changes.

```javascript Glob Pattern Example icon=mdi:folder-search-outline
const middleware = initDynamicResourceMiddleware({
  resourcePaths: [
    {
      // Watch the 'assets' folder inside every directory under 'plugins'
      path: path.join(__dirname, 'plugins', '*', 'assets'),
      whitelist: ['.css', '.js', '.png'],
    },
  ],
});
```

### Conflict Resolution

If two watched directories contain a file named `logo.png`, the `conflictResolution` strategy determines which one is served:

-   `'first-match'` (default): The first one found during the initial scan is used. Subsequent finds are ignored.
-   `'last-match'`: The last one found will overwrite any previous entry. This is useful if you have an override mechanism.
-   `'error'`: Logs an error to the console indicating a conflict, and typically the first-match behavior is used.

## Return Value

The `initDynamicResourceMiddleware` function returns an Express middleware function. This returned function also has a `cleanup` method attached to it.

### `cleanup()`

This method should be called during a graceful server shutdown. It stops all file system watchers and clears the internal resource maps to prevent memory leaks and release file handles.

```javascript Cleanup Example icon=mdi:power-plug-off
const server = app.listen(3000);
const dynamicMiddleware = initDynamicResourceMiddleware(/* ...options */);

// ...

function gracefulShutdown() {
  console.log('Shutting down server...');
  if (dynamicMiddleware.cleanup) {
    dynamicMiddleware.cleanup();
  }
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
```