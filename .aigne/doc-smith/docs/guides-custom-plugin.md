# Creating a Custom Plugin

The `@blocklet/uploader` component is built to be extensible, allowing you to add new functionality by creating custom tabs within the Uppy Dashboard. This is achieved using the `VirtualPlugin`, a special component that acts as a placeholder for your own custom React components.

This guide will walk you through the process of adding a custom tab, defining its appearance, and rendering your own content inside its panel.

## How it Works

The process involves two main parts:

1.  **Configuration**: You define your custom plugin in the `plugins` prop of the `<Uploader />` component. This configuration includes a unique ID, a title for the tab, an optional icon, and a crucial callback function: `onShowPanel`.
2.  **Rendering**: When a user clicks on your custom tab, the `onShowPanel` callback is triggered. It provides a `React.RefObject` pointing to the panel's container `div`. You can then use this reference with `ReactDOM.createPortal` to render any React component directly into the Uploader's interface.

Let's go through the steps to implement this.

## Step 1: Configure the Plugin

First, you need to add your custom plugin's configuration to the `plugins` prop of the `<Uploader />` component. The configuration is an object with a specific structure.

Here is an example of a plugin configuration object:

```javascript
const customPlugin = {
  id: 'my-custom-plugin',
  options: {
    id: 'my-custom-plugin', // Must match the parent id
    title: 'Custom',
    icon: '<svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>',
    autoHide: true,
  },
  onShowPanel: (ref) => {
    // We will implement this in the next step
    console.log('Custom panel is now visible. DOM element:', ref.current);
  },
};

<Uploader plugins={[customPlugin]} />
```

### Plugin Configuration Options

The plugin configuration object accepts the following properties:

| Property | Type | Description |
| --- | --- | --- |
| `id` | `string` | **Required.** A unique identifier for your plugin instance. This is used internally by Uppy and the Uploader. |
| `options` | `object` | **Required.** An object containing settings passed directly to the `VirtualPlugin` constructor. |
| `options.id` | `string` | **Required.** Must be the same as the top-level `id`. |
| `options.title` | `string` | **Required.** The text displayed on the tab button in the Uppy Dashboard. |
| `options.icon` | `string` | *Optional.* An SVG string to be used as the icon for the tab. |
| `options.autoHide` | `boolean` | *Optional.* If `true` (the default), opening this plugin's panel will automatically hide any other open panels. |
| `onShowPanel` | `(ref: React.RefObject<any>) => void` | **Required.** A callback function that is executed when the user clicks the plugin's tab. It receives a React ref to the panel's container `div`, allowing you to render content into it. |

## Step 2: Render Your Custom Component

With the configuration in place, the next step is to implement the rendering logic. The standard React pattern for rendering a component into a DOM node managed by another library is to use a Portal.

Here's how to set it up:

1.  **Create State**: Use `useState` to store the DOM element of the panel container. This will be `null` initially.
2.  **Implement `onShowPanel`**: Create a callback function that takes the `ref` and updates the state with `ref.current` when the panel is shown.
3.  **Define Your Custom Panel**: Create the React component you want to display inside the panel.
4.  **Use `ReactDOM.createPortal`**: Conditionally render your custom component into the container element using a portal.

### Complete Example

Below is a complete, working example that demonstrates how to put all the pieces together.

```jsx
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Uploader } from '@blocklet/uploader';
import '@blocklet/uploader/dist/style.css';
import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';

// 3. Define your custom panel component
const MyCustomPanel = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h3>My Custom AI Service</h3>
      <p>This panel can contain any custom React content, like a form to generate images from a prompt.</p>
      <input type="text" placeholder="Enter a prompt..." style={{ width: '80%', padding: '8px', marginBottom: '10px' }} />
      <button type="button" onClick={() => alert('Generating image...')}>
        Generate Image
      </button>
    </div>
  );
};

const App = () => {
  // 1. Create state to hold the panel's DOM element
  const [panelContainer, setPanelContainer] = useState(null);

  // 2. Implement the onShowPanel callback to update the state
  const handleShowPanel = (ref) => {
    if (ref.current) {
      setPanelContainer(ref.current);
    }
  };

  const customPlugin = {
    id: 'ai-image-generator',
    options: {
      id: 'ai-image-generator',
      title: 'AI Images',
      // A simple SVG icon string
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>',
    },
    onShowPanel: handleShowPanel,
  };

  return (
    <div>
      <Uploader plugins={[customPlugin]} />
      
      {/* 4. Use a portal to render your component into the panel's container */}
      {panelContainer && ReactDOM.createPortal(<MyCustomPanel />, panelContainer)}
    </div>
  );
};

export default App;
```

This example creates a new tab titled "AI Images". When clicked, it renders the `MyCustomPanel` component, which contains a simple form. This demonstrates how you can integrate complex, interactive UIs directly into the Uploader's dashboard.

---

By following this guide, you can significantly extend the capabilities of the `@blocklet/uploader` to fit your specific application needs. For more details on configuring the Uploader, see the API reference.

<x-card data-title="<Uploader /> Component Props" data-icon="lucide:component" data-href="/api-reference/uploader/component-props">
  Explore the full range of props available for the Uploader component, including core settings, dashboard options, and plugin configurations.
</x-card>
