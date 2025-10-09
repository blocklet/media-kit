# 后端设置 (@blocklet/uploader-server)

本指南将引导你在基于 Express.js 的 Blocklet 中设置 `@blocklet/uploader-server` 包。该包提供了必要的服务器端中间件，用于处理由 `@blocklet/uploader` 前端组件发起的文件上传。

虽然前端 `@blocklet/uploader` 可以与任何支持 Tus 可续传协议的自定义后端一起使用，但 `@blocklet/uploader-server` 提供了一个即用型集成解决方案，可处理本地文件存储、元数据处理以及清理过期上传。

## 上传流程概述

下图说明了当用户使用前端组件和后端服务器中间件上传文件时的典型数据流。

```d2
direction: down

User: {
  shape: c4-person
}

App: {
  label: "你的 Blocklet 应用"
  shape: rectangle

  Uploader-Component: {
    label: "上传器组件\n(前端)"
    shape: rectangle
  }

  Backend-Server: {
    label: "后端服务器 (Express)"
    shape: rectangle

    Uploader-Middleware: {
      label: "@blocklet/uploader-server\n(initLocalStorageServer)"
    }

    File-System: {
      label: "上传目录"
      shape: cylinder
    }

    Database: {
      label: "数据库"
      shape: cylinder
    }
  }
}

User -> App.Uploader-Component: "1. 选择并拖放文件"
App.Uploader-Component -> App.Backend-Server.Uploader-Middleware: "2. 上传文件块 (Tus 协议)"
App.Backend-Server.Uploader-Middleware -> App.File-System: "3. 将文件保存到磁盘"
App.Backend-Server.Uploader-Middleware -> App.Backend-Server.Uploader-Middleware: "4. 触发 onUploadFinish 回调"
App.Backend-Server.Uploader-Middleware -> App.Database: "5. 保存文件元数据"
App.Database -> App.Backend-Server.Uploader-Middleware: "6. 返回已保存的记录"
App.Backend-Server.Uploader-Middleware -> App.Uploader-Component: "7. 发送带有文件 URL 的 JSON 响应"
App.Uploader-Component -> User: "8. 使用最终文件更新 UI"
```

## 第 1 步：安装

首先，将该包添加到你的 Blocklet 依赖项中。

```bash
pnpm add @blocklet/uploader-server
```

## 第 2 步：基本配置

该包的主要导出是 `initLocalStorageServer`。此函数创建一个 Express 中间件，用于处理文件上传并将其存储在本地文件系统中。

在你的 Blocklet 中创建一个新的路由文件（例如，`routes/uploads.js`）并添加以下基本配置：

```javascript Basic upload endpoint icon=logos:javascript
import express from 'express';
import { initLocalStorageServer } from '@blocklet/uploader-server';

const router = express.Router();

// 初始化上传器服务器中间件
const localStorageServer = initLocalStorageServer({
  path: process.env.UPLOAD_DIR, // 用于存储上传文件的目录
  express,
});

// 挂载上传器中间件以处理此路由的所有请求
router.use('/', localStorageServer.handle);

export default router;
```

在这个最小化设置中：
- 我们导入 `initLocalStorageServer`。
- 我们使用 `path` 选项调用它，该选项指定服务器上存储文件的目录。这应该是一个绝对路径。
- 我们将 `express` 对象本身传递给中间件。
- 最后，我们将返回的处理程序挂载到我们的路由上。

现在，你可以在主 `app.js` 文件中挂载此路由：

```javascript app.js icon=logos:javascript
// ... 其他导入
import uploadRouter from './routes/uploads';

// ... 应用设置
app.use('/api/uploads', uploadRouter);
```

完成此操作后，你的后端现在已准备好在 `/api/uploads` 端点接收文件上传。

## 第 3 步：处理上传完成

仅仅保存文件是不够的；通常你需要将其元数据保存到数据库，并向前端返回一个可公开访问的 URL。这可以通过 `onUploadFinish` 回调来完成。

`onUploadFinish` 函数在文件成功并完全上传到服务器后执行。

以下是一个更完整的示例，演示了如何使用它：

```javascript Full backend example icon=logos:javascript
import { initLocalStorageServer } from '@blocklet/uploader-server';
import express from 'express';
import url from 'url';
import path from 'path';

// 假设你有一个用于上传的数据库模型
// import Upload from '../models/upload';

const router = express.Router();

const localStorageServer = initLocalStorageServer({
  path: process.env.UPLOAD_DIR,
  express,
  onUploadFinish: async (req, res, uploadMetadata) => {
    // 1. 从完成的上传中解构元数据
    const {
      id: filename, // 磁盘上唯一的随机文件名
      size,
      metadata: { filename: originalname, filetype: mimetype },
    } = uploadMetadata;

    // 2. 构建文件的公共 URL
    const publicUrl = new URL(process.env.APP_URL);
    publicUrl.pathname = path.join('/api/uploads', filename);

    // 3. (可选但推荐) 将文件元数据保存到数据库
    /*
    const doc = await Upload.insert({
      mimetype,
      originalname,
      filename,
      size,
      url: publicUrl.href,
      createdAt: new Date().toISOString(),
      createdBy: req.user.did,
    });
    */

    // 4. 向前端返回一个 JSON 对象。该对象将
    // 在前端的 onUploadSuccess 回调中可用。
    const responseData = {
      url: publicUrl.href,
      // ...doc, // 如果你创建了数据库记录，则包含该记录
    };

    return responseData;
  },
});

// 挂载处理程序。任何用于身份验证的中间件（如 `user`、`auth`）
// 都应放在处理程序之前。
router.use('/', localStorageServer.handle);

export default router;
```

### 关键点：

- **`uploadMetadata`**：此对象包含有关已上传文件的所有信息，包括其唯一 ID（也是其在磁盘上的文件名）、大小以及从客户端发送的原始元数据（如 `originalname` 和 `mimetype`）。
- **数据库集成**：该回调是创建数据库记录的理想位置，用于将上传的文件与用户或应用程序中的其他资源关联起来。
- **返回值**：`onUploadFinish` 返回的对象被序列化为 JSON 并作为响应发送到前端。前端的 `onUploadSuccess` 回调将接收此对象，从而获知上传文件的最终 URL。

## 后续步骤

配置好后端后，你就可以探索更高级的功能和自定义项了。

<x-cards>
  <x-card data-title="处理上传" data-icon="lucide:upload-cloud" data-href="/guides/handling-uploads">
    深入了解 `onUploadFinish` 回调，并学习如何在客户端和服务器上处理文件元数据。
  </x-card>
  <x-card data-title="集成远程源" data-icon="lucide:link" data-href="/guides/remote-sources">
    学习如何设置 Companion 中间件，以允许用户从 URL、Unsplash 等导入文件。
  </x-card>
  <x-card data-title="initLocalStorageServer() API" data-icon="lucide:book-open" data-href="/api-reference/uploader-server/local-storage">
    浏览完整的 API 参考，了解所有可用于自定义本地存储中间件的选项。
  </x-card>
</x-cards>