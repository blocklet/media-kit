# <UploaderProvider /> 与 Hooks

对于更高级的用例，您可能需要从应用程序的不同部分触发 Uploader，或以编程方式控制其行为。`UploaderProvider` 组件及其关联的 hooks 提供了一种灵活的方式，使用 React 的 Context API 将 Uploader 的 UI 与其触发器解耦。

当您想从标题中的按钮、菜单中的链接或任何非 Uploader 直接子元素的元素打开 Uploader 模态框时，此模式是理想的选择。

此方法涉及三个主要部分：

<x-cards data-columns="3">
  <x-card data-title="UploaderProvider" data-icon="lucide:box">
    一个包装组件，它实例化 Uploader 并通过上下文提供其实例。
  </x-card>
  <x-card data-title="UploaderTrigger" data-icon="lucide:mouse-pointer-click">
    一个简单的组件，创建一个可点击区域以打开 Uploader 模态框。
  </x-card>
  <x-card data-title="useUploaderContext" data-icon="lucide:webhook">
    一个用于直接访问 Uploader 实例以实现自定义逻辑的 hook。
  </x-card>
</x-cards>

### 工作原理

`UploaderProvider` 渲染 `<Uploader />` 组件（通常在附加到 document body 的 portal 中）并持有其实例的引用（`ref`）。提供者树中的任何子组件都可以使用 `useUploaderContext` hook 访问此 `ref`。`UploaderTrigger` 是一个预构建的组件，它使用此 hook 来调用 Uploader 实例上的 `open()` 方法。

```d2
direction: down

app-ui: {
  label: "你的应用程序 UI"
  shape: rectangle

  uploader-provider: {
    label: "UploaderProvider"
    shape: rectangle
    style.fill: "#f0f9ff"

    header: {
      label: "页头"
      shape: rectangle

      upload-button: {
        label: "<UploaderTrigger>"
        shape: rectangle
      }
    }

    main-content: {
      label: "主要内容"
      shape: rectangle
    }
  }
}

uploader-instance: {
  label: "<Uploader /> 实例\n(在 React Portal 中)"
  shape: rectangle
  style.stroke-dash: 2
}

app-ui.uploader-provider.header.upload-button -> uploader-instance: "3. 通过 context ref 调用 open()"

context: {
  label: "UploaderContext"
  shape: cylinder
}

app-ui.uploader-provider -> context: "1. 提供 uploader ref"
context -> app-ui.uploader-provider.header.upload-button: "2. 消费 ref"

```

---

## `UploaderProvider`

此组件是该模式的基础。它必须包装任何需要与 Uploader 交互的组件，包括任何 `UploaderTrigger` 或使用 `useUploaderContext` hook 的自定义组件。

它接受与 `<Uploader />` 组件相同的所有 props，允许您配置 Uploader 的行为、插件和外观。对于此模式，您几乎总是需要设置 `popup={true}`。

### Props

| Prop | Type | Description |
|---|---|---|
| `children` | `ReactNode` | 将有权访问 Uploader 上下文的子组件。 |
| `popup` | `boolean` | 当为 `true` 时，Uploader 会使用 React Portal 在一个模态框中渲染。当为 `false` 时，它会内联渲染。默认为 `true`。 |
| `...restProps` | `UploaderProps` | 所有其他 props 都会直接传递给底层的 `<Uploader />` 组件。有关完整列表，请参阅 [Uploader 组件 Props](./api-reference-uploader-component-props.md)。 |

### 用法

使用 `UploaderProvider` 包装您的应用程序的一部分或整个应用程序。

```javascript MyUploader.jsx icon=logos:react
import React from 'react';
import { UploaderProvider, UploaderTrigger } from '@blocklet/uploader/react';
import Button from '@mui/material/Button';

export default function MyUploader() {
  const handleUploadSuccess = (result) => {
    console.log('Files uploaded: ', result);
    // result 包含 { successful, failed } 文件对象数组
  };

  return (
    <UploaderProvider endpoint="/api/upload" popup={true}>
      <UploaderTrigger onChange={handleUploadSuccess}>
        <Button variant="contained">上传文件</Button>
      </UploaderTrigger>

      {/* 你的应用中的其他组件也可以在这里 */}
    </UploaderProvider>
  );
}
```

---

## `UploaderTrigger`

`UploaderTrigger` 组件是一个方便的包装器，使其子元素可点击，从而触发 Uploader 模态框打开。

### Props

| Prop | Type | Description |
|---|---|---|
| `children` | `ReactNode` | 用作触发器的 React 元素，例如 `<Button>` 或 `<a>` 标签。 |
| `onChange` | `Function` | 一个可选的回调函数，在成功上传后仅触发一次。它会接收来自 Uppy 的结果对象。 |
| `...restProps` | `object` | 任何其他 props 都会传递给底层的 Material-UI `<Box>` 组件。 |

### 用法

将任何可点击的组件放在 `UploaderTrigger` 内部。`onChange` prop 提供了一种处理上传结果的简单方法。

```javascript icon=logos:react
<UploaderTrigger onChange={(result) => alert(`已上传 ${result.successful.length} 个文件！`)}>
  <Button>点击我上传</Button>
</UploaderTrigger>
```

---

## `useUploaderContext`

为了获得最大程度的控制，`useUploaderContext` hook 允许您直接访问 Uploader 的实例 ref。这使您能够以编程方式调用 Uploader 或其底层 Uppy 实例上的任何方法。

### 返回值

| Value | Type | Description |
|---|---|---|
| `uploaderRef` | `React.RefObject` | 一个 React ref 对象。Uploader 实例位于 `uploaderRef.current`。要访问 Uppy 实例，请使用 `uploaderRef.current.getUploader()`。 |

> **注意：** 如果在非 `UploaderProvider` 后代的组件中使用该 hook，它将抛出错误。

### 用法

这是一个使用该 hook 打开 Uploader 并记录当前所选文件数量的自定义组件示例。

```javascript CustomControls.jsx icon=logos:react
import React from 'react';
import { useUploaderContext } from '@blocklet/uploader/react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

export default function CustomControls() {
  const uploaderRef = useUploaderContext();

  const handleOpenUploader = () => {
    const uploader = uploaderRef?.current?.getUploader();
    uploader?.open();
  };

  const handleLogFiles = () => {
    const uploader = uploaderRef?.current?.getUploader();
    const files = uploader?.getFiles();
    console.log('Uppy 中的当前文件：', files);
    alert(`已选择 ${files.length} 个文件。`);
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
      <Button variant="outlined" onClick={handleOpenUploader}>
        手动打开 Uploader
      </Button>
      <Button variant="outlined" color="secondary" onClick={handleLogFiles}>
        记录当前文件
      </Button>
    </Box>
  );
}
```

要使用此 `CustomControls` 组件，您需要像这样将其放置在 `UploaderProvider` 内部：

```javascript App.jsx icon=logos:react
// ... 导入
import CustomControls from './CustomControls';

export default function App() {
  return (
    <UploaderProvider endpoint="/api/upload">
      {/* 您仍然可以有一个主触发器 */}
      <UploaderTrigger>
        <Button>上传</Button>
      </UploaderTrigger>

      {/* 并且还可以使用您的自定义组件进行更多控制 */}
      <CustomControls />
    </UploaderProvider>
  );
}
```

此模式提供了高度的灵活性，允许您将上传器无缝集成到复杂的应用程序布局和工作流中。

接下来，您可能想探索一些可以简化常见任务的辅助函数。

<x-card data-title="实用工具函数" data-icon="lucide:wrench" data-href="/api-reference/uploader/utility-functions" data-cta="查看实用工具">
  了解用于文件转换和 URL 生成等任务的辅助函数。
</x-card>