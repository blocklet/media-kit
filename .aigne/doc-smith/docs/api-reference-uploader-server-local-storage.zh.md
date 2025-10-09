# initLocalStorageServer(options)

`initLocalStorageServer` 函数是用于处理从用户设备直接上传文件到你的 Blocklet 本地存储的核心中间件。它利用了强大的 [Tus 可续传上传协议](https://tus.io/)，确保上传过程可靠，并能在网络中断后恢复。

该中间件负责接收文件块，在服务器上将它们组装成完整的文件，并在上传完成后触发回调，以便你处理文件元数据。

### 工作原理

下图说明了当用户使用连接到带有 `initLocalStorageServer` 后端的 `Uploader` 组件上传文件时的典型数据流。

```d2 Upload Flow Diagram
direction: down

User: { 
  shape: c4-person 
}

App: {
  label: "你的 Blocklet 应用"
  shape: rectangle

  Uploader-Component: {
    label: "<Uploader /> 组件"
    shape: rectangle
  }

  Backend-Server: {
    label: "后端服务器"
    shape: rectangle

    Uploader-Server: {
      label: "initLocalStorageServer"
    }

    DB: {
      label: "数据库"
      shape: cylinder
    }
  }
}

User -> App.Uploader-Component: "1. 拖放文件"
App.Uploader-Component -> App.Backend-Server.Uploader-Server: "2. 上传文件块 (Tus)"
App.Backend-Server.Uploader-Server -> App.Backend-Server.Uploader-Server: "3. 触发 onUploadFinish 钩子"
App.Backend-Server.Uploader-Server -> App.Backend-Server.DB: "4. 保存文件元数据"
App.Backend-Server.DB -> App.Backend-Server.Uploader-Server: "5. 返回数据库记录"
App.Backend-Server.Uploader-Server -> App.Uploader-Component: "6. 发送 JSON 响应"
App.Uploader-Component -> App.Uploader-Component: "7. 触发前端 onUploadFinish"
App.Uploader-Component -> User: "8. 使用文件 URL 更新 UI"

```

### 基本用法

首先，在你的 Express 应用程序中初始化该中间件，并将其挂载到特定路由上。最关键的选项是 `onUploadFinish`，你将在这里定义文件成功保存后发生的操作。

```javascript Basic Backend Setup icon=logos:express
import express from 'express';
import { initLocalStorageServer } from '@blocklet/uploader-server';
import Upload from '../models/upload'; // 你的数据库模型

const router = express.Router();

// 初始化上传器服务器中间件
const localStorageServer = initLocalStorageServer({
  // 上传文件将存储的目录
  path: process.env.UPLOAD_DIR,
  express,

  // 此回调在文件成功上传后执行
  onUploadFinish: async (req, res, uploadMetadata) => {
    const {
      id: filename, // 磁盘上唯一的随机文件名
      size,
      metadata: { filename: originalname, filetype: mimetype },
    } = uploadMetadata;

    // 为上传的文件构建公共 URL
    const fileUrl = new URL(process.env.APP_URL);
    fileUrl.pathname = `/uploads/${filename}`;

    // 将文件信息保存到你的数据库
    const doc = await Upload.insert({
      mimetype,
      originalname,
      filename,
      size,
      url: fileUrl.href,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user.did,
    });

    // 以 JSON 响应形式返回数据库文档
    // 此数据将传递给前端的 onUploadFinish 回调
    return doc;
  },
});

// 将中间件挂载到 '/uploads' 路由上
// 确保任何必要的身份验证/授权中间件在其之前运行
router.use('/uploads', yourAuthMiddleware, localStorageServer.handle);

export default router;
```

### 配置选项

`initLocalStorageServer` 函数接受一个包含以下属性的选项对象：

| 选项                  | 类型       | 必需 | 描述                                                                                                                                                                                         |
| --------------------- | ---------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `path`                | `string`   | 是       | 用于存储上传文件的目录的绝对路径。                                                                                                                                                                 |
| `express`             | `Function` | 是       | Express 应用程序实例。                                                                                                                                                                             |
| `onUploadFinish`      | `Function` | 否       | 一个 `async` 回调函数，在文件上传完成后运行。它接收 `(req, res, uploadMetadata)`。返回值将作为 JSON 响应发送到前端。                                                                |
| `onUploadCreate`      | `Function` | 否       | 一个 `async` 回调函数，在新的上传启动但数据传输之前运行。可用于验证或授权检查。它接收 `(req, res, uploadMetadata)`。                                                                     |
| `expiredUploadTime`   | `Number`   | 否       | 不完整上传被视为过期并由后台作业清理的时间（以毫秒为单位）。**默认值：** `1000 * 60 * 60 * 24 * 3` (3 天)。                                                                     |
| `...restProps`        | `object`   | 否       | 底层 `@tus/server` 包的任何其他有效选项都将被传递。                                                                                                                                                |

### 回调详解

#### `onUploadFinish(req, res, uploadMetadata)`

这是处理已完成上传的主要回调。它是将文件元数据保存到数据库、触发 Webhook 或执行其他上传后操作的理想位置。

**`uploadMetadata` 对象**

传递给回调的 `uploadMetadata` 对象包含有关已上传文件的详细信息：

| 属性               | 类型     | 描述                                                                |
| ------------------ | -------- | --------------------------------------------------------------------------- |
| `id`               | `string` | 服务器磁盘上唯一的、随机生成的文件名。                                      |
| `size`             | `number` | 文件的总大小（以字节为单位）。                                              |
| `offset`           | `number` | 当前已上传的字节数。在此回调中应等于 `size`。                                 |
| `metadata`         | `object` | 包含客户端提供的元数据的对象。                                              |
| `metadata.filename`| `string` | 来自用户计算机的原始文件名。                                                |
| `metadata.filetype`| `string` | 文件的 MIME 类型（例如 `image/jpeg`）。                                     |
| `runtime`          | `object` | 包含有关文件位置的运行时信息的对象。                                        |
| `runtime.absolutePath` | `string` | 文件在服务器文件系统上的完整路径。                                          |

**返回值**

你从 `onUploadFinish` 返回的值将被序列化为 JSON 并发送回前端 `Uploader` 组件。这允许你传回数据库记录 ID、公共 URL 或任何其他相关数据。

### 自动清理

该中间件会自动设置一个每小时运行的后台 cron 作业（`auto-cleanup-expired-uploads`）。此作业会安全地从存储目录中删除任何超过 `expiredUploadTime` 的部分或过期上传，防止服务器被不完整的文件填满。

### 高级功能

#### EXIF 数据移除
为了保护隐私和安全，中间件会在上传完成后自动尝试从上传的图像（`.jpeg`、`.tiff` 等）中剥离 EXIF（可交换图像文件格式）元数据。

#### 手动删除文件
返回的服务器实例包含一个 `delete` 方法，你可以用它以编程方式删除已上传的文件及其关联的元数据文件。

```javascript Manually Deleting a File icon=mdi:code-block-tags
import { localStorageServer } from './setup'; // 假设你已导出该实例

async function deleteFile(filename) {
  try {
    await localStorageServer.delete(filename);
    console.log(`成功删除 ${filename}`);
  } catch (error) {
    console.error(`删除 ${filename} 失败：`, error);
  }
}
```

---

现在你已经知道如何处理直接上传，你可能希望让用户能够从外部服务导入文件。请继续下一节，了解 `initCompanion`。

<x-card data-title="下一步：initCompanion(options)" data-icon="lucide:link" data-href="/api-reference/uploader-server/companion">
  了解如何设置 Companion 中间件，以允许用户从 Unsplash 和直接 URL 等远程来源导入文件。
</x-card>