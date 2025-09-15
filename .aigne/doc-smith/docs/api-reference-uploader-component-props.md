# <Uploader /> Component Props

The `<Uploader />` component is the primary way to integrate a full-featured file upload interface into your React application. It is built on top of the popular [Uppy](https://uppy.io/) library and is highly customizable through a comprehensive set of props. This guide provides a detailed reference for all available props, enabling you to tailor the uploader's behavior, appearance, and functionality to your specific needs.

## All Props

Here is a complete list of props you can pass to the `<Uploader />` component.

<x-field data-name="id" data-type="string" data-default="'Uploader'" data-desc="A unique identifier for the Uppy instance."></x-field>

<x-field data-name="popup" data-type="boolean" data-default="false" data-desc="If true, the uploader will render as a modal dialog instead of being inline."></x-field>

<x-field data-name="locale" data-type="string" data-default="'en'" data-desc="Sets the language for the UI. Supported values include 'en' and 'zh'."></x-field>

<x-field data-name="onAfterResponse" data-type="(response: any) => void" data-desc="A callback function that fires after every HTTP response from the upload server (Tus) or remote source fetcher (Companion)."></x-field>

<x-field data-name="onUploadFinish" data-type="(request: any) => void" data-desc="A crucial callback that fires after a file has been successfully uploaded. The request object contains details like the uploadURL."></x-field>

<x-field data-name="onOpen" data-type="Function" data-desc="A callback function that fires when the uploader UI (especially in popup mode) is opened."></x-field>

<x-field data-name="onClose" data-type="Function" data-desc="A callback function that fires when the uploader UI is closed."></x-field>

<x-field data-name="onChange" data-type="Function" data-desc="A callback that fires whenever a file is added or removed, providing the current list of all files."></x-field>

<x-field data-name="plugins" data-type="string[] | object[]" data-desc="An array to configure which Uppy plugins are enabled. You can enable built-in plugins by their ID string or define your own custom virtual plugins using an object structure. See the Custom Plugin guide for details."></x-field>

<x-field data-name="installerProps" data-type="object" data-desc="Props passed to the ComponentInstaller for the Media Kit.">
  <x-field data-name="disabled" data-type="boolean" data-desc="Disables the installer prompt."></x-field>
  <x-field data-name="fallback" data-type="any" data-desc="A custom fallback component to render if the Media Kit is not installed."></x-field>
</x-field>

<x-field data-name="uploadedProps" data-type="object" data-desc="Configuration for the custom 'Uploaded' plugin, which allows browsing previously uploaded files from the Media Kit.">
  <x-field data-name="params" data-type="any" data-desc="Custom parameters to pass to the 'Uploaded' plugin's API endpoint."></x-field>
  <x-field data-name="onSelectedFiles" data-type="Function" data-desc="Callback that fires when files are selected from the 'Uploaded' tab."></x-field>
</x-field>

<x-field data-name="resourcesProps" data-type="object" data-desc="Configuration for the custom 'Resources' plugin, which allows browsing files from other installed blocklets.">
  <x-field data-name="params" data-type="any" data-desc="Custom parameters to pass to the 'Resources' plugin's API endpoint."></x-field>
  <x-field data-name="onSelectedFiles" data-type="Function" data-desc="Callback that fires when files are selected from the 'Resources' tab."></x-field>
</x-field>

<x-field data-name="tusProps" data-type="TusOptions" data-desc="An object of options passed directly to the @uppy/tus plugin for resumable uploads. See the official [Tus documentation](https://uppy.io/docs/tus/#Options) for all available options."></x-field>

<x-field data-name="wrapperProps" data-type="HTMLAttributes<HTMLDivElement>" data-desc="Standard HTML attributes applied to the main wrapper div element of the Uploader.">
    <x-field data-name="sx" data-type="SxProps<Theme>" data-desc="MUI's sx prop for custom styling."></x-field>
    <x-field data-name="className" data-type="string" data-desc="Custom CSS class name."></x-field>
    <x-field data-name="style" data-type="React.CSSProperties" data-desc="Standard React style object."></x-field>
</x-field>

<x-field data-name="coreProps" data-type="UppyOptions" data-desc="An object of options passed directly to the Uppy core instance. This is where you configure global settings like restrictions. See the [Uppy Core documentation](https://uppy.io/docs/uppy/#Options) for a full list of options."></x-field>

<x-field data-name="dashboardProps" data-type="DashboardOptions" data-desc="An object of options passed directly to the @uppy/dashboard plugin to customize the UI. See the [Uppy Dashboard documentation](https://uppy.io/docs/dashboard/#Options) for all available options."></x-field>

<x-field data-name="apiPathProps" data-type="object" data-desc="An object to configure the API endpoints for the uploader and its companion for remote sources.">
  <x-field data-name="uploader" data-type="string" data-default="'/api/uploads'" data-desc="The endpoint for Tus resumable uploads."></x-field>
  <x-field data-name="companion" data-type="string" data-default="'/api/companion'" data-desc="The endpoint for the Companion service, used for remote sources like URL or Unsplash."></x-field>
  <x-field data-name="disableMediaKitPrefix" data-type="boolean" data-default="false" data-desc="If true, prevents automatically using the Media Kit's configuration."></x-field>
  <x-field data-name="disableMediaKitStatus" data-type="boolean" data-default="false" data-desc="If true, prevents checking the Media Kit's status to determine available plugins and restrictions."></x-field>
</x-field>

<x-field data-name="dropTargetProps" data-type="DropTarget" data-desc="Configuration for the @uppy/drop-target plugin, allowing drag-and-drop uploads onto a specified element."></x-field>

<x-field data-name="initialFiles" data-type="any[]" data-desc="An array of file objects to pre-populate the uploader with when it initializes."></x-field>

<x-field data-name="imageEditorProps" data-type="ImageEditorOptions" data-desc="An object of options passed directly to the @uppy/image-editor plugin. See the [Uppy Image Editor documentation](https://uppy.io/docs/image-editor/#Options) for all available options."></x-field>


## Key Props in Detail

### onUploadFinish

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

### coreProps

This prop gives you direct access to the Uppy core configuration. A primary use case is setting upload restrictions, such as file types, number of files, and file size. When a Media Kit is installed, these restrictions are often configured automatically, but you can override them here.

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
        // You can also set autoProceed to true to start uploads immediately
        autoProceed: true,
      }}
    />
  );
}
```

### plugins

This prop allows you to customize the tabs available in the Uploader dashboard. You can enable or disable built-in plugins or even add your own custom tabs. For a deep dive into creating your own plugin, see the [Creating a Custom Plugin](./guides-custom-plugin.md) guide.

```javascript CustomPluginUploader.jsx icon=logos:react
import Uploader from '@blocklet/uploader/react';
// Using a hero icon for the example
import { PhotoIcon } from '@heroicons/react/24/solid'; 

export default function CustomPluginUploader() {
  const customPlugins = [
    {
      id: 'MyCustomPlugin',
      options: {
        id: 'MyCustomPlugin',
        title: 'My Photos',
        // The icon can be a React node
        icon: () => <PhotoIcon style={{ width: 24, height: 24 }} />,
      },
      onShowPanel: (ref) => {
        // Logic to display your custom panel content
        console.log('Custom panel shown!', ref.current.getUploader());
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

### apiPathProps

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