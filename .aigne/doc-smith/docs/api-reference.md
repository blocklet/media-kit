# API Reference

Welcome to the API reference for the Blocklet Uploader packages. This section provides comprehensive details on all exported components, functions, props, and configuration options for both the frontend and backend libraries. This is your go-to resource for in-depth technical information.

The uploader is split into two main packages:

- **`@blocklet/uploader`**: A flexible React component for your application's frontend.
- **`@blocklet/uploader-server`**: A set of Express middleware for handling file uploads on your backend.

While they are designed to work together seamlessly, it's important to note that `@blocklet/uploader` can be used with any backend that supports the Tus resumable upload protocol. `@blocklet/uploader-server` provides a powerful, pre-configured solution for handling upload logic within your Blocklet, but its use is optional.

```d2
direction: down

your-blocklet-app: {
  label: "Your Blocklet Application"
  shape: rectangle

  frontend: {
    label: "Frontend (React)"
    shape: rectangle
  }

  backend: {
    label: "Backend (Express)"
    shape: rectangle
  }
}

uploader: {
  label: "@blocklet/uploader"
  shape: rectangle
  style.fill: "#E6F7FF"
}

uploader-server: {
  label: "@blocklet/uploader-server"
  shape: rectangle
  style.fill: "#F6FFED"
}

your-blocklet-app.frontend -> uploader: "Imports <Uploader /> component"
your-blocklet-app.backend -> uploader-server: "Uses upload middleware"

```

Select a package below to dive into its detailed API documentation.

<x-cards data-columns="2">
  <x-card data-title="Frontend: @blocklet/uploader" data-icon="lucide:component" data-href="/api-reference/uploader">
    Explore the props, components, hooks, and utility functions available in the frontend React package for creating a rich file upload experience.
  </x-card>
  <x-card data-title="Backend: @blocklet/uploader-server" data-icon="lucide:server" data-href="/api-reference/uploader-server">
    A detailed reference for all server-side middleware functions used for handling file storage, remote sources via Companion, and serving static or dynamic resources.
  </x-card>
</x-cards>

If you need a higher-level understanding of how these packages are built and how they integrate with other systems, please see our [Concepts](./concepts.md) section.