# initCompanion(options)

`initCompanion` 函数用于初始化和配置 Uppy Companion 中间件，该中间件是让用户能够从 Unsplash、Google Drive、Instagram 或直接 URL 等远程来源导入文件的关键。此函数是对官方 [`@uppy/companion`](https://uppy.io/docs/companion/) 库的封装，旨在实现与 blocklet 环境的无缝集成。

有关设置此功能的实用指南，请参阅[集成远程来源 (Companion)](./guides-remote-sources.md)。

### 工作原理

Companion 充当服务器端代理。当用户从远程来源选择文件时，请求会发送到您后端的 Companion 端点。然后，您的服务器从远程来源获取文件，并以流的形式传回用户的浏览器。文件到达浏览器后，会被当作本地文件处理，并上传到您的最终目的地（例如，由 `initLocalStorageServer` 处理的端点）。

```d2 How Companion Works icon=mdi:diagram-outline
direction: down

User: {
  shape: c4-person
}

Frontend: {
  label: "前端 (浏览器)"
  shape: rectangle

  Uploader-Component: {
    label: "上传器组件"
    shape: rectangle
  }
}

Backend: {
  label: "后端服务器"
  shape: rectangle

  Companion-Middleware: {
    label: "Companion 中间件\n(@blocklet/uploader-server)"
  }

  Local-Storage-Middleware: {
    label: "本地存储中间件"
    shape: rectangle
  }
}

Remote-Source: {
  label: "远程来源\n(例如 Unsplash, URL)"
  shape: cylinder
}

User -> Frontend.Uploader-Component: "1. 选择远程文件"
Frontend.Uploader-Component -> Backend.Companion-Middleware: "2. 请求文件"
Backend.Companion-Middleware -> Remote-Source: "3. 获取文件"
Remote-Source -> Backend.Companion-Middleware: "4. 流式传输文件数据"
Backend.Companion-Middleware -> Frontend.Uploader-Component: "5. 流式传输回浏览器"
Frontend.Uploader-Component -> Backend.Local-Storage-Middleware: "6. 上传文件 (Tus)"

```

### 使用方法

要使用 Companion，首先用你的配置选项来初始化它，然后将其 `handle` 附加到一个 Express 路由路径上。前端的 `Uploader` 组件必须为其 `companionUrl` 属性配置相同的路径。

```javascript Basic Companion Setup icon=logos:javascript
import express from 'express';
import { initCompanion } from '@blocklet/uploader-server';

const router = express.Router();

// Companion 的基本配置
const companion = initCompanion({
  // 服务器上用于处理文件的临时目录
  path: '/tmp/uploads',
  express,
  // 包含必要密钥和机密的提供商选项
  providerOptions: {
    unsplash: {
      key: process.env.UNSPLASH_KEY,
      secret: process.env.UNSPLASH_SECRET,
    },
  },
  // 你的 blocklet 的公共 URL，某些提供商需要
  uploadUrls: [process.env.APP_URL],
});

// 将 companion 中间件挂载到特定路径
// 此路径应与前端的 `companionUrl` 属性匹配
router.use('/companion', companion.handle);
```

### 参数

`initCompanion` 函数接受一个包含以下属性的选项对象：

| Name              | Type       | Description                                                                                                                                                                                          |
| ----------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `path`            | `string`   | **必需。** 服务器上用于在处理过程中存储文件的临时目录的绝对路径。这对应于 Uppy Companion 中的 `filePath` 选项。                        |
| `express`         | `Function` | **必需。** Express 应用程序实例。用于为 Companion 创建必要的子应用和中间件堆栈。                                                                        |
| `providerOptions` | `object`   | 可选。一个对象，包含您要启用的每个远程提供商的配置。每个键是提供商的名称（例如 `unsplash`），值是其配置，如 API 密钥和机密。 |
| `...restProps`    | `any`      | 任何其他来自官方 [Uppy Companion 选项](https://uppy.io/docs/companion/options/) 的有效选项都可以在此处传递。例如，`uploadUrls` 是一个常用且通常是必需的选项。          |

### 返回值

该函数返回一个 `companion` 实例，其中包含以下关键属性：

| Property            | Type       | Description                                                                                                                                                                                                                              |
| ------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `handle`            | `Function` | 一个 Express 中间件，您必须将其挂载到一个路由上（例如 `/companion`）。此句柄包含处理远程文件请求的所有逻辑。                                                                                |
| `setProviderOptions`| `(options: object) => void` | 一个方法，允许您在初始化后动态更新 `providerOptions`。如果您需要从数据库加载 API 密钥或在不重启服务器的情况下更改配置，这将非常有用。 |

#### 示例：动态提供商选项

您可以在运行时更改提供商选项，这对于多租户应用程序或异步加载机密时非常有用。

```javascript Dynamic Provider Options icon=logos:javascript
// 初始化 companion 时，最初不带提供商选项
const companion = initCompanion({
  path: '/tmp/uploads',
  express,
});

// 之后，可能在从数据库获取机密之后
async function updateCompanionConfig() {
  const secrets = await getSecretsFromDb();
  companion.setProviderOptions({
    unsplash: {
      key: secrets.unsplashKey,
      secret: secrets.unsplashSecret,
    },
  });
}
```

### 附加功能

- **状态码重写**：为了安全和更好的错误处理，如果远程提供商返回状态码为 500 或更高的错误，此中间件会自动将其重写为 `400 Bad Request`。这可以防止潜在的服务器错误详情泄露给客户端。

---

设置好 Companion 后，您的上传器现在能够处理来自各种来源的文件。您可能还需要从您的 blocklet 或其他 blocklet 提供静态文件。

<x-cards>
  <x-card data-title="指南：集成远程来源" data-icon="lucide:link" data-href="/guides/remote-sources">
    一份分步指南，用于配置前端和后端的远程上传功能。
  </x-card>
  <x-card data-title="API：initStaticResourceMiddleware" data-icon="lucide:file-code" data-href="/api-reference/uploader-server/static-resource">
    了解如何从其他已安装的 blocklet 提供静态资源。
  </x-card>
</x-cards>