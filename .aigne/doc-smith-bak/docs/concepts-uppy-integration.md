# Integration with Uppy

The `@blocklet/uploader` package is built directly on top of [Uppy](https://uppy.io/), a sleek, modular, and open-source file uploader for the web. Instead of building a file uploader from scratch, we leverage Uppy's powerful core engine, extensive plugin ecosystem, and polished user interface. This allows us to provide a robust and feature-rich upload experience while focusing on seamless integration within the Blocklet ecosystem.

This approach means that `@blocklet/uploader` is essentially a pre-configured and enhanced wrapper around Uppy, tailored specifically for Blocklet development.

## Core Architecture

The `Uploader` component initializes and manages a core Uppy instance. It then integrates a set of standard Uppy plugins for common functionality (like the Dashboard UI, Webcam access, and Tus for resumable uploads) and layers on custom plugins designed to interact with other Blocklets, such as the Media Kit.

The following diagram illustrates this relationship:

```d2
direction: down

blocklet-app: {
  label: "Your Blocklet Application"
  shape: rectangle

  uploader-component: {
    label: "Uploader Component\n(@blocklet/uploader)"
    shape: rectangle

    uppy-ecosystem: {
      label: "Uppy Ecosystem"
      shape: rectangle

      uppy-core: {
        label: "Uppy Core Instance"
      }

      standard-plugins: {
        label: "Standard Uppy Plugins"
        shape: rectangle
        Dashboard: {}
        Tus: {}
        Webcam: {}
        Url: {}
        ImageEditor: {}
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

blocklet-app.uploader-component.uppy-ecosystem.uppy-core -> blocklet-app.uploader-component.uppy-ecosystem.standard-plugins: "manages"
blocklet-app.uploader-component.uppy-ecosystem.uppy-core -> blocklet-app.uploader-component.uppy-ecosystem.custom-plugins: "manages"
```

## Accessing the Core Uppy Instance

For advanced use cases, you may need to interact with the underlying Uppy instance directly to access its rich API. The `Uploader` component provides a `ref` that exposes a `getUploader()` method, giving you full access to the Uppy object.

This allows you to programmatically control the uploader, listen for Uppy-specific events, or call any method available in the [Uppy API documentation](https://uppy.io/docs/uppy/).

```jsx Accessing the Uploader Instance icon=logos:react
import { useRef, useEffect } from 'react';
import { Uploader } from '@blocklet/uploader';

export default function MyComponent() {
  const uploaderRef = useRef(null);

  useEffect(() => {
    if (uploaderRef.current) {
      const uppy = uploaderRef.current.getUploader();

      // You can now use the full Uppy API
      uppy.on('complete', (result) => {
        console.log('Upload complete!', result.successful);
      });

      console.log('Uppy instance is ready:', uppy.getID());
    }
  }, []);

  return <Uploader ref={uploaderRef} popup />;
}
```

## Decoupled Frontend and Backend

It is important to understand that `@blocklet/uploader` is a frontend-only package. It is responsible for the user interface and client-side upload logic. It **does not depend on `@blocklet/uploader-server`**.

By default, it uses the [Tus protocol](https://tus.io/) for resumable uploads, meaning it can communicate with *any* backend server that implements the Tus specification. `@blocklet/uploader-server` is provided as a convenient, ready-to-use backend solution for Blocklet developers, but you are free to implement your own or use a different Tus-compatible service.

## For More Information

While our documentation covers the most common use cases and configurations for `@blocklet/uploader`, the official Uppy documentation is an invaluable resource for more advanced topics. If you want to dive deeper into Uppy's core concepts, explore its full range of plugins, or even create your own custom plugin, their website is the best place to start.

<x-card data-title="Uppy Official Documentation" data-icon="lucide:book-open" data-href="https://uppy.io/docs/quick-start/" data-cta="Visit Uppy.io">
  Explore the comprehensive Uppy documentation for in-depth guides, API references, and advanced customization options.
</x-card>
