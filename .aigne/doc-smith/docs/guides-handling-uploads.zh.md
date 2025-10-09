# 处理上传

文件成功上传后，您通常需要在客户端和服务器上执行操作。本指南介绍了如何在 `@blocklet/uploader` 前端组件和 `@blocklet/uploader-server` 中间件中使用 `onUploadFinish` 回调来处理文件及其元数据。

前端回调是更新 UI 的理想选择，而后端回调则用于服务器端任务，例如将文件信息保存到数据库中。

### 上传流程

下图说明了从用户拖放文件到最终 UI 更新的完整过程，展示了前端和后端回调如何协同工作。

```d2
direction: down

User: { 
  shape: c4-person 
}

App: {
  label: "您的 Blocklet 应用"
  shape: rectangle

  Uploader-Component: {
    label: "Uploader 组件"
    shape: rectangle
  }

  Backend-Server: {
    label: "后端服务器"
    shape: rectangle

    Uploader-Server: {
      label: "@blocklet/uploader-server"
    }

    DB: {
      label: "数据库"
      shape: cylinder
    }
  }
}

User -> App.Uploader-Component: "1. 拖放文件"
App.Uploader-Component -> App.Backend-Server.Uploader-Server: "2. 上传文件 (Tus)"
App.Backend-Server.Uploader-Server -> App.Backend-Server.Uploader-Server: "3. 触发后端 onUploadFinish"
App.Backend-Server.Uploader-Server -> App.Backend-Server.DB: "4. 保存元数据"
App.Backend-Server.DB -> App.Backend-Server.Uploader-Server: "5. 返回数据库记录"
App.Backend-Server.Uploader-Server -> App.Uploader-Component: "6. 发送 JSON 响应"
App.Uploader-Component -> App.Uploader-Component: "7. 触发前端 onUploadFinish"
App.Uploader-Component -> User: "8. 使用文件 URL 更新 UI"
```

---

## 前端：`onUploadFinish` Prop

`Uploader` 组件接受一个 `onUploadFinish` prop，它是一个在每个文件上传完成后执行的函数。此回调接收从后端 `onUploadFinish` 处理程序发送的 JSON 响应。

这是更新应用程序状态、显示上传的图像或存储返回的文件 URL 的理想位置。

**Prop 定义**

| Prop | Type | Description |
|---|---|---|
| `onUploadFinish` | `(result: any) => void` | 一个回调函数，在后端处理完文件后接收最终的上传结果对象。 |

**示例用法**

在此示例中，我们使用 `onUploadFinish` 回调从后端接收文件 URL 并将其存储在组件的状态中。

```javascript Uploader Component icon=logos:react
import { Uploader } from '@blocklet/uploader/react';
import { useState } from 'react';

export default function MyComponent() {
  const [fileUrl, setFileUrl] = useState('');

  const handleUploadFinish = (result) => {
    // 'result' 对象是来自后端的 JSON 响应
    console.log('Upload finished:', result);

    // 'result.data' 包含服务器返回的主体
    if (result.data && result.data.url) {
      setFileUrl(result.data.url);
    }
  };

  return (
    <div>
      <Uploader onUploadFinish={handleUploadFinish} />
      {fileUrl && (
        <div>
          <p>Upload successful!</p>
          <img src={fileUrl} alt="Uploaded content" width="200" />
        </div>
      )}
    </div>
  );
}
```

传递给前端回调的 `result` 对象包含有关上传的详细信息，包括来自服务器的响应。

**示例 `result` 对象**

```json
{
  "uploadURL": "http://localhost:3030/api/uploads/f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6.png",
  "data": {
    "url": "http://localhost:3030/api/uploads/f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6.png",
    "_id": "z2k...",
    "mimetype": "image/png",
    "originalname": "screenshot.png",
    "filename": "f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6.png",
    "size": 123456,
    "folderId": "component_did",
    "createdBy": "user_did",
    "updatedBy": "user_did",
    "createdAt": "2023-10-27T10:00:00.000Z",
    "updatedAt": "2023-10-27T10:00:00.000Z"
  },
  "method": "POST",
  "url": "http://localhost:3030/api/uploads/f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6.png",
  "status": 200,
  "headers": { ... },
  "file": { ... } // Uppy 文件对象
}
```

---

## 后端：`onUploadFinish` 选项

在服务器上，您在初始化 `initLocalStorageServer` 时提供一个 `onUploadFinish` 函数。此函数在文件完全接收并存储在服务器的本地磁盘上之后，但在向客户端发送最终响应之前触发。

这是您应该处理核心业务逻辑的地方，例如：
- 验证上传的文件。
- 将文件元数据保存到数据库。
- 将文件与当前用户关联。
- 向前端返回自定义 JSON 对象。

**函数签名**

```typescript
(req: Request, res: Response, uploadMetadata: object) => Promise<any>
```

- `req`：Express 请求对象，包含标头和用户信息。
- `res`：Express 响应对象。
- `uploadMetadata`：包含有关上传文件详细信息的对象。

**示例用法**

此示例演示了如何将文件元数据保存到数据库（使用虚构的 `Upload` 模型）并将创建的记录返回给前端。

```javascript Backend Server Setup icon=logos:nodejs
import { initLocalStorageServer } from '@blocklet/uploader-server';
import express from 'express';
import { joinUrl } from 'url-join';

// 假设 'Upload' 是您的数据库模型
import Upload from '../models/upload';

const app = express();

const localStorageServer = initLocalStorageServer({
  path: process.env.UPLOAD_DIR,
  express,
  onUploadFinish: async (req, res, uploadMetadata) => {
    const {
      id: filename, // 磁盘上唯一的、经过哈希处理的文件名
      size,
      metadata: { filename: originalname, filetype: mimetype },
    } = uploadMetadata;

    // 构建文件的公共 URL
    const fileUrl = joinUrl(process.env.APP_URL, '/api/uploads', filename);

    // 将文件元数据保存到您的数据库
    const doc = await Upload.insert({
      mimetype,
      originalname,
      filename, // 经过哈希处理的文件名
      size,
      folderId: req.componentDid, // 上传发生的组件的 DID
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user.did, // 假设有用户身份验证中间件
      updatedBy: req.user.did,
    });

    // 返回的对象将作为 JSON 响应发送到前端
    const responseData = { url: fileUrl, ...doc };

    return responseData;
  },
});

// 挂载 uploader 中间件
app.use('/api/uploads', localStorageServer.handle);
```

**`uploadMetadata` 对象详情**

The `uploadMetadata` 对象提供了有关文件的关键信息：

```json
{
  "id": "f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6.png",
  "size": 123456,
  "offset": 123456,
  "is_final": true,
  "metadata": {
    "relativePath": null,
    "name": "screenshot.png",
    "filename": "screenshot.png",
    "type": "image/png",
    "filetype": "image/png",
    "uploaderId": "Uploader"
  },
  "runtime": {
    "relativePath": null,
    "absolutePath": "/path/to/uploads/f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6.png",
    "size": 123456,
    "hashFileName": "f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6.png",
    "originFileName": "screenshot.png",
    "type": "image/png",
    "fileType": "image/png"
  }
}
```

通过实现这两个回调，您可以创建一个强大的上传管道，将浏览器中的用户操作与服务器端的业务逻辑无缝连接。要了解如何处理来自 Unsplash 等外部源的文件，请继续阅读下一篇指南。

<x-card data-title="集成远程源 (Companion)" data-icon="lucide:link" data-href="/guides/remote-sources">
  了解如何设置 Companion 中间件，以允许用户从直接 URL 和其他服务导入文件。
</x-card>