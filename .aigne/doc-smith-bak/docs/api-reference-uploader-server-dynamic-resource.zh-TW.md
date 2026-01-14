# initDynamicResourceMiddleware(options)

`initDynamicResourceMiddleware` 是一個功能強大的 Express 中介軟體，專為動態提供來自一或多個指定目錄的檔案而設計。與 `initStaticResourceMiddleware` 不同，它會即時主動監控檔案系統的變更（新增、刪除、修改），因此非常適合提供在執行期間可能變更的內容，例如使用者上傳的檔案、佈景主題或外掛程式。

它會建立一個記憶體內的資源對應表以進行快速查詢，並妥善處理快取、檔案過濾和衝突解決。

## 運作方式

此中介軟體遵循清晰的生命週期：初始化、掃描、監控和提供服務。當請求傳入時，它會在內部對應表中執行快速查詢。如果有檔案從受監控的目錄中新增或移除，對應表將會自動更新。

```d2
direction: down

App-Startup: {
  label: "應用程式啟動"
  shape: oval
}

Middleware: {
  label: "動態資源中介軟體"
  shape: rectangle

  scan: {
    label: "1. 掃描目錄"
    shape: rectangle
  }

  map: {
    label: "2. 建立資源對應表"
    shape: cylinder
  }

  watch: {
    label: "3. 監控變更"
  }
}

Request-Handling: {
  label: "請求處理"
  shape: rectangle

  Request: {
    label: "傳入的請求\n(例如 GET /my-asset.png)"
    shape: rectangle
  }

  Lookup: {
    label: "4. 在對應表中查詢"
  }

  Serve: {
    label: "5a. 提供資源"
    shape: rectangle
  }

  Next: {
    label: "5b. 找不到，呼叫 next()"
    shape: rectangle
  }
}

File-System: {
  label: "檔案系統事件\n(例如 檔案已新增)"
  shape: rectangle
}

App-Startup -> Middleware.scan: "initDynamicResourceMiddleware(options)"
Middleware.scan -> Middleware.map
Middleware.scan -> Middleware.watch

Request-Handling.Request -> Request-Handling.Lookup
Request-Handling.Lookup -> Middleware.map: "讀取"
Middleware.map -> Request-Handling.Lookup
Request-Handling.Lookup -> Request-Handling.Serve: "找到"
Request-Handling.Lookup -> Request-Handling.Next: "找不到"

File-System -> Middleware.watch: "觸發事件"
Middleware.watch -> Middleware.map: "更新對應表"
```

## 基本用法

以下是如何設定中介軟體以提供來自 `uploads` 動態目錄中的圖片。

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
    console.log(`${count} 個動態資源已準備好提供服務。`);
  },
  onFileChange: (filePath, event) => {
    console.log(`檔案 ${filePath} 已 ${event}。`);
  },
});

// 掛載中介軟體
app.use('/uploads/images', dynamicResourceMiddleware);

// 在伺服器關閉時，清理監控器
process.on('SIGINT', () => {
  if (dynamicResourceMiddleware.cleanup) {
    dynamicResourceMiddleware.cleanup();
  }
  process.exit();
});

app.listen(3000, () => {
  console.log('伺服器正在 3000 連接埠上執行');
});
```

## 設定選項

`initDynamicResourceMiddleware` 函式接受一個包含以下屬性的選項物件：

| Option | Type | Description |
| --- | --- | --- |
| `componentDid` | `string` | 選用。如果提供，只有當前元件的 DID 與此值相符時，中介軟體才會啟動。 |
| `resourcePaths` | `DynamicResourcePath[]` | **必填。** 一個物件陣列，用於定義要監控和提供服務的目錄。詳情見下文。 |
| `watchOptions` | `object` | 選用。檔案系統監控器的設定。 |
| `cacheOptions` | `object` | 選用。HTTP 快取標頭的設定。 |
| `onFileChange` | `(filePath: string, event: string) => void` | 選用。當檔案被變更、新增或刪除時觸發的回呼函式。`event` 的值可以是 `'change'`、`'rename'` 或 `'delete'`。 |
| `onReady` | `(resourceCount: number) => void` | 選用。在初始掃描完成後以及資源對應表變更時執行的回呼函式，提供可用資源的總數。 |
| `setHeaders` | `(res, filePath, stat) => void` | 選用。在提供檔案前，用於在回應上設定自訂標頭的函式。 |
| `conflictResolution` | `'first-match'` \| `'last-match'` \| `'error'` | 選用。處理當多個目錄包含同名檔案時的檔名衝突策略。預設為 `'first-match'`。 |

### `DynamicResourcePath` 物件

`resourcePaths` 陣列中的每個物件都定義了一個動態資產的來源。

| Property | Type | Description |
| --- | --- | --- |
| `path` | `string` | **必填。** 目錄的絕對路徑。支援 glob 模式（例如 `/path/to/plugins/*/assets`）以監控多個符合的目錄。 |
| `whitelist` | `string[]` | 選用。要包含的副檔名陣列（例如 `['.png', '.svg']`）。如果指定，則只會提供具有這些副檔名的檔案。 |
| `blacklist` | `string[]` | 選用。要排除的副檔名陣列。 |

### `watchOptions` 物件

| Property | Type | Description |
| --- | --- | --- |
| `ignorePatterns` | `string[]` | 在監控期間要忽略的字串模式或正規表示式陣列。 |
| `persistent` | `boolean` | 如果為 `true`，只要檔案正在被監控，程序就會繼續執行。預設為 `true`。 |
| `usePolling` | `boolean` | 是否使用輪詢方式監控檔案。對於某些網路檔案系統可能是必要的。 |
| `depth` | `number` | 要監控的子目錄深度。如果為 `undefined`，則會遞迴監控。 |

### `cacheOptions` 物件

| Property | Type | Description |
| --- | --- | --- |
| `maxAge` | `string` \| `number` | 設定 `Cache-Control` 的 max-age 標頭。可以是一個以毫秒為單位的數字，或是一個像 `'365d'` 的字串。預設為 `'365d'`。 |
| `immutable` | `boolean` | 如果為 `true`，會將 `immutable` 指令新增到 `Cache-Control` 標頭。預設為 `true`。 |
| `etag` | `boolean` | 是否啟用 ETag 生成。 |
| `lastModified` | `boolean` | 是否啟用 `Last-Modified` 標頭。 |

## 進階用法

### 使用 Glob 模式

若要從多個外掛程式目錄提供資產，您可以使用 glob 模式。中介軟體將會找到所有符合的目錄並監控其變更。

```javascript Glob Pattern Example icon=mdi:folder-search-outline
const middleware = initDynamicResourceMiddleware({
  resourcePaths: [
    {
      // 監控 'plugins' 下每個目錄內的 'assets' 資料夾
      path: path.join(__dirname, 'plugins', '*', 'assets'),
      whitelist: ['.css', '.js', '.png'],
    },
  ],
});
```

### 衝突解決

如果兩個受監控的目錄都包含一個名為 `logo.png` 的檔案，則 `conflictResolution` 策略會決定提供哪一個：

-   `'first-match'` (預設)：使用初始掃描期間找到的第一個。後續找到的將被忽略。
-   `'last-match'`：最後找到的將覆寫任何先前的條目。如果您有覆寫機制，這會很有用。
-   `'error'`：在主控台記錄一條錯誤訊息以指示衝突，通常會使用 first-match 的行為。

## 回傳值

`initDynamicResourceMiddleware` 函式會回傳一個 Express 中介軟體函式。這個回傳的函式上還附加了一個 `cleanup` 方法。

### `cleanup()`

這個方法應在伺服器平穩關機期間呼叫。它會停止所有檔案系統監控器並清除內部資源對應表，以防止記憶體洩漏並釋放檔案控制代碼。

```javascript Cleanup Example icon=mdi:power-plug-off
const server = app.listen(3000);
const dynamicMiddleware = initDynamicResourceMiddleware(/* ...options */);

// ...

function gracefulShutdown() {
  console.log('正在關閉伺服器...');
  if (dynamicMiddleware.cleanup) {
    dynamicMiddleware.cleanup();
  }
  server.close(() => {
    console.log('伺服器已關閉。');
    process.exit(0);
  });
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
```