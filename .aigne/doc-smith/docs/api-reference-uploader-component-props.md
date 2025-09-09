# <Uploader /> Component Props

The `<Uploader />` component is the primary way to integrate a full-featured file upload interface into your React application. It is built on top of the popular [Uppy](https://uppy.io/) library and is highly customizable through a comprehensive set of props. This guide provides a detailed reference for all available props, enabling you to tailor the uploader's behavior, appearance, and functionality to your specific needs.

## Main Props

Here is a complete list of props you can pass to the `<Uploader />` component.

| Prop | Type | Description |
| --- | --- | --- |
| `id` | `string` | A unique identifier for the Uppy instance. Defaults to `'Uploader'`. |
| `popup` | `boolean` | If `true`, the uploader will render as a modal dialog instead of being inline. Defaults to `false`. |
| `locale` | `string` | Sets the language for the UI. Supported values include 'en', 'zh'. Defaults to `'en'`. |
| `onAfterResponse` | `(response: any) => void` | A callback function that fires after every HTTP response (from both Tus and Companion). |
| `onUploadFinish` | `(request: any) => void` | A crucial callback that fires after a file has been successfully uploaded. The `request` object contains details like the `uploadURL`. |
| `onOpen` | `Function` | A callback function that fires when the uploader UI (especially in popup mode) is opened. |
| `onClose` | `Function` | A callback function that fires when the uploader UI is closed. |
| `onChange` | `Function` | A callback that fires whenever a file is added or removed, providing the current list of all files. |
| `plugins` | `string[]` or `object[]` | An array to configure which Uppy plugins are enabled. You can also pass custom plugins. See [Configuring Plugins](./guides-configuring-plugins.md) for details. |
| `installerProps` | `object` | Props passed to the `ComponentInstaller` for the Media Kit, such as `disabled` or a custom `fallback`. |
| `uploadedProps` | `object` | Configuration for the custom 'Uploaded' plugin, including `params` and an `onSelectedFiles` callback. |
| `resourcesProps` | `object` | Configuration for the custom 'Resources' plugin, including `params` and an `onSelectedFiles` callback. |
| `tusProps` | `TusOptions` | An object of options passed directly to the `@uppy/tus` plugin. See [Tus documentation](https://uppy.io/docs/tus/#Options) for all options. |
| `wrapperProps` | `HTMLAttributes<HTMLDivElement>` | Props applied to the main wrapper `div` element, including `sx`, `className`, and `style`. |
| `coreProps` | `UppyOptions` | An object of options passed directly to the Uppy core instance. This is where you configure global settings like `restrictions`. See [Uppy Core documentation](https://uppy.io/docs/uppy/#Options) for all options. |
| `dashboardProps` | `DashboardOptions` | An object of options passed directly to the `@uppy/dashboard` plugin. See [Uppy Dashboard documentation](https://uppy.io/docs/dashboard/#Options) for all options. |
| `apiPathProps` | `object` | An object to configure the API endpoints for the uploader and Companion. |
| `dropTargetProps` | `DropTarget` | Configuration for the `@uppy/drop-target` plugin, allowing drag-and-drop uploads onto a specified element. |
| `initialFiles` | `any[]` | An array of file objects to pre-populate the uploader with when it initializes. |
| `imageEditorProps` | `ImageEditorOptions` | An object of options passed directly to the `@uppy/image-editor` plugin. See [Uppy Image Editor documentation](https://uppy.io/docs/image-editor/#Options) for all options. |

## Key Props in Detail

### `onUploadFinish`

This is one of the most important callbacks. It is triggered for each file after it has been successfully processed and stored by the backend. The callback receives a `result` object containing the final `uploadURL` and other metadata, which you can then use to update your application's state or save to your database.

```javascript UploadHandler.jsx icon=logos:react
import React, { useState } from 'react';
import Uploader from '@blocklet/uploader/react';

export default function UploadHandler() {
  const [fileUrl, setFileUrl] = useState('');

  const handleUploadFinish = (result) => {
    console.log('File uploaded:', result);
    // The result object contains the final URL of the uploaded file
    if (result.uploadURL) {
      setFileUrl(result.uploadURL);
      // Now you can save this URL to your state or database
    }
  };

  return (
    <div>
      <Uploader onUploadFinish={handleUploadFinish} />
      {fileUrl && <p>Last upload: <a href={fileUrl}>{fileUrl}</a></p>}
    </div>
  );
}
```

### `coreProps`

This prop gives you direct access to the Uppy core configuration. A primary use case is setting upload restrictions, such as file types, number of files, and file size.

```javascript RestrictedUploader.jsx icon=logos:react
import Uploader from '@blocklet/uploader/react';

export default function RestrictedUploader() {
  const restrictions = {
    maxFileSize: 1024 * 1024, // 1 MB
    maxNumberOfFiles: 3,
    allowedFileTypes: ['image/jpeg', 'image/png'],
  };

  return (
    <Uploader
      coreProps={{
        restrictions: restrictions,
      }}
    />
  );
}
```

### `plugins`

This prop allows you to customize the tabs available in the Uploader dashboard. You can enable or disable built-in plugins or even add your own custom tabs.

For a deep dive into creating your own plugin, see the [Creating a Custom Plugin](./guides-custom-plugin.md) guide.

```javascript CustomPluginUploader.jsx icon=logos:react
import Uploader from '@blocklet/uploader/react';
import { PhotoIcon } from '@heroicons/react/24/solid';

export default function CustomPluginUploader() {
  const customPlugins = [
    {
      id: 'MyCustomPlugin',
      options: {
        id: 'MyCustomPlugin',
        title: 'My Photos',
        icon: <PhotoIcon />,
      },
      onShowPanel: (ref) => {
        // Logic to display your custom panel content
        console.log('Custom panel shown!', ref);
      },
    },
  ];

  return (
    <Uploader
      plugins={['Webcam', 'Url', ...customPlugins]}
    />
  );
}
```

### `apiPathProps`

By default, the uploader communicates with endpoints at `/api/uploads` (for Tus uploads) and `/api/companion` (for remote sources). You can override these paths if your backend is configured differently.

```javascript CustomEndpoints.jsx icon=logos:react
import Uploader from '@blocklet/uploader/react';

export default function CustomEndpoints() {
  const apiPaths = {
    uploader: '/custom/tus-endpoint',
    companion: '/custom/companion-endpoint',
  };

  return (
    <Uploader apiPathProps={apiPaths} />
  );
}
```

---

With a solid understanding of these props, you can configure the Uploader to fit a wide variety of use cases. For more advanced control, such as opening the uploader programmatically, proceed to the next section on the [UploaderProvider and Hooks](./api-reference-uploader-provider-hooks.md).