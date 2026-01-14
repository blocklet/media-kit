# 配置插件

`@blocklet/uploader` 组件构建于灵活而强大的 [Uppy](https://uppy.io/) 文件上传器之上。这种架构允许通过基于插件的系统进行广泛的定制。Uploader 开箱即用地预先配置了几个基本插件，以及为与 Blocklet 生态系统集成而设计的特殊插件。

本指南将引导您了解如何启用、禁用和自定义这些插件的行为，以根据您的特定需求定制上传器。

## 控制活动的插件

控制哪些插件对用户可用的主要方法是通过 `Uploader` 组件上的 `plugins` prop。默认情况下，如果您不提供此 prop，Uploader 将尝试启用所有可用的内置插件。

要指定自定义的插件集，请传递一个包含其 ID 字符串的数组。这将覆盖默认设置。请注意，某些核心插件（如 `ImageEditor` 和 `PrepareUpload`）始终处于活动状态，以确保基本功能。

以下是您可以控制的主要采集器插件的 ID：

| 插件 ID | 描述 |
|---|---|
| `Webcam` | 允许用户使用其设备的摄像头拍照和录制视频。 |
| `Url` | 支持从直接 URL 导入文件。 |
| `Unsplash` | 允许用户从 Unsplash 浏览和导入图片（需要配置）。 |
| `AIImage` | 一个自定义插件，可启用 AI 图像生成功能（需要媒体套件）。 |
| `Uploaded` | 一个自定义插件，用于浏览和重用已上传到媒体套件的文件。 |
| `Resources` | 一个自定义插件，用于从其他提供资源的 Blocklet 中选择文件。 |


### 示例：仅启用 Webcam 和 URL

如果您只希望用户通过摄像头或 URL 上传，可以像这样配置 Uploader：

```jsx Uploader with specific plugins icon=logos:react
import Uploader from '@blocklet/uploader';

function MyComponent() {
  return (
    <Uploader
      popup
      plugins={['Webcam', 'Url']}
      // ... other props
    />
  );
}
```

此配置将导致上传器除了标准的本地文件选择外，仅显示 Webcam 和从 URL 导入的选项。

## 自定义插件选项

除了启用或禁用插件，您还可以传递详细的配置对象来定制它们的行为。这是通过 `Uploader` 组件上的专用 props 完成的，这些 props 以它们配置的插件命名。

### 自定义图像编辑器

最常被定制的插件是图像编辑器。您可以使用 `imageEditorProps` prop 控制从输出图像质量到可用的裁剪工具等所有内容。这些选项会直接传递给底层的 `@uppy/image-editor` 插件。

有关可用选项的完整列表，请参阅 [Uppy 图像编辑器文档](https://uppy.io/docs/image-editor/#options)。

```jsx Customizing Image Editor icon=logos:react
import Uploader from '@blocklet/uploader';

function MyImageEditor() {
  return (
    <Uploader
      popup
      imageEditorProps={{
        quality: 0.8, // 将 JPEG 质量设置为 80%
        cropperOptions: {
          viewMode: 1,
          aspectRatio: 16 / 9,
          background: false,
          autoCropArea: 1,
          responsive: true,
        },
      }}
      // ... other props
    />
  );
}
```

在此示例中，我们将图像压缩质量设置为 80%，并配置裁剪器以强制执行 16:9 的宽高比。

### 配置自定义插件

我们的自定义插件 `Uploaded` 和 `Resources` 也通过它们各自的 props（`uploadedProps` 和 `resourcesProps`）接受配置。一个常见的用例是提供一个回调函数，当用户从这些来源选择文件时调用，让您能够直接处理选择，而不是让 Uploader 将它们添加到其队列中。

```jsx Handling selection from Resources plugin icon=logos:react
import Uploader from '@blocklet/uploader';

function MyResourceSelector() {
  const handleFilesSelected = (files) => {
    // files 数组包含有关所选资源的元数据，
    // 包括每个文件的 `uppyFile` 属性。
    console.log('User selected these files from Resources:', files);
    // 您现在可以处理这些文件，例如，在您的 UI 中显示它们。
  };

  return (
    <Uploader
      popup
      plugins={['Resources']}
      resourcesProps={{
        onSelectedFiles: handleFilesSelected,
      }}
      // ... other props
    />
  );
}
```

## 创建您自己的插件

Uploader 被设计为可扩展的。如果内置插件不能满足您的需求，您可以创建自己的自定义插件选项卡，将独特的功能直接集成到 Uploader 的仪表板中。

<x-card data-title="创建一个自定义插件" data-icon="lucide:puzzle-piece" data-href="/guides/custom-plugin" data-cta="阅读指南">
  通过分步指南，学习如何构建和集成您自己的自定义插件。
</x-card>

---

通过掌握插件配置，您可以将 Uploader 从一个通用工具转变为一个高度专业化的组件，完美契合您应用程序的工作流程。既然您已经了解了如何配置界面，让我们进一步了解文件被选中后会发生什么。

接下来，我们将探讨如何在文件成功上传后处理它们。更多详情请参阅[处理上传](./guides-handling-uploads.md)指南。