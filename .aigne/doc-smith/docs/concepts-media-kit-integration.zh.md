# 与 Media Kit 集成

`@blocklet/uploader` 包专为与 **Media Kit** blocklet 的无缝、零配置集成而设计。Media Kit 为媒体存储、管理和处理提供集中式服务。当 Uploader 组件检测到 Media Kit 安装在同一环境中时，它会自动增强其功能，而无需开发者进行任何额外设置。

这种自动集成可以集中化文件存储，在您所有的 blocklet 中强制执行一致的上传规则，并动态启用 AI 图像生成等高级功能。虽然此行为默认启用以提供流畅的体验，但如果您需要在自己的 blocklet 后端处理上传，也可以选择禁用。

## 工作原理：自动检测与配置

集成过程是完全自动化的，在组件初始化时遵循一个简单的两步流程：

1.  **检测**：`Uploader` 组件扫描环境中是否有安装了具有 Media Kit 唯一 DID（`z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9`）的 blocklet。

2.  **配置**：如果找到 Media Kit，Uploader 会向其 `/api/uploader/status` 端点发出 API 请求。该端点返回一个包含以下内容的配置对象：
    *   **上传限制**：在 Media Kit 中集中管理的全局规则，例如 `maxFileSize` 和 `allowedFileTypes`。
    *   **可用插件**：一个映射，指示哪些高级插件（例如 `AIImage`、`Resources`、`Uploaded`）已启用并应显示在 Uploader UI 中。
    *   **API 端点**：Uploader 会自动配置自己，将所有文件上传和相关的 API 调用路由到 Media Kit 的服务，确保所有媒体都存储在一个中心位置。

下图说明了此自动配置流程：

```d2
direction: down

blocklet-app: {
  label: "你的 Blocklet 应用"
  shape: rectangle

  uploader-component: {
    label: "Uploader 组件"
    shape: rectangle
  }
}

media-kit: {
  label: "Media Kit Blocklet"
  shape: rectangle

  config-api: {
    label: "配置 API\n(/api/uploader/status)"
  }

  upload-service: {
    label: "上传服务\n(/api/uploads)"
  }

  storage: {
    label: "集中式存储"
    shape: cylinder
  }

  config-api -> storage
  upload-service -> storage
}

blocklet-app.uploader-component -> media-kit: "1. 通过 DID 检测是否存在"
blocklet-app.uploader-component -> media-kit.config-api: "2. 获取配置\n（限制、插件）"
media-kit.config-api -> blocklet-app.uploader-component: "3. 返回配置"
blocklet-app.uploader-component -> media-kit.upload-service: "4. 转发上传请求"
```

## 核心优势

与 Media Kit 集成无需额外的开发工作即可提供多项强大优势。

<x-cards data-columns="2">
  <x-card data-title="集中式媒体管理" data-icon="lucide:library">
    所有上传的文件都在 Media Kit 内存储和管理，为跨多个 blocklet 的媒体资产创建了单一数据源。`Resources` 和 `Uploaded` 插件允许用户轻松浏览和重用现有资产。
  </x-card>
  <x-card data-title="动态功能插件" data-icon="lucide:puzzle">
    如果 Media Kit 中开启了相应功能，AI 图像生成等高级功能插件会自动启用。这使您的应用程序无需任何代码更改即可获得新功能。
  </x-card>
  <x-card data-title="一致的上传规则" data-icon="lucide:file-check-2">
    上传限制在 Media Kit 中统一定义，并自动应用于每个 Uploader 实例，确保了一致性并简化了策略管理。
  </x-card>
  <x-card data-title="零后端设置" data-icon="lucide:server-off">
    由于 Media Kit 提供了文件处理和存储所需的后端服务，您无需在自己的 blocklet 中安装或配置 `@blocklet/uploader-server`，从而降低了复杂性。
  </x-card>
</x-cards>

## 选择退出：禁用集成

在需要使用自己的后端逻辑和存储（通过 `@blocklet/uploader-server`）来管理上传的场景中，您可以禁用与 Media Kit 的自动集成。这可以通过向 `Uploader` 组件上的 `apiPathProps` 对象传递特定 props 来实现。

-   `disableMediaKitStatus`：设置为 `true` 可阻止 Uploader 从 Media Kit 获取配置（限制和插件）。
-   `disableMediaKitPrefix`：设置为 `true` 可阻止 Uploader 将 API 请求路由到 Media Kit 的端点。它将转而使用当前 blocklet 的前缀。

```jsx Uploader with Media Kit Integration Disabled icon=logos:react
import { Uploader } from '@blocklet/uploader/react';

export default function MyComponent() {
  return (
    <Uploader
      popup
      apiPathProps={{
        // 阻止从 Media Kit 获取远程配置
        disableMediaKitStatus: true,
        // 阻止将 API 调用路由到 Media Kit
        disableMediaKitPrefix: true,
      }}
      // 现在您需要提供自己的限制
      // 并使用 @blocklet/uploader-server 配置您自己的后端。
      coreProps={{
        restrictions: {
          maxFileSize: 1024 * 1024 * 5, // 5MB
          allowedFileTypes: ['image/jpeg', 'image/png'],
        },
      }}
    />
  );
}
```

通过设置这些属性，`Uploader` 组件将以独立模式运行，完全依赖于其自身的 props 和在您的应用程序中配置的后端服务。您可以在 [后端设置](./getting-started-backend-setup.md) 指南中了解更多相关信息。