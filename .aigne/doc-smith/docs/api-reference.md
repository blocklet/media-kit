# API Reference

This section provides a complete reference for all the modules, functions, components, and configuration options available in the `@blocklet/uploader` and `@blocklet/uploader-server` packages. Whether you are customizing the frontend UI or configuring the backend handlers, you will find the detailed information you need here.

The API is divided into two main packages: one for the frontend client and one for the backend server. The following diagram illustrates how they interact:

```d2
direction: right

"Browser": {
  "@blocklet/uploader": {
    shape: package
    label: "@blocklet/uploader\n(React Components & Hooks)"
  }
}

"Blocklet Server": {
  "@blocklet/uploader-server": {
    shape: package
    label: "@blocklet/uploader-server\n(Express Middleware)"
  }
}

"Storage": {
  shape: cylinder
  label: "File Storage\n(e.g., Media Kit)"
}

"Browser" -> "Blocklet Server": "File Upload Request (Tus protocol)" {
  style.animated: true
}
"Blocklet Server" -> "Storage": "Saves file"
```

Select a package below to dive into its specific API documentation.

<x-cards>
  <x-card data-title="Frontend: @blocklet/uploader" data-icon="lucide:component" data-href="/api-reference/uploader">
    Explore the props for the `&lt;Uploader /&gt;` component, learn how to use the `UploaderProvider` and associated hooks for programmatic control, and see the available plugins.
  </x-card>
  <x-card data-title="Backend: @blocklet/uploader-server" data-icon="lucide:server" data-href="/api-reference/uploader-server">
    Reference for all server-side middleware. Find detailed options for configuring local storage, setting up Companion for remote sources, and serving static or dynamic resources.
  </x-card>
</x-cards>

---

If you first want to understand the underlying principles of how these packages work together, you may find the [Concepts](./concepts.md) section helpful.