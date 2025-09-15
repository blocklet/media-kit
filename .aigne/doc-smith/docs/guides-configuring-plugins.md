# Configuring Plugins

The `@blocklet/uploader` component is built on the flexible and powerful [Uppy](https://uppy.io/) file uploader. This architecture allows for extensive customization through a plugin-based system. The Uploader comes with several essential plugins pre-configured out-of-the-box, as well as special plugins designed to integrate with the Blocklet ecosystem, such as the Media Kit.

This guide will walk you through how to enable, disable, and customize the behavior of these plugins to tailor the uploader to your specific needs.

## Controlling Active Plugins

The primary way to control which plugins are available to the user is through the `plugins` prop on the `Uploader` component. By default, if you don't provide this prop, the Uploader will attempt to enable all available built-in plugins.

To specify a custom set of plugins, pass an array of their IDs as strings. This will override the default set. Note that certain core plugins like `ImageEditor` and `PrepareUpload` are always active to ensure basic functionality.

Here are the IDs for the main acquirer plugins you can control:

| Plugin ID | Description |
|---|---|
| `Webcam` | Allows users to take photos and record videos with their device's camera. |
| `Url` | Enables importing files from a direct URL. |
| `Unsplash` | Allows users to browse and import images from Unsplash (requires configuration via Media Kit). |
| `AIImage` | A custom plugin that enables AI image generation (requires Media Kit). |
| `Uploaded` | A custom plugin to browse and reuse files already uploaded to the Media Kit. |
| `Resources` | A custom plugin to select files from other resource-providing Blocklets. |

### Example: Enabling Only Webcam and URL

If you only want users to upload from their webcam or a URL, you can configure the Uploader like this:

```jsx Uploader with specific plugins icon=logos:react
import Uploader from '@blocklet/uploader';

function MyComponent() {
  return (
    <Uploader
      popup
      plugins={['Webcam', 'Url']}
      // ... other props
    />
  );
}
```

This configuration will result in an uploader that only shows the Webcam and Import from URL options, in addition to the standard local file selection.

## Customizing Plugin Options

Beyond just enabling or disabling plugins, you can pass detailed configuration objects to customize their behavior. This is done through dedicated props on the `Uploader` component, named after the plugin they configure.

### Customizing the Image Editor

The most commonly customized plugin is the Image Editor. You can control everything from the output image quality to the available cropping tools using the `imageEditorProps` prop. These options are passed directly to the underlying `@uppy/image-editor` plugin.

For a complete list of available options, please refer to the [Uppy Image Editor documentation](https://uppy.io/docs/image-editor/#options).

```jsx Customizing Image Editor icon=logos:react
import Uploader from '@blocklet/uploader';

function MyImageEditor() {
  return (
    <Uploader
      popup
      imageEditorProps={{
        quality: 0.8, // Set JPEG quality to 80%
        cropperOptions: {
          viewMode: 1,
          aspectRatio: 16 / 9,
          background: false,
          autoCropArea: 1,
          responsive: true,
        },
      }}
      // ... other props
    />
  );
}
```

In this example, we've set the image compression quality to 80% and configured the cropper to enforce a 16:9 aspect ratio.

### Configuring Custom Plugins

Our custom plugins, `Uploaded` and `Resources`, also accept configuration through their respective props: `uploadedProps` and `resourcesProps`. A common use case is to provide a callback function for when a user selects files from these sources. This allows you to handle the selection directly instead of having the Uploader add them to its queue for uploading.

```jsx Handling selection from Resources plugin icon=logos:react
import Uploader from '@blocklet/uploader';

function MyResourceSelector() {
  const handleFilesSelected = (files) => {
    // The files array contains metadata about the selected resources,
    // including a `uppyFile` property for each.
    console.log('User selected these files from Resources:', files);
    // You can now process these files, e.g., display them in your UI.
  };

  return (
    <Uploader
      popup
      plugins={['Resources']}
      resourcesProps={{
        onSelectedFiles: handleFilesSelected,
      }}
      // ... other props
    />
  );
}
```

When `onSelectedFiles` is provided, the selected files are passed to your callback and are not added to the uploader. If the callback is omitted, the component mocks a successful upload response for the selected file and triggers the standard `onUploadFinish` event.

## Creating Your Own Plugin

The Uploader is designed to be extensible. If the built-in plugins don't meet your needs, you can create your own custom plugin tab to integrate unique functionality directly into the Uploader's dashboard.

<x-card data-title="Creating a Custom Plugin" data-icon="lucide:puzzle-piece" data-href="/guides/custom-plugin" data-cta="Read The Guide">
  Learn how to build and integrate your own custom plugin with a step-by-step guide.
</x-card>

---

By mastering plugin configuration, you can transform the Uploader from a generic tool into a highly specialized component that fits perfectly within your application's workflow. Now that you know how to configure the interface, let's learn more about what happens after a file is selected.

Next, we'll explore how to work with files once they've been successfully uploaded. See the [Handling Uploads](./guides-handling-uploads.md) guide for more details.