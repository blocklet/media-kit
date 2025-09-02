# Getting Started

This guide provides the essential steps to integrate a file upload solution into your blocklet. The solution is composed of two primary packages, both built upon the robust and flexible [Uppy](https://uppy.io/docs/quick-start/) file uploader:

- **`@blocklet/uploader`**: A frontend React component that provides the user interface for uploads.
- **`@blocklet/uploader-server`**: An optional backend middleware for implementing custom file-handling logic on the server.

The `@blocklet/uploader` component is designed to work out-of-the-box and is the primary package you will need. It can be used independently and will automatically integrate with existing blocklet services (like a Media Kit) for storage. You only need to install and configure `@blocklet/uploader-server` if you need to implement custom backend logic, such as saving file metadata to a specific database or triggering custom workflows after an upload completes.

The diagram below illustrates these two integration paths.

```d2
direction: down

"browser.ui": "Uploader UI\n(@blocklet/uploader)" {
  shape: package
}

"backend.standard": "Standard Service\n(e.g., Media Kit)" {
  shape: component
}

"backend.custom": "Custom Backend\n(@blocklet/uploader-server)" {
  shape: package
  style.stroke-dash: 3
}

"storage": "Storage" {
  shape: cylinder
}

"browser.ui" -> "backend.standard": "Default Path (Recommended)"
"browser.ui" -> "backend.custom": "Optional Path (For custom logic)" {
  style.stroke-dash: 3
}

"backend.standard" -> "storage"
"backend.custom" -> "storage"
```

To begin, follow the guides below. All projects should start with the frontend setup.

<x-cards data-columns="2">
  <x-card data-title="Frontend Setup (@blocklet/uploader)" data-icon="lucide:layout-template" data-href="/getting-started/frontend-setup">
    Learn how to install and render the uploader component in your React application. This is the starting point for any integration.
  </x-card>
  <x-card data-title="Backend Setup (@blocklet/uploader-server)" data-icon="lucide:server-cog" data-href="/getting-started/backend-setup">
    Optionally, follow this guide to add custom server-side logic for processing uploads in your Express-based blocklet.
  </x-card>
</x-cards>

By completing the frontend setup, you will have a functional file uploader. If your needs are more complex, the backend setup guide will show you how to take full control of the upload process. Once the basics are working, you can explore more advanced configurations in the [Guides](./guides.md) section.