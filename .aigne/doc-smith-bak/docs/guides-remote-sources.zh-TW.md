# 整合遠端來源 (Companion)

若要允許使用者從外部來源（例如直接的 URL 或 Unsplash 等服務）匯入檔案，您需要在後端設定 Uppy 的 Companion 服務。`@blocklet/uploader-server` 套件提供了一個方便的 `initCompanion` 函式，簡化了這個過程。

Companion 作為伺服器端的代理。它代表使用者從遠端提供者擷取檔案，然後將它們串流到前端的上傳器元件，接著再進行正常的上傳程序。雖然基本的檔案上傳可以在沒有自訂後端的情況下處理，但啟用遠端來源需要設定 `@blocklet/uploader-server` 套件。

### 運作方式

下圖說明了當使用者從遠端來源匯入檔案時的資料流程：

```d2 遠端來源整合流程
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
    label: "本機儲存中介軟體"
    shape: rectangle
  }
}

Remote-Source: {
  label: "遠端來源\n(例如 Unsplash, URL)"
  shape: cylinder
}

User -> Frontend.Uploader-Component: "1. 選擇檔案"
Frontend.Uploader-Component -> Backend.Companion-Middleware: "2. 請求檔案"
Backend.Companion-Middleware -> Remote-Source: "3. 擷取檔案"
Remote-Source -> Backend.Companion-Middleware: "4. 串流檔案資料"
Backend.Companion-Middleware -> Frontend.Uploader-Component: "5. 回到瀏覽器"
Frontend.Uploader-Component -> Backend.Local-Storage-Middleware: "6. 上傳檔案"
```

## 步驟 1：設定後端中介軟體

首先，您需要在 blocklet 的後端 Express 伺服器中初始化並掛載 Companion 中介軟體。這包括呼叫 `initCompanion` 並將其加入到您的路由器中。

```javascript 伺服器端 Companion 設定 icon=logos:nodejs
import express from 'express';
import { initCompanion } from '@blocklet/uploader-server';

const router = express.Router();

// 用於遠端來源的 Companion 中介軟體
const companion = initCompanion({
  path: env.uploadDir, // 用於檔案處理的暫存目錄
  express,
  providerOptions: {
    // 在此設定提供者，例如 Unsplash
    unsplash: {
      key: process.env.UNSPLASH_KEY,
      secret: process.env.UNSPLASH_SECRET,
    },
  },
  uploadUrls: [env.appUrl], // 您的 blocklet 的公開 URL
});

// 將 companion 處理常式掛載到特定路由上
router.use('/companion', companion.handle);
```

### `initCompanion` 選項

| 選項 | 類型 | 描述 |
| :--- | :--- | :--- |
| `path` | `string` | **必要。** Companion 在傳輸過程中將暫時儲存檔案的伺服器目錄。 |
| `express` | `Function` | **必要。** Express 應用程式實例。 |
| `providerOptions` | `Object` | 選用。遠端提供者的設定。例如，若要啟用 Unsplash，您需要提供您的 API 金鑰和密鑰。有關提供者的完整列表及其選項，請參閱 [Uppy Companion 官方文件](https://uppy.io/docs/companion/providers/)。 |
| `uploadUrls` | `string[]` | 選用，但基於安全性強烈建議使用。一個包含您前端上傳器執行位置的 URL 陣列。這可以防止他人使用您的 Companion 實例。 |

## 步驟 2：設定前端元件

設定好後端後，您需要設定前端的 `<Uploader />` 元件以與您的 Companion 實例進行通訊。您可以透過在 `apiPathProps` 屬性中指定路由並啟用所需的插件來完成此操作。

```jsx 帶有 Companion 的上傳器元件 icon=logos:react
import { Uploader } from '@blocklet/uploader';

function MyUploaderComponent() {
  return (
    <Uploader
      popup
      apiPathProps={{
        // 此路徑必須與後端路由相符
        companion: '/api/companion',
        // 最終上傳的上傳器路徑
        uploader: '/api/uploads',
      }}
      plugins={[
        'Url', // 啟用從直接 URL 匯入
        'Unsplash', // 啟用從 Unsplash 匯入
        'Webcam',
      ]}
    />
  );
}
```

在後端中介軟體和前端元件都設定好後，上傳器的儀表板現在將顯示「連結」(URL) 和「Unsplash」的分頁，讓使用者可以直接從這些來源匯入檔案。

---

現在您已經可以處理來自本地和遠端來源的上傳，您可能希望進一步擴展上傳器的功能。在下一個指南中，學習如何將您自己的自訂分頁添加到上傳器介面。

<x-card data-title="建立自訂插件" data-icon="lucide:puzzle" data-href="/guides/custom-plugin" data-cta="閱讀更多">
  透過使用提供的 VirtualPlugin 元件建立您自己的自訂插件分頁，來擴展上傳器的功能。
</x-card>