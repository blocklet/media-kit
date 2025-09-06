# Integration with Media Kit

The `@blocklet/uploader` package is designed for seamless, zero-configuration integration with the **Media Kit** blocklet. When Media Kit is installed in the same environment as your application, the Uploader component automatically detects it and enhances its functionality. This integration centralizes file storage, enforces consistent upload policies, and unlocks powerful plugins without requiring any manual setup.

## How It Works: The Automatic Handshake

The integration process is fully automated. Here’s a step-by-step breakdown of what happens when the `Uploader` component initializes:

1.  **Detection**: The Uploader searches for an installed blocklet with the Media Kit's unique DID (`z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9`).
2.  **Configuration Fetch**: If Media Kit is found, the Uploader sends an API request to its `/api/uploader/status` endpoint.
3.  **Dynamic Setup**: Media Kit responds with a configuration object containing global upload restrictions (e.g., `maxFileSize`, `allowedFileTypes`) and a list of available plugins (`availablePluginMap`).
4.  **Self-Configuration**: The Uploader component uses this data to configure its own restrictions and dynamically enable the plugins provided by Media Kit.
5.  **API Routing**: All subsequent API calls, such as file uploads (via Tus) and requests for remote sources (via Companion), are automatically routed to the Media Kit's endpoints.

The following diagram illustrates this interaction:

```d2
direction: down

blocklet-app: {
  label: "Your Blocklet Application"
  shape: rectangle

  uploader-component: {
    label: "Uploader Component"
    shape: rectangle
  }
}

media-kit: {
  label: "Media Kit Blocklet"
  shape: cylinder
}

blocklet-app.uploader-component -> media-kit: "1. Detects presence via DID"
blocklet-app.uploader-component -> media-kit: "2. GET /api/uploader/status"
media-kit -> blocklet-app.uploader-component: "3. Responds with config\n(restrictions, available plugins)"
blocklet-app.uploader-component -> media-kit: "4. Routes all subsequent uploads"
```

## Key Benefits of Integration

### 1. Centralized Configuration

Instead of configuring upload rules in every blocklet, Media Kit acts as a single source of truth. It provides global settings for:

-   `maxFileSize`: The maximum size for a single file.
-   `maxNumberOfFiles`: The maximum number of files that can be uploaded at once.
-   `allowedFileTypes`: A list of allowed MIME types (e.g., `['image/jpeg', 'image/png', 'video/*']`).

The `Uploader` automatically adopts these settings, ensuring a consistent user experience and security policy across your entire application ecosystem. If you provide your own `restrictions` prop to the `Uploader` component, it will take precedence over the settings from Media Kit.

### 2. Shared Storage & Endpoints

By routing all uploads through Media Kit, you get a centralized repository for all your media assets. This simplifies file management, backups, and serving. The Uploader achieves this by automatically prefixing its API calls with the Media Kit's mount point, as determined by the `getUploaderEndpoint` and `setPrefixPath` utility functions.

### 3. Enhanced Plugin Availability

Media Kit can unlock advanced Uppy plugins for any connected `Uploader` instance. The Uploader checks the `availablePluginMap` from Media Kit's status response and enables the corresponding plugins.

<x-cards data-columns="2">
  <x-card data-title="AI Image" data-icon="lucide:bot">
    Allows users to generate images using AI models if the AI Kit is configured within Media Kit.
  </x-card>
  <x-card data-title="Uploaded" data-icon="lucide:files">
    Lets users browse and select from files that have already been uploaded to the Media Kit.
  </x-card>
  <x-card data-title="Resources" data-icon="lucide:library">
    Enables importing files from other resource-providing blocklets that are connected to Media Kit.
  </x-card>
  <x-card data-title="Unsplash" data-icon="lucide:camera">
    Provides an interface to search and import images directly from Unsplash (requires an API key configured in Media Kit).
  </x-card>
</x-cards>

### 4. Automatic Installation Prompt

If a feature relies on Media Kit but it isn't installed, the `ComponentInstaller` wrapper can prompt the user to install it directly from the Blocklet Store, ensuring a smooth user experience.

## Disabling the Integration

While the automatic integration is highly recommended, you can disable it if you need to implement custom, self-contained upload logic. This is done via the `apiPathProps` prop.

```jsx
<Uploader
  apiPathProps={{
    // Prevents the Uploader from fetching configuration from Media Kit.
    disableMediaKitStatus: true,
    // Prevents the Uploader from routing API calls through Media Kit's endpoints.
    disableMediaKitPrefix: true,
  }}
/>
```

-   `disableMediaKitStatus`: Set to `true` to prevent the Uploader from fetching its configuration from Media Kit. It will use its default settings or the props you provide.
-   `disableMediaKitPrefix`: Set to `true` to force the Uploader to use your application's own backend endpoints for uploads instead of Media Kit's.

---

By leveraging the automatic integration with Media Kit, you can significantly simplify development and provide a more robust and feature-rich file upload experience. For more details on configuration options, see the [`<Uploader />` Component Props](./api-reference-uploader-component-props.md) documentation.