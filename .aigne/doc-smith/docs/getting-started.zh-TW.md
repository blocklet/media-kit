# 入門指南

本指南將引導您完成將強大的檔案上傳器整合到您的 Blocklet 中的基本步驟。我們將涵蓋前端 UI 元件和可選的後端伺服器設定，幫助您快速上手。

此解決方案分為兩個主要套件：

- **`@blocklet/uploader`**：一個 React 元件，提供豐富的使用者介面用於上傳檔案。
- **`@blocklet/uploader-server`**：一個 Express 中介軟體，用於您 Blocklet 的後端處理檔案儲存和處理。

值得注意的是，`@blocklet/uploader` 可以獨立運作，特別是當與提供必要後端端點的 Media Kit Blocklet 整合時。只有當您想在自己的伺服器上實作自訂上傳邏輯時，才需要使用 `@blocklet/uploader-server`。

```d2
direction: down

user: {
  shape: c4-person
  label: "開發者"
}

blocklet: {
  label: "您的 Blocklet"
  shape: rectangle

  frontend: {
    label: "前端 (React)"
    shape: rectangle
    blocklet-uploader: {
      label: "@blocklet/uploader"
    }
  }

  backend: {
    label: "後端 (Express)"
    shape: rectangle
    blocklet-uploader-server: {
      label: "@blocklet/uploader-server"
    }
  }
}

user -> blocklet.frontend.blocklet-uploader: "整合元件"
user -> blocklet.backend.blocklet-uploader-server: "整合中介軟體"
blocklet.frontend -> blocklet.backend: "上傳檔案"
```

首先，請選擇符合您需求的設定指南。我們建議從前端設定開始。

<x-cards data-columns="2">
  <x-card data-title="前端設定 (@blocklet/uploader)" data-icon="lucide:layout-template" data-href="/getting-started/frontend-setup">
    在您的 React 應用程式中安裝和渲染基本前端上傳器元件的逐步指南。
  </x-card>
  <x-card data-title="後端設定 (@blocklet/uploader-server)" data-icon="lucide:server" data-href="/getting-started/backend-setup">
    了解如何在您基於 Express 的 Blocklet 中安裝和設定必要的後端中介軟體以處理檔案上傳。
  </x-card>
</x-cards>

完成這些指南後，您將擁有一個功能齊全的檔案上傳器。要探索更進階的功能，例如自訂外掛程式或處理上傳回呼，請前往 [指南](./guides.md) 部分。