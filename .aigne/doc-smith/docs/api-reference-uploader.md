# Frontend: @blocklet/uploader

The `@blocklet/uploader` package provides a powerful and highly customizable React component for handling file uploads within the Blocklet ecosystem. It is built on top of [Uppy](https://uppy.io/), a sleek, modular open-source file uploader, ensuring a robust and user-friendly experience.

This package is designed to work seamlessly as a standalone component in any React application. However, its full potential is unlocked when used in conjunction with a [Media Kit blocklet](./concepts-media-kit-integration.md), which provides centralized file management, advanced features like AI image generation, and pre-configured settings.

### Architecture Overview

The `Uploader` component acts as an orchestrator for an Uppy instance. It combines Uppy's core logic with a suite of standard plugins (like Webcam and URL import) and custom plugins tailored for the Blocklet environment (like AI Image and Resources). This modular architecture allows for great flexibility and feature richness.

```d2 Component Architecture icon=mdi:sitemap
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

### Core Concepts

The package exposes two primary ways to integrate the uploader:

1.  **Direct Component:** The `<Uploader />` component can be rendered directly in your application. It can be configured to appear inline or as a modal dialog.
2.  **Provider Pattern:** For more complex use cases, the `<UploaderProvider />` and `<UploaderTrigger />` components allow you to programmatically open the uploader from any part of your application, such as a button click.

### Basic Usage

Here is a minimal example of how to render the Uploader as a popup modal. A ref is used to gain access to its `open` and `close` methods.

```javascript Basic Uploader Example icon=logos:react
import { useRef } from 'react';
import Uploader from '@blocklet/uploader';
import Button from '@mui/material/Button';

export default function MyComponent() {
  const uploaderRef = useRef(null);

  const handleOpen = () => {
    uploaderRef.current?.open();
  };

  return (
    <div>
      <Button onClick={handleOpen}>Open Uploader</Button>
      <Uploader ref={uploaderRef} popup={true} />
    </div>
  );
}
```

This simple setup will render a button that, when clicked, opens the fully-featured Uploader modal.

### API Reference Deep Dive

To fully leverage the capabilities of `@blocklet/uploader`, explore the detailed API documentation for its components, hooks, and utilities.

<x-cards data-columns="2">
  <x-card data-title="<Uploader /> Component Props" data-icon="lucide:component" data-href="/api-reference/uploader/component-props">
    Explore the full range of props for the Uploader component, including core settings, dashboard options, and plugin configurations.
  </x-card>
  <x-card data-title="<UploaderProvider /> and Hooks" data-icon="lucide:workflow" data-href="/api-reference/uploader/provider-hooks">
    Learn how to use the UploaderProvider and hooks for programmatically controlling the uploader from anywhere in your app.
  </x-card>
  <x-card data-title="Available Plugins" data-icon="lucide:puzzle" data-href="/api-reference/uploader/plugins">
    Discover the custom-built plugins like AI Image generation, Uploaded files, and Resources that enhance the uploader's functionality.
  </x-card>
  <x-card data-title="Utility Functions" data-icon="lucide:wrench" data-href="/api-reference/uploader/utility-functions">
    Reference for helper functions for tasks like file conversion, URL generation, and Uppy instance manipulation.
  </x-card>
</x-cards>

By understanding these building blocks, you can tailor the uploader to perfectly fit your application's needs. For a complete file upload solution, remember to also set up the corresponding backend service as described in the [@blocklet/uploader-server](./api-reference-uploader-server.md) documentation.