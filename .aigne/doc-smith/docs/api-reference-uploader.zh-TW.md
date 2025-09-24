# 前端：@blocklet/uploader

`@blocklet/uploader` 套件提供了一個功能強大且高度可自訂的 React 元件，用於處理 Blocklet 生態系統中的檔案上傳。它建構於 [Uppy](https://uppy.io/) 之上，這是一個時尚、模組化的開源檔案上傳工具，確保了強大且使用者友善的體驗。

此套件設計為可在任何 React 應用程式中作為獨立元件無縫運作。然而，當與 [Media Kit blocklet](./concepts-media-kit-integration.md) 結合使用時，其全部潛力將被釋放，後者提供了集中式檔案管理、AI 圖片生成等進階功能以及預先配置的設定。

### 架構概覽

`Uploader` 元件作為 Uppy 實例的協調器。它將 Uppy 的核心邏輯與一套標準外掛程式（如 Webcam 和 URL 匯入）以及為 Blocklet 環境量身訂製的自訂外掛程式（如 AI Image 和 Resources）相結合。這種模組化架構帶來了極大的靈活性和豐富的功能。

```d2 Component Architecture icon=mdi:sitemap
direction: down

blocklet-app: {
  label: "您的 Blocklet 應用程式"
  shape: rectangle

  uploader-component: {
    label: "Uploader 元件"
    shape: rectangle

    uppy-ecosystem: {
      label: "Uppy 生態系統"
      shape: rectangle

      uppy-core: {
        label: "Uppy 核心實例"
      }

      standard-plugins: {
        label: "標準 Uppy 外掛程式"
        shape: rectangle
        Dashboard: {}
        Tus: {}
        Webcam: {}
        Url: {}
      }

      custom-plugins: {
        label: "自訂 Blocklet 外掛程式"
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
blocklet-app.uploader-component <-> media-kit: "提供設定和外掛程式"
```

### 核心概念

該套件提供了兩種整合上傳工具的主要方式：

1.  **直接元件：** `<Uploader />` 元件可以直接在您的應用程式中渲染。它可以設定為內嵌顯示或作為模態對話方塊顯示。
2.  **Provider 模式：** 對於更複雜的使用情境，`<UploaderProvider />` 和 `<UploaderTrigger />` 元件允許您從應用程式的任何部分（例如按鈕點擊）以程式化方式打開上傳工具。

### 基本用法

這是一個將 Uploader 渲染為彈出式模態視窗的最小範例。使用 ref 來存取其 `open` 和 `close` 方法。

```javascript Basic Uploader Example icon=logos:react
import { useRef } from 'react';
import Uploader from '@blocklet/uploader';
import Button from '@mui/material/Button';

export default function MyComponent() {
  const uploaderRef = useRef(null);

  const handleOpen = () => {
    uploaderRef.current?.open();
  };

  return (
    <div>
      <Button onClick={handleOpen}>Open Uploader</Button>
      <Uploader ref={uploaderRef} popup={true} />
    </div>
  );
}
```

這個簡單的設定將渲染一個按鈕，點擊後會打開功能齊全的 Uploader 模態視窗。

### API 參考深入探討

要充分利用 `@blocklet/uploader` 的功能，請探索其元件、掛鉤和實用工具的詳細 API 文件。

<x-cards data-columns="2">
  <x-card data-title="<Uploader /> 元件屬性" data-icon="lucide:component" data-href="/api-reference/uploader/component-props">
    探索 Uploader 元件的全部屬性，包括核心設定、儀表板選項和外掛程式配置。
  </x-card>
  <x-card data-title="<UploaderProvider /> 與 Hooks" data-icon="lucide:workflow" data-href="/api-reference/uploader/provider-hooks">
    了解如何使用 UploaderProvider 和掛鉤從應用程式的任何地方以程式化方式控制上傳工具。
  </x-card>
  <x-card data-title="可用外掛程式" data-icon="lucide:puzzle" data-href="/api-reference/uploader/plugins">
    探索像 AI 圖片生成、已上傳檔案和資源等自訂建構的外掛程式，這些外掛程式增強了上傳工具的功能。
  </x-card>
  <x-card data-title="實用函式" data-icon="lucide:wrench" data-href="/api-reference/uploader/utility-functions">
    用於檔案轉換、URL 生成和 Uppy 實例操作等任務的輔助函式參考。
  </x-card>
</x-cards>

透過理解這些建構區塊，您可以量身訂做上傳工具，使其完美符合您應用程式的需求。為了獲得完整的檔案上傳解決方案，請記得也要根據 [@blocklet/uploader-server](./api-reference-uploader-server.md) 文件中的說明來設定對應的後端服務。