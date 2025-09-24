# initCompanion(options)

`initCompanion` 函數初始化並設定 Uppy Companion 中介軟體，這對於讓使用者能夠從遠端來源（如 Unsplash、Google Drive、Instagram 或直接的 URL）匯入檔案至關重要。此函數是官方 [`@uppy/companion`](https://uppy.io/docs/companion/) 函式庫的封裝，專為在 blocklet 環境中無縫整合而設計。

關於如何設定的實用指南，請參閱 [整合遠端來源 (Companion)](./guides-remote-sources.md)。

### 運作原理

Companion 作為伺服器端的代理。當使用者從遠端來源選取檔案時，請求會被傳送到您後端的 Companion 端點。接著，您的伺服器會從遠端來源獲取檔案，並將其串流回使用者的瀏覽器。一旦檔案進入瀏覽器，它就會被視為本地檔案，並上傳到您的最終目的地（例如，由 `initLocalStorageServer` 處理的端點）。

```d2 Companion 運作原理 icon=mdi:diagram-outline
direction: down

User: {
  shape: c4-person
  label: "使用者"
}

Frontend: {
  label: "前端 (瀏覽器)"
  shape: rectangle

  Uploader-Component: {
    label: "上傳器元件"
    shape: rectangle
  }
}

Backend: {
  label: "後端伺服器"
  shape: rectangle

  Companion-Middleware: {
    label: "Companion 中介軟體\n(@blocklet/uploader-server)"
  }

  Local-Storage-Middleware: {
    label: "本地儲存中介軟體"
    shape: rectangle
  }
}

Remote-Source: {
  label: "遠端來源\n(例如，Unsplash、URL)"
  shape: cylinder
}

User -> Frontend.Uploader-Component: "1. 選擇遠端檔案"
Frontend.Uploader-Component -> Backend.Companion-Middleware: "2. 請求檔案"
Backend.Companion-Middleware -> Remote-Source: "3. 獲取檔案"
Remote-Source -> Backend.Companion-Middleware: "4. 串流檔案資料"
Backend.Companion-Middleware -> Frontend.Uploader-Component: "5. 串流回瀏覽器"
Frontend.Uploader-Component -> Backend.Local-Storage-Middleware: "6. 上傳檔案 (Tus)"

```

### 使用方法

要使用 Companion，請用您的設定選項來初始化它，然後將其 `handle` 附加到一個 Express 路由路徑上。前端的 `Uploader` 元件必須為其 `companionUrl` 屬性設定相同的路徑。

```javascript Companion 基本設定 icon=logos:javascript
import express from 'express';
import { initCompanion } from '@blocklet/uploader-server';

const router = express.Router();

// Companion 的基本設定
const companion = initCompanion({
  // 伺服器上用於處理檔案的暫存目錄
  path: '/tmp/uploads',
  express,
  // 包含必要金鑰和密鑰的提供者選項
  providerOptions: {
    unsplash: {
      key: process.env.UNSPLASH_KEY,
      secret: process.env.UNSPLASH_SECRET,
    },
  },
  // 您的 blocklet 的公開 URL，某些提供者需要此項
  uploadUrls: [process.env.APP_URL],
});

// 將 companion 中介軟體掛載到特定路徑
// 此路徑應與前端的 companionUrl 屬性相符
router.use('/companion', companion.handle);
```

### 參數

`initCompanion` 函數接受一個包含以下屬性的選項物件：

| 名稱              | 類型       | 描述                                                                                                                                                                                         |
| ----------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | 
| `path`            | `string`   | **必填。** 伺服器上用於在處理過程中儲存檔案的暫存目錄的絕對路徑。這對應於 Uppy Companion 中的 `filePath` 選項。                                                                         | 
| `express`         | `Function` | **必填。** Express 應用程式實例。用於為 Companion 建立必要的子應用程式和中介軟體堆疊。                                                                                             | 
| `providerOptions` | `object`   | 可選。一個物件，包含您想啟用的每個遠端提供者的設定。每個鍵是提供者名稱（例如 `unsplash`），值是其設定，如 API 金鑰和密鑰。                                                                 | 
| `...restProps`    | `any`      | 任何其他來自官方 [Uppy Companion 選項](https://uppy.io/docs/companion/options/) 的有效選項都可以在此傳入。例如，`uploadUrls` 是一個常見且通常為必需的選項。                      | 

### 回傳值

此函數回傳一個 `companion` 實例，具有以下關鍵屬性：

| 屬性                | 類型                        | 描述                                                                                                                                                                                                   |
| ------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | 
| `handle`            | `Function`                  | 一個 Express 中介軟體，您必須將其掛載到一個路由上（例如 `/companion`）。此 handle 包含處理遠端檔案請求的所有邏輯。                                                                                        | 
| `setProviderOptions`| `(options: object) => void` | 一個方法，允許您在初始化後動態更新 `providerOptions`。如果您需要從資料庫載入 API 金鑰或在不重新啟動伺服器的情況下更改設定，這非常有用。                                                                       | 

#### 範例：動態提供者選項

您可以在執行時變更提供者選項，這對於多租戶應用程式或當密鑰是異步載入時非常有用。

```javascript 動態提供者選項 icon=logos:javascript
// 初始化 companion 時，最初不帶提供者選項
const companion = initCompanion({
  path: '/tmp/uploads',
  express,
});

// 稍後，可能在從資料庫獲取密鑰後
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

### 額外功能

- **狀態碼重寫**：為了安全和更好的錯誤處理，如果遠端提供者回傳一個狀態碼為 500 或更高的錯誤，此中介軟體會自動將其重寫為 `400 Bad Request`。這可以防止潛在的伺服器錯誤細節洩漏給用戶端。

---

Companion 設定完成後，您的上傳器現在能夠處理來自各種來源的檔案。您可能還需要從您的 blocklet 或其他 blocklet 提供靜態檔案。

<x-cards>
  <x-card data-title="指南：整合遠端來源" data-icon="lucide:link" data-href="/guides/remote-sources">
    設定前端和後端以進行遠端上傳的逐步指南。
  </x-card>
  <x-card data-title="API：initStaticResourceMiddleware" data-icon="lucide:file-code" data-href="/api-reference/uploader-server/static-resource">
    了解如何從其他已安裝的 blocklet 提供靜態資產。
  </x-card>
</x-cards>