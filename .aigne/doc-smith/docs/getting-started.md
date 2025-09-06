# Getting Started

This guide will walk you through the essential steps to integrate a powerful file uploader into your blocklet. We'll cover both the frontend UI component and the backend server logic required for a complete setup.

The uploader functionality is split into two main packages:

- **`@blocklet/uploader`**: A flexible React component for the frontend.
- **`@blocklet/uploader-server`**: A middleware for handling uploads on your Express.js backend.

It's important to note that `@blocklet/uploader` can work independently with any compatible Uppy backend, such as the one provided by the Media Kit blocklet. You only need to use `@blocklet/uploader-server` if you want to implement your own custom file handling logic on the server.

### High-Level Flow

The diagram below illustrates the basic interaction between the user, the frontend component, and your backend server.

```d2
direction: down

User: {
  shape: c4-person
}

Blocklet-Application: {
  label: "Blocklet Application"
  shape: rectangle

  Uploader-Component: {
    label: "Frontend\n(@blocklet/uploader)"
    shape: rectangle
  }

  Uploader-Server: {
    label: "Backend\n(@blocklet/uploader-server)"
    shape: hexagon
  }
}

User -> Blocklet-Application.Uploader-Component: "1. Upload File"
Blocklet-Application.Uploader-Component -> Blocklet-Application.Uploader-Server: "2. HTTP Request"
Blocklet-Application.Uploader-Server -> Blocklet-Application.Uploader-Component: "3. JSON Response"
Blocklet-Application.Uploader-Component -> User: "4. Update UI"
```

Follow these guides to set up each part of the system:

<x-cards>
  <x-card data-title="Frontend Setup (@blocklet/uploader)" data-icon="lucide:layout-template" data-href="/getting-started/frontend-setup">
    A step-by-step guide to installing and rendering the basic frontend uploader component in your React application.
  </x-card>
  <x-card data-title="Backend Setup (@blocklet/uploader-server)" data-icon="lucide:server" data-href="/getting-started/backend-setup">
    Learn how to install and configure the necessary backend middleware in your Express-based blocklet to handle file uploads.
  </x-card>
</x-cards>

After completing these setup guides, you will have a fully functional file upload system. To explore more advanced features like plugin configuration and custom upload handling, please proceed to the [Guides](./guides.md) section.
