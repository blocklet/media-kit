# <UploaderProvider /> and Hooks

For scenarios requiring more control than the standard `<Uploader />` component, the `@blocklet/uploader` package provides a set of tools based on React Context. This allows you to trigger the uploader from anywhere within your application—such as a custom button, menu item, or link—without needing to manage the uploader's state directly. This is achieved through the `UploaderProvider`, `UploaderTrigger`, and `useUploaderContext` hook.

This approach decouples the trigger mechanism from the uploader UI, giving you greater flexibility in your application design.

```d2
direction: down

"Your-React-App": {
  shape: package
  label: "Your React App"

  "UploaderProvider": {
    shape: rectangle
    
    "UploaderTrigger": {
      shape: rectangle
      label: "UploaderTrigger\n(e.g., wrapping a Button)"
    }
    
    "Custom-Component": {
        shape: rectangle
        label: "Custom Component\n(using useUploaderContext)"
    }
  }

  "Uploader-Instance": {
    shape: rectangle
    label: "Uploader Instance\n(Rendered in a Portal)"
    style.stroke-dash: 2
  }

  "UploaderProvider" -> "Uploader-Instance": "Creates & Manages"
  UploaderProvider.UploaderTrigger -> "Uploader-Instance": "Opens via Context"
  UploaderProvider."Custom-Component" -> "Uploader-Instance": "Controls via Context"
}
```

## UploaderProvider

The `UploaderProvider` component is the foundation for programmatic control. It initializes the Uploader instance and makes it available to all child components through React Context. It should be placed high up in your component tree, wrapping any components that need to trigger the uploader.

| Prop | Type | Description |
|---|---|---|
| `children` | `ReactNode` | The child components that will have access to the uploader context. |
| `popup` | `boolean` | When `true`, the uploader UI is rendered into a portal at the end of `document.body`, making it invisible until triggered. This is the recommended setting for this pattern. |
| `...restProps`| `UploaderProps`| Accepts all other props that the standard [`<Uploader />`](./api-reference-uploader-component-props.md) component accepts for configuration (e.g., `endpoint`, `plugins`). |

## UploaderTrigger

`UploaderTrigger` is a convenient wrapper component. Any element placed inside it becomes a clickable trigger that opens the uploader modal.

| Prop | Type | Description |
|---|---|---|
| `children` | `ReactNode` | The element(s) to be used as the trigger (e.g., a button, an icon). |
| `onChange` | `Function` | An optional callback function that is executed once after a successful upload. It receives the same arguments as the `onSuccess` callback on the `<Uploader />` component. |
| `...restProps`| `object` | Any other props are passed down to the underlying Material-UI `<Box>` component, allowing for custom styling and attributes. |

## useUploaderContext()

For the most flexibility, the `useUploaderContext` hook gives you direct access to the uploader's internal reference. This allows you to build custom logic around opening and interacting with the uploader instance.

The hook returns a React `ref` object. To access the underlying Uppy instance, you can call the `getUploader()` method on the ref's `current` property: `uploaderRef.current.getUploader()`.

> **Note:** This hook must be called from a component that is a descendant of `UploaderProvider`, otherwise it will throw an error.

## Usage Example

Here's a complete example demonstrating how to use `UploaderProvider` and `UploaderTrigger` to open the uploader from a custom button and receive the uploaded file information.

```jsx
import React from 'react';
import { Button } from '@mui/material';
import { UploaderProvider, UploaderTrigger } from '@blocklet/uploader';

export default function ProfileAvatarUploader() {
  const handleUploadSuccess = (result) => {
    console.log('Upload successful!', result);
    // Assuming result.successful[0].uploadURL contains the file URL
    const avatarUrl = result.successful[0].uploadURL;
    // Now you can update the user's avatar with the new URL
    // e.g., send it to your backend API
  };

  return (
    <UploaderProvider
      endpoint="/api/upload" // Your backend upload endpoint
      popup={true}
      plugins={['ImageEditor']}
    >
      <div>
        <h2>My Profile</h2>
        <UploaderTrigger onChange={handleUploadSuccess}>
          <Button variant="contained">Change Avatar</Button>
        </UploaderTrigger>
      </div>
    </UploaderProvider>
  );
}
```

## Advanced Usage with `useUploaderContext`

If you need to perform actions before or after opening the uploader, `useUploaderContext` provides the necessary control.

```jsx
import React from 'react';
import { Button } from '@mui/material';
import { UploaderProvider, useUploaderContext } from '@blocklet/uploader';

function CustomUploaderButton() {
  const uploaderRef = useUploaderContext();

  const handleClick = () => {
    console.log('Preparing to open uploader...');
    // You can add any custom logic here

    const uploader = uploaderRef.current?.getUploader();
    if (uploader) {
      // Listen for a specific event
      uploader.once('upload-success', (file, response) => {
        console.log(`File ${file.name} uploaded successfully`, response);
      });
      
      uploader.open();
    }
  };

  return <Button onClick={handleClick}>Open with Custom Logic</Button>;
}

export default function AdvancedUploaderExample() {
  return (
    <UploaderProvider endpoint="/api/upload" popup={true}>
      <CustomUploaderButton />
    </UploaderProvider>
  );
}
```

By using `UploaderProvider` and its associated hooks, you can integrate the uploader seamlessly into your application's flow, triggering it from any user interaction while keeping your component logic clean and organized.

For more details on what you can configure, see the full list of [`<Uploader />` Component Props](./api-reference-uploader-component-props.md).