# initStaticResourceMiddleware(options)

`initStaticResourceMiddleware` 是一個功能強大的 Express 中介軟體，專為從其他已安裝的 blocklet 提供靜態資產而設計。這讓您的應用程式能夠從相依的元件存取如圖片、樣式表或字體等共享資源，而無需知道它們在檔案系統中的確切位置。

此中介軟體透過掃描符合指定資源類型的已安裝 blocklet 目錄來運作，並在記憶體中建立可用檔案的對應。當請求傳入時，它會有效地在此對應中查找檔案並提供服務。

### 運作方式

以下是此過程的高階概觀：

```d2
direction: down

Browser: {
  shape: c4-person
  label: "使用者的瀏覽器"
}

Your-Blocklet: {
  label: "您的 Blocklet"
  shape: rectangle

  Express-Server: {
    label: "Express 伺服器"
  }

  Static-Middleware: {
    label: "initStaticResourceMiddleware"
  }
}

Dependent-Blocklets: {
    label: "相依的 Blocklets"
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
        label: "主題 Blocklet"
        shape: rectangle
        assets: {
            label: "assets/"
            "style.css"
        }
    }
}

Your-Blocklet.Express-Server -> Your-Blocklet.Static-Middleware: "1. 使用設定進行初始化"
Your-Blocklet.Static-Middleware -> Dependent-Blocklets: "2. 掃描資源"
Browser -> Your-Blocklet.Express-Server: "3. GET /logo.png"
Your-Blocklet.Static-Middleware -> Browser: "4. 從 Image Bin 提供檔案"

```

### 使用方法

若要使用此中介軟體，請將其匯入並加入您的 Express 應用程式。您需要設定它應尋找的資源類型。

```javascript server.js icon=logos:express
import express from 'express';
import { initStaticResourceMiddleware } from '@blocklet/uploader-server';

const app = express();

// 初始化中介軟體以提供 'imgpack' 類型的資源
// 從任何提供此資源的已安裝 blocklet。
app.use(
  initStaticResourceMiddleware({
    express,
    resourceTypes: ['imgpack'], // 使用字串進行簡單設定
  })
);

app.listen(3000, () => {
  console.log('伺服器運行於 http://localhost:3000');
});
```

在此範例中，如果另一個已安裝的 blocklet 在 `blocklet.yml` 中有一個 `imgpack` 類型的資源項目，則該資源目錄中的任何檔案都將被提供。例如，對 `/example.png` 的請求將會提供來自該 blocklet 的 `example.png` 檔案。

### 選項

`initStaticResourceMiddleware` 函數接受一個包含以下屬性的設定物件：

| Option | Type | Description |
| --- | --- | --- |
| `express` | `object` | **必要。** Express 應用程式實例。 |
| `resourceTypes` | `(string \| ResourceType)[]` | **必要。** 一個定義要掃描的資源類型的陣列。請參見下方的 `ResourceType` 物件詳細資訊。 |
| `options` | `object` | 選用。傳遞給底層 `serve-static` 處理程式的設定物件。常見屬性包括用於控制快取標頭的 `maxAge`（例如 '365d'）和 `immutable`（例如 `true`）。 |
| `skipRunningCheck` | `boolean` | 選用。如果為 `true`，中介軟體將掃描已安裝但目前未執行的 blocklet。預設為 `false`。 |

### `ResourceType` 物件

為了更精細的控制，您可以向 `resourceTypes` 選項提供一個物件陣列，而非簡單的字串。每個物件可以有以下屬性：

| Property | Type | Description |
| --- | --- | --- |
| `type` | `string` | **必要。** 資源類型的名稱，應與相依 blocklet 的 `blocklet.yml` 中定義的類型相符。 |
| `did` | `string` | **必要。** 提供該資源的 blocklet 元件的 DID。您可以使用 `ImageBinDid` 來代表標準的 Media Kit。 |
| `folder` | `string \| string[]` | 選用。資源目錄中要掃描的特定子資料夾或子資料夾陣列。預設為資源目錄的根目錄（`''`）。 |
| `whitelist` | `string[]` | 選用。要包含的副檔名陣列（例如 `['.png', '.jpg']`）。如果提供，則只會提供具有這些副檔名的檔案。 |
| `blacklist` | `string[]` | 選用。要排除的副檔名陣列（例如 `['.md', '.txt']`）。 |
| `setHeaders` | `(res, path, stat) => void` | 選用。一個用於為提供的檔案設定自訂回應標頭的函數。 |
| `immutable` | `boolean` | 選用。為此特定資源類型覆寫頂層的 `options.immutable`，以控制 `Cache-Control` 標頭。 |
| `maxAge` | `string` | 選用。為此特定資源類型覆寫頂層的 `options.maxAge`。 |

### 進階範例

此範例展示了一個更複雜的設定，用於根據特定規則提供兩種不同類型的資源。

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
        did: 'z2q...someThemeBlockletDid', // 特定主題 blocklet 的 DID
        folder: ['css', 'fonts'],
        blacklist: ['.map'],
      },
    ],
    options: {
      maxAge: '7d', // 預設快取 7 天
    },
  })
);

app.listen(3000);
```

此設定執行以下操作：
1.  掃描由 Media Kit (`ImageBinDid`) 提供的 `imgpack` 資源，但僅限於 `public/images` 子資料夾內，且只提供 `.png`、`.jpg` 和 `.gif` 檔案。
2.  從具有特定 DID 的 blocklet 中掃描 `theme-assets` 資源，搜尋 `css` 和 `fonts` 這兩個子資料夾，並忽略任何來源對應（`.map`）檔案。
3.  為所有匹配的檔案設定預設的 `Cache-Control` max-age 為 7 天。

### 自動更新

此中介軟體專為動態環境設計。它會自動監聽 blocklet 的生命週期事件。如果元件被新增、移除、啟動、停止或更新，中介軟體將自動重新掃描並更新其內部資源對應，因此您無需重新啟動應用程式。

---

接下來，學習如何從一個可以即時更新而無需重新啟動應用程式的目錄中提供檔案。

<x-card data-title="initDynamicResourceMiddleware(options)" data-icon="lucide:file-diff" data-href="/api-reference/uploader-server/dynamic-resource" data-cta="閱讀更多">
用於從指定目錄提供動態資源的 API 參考，支援即時檔案監看。
</x-card>