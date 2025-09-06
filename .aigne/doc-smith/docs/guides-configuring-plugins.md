# Configuring Plugins

The `@blocklet/uploader` component is built on the powerful [Uppy](https://uppy.io/) file uploader, inheriting its flexible plugin system. Plugins are the key to extending the uploader's functionality, allowing you to add features like a webcam importer, image editor, connections to remote sources like Unsplash, and more.

This guide will walk you through enabling, disabling, and customizing these plugins to fit your application's needs.

## Enabling and Disabling Plugins

The simplest way to control which features are available to your users is by using the `plugins` prop. This prop accepts an array of strings, where each string is the ID of a plugin you want to enable.

By default, the uploader enables a standard set of plugins. To customize this list, simply provide your own array.

```jsx
import Uploader from '@blocklet/uploader';

function MyComponent() {
  return (
    <Uploader
      popup
      plugins={['Webcam', 'Url', 'ImageEditor', 'Unsplash']}
    />
  );
}
```

In this example, only the Webcam, URL importer, Image Editor, and Unsplash plugins will be available in the uploader's interface. The default "My Device" option is always available.

### Available Plugin IDs

Here are the primary built-in plugins you can include in the `plugins` array:

| Plugin ID | Description |
|---|---|
| `ImageEditor` | Allows users to crop, rotate, and make other adjustments to images before uploading. |
| `Webcam` | Enables users to take photos and record videos directly from their device's camera. |
| `Url` | Provides an interface to import files from a direct URL. |
| `Unsplash` | Allows users to search and import images from the Unsplash library (requires configuration). |
| `Uploaded` | A custom plugin that lets users select from files previously uploaded to the Media Kit. |
| `Resources` | A custom plugin that allows selecting files from other installed blocklets. |
| `AIImage` | A custom plugin for generating images using AI, available when the AI Kit is installed. |

**Note:** Some core plugins like `ThumbnailGenerator` and `PrepareUpload` are always active to ensure the uploader functions correctly and are not controlled by the `plugins` prop.

## Customizing Plugin Options

For more advanced control, you can pass specific options to certain plugins using dedicated props. This allows you to fine-tune their behavior.

### Image Editor

The `ImageEditor` plugin is highly configurable. Use the `imageEditorProps` prop to pass any valid options from the [Uppy ImageEditor documentation](https://uppy.io/docs/image-editor/#options).

For instance, you can set the output image quality and define specific cropping options:

```jsx
import Uploader from '@blocklet/uploader';

function MyComponent() {
  return (
    <Uploader
      popup
      plugins={['ImageEditor']}
      imageEditorProps={{
        quality: 0.8, // Set image quality to 80%
        cropperOptions: {
          viewMode: 1,
          aspectRatio: 16 / 9,
          autoCropArea: 1,
          responsive: true,
        },
      }}
    />
  );
}
```

### Custom Data Source Plugins (`Uploaded` & `Resources`)

The `Uploaded` and `Resources` plugins provide a way to select existing assets rather than uploading new ones. You can use their respective props (`uploadedProps` and `resourcesProps`) to intercept the file selection process.

This is particularly useful if you want to get the selected file data directly without having Uppy re-upload it. You can define an `onSelectedFiles` callback to handle the selection yourself.

```jsx
import Uploader from '@blocklet/uploader';

function MyComponent() {
  const handleFilesSelected = (files) => {
    console.log('Files selected from existing resources:', files);
    // `files` is an array of objects, each containing metadata
    // and a `uppyFile` property to interact with the Uppy instance.
    // The uploader will close automatically after this callback.
  };

  return (
    <Uploader
      popup
      plugins={['Uploaded']}
      uploadedProps={{
        onSelectedFiles: handleFilesSelected,
      }}
    />
  );
}
```

When `onSelectedFiles` is provided, the default behavior of adding the file to the Uppy queue for upload is bypassed, giving you full control over the selected assets.

## Automatic Plugin Integration

The uploader is designed to work seamlessly with the Blocklet ecosystem. It automatically detects if the **Media Kit** blocklet is installed and enables relevant plugins like `Uploaded`, `Resources`, and `AIImage` if they are available, without requiring manual configuration in the `plugins` array. Similarly, the `Unsplash` plugin is enabled automatically if an Unsplash API key is found in the environment.

This simplifies setup and provides a richer user experience out-of-the-box.

---

Now that you know how to configure the built-in plugins, you might want to extend the uploader with your own custom functionality. Proceed to the next guide to learn how.

<x-card data-title="Creating a Custom Plugin" data-icon="lucide:puzzle-piece" data-href="/guides/custom-plugin" data-cta="Read More">
  Learn how to build your own plugin to add a custom tab and functionality to the Uploader interface.
</x-card>
