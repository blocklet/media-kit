# 前端：@blocklet/uploader

`@blocklet/uploader` 包提供了一个功能强大且高度可定制的 React 组件，用于在 Blocklet 生态系统中处理文件上传。它构建于 [Uppy](https://uppy.io/) 之上，Uppy 是一个设计精良、模块化的开源文件上传器，可确保强大且用户友好的体验。

该包旨在作为独立组件在任何 React 应用程序中无缝工作。然而，当与 [Media Kit blocklet](./concepts-media-kit-integration.md) 结合使用时，其全部潜力才能得以释放，后者提供了集中式文件管理、人工智能图像生成等高级功能以及预配置的设置。

### 架构概述

`Uploader` 组件充当 Uppy 实例的协调器。它将 Uppy 的核心逻辑与一套标准插件（如 Webcam 和 URL 导入）以及为 Blocklet 环境量身定制的自定义插件（如 AI Image 和 Resources）相结合。这种模块化架构带来了极大的灵活性和丰富的功能。

```d2 Component Architecture icon=mdi:sitemap
direction: down

blocklet-app: {
  label: "你的 Blocklet 应用"
  shape: rectangle

  uploader-component: {
    label: "Uploader 组件"
    shape: rectangle

    uppy-ecosystem: {
      label: "Uppy 生态系统"
      shape: rectangle

      uppy-core: {
        label: "Uppy 核心实例"
      }

      standard-plugins: {
        label: "标准 Uppy 插件"
        shape: rectangle
        Dashboard: {}
        Tus: {}
        Webcam: {}
        Url: {}
      }

      custom-plugins: {
        label: "自定义 Blocklet 插件"
        shape: rectangle
        AIImage: {}
        Resources: {}
        Uploaded: {}
      }
    }
  }
}

media-kit: {
  label: "Media Kit Blocklet"
  shape: cylinder
}

blocklet-app.uploader-component.uppy-ecosystem.uppy-core -> blocklet-app.uploader-component.uppy-ecosystem.standard-plugins
blocklet-app.uploader-component.uppy-ecosystem.uppy-core -> blocklet-app.uploader-component.uppy-ecosystem.custom-plugins
blocklet-app.uploader-component <-> media-kit: "提供配置与插件"
```

### 核心概念

该包提供了两种集成上传器的主要方式：

1.  **直接组件：** `<Uploader />` 组件可以直接在你的应用程序中渲染。它可以配置为内联显示或作为模态对话框显示。
2.  **Provider 模式：** 对于更复杂的用例，`<UploaderProvider />` 和 `<UploaderTrigger />` 组件允许你通过编程方式从应用程序的任何部分（例如通过点击按钮）打开上传器。

### 基本用法

以下是一个将 Uploader 渲染为弹出模态框的最小示例。通过使用 ref 来访问其 `open` 和 `close` 方法。

```javascript Basic Uploader Example icon=logos:react
import { useRef } from 'react';
import Uploader from '@blocklet/uploader';
import Button from '@mui/material/Button';

export default function MyComponent() {
  const uploaderRef = useRef(null);

  const handleOpen = () => {
    uploaderRef.current?.open();
  };

  return (
    <div>
      <Button onClick={handleOpen}>打开上传器</Button>
      <Uploader ref={uploaderRef} popup={true} />
    </div>
  );
}
```

这个简单的设置将渲染一个按钮，点击该按钮会打开功能齐全的 Uploader 模态框。

### API 参考深入了解

要充分利用 `@blocklet/uploader` 的功能，请查阅其组件、钩子和实用工具的详细 API 文档。

<x-cards data-columns="2">
  <x-card data-title="<Uploader /> 组件属性" data-icon="lucide:component" data-href="/api-reference/uploader/component-props">
    探索 Uploader 组件的全部属性，包括核心设置、仪表盘选项和插件配置。
  </x-card>
  <x-card data-title="<UploaderProvider /> 和 Hooks" data-icon="lucide:workflow" data-href="/api-reference/uploader/provider-hooks">
    了解如何使用 UploaderProvider 和钩子（hooks）从应用程序的任何地方以编程方式控制上传器。
  </x-card>
  <x-card data-title="可用插件" data-icon="lucide:puzzle" data-href="/api-reference/uploader/plugins">
    发现像 AI 图像生成、已上传文件和资源等定制插件，这些插件增强了上传器的功能。
  </x-card>
  <x-card data-title="实用函数" data-icon="lucide:wrench" data-href="/api-reference/uploader/utility-functions">
    用于文件转换、URL 生成和 Uppy 实例操作等任务的辅助函数参考。
  </x-card>
</x-cards>

通过理解这些构建模块，你可以定制上传器以完美满足应用程序的需求。要获得完整的文件上传解决方案，请记得根据 [@blocklet/uploader-server](./api-reference-uploader-server.md) 文档中的说明，设置相应的后端服务。