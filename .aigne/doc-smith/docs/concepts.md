# Concepts

The `@blocklet/uploader` packages are designed to provide a robust and flexible file uploading solution. To fully leverage their capabilities, it's helpful to understand the core technologies they are built upon and the key integrations that enhance their functionality. This section explores the foundational concepts behind the uploader.

Below is a high-level overview of the architecture, showing how the frontend and backend components interact within a Blocklet environment.

```d2
direction: down

"Your-React-App": {
  label: "Your React App"
  shape: rectangle

  uploader: {
    label: "@blocklet/uploader"
    shape: package

    "uppy-core": {
      label: "Wraps Uppy.io"
      shape: hexagon
    }
  }
}

"Backend": {
  shape: package

  "Your-Blocklet-Server": {
    label: "Your Blocklet Server"
    shape: rectangle

    "uploader-server": {
      label: "@blocklet/uploader-server"
      shape: package
    }
  }

  "Media-Kit": {
    label: "Media Kit (Optional)"
    shape: rectangle
    style: {
      stroke-dash: 4
    }
  }
}


"Your-React-App".uploader -> "Backend"."Your-Blocklet-Server"."uploader-server": "Uploads files to"
"Your-React-App".uploader -> "Backend"."Media-Kit": "Auto-detects for\nenhanced features"
```

Explore the following concepts to gain a deeper understanding of how the uploader works.

<x-cards data-columns="3">
  <x-card data-title="Integration with Uppy" data-icon="lucide:puzzle-piece" data-href="/concepts/uppy-integration">
    Learn how @blocklet/uploader is built on top of the Uppy ecosystem, a versatile open-source file uploader, and how you can leverage Uppy's extensive features.
  </x-card>
  <x-card data-title="Integration with Media Kit" data-icon="lucide:folder-kanban" data-href="/concepts/media-kit-integration">
    Understand how the uploader automatically detects and configures itself when a Media Kit blocklet is present, providing centralized storage and advanced features.
  </x-card>
  <x-card data-title="Internationalization (i18n)" data-icon="lucide:languages" data-href="/concepts/i18n">
    Discover how to customize text and support multiple languages in the uploader interface using the simple `locale` prop.
  </x-card>
</x-cards>

By understanding these core concepts, you can better customize the uploader's behavior, troubleshoot issues, and extend its functionality to meet your specific needs. Start by exploring the [Integration with Uppy](./concepts-uppy-integration.md) to see what powers the uploader under the hood.