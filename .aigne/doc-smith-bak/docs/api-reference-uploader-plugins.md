# Available Plugins

`@blocklet/uploader` extends the core Uppy library with several powerful, custom-built plugins. These plugins integrate seamlessly with the Blocklet ecosystem, particularly the Media Kit, to provide features like AI image generation, browsing previously uploaded files, and accessing shared resources. Most of these plugins are enabled automatically when you use the `<Uploader />` component and a properly configured backend is available.

This document provides a reference for the custom plugins included in the package.

## Acquirer Plugins (UI Tabs)

These plugins appear as tabs in the Uploader dashboard, providing different ways for users to select or create files.

### Uploaded

The `Uploaded` plugin provides a tab where users can browse, search, and select from files that have been previously uploaded to the Media Kit. It's an essential tool for reusing existing assets without needing to re-upload them.

**Key Features:**

- **Infinite Scrolling:** Lazily loads files from the server as the user scrolls, ensuring efficient performance even with large libraries.
- **Rich Previews:** Renders previews for images, videos, and PDFs directly in the grid view.
- **Quick Upload:** Includes a dedicated "add" button to quickly switch back to the "My Device" tab for new uploads.

**Usage**

This plugin is enabled by default when the Uploader detects an active Media Kit. You can customize its title or pass additional parameters to the backend API via `uploaderOptions`.

```javascript uploaderOptions.js icon=logos:javascript
<Uploader
  uploaderOptions={{
    plugins: {
      Uploaded: {
        title: 'My Media Library', // Change the tab title
        params: { customParam: 'value' } // Pass custom query params to the API
      }
    }
  }}
/>
```

### Resources

The `Resources` plugin allows users to select from a curated list of static assets. These assets can be provided by other blocklets or defined by your application's backend, making it easy to share common files like logos, icons, or document templates.

**Key Features:**

- **Component Filtering:** If multiple resource sources (components) are available, they are displayed as filter buttons, allowing users to switch between different asset collections.
- **Grid View:** Presents resources in a clean, easy-to-navigate grid.

**Usage**

This plugin becomes active when the backend is configured to serve resources. You can customize its title in the Uploader options.

```javascript uploaderOptions.js icon=logos:javascript
<Uploader
  uploaderOptions={{
    plugins: {
      Resources: {
        title: 'Shared Assets' // Change the tab title
      }
    }
  }}
/>
```

### AI Image

Integrate generative AI directly into your upload workflow. The `AI Image` plugin provides a dedicated interface for users to generate images from text prompts using various AI models configured on the backend.

**Key Features:**

- **Prompt Interface:** A user-friendly panel for writing prompts and selecting models.
- **Model Filtering:** Automatically filters the available AI models based on the `window.blocklet.preferences.supportModels` setting, ensuring users only see relevant options.
- **Image Gallery:** Displays generated images for selection and import into the Uploader.

**Usage**

This plugin is available when the Media Kit is configured with AI image generation capabilities.

```javascript uploaderOptions.js icon=logos:javascript
<Uploader
  uploaderOptions={{
    plugins: {
      AIImage: {
        title: 'Create with AI' // Change the tab title
      }
    }
  }}
/>
```

## Utility and Background Plugins

These plugins operate in the background to enhance functionality, security, and reliability. They do not have a visible UI tab in the dashboard.

### PrepareUpload (Internal Plugin)

This is a crucial background plugin that runs automatically for every file added to the Uploader. It performs essential pre-processing tasks before the upload begins to ensure files are safe, correctly formatted, and optimized.

| Feature | Description |
|---|---|
| **XSS Prevention** | Sanitizes SVG files and filenames to remove potentially malicious scripts, protecting your application from cross-site scripting attacks. |
| **Zip Bomb Prevention** | Inspects compressed files (`.zip`, `.gz`) to ensure they don't contain decompression bombs that could exhaust server resources. |
| **Image Orientation** | Automatically corrects the orientation of images based on EXIF metadata, preventing sideways or upside-down photos. |
| **Remote File Handling** | Downloads files from remote sources (like Unsplash or a URL via Companion) into the browser so they can be processed and uploaded like local files. |
| **Hash Filename** | Generates a unique filename based on a hash of the file's content, which helps with caching and preventing naming conflicts. |
| **Image Validation** | Can be configured to enforce aspect ratios, automatically opening the Image Editor if a file doesn't match the required dimensions. |

**Usage**

The `PrepareUpload` plugin is enabled by default. While it typically doesn't need to be configured, you can pass options to it, such as `cropperOptions`, to enforce a specific aspect ratio for all uploaded images.

```javascript uploaderOptions.js icon=logos:javascript
<Uploader
  uploaderOptions={{
    plugins: {
      PrepareUpload: {
        cropperOptions: {
          aspectRatio: 16 / 9
        }
      }
    }
  }}
/>
```

### SafariPastePlugin

This is a small utility plugin that addresses a specific browser compatibility issue. It ensures that pasting files into the Uploader dashboard works correctly in Safari, which handles paste events differently from other browsers. The plugin is enabled by default and requires no configuration.

### VirtualPlugin

`VirtualPlugin` is not a feature plugin but a base class for developers. It simplifies the process of creating your own custom acquirer (a new tab in the dashboard) without needing to write a full Uppy UI plugin from scratch.

<x-card data-title="Creating a Custom Plugin" data-icon="lucide:puzzle" data-href="/guides/custom-plugin" data-cta="View Guide">
  For detailed instructions on how to build your own tab, please refer to our dedicated guide.
</x-card>