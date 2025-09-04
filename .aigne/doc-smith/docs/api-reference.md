# API Reference

This section provides a comprehensive technical reference for the `@blocklet/uploader` and `@blocklet/uploader-server` packages. Here you will find detailed information on all components, functions, props, and configuration options available for building your file upload solution.

The diagram below illustrates the typical interaction between the frontend and backend components in a blocklet application.

```d2
direction: down

User-Browser: {
  label: "User's Browser"
  shape: rectangle

  React-App: {
    label: "Your React App"
    shape: rectangle

    Uploader-Component: {
      label: "@blocklet/uploader"
      shape: package
    }
  }
}

Blocklet-Server: {
  label: "Your Blocklet Server"
  shape: rectangle

  Express-App: {
    label: "Your Express App"
    shape: rectangle

    Uploader-Middleware: {
      label: "@blocklet/uploader-server"
      shape: package
    }
  }
}

Storage: {
  label: "Storage\n(e.g., File System, Media Kit)"
  shape: cylinder
}

User-Browser.React-App.Uploader-Component -> Blocklet-Server.Express-App.Uploader-Middleware: "File Upload (HTTP)"
Blocklet-Server.Express-App.Uploader-Middleware -> Storage: "Saves File"

```

## Frontend: @blocklet/uploader

The `@blocklet/uploader` package provides a highly customizable React component for handling file uploads in the browser. It is built on top of [Uppy](https://uppy.io), a popular open-source file uploader, and is designed to be easy to integrate into any React-based blocklet.

<x-cards data-columns="2">
  <x-card data-title="<Uploader /> Component Props" data-icon="lucide:component" data-href="/api-reference/uploader/component-props">
    Explore the full range of props available for the Uploader component, including core settings, dashboard options, and plugin configurations.
  </x-card>
  <x-card data-title="<UploaderProvider /> and Hooks" data-icon="lucide:hook" data-href="/api-reference/uploader/provider-hooks">
    Learn how to use the UploaderProvider, UploaderTrigger, and useUploaderContext hook for programmatically controlling the uploader.
  </x-card>
  <x-card data-title="Utility Functions" data-icon="lucide:function-square" data-href="/api-reference/uploader/utility-functions">
    Reference for exported helper functions for tasks like file conversion, URL generation, and Uppy instance manipulation.
  </x-card>
  <x-card data-title="Available Plugins" data-icon="lucide:puzzle" data-href="/api-reference/uploader/plugins">
    Reference for the custom-built plugins like AI Image generation, Uploaded files, and Resources.
  </x-card>
</x-cards>

## Backend: @blocklet/uploader-server

The `@blocklet/uploader-server` package offers a collection of Express middleware to handle file uploads on the server-side. It seamlessly integrates with `@blocklet/uploader` to process, store, and serve files within your blocklet. While `@blocklet/uploader` can work with any Tus-compatible backend, this package is optimized for the Blocklet environment and simplifies the setup process.

<x-cards data-columns="2">
  <x-card data-title="initLocalStorageServer(options)" data-icon="lucide:server" data-href="/api-reference/uploader-server/local-storage">
    Detailed API for the local storage middleware, including all configuration options for handling direct file uploads.
  </x-card>
  <x-card data-title="initCompanion(options)" data-icon="lucide:link-2" data-href="/api-reference/uploader-server/companion">
    API reference for the Companion middleware, detailing options for connecting to remote file sources like Unsplash and direct URLs.
  </x-card>
  <x-card data-title="initStaticResourceMiddleware(options)" data-icon="lucide:folder-cog" data-href="/api-reference/uploader-server/static-resource">
    Learn how to use this middleware to serve static assets from other installed blocklets.
  </x-card>
  <x-card data-title="initDynamicResourceMiddleware(options)" data-icon="lucide:folder-sync" data-href="/api-reference/uploader-server/dynamic-resource">
    API reference for serving dynamic resources from specified directories with support for real-time file watching.
  </x-card>
</x-cards>

---

This API reference is your resource for deep-diving into the technical details of each package. For a higher-level understanding of the architecture and key ideas, check out the [Concepts](./concepts.md) section.