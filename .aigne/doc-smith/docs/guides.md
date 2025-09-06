# Guides

Welcome to the Guides section. Here, you'll find practical, task-oriented tutorials designed to help you implement common features and customizations for the Uploader. These guides assume you've already completed the [Getting Started](./getting-started.md) section and have a basic setup running.

Each guide provides step-by-step instructions to help you solve a specific problem, from configuring built-in features to extending the uploader with your own custom logic.

<x-cards data-columns="2">
  <x-card data-title="Configuring Plugins" data-href="/guides/configuring-plugins" data-icon="lucide:settings-2">
    Learn how to enable, disable, and pass custom options to Uppy plugins like the Image Editor, Webcam, and URL importer.
  </x-card>
  <x-card data-title="Handling Uploads" data-href="/guides/handling-uploads" data-icon="lucide:upload-cloud">
    Implement callbacks on both the frontend and backend to process files after a successful upload and access their metadata.
  </x-card>
  <x-card data-title="Integrating Remote Sources" data-href="/guides/remote-sources" data-icon="lucide:cloud">
    Set up the Companion middleware on your backend to allow users to import files from remote sources like Unsplash and direct URLs.
  </x-card>
  <x-card data-title="Creating a Custom Plugin" data-href="/guides/custom-plugin" data-icon="lucide:box">
    Extend the Uploader's functionality by creating your own custom plugin tab using the provided VirtualPlugin component.
  </x-card>
</x-cards>

By following these guides, you can tailor the uploader's functionality to perfectly match your application's needs. Once you're comfortable with these common workflows, you might want to explore the detailed [API Reference](./api-reference.md) for a comprehensive breakdown of all available components, props, and functions.