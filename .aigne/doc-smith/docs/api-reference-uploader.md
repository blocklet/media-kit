# Frontend: @blocklet/uploader

The `@blocklet/uploader` package provides a flexible and feature-rich file uploading component for React applications. Built on the robust [Uppy](https://uppy.io/) file uploader, it offers a seamless user experience, integration with Blocklet services like the Media Kit, and a highly customizable plugin architecture.

This package is designed to be easy to integrate, whether you need a simple inline uploader or a globally accessible modal that can be triggered from anywhere in your application. It comes pre-configured with essential plugins like drag-and-drop, webcam access, URL importing, and an image editor.

### Component Architecture

The package offers two primary ways to integrate the uploader, providing flexibility for different use cases. You can either use the `<Uploader />` component directly or leverage the `<UploaderProvider />` for global state management.

```d2
direction: down

"@blocklet/uploader" {
  "Integration Patterns" {
    "Direct Usage": {
      "<Uploader />": "Standalone or popup component controlled by props and refs."
    }

    "Context-based Usage": {
      "<UploaderProvider />": "Wraps your app to provide global uploader context."
      "useUploaderContext()": "Hook to access the uploader instance."
      "<UploaderTrigger />": "Component to open the global uploader."

      "<UploaderProvider />" -> "useUploaderContext()"
      "<UploaderProvider />" -> "<UploaderTrigger />"
    }
  }

  "Core Component" {
    "Uploader Component": {
      shape: package
      "Dashboard UI": "(@uppy/react)"
      "Core Logic": "(@uppy/core)"
      "Plugins": {
        grid-columns: 2
        "Webcam": ""
        "Image Editor": ""
        "AI Image": ""
        "URL Import": ""
      }
    }
  }

  "Integration Patterns" -> "Core Component": "Uses"
}

```

This section of the API reference provides a deep dive into the components, props, and hooks available in the package. Choose a topic below to get started.

<x-cards data-columns="3">
  <x-card data-title="<Uploader /> Component Props" data-icon="lucide:component" data-href="/api-reference/uploader/component-props">
    Explore the full range of props available for the main `Uploader` component, including core settings, dashboard options, and plugin configurations.
  </x-card>
  <x-card data-title="<UploaderProvider /> and Hooks" data-icon="lucide:workflow" data-href="/api-reference/uploader/provider-hooks">
    Learn how to use the `UploaderProvider`, `UploaderTrigger`, and `useUploaderContext` hook for programmatically controlling the uploader globally.
  </x-card>
  <x-card data-title="Available Plugins" data-icon="lucide:plug" data-href="/api-reference/uploader/plugins">
    A detailed reference for the custom-built plugins like AI Image generation, Uploaded files, and Resources.
  </x-card>
</x-cards>

---

After reviewing the frontend components, you may want to explore the server-side setup required to handle the uploads. For more information, see the [Backend: @blocklet/uploader-server](./api-reference-uploader-server.md) documentation.