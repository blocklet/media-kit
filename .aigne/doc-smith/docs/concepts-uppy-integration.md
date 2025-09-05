# Integration with Uppy

The `@blocklet/uploader` package is built directly on top of [Uppy](https://uppy.io/), a sleek, modular open-source file uploader. It acts as a specialized wrapper, simplifying the integration of Uppy's features into the Blocklet ecosystem. By handling the setup, configuration, and theming, `@blocklet/uploader` provides a ready-to-use React component that feels native to Blocklet development.

While our package offers a streamlined experience for most use cases, understanding the underlying Uppy architecture is key to unlocking advanced customizations and troubleshooting. This document explains how `@blocklet/uploader` leverages the Uppy ecosystem.

## Architecture Overview

`@blocklet/uploader` encapsulates the core components of Uppy, coordinates plugin management, and presents the UI through Uppy's official React bindings. The relationship between these layers can be visualized as follows:

```d2
direction: down

"User Application": {
  "<Uploader /> Component (@blocklet/uploader)": {
    shape: package
    "Uppy Dashboard UI (@uppy/react)": {
      style.fill: "#f0f0f0"
    }

    "Core Uppy Instance (@uppy/core)": {
      "Plugins": {
        "grid-columns": 2
        "Standard Uppy Plugins": {
          "Tus": "Upload Protocol"
          "Webcam": "Camera Input"
          "ImageEditor": "Image Editing"
          "Url": "Import from URL"
        }
        "Custom Blocklet Plugins": {
          "Resources": "From Blocklet Resources"
          "Uploaded": "From Media Kit"
          "AIImage": "AI Image Generation"
        }
      }
    }

    "Uppy Dashboard UI (@uppy/react)" -> "Core Uppy Instance (@uppy/core)": "Interacts"
  }
}

"Core Uppy Instance (@uppy/core)" -> "Backend Server": "Uploads via Tus protocol"

```

### Key Components

1.  **Core Uppy Instance (`@uppy/core`)**: At the heart of the uploader is the main Uppy instance, created via `new Uppy()`. This instance manages the file processing lifecycle, state, and events. `@blocklet/uploader` initializes this instance with sensible defaults and configurations suitable for the Blocklet environment, such as setting up the `@uppy/tus` plugin for resumable uploads.

2.  **UI (`@uppy/react`)**: The visual interface is rendered by Uppy's official `<Dashboard />` component. Our `<Uploader />` component wraps this Dashboard, applying Material-UI theming and styles to ensure a consistent look and feel with other Blocklet components. It also controls the visibility of the uploader (e.g., as a popup modal).

3.  **Plugins (`@uppy/*`)**: Uppy's functionality is highly modular and extended through plugins. `@blocklet/uploader` pre-configures and bundles several standard Uppy plugins, including:
    *   `@uppy/webcam`: For capturing photos and videos directly from the user's camera.
    *   `@uppy/url`: For importing files from a direct URL.
    *   `@uppy/image-editor`: For basic image editing like cropping and rotating before upload.
    *   `@uppy/tus`: For enabling resumable file uploads.
    *   `@uppy/unsplash`: For importing images from Unsplash.

    In addition to these, `@blocklet/uploader` introduces its own custom plugins like `Resources`, `Uploaded`, and `AIImage` to integrate seamlessly with other Blocklets, such as the Media Kit.

## Advanced Customization and Further Reading

Many of the props available on the `<Uploader />` component, such as `coreProps`, `dashboardProps`, and `tusProps`, are passed directly down to the underlying Uppy instance and its plugins. This design allows you to access Uppy's full range of configuration options for advanced scenarios.

For a complete understanding of all available options, events, and methods, the official Uppy documentation is an indispensable resource.

<x-card data-title="Uppy Documentation" data-icon="lucide:book-open" data-href="https://uppy.io/docs/" data-cta="Read the Docs">
  Explore the official Uppy documentation for in-depth guides on its core concepts, plugins, and API.
</x-card>

By leveraging Uppy's robust foundation, `@blocklet/uploader` provides both a simple starting point and a flexible path for advanced file-handling capabilities within your Blocklet.

Now that you understand how Uppy is integrated, learn how the uploader interacts with another key Blocklet.

<x-card data-title="Next: Integration with Media Kit" data-href="/concepts/media-kit-integration" data-icon="lucide:arrow-right" data-horizontal="true">
  Discover how the uploader automatically enhances its capabilities when a Media Kit blocklet is present in the same environment.
</x-card>
