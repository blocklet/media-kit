# Guides

Welcome to the Guides section. Here you'll find practical, task-oriented walkthroughs to help you implement common features and customizations for the uploader. These guides build on the concepts introduced in the [Getting Started](./getting-started.md) section, providing step-by-step instructions for real-world scenarios.

These guides cover both the frontend `@blocklet/uploader` component and optional backend customizations with `@blocklet/uploader-server`. Remember, the frontend component can work independently, while the backend package is used for adding custom server-side upload handling and enabling remote sources.

<x-cards data-columns="2">
  <x-card data-title="Configuring Plugins" data-icon="lucide:settings-2" data-href="/guides/configuring-plugins">
    Learn how to enable, disable, and pass custom options to Uppy plugins like the Image Editor, Webcam, and URL importer.
  </x-card>
  <x-card data-title="Handling Uploads" data-icon="lucide:upload-cloud" data-href="/guides/handling-uploads">
    Implement callbacks on both the frontend and backend to process files after a successful upload and access their metadata.
  </x-card>
  <x-card data-title="Integrating Remote Sources" data-icon="lucide:link" data-href="/guides/remote-sources">
    Set up the Companion middleware on your backend to allow users to import files from remote sources like Unsplash and direct URLs.
  </x-card>
  <x-card data-title="Creating a Custom Plugin" data-icon="lucide:puzzle" data-href="/guides/custom-plugin">
    Extend the Uploader's functionality by creating your own custom plugin tab using the provided VirtualPlugin component.
  </x-card>
</x-cards>

After working through these guides, you'll have a solid understanding of how to tailor the uploader to your specific needs. For more in-depth information, you can dive into the [API Reference](./api-reference.md).