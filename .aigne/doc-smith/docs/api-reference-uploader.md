# Frontend: @blocklet/uploader

The `@blocklet/uploader` package provides a highly customizable and feature-rich file uploading component for React applications. It is built on top of the popular open-source file uploader [Uppy](https://uppy.io), offering a robust foundation with a simplified API tailored for the Blocklet ecosystem.

This package is designed to work seamlessly with or without a backend. It can function as a standalone client-side uploader or integrate deeply with a backend service like `@blocklet/uploader-server` or a Media Kit blocklet for enhanced features such as server-side processing, file restrictions, and access to shared resources.

To get started, refer to the [Frontend Setup](./getting-started-frontend-setup.md) guide.

## Architecture Overview

The `@blocklet/uploader` component acts as a sophisticated wrapper around Uppy's core engine and its plugin ecosystem. It handles initialization, configuration, and state management, providing a clean React interface for developers.

```d2
direction: down

"User-Application": {
  label: "User Application"
  shape: rectangle

  "blocklet-uploader": {
    label: "@blocklet/uploader"
    shape: package
    grid-columns: 1

    "Uploader-Component": {
        label: "Uploader Component"
        shape: rectangle
        "React UI Wrapper"
    }

    "Uppy-Core": {
        label: "Uppy Core"
        shape: hexagon
        "File processing engine"
    }

    "Plugins": {
      shape: package
      grid-columns: 2
      "Dashboard-UI": "Main UI"
      "ImageEditor": "Image Editing"
      "Webcam": "Camera Access"
      "Custom-Plugins": "AI, Resources..."
    }

    "Tus-Client": {
        label: "Tus resumable uploads"
        shape: rectangle
    }

    "Uploader-Component" -> "Uppy-Core": "Initializes & controls"
    "Uppy-Core" -> "Plugins": "Uses"
    "Uppy-Core" -> "Tus-Client": "Uploads via"
  }
}

"Backend-Server": {
  label: "Backend Server\n(e.g., Media Kit)"
  shape: cylinder
}

"User-Application" -> "blocklet-uploader": "Integrates"
"blocklet-uploader"."Tus-Client" -> "Backend-Server": "HTTP Requests"
```

## Key Components and APIs

This section provides a detailed reference for all the major components, hooks, and functions available in the `@blocklet/uploader` package. Explore the following pages to learn how to implement and customize the uploader for your specific needs.

<x-cards data-columns="2">
  <x-card data-title="<Uploader /> Component Props" data-icon="lucide:component" data-href="/api-reference/uploader/component-props">
    Explore the full range of props for the main Uploader component, from core settings to plugin configurations.
  </x-card>
  <x-card data-title="<UploaderProvider /> and Hooks" data-icon="lucide:hook" data-href="/api-reference/uploader/provider-hooks">
    Learn how to control the uploader programmatically using the UploaderProvider and associated React hooks.
  </x-card>
  <x-card data-title="Utility Functions" data-icon="lucide:wrench" data-href="/api-reference/uploader/utility-functions">
    A reference for helper functions for tasks like file conversion, URL generation, and Uppy instance manipulation.
  </x-card>
  <x-card data-title="Available Plugins" data-icon="lucide:puzzle" data-href="/api-reference/uploader/plugins">
    Discover the custom-built plugins available, such as AI Image Generation, Uploaded Files, and Resources.
  </x-card>
</x-cards>

## Next Steps

After familiarizing yourself with the frontend components, you may want to explore the backend setup to handle file storage and processing.

*   **Backend API Reference**: Dive into the [Backend: @blocklet/uploader-server](./api-reference-uploader-server.md) documentation.
*   **Return to API Index**: Go back to the main [API Reference](./api-reference.md) page.