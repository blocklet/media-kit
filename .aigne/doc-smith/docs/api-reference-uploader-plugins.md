# Available Plugins

The `@blocklet/uploader` package includes several custom-built plugins that extend Uppy's core functionality, providing seamless integration with the Media Kit and other blocklet services. These plugins offer features like browsing previously uploaded files, accessing shared resources, and generating images with AI.

This guide provides a reference for each available plugin and how to use them.

---

## Uploaded Plugin

The `Uploaded` plugin allows users to browse and select files they have previously uploaded to the Media Kit. It provides a familiar grid view with infinite scrolling for easy navigation.

### Features

- **Browse Past Uploads**: Displays a paginated grid of all files previously uploaded by the user.
- **Infinite Scroll**: Automatically loads more files as the user scrolls to the bottom.
- **Rich Previews**: Renders previews for various file types, including videos (`.mp4`, `.webm`) and PDFs, not just images.
- **Quick Upload**: Includes a dedicated "Add" button at the top of the list, allowing users to quickly switch to the "My Device" tab to upload new files.

### Usage

To enable the `Uploaded` plugin, import it and add it to the `plugins` array in the `Uploader` component's props.

```jsx
import Uploader from '@blocklet/uploader';
import { Uploaded } from '@blocklet/uploader/plugins';

function MyComponent() {
  return (
    <Uploader
      plugins={[
        [Uploaded, { id: 'Uploaded', title: 'My Uploads' }],
        // ... other plugins
      ]}
    />
  );
}
```

--- 

## Resources Plugin

The `Resources` plugin enables users to access a shared library of static assets. These assets can be provided by other blocklets installed in the same environment, creating a centralized media library.

### Features

- **Centralized Asset Library**: Access images and other files from different blocklet components.
- **Component Filtering**: If multiple components provide resources, the plugin displays filter buttons to easily switch between sources.
- **Grid View**: Displays resources in a clean and simple grid layout.

### Usage

Enable the `Resources` plugin by adding it to the `plugins` array. The plugin automatically fetches available resources and component filters from the backend.

```jsx
import Uploader from '@blocklet/uploader';
import { Resources } from '@blocklet/uploader/plugins';

function MyComponent() {
  return (
    <Uploader
      plugins={[
        [Resources, { id: 'Resources', title: 'Shared Resources' }],
        // ... other plugins
      ]}
    />
  );
}
```

---

## AI Image Plugin

The `AIImage` plugin integrates with AI image generation services, allowing users to create images directly within the uploader interface by providing a text prompt.

### Features

- **Text-to-Image Generation**: Users can type a prompt to generate new images.
- **Model Selection**: If the backend is configured with multiple AI models (e.g., DALL-E, Stable Diffusion), users can choose which model to use.
- **Responsive UI**: The interface adapts for both desktop and mobile views, providing a two-panel layout for prompt input and image output.

### Usage

The `AIImage` plugin requires backend support for image generation. Once the backend is configured, you can add it to the frontend.

```jsx
import Uploader from '@blocklet/uploader';
import { AIImage } from '@blocklet/uploader/plugins';

function MyComponent() {
  return (
    <Uploader
      plugins={[
        [AIImage, { id: 'AIImage', title: 'AI Image' }],
        // ... other plugins
      ]}
    />
  );
}
```

--- 

## PrepareUpload Plugin

`PrepareUpload` is an internal utility plugin that runs automatically to process files before they are uploaded. It is not a user-facing tab but works in the background to enhance security and data integrity. You do not need to configure it manually.

### Features

- **Security Sanitization**: Prevents XSS attacks by sanitizing SVG file content and file names.
- **Zip Bomb Prevention**: Inspects compressed files (`.zip`, `.gz`, etc.) to detect and prevent zip bomb attacks by checking the compression ratio.
- **Content-Based Hashing**: Generates a unique filename based on an MD5 hash of the file's content to prevent duplicate uploads.
- **Image Orientation Correction**: Automatically reads EXIF data from images and rotates them to the correct orientation.
- **Remote File Handling**: Downloads files from remote sources (like Unsplash or URL imports) before processing them locally.
- **Image Validation**: When an aspect ratio is enforced via the Image Editor, this plugin ensures that uploaded images conform to it, opening the editor if they don't.

---

## VirtualPlugin

`VirtualPlugin` is a special-purpose plugin designed to serve as a template for creating your own custom plugins. It renders an empty panel in the Uploader's dashboard, which you can use as a target for your custom UI and logic.

This is an advanced feature. For a detailed walkthrough, see the [Creating a Custom Plugin](./guides-custom-plugin.md) guide.

### Usage

Use this plugin as a base when you need to add a new tab to the Uploader with custom functionality.

```jsx
import Uploader from '@blocklet/uploader';
import { VirtualPlugin } from '@blocklet/uploader/plugins';

function MyComponent() {
  return (
    <Uploader
      plugins={[
        [VirtualPlugin, { id: 'my-custom-plugin', title: 'Custom Tab' }],
        // ... other plugins
      ]}
      // You would add custom logic here to interact with 'my-custom-plugin'
    />
  );
}
```

---

## SafariPastePlugin

`SafariPastePlugin` is a small, internal utility plugin that addresses a browser-specific issue where the standard paste functionality does not work reliably in Safari. It ensures that users can paste files from their clipboard into the uploader on Safari. It is enabled by default and requires no configuration.