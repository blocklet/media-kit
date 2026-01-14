# 快速入门

本指南将引导您完成将功能强大的文件上传器集成到您的 Blocklet 中的基本步骤。我们将涵盖前端 UI 组件和可选的后端服务器设置，以帮助您快速上手。

该解决方案分为两个主要包：

- **`@blocklet/uploader`**: 一个 React 组件，提供丰富的用户界面用于上传文件。
- **`@blocklet/uploader-server`**: 一个 Express 中间件，用于您的 Blocklet 后端处理文件存储和处理。

值得注意的是，`@blocklet/uploader` 可以独立工作，特别是在与提供必要后端端点的 Media Kit Blocklet 集成时。只有当您想在服务器上实现自己的自定义上传逻辑时，才需要使用 `@blocklet/uploader-server`。

```d2
direction: down

user: {
  shape: c4-person
  label: "开发者"
}

blocklet: {
  label: "你的 Blocklet"
  shape: rectangle

  frontend: {
    label: "前端 (React)"
    shape: rectangle
    blocklet-uploader: {
      label: "@blocklet/uploader"
    }
  }

  backend: {
    label: "后端 (Express)"
    shape: rectangle
    blocklet-uploader-server: {
      label: "@blocklet/uploader-server"
    }
  }
}

user -> blocklet.frontend.blocklet-uploader: "集成组件"
user -> blocklet.backend.blocklet-uploader-server: "集成中间件"
blocklet.frontend -> blocklet.backend: "上传文件"
```

首先，请选择符合您需求的设置指南。我们建议从前端设置开始。

<x-cards data-columns="2">
  <x-card data-title="前端设置 (@blocklet/uploader)" data-icon="lucide:layout-template" data-href="/getting-started/frontend-setup">
    在您的 React 应用程序中安装和渲染基本前端上传器组件的分步指南。
  </x-card>
  <x-card data-title="后端设置 (@blocklet/uploader-server)" data-icon="lucide:server" data-href="/getting-started/backend-setup">
    学习如何在基于 Express 的 Blocklet 中安装和配置必要的后端中间件以处理文件上传。
  </x-card>
</x-cards>

完成这些指南后，您将拥有一个功能齐全的文件上传器。要探索更高级的功能，例如自定义插件或处理上传回调，请继续阅读 [指南](./guides.md) 部分。