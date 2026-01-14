# 與 Uppy 整合

`@blocklet/uploader` 套件直接建構在 [Uppy](https://uppy.io/) 之上，Uppy 是一個時尚、模組化且開源的網頁檔案上傳工具。我們沒有從頭開始建構檔案上傳工具，而是利用 Uppy 強大的核心引擎、豐富的外掛生態系統以及精美的用戶介面。這使我們能夠提供一個穩定且功能豐富的上傳體驗，同時專注於在 Blocklet 生態系統中實現無縫整合。

這種方法意味著 `@blocklet/uploader` 基本上是 Uppy 的一個預先配置和增強的封裝器，專為 Blocklet 開發量身打造。

## 核心架構

`Uploader` 元件會初始化並管理一個核心的 Uppy 實例。然後，它會整合一套標準的 Uppy 外掛以實現常用功能（例如 Dashboard UI、Webcam 存取和用於可續傳上傳的 Tus），並疊加專為與其他 Blocklet（例如 Media Kit）互動而設計的自訂外掛。

下圖說明了這種關係：

```d2
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
        label: "標準 Uppy 外掛"
        shape: rectangle
        Dashboard: {}
        Tus: {}
        Webcam: {}
        Url: {}
        ImageEditor: {}
      }

      custom-plugins: {
        label: "自訂 Blocklet 外掛"
        shape: rectangle
        AIImage: {}
        Resources: {}
        Uploaded: {}
      }
    }
  }
}

blocklet-app.uploader-component.uppy-ecosystem.uppy-core -> blocklet-app.uploader-component.uppy-ecosystem.standard-plugins: "管理"
blocklet-app.uploader-component.uppy-ecosystem.uppy-core -> blocklet-app.uploader-component.uppy-ecosystem.custom-plugins: "管理"
```

## 存取核心 Uppy 實例

對於進階使用情境，您可能需要直接與底層的 Uppy 實例互動以存取其豐富的 API。`Uploader` 元件提供了一個 `ref`，它公開了一個 `getUploader()` 方法，讓您可以完全存取 Uppy 物件。

這讓您可以透過程式控制上傳工具、監聽 Uppy 特定的事件，或呼叫 [Uppy API 文件](https://uppy.io/docs/uppy/) 中可用的任何方法。

```jsx 存取 Uploader 實例 icon=logos:react
import { useRef, useEffect } from 'react';
import { Uploader } from '@blocklet/uploader';

export default function MyComponent() {
  const uploaderRef = useRef(null);

  useEffect(() => {
    if (uploaderRef.current) {
      const uppy = uploaderRef.current.getUploader();

      // 現在您可以使用完整的 Uppy API
      uppy.on('complete', (result) => {
        console.log('上傳完成！', result.successful);
      });

      console.log('Uppy 實例已準備就緒：', uppy.getID());
    }
  }, []);

  return <Uploader ref={uploaderRef} popup />;
}
```

## 前後端分離

重要的是要理解 `@blocklet/uploader` 是一個純前端套件。它負責使用者介面和客戶端的上傳邏輯。它**不依賴於 `@blocklet/uploader-server`**。

預設情況下，它使用 [Tus 協定](https://tus.io/) 進行可續傳上傳，這意味著它可以與*任何*後端伺服器通訊，只要該伺服器實現了 Tus 規範。`@blocklet/uploader-server` 是為 Blocklet 開發者提供的一個方便、開箱即用的後端解決方案，但您也可以自由地實現自己的後端或使用其他與 Tus 相容的服務。

## 更多資訊

雖然我們的文件涵蓋了 `@blocklet/uploader` 最常見的使用情境和配置，但對於更進階的主題，Uppy 的官方文件是一個非常寶貴的資源。如果您想深入了解 Uppy 的核心概念、探索其完整的外掛系列，甚至建立自己的自訂外掛，他們的網站是最佳的起點。

<x-card data-title="Uppy 官方文件" data-icon="lucide:book-open" data-href="https://uppy.io/docs/quick-start/" data-cta="訪問 Uppy.io">
  探索全面的 Uppy 文件，以獲得深入的指南、API 參考和進階自訂選項。
</x-card>