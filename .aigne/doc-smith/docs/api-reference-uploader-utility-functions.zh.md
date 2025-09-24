# 实用函数

`@blocklet/uploader/utils` 模块导出了一系列辅助函数，旨在简化与文件处理、URL 操作、Uppy 实例自定义和网络配置相关的常见任务。这些实用程序由 Uploader 组件内部使用，但您也可以在应用程序中使用它们以进行更高级的集成。

## 文件和 Blob 操作

这些函数可帮助您处理不同的文件格式和表示形式，例如 Blob、base64 字符串和 File 对象。

| Function | Description |
| --- | --- |
| `isBlob(file)` | 检查给定的输入是否为 `Blob` 的实例。 |
| `getObjectURL(fileBlob)` | 从 `Blob` 或 `File` 对象创建一个本地对象 URL（例如 `blob:http://...`），可用于客户端预览。 |
| `blobToFile(blob, fileName)` | 将 `Blob` 对象转换为 `File` 对象，并为其分配指定的文件名。 |
| `base64ToFile(base64, fileName)` | 将 base64 编码的字符串转换为 `File` 对象。可用于处理数据 URL。 |
| `isSvgFile(file)` | 通过检查文件的 MIME 类型、扩展名和内容，异步检查文件是否为 SVG。 |
| `getExt(uppyFile)` | 从 Uppy 文件对象中提取文件扩展名，同时使用其名称和 MIME 类型以确保准确性。 |

### 示例：将 Base64 转换为文件

```javascript icon=logos:javascript
import { base64ToFile, getObjectURL } from '@blocklet/uploader/utils';

const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...';
const imageFile = base64ToFile(base64Image, 'my-image.png');

// 现在您可以使用此文件对象，例如，创建预览
const previewUrl = getObjectURL(imageFile);
console.log(previewUrl);

// 或者将其添加到 Uppy 实例中
// uppy.addFile({ name: imageFile.name, type: imageFile.type, data: imageFile });
```

## URL 和路径管理

用于构建和操作 URL 的函数，尤其适用于与 Media Kit 的 CDN 和上传器的后端端点进行交互。

| Function | Description |
| --- | --- |
| `createImageUrl(filename, width, height, overwritePrefixPath)` | 为存储在 Media Kit 中的图像构建 URL。它可以附加查询参数以进行动态调整大小（`w`、`h`）。 |
| `getDownloadUrl(src)` | 接收一个 Media Kit 图像 URL，并移除调整大小的参数（`w`、`h`、`q`），以创建用于下载原始文件的 URL。 |
| `getUploaderEndpoint(apiPathProps)` | 根据传递给 `Uploader` 组件的 props，生成上传器（Tus）和 Companion 端点的绝对 URL。 |
| `setPrefixPath(apiPathProps)` | 设置用于 API 请求的内部前缀路径，允许您覆盖使用 Media Kit 挂载点的默认行为。 |

### 示例：生成调整大小后的图像 URL

```javascript icon=logos:javascript
import { createImageUrl } from '@blocklet/uploader/utils';

// 为 'photo.jpg' 生成一个宽度为 200px 的 URL
const thumbnailUrl = createImageUrl('photo.jpg', 200);
// 结果: https://your-cdn.com/uploads/photo.jpg?imageFilter=resize&w=200

// 为同一张图片生成包含宽度和高度的 URL
const sizedImageUrl = createImageUrl('photo.jpg', 400, 300);
// 结果: https://your-cdn.com/uploads/photo.jpg?imageFilter=resize&w=400&h=300
```

## Uppy 实例增强

### `initUppy(uppyInstance)`

这是一个功能强大的函数，它使用为 Blocklet 环境量身定制的自定义方法、事件处理程序和改进的逻辑来增强标准的 Uppy 核心实例。它由 `<Uploader />` 组件自动使用，但如果您要创建自己的 Uppy 实例，也可以手动使用。

**主要增强功能：**

*   **自定义成功事件**：添加一个强大的事件系统来处理成功上传。
    *   `uppy.onUploadSuccess(file, callback)`：监听成功上传，可选择性地针对特定文件。
    *   `uppy.onceUploadSuccess(file, callback)`：与上面相同，但监听器在执行一次后被移除。
    *   `uppy.emitUploadSuccess(file, response)`：手动触发成功事件。
*   **编程式上传**：添加一个 `async` 辅助方法，以便于编程式上传。
    *   `uppy.uploadFile(blobFile)`：接收一个 `Blob` 或 `File` 对象，将其添加到 Uppy，上传它，并返回一个解析为上传结果的 Promise。
*   **自定义打开/关闭事件**：提供一种简洁的方式来监听 Uploader 仪表板的打开或关闭。
    *   `uppy.onOpen(callback)` / `uppy.onClose(callback)`
*   **改进的逻辑**：覆盖默认的 Uppy 方法，如 `removeFiles` 和 `calculateTotalProgress`，以便更好地与后端集成并提供更准确的进度报告。

### 示例：使用 `initUppy` 进行编程式上传

```javascript icon=logos:javascript
import Uppy from '@uppy/core';
import { initUppy } from '@blocklet/uploader/utils';

// 1. 创建一个标准的 Uppy 实例
let uppy = new Uppy();

// 2. 使用自定义方法增强它
uppy = initUppy(uppy);

async function uploadMyFile(fileBlob) {
  try {
    console.log('开始上传...');
    const result = await uppy.uploadFile(fileBlob);
    console.log('上传成功！', result.response.data.fileUrl);
  } catch (error) {
    console.error('上传失败：', error);
  }
}

// 创建一个虚拟文件并上传
const myFile = new File(['hello world'], 'hello.txt', { type: 'text/plain' });
uploadMyFile(myFile);
```

## 模拟与测试

### `mockUploaderFileResponse(file)`

这个实用程序对于测试或在不实际上传的情况下将预先存在的文件添加到 Uploader 的 UI 中非常有用。它接收一个简单的文件对象，并生成一个完整的、与 Uppy 兼容的响应对象，该对象模仿成功的 Tus 上传。

这使您可以用已存储在 Media Kit 中的文件填充仪表板。

### 示例：将现有文件添加到 UI

```javascript icon=logos:javascript
import { mockUploaderFileResponse } from '@blocklet/uploader/utils';

// 假设 'uppy' 是您已初始化的 Uppy 实例

// 1. 定义您现有的文件数据
const existingFile = {
  fileUrl: 'https://domain.com/uploads/existing-image.png',
  originalname: 'existing-image.png',
  mimetype: 'image/png',
  size: 12345,
  _id: 'file123',
};

// 2. 生成模拟响应
const mockResponse = mockUploaderFileResponse(existingFile);

// 3. 将文件添加到 Uppy 的状态并触发成功事件
if (mockResponse) {
  uppy.addFile(mockResponse.file);
  uppy.emit('upload-success', mockResponse.file, mockResponse.responseResult);
}
```