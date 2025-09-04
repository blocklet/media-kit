# Configuring Plugins

The `@blocklet/uploader` component is built on the powerful Uppy library, and its functionality is extended through a system of plugins. These plugins provide features like editing images, importing from a URL, or recording with a webcam. This guide will walk you through how to control which plugins are active and how to customize their behavior.

For a complete list of all available props for the Uploader component, please refer to the [<Uploader /> Component Props](./api-reference-uploader-component-props.md) API reference.

## Enabling and Disabling Plugins

The primary way to control which plugins appear in the uploader's dashboard is through the `plugins` prop. By default, the uploader attempts to enable all available plugins. To create a more focused experience, you can pass an array of plugin IDs to the `plugins` prop. This will ensure that only the plugins you've specified are displayed as options to the user.

Here is a list of common user-facing plugin IDs:

*   `ImageEditor`
*   `Uploaded` (Custom plugin for previously uploaded files)
*   `Resources` (Custom plugin for files from other Blocklets)
*   `AIImage` (Custom plugin for AI image generation, requires Media Kit)
*   `Url` (Import from a web address)
*   `Webcam`
*   `Unsplash`

**Example: Enabling Only Webcam and URL Imports**

In this example, we restrict the uploader to only show the Webcam and URL import tabs, providing a simpler interface for the user.

```jsx
import { Uploader } from '@blocklet/uploader';
import { useRef } from 'react';

export default function App() {
  const uploaderRef = useRef(null);

  // Only show the Webcam and URL import tabs in the dashboard
  const enabledPlugins = ['Webcam', 'Url'];

  return (
    <div>
      <button onClick={() => uploaderRef.current.open()}>Open Uploader</button>
      <Uploader ref={uploaderRef} plugins={enabledPlugins} popup />
    </div>
  );
}
```

## Configuring Plugin Options

Many plugins can be customized by passing a dedicated prop to the `<Uploader />` component. The general convention is to use a prop named `[pluginName]Props`, such as `imageEditorProps`.

### Configuring the Image Editor

The image editor is a commonly customized plugin. You can control settings like image quality, cropping options, and more through the `imageEditorProps` prop. The options you pass are forwarded directly to the Uppy ImageEditor plugin.

```jsx
import { Uploader } from '@blocklet/uploader';
import { useRef } from 'react';

export default function App() {
  const uploaderRef = useRef(null);

  return (
    <div>
      <button onClick={() => uploaderRef.current.open()}>Open Uploader</button>
      <Uploader
        ref={uploaderRef}
        popup
        imageEditorProps={{
          quality: 0.8, // Set JPEG quality to 80%
          cropperOptions: {
            viewMode: 1,
            aspectRatio: 1, // Enforce a square crop
            background: false,
            autoCropArea: 1,
          },
        }}
      />
    </div>
  );
}
```

For a full list of available options, refer to the official [Uppy Image Editor documentation](https://uppy.io/docs/image-editor/#options).

### Configuring Blocklet-Specific Plugins

The `Uploaded` and `Resources` plugins allow users to select files that are already part of the Blocklet ecosystem. You can interact with these plugins using the `uploadedProps` and `resourcesProps` respectively. A common use case is to define an `onSelectedFiles` callback to handle the files a user selects from these sources.

```jsx
import { Uploader } from '@blocklet/uploader';
import { useRef } from 'react';

export default function App() {
  const uploaderRef = useRef(null);

  const handleResourceSelection = (files) => {
    console.log('Files selected from Resources plugin:', files);
    // Each file object includes the original data and its corresponding Uppy file instance
    files.forEach(file => {
      console.log('Original data:', file);
      console.log('Uppy file instance:', file.uppyFile);
    });
    // You can now work with the selected files
    // The uploader will automatically close after selection
  };

  return (
    <div>
      <button onClick={() => uploaderRef.current.open('Resources')}>Open Resources</button>
      <Uploader
        ref={uploaderRef}
        popup
        plugins={['Resources']}
        resourcesProps={{ onSelectedFiles: handleResourceSelection }}
      />
    </div>
  );
}
```

### Conditional Plugins: Unsplash

Some plugins are enabled conditionally based on the environment. For example, the `Unsplash` plugin will only be available if `window.blocklet.UNSPLASH_KEY` is defined in your blocklet's configuration. This allows you to enable or disable features based on the presence of API keys or other settings.

## Next Steps

Now that you've learned how to configure the uploader's plugins to fit your needs, the next step is to manage the files once they are uploaded. Proceed to the next guide to learn how to process upload results.

<x-card data-title="Handling Uploads" data-icon="lucide:upload-cloud" data-href="/guides/handling-uploads" data-cta="Read Guide">
  Implement callbacks on both the frontend and backend to process files after a successful upload and access their metadata.
</x-card>
