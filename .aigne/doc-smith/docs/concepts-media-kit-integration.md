# Integration with Media Kit

The `@blocklet/uploader` package is designed for seamless, zero-configuration integration with the Media Kit blocklet. When a Media Kit is installed and running alongside your blocklet, the uploader automatically detects it to provide a centralized file management system, consistent upload policies, and access to enhanced features. This integration means that in most cases, you do not need to install or configure the `@blocklet/uploader-server` package in your own blocklet, as the Media Kit handles all backend logic.

## How It Works

The integration is automatic and relies on the following process:

1.  **Detection**: Upon initialization, the `Uploader` component queries the blocklet environment for a component matching the Media Kit's unique DID (`z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9`).

2.  **Configuration**: If the Media Kit is detected, the uploader reconfigures itself:
    *   **API Remapping**: It redirects all file upload and Companion API requests to the Media Kit's endpoints.
    *   **Policy Inheritance**: It fetches and applies file restrictions (e.g., max file size, allowed types) from the Media Kit's configuration.
    *   **Feature Enhancement**: It enables additional plugins like `Uploaded`, `Resources`, and `AIImage` that interface directly with the Media Kit's assets.

This diagram illustrates the conditional logic:

```d2
direction: down

"Uploader": {
  label: "Uploader Component\n(in Your Blocklet)"
  shape: package
  "1. Initialize"
}

"Check": {
  label: "Media Kit Detected?"
  shape: diamond
}

"LocalBackend": {
  label: "Local Backend\n(@blocklet/uploader-server)"
  "Handles uploads within your blocklet"
}

"MediaKit": {
  label: "Media Kit Blocklet"
  shape: cloud
  
  "Centralized API"
  "Shared Restrictions"
  "Enhanced Plugins"
}

"Uploader" -> "Check": "Checks environment"

"Check" -> "LocalBackend": {
  label: "No"
  style.stroke: "#F87171"
}

"Check" -> "MediaKit": {
  label: "Yes"
  style.stroke: "#4ADE80"
}

"Uploader" -> "MediaKit": {
  label: "Redirects uploads, fetches config & assets"
  style {
    stroke-dash: 2
  }
}
```

## Key Integration Features

When connected to a Media Kit, the uploader's capabilities are significantly expanded.

### Centralized Upload Handling

All file uploads are proxied to the Media Kit, which acts as a central repository. The uploader automatically determines the Media Kit's mount point and configures the Tus upload endpoint (`/api/uploads`) and Companion URL (`/api/companion`) to point to it. This means you don't need to set up `@blocklet/uploader-server` in your own blocklet if a Media Kit is available.

This behavior is managed internally by functions like `getMediaKitComponent` and `getUploaderEndpoint`.

```typescript
// packages/uploader/src/utils.ts

export const getMediaKitComponent = () =>
  // @ts-ignore
  window?.blocklet?.componentMountPoints?.find((item: any) => item.did === 'z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9');

export function getUploaderEndpoint(apiPathProps: any) {
  // ... determines the correct prefixPath based on Media Kit's presence
  const uploaderUrl = joinUrl(
    window.location.origin,
    prefixPath === '/' || apiPathProps.disableAutoPrefix ? '' : prefixPath,
    apiPathProps.uploader || ''
  );
  // ...
  return { uploaderUrl, companionUrl };
}
```

### Shared File Restrictions

The uploader fetches configuration from the Media Kit's `/api/uploader/status` endpoint. This includes file restrictions such as `maxFileSize` and `allowedFileTypes`, ensuring a consistent upload policy across all connected blocklets. You can still override these settings for a specific uploader instance by passing your own `restrictions` object to `coreProps`.

```jsx
// Example: Overriding Media Kit's restrictions
<Uploader
  coreProps={{
    restrictions: {
      maxFileSize: 1024 * 1024 * 5, // Override to 5MB
      allowedFileTypes: ['image/jpeg', 'image/png'],
    },
  }}
/>
```

### Additional Plugins

The integration unlocks powerful plugins that connect directly to the Media Kit's library.

<x-cards data-columns="3">
  <x-card data-title="Uploaded" data-icon="lucide:upload-cloud">
    Allows users to select from their previously uploaded files stored in the Media Kit.
  </x-card>
  <x-card data-title="Resources" data-icon="lucide:folder-search">
    Enables browsing and selecting assets from other resource blocklets that are connected to the Media Kit.
  </x-card>
  <x-card data-title="AI Image" data-icon="lucide:sparkles">
    Provides an interface for generating images using AI and saving them directly to the Media Kit.
  </x-card>
</x-cards>

These plugins are conditionally enabled based on the response from the Media Kit's status endpoint.

## Disabling the Integration

In scenarios where you must handle file uploads within your own blocklet's backend (using `@blocklet/uploader-server`), you can disable the automatic integration using `apiPathProps`.

| Prop | Type | Description |
|---|---|---|
| `apiPathProps.disableMediaKitStatus` | `boolean` | If `true`, the uploader will not request the status from the Media Kit, preventing it from inheriting restrictions and enabling extra plugins. |
| `apiPathProps.disableMediaKitPrefix` | `boolean` | If `true`, the uploader will not use the Media Kit's mount point for its API endpoints, directing uploads to the local blocklet's backend instead. |

**Example: Forcing local upload handling**

```jsx
<Uploader
  apiPathProps={{
    disableMediaKitStatus: true,
    disableMediaKitPrefix: true,
    uploader: '/api/local-uploads', // Your local endpoint
    companion: '/api/local-companion', // Your local endpoint
  }}
/>
```

This tight integration provides a centralized media management solution out of the box. To learn more about customizing the user interface, see the [Configuring Plugins](./guides-configuring-plugins.md) guide.