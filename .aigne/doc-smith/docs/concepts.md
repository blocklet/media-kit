# Concepts

The `@blocklet/uploader` packages are designed to be both powerful and easy to integrate. To get the most out of them, it's helpful to understand the core concepts and key integrations that power their functionality. This section explores the foundational technologies and design principles behind the uploader.

At its core, `@blocklet/uploader` is built upon a solid foundation of proven open-source technology, enhanced with seamless integrations into the Blocklet ecosystem. The following concepts are key to understanding how it all works together.

```d2 High-Level Architecture
direction: down

blocklet-app: {
  label: "Your Blocklet Application"
  shape: rectangle

  uploader-component: {
    label: "Uploader Component\n(@blocklet/uploader)"
    shape: rectangle

    uppy-ecosystem: {
      label: "Uppy Ecosystem"
      shape: rectangle

      uppy-core: {
        label: "Uppy Core Instance"
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

<x-cards data-columns="3">
  <x-card data-title="Integration with Uppy" data-icon="lucide:puzzle" data-href="/concepts/uppy-integration">
    Learn how @blocklet/uploader leverages the powerful, modular Uppy library for its core upload functionality, including its plugin architecture and resumable uploads.
  </x-card>
  <x-card data-title="Integration with Media Kit" data-icon="lucide:cloud" data-href="/concepts/media-kit-integration">
    Discover the 'zero-config' experience. When a Media Kit blocklet is present, the uploader automatically configures itself and gains powerful new plugins.
  </x-card>
  <x-card data-title="Internationalization (i18n)" data-icon="lucide:languages" data-href="/concepts/i18n">
    Understand how to customize the uploader's interface for different languages and regions using the built-in localization support.
  </x-card>
</x-cards>

Understanding these concepts will help you customize and extend the uploader to fit your specific needs. To dive deeper, start by exploring the [Integration with Uppy](./concepts-uppy-integration.md).