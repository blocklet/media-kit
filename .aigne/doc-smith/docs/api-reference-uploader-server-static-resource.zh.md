# initStaticResourceMiddleware(options)

`initStaticResourceMiddleware` 是一个功能强大的 Express 中间件，旨在从其他已安装的 blocklet 中提供静态资源。这使得您的应用程序可以从依赖组件中访问共享资源，例如图片、样式表或字体，而无需了解它们在文件系统中的确切位置。

该中间件的工作原理是扫描与指定资源类型匹配的已安装 blocklet 的目录，并创建一个可用文件的内存映射。当请求到达时，它会高效地在此映射中查找并提供文件。

### 工作原理

以下是该过程的概要总览：

```d2
direction: down

Browser: {
  shape: c4-person
  label: "用户浏览器"
}

Your-Blocklet: {
  label: "你的 Blocklet"
  shape: rectangle

  Express-Server: {
    label: "Express 服务器"
  }

  Static-Middleware: {
    label: "initStaticResourceMiddleware"
  }
}

Dependent-Blocklets: {
    label: "依赖的 Blocklets"
    shape: rectangle
    style.stroke-dash: 2
    grid-columns: 2

    Image-Bin: {
        label: "Image Bin Blocklet"
        shape: cylinder
        imgpack: {
            label: "imgpack/"
            "logo.png"
        }
    }

    Theme-Blocklet: {
        label: "主题 Blocklet"
        shape: rectangle
        assets: {
            label: "assets/"
            "style.css"
        }
    }
}

Your-Blocklet.Express-Server -> Your-Blocklet.Static-Middleware: "1. 使用配置进行初始化"
Your-Blocklet.Static-Middleware -> Dependent-Blocklets: "2. 扫描资源"
Browser -> Your-Blocklet.Express-Server: "3. GET /logo.png"
Your-Blocklet.Static-Middleware -> Browser: "4. 从 Image Bin 提供文件"

```

### 用法

要使用该中间件，请将其导入并添加到您的 Express 应用程序中。您需要配置它应查找的资源类型。

```javascript server.js icon=logos:express
import express from 'express';
import { initStaticResourceMiddleware } from '@blocklet/uploader-server';

const app = express();

// 初始化中间件以提供类型为 'imgpack' 的资源
// 从任何提供该资源的已安装 blocklet 中获取。
app.use(
  initStaticResourceMiddleware({
    express,
    resourceTypes: ['imgpack'], // 使用字符串进行简单配置
  })
);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

在此示例中，如果另一个已安装的 blocklet 的 `blocklet.yml` 中有一个类型为 `imgpack` 的资源条目，那么该资源目录下的任何文件都将被提供。例如，对 `/example.png` 的请求将从该 blocklet 中提供 `example.png` 文件。

### 选项

`initStaticResourceMiddleware` 函数接受一个包含以下属性的配置对象：

| Option | Type | Description |
| --- | --- | --- |
| `express` | `object` | **必需。** Express 应用程序实例。 |
| `resourceTypes` | `(string \| ResourceType)[]` | **必需。** 定义要扫描的资源类型的数组。详见下方的 `ResourceType` 对象。 |
| `options` | `object` | 可选。传递给底层 `serve-static` 处理程序的配置对象。常见属性包括用于控制缓存头的 `maxAge`（例如 '365d'）和 `immutable`（例如 `true`）。 |
| `skipRunningCheck` | `boolean` | 可选。如果为 `true`，中间件将扫描已安装但当前未运行的 blocklet。默认为 `false`。 |

### `ResourceType` 对象

为了进行更精细的控制，您可以向 `resourceTypes` 选项提供一个对象数组，而不是简单的字符串。每个对象可以包含以下属性：

| Property | Type | Description |
| --- | --- | --- |
| `type` | `string` | **必需。** 资源类型的名称，应与依赖的 blocklet 的 `blocklet.yml` 中定义的类型匹配。 |
| `did` | `string` | **必需。** 提供该资源的 blocklet 组件的 DID。您可以使用 `ImageBinDid` 来指定标准的 Media Kit。 |
| `folder` | `string \| string[]` | 可选。在资源目录内要扫描的特定子文件夹或子文件夹数组。默认为资源目录的根目录（`''`）。 |
| `whitelist` | `string[]` | 可选。要包含的文件扩展名数组（例如 `['.png', '.jpg']`）。如果提供此项，则仅提供具有这些扩展名的文件。 |
| `blacklist` | `string[]` | 可选。要排除的文件扩展名数组（例如 `['.md', '.txt']`）。 |
| `setHeaders` | `(res, path, stat) => void` | 可选。一个用于为所提供的文件设置自定义响应头的函数。 |
| `immutable` | `boolean` | 可选。为此特定资源类型覆盖顶层的 `options.immutable`，以控制 `Cache-Control` 头部。 |
| `maxAge` | `string` | 可选。为此特定资源类型覆盖顶层的 `options.maxAge`。 |

### 高级示例

此示例演示了一个更复杂的配置，用于根据特定规则提供两种不同类型的资源。

```javascript server.js icon=logos:express
import express from 'express';
import { initStaticResourceMiddleware } from '@blocklet/uploader-server';
import { ImageBinDid } from '@blocklet/uploader-server/constants';

const app = express();

app.use(
  initStaticResourceMiddleware({
    express,
    skipRunningCheck: true,
    resourceTypes: [
      {
        type: 'imgpack',
        did: ImageBinDid,
        folder: 'public/images',
        whitelist: ['.png', '.jpg', '.gif'],
      },
      {
        type: 'theme-assets',
        did: 'z2q...someThemeBlockletDid', // 特定主题 blocklet 的 DID
        folder: ['css', 'fonts'],
        blacklist: ['.map'],
      },
    ],
    options: {
      maxAge: '7d', // 默认缓存 7 天
    },
  })
);

app.listen(3000);
```

此配置执行以下操作：
1.  扫描由 Media Kit (`ImageBinDid`) 提供的 `imgpack` 资源，但仅限于 `public/images` 子文件夹，并且只提供 `.png`、`.jpg` 和 `.gif` 文件。
2.  从具有特定 DID 的 blocklet 中扫描 `theme-assets` 资源，在 `css` 和 `fonts` 子文件夹中查找，并忽略任何源映射（`.map`）文件。
3.  为所有匹配的文件设置默认的 `Cache-Control` max-age 为 7 天。

### 自动更新

该中间件专为动态环境设计。它会自动监听 blocklet 的生命周期事件。如果组件被添加、移除、启动、停止或更新，中间件将自动重新扫描并更新其内部资源映射，因此您无需重启应用程序。

---

接下来，学习如何从一个可以实时更新而无需重启应用程序的目录中提供文件。

<x-card data-title="initDynamicResourceMiddleware(options)" data-icon="lucide:file-diff" data-href="/api-reference/uploader-server/dynamic-resource" data-cta="Read More">
用于从指定目录提供动态资源的 API 参考，支持实时文件监视。
</x-card>