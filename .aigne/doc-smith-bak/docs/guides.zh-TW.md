# 指南

歡迎來到指南部分。在這裡，您將找到實用的、以任務為導向的演練，幫助您為上傳器實作常見功能和自訂設定。這些指南建立在 [入門](./getting-started.md) 部分介紹的概念之上，為真實世界的情境提供逐步說明。

這些指南涵蓋了前端 `@blocklet/uploader` 元件和使用 `@blocklet/uploader-server` 進行的可選後端自訂。請記住，前端元件可以獨立運作，而後端套件則用於新增自訂的伺服器端上傳處理並啟用遠端來源。

<x-cards data-columns="2">
  <x-card data-title="設定外掛" data-icon="lucide:settings-2" data-href="/guides/configuring-plugins">
    了解如何啟用、停用 Uppy 外掛，並為其傳遞自訂選項，例如圖片編輯器、網路攝影機和 URL 匯入器。
  </x-card>
  <x-card data-title="處理上傳" data-icon="lucide:upload-cloud" data-href="/guides/handling-uploads">
    在前端和後端實作回呼，以在成功上傳後處理檔案並存取其元資料。
  </x-card>
  <x-card data-title="整合遠端來源" data-icon="lucide:link" data-href="/guides/remote-sources">
    在您的後端設定 Companion 中介軟體，以允許使用者從 Unsplash 和直接 URL 等遠端來源匯入檔案。
  </x-card>
  <x-card data-title="建立自訂外掛" data-icon="lucide:puzzle" data-href="/guides/custom-plugin">
    透過使用提供的 VirtualPlugin 元件建立您自己的自訂外掛標籤頁，來擴充上傳器的功能。
  </x-card>
</x-cards>

在完成這些指南後，您將對如何根據您的特定需求調整上傳器有深入的了解。如需更深入的資訊，您可以深入研究 [API 參考](./api-reference.md)。