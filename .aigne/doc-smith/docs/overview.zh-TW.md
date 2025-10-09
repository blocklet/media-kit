# 總覽

Blocklet Uploader 是一個專為 blocklets 設計的綜合檔案上傳解決方案，它建立在強大且可擴展的 [Uppy](https://uppy.io/) 檔案上傳器之上。它由兩個主要套件組成，共同提供從瀏覽器中的使用者介面到伺服器上的檔案處理的無縫體驗。

<x-cards>
  <x-card data-title="@blocklet/uploader (前端)" data-icon="lucide:upload-cloud" data-href="/getting-started/frontend-setup">
    一個 React 元件，提供豐富、可插拔的使用者介面，用於檔案選擇和上傳進度。
  </x-card>
  <x-card data-title="@blocklet/uploader-server (後端)" data-icon="lucide:server" data-href="/getting-started/backend-setup">
    Express 中介軟體，用於處理檔案儲存、處理以及與 Unsplash 等遠端來源的整合。
  </x-card>
</x-cards>

## 運作方式

標準工作流程涉及使用者在您應用程式的前端與 @blocklet/uploader 元件互動。然後，此元件與由 @blocklet/uploader-server 驅動的後端端點通訊，該端點處理實際的檔案儲存和處理。

需要注意的是，如果存在 Media Kit blocklet，@blocklet/uploader 可以在沒有自訂後端的情況下運作，因為它提供了預設的上傳處理。只有當您需要自訂的伺服器端邏輯時，例如在上傳完成後將檔案元資料儲存到特定資料庫中，才需要安裝和設定 @blocklet/uploader-server。

```d2 基本上传流程
direction: down

User: { 
  label: "使用者"
  shape: c4-person 
}

App: {
  label: "您的 Blocklet 應用程式"
  shape: rectangle

  Uploader-Component: {
    label: "@blocklet/uploader\n(前端元件)"
    shape: rectangle
  }

  Backend-Server: {
    label: "後端伺服器"
    shape: rectangle

    Uploader-Server: {
      label: "@blocklet/uploader-server\n(中介軟體)"
    }

    DB: {
      label: "資料庫"
      shape: cylinder
    }
  }
}

User -> App.Uploader-Component: "1. 拖曳檔案"
App.Uploader-Component -> App.Backend-Server.Uploader-Server: "2. 上傳檔案"
App.Backend-Server.Uploader-Server -> App.Backend-Server.Uploader-Server: "3. 觸發 onUploadFinish hook"
App.Backend-Server.Uploader-Server -> App.Backend-Server.DB: "4. 儲存元資料"
App.Backend-Server.DB -> App.Backend-Server.Uploader-Server: "5. 返回資料庫記錄"
App.Backend-Server.Uploader-Server -> App.Uploader-Component: "6. 發送 JSON 回應 (URL)"
App.Uploader-Component -> App.Uploader-Component: "7. 觸發 onUploadFinish hook"
App.Uploader-Component -> User: "8. 更新 UI"
```

## 主要功能

*   **由 Uppy 驅動**：利用成熟、經過實戰考驗的核心來實現可靠的上傳。
*   **彈性架構**：解耦的前端和後端套件允許獨立使用和自訂。
*   **豐富的外掛系統**：支援標準 Uppy 外掛，如 `ImageEditor`、`Webcam` 和 `Url`，以及自訂的 blocklet 特定外掛。
*   **遠端來源整合**：使用 Companion 中介軟體，輕鬆讓使用者從 Unsplash 等外部來源匯入檔案。
*   **可自訂的 Hooks**：在客戶端和伺服器端都提供 `onUploadFinish` 回呼，讓您完全控制上傳後的處理。
*   **自動 Media Kit 整合**：當 Media Kit blocklet 可用時，無縫偵測並自行設定。

準備好開始了嗎？讓我們將上傳器整合到您的 blocklet 中。

<x-card data-title="開始使用" data-icon="lucide:rocket" data-href="/getting-started" data-cta="開始指南">
  遵循我們的逐步指南，在您的應用程式中設定前端元件和後端伺服器。
</x-card>