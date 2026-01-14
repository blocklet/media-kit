# 前端设置 (@blocklet/uploader)

本指南将引导你完成在 Blocklet 中安装和集成 `@blocklet/uploader` React 组件的过程。该组件基于强大且可扩展的 [Uppy](https://uppy.io/) 文件上传器构建，为文件上传提供了一个功能丰富的用户界面。

完成本指南后，你的应用程序中将拥有一个可用的 Uploader 组件，并准备好连接到后端服务。为了获得无缝体验，我们建议使用我们的配套后端包，你可以在 [后端设置](./getting-started-backend-setup.md) 指南中了解相关信息。

## 1. 安装

首先，将 `@blocklet/uploader` 包添加到你项目的依赖项中。在你项目的根目录中打开终端，并运行以下命令：

```bash pnpm icon=logos:pnpm
pnpm add @blocklet/uploader
```

## 2. 导入样式

Uploader 组件的外观和功能依赖于 Uppy 生态系统中的几个 CSS 文件。你需要将这些样式表导入到你的应用程序入口文件（例如 `src/index.js` 或 `src/App.js`）中，以确保组件正确渲染。

```javascript App Entry Point (e.g., src/App.js) icon=logos:javascript
// 导入 Uppy 的核心和插件样式
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import '@uppy/webcam/dist/style.min.css';
import '@uppy/image-editor/dist/style.min.css';
import '@uppy/drag-drop/dist/style.min.css';
import '@uppy/drop-target/dist/style.min.css';
import '@uppy/status-bar/dist/style.min.css';

// ... 应用程序入口文件的其余部分
```

## 3. 基本用法：模态框上传器

使用上传器最简单的方法是将其渲染为模态对话框。我们将使用 React 的 `lazy` 加载，仅在需要时加载组件，以提高性能。

以下是一个包含打开上传器按钮的组件的完整示例。

```jsx UploaderButton.js icon=logos:react
import { lazy, useRef, Suspense } from 'react';

// 懒加载 Uploader 组件
const UploaderComponent = lazy(() => import('@blocklet/uploader').then((res) => ({ default: res.Uploader })));

export default function UploaderButton() {
  const uploaderRef = useRef(null);

  const handleUploadFinish = (result) => {
    // 'result' 对象包含有关已上传文件的详细信息
    console.log('上传成功！', result);
    // 现在你可以使用 result.uploadURL 或 result.data 中的文件 URL
    alert(`文件已上传至：${result.uploadURL}`);
  };

  const openUploader = () => {
    // 上传器实例有一个 `open` 方法
    uploaderRef.current?.getUploader()?.open();
  };

  return (
    <div>
      <button type="button" onClick={openUploader}>
        打开上传器
      </button>

      {/* Uploader 组件已渲染但隐藏，直到被打开 */}
      {/* 使用 Suspense 处理组件的懒加载 */}
      <Suspense fallback={<div>加载中...</div>}>
        <UploaderComponent
          ref={uploaderRef}
          popup // 此属性使上传器成为一个模态对话框
          onUploadFinish={handleUploadFinish}
        />
      </Suspense>
    </div>
  );
}
```

在此示例中：
- 我们创建了一个 `ref` (`uploaderRef`) 来访问 Uploader 组件的实例方法。
- `popup` 属性将上传器配置为模态对话框，该对话框由内部管理。
- 按钮的 `onClick` 处理程序调用上传器实例上的 `open()` 方法使其可见。
- `onUploadFinish` 回调函数在每个文件成功上传后触发，并接收文件的元数据作为参数。

## 4. 高级用法：使用 Provider

对于更复杂的应用程序，你可能希望从不同的组件触发上传器，而无需在组件树中向下传递 refs。`@blocklet/uploader` 包通过 `UploaderProvider` 和 `UploaderTrigger` 为这种情况提供了基于上下文的解决方案。

这种方法将上传器的状态与触发它的组件分离开来。

```jsx App.js icon=logos:react
import { UploaderProvider, UploaderTrigger } from '@blocklet/uploader';

function MyPageComponent() {
  return (
    <div>
      <h2>我的页面</h2>
      <p>点击下方按钮上传文件。</p>
      {/* UploaderTrigger 是一个简单的包装器，点击时会打开上传器 */}
      <UploaderTrigger>
        <button type="button">上传文件</button>
      </UploaderTrigger>
    </div>
  );
}

export default function App() {
  const handleUploadFinish = (result) => {
    console.log('文件已从 Provider 上传：', result.uploadURL);
  };

  return (
    // 使用 UploaderProvider 包装你的应用程序或其一部分
    <UploaderProvider popup onUploadFinish={handleUploadFinish}>
      <h1>我的应用程序</h1>
      <MyPageComponent />
      {/* 你可以在这里设置另一个触发器 */}
      <UploaderTrigger>
        <a>或者点击此链接</a>
      </UploaderTrigger>
    </UploaderProvider>
  );
}

```

### 工作原理

1.  **`UploaderProvider`**: 此组件初始化并持有 Uploader 实例。它应放置在组件树的较上层。`Uploader` 组件的所有属性（如 `popup` 和 `onUploadFinish`）都传递给该提供者。
2.  **`UploaderTrigger`**: 任何被 `UploaderTrigger` 包装的组件都会成为一个可点击的元素，用于打开上传器模态框。它可以包装按钮、链接或任何其他元素。

这种模式非常灵活，有助于保持组件逻辑的清晰。

---

## 后续步骤

现在你已经有了一个功能齐全的前端上传器组件。然而，要实际存储上传的文件，你需要一个后端服务来接收它们。

<x-card data-title="后端设置 (@blocklet/uploader-server)" data-icon="lucide:server" data-href="/getting-started/backend-setup" data-cta="继续">
  了解如何在基于 Express 的 blocklet 中安装和配置必要的后端中间件以处理文件上传。
</x-card>