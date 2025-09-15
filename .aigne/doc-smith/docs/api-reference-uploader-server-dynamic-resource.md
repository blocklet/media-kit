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

const server = app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```

## Configuration Options

The `initDynamicResourceMiddleware` function accepts a single options object with the following properties:

<x-field data-name="componentDid" data-type="string" data-required="false" data-desc="If provided, the middleware will only activate if the current component's DID matches this value."></x-field>
<x-field data-name="resourcePaths" data-type="DynamicResourcePath[]" data-required="true" data-desc="An array of objects defining the directories to watch and serve."></x-field>
<x-field data-name="watchOptions" data-type="object" data-required="false" data-desc="Configuration for the file system watcher."></x-field>
<x-field data-name="cacheOptions" data-type="object" data-required="false" data-desc="Configuration for HTTP caching headers."></x-field>
<x-field data-name="onFileChange" data-type="(filePath: string, event: string) => void" data-required="false" data-desc="A callback function that triggers when a file is changed, added, or deleted. The `event` can be 'change', 'rename', or 'delete'."></x-field>
<x-field data-name="onReady" data-type="(resourceCount: number) => void" data-required="false" data-desc="A callback that runs after the initial scan is complete and when the resource map changes, providing the total count of available resources."></x-field>
<x-field data-name="setHeaders" data-type="(res, filePath, stat) => void" data-required="false" data-desc="A function to set custom headers on the response before serving a file."></x-field>
<x-field data-name="conflictResolution" data-type="'first-match' | 'last-match' | 'error'" data-default="'first-match'" data-required="false" data-desc="Strategy to handle filename collisions when multiple directories contain a file with the same name."></x-field>

### `DynamicResourcePath` Object

Each object in the `resourcePaths` array defines a source for dynamic assets.

<x-field data-name="path" data-type="string" data-required="true" data-desc="The absolute path to the directory. It supports glob patterns (e.g., `/path/to/plugins/*/assets`) to watch multiple matching directories."></x-field>
<x-field data-name="whitelist" data-type="string[]" data-required="false" data-desc="An array of file extensions (e.g., `['.png', '.svg']`) to include. If specified, only files with these extensions will be served."></x-field>
<x-field data-name="blacklist" data-type="string[]" data-required="false" data-desc="An array of file extensions to exclude."></x-field>

### `watchOptions` Object

<x-field data-name="ignorePatterns" data-type="string[]" data-required="false" data-desc="An array of string patterns or regular expressions to ignore during watching."></x-field>
<x-field data-name="persistent" data-type="boolean" data-default="true" data-required="false" data-desc="If `true`, the process will continue running as long as files are being watched."></x-field>
<x-field data-name="usePolling" data-type="boolean" data-required="false" data-desc="Whether to use polling for watching files. Can be necessary for certain network file systems."></x-field>
<x-field data-name="depth" data-type="number" data-required="false" data-desc="The depth of subdirectories to watch. If `undefined`, it watches recursively."></x-field>

### `cacheOptions` Object

<x-field data-name="maxAge" data-type="string | number" data-default="'365d'" data-required="false" data-desc="Sets the `Cache-Control` max-age header. Can be a number in milliseconds or a string like `'365d'`."></x-field>
<x-field data-name="immutable" data-type="boolean" data-default="true" data-required="false" data-desc="If `true`, adds the `immutable` directive to the `Cache-Control` header."></x-field>
<x-field data-name="etag" data-type="boolean" data-required="false" data-desc="Whether to enable ETag generation."></x-field>
<x-field data-name="lastModified" data-type="boolean" data-required="false" data-desc="Whether to enable the `Last-Modified` header."></x-field>

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
-   `'error'`: Logs an error to the console indicating a conflict, and the first-match behavior is typically used.

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