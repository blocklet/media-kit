# <Uploader /> 组件属性

<Uploader /> 组件是将功能齐全的文件上传界面集成到您的 React 应用程序中的主要方式。它构建于流行的 [Uppy](https://uppy.io/) 库之上，并通过一套全面的属性实现高度可定制。本指南为所有可用属性提供了详细参考，使您能够根据特定需求定制上传器的行为、外观和功能。

## 主要属性

以下是您可以传递给 <Uploader /> 组件的完整属性列表。

| Prop | Type | Description |
| --- | --- | --- |
| `id` | `string` | Uppy 实例的唯一标识符。默认为 `'Uploader'`。 |
| `popup` | `boolean` | 如果为 `true`，上传器将呈现为模态对话框而不是内联显示。默认为 `false`。 |
| `locale` | `string` | 设置 UI 的语言。支持的值包括 'en'、'zh'。默认为 `'en'`。 |
| `onAfterResponse` | `(response: any) => void` | 在每次 HTTP 响应（来自 Tus 和 Companion）后触发的回调函数。 |
| `onUploadFinish` | `(request: any) => void` | 文件成功上传后触发的关键回调。`request` 对象包含 `uploadURL` 等详细信息。 |
| `onOpen` | `Function` | 当上传器 UI（尤其是在弹出模式下）打开时触发的回调函数。 |
| `onClose` | `Function` | 当上传器 UI 关闭时触发的回调函数。 |
| `onChange` | `Function` | 每当添加或删除文件时触发的回调，提供所有文件的当前列表。 |
| `plugins` | `string[]` or `object[]` | 用于配置启用哪些 Uppy 插件的数组。您也可以传递自定义插件。详情请参阅[配置插件](./guides-configuring-plugins.md)。 |
| `installerProps` | `object` | 传递给 Media Kit 的 `ComponentInstaller` 的属性，例如 `disabled` 或自定义 `fallback`。 |
| `uploadedProps` | `object` | 自定义 'Uploaded' 插件的配置，包括 `params` 和 `onSelectedFiles` 回调。 |
| `resourcesProps` | `object` | 自定义 'Resources' 插件的配置，包括 `params` 和 `onSelectedFiles` 回调。 |
| `tusProps` | `TusOptions` | 直接传递给 `@uppy/tus` 插件的选项对象。所有选项请参阅 [Tus 文档](https://uppy.io/docs/tus/#Options)。 |
| `wrapperProps` | `HTMLAttributes<HTMLDivElement>` | 应用于主包装 `div` 元素的属性，包括 `sx`、`className` 和 `style`。 |
| `coreProps` | `UppyOptions` | 直接传递给 Uppy 核心实例的选项对象。您可以在此配置 `restrictions` 等全局设置。所有选项请参阅 [Uppy Core 文档](https://uppy.io/docs/uppy/#Options)。 |
| `dashboardProps` | `DashboardOptions` | 直接传递给 `@uppy/dashboard` 插件的选项对象。所有选项请参阅 [Uppy Dashboard 文档](https://uppy.io/docs/dashboard/#Options)。 |
| `apiPathProps` | `object` | 用于配置上传器和 Companion 的 API 端点的对象。 |
| `dropTargetProps` | `DropTarget` | 配置 `@uppy/drop-target` 插件，允许将文件拖放到指定元素上进行上传。 |
| `initialFiles` | `any[]` | 在上传器初始化时用于预填充的文件对象数组。 |
| `imageEditorProps` | `ImageEditorOptions` | 直接传递给 `@uppy/image-editor` 插件的选项对象。所有选项请参阅 [Uppy Image Editor 文档](https://uppy.io/docs/image-editor/#Options)。 |

## 关键属性详解

### `onUploadFinish`

这是最重要的回调之一。每个文件在后端成功处理和存储后都会触发此回调。该回调会收到一个包含最终 `uploadURL` 和其他元数据的 `result` 对象，您可以随后用它来更新应用程序的状态或保存到数据库中。

```javascript UploadHandler.jsx icon=logos:react
import React, { useState } from 'react';
import Uploader from '@blocklet/uploader/react';

export default function UploadHandler() {
  const [fileUrl, setFileUrl] = useState('');

  const handleUploadFinish = (result) => {
    console.log('File uploaded:', result);
    // result 对象包含已上传文件的最终 URL
    if (result.uploadURL) {
      setFileUrl(result.uploadURL);
      // 现在您可以将此 URL 保存到您的状态或数据库中
    }
  };

  return (
    <div>
      <Uploader onUploadFinish={handleUploadFinish} />
      {fileUrl && <p>Last upload: <a href={fileUrl}>{fileUrl}</a></p>}
    </div>
  );
}
```

### `coreProps`

此属性让您可以直接访问 Uppy 核心配置。一个主要用例是设置上传限制，例如文件类型、文件数量和文件大小。

```javascript RestrictedUploader.jsx icon=logos:react
import Uploader from '@blocklet/uploader/react';

export default function RestrictedUploader() {
  const restrictions = {
    maxFileSize: 1024 * 1024, // 1 MB
    maxNumberOfFiles: 3,
    allowedFileTypes: ['image/jpeg', 'image/png'],
  };

  return (
    <Uploader
      coreProps={{
        restrictions: restrictions,
      }}
    />
  );
}
```

### `plugins`

此属性允许您自定义 Uploader 仪表盘中可用的选项卡。您可以启用或禁用内置插件，甚至添加您自己的自定义选项卡。

要深入了解如何创建自己的插件，请参阅[创建自定义插件](./guides-custom-plugin.md)指南。

```javascript CustomPluginUploader.jsx icon=logos:react
import Uploader from '@blocklet/uploader/react';
import { PhotoIcon } from '@heroicons/react/24/solid';

export default function CustomPluginUploader() {
  const customPlugins = [
    {
      id: 'MyCustomPlugin',
      options: {
        id: 'MyCustomPlugin',
        title: 'My Photos',
        icon: <PhotoIcon />,
      },
      onShowPanel: (ref) => {
        // 显示自定义面板内容的逻辑
        console.log('Custom panel shown!', ref);
      },
    },
  ];

  return (
    <Uploader
      plugins={['Webcam', 'Url', ...customPlugins]}
    />
  );
}
```

### `apiPathProps`

默认情况下，上传器与 `/api/uploads`（用于 Tus 上传）和 `/api/companion`（用于远程源）的端点通信。如果您的后端配置不同，可以覆盖这些路径。

```javascript CustomEndpoints.jsx icon=logos:react
import Uploader from '@blocklet/uploader/react';

export default function CustomEndpoints() {
  const apiPaths = {
    uploader: '/custom/tus-endpoint',
    companion: '/custom/companion-endpoint',
  };

  return (
    <Uploader apiPathProps={apiPaths} />
  );
}
```

---

在对这些属性有了扎实的理解后，您可以配置 Uploader 以适应各种用例。要进行更高级的控制，例如以编程方式打开上传器，请继续阅读下一节关于 [UploaderProvider 和 Hooks](./api-reference-uploader-provider-hooks.md) 的内容。