# initStaticResourceMiddleware(options)

The `initStaticResourceMiddleware` is an Express middleware designed to serve static assets from other installed blocklets. This is particularly useful when your blocklet needs to access resources like image packs, font libraries, or other shared assets provided by component blocklets without hardcoding paths. The middleware automatically discovers these resources based on predefined types, maps them, and serves them efficiently. It also listens for component lifecycle events to automatically update its resource map when blocklets are added, removed, or updated.

### How It Works

The middleware operates through two main processes: a background mapping process and a request handling flow.

```d2
direction: down

sub-graph-request-flow: {
    label: "Request Flow"
    grid-columns: 1

    Client: {
        shape: person
    }

    Your-Blocklet-Server: {
        label: "Your Blocklet (Express App)"
        shape: package

        Static-Middleware: {
            label: "initStaticResourceMiddleware"
            shape: hexagon
        }
    }
    
    Resource-Map: {
        label: "In-Memory\nResource Map"
        shape: stored_data
    }
    
    Other-Blocklet-Storage: {
        label: "Other Blocklet's\nFile System"
        shape: cylinder
    }

    Client -> Your-Blocklet-Server.Static-Middleware: "1. GET /asset.jpg"
    Your-Blocklet-Server.Static-Middleware -> Resource-Map: "2. Lookup asset.jpg"
    Resource-Map -> Your-Blocklet-Server.Static-Middleware: "3. Return file path"
    Your-Blocklet-Server.Static-Middleware -> Other-Blocklet-Storage: "4. Read file"
    Other-Blocklet-Storage -> Your-Blocklet-Server.Static-Middleware: "5. File stream"
    Your-Blocklet-Server.Static-Middleware -> Client: "6. Send response"
}

sub-graph-mapping-process: {
    label: "Background Mapping Process"
    grid-columns: 1
    
    Blocklet-SDK-Events: {
        label: "Blocklet SDK Events\n(e.g., component started)"
        shape: oval
    }
    
    Mapping-Function: {
        label: "mappingResource()"
        shape: rectangle
    }

    Resource-Map-Update: {
        label: "In-Memory\nResource Map"
        shape: stored_data
    }

    Blocklet-SDK-Events -> Mapping-Function: "Triggers"
    Mapping-Function -> Resource-Map-Update: "Updates"
}
```

1.  **Background Mapping**: On server start and whenever a component's status changes, the middleware scans all installed blocklets that match the configured `resourceTypes`. It builds an in-memory map of every discoverable file, linking a simple filename to its full physical path.
2.  **Request Handling**: When a request comes in, the middleware quickly looks up the requested filename in its map. If a match is found, it serves the file directly from the corresponding blocklet's directory. If not, it passes the request to the next middleware in the chain.

### Usage

To use the middleware, import it and add it to your Express application's middleware stack.

```javascript
import express from 'express';
import { initStaticResourceMiddleware } from '@blocklet/uploader-server';

const app = express();

// Basic usage: Serve resources of type 'imgpack' from the ImageBin component
// This is a common default for accessing images managed by a Media Kit instance.
app.use(initStaticResourceMiddleware({
  express,
  resourceTypes: ['imgpack'], // 'imgpack' is a predefined type for Media Kit
}));

// Advanced usage: Define custom resource types and options
const myResourceTypes = [
  {
    type: 'my-custom-assets',
    did: 'z8iZq...did-of-asset-provider', // Specify the component DID
    folder: ['images', 'fonts'], // Scan multiple subdirectories
    whitelist: ['.png', '.jpg', '.woff2'],
  },
  'imgpack', // You can mix strings and objects
];

app.use('/assets', initStaticResourceMiddleware({
  express,
  resourceTypes: myResourceTypes,
  skipRunningCheck: true, // Scan components even if they are not running
  options: {
    maxAge: '7d', // Set cache control for 7 days
    immutable: true,
  },
}));

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```

### Parameters

The `initStaticResourceMiddleware` function accepts a single options object with the following properties:

| Parameter          | Type                               | Description                                                                                                                                                             |
| ------------------ | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `express`          | `object`                           | **Required.** The Express application instance.                                                                                                                         |
| `resourceTypes`    | `(string \| ResourceType)[]`        | An array defining the resource types to scan for. Can be a simple string (type name) or a detailed `ResourceType` object for more control. Defaults to serving `'imgpack'` from the official ImageBin component. |
| `options`          | `object`                           | An optional object with settings passed to the underlying file serving mechanism. See `options` table below.                                                          |
| `skipRunningCheck` | `boolean`                          | If `true`, the middleware will scan for resources in components that are installed but not currently running. Defaults to `false`.                                        |

#### `options` Object

| Key         | Type      | Description                                                                                              |
| ----------- | --------- | -------------------------------------------------------------------------------------------------------- |
| `maxAge`    | `string`  | Sets the `Cache-Control` max-age header. The format is a string like `'365d'` or `'7d'`. Defaults to `'365d'`. |
| `immutable` | `boolean` | If `true`, adds the `immutable` directive to the `Cache-Control` header. Defaults to `true`.               |

#### `ResourceType` Object

When you need more control than just specifying a type name as a string, you can use a `ResourceType` object in the `resourceTypes` array. It has the following properties:

| Key         | Type                                    | Description                                                                                                                                                           |
| ----------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`      | `string`                                | **Required.** A unique name for the resource type. This is used to match against the `type` field in a component's `blocklet.yml`.                                            |
| `did`       | `string`                                | **Required.** The DID of the blocklet that provides this resource type.                                                                                             |
| `folder`    | `string \| string[]`                      | The subdirectory or subdirectories within the component's path to scan for resources. An empty string `''` means the root of the component's path. Defaults to `''`. |
| `whitelist` | `string[]`                              | An optional array of file extensions to include (e.g., `['.png', '.jpg']`). If provided, only files with these extensions will be mapped.                              |
| `blacklist` | `string[]`                              | An optional array of file extensions to exclude (e.g., `['.md', '.txt']`).                                                                                           |
| `setHeaders`| `(res, filePath, statObj) => void`      | An optional function to set custom headers on the response.                                                                                                         |
| `immutable` | `boolean`                               | Overrides the top-level `immutable` option for this specific resource type.                                                                                         |
| `maxAge`    | `string`                                | Overrides the top-level `maxAge` option for this specific resource type.                                                                                            |

---

Next, learn how to serve files from a dynamic, watch-enabled directory using the [initDynamicResourceMiddleware(options)](./api-reference-uploader-server-dynamic-resource.md).
