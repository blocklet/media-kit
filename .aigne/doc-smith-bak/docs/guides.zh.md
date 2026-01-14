# 指南

欢迎来到指南部分。在这里，您将找到实用的、面向任务的演练，以帮助您为上传器实现常见功能和自定义。这些指南建立在 [入门](./getting-started.md) 部分介绍的概念之上，为真实场景提供了分步说明。

这些指南涵盖了前端 `@blocklet/uploader` 组件以及使用 `@blocklet/uploader-server` 的可选后端自定义。请记住，前端组件可以独立工作，而后端包则用于添加自定义的服务器端上传处理并启用远程源。

<x-cards data-columns="2">
  <x-card data-title="配置插件" data-icon="lucide:settings-2" data-href="/guides/configuring-plugins">
    了解如何启用、禁用 Uppy 插件，并向其传递自定义选项，例如图像编辑器、网络摄像头和 URL 导入器。
  </x-card>
  <x-card data-title="处理上传" data-icon="lucide:upload-cloud" data-href="/guides/handling-uploads">
    在前端和后端实现回调，以便在成功上传后处理文件并访问其元数据。
  </x-card>
  <x-card data-title="集成远程源" data-icon="lucide:link" data-href="/guides/remote-sources">
    在后端设置 Companion 中间件，以允许用户从 Unsplash 和直接 URL 等远程源导入文件。
  </x-card>
  <x-card data-title="创建自定义插件" data-icon="lucide:puzzle" data-href="/guides/custom-plugin">
    使用提供的 VirtualPlugin 组件创建自己的自定义插件选项卡，以扩展上传器的功能。
  </x-card>
</x-cards>

完成这些指南后，您将对如何根据您的特定需求定制上传器有扎实的理解。如需更深入的信息，您可以查阅 [API 参考](./api-reference.md)。