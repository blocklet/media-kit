# <Uploader /> Component Props

The `Uploader` component is a flexible React component built on top of the powerful [Uppy](https://uppy.io/) file uploader. It provides a simplified interface for common use cases while offering deep customization through its props. This page details the full range of available props, from basic configuration to advanced Uppy-specific settings.

For a more hands-on approach, you might want to start with the [Frontend Setup](./getting-started-frontend-setup.md) guide.

## Core Props

These props control the fundamental behavior, appearance, and integration of the Uploader component.

| Prop | Type | Description | Default |
|---|---|---|---|
| `id` | `string` | A unique identifier for the Uppy instance. Important if you have multiple uploaders on the same page. | `'Uploader'` |
| `popup` | `boolean` | If `true`, the uploader will render as a modal dialog. If `false`, it will be rendered inline. | `false` |
| `locale` | `string` | Sets the display language for the UI. Supported locales include `'en'`, `'zh'`, etc. | `'en'` |
| `initialFiles` | `any[]` | An array of file objects to pre-populate the uploader with when it initializes. | `[]` |
| `wrapperProps` | `HTMLAttributes` | Standard HTML attributes and MUI `sx` props to apply to the main container element of the uploader. | `{}` |
| `installerProps` | `object` | Props passed to the `@blocklet/ui-react/lib/ComponentInstaller` component, used when Media Kit is not installed. | `{}` |

### Example: Basic Popup Uploader

```jsx
import { Uploader } from '@blocklet/uploader';

function MyComponent() {
  const uploaderRef = React.useRef();

  return (
    <>
      <button onClick={() => uploaderRef.current.open()}>Open Uploader</button>
      <Uploader ref={uploaderRef} id="my-popup-uploader" popup />
    </>
  );
}
```

## Event Handlers

Use these callback props to hook into the uploader's lifecycle and respond to events.

| Prop | Type | Description |
|---|---|---|
| `onOpen` | `Function` | A callback function that is executed when the uploader modal is opened. |
| `onClose` | `Function` | A callback function that is executed when the uploader modal is closed. |
| `onChange` | `(file, files) => void` | A callback function that fires whenever a file is added or removed. It receives the affected file and the current list of all files. |
| `onUploadFinish` | `(result) => void` | A callback function that is executed for each file after it has been successfully uploaded. The `result` object contains details about the file and the server response. |
| `onAfterResponse` | `(response) => void` | A lower-level callback that fires after every XHR response (including Tus protocol requests) during the upload process. |

### Example: Handling Upload Completion

```jsx
import { Uploader } from '@blocklet/uploader';

function UploadHandler() {
  const handleUploadFinish = (result) => {
    console.log('File uploaded:', result.uploadURL);
    console.log('Server response:', result.data);
    // You can now save the uploadURL to your database
  };

  return (
    <Uploader
      onUploadFinish={handleUploadFinish}
      onClose={() => console.log('Uploader closed')}
    />
  );
}
```

## Plugin & Source Configuration

These props allow you to configure the available upload sources (like Webcam, URL, AI Image) and their specific options.

| Prop | Type | Description |
|---|---|---|
| `plugins` | `string[]` or `object[]` | An array of plugin IDs to enable. You can also provide an array of objects to define custom virtual plugins. See the [Creating a Custom Plugin](./guides-custom-plugin.md) guide for more details. |
| `imageEditorProps` | `ImageEditorOptions` | An object of options passed directly to the `@uppy/image-editor` plugin. See [Uppy's documentation](https://uppy.io/docs/image-editor/#options) for available options. |
| `uploadedProps` | `object` | Configuration for the custom 'Uploaded' plugin, which allows browsing previously uploaded files. Contains `params` for API requests and an `onSelectedFiles` callback. |
| `resourcesProps` | `object` | Configuration for the custom 'Resources' plugin, which allows selecting files from other blocklets. Contains `params` for API requests and an `onSelectedFiles` callback. |
| `dropTargetProps` | `object` | An object of options passed to the `@uppy/drop-target` plugin to configure the drag-and-drop behavior. |

### Example: Enabling Webcam and Image Editor

```jsx
import { Uploader } from '@blocklet/uploader';

function UploaderWithPlugins() {
  return (
    <Uploader
      plugins={['Webcam', 'Url', 'ImageEditor']}
      imageEditorProps={{
        quality: 0.8,
        cropperOptions: {
          viewMode: 1,
          aspectRatio: 16 / 9,
          background: false,
        },
      }}
    />
  );
}
```

## Backend & Advanced Configuration

These props provide fine-grained control over backend endpoints and allow you to pass options directly to the underlying Uppy instances.

| Prop | Type | Description |
|---|---|---|
| `apiPathProps` | `object` | An object to configure the backend endpoints for the uploader and Companion. Keys include `uploader`, `companion`, `disableMediaKitPrefix`, etc. |
| `tusProps` | `TusOptions` | An object of options passed directly to the `@uppy/tus` plugin for resumable uploads. See the [tus-js-client documentation](https://github.com/tus/tus-js-client/blob/main/docs/api.md) for details. |
| `coreProps` | `UppyOptions` | An object of options passed directly to the Uppy core instance. This is where you configure global settings like file restrictions (`restrictions`). See [Uppy's documentation](https://uppy.io/docs/uppy/#options) for all available options. |
| `dashboardProps` | `DashboardOptions` | An object of options passed directly to the `@uppy/dashboard` plugin. This allows you to customize the UI, such as the `note`, `width`, or `height`. See [Uppy's documentation](https://uppy.io/docs/dashboard/#options) for all available options. |

### Example: Setting File Restrictions and a Custom Note

```jsx
import { Uploader } from '@blocklet/uploader';

function RestrictedUploader() {
  return (
    <Uploader
      coreProps={{
        restrictions: {
          maxFileSize: 1024 * 1024, // 1 MB
          maxNumberOfFiles: 5,
          allowedFileTypes: ['image/jpeg', 'image/png'],
        },
      }}
      dashboardProps={{
        note: 'Please upload up to 5 JPG or PNG images, max 1MB each.',
        width: 800,
      }}
    />
  );
}
```

This comprehensive set of props allows you to tailor the `Uploader` component to fit a wide variety of use cases. For more advanced scenarios, refer to the documentation for Uppy and its various plugins.

Next, you can explore the [available plugins](./api-reference-uploader-plugins.md) in more detail or learn about the [utility functions](./api-reference-uploader-utility-functions.md) that can help you manage the uploader programmatically.