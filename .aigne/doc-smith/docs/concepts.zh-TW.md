# 概念

`@blocklet/uploader` 套件的設計旨在兼具強大功能與易於整合的特性。為了充分利用它們，了解驅動其功能的核心概念和關鍵整合會很有幫助。本節將探討 uploader 背後的基礎技術和設計原則。

`@blocklet/uploader` 的核心建立在經過驗證的開源技術的堅實基礎之上，並透過與 Blocklet 生態系統的無縫整合得到增強。以下概念是理解其整體運作方式的關鍵。

```d2 高階架構
direction: down

blocklet-app: {
  label: "您的 Blocklet 應用程式"
  shape: rectangle

  uploader-component: {
    label: "Uploader 元件\n(@blocklet/uploader)"
    shape: rectangle

    uppy-ecosystem: {
      label: "Uppy 生態系統"
      shape: rectangle

      uppy-core: {
        label: "Uppy 核心實例"
      }

      standard-plugins: {
        label: "標準 Uppy 插件"
        shape: rectangle
        Dashboard: {}
        Tus: {}
        Webcam: {}
        Url: {}
      }

      custom-plugins: {
        label: "自訂 Blocklet 插件"
        shape: rectangle
        AIImage: {}
        Resources: {}
        Uploaded: {}
      }
    }
  }
}

media-kit: {
  label: "Media Kit Blocklet"
  shape: cylinder
}

blocklet-app.uploader-component.uppy-ecosystem.uppy-core -> blocklet-app.uploader-component.uppy-ecosystem.standard-plugins
blocklet-app.uploader-component.uppy-ecosystem.uppy-core -> blocklet-app.uploader-component.uppy-ecosystem.custom-plugins
blocklet-app.uploader-component <-> media-kit: "提供設定與插件"
```

<x-cards data-columns="3">
  <x-card data-title="與 Uppy 整合" data-icon="lucide:puzzle" data-href="/concepts/uppy-integration">
    了解 @blocklet/uploader 如何利用強大、模組化的 Uppy 函式庫來實現其核心上傳功能，包括其插件架構和可續傳上傳。
  </x-card>
  <x-card data-title="與 Media Kit 整合" data-icon="lucide:cloud" data-href="/concepts/media-kit-integration">
    探索「零設定」體驗。當 Media Kit blocklet 存在時，uploader 會自動設定自身並獲得強大的新插件。
  </x-card>
  <x-card data-title="國際化 (i18n)" data-icon="lucide:languages" data-href="/concepts/i18n">
    了解如何使用內建的本地化支援為不同語言和地區自訂 uploader 的介面。
  </x-card>
</x-cards>

了解這些概念將幫助您自訂和擴展 uploader 以滿足您的特定需求。若要深入了解，請從探索 [與 Uppy 整合](./concepts-uppy-integration.md) 開始。