# Creating a Custom Plugin

The `@blocklet/uploader` is designed for extensibility. While it comes with several powerful built-in plugins, you can easily add your own custom tabs to integrate unique workflows, connect to proprietary services, or provide specialized user interfaces. This guide will show you how to create a new plugin tab using the provided `VirtualPlugin` component.

This approach allows you to inject any React component into the Uploader's dashboard, opening up endless possibilities for customization.

## Understanding `VirtualPlugin`

At the heart of custom plugins is the `VirtualPlugin`. It's a special Uppy plugin that acts as a blank canvas. When you configure it, the Uploader creates a new tab button in the Dashboard and provides a container element for you to render your own React component. It simplifies the process of creating a new Uppy UI plugin from scratch.

## Configuration via the `plugins` Prop

To add your custom plugin, you'll configure the `plugins` prop on the `<Uploader />` component. This prop accepts an array of plugin configuration objects. Each object in the array defines a new tab.

Here is the structure for a custom plugin configuration:

```typescript UploaderProps.ts icon=logos:typescript
{
  id: string; // A unique identifier for your plugin
  options: {
    id: string; // Must match the top-level id
    title: string; // The text for the tab button
    icon?: string | React.ReactNode; // SVG string or React node for the icon
    autoHide?: boolean; // Automatically hide other panels when this one is shown
  };
  onShowPanel?: (ref: React.RefObject<any>) => void; // Callback to render your component
}
```

### Key Properties

| Property | Type | Description |
|---|---|---|
| `id` | `string` | A unique identifier for your plugin instance. This is crucial for Uppy to manage the plugin's state. |
| `options` | `object` | Configuration passed directly to the `VirtualPlugin` constructor. |
| `options.id` | `string` | Must be the same as the top-level `id`. |
| `options.title` | `string` | The text that appears on the tab button in the Uploader UI. |
| `options.icon` | `string \| React.ReactNode` | An SVG string or a React component for the tab icon. For an SVG string, it will be rendered using `dangerouslySetInnerHTML`. |
| `onShowPanel` | `(ref) => void` | The core of the custom plugin. This callback function fires when the user clicks on your plugin's tab. It receives a React `RefObject` pointing to the panel's container `div`, into which you can render your custom UI. |

## How it Works

The following diagram illustrates the workflow when a user interacts with a custom plugin tab:

```d2
direction: down

User: {
  shape: c4-person
}

Uploader-UI: {
  label: "Uploader Dashboard"
  shape: rectangle

  Custom-Tab: {
    label: "My Plugin Tab"
  }
  Panel-Container: {
    label: "Empty Panel Div (ref)"
    style.stroke-dash: 2
  }
}

Your-App: {
  label: "Your Application Code"
  shape: rectangle
  Uploader-Component: {
    label: "<Uploader plugins={...} />"
  }
  onShowPanel-Callback: {
    label: "onShowPanel(ref)"
  }
  My-Custom-Panel: {
    label: "<MyCustomPanel />"
  }
}

User -> Uploader-UI.Custom-Tab: "1. Clicks tab"
Uploader-UI.Custom-Tab -> Your-App.Uploader-Component: "2. Triggers plugin"
Your-App.Uploader-Component -> Your-App.onShowPanel-Callback: "3. Invokes callback with ref"
Your-App.onShowPanel-Callback -> Uploader-UI.Panel-Container: "4. ReactDOM renders component into ref"
Your-App.My-Custom-Panel -> Uploader-UI.Panel-Container: "5. Custom UI is displayed"
```

## Complete Example

Let's create a simple plugin that allows generating an image from a prompt, similar to an AI image generator. This example demonstrates how to use the `onShowPanel` callback to render a custom React component into the plugin's panel.

First, define your custom panel component. This component will contain the UI for your plugin.

```javascript MyCustomPanel.jsx icon=logos:react
import React from 'react';
import ReactDOM from 'react-dom/client';

// Your custom UI component to be rendered in the panel
function MyCustomPanel({ uppy }) {
  const [prompt, setPrompt] = React.useState('');

  const handleGenerate = () => {
    // In a real app, you would fetch an image from an API
    // For this example, we'll use a placeholder and add it to Uppy
    const mockFile = {
      source: 'MyPlugin',
      name: `${prompt.slice(0, 10)}.png`,
      type: 'image/png',
      data: new Blob(['pretend-image-data'], { type: 'image/png' }), // Mock file data
    };
    uppy.addFile(mockFile);
    uppy.getPlugin('Dashboard').openModal(); // Switch back to the main dashboard view
  };

  return (
    <div style={{ padding: '20px' }}>
      <h4>AI Image Generator</h4>
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter a prompt..."
        style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
      />
      <button onClick={handleGenerate} style={{ padding: '8px 16px' }}>
        Generate Image
      </button>
    </div>
  );
}

export default MyCustomPanel;
```

Next, configure the `<Uploader />` component to include your new plugin. You'll define the plugin in the `plugins` array and use the `onShowPanel` callback to render your `MyCustomPanel` component.

```javascript Uploader.jsx icon=logos:react
import React from 'react';
import ReactDOM from 'react-dom/client';
import Uploader from '@blocklet/uploader';
import MyCustomPanel from './MyCustomPanel';

// An SVG string for the icon
const customIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 1.9a2.5 2.5 0 0 0 0 3.54l1.9 1.9"/><path d="m12 21 1.9-1.9a2.5 2.5 0 0 0 0-3.54l-1.9-1.9"/><path d="M3 12h18"/><path d="m3 12 1.9 1.9a2.5 2.5 0 0 0 3.54 0l1.9-1.9"/><path d="m21 12-1.9-1.9a2.5 2.5 0 0 0-3.54 0l-1.9 1.9"/></svg>`;

function App() {
  const uploaderRef = React.useRef(null);

  const customPlugins = [
    {
      id: 'MyCustomPlugin',
      options: {
        id: 'MyCustomPlugin',
        title: 'AI Image',
        icon: customIcon,
      },
      onShowPanel: (panelRef) => {
        if (panelRef.current) {
          const uppy = uploaderRef.current?.uppy;
          const root = ReactDOM.createRoot(panelRef.current);
          root.render(<MyCustomPanel uppy={uppy} />);
        }
      },
    },
  ];

  return <Uploader ref={uploaderRef} plugins={customPlugins} />;
}

export default App;
```

In this example, when the 'AI Image' tab is clicked, the `onShowPanel` function is executed. It takes the `panelRef` and uses `ReactDOM.createRoot` to render the `<MyCustomPanel />` component inside it. We also pass the `uppy` instance to our custom component so it can interact with the Uploader, for example, by adding a generated file.

## Next Steps

You've now seen how to extend the `@blocklet/uploader` with custom functionality. For more advanced use cases, you can explore the official [Uppy documentation for writing plugins](https://uppy.io/docs/writing-plugins/).

To further customize your Uploader, review the full list of props in our API Reference.

<x-card data-title="<Uploader /> Component Props" data-icon="lucide:component" data-href="/api-reference/uploader/component-props">
Explore all available props to fine-tune the Uploader's behavior and appearance.
</x-card>
