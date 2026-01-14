# Overview

The Blocklet Uploader is a comprehensive file upload solution designed for blocklets, built upon the robust and extensible [Uppy](https://uppy.io/) file uploader. It consists of two primary packages that work together to provide a seamless experience, from the user interface in the browser to file processing on the server.

<x-cards>
  <x-card data-title="@blocklet/uploader (Frontend)" data-icon="lucide:upload-cloud" data-href="/getting-started/frontend-setup">
    A React component that provides a rich, pluggable user interface for file selection and upload progress.
  </x-card>
  <x-card data-title="@blocklet/uploader-server (Backend)" data-icon="lucide:server" data-href="/getting-started/backend-setup">
    Express middleware to handle file storage, processing, and integration with remote sources like Unsplash.
  </x-card>
</x-cards>

## How It Works

The standard workflow involves the user interacting with the `@blocklet/uploader` component in your application's frontend. This component then communicates with a backend endpoint, powered by `@blocklet/uploader-server`, which handles the actual file storage and processing.

It's important to note that `@blocklet/uploader` can function without a custom backend if a Media Kit blocklet is present, as it provides default upload handling. You only need to install and configure `@blocklet/uploader-server` when you require custom server-side logic, such as saving file metadata to a specific database after an upload completes.

```d2 Basic Upload Flow
direction: down

User: { 
  shape: c4-person 
}

App: {
  label: "Your Blocklet Application"
  shape: rectangle

  Uploader-Component: {
    label: "@blocklet/uploader\n(Frontend Component)"
    shape: rectangle
  }

  Backend-Server: {
    label: "Backend Server"
    shape: rectangle

    Uploader-Server: {
      label: "@blocklet/uploader-server\n(Middleware)"
    }

    DB: {
      label: "Database"
      shape: cylinder
    }
  }
}

User -> App.Uploader-Component: "1. Drop file"
App.Uploader-Component -> App.Backend-Server.Uploader-Server: "2. Upload file"
App.Backend-Server.Uploader-Server -> App.Backend-Server.Uploader-Server: "3. Trigger onUploadFinish hook"
App.Backend-Server.Uploader-Server -> App.Backend-Server.DB: "4. Save metadata"
App.Backend-Server.DB -> App.Backend-Server.Uploader-Server: "5. Return DB record"
App.Backend-Server.Uploader-Server -> App.Uploader-Component: "6. Send JSON response (URL)"
App.Uploader-Component -> App.Uploader-Component: "7. Trigger onUploadFinish hook"
App.Uploader-Component -> User: "8. Update UI"
```

## Key Features

*   **Powered by Uppy**: Leverages a mature, battle-tested core for reliable uploads.
*   **Flexible Architecture**: Decoupled frontend and backend packages allow for independent use and customization.
*   **Rich Plugin System**: Supports standard Uppy plugins like `ImageEditor`, `Webcam`, and `Url`, plus custom blocklet-specific plugins.
*   **Remote Source Integration**: Easily enable users to import files from external sources like Unsplash using the Companion middleware.
*   **Customizable Hooks**: Provides `onUploadFinish` callbacks on both the client and server, giving you full control over post-upload processing.
*   **Automatic Media Kit Integration**: Seamlessly detects and configures itself when a Media Kit blocklet is available.

Ready to start? Let's get the uploader integrated into your blocklet.

<x-card data-title="Getting Started" data-icon="lucide:rocket" data-href="/getting-started" data-cta="Start the Guide">
  Follow our step-by-step guides to set up both the frontend component and backend server in your application.
</x-card>