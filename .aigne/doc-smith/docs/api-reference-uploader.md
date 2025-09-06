# Frontend: @blocklet/uploader

The `@blocklet/uploader` package provides a powerful and flexible file uploading component for React applications. It is built on top of the robust and popular [Uppy](https://uppy.io/) file uploader, offering a familiar, feature-rich interface that is deeply integrated with the Blocklet ecosystem. Whether you need a simple inline drag-and-drop area or a full-featured modal with camera, URL, and cloud import capabilities, this package has you covered.

It is designed to work seamlessly with the `@blocklet/uploader-server` backend package but is not dependent on it, giving you the flexibility to implement your own custom server-side logic.

### Architecture Overview

The `@blocklet/uploader` component acts as a sophisticated wrapper around the Uppy core. It initializes the Uppy instance, configures a suite of standard plugins (like Dashboard, Tus for resumable uploads, Webcam, etc.), and integrates custom plugins unique to the Blocklet environment, such as `AIImage`, `Resources`, and `Uploaded`. When a Media Kit blocklet is present in the same environment, the uploader can automatically configure itself with shared settings and enable additional features.

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
      grid-columns: 1

      uppy-core: {
        label: "Uppy Core Instance"
        shape: hexagon
      }

      standard-plugins: {
        label: "Standard Uppy Plugins"
        shape: rectangle
        grid-columns: 2
        Dashboard: {}
        Tus: {}
        Webcam: {}
        Url: {}
      }

      custom-plugins: {
        label: "Custom Blocklet Plugins"
        shape: rectangle
        grid-columns: 2
        AIImage: { label: "AI Image" }
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

blocklet-app.uploader-component.uppy-ecosystem.uppy-core -> blocklet-app.uploader-component.uppy-ecosystem.standard-plugins: "Manages"
blocklet-app.uploader-component.uppy-ecosystem.uppy-core -> blocklet-app.uploader-component.uppy-ecosystem.custom-plugins: "Manages"
blocklet-app.uploader-component <-> media-kit: "Auto-configures &\nprovides plugins"
```

### Core Components and APIs

The package exports several key components and hooks to handle various use cases, from simple setups to complex, programmatically controlled integrations. Explore the detailed API reference for each part to unlock the full potential of the uploader.

<x-cards data-columns="2">
  <x-card data-title="<Uploader /> Component Props" data-icon="lucide:component" data-href="/api-reference/uploader/component-props">
    The primary component for rendering the uploader UI. Dive into its extensive props to customize every aspect of its behavior, appearance, and functionality.
  </x-card>
  <x-card data-title="<UploaderProvider /> and Hooks" data-icon="lucide:workflow" data-href="/api-reference/uploader/provider-hooks">
    For advanced use cases, learn how to use the provider pattern and hooks to control the uploader programmatically from any component in your application.
  </x-card>
  <x-card data-title="Available Plugins" data-icon="lucide:puzzle" data-href="/api-reference/uploader/plugins">
    Explore the powerful custom plugins provided out-of-the-box, such as AI Image Generation, browsing already uploaded files, and accessing resources from other blocklets.
  </x-card>
  <x-card data-title="Utility Functions" data-icon="lucide:wrench" data-href="/api-reference/uploader/utility-functions">
    A set of exported helper functions to simplify common tasks like file type conversion, URL generation, and direct manipulation of the Uppy instance.
  </x-card>
</x-cards>

### Basic Usage

Getting started with the uploader is straightforward. The recommended approach is to use the `UploaderProvider` at the root of your application (or a relevant subtree) and the `UploaderTrigger` to open the uploader UI.

Here's a typical example of how to add an "Upload File" button to your application that opens the uploader in a modal.

```jsx
import { UploaderProvider, UploaderTrigger } from '@blocklet/uploader';
import Button from '@mui/material/Button'; // Example using Material-UI

// Import the necessary CSS for the uploader.
// This is typically done once in your main application file.
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';

export default function MyUploadPage() {
  const handleUploadFinish = ({ file, response }) => {
    console.log('File uploaded successfully!', response);
    // You can now use the response.uploadURL to display an image
    // or save the file metadata to your application's state.
    alert(`Upload complete: ${response.uploadURL}`);
  };

  return (
    <UploaderProvider
      popup={true} // Render the uploader as a modal dialog
      onUploadFinish={handleUploadFinish}
      coreProps={{
        restrictions: {
          maxFileSize: 1024 * 1024 * 10, // 10 MB
          allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
      }}
    >
      <UploaderTrigger>
        <Button variant="contained">Upload Image</Button>
      </UploaderTrigger>
    </UploaderProvider>
  );
}
```

### Next Steps

Now that you have a basic understanding of the `@blocklet/uploader` package, you can dive deeper into its configuration options:

- **Customize the Component**: Explore the full list of `<Uploader />` component props to tailor the uploader to your specific needs. See the [Component Props documentation](./api-reference-uploader-component-props.md) for details.
- **Set Up Your Backend**: If you haven't already, configure the backend service to handle the file uploads. Refer to the [Backend Setup guide](./getting-started-backend-setup.md) for instructions.
