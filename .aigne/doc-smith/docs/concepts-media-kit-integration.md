# Integration with Media Kit

The `@blocklet/uploader` package is designed for deep, seamless integration with the Media Kit blocklet. When the Media Kit is present in the same environment, the uploader automatically enhances its functionality by centralizing configuration and enabling powerful new features. This integration provides a consistent and feature-rich file management experience across all your blocklets.

## Automatic Detection and Configuration

The uploader's core mechanism is its ability to automatically detect the presence of the Media Kit blocklet (identified by its DID: `z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9`). Upon detection, it establishes communication to fetch configurations and enable additional plugins.

This process ensures that all blocklets using the uploader adhere to the same set of rules for file uploads, which are centrally managed within the Media Kit.

```d2
direction: down

User-App: {
  label: "Your Blocklet"
  shape: package

  Uploader-Component: {
    label: "<Uploader />"
    shape: rectangle
  }
}

Media-Kit: {
  label: "Media Kit Blocklet"
  shape: package
  grid-columns: 1

  Central-Config: {
    label: "Central Configuration"
    shape: stored_data
    grid-columns: 2

    Restrictions: {
      label: "Upload Restrictions\n(file size, types)"
    }
    Available-Plugins: {
      label: "Available Plugins\n(AI Image, Resources)"
    }
  }

  API-Endpoints: {
    label: "API Endpoints"
    shape: cloud
    grid-columns: 2

    Uploader-Status: {
      label: "/api/uploader/status"
    }

    Uploads: {
      label: "/api/uploads"
    }
  }
}


User-App.Uploader-Component -> Media-Kit: "1. Detects presence via getMediaKitComponent()"
User-App.Uploader-Component -> Media-Kit.API-Endpoints.Uploader-Status: "2. Fetches configuration"
Media-Kit.API-Endpoints.Uploader-Status -> Media-Kit.Central-Config: "Reads config"
Media-Kit.API-Endpoints.Uploader-Status -> User-App.Uploader-Component: "3. Returns restrictions & available plugins"
User-App.Uploader-Component -> Media-Kit.API-Endpoints.Uploads: "4. Routes all file uploads"

```

## Enhanced Features

When integrated with the Media Kit, the uploader gains access to several advanced features:

### Centralized Upload Restrictions
Instead of configuring each uploader instance individually, you can manage upload rules like `maxFileSize` and `allowedFileTypes` directly within the Media Kit. The uploader component automatically fetches and applies these settings.

### Additional Plugins
The following plugins become available automatically if they are enabled in the Media Kit:

- **Uploaded**: Allows users to browse and select files that have already been uploaded to the Media Kit, promoting file reuse and reducing storage redundancy.
- **Resources**: Provides access to files from other connected resource blocklets, creating a unified asset library.
- **AI Image**: Integrates with the Media Kit's AI capabilities to generate images directly within the uploader interface.

### Unified API Endpoints
All API requests, including file uploads (Tus protocol) and companion requests (for URL or Unsplash imports), are automatically routed to the Media Kit's mount point. This centralizes file processing and storage logic.

## How It Works

The integration is powered by a check performed during the `Uploader` component's initialization. The component uses the `getMediaKitComponent()` utility to see if the Media Kit is installed.

If it is found, a request is made to the Media Kit's `/api/uploader/status` endpoint to retrieve the shared configuration.

```typescript
// A simplified look at the logic inside the Uploader component

// ...
// check if the media-kit is installed
if (!apiPathProps.disableMediaKitStatus && getMediaKitComponent()) {
  try {
    // mediaKitApi is pre-configured to point to the Media Kit's mount point
    await mediaKitApi.get('/api/uploader/status').then(({ data }: any) => {
      // Set the available plugins based on the response
      state.availablePluginMap = data.availablePluginMap;

      // If restrictions are not provided locally, use the ones from Media Kit
      if (!apiPathProps.disableMediaKitPrefix && isNil(props?.coreProps?.restrictions)) {
        restrictions = data.restrictions || {};
      }
    });
    state.isError = false;
  } catch (error) {
    state.isError = true;
  }
}
// ...
```

## Disabling the Integration

While the automatic integration is beneficial for most use cases, you can disable it if you need to implement custom, standalone upload logic. This is done through the `apiPathProps` prop on the `<Uploader />` component.

- **`disableMediaKitStatus`**: Set to `true` to prevent the uploader from fetching configuration from the Media Kit.
- **`disableMediaKitPrefix`**: Set to `true` to stop the uploader from routing API requests to the Media Kit's endpoints, using the local blocklet's prefix instead.

**Example: Disabling Media Kit Integration**

```jsx
import Uploader from '@blocklet/uploader/react';

function MyStandaloneUploader() {
  return (
    <Uploader
      popup
      apiPathProps={{
        // Do not fetch status or config from Media Kit
        disableMediaKitStatus: true,
        // Do not use Media Kit's API endpoints
        disableMediaKitPrefix: true,
        // Define local endpoints instead
        uploader: '/api/my-uploads',
        companion: '/api/my-companion',
      }}
    />
  );
}
```

By leveraging the automatic integration with Media Kit, you can deliver a more robust and consistent file upload experience with minimal configuration. To learn more about extending the uploader's functionality, proceed to the [Creating a Custom Plugin](./guides-custom-plugin.md) guide.