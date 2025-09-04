# <UploaderProvider /> and Hooks

For more advanced use cases, especially when using the uploader as a modal (`popup` mode), the `@blocklet/uploader` package provides a set of components and a hook to programmatically control the Uploader instance. This pattern decouples the Uploader's UI from the element that triggers it, offering greater flexibility in your application's layout and logic.

This approach is built around three core exports: `UploaderProvider`, `UploaderTrigger`, and the `useUploaderContext` hook.

```d2
direction: down

"React App": {
  "UploaderProvider": {
    style.fill: "#E4DBFE"
    "UploaderTrigger": {
      "Your Button or UI"
    }
    "MyCustomComponent": {}
  }
  "Uploader Modal (in Portal)": {
    style.stroke-dash: 2
  }
}

Context: "UploaderContext (provides uploaderRef)" {
  style.fill: "#DEE1EB"
}

"React App.UploaderProvider" -> Context: "Provides"
Context -> "React App.UploaderProvider.UploaderTrigger": "Consumes via useUploaderContext()"
Context -> "React App.UploaderProvider.MyCustomComponent": "Consumes via useUploaderContext()"

"React App.UploaderProvider.UploaderTrigger" -> "Uploader Modal (in Portal)": "onClick opens modal" {
  style.animated: true
}

"Uploader Modal (in Portal)" -> "React App.UploaderProvider.UploaderTrigger": "onSuccess triggers onChange" {
  style.animated: true
  style.stroke-dash: 2
}
```

## UploaderProvider

The `UploaderProvider` component is a wrapper that creates an `Uploader` instance and makes it accessible to all its descendant components via React's Context API. It is the foundation for programmatically controlling the uploader.

### Props

The `UploaderProvider` accepts all the props that the standard [`<Uploader />` component](./api-reference-uploader-component-props.md) does, with the addition of `children`.

| Prop | Type | Description |
|---|---|---|
| `children` | `ReactNode` | The part of your React application that needs access to the uploader instance, including any `UploaderTrigger` components. |
| `popup` | `boolean` | When set to `true`, the Uploader UI is rendered into a portal attached to `document.body` and behaves like a modal. This is the primary use case for `UploaderProvider`. |
| `...restProps` | `UploaderProps` | All other props are passed directly to the underlying `Uploader` component. |

### Usage

Wrap the section of your application where you want to trigger the uploader with `UploaderProvider`.

```jsx
import { UploaderProvider, UploaderTrigger } from '@blocklet/uploader/react';
import Button from '@mui/material/Button';

function App() {
  return (
    <UploaderProvider
      popup={true}
      // ... other Uploader props
    >
      <main>
        <h1>My Application</h1>
        <UploaderTrigger onChange={(result) => console.log('Upload successful:', result)}>
          <Button variant="contained">Upload File</Button>
        </UploaderTrigger>
      </main>
    </UploaderProvider>
  );
}
```

## UploaderTrigger

`UploaderTrigger` is a convenience component that renders a clickable area. When clicked, it opens the Uploader modal provided by its parent `UploaderProvider`.

### Props

| Prop | Type | Description |
|---|---|---|
| `children` | `ReactNode` | The content to be rendered inside the trigger. This can be a button, text, an icon, or any other React component. |
| `onChange` | `Function` | An optional callback function that is triggered **once** after a successful upload. It receives the same arguments as the `onSuccess` callback. |
| `...restProps` | `BoxProps` | Any other props are passed to the underlying MUI `<Box>` component, allowing for styling and other customizations. |

### Usage

The `UploaderTrigger` should be placed anywhere inside an `UploaderProvider`.

```jsx
<UploaderProvider popup={true}>
  <UploaderTrigger onChange={(result) => alert(`Uploaded ${result.successful.length} files!`)}>
    <p>Click here to upload</p>
  </UploaderTrigger>
</UploaderProvider>
```

The `onChange` prop is particularly useful for handling the result of an upload initiated by the trigger without needing to manage state or effects at a higher level.

## useUploaderContext

The `useUploaderContext` hook provides direct, imperative access to the Uploader's instance ref. This is useful for advanced scenarios where you need more control than what `UploaderTrigger` offers.

This hook must be called from a component that is a descendant of `UploaderProvider`.

### Return Value

| Type | Description |
|---|---|
| `React.RefObject` | A React ref object. The Uploader component instance is available at `ref.current`. You can access the core Uppy instance by calling `ref.current.getUploader()`. |

### Usage

You can use this hook to build your own custom trigger or to interact with the Uppy API directly.

```jsx
import { useUploaderContext } from '@blocklet/uploader/react';
import Button from '@mui/material/Button';

// A custom component that uses the hook
function CustomUploaderButton() {
  const uploaderRef = useUploaderContext();

  const handleOpenUploader = () => {
    // Access the Uppy instance
    const uploader = uploaderRef.current?.getUploader();
    
    // Call Uppy's open() method
    uploader?.open();

    // You can also add event listeners dynamically
    uploader?.on('complete', (result) => {
      console.log('Custom handler: Upload complete!', result);
    });
  };

  return <Button onClick={handleOpenUploader}>Open with Hook</Button>;
}

// In your main component
function App() {
  return (
    <UploaderProvider popup={true}>
      <CustomUploaderButton />
    </UploaderProvider>
  );
}
```
This example shows how to get the `uploaderRef`, access the underlying Uppy instance, and programmatically open the modal and attach an event listener.

By using `UploaderProvider`, `UploaderTrigger`, and `useUploaderContext`, you can achieve fine-grained control over the uploader's behavior, seamlessly integrating it into complex application flows. To further customize the uploader's functionality, explore the [Available Plugins](./api-reference-uploader-plugins.md) that can be configured.