# 後端：@blocklet/uploader-server

`@blocklet/uploader-server` 套件提供了一套 Express.js 中介軟體，旨在處理您 blocklet 後端的各種檔案處理任務。它作為 `@blocklet/uploader` 前端元件的伺服器端對應部分，可實現直接檔案上傳、與遠端來源整合以及資源服務等功能。

雖然它設計為與其前端夥伴無縫協作，但也可以作為獨立解決方案，用於自訂的檔案上傳邏輯。該套件匯出了幾個模組化的中介軟體初始化器，您可以輕鬆地將它們整合到您的 Express 應用程式中。

### 核心中介軟體互動

下圖說明了主要的中介軟體元件在上傳過程中如何與前端和外部服務互動。

```d2
direction: down

Frontend-Uploader: {
  label: "@blocklet/uploader"
}

Backend-Server: {
  label: "Express 伺服器"
  shape: rectangle

  uploader-server-middleware: {
    label: "@blocklet/uploader-server"

    initLocalStorageServer
    initCompanion
  }
}

Remote-Sources: {
  label: "遠端來源\n（例如 Unsplash）"
  shape: cylinder
}

File-Storage: {
  label: "伺服器檔案系統"
  shape: cylinder
}

Frontend-Uploader -> Backend-Server.uploader-server-middleware.initLocalStorageServer: "直接上傳"
Frontend-Uploader -> Backend-Server.uploader-server-middleware.initCompanion: "遠端上傳請求"
Backend-Server.uploader-server-middleware.initCompanion -> Remote-Sources: "擷取檔案"
Backend-Server.uploader-server-middleware.initLocalStorageServer -> File-Storage: "儲存檔案"

```

## 安裝

首先，將此套件新增至您 blocklet 的依賴項中。

```bash Installation icon=mdi:language-bash
pnpm add @blocklet/uploader-server
```

## 一般用法

這是一個典型的範例，展示如何將上傳和 companion 中介軟體整合到您的 Express 應用程式的路由器中。您可以初始化所需的中介軟體，然後將它們的處理程式掛載到特定的路由上。

```javascript Express Router Example icon=logos:javascript
import { initLocalStorageServer, initCompanion } from '@blocklet/uploader-server';
import express from 'express';

// 假設 `env`、`user`、`auth`、`ensureComponentDid` 和 `Upload` 模型已在其他地方定義
const router = express.Router();

// 1. 初始化用於直接上傳的本地儲存伺服器
const localStorageServer = initLocalStorageServer({
  path: env.uploadDir, // 用於儲存上傳檔案的目錄
  express,
  // 選用：檔案成功上傳後執行的回呼函式
  onUploadFinish: async (req, res, uploadMetadata) => {
    const {
      id: filename,
      size,
      metadata: { filename: originalname, filetype: mimetype },
    } = uploadMetadata;

    // 為上傳的檔案建構公開 URL
    const obj = new URL(env.appUrl);
    obj.protocol = req.get('x-forwarded-proto') || req.protocol;
    obj.pathname = `/uploads/${filename}`;

    // 將檔案元資料儲存到資料庫
    const doc = await Upload.insert({
      mimetype,
      originalname,
      filename,
      size,
      // ... 來自請求的其他元資料
    });

    // 向前端返回 JSON 回應
    const resData = { url: obj.href, ...doc };
    return resData;
  },
});

// 將上傳處理程式掛載到特定路由上
router.use('/uploads', user, auth, ensureComponentDid, localStorageServer.handle);

// 2. 為遠端來源（例如 URL、Unsplash）初始化 Companion
const companion = initCompanion({
  path: env.uploadDir,
  express,
  providerOptions: env.providerOptions, // 您的提供者金鑰（例如 Unsplash）
  uploadUrls: [env.appUrl], // 您應用程式的 URL
});

// 將 companion 處理程式掛載到其路由上
router.use('/companion', user, auth, ensureComponentDid, companion.handle);
```

## 可用的中介軟體

該套件為不同功能匯出了幾個中介軟體初始化器。點擊卡片以查看其詳細的 API 參考和配置選項。

<x-cards data-columns="2">
  <x-card data-title="initLocalStorageServer" data-icon="lucide:hard-drive-upload" data-href="/api-reference/uploader-server/local-storage">
    處理來自使用者電腦的直接檔案上傳，並將其儲存到伺服器的本地儲存空間。
  </x-card>
  <x-card data-title="initCompanion" data-icon="lucide:link" data-href="/api-reference/uploader-server/companion">
    與 Uppy Companion 整合，允許使用者從直接 URL 和 Unsplash 等遠端來源匯入檔案。
  </x-card>
  <x-card data-title="initStaticResourceMiddleware" data-icon="lucide:folder-static" data-href="/api-reference/uploader-server/static-resource">
    從其他已安裝的 blocklet 提供靜態資產（例如圖片、CSS），實現資源共享。
  </x-card>
  <x-card data-title="initDynamicResourceMiddleware" data-icon="lucide:folder-sync" data-href="/api-reference/uploader-server/dynamic-resource">
    從指定目錄提供資源，並能即時監控檔案變更，對開發很有用。
  </x-card>
</x-cards>

## 後續步驟

`@blocklet/uploader-server` 套件為您 blocklet 中強大的檔案處理系統提供了必要的伺服器端建構區塊。透過結合這些中介軟體功能，您可以為您的使用者創造功能豐富的上傳體驗。

首先，我們建議您探索 [initLocalStorageServer](./api-reference-uploader-server-local-storage.md) 文件，以設定核心的直接上傳功能。