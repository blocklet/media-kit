# initLocalStorageServer(options)

`initLocalStorageServer` 函式是處理從使用者裝置直接上傳檔案到您的 blocklet 本地儲存的核心中介軟體。它利用了強大的 [Tus 可續傳上傳協定](https://tus.io/)，確保上傳的可靠性，並能在網路中斷後恢復。

此中介軟體負責接收檔案區塊，在伺服器上將它們組合成一個完整的檔案，並在檔案上傳完成後觸發回呼函式，供您處理檔案元資料。

### 運作方式

下圖說明了當使用者使用連接到帶有 `initLocalStorageServer` 的後端的 `Uploader` 元件上傳檔案時的典型資料流。

```d2 Upload Flow Diagram
direction: down

User: { 
  shape: c4-person 
}

App: {
  label: "您的 Blocklet 應用程式"
  shape: rectangle

  Uploader-Component: {
    label: "<Uploader /> 元件"
    shape: rectangle
  }

  Backend-Server: {
    label: "後端伺服器"
    shape: rectangle

    Uploader-Server: {
      label: "initLocalStorageServer"
    }

    DB: {
      label: "資料庫"
      shape: cylinder
    }
  }
}

User -> App.Uploader-Component: "1. 拖放檔案"
App.Uploader-Component -> App.Backend-Server.Uploader-Server: "2. 上傳檔案區塊 (Tus)"
App.Backend-Server.Uploader-Server -> App.Backend-Server.Uploader-Server: "3. 觸發 onUploadFinish hook"
App.Backend-Server.Uploader-Server -> App.Backend-Server.DB: "4. 儲存檔案元資料"
App.Backend-Server.DB -> App.Backend-Server.Uploader-Server: "5. 回傳資料庫記錄"
App.Backend-Server.Uploader-Server -> App.Uploader-Component: "6. 發送 JSON 回應"
App.Uploader-Component -> App.Uploader-Component: "7. 觸發前端 onUploadFinish"
App.Uploader-Component -> User: "8. 使用檔案 URL 更新 UI"

```

### 基本用法

首先，在您的 Express 應用程式中初始化中介軟體，並將其掛載到特定路由上。最關鍵的選項是 `onUploadFinish`，您將在此定義檔案成功儲存後要執行的操作。

```javascript Basic Backend Setup icon=logos:express
import express from 'express';
import { initLocalStorageServer } from '@blocklet/uploader-server';
import Upload from '../models/upload'; // 您的資料庫模型

const router = express.Router();

// 初始化上傳伺服器中介軟體
const localStorageServer = initLocalStorageServer({
  // 上傳檔案將儲存的目錄
  path: process.env.UPLOAD_DIR,
  express,

  // 此回呼函式在檔案成功上傳後執行
  onUploadFinish: async (req, res, uploadMetadata) => {
    const {
      id: filename, // 磁碟上唯一的隨機檔案名稱
      size,
      metadata: { filename: originalname, filetype: mimetype },
    } = uploadMetadata;

    // 建構上傳檔案的公開 URL
    const fileUrl = new URL(process.env.APP_URL);
    fileUrl.pathname = `/uploads/${filename}`;

    // 將檔案資訊儲存到您的資料庫
    const doc = await Upload.insert({
      mimetype,
      originalname,
      filename,
      size,
      url: fileUrl.href,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user.did,
    });

    // 將資料庫文件作為 JSON 回應回傳
    // 此資料將傳遞給前端的 onUploadFinish 回呼函式
    return doc;
  },
});

// 將中介軟體掛載到 '/uploads' 路由上
// 確保任何必要的身份驗證/授權中介軟體在其之前運行
router.use('/uploads', yourAuthMiddleware, localStorageServer.handle);

export default router;
```

### 設定選項

`initLocalStorageServer` 函式接受一個包含以下屬性的選項物件：

| Option                | Type       | Required | Description                                                                                                                                                                                          |
| --------------------- | ---------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `path`                | `string`   | Yes      | 上傳檔案將儲存的目錄的絕對路徑。                                                                                                                                                             |
| `express`             | `Function` | Yes      | Express 應用程式實例。                                                                                                                                                                     |
| `onUploadFinish`      | `Function` | No       | 一個在檔案上傳完成後運行的 `async` 回呼函式。它接收 `(req, res, uploadMetadata)`。回傳值會作為 JSON 回應發送到前端。                   |
| `onUploadCreate`      | `Function` | No       | 一個在新的上傳啟動時、但在任何資料傳輸前運行的 `async` 回呼函式。可用於驗證或授權檢查。它接收 `(req, res, uploadMetadata)`。 |
| `expiredUploadTime`   | `Number`   | No       | 未完成的上傳被視為過期並由背景作業清理的時間（毫秒）。**預設值：** `1000 * 60 * 60 * 24 * 3`（3 天）。                 |
| `...restProps`        | `object`   | No       | 任何其他適用於底層 `@tus/server` 套件的有效選項都將被傳遞下去。                                                                                                             |

### 回呼函式詳解

#### `onUploadFinish(req, res, uploadMetadata)`

這是處理已完成上傳的主要回呼函式。這裡是將檔案元資料儲存到資料庫、觸發 webhook 或執行其他上傳後操作的理想位置。

**`uploadMetadata` 物件**

傳遞給回呼函式的 `uploadMetadata` 物件包含有關上傳檔案的詳細資訊：

| Property           | Type     | Description                                                                 |
| ------------------ | -------- | --------------------------------------------------------------------------- |
| `id`               | `string` | 伺服器磁碟上唯一的隨機生成檔案名稱。               |
| `size`             | `number` | 檔案的總大小（以位元組為單位）。                                        |
| `offset`           | `number` | 目前已上傳的位元組數。在此回呼函式中應等於 `size`。 |
| `metadata`         | `object` | 一個包含客戶端提供的元資料的物件。                       |
| `metadata.filename`| `string` | 來自使用者電腦的原始檔案名稱。                             |
| `metadata.filetype`| `string` | 檔案的 MIME 類型（例如，`image/jpeg`）。                             |
| `runtime`          | `object` | 一個包含檔案位置執行階段資訊的物件。               |
| `runtime.absolutePath` | `string` | 伺服器檔案系統上檔案的完整路徑。                 |

**回傳值**

您從 `onUploadFinish` 回傳的值將被序列化為 JSON 並發送回前端的 `Uploader` 元件。這讓您可以傳回資料庫記錄 ID、公開 URL 或任何其他相關資料。

### 自動清理

此中介軟體會自動設定一個名為 `auto-cleanup-expired-uploads` 的背景 cron job，每小時運行一次。此作業會安全地從儲存目錄中刪除任何超過 `expiredUploadTime` 的部分或過期上傳，防止您的伺服器被不完整的檔案佔滿。

### 進階功能

#### 移除 EXIF 資料
為保護隱私和安全，此中介軟體會在檔案上傳完成後，自動嘗試從上傳的圖片（`.jpeg`、`.tiff` 等）中剝離 EXIF（可交換圖像檔案格式）元資料。

#### 手動刪除檔案
回傳的伺服器實例包含一個 `delete` 方法，您可以用來以程式化方式刪除已上傳的檔案及其相關的元資料檔案。

```javascript Manually Deleting a File icon=mdi:code-block-tags
import { localStorageServer } from './setup'; // 假設您已匯出該實例

async function deleteFile(filename) {
  try {
    await localStorageServer.delete(filename);
    console.log(`Successfully deleted ${filename}`);
  } catch (error) {
    console.error(`Failed to delete ${filename}:`, error);
  }
}
```

---

現在您已了解如何處理直接上傳，您可能希望讓使用者能夠從外部服務匯入檔案。請前往下一節以了解 `initCompanion`。

<x-card data-title="下一步：initCompanion(options)" data-icon="lucide:link" data-href="/api-reference/uploader-server/companion">
  了解如何設定 Companion 中介軟體，以允許使用者從 Unsplash 和直接 URL 等遠端來源匯入檔案。
</x-card>