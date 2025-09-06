# Available Plugins

The `@blocklet/uploader` package includes several custom-built Uppy plugins that provide enhanced functionality beyond the standard set. These plugins are designed to integrate seamlessly with backend services, particularly those provided by a Media Kit blocklet, to offer features like browsing previously uploaded files, accessing shared resources, and generating images with AI.

This section provides a reference for each available custom plugin.

## Uploaded

The `Uploaded` plugin adds a tab to the Uploader dashboard that allows users to browse and select from files they have previously uploaded. It's particularly useful in a Media Kit context where users frequently reuse assets.

### Features

- **Browse Previous Uploads**: Displays a paginated grid of files fetched from the backend `/api/uploads` endpoint.
- **Infinite Scrolling**: Automatically loads more files as the user scrolls down the list.
- **Rich Previews**: Renders previews for images, videos, and PDFs directly in the browser grid.
- **Quick Upload**: Includes a prominent "Add" button that switches to the `My Device` plugin, allowing users to upload new files without leaving the flow.
- **File Selection**: Users can select one or more existing files to be used in the application, which are then passed to the `onUploadFinish` callback.

### Usage

To enable this plugin, simply include `'Uploaded'` in the `plugins` array prop of the `Uploader` component. It's recommended to also include `'My Device'` to allow for new uploads.

```jsx
import Uploader from '@blocklet/uploader';

function MyComponent() {
  return <Uploader plugins={['Uploaded', 'My Device']} />;
}
```

## Resources

The `Resources` plugin provides a way to browse and select from a curated collection of static assets. This is ideal for scenarios where you want to provide users with a library of approved images, icons, or documents.

### Features

- **Categorized Assets**: Fetches and displays resource categories from the `/api/resources` endpoint.
- **Category Filtering**: Renders buttons for each category, allowing users to filter the displayed assets.
- **Grid View**: Shows a grid of available resources for the selected category.

### Usage

Enable the `Resources` plugin by adding its name to the `plugins` array.

```jsx
import Uploader from '@blocklet/uploader';

function MyComponent() {
  return <Uploader plugins={['Resources', 'My Device']} />;
}
```

## AI Image

The `AIImage` plugin integrates AI-powered image generation directly into the Uploader. Users can enter a text prompt, generate images, and add the result to their upload queue.

### Features

- **Model Selection**: Fetches a list of available AI image generation models from the `/api/image/models` endpoint.
- **Prompt Interface**: Provides a user-friendly UI for writing prompts, selecting models, and configuring generation parameters.
- **Image Generation & Display**: Shows the generated images in an output panel.
- **Seamless Integration**: Users can select a generated image, which is then added to the Uppy instance just like any other file, ready for upload.
- **Responsive Design**: The UI adapts for both mobile and desktop views.

### Usage

Add `'AIImage'` to the `plugins` array to activate the AI image generation tab.

```jsx
import Uploader from '@blocklet/uploader';

function MyComponent() {
  return <Uploader plugins={['AIImage', 'My Device']} />;
}
```

## PrepareUpload

This is a crucial, non-visual plugin that operates in the background to process files before they are uploaded. It is enabled by default and does not require any configuration. Its primary role is to ensure security, consistency, and reliability.

### Key Pre-processing Steps

- **Security Sanitization**: It automatically sanitizes SVG files and filenames to prevent XSS (Cross-Site Scripting) attacks.
- **Zip Bomb Prevention**: It inspects compressed files (like `.zip`, `.gz`) to detect and prevent zip bomb attacks by checking the compression ratio.
- **Remote File Handling**: When a user imports a file from a URL, this plugin downloads it into the browser first, converting it into a local blob that can be processed and uploaded securely.
- **Image Orientation Correction**: Automatically reads EXIF data from images and rotates them to the correct orientation before upload.
- **Aspect Ratio Enforcement**: If you have configured the `ImageEditor` plugin with a specific aspect ratio, this plugin will automatically open the editor to force a crop if a user uploads an image with a different ratio.

## VirtualPlugin

`VirtualPlugin` is not a user-facing feature but a powerful utility for developers. It allows you to create your own custom tabs within the Uploader dashboard with minimal boilerplate. You provide the metadata (ID, title, icon), and the Uploader handles the rest, giving you a blank panel to render your own React components.

This is the foundation for building custom integrations or workflows directly into the Uploader.

For a detailed guide on how to use it, see the [Creating a Custom Plugin](./guides-custom-plugin.md) guide.

## SafariPastePlugin

This is a small, background plugin that is enabled by default to fix a browser-specific issue. It ensures that users can correctly paste files (e.g., images from their clipboard) into the Uploader when using the Safari browser, where this functionality can be inconsistent. It requires no configuration.