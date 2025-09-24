# 概述

Blocklet Uploader 是一个专为 blocklets 设计的综合文件上传解决方案，它构建于强大且可扩展的 [Uppy](https://uppy.io/) 文件上传器之上。它由两个主要软件包组成，协同工作以提供从浏览器用户界面到服务器文件处理的无缝体验。

<x-cards>
  <x-card data-title="@blocklet/uploader (前端)" data-icon="lucide:upload-cloud" data-href="/getting-started/frontend-setup">
    一个 React 组件，为文件选择和上传进度提供丰富、可插拔的用户界面。
  </x-card>
  <x-card data-title="@blocklet/uploader-server (后端)" data-icon="lucide:server" data-href="/getting-started/backend-setup">
    用于处理文件存储、处理以及与 Unsplash 等远程源集成的 Express 中间件。
  </x-card>
</x-cards>

## 工作原理

标准工作流程涉及用户在应用程序前端与 `@blocklet/uploader` 组件进行交互。然后，该组件与由 `@blocklet/uploader-server` 提供支持的后端端点通信，后者负责处理实际的文件存储和处理。

需要注意的是，如果存在 Media Kit blocklet，`@blocklet/uploader` 可以在没有自定义后端的情况下运行，因为它提供了默认的上传处理。只有当您需要自定义服务器端逻辑时，例如在上传完成后将文件元数据保存到特定数据库，才需要安装和配置 `@blocklet/uploader-server`。

```d2 基本上传流程
direction: down

User: { 
  shape: c4-person 
}

App: {
  label: "你的 Blocklet 应用"
  shape: rectangle

  Uploader-Component: {
    label: "@blocklet/uploader\n(前端组件)"
    shape: rectangle
  }

  Backend-Server: {
    label: "后端服务器"
    shape: rectangle

    Uploader-Server: {
      label: "@blocklet/uploader-server\n(中间件)"
    }

    DB: {
      label: "数据库"
      shape: cylinder
    }
  }
}

User -> App.Uploader-Component: "1. 拖放文件"
App.Uploader-Component -> App.Backend-Server.Uploader-Server: "2. 上传文件"
App.Backend-Server.Uploader-Server -> App.Backend-Server.Uploader-Server: "3. 触发 onUploadFinish 钩子"
App.Backend-Server.Uploader-Server -> App.Backend-Server.DB: "4. 保存元数据"
App.Backend-Server.DB -> App.Backend-Server.Uploader-Server: "5. 返回数据库记录"
App.Backend-Server.Uploader-Server -> App.Uploader-Component: "6. 发送 JSON 响应 (URL)"
App.Uploader-Component -> App.Uploader-Component: "7. 触发 onUploadFinish 钩子"
App.Uploader-Component -> User: "8. 更新 UI"
```

## 主要特性

*   **由 Uppy 驱动**：利用成熟、经过实战检验的核心，实现可靠的上传。
*   **灵活的架构**：解耦的前端和后端软件包允许独立使用和定制。
*   **丰富的插件系统**：支持 `ImageEditor`、`Webcam` 和 `Url` 等标准 Uppy 插件，以及自定义的 blocklet 特定插件。
*   **远程源集成**：使用 Companion 中间件，轻松让用户从 Unsplash 等外部源导入文件。
*   **可定制的钩子**：在客户端和服务器上都提供 `onUploadFinish` 回调，让您完全控制上传后的处理。
*   **自动 Media Kit 集成**：当 Media Kit blocklet 可用时，无缝检测并自行配置。

准备好开始了吗？让我们将上传器集成到您的 blocklet 中。

<x-card data-title="开始使用" data-icon="lucide:rocket" data-href="/getting-started" data-cta="开始指南">
  遵循我们的分步指南，在您的应用程序中设置前端组件和后端服务器。
</x-card>