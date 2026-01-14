# API 参考

欢迎查阅 Blocklet Uploader 包的 API 参考。本节为前端和后端库导出的所有组件、函数、props 和配置选项提供了全面的详细信息，是您获取深入技术信息的首选资源。

Uploader 分为两个主要包：

- **`@blocklet/uploader`**：一个灵活的 React 组件，用于您的应用程序前端。
- **`@blocklet/uploader-server`**：一组 Express 中间件，用于处理您后端的文件上传。

尽管这两个包被设计为可以无缝协同工作，但值得注意的是，`@blocklet/uploader` 可以与任何支持 Tus 可续传协议的后端一起使用。`@blocklet/uploader-server` 为在 Blocklet 中处理上传逻辑提供了一个功能强大且预先配置好的解决方案，但其使用是可选的。

```d2
direction: down

your-blocklet-app: {
  label: "你的 Blocklet 应用"
  shape: rectangle

  frontend: {
    label: "前端 (React)"
    shape: rectangle
  }

  backend: {
    label: "后端 (Express)"
    shape: rectangle
  }
}

uploader: {
  label: "@blocklet/uploader"
  shape: rectangle
  style.fill: "#E6F7FF"
}

uploader-server: {
  label: "@blocklet/uploader-server"
  shape: rectangle
  style.fill: "#F6FFED"
}

your-blocklet-app.frontend -> uploader: "导入 <Uploader /> 组件"
your-blocklet-app.backend -> uploader-server: "使用上传中间件"

```

选择下面的一个包，深入了解其详细的 API 文档。

<x-cards data-columns="2">
  <x-card data-title="前端：@blocklet/uploader" data-icon="lucide:component" data-href="/api-reference/uploader">
    探索前端 React 包中可用的 props、组件、钩子和实用函数，以创建丰富的文件上传体验。
  </x-card>
  <x-card data-title="后端：@blocklet/uploader-server" data-icon="lucide:server" data-href="/api-reference/uploader-server">
    所有用于处理文件存储、通过 Companion 处理远程源以及提供静态或动态资源的服务器端中间件函数的详细参考。
  </x-card>
</x-cards>

如果您想更深入地了解这些包的构建方式以及它们如何与其他系统集成，请参阅我们的[概念](./concepts.md)部分。