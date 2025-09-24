# 集成远程源 (Companion)

要允许用户从外部来源（如直接 URL 或 Unsplash 等服务）导入文件，您需要在后端设置 Uppy 的 Companion 服务。`@blocklet/uploader-server` 包提供了一个方便的 `initCompanion` 函数，可以简化此过程。

Companion 充当服务器端代理。它代表用户从远程提供商处获取文件，然后将文件流式传输到前端上传器组件，该组件随后继续执行正常的上传过程。虽然基本的文件上传无需自定义后端即可处理，但启用远程源需要设置 `@blocklet/uploader-server` 包。

### 工作原理

下图说明了当用户从远程源导入文件时的数据流：

```d2 远程源集成流程
direction: down

用户: {
  shape: c4-person
}

前端: {
  label: "前端 (浏览器)"
  shape: rectangle

  上传器组件: {
    label: "上传器组件"
    shape: rectangle
  }
}

后端: {
  label: "后端服务器"
  shape: rectangle

  Companion-Middleware: {
    label: "Companion 中间件\n(@blocklet/uploader-server)"
  }

  本地存储中间件: {
    label: "本地存储中间件"
    shape: rectangle
  }
}

远程源: {
  label: "远程源\n(例如, Unsplash, URL)"
  shape: cylinder
}

用户 -> 前端.上传器组件: "1. 选择文件"
前端.上传器组件 -> 后端.Companion-Middleware: "2. 请求文件"
后端.Companion-Middleware -> 远程源: "3. 获取文件"
远程源 -> 后端.Companion-Middleware: "4. 流式传输文件数据"
后端.Companion-Middleware -> 前端.上传器组件: "5. 返回浏览器"
前端.上传器组件 -> 后端.本地存储中间件: "6. 上传文件"
```

## 步骤 1：配置后端中间件

首先，您需要在 blocklet 的后端 Express 服务器中初始化并挂载 Companion 中间件。这包括调用 `initCompanion` 并将其添加到您的路由中。

```javascript 服务器端 Companion 设置 icon=logos:nodejs
import express from 'express';
import { initCompanion } from '@blocklet/uploader-server';

const router = express.Router();

// 用于远程源的 Companion 中间件
const companion = initCompanion({
  path: env.uploadDir, // 用于文件处理的临时目录
  express,
  providerOptions: {
    // 在此处配置提供商，例如 Unsplash
    unsplash: {
      key: process.env.UNSPLASH_KEY,
      secret: process.env.UNSPLASH_SECRET,
    },
  },
  uploadUrls: [env.appUrl], // 您的 blocklet 的公共 URL
});

// 将 companion 处理器挂载到特定路由上
router.use('/companion', companion.handle);
```

### `initCompanion` 选项

| 选项 | 类型 | 描述 |
| :--- | :--- | :--- |
| `path` | `string` | **必需。** Companion 在传输过程中临时存储文件的服务器目录。 |
| `express` | `Function` | **必需。** Express 应用实例。 |
| `providerOptions` | `Object` | 可选。远程提供商的配置。例如，要启用 Unsplash，您需要提供您的 API 密钥和密钥。有关提供商及其选项的完整列表，请参阅 [Uppy Companion 官方文档](https://uppy.io/docs/companion/providers/)。 |
| `uploadUrls` | `string[]` | 可选，但出于安全考虑强烈推荐。运行前端上传器的 URL 数组。这可以防止其他人使用您的 Companion 实例。 |

## 步骤 2：配置前端组件

设置好后端后，您需要配置前端 `<Uploader />` 组件以与您的 Companion 实例通信。您可以通过在 `apiPathProps` 属性中指定路由并启用所需的插件来完成此操作。

```jsx 使用 Companion 的上传器组件 icon=logos:react
import { Uploader } from '@blocklet/uploader';

function MyUploaderComponent() {
  return (
    <Uploader
      popup
      apiPathProps={{
        // 此路径必须与后端路由匹配
        companion: '/api/companion',
        // 用于最终上传的上传器路径
        uploader: '/api/uploads',
      }}
      plugins={[
        'Url', // 启用从直接 URL 导入
        'Unsplash', // 启用从 Unsplash 导入
        'Webcam',
      ]}
    />
  );
}
```

在后端中间件和前端组件都配置好后，上传器的仪表盘现在将显示“链接”(URL) 和 “Unsplash” 选项卡，允许用户直接从这些来源导入文件。

---

现在您已经可以处理来自本地和远程源的上传，您可能希望进一步扩展上传器的功能。在下一篇指南中，学习如何向上传器界面添加您自己的自定义选项卡。

<x-card data-title="创建自定义插件" data-icon="lucide:puzzle" data-href="/guides/custom-plugin" data-cta="阅读更多">
  通过使用提供的 VirtualPlugin 组件创建您自己的自定义插件选项卡来扩展上传器的功能。
</x-card>