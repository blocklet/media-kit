# Integration with Uppy

The `@blocklet/uploader` package is built directly on top of [Uppy](https://uppy.io/), a sleek, modular open-source file uploader for web browsers. Our package acts as a convenient React wrapper around the Uppy ecosystem, pre-configured to work seamlessly within Blocklet applications.

This approach provides a simple, out-of-the-box experience for common use cases while retaining the full power and flexibility of Uppy for advanced customizations. Understanding this relationship is key to unlocking the uploader's full potential.

## The Core Architecture

When you use the `Uploader` component, it initializes and manages a core Uppy instance behind the scenes. Many of the props you pass to our component, such as `coreProps`, `dashboardProps`, and plugin configurations, are passed directly to the underlying Uppy instance and its plugins. This makes `@blocklet/uploader` a bridge between your React application and the Uppy API.

The following diagram illustrates this layered architecture:

```d2
direction: down

Your-React-App: {
  label: "Your React App"
  shape: rectangle

  Uploader-Component-Wrapper: {
    label: "Uploader Component\n(@blocklet/uploader)"
    shape: package

    Uppy-Core: {
      label: "Uppy Core Instance"
      shape: rectangle

      Uppy-Plugins: {
        label: "Uppy Plugins"
        shape: rectangle
        grid-columns: 3
        Dashboard-UI: { label: "Dashboard UI" }
        Tus-Protocol: { label: "Tus (Resumable Uploads)" }
        Webcam: { label: "Webcam" }
        ImageEditor: { label: "Image Editor" }
        Url: { label: "URL Importer" }
        and-more: { label: "... and more" }
      }
    }
  }
}

Blocklet-Server: {
  label: "Blocklet Server"
  shape: rectangle
}

Your-React-App.Uploader-Component-Wrapper -> Your-React-App.Uploader-Component-Wrapper.Uppy-Core: "Configures with props"
Your-React-App.Uploader-Component-Wrapper.Uppy-Core -> Your-React-App.Uploader-Component-Wrapper.Uppy-Core.Uppy-Plugins: "Uses"
Your-React-App.Uploader-Component-Wrapper -> Blocklet-Server: "Uploads files via Tus"
```

## Leveraging the Uppy Ecosystem

Building on Uppy provides several key advantages:

- **Modularity**: You gain access to a rich ecosystem of Uppy plugins. Whether you need to import files from a webcam, a direct URL, or even Unsplash, there's likely an existing plugin for it.
- **Reliability**: The uploader is powered by a well-tested, widely-used, and actively maintained open-source project.
- **Advanced Customization**: For complex requirements, you can access the Uppy instance directly using a `ref` to tap into its comprehensive API for fine-grained control over events and behavior.
- **User Interface**: The Uppy Dashboard provides a polished, accessible, and user-friendly interface for file selection and upload progress monitoring.

## When to Consult the Uppy Documentation

While our documentation covers the most common use cases and Blocklet-specific features, the official Uppy documentation is the definitive resource for more advanced topics. You should refer to it when you need to:

- Understand all available options for a specific plugin (e.g., advanced Image Editor settings).
- Get a complete list of Uppy's core events (`upload-success`, `file-added`, etc.).
- Learn about the Tus resumable upload protocol.
- Dive deep into creating your own custom Uppy plugins.

<x-card data-title="Uppy Official Documentation" data-icon="lucide:book-open" data-href="https://uppy.io/docs/" data-cta="Visit Uppy Docs">
  The official Uppy documentation is the best resource for in-depth information about its core API, plugins, and advanced configuration options.
</x-card>

## Next Steps

Now that you understand the relationship between `@blocklet/uploader` and Uppy, you are better equipped to customize the uploader to your needs. 

- To see this in action, proceed to the [Configuring Plugins](./guides-configuring-plugins.md) guide.
- To learn how the uploader integrates with other Blocklets, see [Integration with Media Kit](./concepts-media-kit-integration.md).
