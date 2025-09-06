# Concepts

To effectively use and customize `@blocklet/uploader`, it's helpful to understand the core concepts and integrations that power it. This section provides a high-level overview of the key architectural principles behind the package, explaining how it leverages the Uppy ecosystem and seamlessly integrates with the Media Kit blocklet.

```d2
direction: down

blocklet-app: {
  label: "Your Blocklet Application"
  shape: rectangle

  uploader-component: {
    label: "Uploader Component"
    shape: rectangle

    uppy-ecosystem: {
      label: "Uppy Ecosystem"
      shape: rectangle
      grid-columns: 2

      uppy-core: {
        label: "Uppy Core Instance"
        shape: hexagon
      }

      standard-plugins: {
        label: "Standard Uppy Plugins"
        shape: rectangle
        Dashboard: {}
        Tus: {}
        Webcam: {}
        Url: {}
      }

      custom-plugins: {
        label: "Custom Blocklet Plugins"
        shape: rectangle
        AIImage: {}
        Resources: {}
        Uploaded: {}
      }
    }
  }
}

media-kit: {
  label: "Media Kit Blocklet"
  shape: cylinder
}

blocklet-app.uploader-component.uppy-ecosystem.uppy-core -> blocklet-app.uploader-component.uppy-ecosystem.standard-plugins
blocklet-app.uploader-component.uppy-ecosystem.uppy-core -> blocklet-app.uploader-component.uppy-ecosystem.custom-plugins
blocklet-app.uploader-component <-> media-kit: "Provides Config & Plugins"
```

<x-cards>
  <x-card data-title="Integration with Uppy" data-icon="lucide:puzzle" data-href="/concepts/uppy-integration">
    @blocklet/uploader is built upon the robust and extensible Uppy file uploader. It acts as a sophisticated wrapper, providing a seamless React component while unlocking Uppy's powerful plugin ecosystem.
  </x-card>
  <x-card data-title="Integration with Media Kit" data-icon="lucide:package-check" data-href="/concepts/media-kit-integration">
    The uploader features a zero-configuration integration with the Media Kit blocklet. When detected, it automatically inherits settings like file restrictions and enables advanced plugins like AI Image Generation.
  </x-card>
  <x-card data-title="Internationalization (i18n)" data-icon="lucide:languages" data-href="/concepts/i18n">
    Customize the uploader's interface for a global audience. The component includes built-in support for multiple languages, easily configured via the `locale` prop.
  </x-card>
</x-cards>

### Next Steps

With a solid grasp of these foundational concepts, you are well-equipped to tackle more advanced tasks. Explore our practical guides to see these concepts in action or dive into the API reference for detailed prop and function documentation.

<x-cards>
  <x-card data-title="Guides" data-icon="lucide:book-open" data-href="/guides">
    Follow step-by-step guides to implement common features and customizations.
  </x-card>
  <x-card data-title="API Reference" data-icon="lucide:code" data-href="/api-reference">
    Explore the full range of available props, components, and utility functions.
  </x-card>
</x-cards>