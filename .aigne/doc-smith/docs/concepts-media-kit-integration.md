# Integration with Media Kit

The `@blocklet/uploader` package is designed for seamless, zero-configuration integration with the **Media Kit** blocklet. Media Kit provides a centralized service for media storage, management, and processing. When the Uploader component detects that Media Kit is installed in the same environment, it automatically enhances its functionality without requiring any extra setup from the developer.

This automatic integration centralizes file storage, enforces consistent upload rules across all your blocklets, and dynamically enables advanced features like AI Image Generation. While this behavior is enabled by default for a streamlined experience, you can also opt-out if you need to handle uploads within your own blocklet's backend.

## How It Works: Automatic Detection and Configuration

The integration process is fully automated and follows a simple two-step process upon component initialization:

1.  **Detection**: The `Uploader` component scans the environment for any installed blocklet with the unique DID of Media Kit (`z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9`).

2.  **Configuration**: If Media Kit is found, the Uploader makes an API request to its `/api/uploader/status` endpoint. This endpoint returns a configuration object containing:
    *   **Upload Restrictions**: Global rules such as `maxFileSize` and `allowedFileTypes` that are centrally managed in the Media Kit.
    *   **Available Plugins**: A map of which advanced plugins (e.g., `AIImage`, `Resources`, `Uploaded`) are enabled and should be displayed in the Uploader UI.
    *   **API Endpoints**: The Uploader automatically configures itself to route all file uploads and related API calls to the Media Kit's services, ensuring all media is stored in one central location.

The following diagram illustrates this automatic configuration flow:

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
  shape: rectangle

  config-api: {
    label: "Config API\n(/api/uploader/status)"
  }

  upload-service: {
    label: "Upload Service\n(/api/uploads)"
  }

  storage: {
    label: "Centralized Storage"
    shape: cylinder
  }

  config-api -> storage
  upload-service -> storage
}

blocklet-app.uploader-component -> media-kit: "1. Detects presence via DID"
blocklet-app.uploader-component -> media-kit.config-api: "2. Fetches configuration\n(restrictions, plugins)"
media-kit.config-api -> blocklet-app.uploader-component: "3. Returns configuration"
blocklet-app.uploader-component -> media-kit.upload-service: "4. Forwards upload requests"
```

## Core Benefits

Integrating with Media Kit offers several powerful advantages with no additional development effort.

<x-cards data-columns="2">
  <x-card data-title="Centralized Media Management" data-icon="lucide:library">
    All uploaded files are stored and managed within the Media Kit, creating a single source of truth for media assets across multiple blocklets. The `Resources` and `Uploaded` plugins allow users to easily browse and reuse existing assets.
  </x-card>
  <x-card data-title="Dynamic Feature Plugins" data-icon="lucide:puzzle">
    Advanced features like the AI Image Generation plugin are enabled automatically if the capability is turned on in the Media Kit. This allows your application to gain new features without any code changes.
  </x-card>
  <x-card data-title="Consistent Upload Rules" data-icon="lucide:file-check-2">
    Upload restrictions are defined once in the Media Kit and automatically applied to every instance of the Uploader, ensuring consistency and simplifying policy management.
  </x-card>
  <x-card data-title="Zero Backend Setup" data-icon="lucide:server-off">
    Because Media Kit provides the necessary backend services for file processing and storage, you don't need to install or configure `@blocklet/uploader-server` in your own blocklet, reducing complexity.
  </x-card>
</x-cards>

## Opting Out: Disabling the Integration

In scenarios where you need to manage uploads using your own backend logic and storage (with `@blocklet/uploader-server`), you can disable the automatic integration with Media Kit. This is done by passing specific props to the `apiPathProps` object on the `Uploader` component.

-   `disableMediaKitStatus`: Set to `true` to prevent the Uploader from fetching configuration (restrictions and plugins) from the Media Kit.
-   `disableMediaKitPrefix`: Set to `true` to prevent the Uploader from routing API requests to the Media Kit's endpoints. Instead, it will use the prefix of the current blocklet.

```jsx Uploader with Media Kit Integration Disabled icon=logos:react
import { Uploader } from '@blocklet/uploader/react';

export default function MyComponent() {
  return (
    <Uploader
      popup
      apiPathProps={{
        // Prevents fetching remote config from Media Kit
        disableMediaKitStatus: true,
        // Prevents routing API calls to Media Kit
        disableMediaKitPrefix: true,
      }}
      // You would now need to provide your own restrictions
      // and configure your own backend with @blocklet/uploader-server.
      coreProps={{
        restrictions: {
          maxFileSize: 1024 * 1024 * 5, // 5MB
          allowedFileTypes: ['image/jpeg', 'image/png'],
        },
      }}
    />
  );
}
```

By setting these properties, the `Uploader` component will operate in a standalone mode, relying entirely on its own props and the backend services configured within your application. You can learn more about this in the [Backend Setup](./getting-started-backend-setup.md) guide.