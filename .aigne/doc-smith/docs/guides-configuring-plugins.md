# Configuring Plugins

The `@blocklet/uploader` component is built on the flexible Uppy ecosystem, which uses plugins to provide various import sources and features. You have full control over which plugins are enabled and how they are configured.

## Enabling and Disabling Plugins

By default, the Uploader enables a standard set of plugins. To customize the user experience, you can specify exactly which plugins to display by passing an array of plugin IDs to the `plugins` prop. This allows you to remove unwanted options from the interface.

For example, if you only want to allow uploads from the user's device, a direct URL, and the webcam, you can configure the Uploader like this:

```jsx
import { Uploader } from '@blocklet/uploader';

function App() {
  return <Uploader plugins={['Url', 'Webcam']} />;
}
```

This configuration will only show the "Link" and "Camera" options in the upload interface, in addition to the default local device source ("My Device").

### Available Plugin IDs

The following table lists the primary plugins you can enable or disable:

| Plugin ID   | Description                                                                                       | Dependencies                                                                                                  |
|-------------|---------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| `Webcam`    | Allows users to capture photos and record videos directly from their device's camera.             | None                                                                                                          |
| `Url`       | Allows users to import files by providing a direct public URL.                                    | Requires a correctly configured Companion backend. See [Integrating Remote Sources](./guides-remote-sources.md).    |
| `Unsplash`  | Enables browsing and importing images from the Unsplash library.                                  | Requires Companion and a server-side Unsplash API key.                                                        |
| `AIImage`   | Provides an interface for generating images using AI.                                             | Requires the Media Kit blocklet with AI features enabled.                                                     |
| `Uploaded`  | Allows users to select from files they have previously uploaded.                                  | Requires the Media Kit blocklet.                                                                              |
| `Resources` | Allows users to select files from other installed blocklets.                                      | Requires the Media Kit blocklet.                                                                              |
| `ImageEditor` | An image editing tool that appears before uploading an image file. It's active by default.      | None                                                                                                          |

## Customizing Plugin Options

Several plugins can be customized by passing specific props to the `<Uploader />` component. This allows you to change their behavior and appearance.

### Image Editor (`imageEditorProps`)

The Image Editor is a commonly customized plugin. You can pass a configuration object to the `imageEditorProps` prop to control its settings. This object is passed directly to the `@uppy/image-editor` plugin.

For a complete list of available options, refer to the [Uppy Image Editor documentation](https://uppy.io/docs/image-editor/#options).

Here is an example that sets the output image quality and configures the cropper to use a 16:9 aspect ratio:

```jsx
import { Uploader } from '@blocklet/uploader';

function MyUploader() {
  return (
    <Uploader
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

### Uploaded & Resources Plugins (`uploadedProps`, `resourcesProps`)

For the `Uploaded` and `Resources` plugins, you can provide an `onSelectedFiles` callback to intercept the file selection process. Instead of adding the selected files to the Uppy queue for upload, this function will be called with the file data. This is useful if you want to use the Uploader as a file picker for existing assets without re-uploading them.

```jsx
import { Uploader } from '@blocklet/uploader';

function MyUploader() {
  return (
    <Uploader
      plugins={['Uploaded']}
      uploadedProps={{
        onSelectedFiles: (files) => {
          console.log('User selected these files:', files);
          // 'files' is an array of selected file objects.
          // Each object contains metadata like `fileUrl` and the Uppy file object.
          // You can now use this data, for example, to insert an image into an editor.
        },
      }}
    />
  );
}
```

### Companion-Based Plugins (`apiPathProps`)

Plugins that rely on remote sources, such as `Url` and `Unsplash`, are configured through the `apiPathProps` prop. This prop defines the endpoints for the backend Companion service that handles the remote imports. For more details on setting this up, see the [Integrating Remote Sources](./guides-remote-sources.md) guide.

---

Now that you know how to configure plugins, you can move on to managing the files once they are uploaded.

<x-card data-title="Next Step: Handling Uploads" data-icon="lucide:upload-cloud" data-href="/guides/handling-uploads" data-cta="Read Guide">
  Learn how to implement callbacks to process files and access their metadata after a successful upload.
</x-card>