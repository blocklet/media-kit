# Getting Started

This guide will walk you through the essential steps to integrate a powerful file uploader into your blocklet. We'll cover both the frontend UI component and the optional backend server setup to get you up and running quickly.

The solution is split into two primary packages:

- **`@blocklet/uploader`**: A React component that provides a rich user interface for uploading files.
- **`@blocklet/uploader-server`**: An Express middleware for your blocklet's backend to handle file storage and processing.

It's important to note that `@blocklet/uploader` can work independently, especially when integrated with a Media Kit blocklet which provides the necessary backend endpoints. You only need to use `@blocklet/uploader-server` if you want to implement your own custom upload logic on your server.

```d2
direction: down

user: {
  shape: c4-person
  label: "Developer"
}

blocklet: {
  label: "Your Blocklet"
  shape: rectangle

  frontend: {
    label: "Frontend (React)"
    shape: rectangle
    blocklet-uploader: {
      label: "@blocklet/uploader"
    }
  }

  backend: {
    label: "Backend (Express)"
    shape: rectangle
    blocklet-uploader-server: {
      label: "@blocklet/uploader-server"
    }
  }
}

user -> blocklet.frontend.blocklet-uploader: "Integrates Component"
user -> blocklet.backend.blocklet-uploader-server: "Integrates Middleware"
blocklet.frontend -> blocklet.backend: "Uploads Files"
```

To begin, choose the setup guide that matches your needs. We recommend starting with the frontend setup.

<x-cards data-columns="2">
  <x-card data-title="Frontend Setup (@blocklet/uploader)" data-icon="lucide:layout-template" data-href="/getting-started/frontend-setup">
    A step-by-step guide to installing and rendering the basic frontend uploader component in your React application.
  </x-card>
  <x-card data-title="Backend Setup (@blocklet/uploader-server)" data-icon="lucide:server" data-href="/getting-started/backend-setup">
    Learn how to install and configure the necessary backend middleware in your Express-based blocklet to handle file uploads.
  </x-card>
</x-cards>

After completing these guides, you will have a fully functional file uploader. To explore more advanced features, such as customizing plugins or handling upload callbacks, proceed to the [Guides](./guides.md) section.