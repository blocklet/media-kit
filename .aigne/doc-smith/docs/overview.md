# Overview

The Blocklet Uploader is a set of packages designed to provide a complete file upload solution for your blocklets. It is built on top of [Uppy](https://uppy.io/docs/quick-start/), a popular and versatile open-source file uploader, offering a rich user experience and robust backend handling.

The solution is split into two main packages:

-   **`@blocklet/uploader`**: A frontend React component that provides the user interface for file selection and uploading.
-   **`@blocklet/uploader-server`**: A backend middleware for Express.js that handles the server-side logic of receiving and storing files.

This separation allows for flexibility, letting you use the frontend component with any backend, or the server middleware with any frontend.

### High-Level Architecture

The following diagram illustrates how the frontend and backend packages typically interact within a blocklet:

```d2
direction: down

"User-Browser": {
  label: "User's Browser"
  shape: rectangle

  "React-App": {
    label: "Your React App"
    shape: rectangle

    "Uploader-Component": {
      label: "@blocklet/uploader"
      shape: package
    }
  }
}

"Blocklet-Server": {
  label: "Your Blocklet Server"
  shape: rectangle

  "Express-App": {
    label: "Your Express App"
    shape: rectangle

    "Uploader-Middleware": {
      label: "@blocklet/uploader-server"
      shape: package
    }
  }
}

"File-System": {
  label: "Storage\n(e.g., File System)"
  shape: cylinder
}

User-Browser.React-App.Uploader-Component -> Blocklet-Server.Express-App.Uploader-Middleware: "HTTP POST Request\n(File Upload)"
Blocklet-Server.Express-App.Uploader-Middleware -> "File-System": "Saves File"
```

### The Packages

<x-cards>
  <x-card data-title="@blocklet/uploader" data-icon="lucide:upload-cloud">
    The frontend package provides a customizable React component for a seamless user experience. It handles file selection, previews, progress tracking, and comes with a variety of plugins.
  </x-card>
  <x-card data-title="@blocklet/uploader-server" data-icon="lucide:server">
    The backend package provides Express.js middleware to handle file uploads. It simplifies saving files to local storage and includes Companion for importing files from remote sources like URLs or Unsplash.
  </x-card>
</x-cards>

### Key Features

-   **Decoupled by Design**: `@blocklet/uploader` does not strictly depend on `@blocklet/uploader-server`. You can use the frontend component with any custom backend that can handle multipart/form-data requests.
-   **Extensible with Plugins**: Enhance the user interface with Uppy plugins like `ImageEditor`, `Webcam`, and `Url` to allow users to edit images or import files from various sources.
-   **Server-Side Customization**: The `@blocklet/uploader-server` middleware provides an `onUploadFinish` callback, giving you full control to process file metadata and save it to a database after an upload completes.
-   **Remote File Sources**: With the `Companion` middleware, you can enable users to import files directly from URLs or cloud services, which are then processed through your server.

### Next Steps

To start integrating the uploader into your application, proceed to the **Getting Started** guide.

<x-card data-title="Getting Started" data-icon="lucide:arrow-right" data-href="/getting-started" data-cta="Read More">
  Follow the setup guides to install and configure both the frontend component and backend middleware in your blocklet.
</x-card>
