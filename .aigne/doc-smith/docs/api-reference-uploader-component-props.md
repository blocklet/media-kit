# <Uploader /> Component Props

The `<Uploader />` component is the primary interface for adding file upload capabilities to your application. It serves as a highly configurable wrapper around the popular [Uppy.io](https://uppy.io/) library, simplifying its integration within the Blocklet ecosystem.

This reference provides a comprehensive guide to all the props available for customizing the uploader's behavior, appearance, and functionality. For more advanced configurations, you may want to consult the official documentation for [Uppy Core Options](https://uppy.io/docs/uppy/#Options) and [Dashboard Options](https://uppy.io/docs/dashboard/#Options), as many of these can be passed through the `coreProps` and `dashboardProps` respectively.

## General Props

These props control the fundamental behavior and appearance of the Uploader component.

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | `'Uploader'` | A unique identifier for the Uppy instance. Important if you have multiple uploaders on the same page. |
| `popup` | `boolean` | `false` | If `true`, the uploader is rendered within a modal dialog. If `false`, it's rendered as an inline component. |
| `locale` | `string` | `'en'` | Sets the display language for the UI. See the [Internationalization (i18n)](./concepts-i18n.md) concept for more details. |
| `initialFiles` | `Array<object>` | `[]` | An array of file objects to pre-populate the uploader with. This is useful for editing scenarios where files have already been uploaded. |

## Event Handlers

Use these callback props to hook into the uploader's lifecycle and respond to user actions.

| Prop | Type | Description |
| :--- | :--- | :--- |
| `onOpen` | `() => void` | A callback function that is executed when the uploader modal is opened (only applies when `popup={true}`). |
| `onClose` | `() => void` | A callback function that is executed when the uploader modal is closed. |
| `onChange` | `(file: object, files: object[]) => void` | A callback function that fires whenever a file is added or removed. It receives the affected file and an array of all current files. |
| `onUploadFinish` | `(result: object) => void` | A callback function that is executed for each file after it has been successfully uploaded. The `result` object contains the final upload URL and other metadata. |
| `onAfterResponse` | `(response: object) => void` | A low-level callback that is executed after each HTTP response is received during the upload process (including Tus protocol requests). The `response` is the raw XHR object. |

## Plugin & Source Configuration

These props are used to configure the available upload sources and plugins.

| Prop | Type | Description |
| :--- | :--- | :--- |
| `plugins` | `Array<string \| object>` | Configures which Uppy plugins (upload sources) are enabled. See the [Configuring Plugins](./guides-configuring-plugins.md) guide for detailed usage. |
| `imageEditorProps` | `ImageEditorOptions` | An object of options passed directly to the `@uppy/image-editor` plugin. Allows customization of the image editor's features, such as crop ratios. |
| `uploadedProps` | `object` | Configures the custom 'Uploaded' plugin. Contains `params` for filtering and an `onSelectedFiles` callback to intercept file selection. |
| `resourcesProps` | `object` | Configures the custom 'Resources' plugin. Contains `params` for filtering and an `onSelectedFiles` callback. |
| `dropTargetProps` | `DropTargetOptions` | An object of options passed to the `@uppy/drop-target` plugin to configure the drag-and-drop behavior on the page. |

## Backend & API Configuration

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `apiPathProps` | `object` | `{ uploader: '/api/uploads', companion: '/api/companion' }` | An object to configure the backend endpoints for uploads and remote sources (Companion). See details below. |

### `apiPathProps` Details

This object configures the API endpoints that the frontend component will communicate with.

- `uploader`: The endpoint for direct file uploads (handled by `initLocalStorageServer`).
- `companion`: The endpoint for the Companion middleware, which handles remote sources like URL or Unsplash (handled by `initCompanion`).
- `disableMediaKitPrefix`: By default, paths are prefixed based on Media Kit's mount point. Set to `true` to disable this behavior.
- `disableAutoPrefix`: Disables all automatic prefixing.
- `disableMediaKitStatus`: By default, the uploader checks the `/api/uploader/status` endpoint of the Media Kit to get default restrictions (like max file size). Set to `true` to disable this check.

**Example:**

```jsx
<Uploader
  apiPathProps={{
    uploader: '/custom-api/tus-uploads',
    companion: '/custom-api/companion',
    disableMediaKitPrefix: true,
  }}
/>
```

## Uppy Passthrough Props

These props provide a direct way to pass configuration objects to the underlying Uppy instances, allowing for advanced customization.

| Prop | Type | Description |
| :--- | :--- | :--- |
| `coreProps` | `UppyOptions` | An object of options passed directly to the main Uppy instance. The most common use is for setting `restrictions`. See [Uppy Core Options](https://uppy.io/docs/uppy/#Options) for all possibilities. |
| `dashboardProps` | `DashboardOptions` | An object of options passed to the `@uppy/dashboard` plugin. Use this to customize the UI, such as adding a `note` or changing the `theme`. See [Uppy Dashboard Options](https://uppy.io/docs/dashboard/#Options) for details. |
| `tusProps` | `TusOptions` | An object of options passed to the `@uppy/tus` plugin, which handles resumable uploads. See [Uppy Tus Options](https://uppy.io/docs/tus/#Options) for advanced settings. |

### `coreProps.restrictions` Example

Setting upload restrictions is a common requirement. You can define them within the `coreProps` object.

```jsx
<Uploader
  coreProps={{
    restrictions: {
      maxFileSize: 5 * 1024 * 1024, // 5 MB
      maxNumberOfFiles: 10,
      allowedFileTypes: ['image/jpeg', 'image/png', 'video/*'], // Accepts JPG, PNG, and all video types
    },
  }}
/>
```

## Styling & Integration

| Prop | Type | Description |
| :--- | :--- | :--- |
| `wrapperProps` | `HTMLAttributes<HTMLDivElement>` | Standard HTML attributes (like `className`, `style`) and an `sx` prop for MUI styling, all applied to the main container div. |
| `installerProps` | `object` | Props passed to the `@blocklet/ui-react/lib/ComponentInstaller` component, which prompts the user to install the Media Kit if it's not detected. |

---

Now that you understand the available props, you can explore how to control the uploader programmatically. Continue to the next section to learn about the [`<UploaderProvider />` and Hooks](./api-reference-uploader-provider-hooks.md).