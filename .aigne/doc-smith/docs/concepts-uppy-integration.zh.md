# 与 Uppy 集成

`@blocklet/uploader` 包直接构建于 [Uppy](https://uppy.io/) 之上，Uppy 是一个为 Web 设计的时尚、模块化且开源的文件上传器。我们没有从头开始构建文件上传器，而是利用了 Uppy 强大的核心引擎、广泛的插件生态系统和精致的用户界面。这使我们能够提供一个健壮且功能丰富的上传体验，同时专注于在 Blocklet 生态系统内的无缝集成。

这种方法意味着 `@blocklet/uploader` 实质上是 Uppy 的一个预配置和增强的包装器，专为 Blocklet 开发量身定制。

## 核心架构

`Uploader` 组件初始化并管理一个核心 Uppy 实例。然后，它集成了一组标准的 Uppy 插件以实现通用功能（如仪表盘 UI、网络摄像头访问以及用于可续传上传的 Tus），并在此之上添加了旨在与其他 Blocklet（如媒体套件）交互的自定义插件。

下图说明了这种关系：

```d2
direction: down

blocklet-app: {
  label: "你的 Blocklet 应用"
  shape: rectangle

  uploader-component: {
    label: "Uploader 组件\n(@blocklet/uploader)"
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
        ImageEditor: {}
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

blocklet-app.uploader-component.uppy-ecosystem.uppy-core -> blocklet-app.uploader-component.uppy-ecosystem.standard-plugins: "管理"
blocklet-app.uploader-component.uppy-ecosystem.uppy-core -> blocklet-app.uploader-component.uppy-ecosystem.custom-plugins: "管理"
```

## 访问核心 Uppy 实例

对于高级用例，你可能需要直接与底层的 Uppy 实例交互以访问其丰富的 API。`Uploader` 组件提供了一个 `ref`，它公开了一个 `getUploader()` 方法，让你能够完全访问 Uppy 对象。

这允许你以编程方式控制上传器，监听 Uppy 特定的事件，或调用 [Uppy API 文档](https://uppy.io/docs/uppy/) 中可用的任何方法。

```jsx Accessing the Uploader Instance icon=logos:react
import { useRef, useEffect } from 'react';
import { Uploader } from '@blocklet/uploader';

export default function MyComponent() {
  const uploaderRef = useRef(null);

  useEffect(() => {
    if (uploaderRef.current) {
      const uppy = uploaderRef.current.getUploader();

      // 现在你可以使用完整的 Uppy API
      uppy.on('complete', (result) => {
        console.log('上传完成！', result.successful);
      });

      console.log('Uppy 实例已准备就绪：', uppy.getID());
    }
  }, []);

  return <Uploader ref={uploaderRef} popup />;
}
```

## 前后端分离

需要理解的重要一点是，`@blocklet/uploader` 是一个纯前端包。它负责用户界面和客户端的上传逻辑。它 **不依赖于 `@blocklet/uploader-server`**。

默认情况下，它使用 [Tus 协议](https://tus.io/) 进行可续传上传，这意味着它可以与 *任何* 实现了 Tus 规范的后端服务器通信。`@blocklet/uploader-server` 是为 Blocklet 开发者提供的一个方便、即用的后端解决方案，但你也可以自由实现自己的后端或使用其他兼容 Tus 的服务。

## 了解更多信息

虽然我们的文档涵盖了 `@blocklet/uploader` 的最常见用例和配置，但对于更高级的主题，Uppy 的官方文档是无价的资源。如果你想深入了解 Uppy 的核心概念，探索其全部插件，甚至创建自己的自定义插件，他们的网站是最好的起点。

<x-card data-title="Uppy 官方文档" data-icon="lucide:book-open" data-href="https://uppy.io/docs/quick-start/" data-cta="Visit Uppy.io">
  探索全面的 Uppy 文档，获取深入的指南、API 参考和高级定制选项。
</x-card>