# <UploaderProvider /> and Hooks

For more advanced use cases, you might need to trigger the Uploader from a different part of your application, or programmatically control its behavior. The `UploaderProvider` component and its associated hooks provide a flexible way to decouple the Uploader's UI from its trigger, using React's Context API.

This pattern is ideal when you want to open the Uploader modal from a button in a header, a link in a menu, or any element that isn't a direct child of the Uploader itself.

This approach involves three main parts:

<x-cards data-columns="3">
  <x-card data-title="UploaderProvider" data-icon="lucide:box">
    A wrapper component that instantiates the Uploader and provides its instance via context.
  </x-card>
  <x-card data-title="UploaderTrigger" data-icon="lucide:mouse-pointer-click">
    A simple component that creates a clickable area to open the Uploader modal.
  </x-card>
  <x-card data-title="useUploaderContext" data-icon="lucide:webhook">
    A hook to get direct access to the Uploader instance for custom logic.
  </x-card>
</x-cards>

### How It Works

The `UploaderProvider` renders the `<Uploader />` component (often in a portal attached to the document body) and holds a reference (`ref`) to its instance. Any child component within the provider's tree can then access this `ref` using the `useUploaderContext` hook. The `UploaderTrigger` is a pre-built component that uses this hook to call the `open()` method on the Uploader instance.

```d2
direction: down

app-ui: {
  label: "Your Application UI"
  shape: rectangle

  uploader-provider: {
    label: "UploaderProvider"
    shape: rectangle
    style.fill: "#f0f9ff"

    header: {
      label: "Header"
      shape: rectangle

      upload-button: {
        label: "<UploaderTrigger>"
        shape: rectangle
      }
    }

    main-content: {
      label: "Main Content"
      shape: rectangle
    }
  }
}

uploader-instance: {
  label: "<Uploader /> Instance\n(in React Portal)"
  shape: rectangle
  style.stroke-dash: 2
}

app-ui.uploader-provider.header.upload-button -> uploader-instance: "3. Calls open() via context ref"

context: {
  label: "UploaderContext"
  shape: cylinder
}

app-ui.uploader-provider -> context: "1. Provides uploader ref"
context -> app-ui.uploader-provider.header.upload-button: "2. Consumes ref"

```

---

## `UploaderProvider`

This component is the foundation of the pattern. It must wrap any components that need to interact with the Uploader, including any `UploaderTrigger` or custom components using the `useUploaderContext` hook.

It accepts all the same props as the `<Uploader />` component, allowing you to configure the Uploader's behavior, plugins, and appearance. For this pattern, you will almost always want to set `popup={true}`.

### Props

| Prop | Type | Description |
|---|---|---|
| `children` | `ReactNode` | The child components that will have access to the Uploader context. |
| `popup` | `boolean` | When `true`, the Uploader is rendered in a modal using a React Portal. When `false`, it's rendered inline. Defaults to `true`. |
| `...restProps` | `UploaderProps` | All other props are passed directly to the underlying `<Uploader />` component. See the [Uploader Component Props](./api-reference-uploader-component-props.md) for a full list. |

### Usage

Wrap a section of your application, or your entire application, with `UploaderProvider`.

```javascript MyUploader.jsx icon=logos:react
import React from 'react';
import { UploaderProvider, UploaderTrigger } from '@blocklet/uploader/react';
import Button from '@mui/material/Button';

export default function MyUploader() {
  const handleUploadSuccess = (result) => {
    console.log('Files uploaded: ', result);
    // result contains { successful, failed } arrays of file objects
  };

  return (
    <UploaderProvider endpoint="/api/upload" popup={true}>
      <UploaderTrigger onChange={handleUploadSuccess}>
        <Button variant="contained">Upload File</Button>
      </UploaderTrigger>

      {/* Other components in your app can also be here */}
    </UploaderProvider>
  );
}
```

---

## `UploaderTrigger`

The `UploaderTrigger` component is a convenient wrapper that makes its children clickable, triggering the Uploader modal to open.

### Props

| Prop | Type | Description |
|---|---|---|
| `children` | `ReactNode` | The React element(s) to use as the trigger, such as a `<Button>` or an `<a>` tag. |
| `onChange` | `Function` | An optional callback function that is triggered only once after a successful upload. It receives the result object from Uppy. |
| `...restProps` | `object` | Any additional props are passed to the underlying Material-UI `<Box>` component. |

### Usage

Place any clickable component inside `UploaderTrigger`. The `onChange` prop provides a simple way to handle the result of the upload.

```javascript icon=logos:react
<UploaderTrigger onChange={(result) => alert(`Uploaded ${result.successful.length} files!`)}>
  <Button>Click me to Upload</Button>
</UploaderTrigger>
```

---

## `useUploaderContext`

For the most control, the `useUploaderContext` hook gives you direct access to the Uploader's instance ref. This allows you to call any method on the Uploader or its underlying Uppy instance programmatically.

### Return Value

| Value | Type | Description |
|---|---|---|
| `uploaderRef` | `React.RefObject` | A React ref object. The Uploader instance is at `uploaderRef.current`. To access the Uppy instance, use `uploaderRef.current.getUploader()`. |

> **Note:** The hook will throw an error if it's used in a component that is not a descendant of `UploaderProvider`.

### Usage

Here's an example of a custom component that uses the hook to open the Uploader and also log the number of currently selected files.

```javascript CustomControls.jsx icon=logos:react
import React from 'react';
import { useUploaderContext } from '@blocklet/uploader/react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

export default function CustomControls() {
  const uploaderRef = useUploaderContext();

  const handleOpenUploader = () => {
    const uploader = uploaderRef?.current?.getUploader();
    uploader?.open();
  };

  const handleLogFiles = () => {
    const uploader = uploaderRef?.current?.getUploader();
    const files = uploader?.getFiles();
    console.log('Current files in Uppy:', files);
    alert(`There are ${files.length} files selected.`);
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
      <Button variant="outlined" onClick={handleOpenUploader}>
        Open Uploader Manually
      </Button>
      <Button variant="outlined" color="secondary" onClick={handleLogFiles}>
        Log Current Files
      </Button>
    </Box>
  );
}
```

To use this `CustomControls` component, you would place it inside the `UploaderProvider` like so:

```javascript App.jsx icon=logos:react
// ... imports
import CustomControls from './CustomControls';

export default function App() {
  return (
    <UploaderProvider endpoint="/api/upload">
      {/* You can still have a primary trigger */}
      <UploaderTrigger>
        <Button>Upload</Button>
      </UploaderTrigger>

      {/* And also use your custom component for more control */}
      <CustomControls />
    </UploaderProvider>
  );
}
```

This pattern provides a high degree of flexibility, allowing you to integrate the uploader seamlessly into complex application layouts and workflows.

Next, you might want to explore some of the helper functions that can simplify common tasks.

<x-card data-title="Utility Functions" data-icon="lucide:wrench" data-href="/api-reference/uploader/utility-functions" data-cta="View Utilities">
  Learn about helper functions for tasks like file conversion and URL generation.
</x-card>
