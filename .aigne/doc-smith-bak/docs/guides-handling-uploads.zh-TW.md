# 處理上傳

檔案成功上傳後，您通常需要在用戶端和伺服器端執行操作。本指南說明如何在 `@blocklet/uploader` 前端元件和 `@blocklet/uploader-server` 中介軟體中使用 `onUploadFinish` 回呼來處理檔案及其元資料。

前端回呼非常適合更新 UI，而後端回呼則用於伺服器端任務，例如將檔案資訊儲存到資料庫。

### 上傳流程

下圖說明了從使用者拖放檔案到最終 UI 更新的完整流程，展示了前端和後端回呼如何協同工作。

```d2
direction: down

User: { 
  label: "使用者"
  shape: c4-person 
}

App: {
  label: "您的 Blocklet 應用程式"
  shape: rectangle

  Uploader-Component: {
    label: "Uploader 元件"
    shape: rectangle
  }

  Backend-Server: {
    label: "後端伺服器"
    shape: rectangle

    Uploader-Server: {
      label: "@blocklet/uploader-server"
    }

    DB: {
      label: "資料庫"
      shape: cylinder
    }
  }
}

User -> App.Uploader-Component: "1. 拖放檔案"
App.Uploader-Component -> App.Backend-Server.Uploader-Server: "2. 上傳檔案 (Tus)"
App.Backend-Server.Uploader-Server -> App.Backend-Server.Uploader-Server: "3. 觸發後端 onUploadFinish"
App.Backend-Server.Uploader-Server -> App.Backend-Server.DB: "4. 儲存元資料"
App.Backend-Server.DB -> App.Backend-Server.Uploader-Server: "5. 回傳資料庫記錄"
App.Backend-Server.Uploader-Server -> App.Uploader-Component: "6. 發送 JSON 回應"
App.Uploader-Component -> App.Uploader-Component: "7. 觸發前端 onUploadFinish"
App.Uploader-Component -> User: "8. 使用檔案 URL 更新 UI"
```

---

## 前端：`onUploadFinish` 屬性

`Uploader` 元件接受一個 `onUploadFinish` 屬性，這是一個在每個檔案上傳完成後執行的函數。此回呼會接收從您後端的 `onUploadFinish` 處理程式發送的 JSON 回應。

這是更新應用程式狀態、顯示已上傳圖片或儲存回傳的檔案 URL 的絕佳位置。

**屬性定義**

| 屬性 | 類型 | 說明 |
|---|---|---|
| `onUploadFinish` | `(result: any) => void` | 一個回呼函數，在後端處理完檔案後接收最終的上傳結果物件。 |

**使用範例**

在此範例中，我們使用 `onUploadFinish` 回呼從後端接收檔案 URL 並將其儲存在元件的狀態中。

```javascript Uploader Component icon=logos:react
import { Uploader } from '@blocklet/uploader/react';
import { useState } from 'react';

export default function MyComponent() {
  const [fileUrl, setFileUrl] = useState('');

  const handleUploadFinish = (result) => {
    // 'result' 物件是來自您後端的 JSON 回應
    console.log('Upload finished:', result);

    // 'result.data' 包含伺服器回傳的主體
    if (result.data && result.data.url) {
      setFileUrl(result.data.url);
    }
  };

  return (
    <div>
      <Uploader onUploadFinish={handleUploadFinish} />
      {fileUrl && (
        <div>
          <p>上傳成功！</p>
          <img src={fileUrl} alt="已上傳的內容" width="200" />
        </div>
      )}
    </div>
  );
}
```

傳遞給前端回呼的 `result` 物件包含有關上傳的詳細資訊，包括來自伺服器的回應。

**`result` 物件範例**

```json
{
  "uploadURL": "http://localhost:3030/api/uploads/f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6.png",
  "data": {
    "url": "http://localhost:3030/api/uploads/f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6.png",
    "_id": "z2k...",
    "mimetype": "image/png",
    "originalname": "screenshot.png",
    "filename": "f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6.png",
    "size": 123456,
    "folderId": "component_did",
    "createdBy": "user_did",
    "updatedBy": "user_did",
    "createdAt": "2023-10-27T10:00:00.000Z",
    "updatedAt": "2023-10-27T10:00:00.000Z"
  },
  "method": "POST",
  "url": "http://localhost:3030/api/uploads/f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6.png",
  "status": 200,
  "headers": { ... },
  "file": { ... } // Uppy 檔案物件
}
```

---

## 後端：`onUploadFinish` 選項

在伺服器上，您在初始化 `initLocalStorageServer` 時提供一個 `onUploadFinish` 函數。此函數在檔案完全接收並儲存到伺服器本地磁碟後，但在向用戶端發送最終回應之前觸發。

您應該在這裡處理您的核心業務邏輯，例如：
- 驗證上傳的檔案。
- 將檔案元資料儲存到資料庫。
- 將檔案與目前使用者關聯。
- 向前端回傳一個自訂的 JSON 物件。

**函數簽名**

```typescript
(req: Request, res: Response, uploadMetadata: object) => Promise<any>
```

- `req`：Express 請求物件，包含標頭和使用者資訊。
- `res`：Express 回應物件。
- `uploadMetadata`：一個包含有關已上傳檔案詳細資訊的物件。

**使用範例**

此範例示範如何將檔案元資料儲存到資料庫（使用一個虛構的 `Upload` 模型）並將建立的記錄回傳給前端。

```javascript Backend Server Setup icon=logos:nodejs
import { initLocalStorageServer } from '@blocklet/uploader-server';
import express from 'express';
import { joinUrl } from 'url-join';

// 假設 'Upload' 是您的資料庫模型
import Upload from '../models/upload';

const app = express();

const localStorageServer = initLocalStorageServer({
  path: process.env.UPLOAD_DIR,
  express,
  onUploadFinish: async (req, res, uploadMetadata) => {
    const {
      id: filename, // 磁碟上唯一的雜湊檔名
      size,
      metadata: { filename: originalname, filetype: mimetype },
    } = uploadMetadata;

    // 建構檔案的公開 URL
    const fileUrl = joinUrl(process.env.APP_URL, '/api/uploads', filename);

    // 將檔案元資料儲存到您的資料庫
    const doc = await Upload.insert({
      mimetype,
      originalname,
      filename, // 雜湊檔名
      size,
      folderId: req.componentDid, // 上傳發生的元件的 DID
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user.did, // 假設有使用者身份驗證中介軟體
      updatedBy: req.user.did,
    });

    // 回傳的物件將作為 JSON 回應發送給前端
    const responseData = { url: fileUrl, ...doc };

    return responseData;
  },
});

// 掛載上傳器中介軟體
app.use('/api/uploads', localStorageServer.handle);
```

**`uploadMetadata` 物件詳情**

`uploadMetadata` 物件提供了有關檔案的關鍵資訊：

```json
{
  "id": "f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6.png",
  "size": 123456,
  "offset": 123456,
  "is_final": true,
  "metadata": {
    "relativePath": null,
    "name": "screenshot.png",
    "filename": "screenshot.png",
    "type": "image/png",
    "filetype": "image/png",
    "uploaderId": "Uploader"
  },
  "runtime": {
    "relativePath": null,
    "absolutePath": "/path/to/uploads/f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6.png",
    "size": 123456,
    "hashFileName": "f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6.png",
    "originFileName": "screenshot.png",
    "type": "image/png",
    "fileType": "image/png"
  }
}
```

透過實作這兩個回呼，您可以建立一個強大的上傳管道，無縫地將瀏覽器中的使用者操作與您的伺服器端業務邏輯連接起來。要了解如何處理來自 Unsplash 等外部來源的檔案，請繼續閱讀下一份指南。

<x-card data-title="整合遠端來源 (Companion)" data-icon="lucide:link" data-href="/guides/remote-sources">
  了解如何設定 Companion 中介軟體，以允許使用者從直接 URL 和其他服務匯入檔案。
</x-card>