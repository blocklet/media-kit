# initDynamicResourceMiddleware(options)

The `initDynamicResourceMiddleware` function creates an Express middleware designed to serve files from specified directories. Unlike static middleware, it actively watches these directories for file system changes, such as additions, updates, or deletions, and updates its internal resource map in real-time. This makes it ideal for serving assets that may change without a server restart, such as user-uploaded content, themes, or plugins.

Its key features include support for glob patterns in paths, configurable file watching, caching headers, and strategies for resolving file name conflicts.

```d2
direction: down

"Server Startup": {
  "initDynamicResourceMiddleware()": {
    "1. Scan Directories (glob support)": {
      style: {
        fill: "#f0f9ff"
      }
    }
    "2. Watch Directories for Changes": {
      style: {
        fill: "#f0f9ff"
      }
    }
    "3. Build In-Memory Resource Map": {
      shape: cylinder
      style: {
        fill: "#ecfdf5"
      }
    }
    "4. Return Middleware & cleanup()": {
      style: {
        fill: "#fefce8"
      }
    }

    "1. Scan Directories (glob support)" -> "3. Build In-Memory Resource Map"
    "2. Watch Directories for Changes" -> "3. Build In-Memory Resource Map": "Update Map"
  }
}

"HTTP Request Handling": {
  "Incoming Request (e.g., /assets/logo.png)": {
    style: {
      fill: "#faf5ff"
    }
  }
  "Middleware Execution": {
    "Lookup in Resource Map": {
      shape: diamond
      style: {
        fill: "#fff1f2"
      }
    }
  }
  "Serve File": {
    style: {
      fill: "#ecfdf5"
    }
  }
  "next()": {
    style: {
      fill: "#fef9c3"
    }
  }

  "Incoming Request (e.g., /assets/logo.png)" -> "Middleware Execution"
  "Middleware Execution" -> "Lookup in Resource Map"
  "Lookup in Resource Map" -> "Serve File": "Found"
  "Lookup in Resource Map" -> "next()": "Not Found"
}

"Server Startup" -> "HTTP Request Handling": { style.animated: true }
```

## Basic Usage

Here is a minimal example of how to set up the middleware to serve images from a dynamic `uploads` directory.

```javascript
import express from 'express';
import { initDynamicResourceMiddleware } from '@blocklet/uploader-server';
import path from 'path';

const app = express();

// Initialize the middleware to watch the 'public/uploads' directory
const dynamicResourceMiddleware = initDynamicResourceMiddleware({
  resourcePaths: [
    {
      path: path.join(__dirname, 'public/uploads'),
      whitelist: ['.jpg', '.png', '.gif'], // Only serve these file types
    },
  ],
});

// Mount the middleware on a specific route
app.use('/uploads', dynamicResourceMiddleware);

const server = app.listen(3000, () => {
  console.log('Server running on port 3000');
});

// Ensure cleanup is called on server shutdown to stop file watchers
process.on('SIGTERM', () => {
  console.log('Cleaning up resources...');
  dynamicResourceMiddleware.cleanup();
  server.close();
});
```

## Options

The `initDynamicResourceMiddleware` function accepts a single configuration object with the following properties:

| Option | Type | Description |
|---|---|---|
| `resourcePaths` | `DynamicResourcePath[]` | **Required.** An array of objects defining the directories to scan and watch. See details below. |
| `componentDid` | `string` | Optional. If provided, the middleware will only activate if the current component's DID matches this value. |
| `watchOptions` | `object` | Optional. Configuration for the file system watcher. See details below. |
| `cacheOptions` | `object` | Optional. Configuration for HTTP caching headers. See details below. |
| `onFileChange` | `(filePath: string, event: string) => void` | Optional. A callback function that is triggered when a file is changed, added, or deleted. The `event` can be `'change'`, `'rename'`, or `'delete'`. |
| `onReady` | `(resourceCount: number) => void` | Optional. A callback function that is triggered after the initial scan is complete, providing the total count of resources found. |
| `setHeaders` | `(res: any, filePath: string, stat: any) => void` | Optional. A function to set custom headers on the response before a file is served. |
| `conflictResolution` | `'first-match' \| 'last-match' \| 'error'` | Optional. Defines the strategy for handling files with the same name found in multiple `resourcePaths`. Defaults to `'first-match'`. |

### `resourcePaths`

This is an array of `DynamicResourcePath` objects, each defining a location to source files from.

| Key | Type | Description |
|---|---|---|
| `path` | `string` | The absolute path to the directory. It supports glob patterns (e.g., `/path/to/themes/*/assets`) to scan multiple matching directories. |
| `whitelist` | `string[]` | Optional. An array of file extensions (e.g., `['.css', '.js']`). If provided, only files with these extensions will be served. |
| `blacklist` | `string[]` | Optional. An array of file extensions to exclude. This is ignored if `whitelist` is present. |

### `watchOptions`

These options control the behavior of the underlying file watcher.

| Key | Type | Description | Default |
|---|---|---|---|
| `ignorePatterns` | `string[]` | An array of string patterns or regular expressions to ignore file change events for. | `undefined` |
| `persistent` | `boolean` | If `true`, the Node.js process will continue running as long as files are being watched. | `true` |
| `usePolling` | `boolean` | Whether to use file system polling, which can be necessary for some network file systems. | `undefined` |
| `depth` | `number` | The depth of subdirectories to watch. If `undefined`, it watches recursively. | `undefined` |

### `cacheOptions`

These options configure the `Cache-Control` and other caching-related headers.

| Key | Type | Description | Default |
|---|---|---|---|
| `maxAge` | `string \| number` | The value for the `max-age` directive in the `Cache-Control` header. Can be a number in milliseconds or a string like `'365d'`. | `'365d'` |
| `immutable` | `boolean` | If `true`, adds the `immutable` directive to the `Cache-Control` header, indicating the resource will never change. | `true` |
| `etag` | `boolean` | Whether to generate and use ETag headers for cache validation. | `true` (implicitly enabled) |
| `lastModified` | `boolean` | Whether to use the `Last-Modified` header for cache validation. | `true` (implicitly enabled) |

## Advanced Usage

### Conflict Resolution

If two different directories in `resourcePaths` contain a file with the same name (e.g., `logo.png`), the `conflictResolution` strategy determines which one is served.

- **`first-match` (Default):** The file from the directory that appears first in the `resourcePaths` array is used. Any subsequent files with the same name are ignored.
- **`last-match`:** The file from the directory that appears last in the `resourcePaths` array is used, overwriting any previously found versions.
- **`error`:** An error is logged to the console during the scanning phase if a conflict is detected. The behavior will be the same as `first-match`.

```javascript
// Example: /data/theme1/logo.png and /data/theme2/logo.png both exist.
const middleware = initDynamicResourceMiddleware({
  resourcePaths: [
    { path: '/data/theme1' },
    { path: '/data/theme2' },
  ],
  conflictResolution: 'last-match', // A request for /logo.png will serve from theme2
});
```

### Using Hooks

You can use `onFileChange` and `onReady` to monitor the middleware's state.

```javascript
const middleware = initDynamicResourceMiddleware({
  resourcePaths: [{ path: '/path/to/assets' }],
  onReady: (count) => {
    console.log(`Dynamic resource middleware is ready. Found ${count} files.`);
  },
  onFileChange: (filePath, event) => {
    console.log(`File ${event}: ${filePath}`);
  },
});
```

## Return Value

The function returns an Express middleware function that has an additional method attached:

- **Middleware Function:** The function to be used with `app.use()`.
- **`cleanup()`:** A method that stops all file watchers and clears the internal resource map. It is crucial to call this method during a graceful server shutdown to prevent memory leaks and dangling file system watchers, especially in development environments with hot-reloading.