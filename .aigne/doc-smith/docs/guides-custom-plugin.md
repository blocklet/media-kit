# Creating a Custom Plugin

The `@blocklet/uploader` component is built on top of Uppy, a highly modular and extensible file uploader. You can extend its functionality by creating your own custom tabs (known as "acquirers") that appear in the dashboard alongside standard options like "My Device" or "Webcam". This guide will walk you through creating a custom plugin using the provided `VirtualPlugin` interface.

This allows you to integrate unique workflows, such as selecting files from a custom media library, generating content on the fly, or connecting to a proprietary storage service.

## How It Works

Instead of requiring you to write a full Uppy plugin from scratch, `@blocklet/uploader` exposes a simplified interface. You can define a custom plugin directly within the `plugins` prop of the `<Uploader />` component. This configuration is then used to instantiate a `VirtualPlugin` behind the scenes.

The core of this feature is the `onShowPanel` callback. This function is triggered whenever a user clicks on your custom plugin's tab. It provides a React `ref` to the panel's container element, allowing you to render any React component inside it.

```d2
direction: right

"User": {
  shape: person
}

"Uploader Dashboard": {
  "My Device": "My Device"
  "Custom Tab": "My Custom Plugin"
}

"Your Application": {
  "Plugin Config": "plugins prop configuration" {
    "onShowPanel": "onShowPanel callback"
  }
  "Custom Component": "<MyCustomPanel />"
}

"User" -> "Uploader Dashboard.Custom Tab": Clicks
"Uploader Dashboard.Custom Tab" -> "Your Application.Plugin Config.onShowPanel": "Triggers callback with a ref"
"Your Application.Plugin Config.onShowPanel" -> "Your Application.Custom Component": "Renders component into the panel"

```

## Step-by-Step Implementation

Let's create a simple plugin that displays a button to programmatically add a text file to the uploader.

### 1. Configure the Plugin

First, define your plugin in the `plugins` array passed to the `<Uploader />` component. This object requires a unique `id`, `options` for display (title, icon), and the `onShowPanel` callback.

```jsx
// Example of a custom plugin configuration
const customPlugins = [
  {
    id: 'MyCustomPlugin', // A unique ID for this plugin instance
    options: {
      id: 'MyCustomPlugin', // This ID must match the outer ID
      title: 'Custom Source',
      // You can use an SVG string for the icon
      icon: `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="32" height="32"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>`,
    },
    onShowPanel: (ref) => {
      // We will render our React component here in the next step.
      console.log('Custom panel is now visible. Container ref:', ref.current);
    },
  },
];

// In your component's render method
<Uploader plugins={customPlugins} />
```

### 2. Create Your Panel Component

Next, create the React component that will be displayed inside the plugin's panel. You can use the `useUppy()` hook from `@uppy/react` to get access to the Uppy instance and interact with it.

```jsx
import React from 'react';
import { useUppy } from '@uppy/react';
import { createRoot } from 'react-dom/client';

// This is the component that will be rendered inside the panel
function MyCustomPanel() {
  const uppy = useUppy();

  const handleAddFile = () => {
    if (!uppy) return;

    const myBlob = new Blob(['This is a file created from a custom plugin.'], { type: 'text/plain' });

    uppy.addFile({
      name: 'custom-file.txt',
      type: 'text/plain',
      data: myBlob,
      source: 'MyCustomPlugin', // Good practice to identify the source
    });
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h3>Custom File Source</h3>
      <p>This panel can contain any custom React content.</p>
      <button type="button" onClick={handleAddFile}>
        Add a Sample Text File
      </button>
    </div>
  );
}
```

### 3. Render the Component in the Panel

Finally, update the `onShowPanel` callback to render your custom component into the provided container `ref`. It's important to handle unmounting as well to clean up when the panel is hidden.

```jsx
// ... inside your plugins configuration
onShowPanel: (ref) => {
  let root;
  if (ref.current) {
    root = createRoot(ref.current);
    root.render(<MyCustomPanel />);
  }

  // Return a cleanup function that will be called when the panel is hidden
  return () => {
    if (root) {
      setTimeout(() => root.unmount(), 0);
    }
  };
},
```

## Plugin Configuration Options

The plugin configuration object supports the following properties:

| Property      | Type                               | Description                                                                                                                                                    |
|---------------|------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `id`          | `string`                           | A unique identifier for the plugin instance.                                                                                                                   |
| `options`     | `object`                           | An object containing metadata and settings for the `VirtualPlugin`.                                                                                            |
| `onShowPanel` | `(ref) => (() => void) \| void`   | A callback function that fires when the panel is shown. It receives a React `RefObject` to the panel's container `div`. It can optionally return a cleanup function. |

### `options` Object

| Property   | Type                    | Description                                                                                                                   |
|------------|-------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| `id`       | `string`                | **Required.** A unique identifier that must match the top-level `id`.                                                         |
| `title`    | `string`                | **Required.** The text displayed on the tab in the Uppy Dashboard.                                                            |
| `icon`     | `string \| React.ReactNode` | An SVG string or a React component to be used as the tab icon.                                                                  |
| `autoHide` | `boolean`               | Defaults to `true`. If `true`, clicking the tab will hide other Uppy panels. Set to `false` to keep them visible simultaneously. |

With this approach, you can seamlessly integrate custom views and logic directly into the uploader's user interface.

For more general information on enabling or disabling standard plugins, please see the [Configuring Plugins](./guides-configuring-plugins.md) guide. For more advanced use cases, you may find the official [Uppy documentation on writing plugins](https://uppy.io/docs/plugins/#Writing-a-Plugin) helpful.