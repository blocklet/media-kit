# Guides

This section provides practical, task-oriented guides to help you implement common features and customizations. These tutorials will walk you through various scenarios, whether you are using the `@blocklet/uploader` component with an existing service like the Media Kit, or building a custom upload handler with `@blocklet/uploader-server`.

It's important to note that `@blocklet/uploader` is a standalone frontend component and does not require `@blocklet/uploader-server`. The server package is intended for developers who need to implement their own backend file processing and storage logic.

<x-cards data-columns="2">
  <x-card data-title="Configuring Plugins" data-icon="lucide:settings-2" data-href="/guides/configuring-plugins">
    Learn how to enable, disable, and pass custom options to Uppy plugins like the Image Editor, Webcam, and URL importer.
  </x-card>
  <x-card data-title="Handling Uploads" data-icon="lucide:upload-cloud" data-href="/guides/handling-uploads">
    Implement callbacks on both the frontend and backend to process files after a successful upload and access their metadata.
  </x-card>
  <x-card data-title="Integrating Remote Sources (Companion)" data-icon="lucide:link" data-href="/guides/remote-sources">
    Set up the Companion middleware on your backend to allow users to import files from remote sources like Unsplash and direct URLs.
  </x-card>
  <x-card data-title="Creating a Custom Plugin" data-icon="lucide:puzzle" data-href="/guides/custom-plugin">
    Extend the Uploader's functionality by creating your own custom plugin tab using the provided VirtualPlugin component.
  </x-card>
</x-cards>

After exploring these guides, you might want to dive deeper into the available options and configurations. For detailed information on all components, props, and functions, please refer to our complete [API Reference](./api-reference.md).