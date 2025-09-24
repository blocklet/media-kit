# API 參考

歡迎來到 Blocklet Uploader 套件的 API 參考文件。本節為前端和後端函式庫中所有匯出的元件、函式、props 和設定選項提供了全面的詳細說明。這是您獲取深入技術資訊的首選資源。

此上傳器分為兩個主要套件：

- **`@blocklet/uploader`**：一個用於您應用程式前端的靈活 React 元件。
- **`@blocklet/uploader-server`**：一組用於在後端處理檔案上傳的 Express 中介軟體。

雖然這兩個套件設計為可無縫協作，但值得注意的是，`@blocklet/uploader` 可以與任何支援 Tus 可續傳協定的後端搭配使用。`@blocklet/uploader-server` 提供了一個強大、預先設定的解決方案，用於處理您 Blocklet 內的上傳邏輯，但其使用是可選的。

```d2
direction: down

your-blocklet-app: {
  label: "您的 Blocklet 應用程式"
  shape: rectangle

  frontend: {
    label: "前端 (React)"
    shape: rectangle
  }

  backend: {
    label: "後端 (Express)"
    shape: rectangle
  }
}

uploader: {
  label: "@blocklet/uploader"
  shape: rectangle
  style.fill: "#E6F7FF"
}

uploader-server: {
  label: "@blocklet/uploader-server"
  shape: rectangle
  style.fill: "#F6FFED"
}

your-blocklet-app.frontend -> uploader: "匯入 <Uploader /> 元件"
your-blocklet-app.backend -> uploader-server: "使用上傳中介軟體"

```

請在下方選擇一個套件，深入了解其詳細的 API 文件。

<x-cards data-columns="2">
  <x-card data-title="前端：@blocklet/uploader" data-icon="lucide:component" data-href="/api-reference/uploader">
    探索前端 React 套件中可用的 props、元件、hooks 和工具函式，以建立豐富的檔案上傳體驗。
  </x-card>
  <x-card data-title="後端：@blocklet/uploader-server" data-icon="lucide:server" data-href="/api-reference/uploader-server">
    所有用於處理檔案儲存、透過 Companion 處理遠端來源以及提供靜態或動態資源的伺服器端中介軟體函式的詳細參考。
  </x-card>
</x-cards>

如果您需要更深入地了解這些套件的建構方式以及它們如何與其他系統整合，請參閱我們的 [概念](./concepts.md) 章節。