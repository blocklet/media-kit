# Creating a Custom Plugin

The `@blocklet/uploader` component is built to be extensible, allowing you to add custom tabs to the dashboard for specialized functionality. Whether you want to integrate an AI image generator, browse a custom asset library, or create a unique file source, you can achieve it by creating a custom plugin.

This guide will walk you through the process of adding your own tab to the Uploader dashboard using the provided `VirtualPlugin` interface.

## How It Works

The core of this functionality is the `VirtualPlugin`. It's a special Uppy plugin that acts as a placeholder, creating a new tab in the dashboard with a title and an icon you specify. This tab contains an empty `<div>` element.

When a user clicks on your custom tab, the `onShowPanel` callback function you provide is triggered. This function receives a React `ref` pointing to the empty `<div>` container. Your task is to then render your own custom React component into this container, effectively bringing your plugin's UI to life.

```d2
direction: down

User: { 
  shape: c4-person 
}

Uploader: {
  label: "Uploader Dashboard"
  shape: rectangle

  Standard-Tabs: {
    label: "Standard Tabs"
    shape: rectangle
    "My Device": {}
    "Webcam": {}
  }

  Custom-Tab: {
    label: "Your Custom Tab"
    shape: rectangle

    VirtualPlugin-Container: {
      label: "Empty <div> from VirtualPlugin"
      shape: rectangle
      style: {
        stroke-dash: 2
      }
    }
  }
}

Your-App: {
  label: "Your Application Logic"
  shape: rectangle

  onShowPanel: {
    label: "onShowPanel Callback"
    shape: hexagon
  }

  Custom-Component: {
    label: "Your Custom React Component"
    shape: rectangle
  }
}

User -> Uploader.Custom-Tab: "1. Clicks custom tab"
Uploader.Custom-Tab -> Your-App.onShowPanel: "2. Triggers onShowPanel with ref"
Your-App.onShowPanel -> Your-App.Custom-Component: "3. Renders component into container"
Your-App.Custom-Component -> Uploader.Custom-Tab.VirtualPlugin-Container: "4. UI appears in the tab"

```

## Step 1: Configure the Plugin

To add a custom plugin, you need to configure the `plugins` prop on the `<Uploader />` component. Instead of just a string array, you'll provide an array of objects, where each object defines a custom plugin.

Here's the structure of a plugin configuration object:

| Property      | Type                                     | Description                                                                                                                                                              |
|---------------|------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `id`          | `string`                                 | A unique identifier for your plugin instance. Uppy uses this internally. Must be the same as `options.id`.                                                               |
| `options`     | `object`                                 | An object containing configuration for the plugin's appearance and behavior.                                                                                             |
| `options.id`  | `string`                                 | The unique ID for the plugin.                                                                                                                                            |
| `options.title`| `string`                                | The text that will appear on the tab in the Uploader dashboard.                                                                                                          |
| `options.icon` | `string`                                 | An SVG string to be used as the icon for the tab. It is rendered directly, so ensure it's safe.                                                                         |
| `options.autoHide`| `boolean`                              | If `true` (default), clicking the tab will hide other Uppy panels. Set to `false` if you want your panel to appear alongside others.                                      |
| `onShowPanel` | `(ref: React.RefObject<any>) => void` | A callback function that fires when the user clicks the plugin tab. It receives a `ref` to the container `div` where you should render your component. |

### Example Configuration

Let's add a plugin called "AI Image" that will allow users to generate images.

```jsx
import Uploader from '@blocklet/uploader/react';
import ReactDOM from 'react-dom';

// A simple SVG icon for the tab
const AIIcon = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M9.5 2.5a2.5 2.5 0 0 1 5 0"/>
  <path d="M12 6V5"/>
  <path d="M12 11v-1"/>
  <path d="m15 13-1-1"/>
  <path d="m9 13 1-1"/>
  <path d="M18 10h1"/>
  <path d="M5 10h1"/>
  <path d="m18 17-1-1"/>
  <path d="m6 17 1-1"/>
  <path d="M12 21v-1"/>
  <path d="M12 17v-1"/>
  <path d="M12 12a6 6 0 0 0-6 6h12a6 6 0 0 0-6-6Z"/>
</svg>
`;

function MyUploader() {
  // We will define this function in the next step
  const handleShowAIPanel = (panelRef) => {
    // ... render logic here
  };

  const customPlugins = [
    {
      id: 'AIImage',
      options: {
        id: 'AIImage',
        title: 'AI Image',
        icon: AIIcon,
      },
      onShowPanel: handleShowAIPanel,
    },
  ];

  return <Uploader plugins={customPlugins} />;
}
```

## Step 2: Create Your Custom Panel Component

Next, create the React component that will be displayed inside your new tab. This component can contain any UI elements you need. To interact with the Uploader (e.g., to add a generated file), you can get the Uppy instance using the `useUppy` hook from `@uppy/react`.

```jsx
import React from 'react';
import { useUppy } from '@uppy/react';

function AIImagePanel() {
  const uppy = useUppy();

  const handleGenerateAndAddFile = async () => {
    // In a real application, you would call an AI service here.
    // For this example, we'll create a dummy text file.
    const content = 'This is a generated file.';
    const blob = new Blob([content], { type: 'text/plain' });
    const file = {
      source: 'AIImagePlugin',
      name: 'generated-image.txt',
      type: 'text/plain',
      data: blob,
      size: blob.size,
    };

    // Add the file to Uppy's queue
    try {
      uppy.addFile(file);
      console.log('File added successfully');
    } catch (err) {
      console.error('Failed to add file:', err);
    }
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h3>AI Image Generator</h3>
      <p>Click the button to generate a new file and add it to the upload queue.</p>
      <button type="button" onClick={handleGenerateAndAddFile}>
        Generate & Add File
      </button>
    </div>
  );
}

export default AIImagePanel;
```

## Step 3: Render Your Component

Finally, implement the `onShowPanel` callback to render your custom component into the provided container. The best way to do this is with `ReactDOM.createPortal`, which renders a component into a DOM node outside of its parent's DOM hierarchy.

```jsx
import Uploader from '@blocklet/uploader/react';
import { UppyProvider } from '@uppy/react';
import ReactDOM from 'react-dom';
import React, { useRef } from 'react';
import AIImagePanel from './AIImagePanel'; // Assume this is the component from Step 2

// ... AIcon SVG string from Step 1

function MyUploaderWithCustomPlugin() {
  const uppyInstanceRef = useRef(null); // To pass the same Uppy instance to the provider

  const handleShowAIPanel = (panelRef) => {
    if (panelRef.current) {
      // Use createPortal to render our component into the div provided by VirtualPlugin
      const portal = ReactDOM.createPortal(
        // We need to wrap our component in UppyProvider so `useUppy` works
        <UppyProvider uppy={uppyInstanceRef.current}>
          <AIImagePanel />
        </UppyProvider>,
        panelRef.current
      );
      // This is a simple way to render, you might want a more robust solution
      // using state management in a real app to handle mounting/unmounting.
      ReactDOM.render(portal, document.createElement('div')); // Temporary container for render
    }
  };

  const customPlugins = [
    {
      id: 'AIImage',
      options: {
        id: 'AIImage',
        title: 'AI Image',
        icon: AIcon,
      },
      onShowPanel: handleShowAIPanel,
    },
  ];

  return (
    <Uploader
      onUppyReady={(uppy) => (uppyInstanceRef.current = uppy)}
      plugins={customPlugins}
    />
  );
}
```

With these steps, you have successfully added a new, fully functional tab to the Uploader. This powerful feature allows for deep integration and customization to fit the specific needs of your application.

For more configuration options, see the full list of props in the [`<Uploader />` Component Props](./api-reference-uploader-component-props.md) API reference.