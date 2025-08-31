# Concepts

This section delves into the fundamental concepts and key integrations that form the foundation of the `@blocklet/uploader` packages. Understanding these principles will help you leverage the full potential of the uploader and customize it to your specific needs.

Below is a diagram illustrating the high-level architecture and how the different components interact.

```d2
direction: down

"User Application": {
  shape: rectangle
  style.fill: "#E4DBFE"
  "React UI": {
    "<Uploader />": {
      label: "@blocklet/uploader"
      style.fill: "#C7F1FF"
    }
  }
}

"@blocklet/uploader" -> "Uppy Ecosystem": {
  label: "Built upon"
  style.stroke-dash: 4
}

"Uppy Ecosystem": {
  shape: package
  style.fill: "#DEE1EB"
  "Uppy Core": ""
  "Uppy Plugins": "(Dashboard, Webcam, etc.)"
}

"<Uploader />" -> "Backend Server": {
  label: "Uploads files to"
  style.animated: true
}

"Backend Server": {
  shape: cylinder
  "@blocklet/uploader-server": ""
}

"<Uploader />" -> "Media Kit": {
  label: "Auto-integrates with"
  style.stroke-dash: 4
}

"Backend Server" -> "Media Kit": {
  label: "Uses storage & config from"
  style.stroke-dash: 4
}

"Media Kit": {
  shape: package
  style.fill: "#fce7c6"
  label: "Media Kit (Optional)"
  "Centralized Config": ""
  "Shared Storage": ""
  "Asset Management": ""
}
```

To provide a flexible and powerful file handling solution, `@blocklet/uploader` is designed around a few core ideas. Explore the following concepts to learn more.

<x-cards data-columns="3">
  <x-card data-title="Integration with Uppy" data-icon="lucide:puzzle" data-href="/concepts/uppy-integration">
    Learn how `@blocklet/uploader` is built on top of the robust and extensible Uppy file uploader, and what that means for customization and features.
  </x-card>
  <x-card data-title="Integration with Media Kit" data-icon="lucide:box-select" data-href="/concepts/media-kit-integration">
    Discover how the uploader automatically detects and configures itself when a Media Kit blocklet is present, enabling centralized asset management.
  </x-card>
  <x-card data-title="Internationalization (i18n)" data-icon="lucide:languages" data-href="/concepts/i18n">
    Find out how to support multiple languages in the uploader interface by simply changing the `locale` prop.
  </x-card>
</x-cards>