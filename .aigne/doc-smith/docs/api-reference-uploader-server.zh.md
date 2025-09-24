# 后端：@blocklet/uploader-server

`@blocklet/uploader-server` 包提供了一套 Express.js 中间件，旨在处理 blocklet 后端的各种文件处理任务。它作为 `@blocklet/uploader` 前端组件的服务器端对应部分，支持直接文件上传、与远程源集成以及资源服务等功能。

虽然它被设计为与其前端伙伴无缝协作，但也可以用作自定义文件上传逻辑的独立解决方案。该包导出了几个模块化的中间件初始化器，您可以轻松地将它们集成到您的 Express 应用程序中。

### 核心中间件交互

下图说明了在上传过程中，主要中间件组件如何与前端和外部服务进行交互。

```d2
direction: down

Frontend-Uploader: {
  label: "@blocklet/uploader"
}

Backend-Server: {
  label: "Express 服务器"
  shape: rectangle

  uploader-server-middleware: {
    label: "@blocklet/uploader-server"

    initLocalStorageServer
    initCompanion
  }
}

Remote-Sources: {
  label: "远程源\n（例如，Unsplash）"
  shape: cylinder
}

File-Storage: {
  label: "服务器文件系统"
  shape: cylinder
}

Frontend-Uploader -> Backend-Server.uploader-server-middleware.initLocalStorageServer: "直接上传"
Frontend-Uploader -> Backend-Server.uploader-server-middleware.initCompanion: "远程上传请求"
Backend-Server.uploader-server-middleware.initCompanion -> Remote-Sources: "获取文件"
Backend-Server.uploader-server-middleware.initLocalStorageServer -> File-Storage: "存储文件"

```

## 安装

首先，将该包添加到您的 blocklet 的依赖项中。

```bash Installation icon=mdi:language-bash
pnpm add @blocklet/uploader-server
```

## 通用用法

这是一个将上传和伴侣中间件集成到您的 Express 应用程序路由中的典型示例。您可以初始化所需的中间件，然后将其处理程序挂载到特定路由上。

```javascript Express Router Example icon=logos:javascript
import { initLocalStorageServer, initCompanion } from '@blocklet/uploader-server';
import express from 'express';

// 假设 `env`、`user`、`auth`、`ensureComponentDid` 和 `Upload` 模型已在别处定义
const router = express.Router();

// 1. 初始化本地存储服务器以进行直接上传
const localStorageServer = initLocalStorageServer({
  path: env.uploadDir, // 用于保存上传文件的目录
  express,
  // 可选：文件成功上传后执行的回调函数
  onUploadFinish: async (req, res, uploadMetadata) => {
    const {
      id: filename,
      size,
      metadata: { filename: originalname, filetype: mimetype },
    } = uploadMetadata;

    // 为上传的文件构造公共 URL
    const obj = new URL(env.appUrl);
    obj.protocol = req.get('x-forwarded-proto') || req.protocol;
    obj.pathname = `/uploads/${filename}`;

    // 将文件元数据保存到数据库
    const doc = await Upload.insert({
      mimetype,
      originalname,
      filename,
      size,
      // ... 来自请求的其他元数据
    });

    // 向前端返回一个 JSON 响应
    const resData = { url: obj.href, ...doc };
    return resData;
  },
});

// 将上传处理程序挂载到特定路由上
router.use('/uploads', user, auth, ensureComponentDid, localStorageServer.handle);

// 2. 初始化 Companion 以支持远程源（例如 URL、Unsplash）
const companion = initCompanion({
  path: env.uploadDir,
  express,
  providerOptions: env.providerOptions, // 您的提供商密钥（例如 Unsplash）
  uploadUrls: [env.appUrl], // 您的应用的 URL
});

// 将伴侣处理程序挂载到其路由上
router.use('/companion', user, auth, ensureComponentDid, companion.handle);
```

## 可用中间件

该包为不同的功能导出了几个中间件初始化器。点击卡片可查看其详细的 API 参考和配置选项。

<x-cards data-columns="2">
  <x-card data-title="initLocalStorageServer" data-icon="lucide:hard-drive-upload" data-href="/api-reference/uploader-server/local-storage">
    处理来自用户计算机的直接文件上传，并将其保存到服务器的本地存储中。
  </x-card>
  <x-card data-title="initCompanion" data-icon="lucide:link" data-href="/api-reference/uploader-server/companion">
    与 Uppy Companion 集成，允许用户从直接 URL 和 Unsplash 等远程源导入文件。
  </x-card>
  <x-card data-title="initStaticResourceMiddleware" data-icon="lucide:folder-static" data-href="/api-reference/uploader-server/static-resource">
    从其他已安装的 blocklet 中提供静态资源（例如图片、CSS），以实现资源共享。
  </x-card>
  <x-card data-title="initDynamicResourceMiddleware" data-icon="lucide:folder-sync" data-href="/api-reference/uploader-server/dynamic-resource">
    从指定目录提供资源，并可以实时监视文件更改，这对于开发非常有用。
  </x-card>
</x-cards>

## 后续步骤

`@blocklet/uploader-server` 包为您的 blocklet 中强大的文件处理系统提供了必要的服务器端构建块。通过组合这些中间件功能，您可以为用户创建功能丰富的上传体验。

要开始使用，我们建议您查阅 [initLocalStorageServer](./api-reference-uploader-server-local-storage.md) 文档，以设置核心的直接上传功能。