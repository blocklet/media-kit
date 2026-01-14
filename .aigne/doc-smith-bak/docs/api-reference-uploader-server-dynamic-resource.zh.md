# initDynamicResourceMiddleware(options)

`initDynamicResourceMiddleware` 是一个功能强大的 Express 中间件，旨在动态地从一个或多个指定目录提供文件。与 `initStaticResourceMiddleware` 不同，它会实时主动监视文件系统的变化（添加、删除、修改），因此非常适合用于提供在运行时可能发生变化的内容，例如用户上传的文件、主题或插件。

它会构建一个内存中的资源映射以实现快速查找，并能妥善处理缓存、文件过滤和冲突解决。

## 工作原理

该中间件遵循清晰的生命周期：初始化、扫描、监视和服务。当请求传入时，它会在其内部映射中执行快速查找。如果被监视的目录中有文件被添加或删除，该映射会自动更新。

```d2
direction: down

App-Startup: {
  label: "应用程序启动"
  shape: oval
}

Middleware: {
  label: "动态资源中间件"
  shape: rectangle

  scan: {
    label: "1. 扫描目录"
    shape: rectangle
  }

  map: {
    label: "2. 构建资源映射"
    shape: cylinder
  }

  watch: {
    label: "3. 监视变化"
  }
}

Request-Handling: {
  label: "请求处理"
  shape: rectangle

  Request: {
    label: "传入请求\n(例如 GET /my-asset.png)"
    shape: rectangle
  }

  Lookup: {
    label: "4. 在映射中查找"
  }

  Serve: {
    label: "5a. 提供资源"
    shape: rectangle
  }

  Next: {
    label: "5b. 未找到，调用 next()"
    shape: rectangle
  }
}

File-System: {
  label: "文件系统事件\n(例如 文件已添加)"
  shape: rectangle
}

App-Startup -> Middleware.scan: "initDynamicResourceMiddleware(options)"
Middleware.scan -> Middleware.map
Middleware.scan -> Middleware.watch

Request-Handling.Request -> Request-Handling.Lookup
Request-Handling.Lookup -> Middleware.map: "读取"
Middleware.map -> Request-Handling.Lookup
Request-Handling.Lookup -> Request-Handling.Serve: "找到"
Request-Handling.Lookup -> Request-Handling.Next: "未找到"

File-System -> Middleware.watch: "触发事件"
Middleware.watch -> Middleware.map: "更新映射"
```

## 基本用法

以下是如何配置该中间件以从动态的 `uploads` 目录提供图片。

```javascript Server Setup icon=mdi:code
import express from 'express';
import { initDynamicResourceMiddleware } from '@blocklet/uploader-server';
import path from 'path';

const app = express();

const dynamicResourceMiddleware = initDynamicResourceMiddleware({
  resourcePaths: [
    {
      path: path.join(__dirname, 'uploads/images'),
      whitelist: ['.jpg', '.jpeg', '.png', '.gif'],
    },
  ],
  onReady: (count) => {
    console.log(`${count} 个动态资源已准备就绪，可以提供服务。`);
  },
  onFileChange: (filePath, event) => {
    console.log(`文件 ${filePath} 的事件为 ${event}。`);
  },
});

// 挂载中间件
app.use('/uploads/images', dynamicResourceMiddleware);

// 服务器关闭时，清理监视器
process.on('SIGINT', () => {
  if (dynamicResourceMiddleware.cleanup) {
    dynamicResourceMiddleware.cleanup();
  }
  process.exit();
});

app.listen(3000, () => {
  console.log('服务器正在端口 3000 上运行');
});
```

## 配置选项

`initDynamicResourceMiddleware` 函数接受一个包含以下属性的选项对象：

| 选项 | 类型 | 描述 |
| --- | --- | --- |
| `componentDid` | `string` | 可选。如果提供，只有当当前组件的 DID 与此值匹配时，中间件才会激活。 |
| `resourcePaths` | `DynamicResourcePath[]` | **必需。** 一个对象数组，用于定义要监视和提供服务的目录。详见下文。 |
| `watchOptions` | `object` | 可选。文件系统监视器的配置。 |
| `cacheOptions` | `object` | 可选。HTTP 缓存头的配置。 |
| `onFileChange` | `(filePath: string, event: string) => void` | 可选。当文件被更改、添加或删除时触发的回调函数。`event` 可以是 `'change'`、`'rename'` 或 `'delete'`。 |
| `onReady` | `(resourceCount: number) => void` | 可选。在初始扫描完成以及资源映射发生变化时运行的回调函数，提供可用资源的总数。 |
| `setHeaders` | `(res, filePath, stat) => void` | 可选。在提供文件之前，用于在响应上设置自定义头的函数。 |
| `conflictResolution` | `'first-match'` \| `'last-match'` \| `'error'` | 可选。用于处理多个目录包含同名文件时文件名冲突的策略。默认为 `'first-match'`。 |

### `DynamicResourcePath` 对象

`resourcePaths` 数组中的每个对象都定义了一个动态资源的来源。

| 属性 | 类型 | 描述 |
| --- | --- | --- |
| `path` | `string` | **必需。** 目录的绝对路径。它支持 glob 模式（例如 `/path/to/plugins/*/assets`），以监视多个匹配的目录。 |
| `whitelist` | `string[]` | 可选。要包含的文件扩展名数组（例如 `['.png', '.svg']`）。如果指定，则只提供具有这些扩展名的文件。 |
| `blacklist` | `string[]` | 可选。要排除的文件扩展名数组。 |

### `watchOptions` 对象

| 属性 | 类型 | 描述 |
| --- | --- | --- |
| `ignorePatterns` | `string[]` | 在监视期间要忽略的字符串模式或正则表达式数组。 |
| `persistent` | `boolean` | 如果为 `true`，只要文件被监视，进程就会继续运行。默认为 `true`。 |
| `usePolling` | `boolean` | 是否使用轮询来监视文件。对于某些网络文件系统可能是必需的。 |
| `depth` | `number` | 要监视的子目录深度。如果为 `undefined`，则递归监视。 |

### `cacheOptions` 对象

| 属性 | 类型 | 描述 |
| --- | --- | --- |
| `maxAge` | `string` \| `number` | 设置 `Cache-Control` 的 max-age 头。可以是一个以毫秒为单位的数字，或一个类似 `'365d'` 的字符串。默认为 `'365d'`。 |
| `immutable` | `boolean` | 如果为 `true`，则向 `Cache-Control` 头添加 `immutable` 指令。默认为 `true`。 |
| `etag` | `boolean` | 是否启用 ETag 生成。 |
| `lastModified` | `boolean` | 是否启用 `Last-Modified` 头。 |

## 高级用法

### 使用 Glob 模式

要从多个插件目录提供资源，您可以使用 glob 模式。中间件将找到所有匹配的目录并监视它们的变化。

```javascript Glob Pattern Example icon=mdi:folder-search-outline
const middleware = initDynamicResourceMiddleware({
  resourcePaths: [
    {
      // 监视 'plugins' 下每个目录内的 'assets' 文件夹
      path: path.join(__dirname, 'plugins', '*', 'assets'),
      whitelist: ['.css', '.js', '.png'],
    },
  ],
});
```

### 冲突解决

如果两个被监视的目录都包含一个名为 `logo.png` 的文件，`conflictResolution` 策略将决定提供哪一个：

-   `'first-match'` (默认): 使用初始扫描期间找到的第一个。后续找到的将被忽略。
-   `'last-match'`: 最后找到的将覆盖任何先前的条目。如果您有覆盖机制，这会很有用。
-   `'error'`: 向控制台记录一个错误以指示冲突，并且通常使用 first-match 的行为。

## 返回值

`initDynamicResourceMiddleware` 函数返回一个 Express 中间件函数。这个返回的函数上还附加了一个 `cleanup` 方法。

### `cleanup()`

在平滑关闭服务器期间应调用此方法。它会停止所有文件系统监视器并清除内部资源映射，以防止内存泄漏并释放文件句柄。

```javascript Cleanup Example icon=mdi:power-plug-off
const server = app.listen(3000);
const dynamicMiddleware = initDynamicResourceMiddleware(/* ...options */);

// ...

function gracefulShutdown() {
  console.log('正在关闭服务器...');
  if (dynamicMiddleware.cleanup) {
    dynamicMiddleware.cleanup();
  }
  server.close(() => {
    console.log('服务器已关闭。');
    process.exit(0);
  });
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
```