# API Reference

Welcome to the API reference for the Blocklet Uploader packages. This section provides detailed documentation on all the available components, functions, props, and options for both the frontend and backend libraries. Whether you're customizing the user interface or implementing complex server-side upload logic, you'll find the necessary details here.

The uploader solution is split into two primary packages: `@blocklet/uploader` for the frontend UI and `@blocklet/uploader-server` for optional backend middleware. It's important to note that `@blocklet/uploader` can function independently, especially when used within an environment with a Media Kit blocklet, which provides the necessary upload endpoints. The `@blocklet/uploader-server` package is only required if you need to build custom upload handling, integrate remote providers like Unsplash, or serve static resources directly from your blocklet's backend.

```d2
direction: down

Developer-Application: {
  label: "Your Blocklet"
  shape: rectangle

  Frontend: {
    label: "Frontend"
    shape: rectangle
    blocklet-uploader: {
      label: "@blocklet/uploader"
      shape: hexagon
    }
  }

  Backend: {
    label: "Backend (Optional)"
    shape: rectangle
    style.stroke-dash: 4
    blocklet-uploader-server: {
      label: "@blocklet/uploader-server"
      shape: hexagon
    }
  }
}

Media-Kit: {
  label: "Media Kit Blocklet\n(Handles Uploads)"
  shape: cylinder
}

Developer-Application.Frontend.blocklet-uploader -> Media-Kit: "Uploads files to"
Developer-Application.Frontend.blocklet-uploader -> Developer-Application.Backend.blocklet-uploader-server: "Custom upload logic" {
  style.stroke-dash: 4
}
```

This reference is divided into two main sections, one for each package:

<x-cards data-columns="2">
  <x-card data-title="Frontend: @blocklet/uploader" data-icon="lucide:component" data-href="/api-reference/uploader">
    Dive into the React components, hooks, and utility functions that power the uploader's user interface. This reference covers everything you need to render, customize, and interact with the frontend uploader.
  </x-card>
  <x-card data-title="Backend: @blocklet/uploader-server" data-icon="lucide:server" data-href="/api-reference/uploader-server">
    Explore the Express middleware functions for handling file storage, integrating with remote sources via Companion, and serving static or dynamic resources from your blocklet's backend.
  </x-card>
</x-cards>

Each section provides detailed explanations, parameter tables, and practical code examples to help you integrate the uploader effectively. To begin, we recommend exploring the [Frontend: @blocklet/uploader API Reference](./api-reference-uploader.md) to understand how to render and configure the UI component.