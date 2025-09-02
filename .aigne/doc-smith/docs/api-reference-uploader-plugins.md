# Available Plugins

The `@blocklet/uploader` component extends the core Uppy library with several custom plugins designed for seamless integration within the Blocklet and Media Kit ecosystem. These plugins provide functionalities ranging from browsing existing assets to generating new ones with AI.

This document provides a reference for the custom-built plugins available out-of-the-box.

---

## Uploaded

The `Uploaded` plugin provides a tab in the Uploader interface that allows users to browse and select files they have previously uploaded to the Media Kit.

<x-cards>
<x-card data-title="Key Features">
- **Infinite Scrolling**: Automatically loads more files as the user scrolls down.
- **File Previews**: Renders appropriate previews for images, videos, and PDFs.
- **Quick Upload**: Includes a dedicated button to switch to the 'My Device' tab for new uploads.
- **File Selection**: Allows users to select one or more existing files to use.
</x-card>
<x-card data-title="How it Works">
The plugin fetches a paginated list of files from the `/api/uploads` endpoint provided by the Media Kit. It's enabled by default when a Media Kit blocklet is detected.
</x-card>
</x-cards>

### Configuration

While enabled by default, you can pass custom parameters to the API request. This is useful for filtering the initial list of files shown to the user.

| Option | Type | Description |
|---|---|---|
| `params` | `object` | An object of query parameters to be sent with the API request to `/api/uploads`. |

**Example: Filtering uploaded files by a custom parameter**

```jsx
import Uploader from '@blocklet/uploader';

function MyComponent() {
  return (
    <Uploader
      plugins={[
        ['@blocklet/uploader/Uploaded', {
          title: 'My Images', // Optional: Rename the tab
          params: { category: 'avatars' } // Custom filter
        }],
        // ... other plugins
      ]}
    />
  );
}
```

---

## Resources

The `Resources` plugin allows users to select from a collection of static assets provided by other installed blocklets, which are served via the Media Kit's resources endpoint.

### Key Features

- **Component Filtering**: Displays filter buttons to view resources from different source components (blocklets).
- **Grid View**: Shows a clean, grid-based layout of available resource files.
- **Seamless Selection**: Integrates directly into the Uploader's selection workflow.

### Configuration

This plugin is also enabled by default when a Media Kit is detected. It fetches data from the `/api/resources` endpoint.

**Example: Enabling the Resources plugin**

```jsx
import Uploader from '@blocklet/uploader';

function MyComponent() {
  return (
    <Uploader
      plugins={[
        '@blocklet/uploader/MyDevice',
        '@blocklet/uploader/Uploaded',
        '@blocklet/uploader/Resources', // Enabled by default if Media Kit is present
      ]}
    />
  );
}
```

---

## AI Image

The `AIImage` plugin adds a powerful AI image generation tool directly into the Uploader. Users can enter text prompts to create and select unique images.

### Key Features

- **Prompt Interface**: A dedicated panel for writing prompts and configuring generation parameters.
- **Model Selection**: Automatically fetches and lists available AI models from the backend (`/api/image/models`).
- **Image Output Gallery**: Displays generated images for review and selection.
- **Responsive Design**: Adapts to both desktop and mobile views.

### Configuration

To use this plugin, you must add it to the `plugins` array. Advanced filtering of which AI models are presented to the user can be configured via Blocklet preferences (`supportModels`).

**Example: Adding the AI Image plugin**

```jsx
import Uploader from '@blocklet/uploader';

function MyComponent() {
  return (
    <Uploader
      plugins={[
        '@blocklet/uploader/MyDevice',
        '@blocklet/uploader/Uploaded',
        '@blocklet/uploader/AIImage',
      ]}
    />
  );
}
```

---

## VirtualPlugin

The `VirtualPlugin` is not a feature-rich plugin itself, but a powerful base class for developers to create their own custom plugins that appear as a source tab in the Uploader dashboard.

It provides the basic structure to register a new tab, allowing you to trigger custom logic or render a completely custom UI when the tab is selected. For a complete walkthrough, see the [Creating a Custom Plugin](./guides-custom-plugin.md) guide.

<x-card data-title="Guide: Creating a Custom Plugin" data-icon="lucide:wand-2" data-href="/guides/custom-plugin" data-cta="Read The Guide">
  Learn how to extend the Uploader's functionality by creating your own plugin tab using the `VirtualPlugin` component.
</x-card>

### Options

| Option | Type | Description |
|---|---|---|
| `id` | `string` | **Required.** A unique identifier for your plugin. |
| `title` | `string` | The text displayed on the plugin's tab. |
| `icon` | `string` | An SVG string to use as the icon for the tab. |
| `autoHide` | `boolean` | If `true` (default), the Uploader panel will hide when this tab is selected, giving you a blank canvas to render your own UI. |

---

## Internal & Utility Plugins

These plugins operate in the background to provide security, file processing, and browser compatibility. They are enabled automatically and do not require any configuration.

### PrepareUpload

This is a pre-processor plugin that runs on every file before the upload begins. Its tasks include:

- **Security Hardening**: Sanitizes SVG files to prevent XSS attacks and inspects compressed files to detect and prevent zip bomb attacks.
- **File Normalization**: Downloads files from remote sources (like URL or Unsplash), corrects image orientation based on EXIF data, and generates a unique, content-based hash for the filename.
- **Image Validation**: If `cropperOptions.aspectRatio` is set on the `<Uploader />` component, this plugin ensures that images conform to the specified aspect ratio, opening the image editor if they do not.

### SafariPastePlugin

This is a small modifier plugin that addresses a browser-specific issue. It ensures that the paste-to-upload functionality works correctly in the Safari browser by adding a dedicated event listener.