# <Uploader /> Component Props

The `Uploader` component is highly configurable through its props, allowing you to tailor its appearance, behavior, and functionality. It serves as a wrapper around the [Uppy](https://uppy.io/) file uploader, and many of its props map directly to Uppy's core and plugin options.

This page provides a detailed reference for all available props. For more advanced customizations, you may need to consult the official [Uppy documentation](https://uppy.io/docs/).

## Core Behavior Props

These props control the fundamental behavior and appearance of the Uploader.

| Prop | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | A unique identifier for the Uppy instance. Defaults to `'Uploader'`. |
| `popup` | `boolean` | If `true`, the Uploader will render inside a modal dialog. If `false`, it will be rendered inline. Defaults to `false`. |
| `locale`| `string` | Sets the display language for the UI. Supported values include `'en'`, `'zh'`, etc. Defaults to `'en'`. |
| `initialFiles` | `any[]` | An array of file objects to pre-populate the uploader with when it initializes. |

## Event Handler Props

Use these callback props to respond to events in the Uploader's lifecycle.

| Prop | Type | Description |
| :--- | :--- | :--- |
| `onOpen` | `() => void` | A function called when the Uploader modal is opened. |
| `onClose` | `() => void` | A function called when the Uploader modal is closed. |
| `onChange` | `(file, files) => void` | A function called whenever a file is added or removed from the Uppy instance. Receives the changed file and the array of all current files. |
| `onUploadFinish` | `(result) => void` | The most important callback, triggered for each file after it has been successfully uploaded. The `result` object contains the final `uploadURL` and other metadata. |
| `onAfterResponse` | `(response) => void` | A low-level callback triggered after every single HTTP response from the server during the upload process (including Tus chunk uploads). |

### Example: Using `onUploadFinish`

This is the primary way to get the URL of a successfully uploaded file.

```jsx
<Uploader 
  onUploadFinish={(result) => {
    console.log('File uploaded successfully!');
    console.log('File URL:', result.uploadURL);
    console.log('Uppy file object:', result.file);
    console.log('Server response:', result.data);
    // You can now save the result.uploadURL to your database
  }}
/>
```

## Configuration Objects

These props accept objects to configure the underlying Uppy instance and its main plugins. This is where most of the customization happens.

| Prop | Type | Description |
| :--- | :--- | :--- |
| `coreProps` | `UppyOptions` | Pass-through options for the main [Uppy core instance](https://uppy.io/docs/uppy/#Options). Use this to set file restrictions. |
| `dashboardProps` | `DashboardOptions` | Pass-through options for the [@uppy/dashboard](https://uppy.io/docs/dashboard/#Options) plugin. Controls the UI. |
| `tusProps` | `TusOptions` | Pass-through options for the [@uppy/tus](https://uppy.io/docs/tus/#Options) plugin for resumable uploads. |
| `apiPathProps` | `object` | Configures the backend API endpoints for the uploader and companion services. |
| `imageEditorProps` | `ImageEditorOptions` | Pass-through options for the [@uppy/image-editor](https://uppy.io/docs/image-editor/#Options) plugin. |
| `dropTargetProps` | `DropTargetOptions`| Pass-through options for the [@uppy/drop-target](https://uppy.io/docs/drop-target/#Options) plugin. |

### `coreProps` Example

Use `coreProps.restrictions` to limit file types, size, and number.

```jsx
const uploaderCoreProps = {
  restrictions: {
    maxFileSize: 1024 * 1024, // 1 MB
    maxNumberOfFiles: 5,
    allowedFileTypes: ['image/jpeg', 'image/png'],
  },
};

<Uploader coreProps={uploaderCoreProps} />
```

### `apiPathProps` Details

This object configures the endpoints used for file handling.

| Key | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `uploader` | `string` | `'/api/uploads'` | The endpoint for direct file uploads (handled by Tus). |
| `companion` | `string` | `'/api/companion'` | The base endpoint for remote sources like URL or Unsplash. |
| `disableMediaKitPrefix` | `boolean` | `false` | If `true`, prevents prepending the Media Kit blocklet DID to the paths. |
| `disableAutoPrefix` | `boolean` | `false` | If `true`, prevents automatic prefixing of paths. |
| `disableMediaKitStatus` | `boolean` | `false` | If `true`, the component will not check the Media Kit's status endpoint for configuration. |


## Plugin & Data Source Props

These props are used to configure the available plugins and custom data sources.

| Prop | Type | Description |
| :--- | :--- | :--- |
| `plugins` | `string[]` or `object[]` | An array of plugin IDs to enable. It also allows adding custom virtual plugins. |
| `uploadedProps` | `object` | Configuration for the custom `Uploaded` plugin. Provides access to files already in the Media Kit. |
| `resourcesProps` | `object` | Configuration for the custom `Resources` plugin. Provides access to files from other installed blocklets. |

### `plugins` Example

By default, many plugins are enabled. You can specify a smaller list to simplify the UI. You can also add a custom plugin tab.

```jsx
const myCustomPlugin = {
  id: 'MyPlugin',
  options: {
    id: 'MyPlugin',
    title: 'My Custom Source',
    icon: () => <p>ICON</p>, // React node for the icon
  },
  // This function is called when the user clicks your plugin tab
  onShowPanel: (ref) => {
    console.log('My custom plugin panel is now visible!');
    // You would render your custom UI here
  },
};

<Uploader 
  // Only show the device uploader and my custom plugin
  plugins={['MyDevice', myCustomPlugin]}
/>
```

### `uploadedProps` & `resourcesProps` Example

Use the `onSelectedFiles` callback to handle files chosen from these custom plugins without re-uploading them.

```jsx
<Uploader 
  uploadedProps={{
    onSelectedFiles: (files) => {
      console.log('Files selected from Media Kit:', files);
      // `files` is an array of file objects with `fileUrl`
      // Close the uploader, as no upload is needed
      uploaderRef.current.close();
    }
  }}
/>
```

## Styling & Miscellaneous Props

| Prop | Type | Description |
| :--- | :--- | :--- |
| `wrapperProps` | `object` | Props passed to the root `div` or `Modal` element, useful for custom styling via `sx`, `style`, or `className`. |
| `installerProps` | `object` | Props passed to the `<ComponentInstaller />` which prompts the user to install Media Kit if it's not detected. |

---

With these props, you have extensive control over the `Uploader` component. You can configure everything from basic behavior to advanced plugin integrations. 

Next, let's explore how to control the Uploader programmatically using the [UploaderProvider and Hooks](./api-reference-uploader-provider-hooks.md).