# 可用插件

`@blocklet/uploader` 通过几个强大的定制插件扩展了核心 Uppy 库。这些插件与 Blocklet 生态系统（特别是媒体套件）无缝集成，提供 AI 图像生成、浏览以前上传的文件和访问共享资源等功能。当您使用 `<Uploader />` 组件并且有正确配置的后端可用时，这些插件中的大多数都会自动启用。

本文档为该软件包中包含的自定义插件提供了参考。

## Acquirer 插件（UI 标签页）

这些插件在 Uploader 仪表板中显示为标签页，为用户选择或创建文件提供了不同的方式。

### Uploaded

`Uploaded` 插件提供了一个标签页，用户可以在其中浏览、搜索和选择先前已上传到媒体套件的文件。这是一个无需重新上传即可重用现有资产的重要工具。

**主要功能：**

- **无限滚动：** 在用户滚动时从服务器惰性加载文件，即使是大型库也能确保高效性能。
- **丰富预览：** 在网格视图中直接渲染图像、视频和 PDF 的预览。
- **快速上传：** 包含一个专用的“添加”按钮，可以快速切换回“我的设备”标签页进行新上传。

**用法**

当 Uploader 检测到活动的媒体套件时，此插件默认启用。您可以通过 `uploaderOptions` 自定义其标题或向后端 API 传递额外参数。

```javascript uploaderOptions.js icon=logos:javascript
<Uploader
  uploaderOptions={{
    plugins: {
      Uploaded: {
        title: 'My Media Library', // 更改标签页标题
        params: { customParam: 'value' } // 向 API 传递自定义查询参数
      }
    }
  }}
/>
```

### Resources

`Resources` 插件允许用户从精选的静态资产列表中进行选择。这些资产可以由其他 blocklet 提供或由您的应用程序后端定义，从而可以轻松共享徽标、图标或文档模板等通用文件。

**主要功能：**

- **组件筛选：** 如果有多个资源来源（组件）可用，它们会显示为筛选按钮，允许用户在不同的资产集合之间切换。
- **网格视图：** 以清晰、易于导航的网格形式呈现资源。

**用法**

当后端配置为提供资源时，此插件会变为活动状态。您可以在 Uploader 选项中自定义其标题。

```javascript uploaderOptions.js icon=logos:javascript
<Uploader
  uploaderOptions={{
    plugins: {
      Resources: {
        title: 'Shared Assets' // 更改标签页标题
      }
    }
  }}
/>
```

### AI Image

将生成式 AI 直接集成到您的上传工作流中。`AI Image` 插件提供了一个专用界面，供用户使用后端配置的各种 AI 模型从文本提示生成图像。

**主要功能：**

- **提示界面：** 一个用户友好的面板，用于编写提示和选择模型。
- **模型筛选：** 根据 `window.blocklet.preferences.supportModels` 设置自动筛选可用的 AI 模型，确保用户只看到相关选项。
- **图片库：** 显示生成的图像，供选择并导入到 Uploader 中。

**用法**

当媒体套件配置了 AI 图像生成功能时，此插件可用。

```javascript uploaderOptions.js icon=logos:javascript
<Uploader
  uploaderOptions={{
    plugins: {
      AIImage: {
        title: 'Create with AI' // 更改标签页标题
      }
    }
  }}
/>
```

## 实用工具和后台插件

这些插件在后台运行，以增强功能性、安全性和可靠性。它们在仪表板中没有可见的 UI 标签页。

### PrepareUpload（内部插件）

这是一个至关重要的后台插件，它会自动为添加到 Uploader 的每个文件运行。它在上传开始前执行必要的预处理任务，以确保文件安全、格式正确并经过优化。

| 功能 | 描述 |
|---|---|
| **XSS 防护** | 清理 SVG 文件和文件名，以删除潜在的恶意脚本，保护您的应用程序免受跨站脚本攻击。 |
| **Zip 炸弹防护** | 检查压缩文件（`.zip`、`.gz`），确保它们不包含可能耗尽服务器资源的解压炸弹。 |
| **图像方向** | 根据 EXIF 元数据自动校正图像方向，防止照片横置或倒置。 |
| **远程文件处理** | 从远程来源（如 Unsplash 或通过 Companion 的 URL）下载文件到浏览器中，以便可以像本地文件一样进行处理和上传。 |
| **哈希文件名** | 根据文件内容的哈希值生成唯一的文件名，这有助于缓存并防止命名冲突。 |
| **图像验证** | 可以配置为强制执行宽高比，如果文件不符合要求的尺寸，则自动打开图像编辑器。 |

**用法**

`PrepareUpload` 插件默认启用。虽然通常不需要配置，但您可以向其传递选项，例如 `cropperOptions`，以对所有上传的图像强制执行特定的宽高比。

```javascript uploaderOptions.js icon=logos:javascript
<Uploader
  uploaderOptions={{
    plugins: {
      PrepareUpload: {
        cropperOptions: {
          aspectRatio: 16 / 9
        }
      }
    }
  }}
/>
```

### SafariPastePlugin

这是一个小型实用插件，用于解决特定的浏览器兼容性问题。它确保在 Safari 中将文件粘贴到 Uploader 仪表板时能正常工作，因为 Safari 处理粘贴事件的方式与其他浏览器不同。该插件默认启用，无需配置。

### VirtualPlugin

`VirtualPlugin` 不是一个功能插件，而是为开发者提供的一个基类。它简化了创建您自己的自定义 acquirer（仪表板中的一个新标签页）的过程，而无需从头开始编写一个完整的 Uppy UI 插件。

<x-card data-title="创建自定义插件" data-icon="lucide:puzzle" data-href="/guides/custom-plugin" data-cta="查看指南">
  有关如何构建您自己的标签页的详细说明，请参阅我们的专门指南。
</x-card>