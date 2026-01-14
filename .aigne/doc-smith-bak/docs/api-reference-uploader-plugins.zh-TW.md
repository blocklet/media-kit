# 可用外掛程式

`@blocklet/uploader` 透過數個強大的自訂外掛程式擴充了核心 Uppy 函式庫。這些外掛程式與 Blocklet 生態系統（特別是 Media Kit）無縫整合，提供 AI 圖片生成、瀏覽先前上傳的檔案以及存取共享資源等功能。當您使用 `<Uploader />` 元件且後端設定正確時，這些外掛程式大多會自動啟用。

本文件為套件中包含的自訂外掛程式提供了參考。

## 擷取器外掛程式（UI 標籤頁）

這些外掛程式在 Uploader 儀表板中以標籤頁的形式出現，為使用者提供了選取或建立檔案的不同方式。

### Uploaded

`Uploaded` 外掛程式提供了一個標籤頁，使用者可以在其中瀏覽、搜尋和選取先前已上傳到 Media Kit 的檔案。這是一個無需重新上傳即可重複使用現有資產的重要工具。

**主要功能：**

- **無限滾動：** 當使用者滾動時，從伺服器延遲載入檔案，確保即使在大型媒體庫中也能保持高效能。
- **豐富預覽：** 直接在網格視圖中呈現圖片、影片和 PDF 的預覽。
- **快速上傳：** 包含一個專用的「新增」按鈕，可快速切換回「我的裝置」標籤頁進行新上傳。

**使用方式**

當 Uploader 偵測到活動的 Media Kit 時，此插件預設為啟用。您可以透過 `uploaderOptions` 自訂其標題或將額外參數傳遞給後端 API。

```javascript uploaderOptions.js icon=logos:javascript
<Uploader
  uploaderOptions={{
    plugins: {
      Uploaded: {
        title: 'My Media Library', // Change the tab title
        params: { customParam: 'value' } // Pass custom query params to the API
      }
    }
  }}
/>
```

### Resources

`Resources` 外掛程式允許使用者從精選的靜態資產列表中進行選取。這些資產可以由其他 blocklet 提供，或由您的應用程式後端定義，從而可以輕鬆共享如標誌、圖示或文件範本等常用檔案。

**主要功能：**

- **元件篩選：** 如果有多個資源來源（元件）可用，它們會顯示為篩選按鈕，讓使用者可以在不同的資產集合之間切換。
- **網格視圖：** 以乾淨、易於導覽的網格呈現資源。

**使用方式**

當後端設定為提供資源時，此外掛程式將會啟用。您可以在 Uploader 選項中自訂其標題。

```javascript uploaderOptions.js icon=logos:javascript
<Uploader
  uploaderOptions={{
    plugins: {
      Resources: {
        title: 'Shared Assets' // Change the tab title
      }
    }
  }}
/>
```

### AI Image

將生成式 AI 直接整合到您的上傳工作流程中。`AI Image` 外掛程式提供了一個專用介面，讓使用者可以使用後端設定的各種 AI 模型，透過文字提示生成圖片。

**主要功能：**

- **提示介面：** 一個使用者友善的面板，用於撰寫提示和選取模型。
- **模型篩選：** 根據 `window.blocklet.preferences.supportModels` 設定自動篩選可用的 AI 模型，確保使用者只看到相關選項。
- **圖片庫：** 顯示生成的圖片，供選取並匯入 Uploader。

**使用方式**

當 Media Kit 設定了 AI 圖片生成功能時，此外掛程式即可使用。

```javascript uploaderOptions.js icon=logos:javascript
<Uploader
  uploaderOptions={{
    plugins: {
      AIImage: {
        title: 'Create with AI' // Change the tab title
      }
    }
  }}
/>
```

## 工具和背景外掛程式

這些外掛程式在背景運作，以增強功能、安全性和可靠性。它們在儀表板中沒有可見的 UI 標籤頁。

### PrepareUpload（內部外掛程式）

這是一個關鍵的背景外掛程式，會對新增到 Uploader 的每個檔案自動執行。它在上傳開始前執行必要的預處理任務，以確保檔案安全、格式正確且經過最佳化。

| 功能 | 描述 |
|---|---|
| **XSS 防護** | 清理 SVG 檔案和檔名，以移除潛在的惡意腳本，保護您的應用程式免受跨站腳本攻擊。 |
| **Zip 炸彈防護** | 檢查壓縮檔（`.zip`、`.gz`），確保它們不包含可能耗盡伺服器資源的解壓縮炸彈。 |
| **圖片方向** | 根據 EXIF 元資料自動校正圖片方向，防止照片橫向或顛倒。 |
| **遠端檔案處理** | 從遠端來源（如 Unsplash 或透過 Companion 的 URL）下載檔案到瀏覽器中，以便像處理本地檔案一樣進行處理和上傳。 |
| **雜湊檔名** | 根據檔案內容的雜湊值生成唯一的檔名，有助於快取和防止命名衝突。 |
| **圖片驗證** | 可設定為強制執行長寬比，如果檔案不符合所需尺寸，會自動開啟圖片編輯器。 |

**使用方式**

`PrepareUpload` 外掛程式預設為啟用。雖然它通常不需要設定，但您可以向其傳遞選項，例如 `cropperOptions`，以為所有上傳的圖片強制執行特定的長寬比。

```javascript uploaderOptions.js icon=logos:javascript
<Uploader
  uploaderOptions={{
    plugins: {
      PrepareUpload: {
        cropperOptions: {
          aspectRatio: 16 / 9
        }
      }
    }
  }}
/>
```

### SafariPastePlugin

這是一個小型工具外掛程式，解決了特定的瀏覽器相容性問題。它確保在 Safari 中將檔案貼到 Uploader 儀表板的功能可以正常運作，因為 Safari 處理貼上事件的方式與其他瀏覽器不同。此外掛程式預設啟用，無需設定。

### VirtualPlugin

`VirtualPlugin` 不是一個功能外掛程式，而是一個供開發者使用的基底類別。它簡化了建立您自己的自訂擷取器（儀表板中的新標籤頁）的過程，而無需從頭開始編寫一個完整的 Uppy UI 外掛程式。

<x-card data-title="建立自訂外掛程式" data-icon="lucide:puzzle" data-href="/guides/custom-plugin" data-cta="查看指南">
  有關如何建立您自己的標籤頁的詳細說明，請參閱我們的專門指南。
</x-card>