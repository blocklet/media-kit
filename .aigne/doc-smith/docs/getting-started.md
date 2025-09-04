# Getting Started

This guide provides the essential steps to integrate file uploading capabilities into your blocklet. We'll cover the setup for both the frontend UI component and the backend server middleware, allowing you to have a fully functional uploader in minutes.

The solution is composed of two primary packages:

- **`@blocklet/uploader`**: A React component that provides the frontend user interface for file selection and uploading.
- **`@blocklet/uploader-server`**: An Express middleware for handling file storage and processing on the server side.

While they are designed to work together, `@blocklet/uploader` can be used with any compatible backend, such as a pre-existing Media Kit blocklet. You should use `@blocklet/uploader-server` when you need to implement custom server-side logic for handling uploads within your blocklet.

### Component Architecture

The following diagram illustrates how the frontend and backend packages interact. The `@blocklet/uploader` component in your React app sends the file to the `@blocklet/uploader-server` middleware running in your Express app, which then saves the file to storage.

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

To begin, choose the setup guide that matches your needs. We recommend starting with the frontend.

<x-cards data-columns="2">
  <x-card data-title="Frontend Setup (@blocklet/uploader)" data-icon="lucide:layout-template" data-href="/getting-started/frontend-setup">
    Learn how to install the @blocklet/uploader package and render the basic Uploader component in your React application.
  </x-card>
  <x-card data-title="Backend Setup (@blocklet/uploader-server)" data-icon="lucide:server" data-href="/getting-started/backend-setup">
    Follow this guide to set up the @blocklet/uploader-server middleware in your Express-based blocklet to handle incoming file uploads.
  </x-card>
</x-cards>

### Next Steps

After completing these setup guides, you will have a working file uploader. To explore more advanced features like configuring plugins, handling upload results, and integrating remote sources, please proceed to the [Guides](./guides.md) section.