# <UploaderProvider /> and Hooks

To offer greater flexibility in triggering the Uploader from anywhere in your application, the `@blocklet/uploader` package provides a set of tools based on React Context. This allows you to decouple the trigger element (like a button) from the Uploader UI itself, which is especially useful for opening the Uploader from a header, a menu, or a dynamically generated list item.

The system consists of three main parts:

-   `UploaderProvider`: A wrapper component that initializes the Uploader and makes its instance available to all descendant components.
-   `UploaderTrigger`: A simple component that creates a clickable area to open the Uploader modal.
-   `useUploaderContext`: A hook for more advanced, custom logic that gives you direct access to the Uploader's instance.

```d2
direction: down

app-root: {
  label: "Application Root"
  shape: rectangle

  uploader-provider: {
    label: "UploaderProvider"
    shape: rectangle
    style.fill: "#e6f7ff"
    "Wraps components that need uploader access"

    some-component: {
        label: "Any Descendant Component"
        shape: rectangle

        uploader-trigger: {
            label: "UploaderTrigger or\ncomponent with useUploaderContext"
        }
    }
  }
}

portal-target: {
  label: "document.body"
  shape: rectangle
  style.stroke-dash: 4

  uploader-modal: {
    label: "Uploader Modal"
    shape: rectangle
  }
}

app-root.uploader-provider.some-component.uploader-trigger -> portal-target.uploader-modal: "1. User clicks, calls open()"
portal-target.uploader-modal -> portal-target.uploader-modal: "2. User interacts with UI"
portal-target.uploader-modal -> app-root.uploader-provider.some-component.uploader-trigger: "3. Fires onChange on success"
```

## UploaderProvider

This is the top-level component that must wrap any part of your application that needs to trigger the uploader. It is responsible for creating and holding the Uploader instance.

**Props**

| Prop | Type | Description |
| --- | --- | --- |
| `children` | `ReactNode` | Your application components that need access to the uploader. |
| `popup` | `boolean` | If `true`, the Uploader UI is rendered in a portal at the bottom of `document.body`, making it behave like a modal. This is the most common use case. If `false`, it's rendered inline. |
| `...restProps` | `UploaderProps` | All other props are passed directly to the underlying `<Uploader />` component. See the [<Uploader /> Component Props](./api-reference-uploader-component-props.md) for a full list. |

**Usage**

Typically, you'll wrap your main application layout or a specific page with `UploaderProvider`.

```jsx
import { UploaderProvider } from '@blocklet/uploader/react';

function App() {
  return (
    <UploaderProvider popup endpoint="/api/upload">
      {/* The rest of your application */}
      <MyPage />
    </UploaderProvider>
  );
}
```

## UploaderTrigger

The `UploaderTrigger` is a convenient wrapper component. Any children passed to it will become a clickable area that opens the Uploader UI.

**Props**

| Prop | Type | Description |
| --- | --- | --- |
| `children` | `ReactNode` | The element(s) to be rendered as the trigger, e.g., `<Button>Upload File</Button>`. |
| `onChange` | `(result) => void` | An optional one-time callback function that fires after a successful upload. It receives the upload result as its argument. |
| `...restProps` | `BoxProps` | Any other props are passed to the underlying MUI `<Box>` component for styling. |


## useUploaderContext

For more advanced control, the `useUploaderContext` hook provides direct access to the Uploader's internal `ref`. This allows you to call methods on the Uppy instance programmatically.

It's important to note that this hook **must** be used within a component that is a descendant of `UploaderProvider`.

**Return Value**

The hook returns a React `ref` object. The Uppy instance can be accessed via `ref.current.getUploader()`.

**Usage**

Here's how you can build a custom button to open the uploader.

```jsx
import { useUploaderContext } from '@blocklet/uploader/react';
import { Button } from '@mui/material';

function CustomUploadButton() {
  const uploaderRef = useUploaderContext();

  const handleOpen = () => {
    // Access the underlying Uppy instance and call its open() method
    const uploader = uploaderRef?.current?.getUploader();
    uploader?.open();
  };

  return (
    <Button variant="contained" onClick={handleOpen}>
      Open Uploader
    </Button>
  );
}
```

## Putting It All Together

Here is a complete example demonstrating how to use `UploaderProvider` with `UploaderTrigger` to open a modal and handle the successful upload.

```jsx
import { UploaderProvider, UploaderTrigger } from '@blocklet/uploader/react';
import { Button, Box } from '@mui/material';

export default function UploaderExample() {
  const handleUploadSuccess = (result) => {
    console.log('Files uploaded successfully:', result);
    // You can now use the file URLs from the result
    // e.g., update state, send to server, etc.
    alert(`Upload complete! File URL: ${result.successful[0]?.uploadURL}`);
  };

  return (
    <UploaderProvider
      popup
      endpoint="/api/upload" // Your backend upload endpoint
      // ... other Uploader props
    >
      <Box sx={{ padding: 4, textAlign: 'center' }}>
        <h1>My Application</h1>
        <p>Click the button below to upload a file.</p>

        <UploaderTrigger onChange={handleUploadSuccess}>
          <Button variant="contained">Upload a File</Button>
        </UploaderTrigger>
      </Box>
    </UploaderProvider>
  );
}

```

This setup provides a robust and flexible way to integrate the uploader into complex application layouts. Next, you can explore some of the helper functions that come with the package.

<x-card data-title="Next: Utility Functions" data-icon="lucide:function-square" data-href="/api-reference/uploader/utility-functions" data-cta="Read More">
  Reference for exported helper functions for tasks like file conversion, URL generation, and Uppy instance manipulation.
</x-card>
