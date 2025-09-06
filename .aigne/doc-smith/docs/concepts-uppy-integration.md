# Integration with Uppy

The `@blocklet/uploader` package is built directly on top of [Uppy](https://uppy.io/), a sleek, modular open-source file uploader for the web. By leveraging Uppy's robust core and extensive plugin ecosystem, `@blocklet/uploader` provides a powerful and familiar uploading experience while simplifying its integration into the Blocklet development environment.

This approach means you get the best of both worlds: the battle-tested reliability of Uppy and the seamless, zero-config setup within a Blocklet. You don't need to build an uploader from scratch; instead, you interact with a high-level React component that handles all the underlying Uppy configuration for you.

## Core Architecture

The `Uploader` component acts as a sophisticated wrapper around a central `Uppy` instance. It abstracts away the boilerplate code required for initialization, plugin management, and UI rendering.

Here’s a high-level look at how the pieces fit together:

```d2
direction: down

blocklet-app: {
  label: "Your Blocklet Application"
  shape: rectangle

  uploader-component: {
    label: "Uploader Component"
    shape: rectangle

    uppy-ecosystem: {
      label: "Uppy Ecosystem"
      shape: rectangle

      uppy-core: {
        label: "Uppy Core Instance"
        shape: hexagon
      }

      standard-plugins: {
        label: "Standard Uppy Plugins"
        shape: rectangle
        Dashboard: {}
        Tus: {}
        Webcam: {}
        Url: {}
      }

      custom-plugins: {
        label: "Custom Blocklet Plugins"
        shape: rectangle
        AIImage: {}
        Resources: {}
        Uploaded: {}
      }
    }
  }
}

media-kit: {
  label: "Media Kit Blocklet"
  shape: cylinder
}

blocklet-app.uploader-component.uppy-ecosystem.uppy-core -> blocklet-app.uploader-component.uppy-ecosystem.standard-plugins
blocklet-app.uploader-component.uppy-ecosystem.uppy-core -> blocklet-app.uploader-component.uppy-ecosystem.custom-plugins
blocklet-app.uploader-component <-> media-kit: "Provides Config & Plugins"
```

Key components of this architecture include:

- **Uppy Core Instance**: At the heart of the `Uploader` is a `new Uppy()` instance. This object manages the file processing queue, state, and events.
- **Standard Uppy Plugins**: The component automatically initializes and configures essential Uppy plugins. This includes:
  - `@uppy/react`: For rendering the `Dashboard` UI.
  - `@uppy/tus`: For enabling resumable uploads.
  - Other acquirer plugins like `Webcam`, `Url`, and `Unsplash` for importing files from various sources.
- **Custom Blocklet Plugins**: To enhance functionality within the ecosystem, `@blocklet/uploader` includes custom plugins like `AIImage`, `Resources`, and `Uploaded`, which integrate with other Blocklets such as the [Media Kit](./concepts-media-kit-integration.md).

## Accessing the Uppy Instance

While the `Uploader` component handles most use cases via props, you may occasionally need to interact with the underlying Uppy instance directly to access its full API. You can do this by attaching a `ref` to the component.

The `ref` exposes a `getUploader()` method, which returns the active Uppy instance. This allows for advanced customizations, such as listening to specific Uppy events or calling its methods programmatically.

```jsx
import { useRef } from 'react';
import { Uploader } from '@blocklet/uploader';

function MyComponent() {
  const uploaderRef = useRef(null);

  const handleLogFiles = () => {
    if (uploaderRef.current) {
      // Access the raw Uppy instance
      const uppy = uploaderRef.current.getUploader();
      console.log('Current files in Uppy:', uppy.getFiles());

      // You can also add event listeners
      uppy.on('upload-success', (file, response) => {
        console.log(`Upload successful for ${file.name}:`, response.uploadURL);
      });
    }
  };

  return (
    <div>
      <Uploader ref={uploaderRef} popup />
      <button onClick={() => uploaderRef.current.open()}>Open Uploader</button>
      <button onClick={handleLogFiles}>Log Files</button>
    </div>
  );
}
```

## Further Reading

This documentation focuses on the features and props specific to the `@blocklet/uploader` package. For a complete understanding of all available Uppy options, plugins, and advanced configurations, we highly recommend consulting the official [Uppy Documentation](https://uppy.io/docs/).

To learn more about how the uploader leverages other Blocklets, continue to the next section.

<x-card data-title="Integration with Media Kit" data-icon="lucide:box" data-href="/concepts/media-kit-integration" data-cta="Read More">
  Understand how the uploader automatically detects and configures itself when a Media Kit blocklet is present.
</x-card>
