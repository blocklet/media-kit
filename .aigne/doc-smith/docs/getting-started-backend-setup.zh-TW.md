# 後端設定 (@blocklet/uploader-server)

本指南將引導您在基於 Express.js 的 blocklet 中設定 `@blocklet/uploader-server` 套件。此套件提供了必要的伺服器端中介軟體，以處理由 `@blocklet/uploader` 前端元件發起的檔案上傳。

雖然前端 `@blocklet/uploader` 可以與任何支援 Tus 可續傳上傳協定的自訂後端一起使用，但 `@blocklet/uploader-server` 提供了一個立即可用的整合解決方案，可處理本地檔案儲存、元資料處理以及過期上傳的清理。

## 上傳流程概覽

下圖說明了當使用者使用前端元件和後端伺服器中介軟體上傳檔案時的典型資料流程。

```d2
direction: down

User: {
  shape: c4-person
  label: "使用者"
}

App: {
  label: "您的 Blocklet 應用程式"
  shape: rectangle

  Uploader-Component: {
    label: "上傳器元件\n(前端)"
    shape: rectangle
  }

  Backend-Server: {
    label: "後端伺服器 (Express)"
    shape: rectangle

    Uploader-Middleware: {
      label: "@blocklet/uploader-server\n(initLocalStorageServer)"
    }

    File-System: {
      label: "上傳目錄"
      shape: cylinder
    }

    Database: {
      label: "資料庫"
      shape: cylinder
    }
  }
}

User -> App.Uploader-Component: "1. 選擇並拖放檔案"
App.Uploader-Component -> App.Backend-Server.Uploader-Middleware: "2. 上傳檔案區塊 (Tus 協定)"
App.Backend-Server.Uploader-Middleware -> App.File-System: "3. 將檔案儲存到磁碟"
App.Backend-Server.Uploader-Middleware -> App.Backend-Server.Uploader-Middleware: "4. 觸發 onUploadFinish 回呼"
App.Backend-Server.Uploader-Middleware -> App.Database: "5. 儲存檔案元資料"
App.Database -> App.Backend-Server.Uploader-Middleware: "6. 回傳已儲存的記錄"
App.Backend-Server.Uploader-Middleware -> App.Uploader-Component: "7. 發送帶有檔案 URL 的 JSON 回應"
App.Uploader-Component -> User: "8. 以最終檔案更新 UI"
```

## 步驟 1：安裝

首先，將此套件新增至您的 blocklet 的依賴項中。

```bash
pnpm add @blocklet/uploader-server
```

## 步驟 2：基本設定

此套件的主要匯出是 `initLocalStorageServer`。此函數會建立一個 Express 中介軟體，用於處理檔案上傳並將其儲存在本地檔案系統中。

在您的 blocklet 中建立一個新的路由檔案（例如 `routes/uploads.js`），並新增以下基本設定：

```javascript Basic upload endpoint icon=logos:javascript
import express from 'express';
import { initLocalStorageServer } from '@blocklet/uploader-server';

const router = express.Router();

// 初始化上傳器伺服器中介軟體
const localStorageServer = initLocalStorageServer({
  path: process.env.UPLOAD_DIR, // 用於儲存上傳檔案的目錄
  express,
});

// 掛載上傳器中介軟體以處理此路由的所有請求
router.use('/', localStorageServer.handle);

export default router;
```

在這個最小化的設定中：
- 我們匯入 `initLocalStorageServer`。
- 我們使用 `path` 選項呼叫它，該選項指定伺服器上儲存檔案的目錄。這應該是一個絕對路徑。
- 我們將 `express` 物件本身傳遞給中介軟體。
- 最後，我們將回傳的處理常式掛載到我們的路由器上。

現在，您可以在您的主 `app.js` 檔案中掛載此路由器：

```javascript app.js icon=logos:javascript
// ... 其他匯入
import uploadRouter from './routes/uploads';

// ... 應用程式設定
app.use('/api/uploads', uploadRouter);
```

完成此設定後，您的後端現在已準備好在 `/api/uploads` 端點接收檔案上傳。

## 步驟 3：處理上傳完成

僅僅儲存檔案是不夠的；您通常需要將其元資料儲存到資料庫，並向前傳回傳一個可公開存取的 URL。這是透過 `onUploadFinish` 回呼來完成的。

`onUploadFinish` 函數在檔案成功且完整地上傳到伺服器後執行。

以下是一個更完整的範例，示範如何使用它：

```javascript Full backend example icon=logos:javascript
import { initLocalStorageServer } from '@blocklet/uploader-server';
import express from 'express';
import url from 'url';
import path from 'path';

// 假設您有一個用於上傳的資料庫模型
// import Upload from '../models/upload';

const router = express.Router();

const localStorageServer = initLocalStorageServer({
  path: process.env.UPLOAD_DIR,
  express,
  onUploadFinish: async (req, res, uploadMetadata) => {
    // 1. 從已完成的上傳中解構元資料
    const {
      id: filename, // 磁碟上唯一的隨機檔案名稱
      size,
      metadata: { filename: originalname, filetype: mimetype },
    } = uploadMetadata;

    // 2. 建構檔案的公開 URL
    const publicUrl = new URL(process.env.APP_URL);
    publicUrl.pathname = path.join('/api/uploads', filename);

    // 3. (可選但建議) 將檔案元資料儲存到您的資料庫
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

    // 4. 向前端回傳一個 JSON 物件。此物件將可用於
    // 前端的 onUploadSuccess 回呼中。
    const responseData = {
      url: publicUrl.href,
      // ...doc, // 如果您建立了一個資料庫記錄，請包含它
    };

    return responseData;
  },
});

// 掛載處理常式。任何用於身份驗證的中介軟體（如 `user`、`auth`）
// 都應放在處理常式之前。
router.use('/', localStorageServer.handle);

export default router;
```

### 關鍵點：

- **`uploadMetadata`**：此物件包含有關上傳檔案的所有資訊，包括其唯一 ID（也是其在磁碟上的檔案名稱）、大小以及從客戶端發送的原始元資料（如 `originalname` 和 `mimetype`）。
- **資料庫整合**：此回呼是您在資料庫中建立記錄的理想位置，該記錄可將上傳的檔案與使用者或您應用程式中的其他資源連結起來。
- **回傳值**：由 `onUploadFinish` 回傳的物件會被序列化為 JSON 並作為回應發送給前端。前端的 `onUploadSuccess` 回呼將接收到此物件，從而得知上傳檔案的最終 URL。

## 後續步驟

設定好後端後，您就可以探索更多進階功能和自訂選項了。

<x-cards>
  <x-card data-title="處理上傳" data-icon="lucide:upload-cloud" data-href="/guides/handling-uploads">
    深入了解 `onUploadFinish` 回呼，並學習如何在客戶端和伺服器上處理檔案元資料。
  </x-card>
  <x-card data-title="整合遠端來源" data-icon="lucide:link" data-href="/guides/remote-sources">
    學習如何設定 Companion 中介軟體，以允許使用者從 URL、Unsplash 等來源匯入檔案。
  </x-card>
  <x-card data-title="initLocalStorageServer() API" data-icon="lucide:book-open" data-href="/api-reference/uploader-server/local-storage">
    探索完整的 API 參考，了解所有可用於自訂本地儲存中介軟體的選項。
  </x-card>
</x-cards>