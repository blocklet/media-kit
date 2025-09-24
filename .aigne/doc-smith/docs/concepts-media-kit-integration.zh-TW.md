# 與 Media Kit 整合

`@blocklet/uploader` 套件專為與 **Media Kit** Blocklet 的無縫、零組態整合而設計。Media Kit 提供集中的媒體儲存、管理與處理服務。當 Uploader 元件偵測到 Media Kit 安裝在相同環境中時，它會自動增強其功能，無需開發人員進行任何額外設定。

這種自動整合集中了檔案儲存，在您所有的 Blocklet 中強制執行一致的上傳規則，並動態啟用 AI 影像生成等進階功能。雖然此行為預設啟用以提供流暢的體驗，但如果您需要在自己的 Blocklet 後端處理上傳，也可以選擇退出。

## 運作方式：自動偵測與組態

此整合過程完全自動化，並在元件初始化時遵循一個簡單的兩步驟流程：

1.  **偵測**：`Uploader` 元件會掃描環境中是否安裝了具有 Media Kit 唯一 DID（`z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9`）的 Blocklet。

2.  **組態**：如果找到 Media Kit，Uploader 會向其 `/api/uploader/status` 端點發出 API 請求。此端點會回傳一個包含以下內容的組態物件：
    *   **上傳限制**：在 Media Kit 中集中管理的全域規則，例如 `maxFileSize` 和 `allowedFileTypes`。
    *   **可用外掛**：一個映射表，說明哪些進階外掛（例如 `AIImage`、`Resources`、`Uploaded`）已啟用並應顯示在 Uploader UI 中。
    *   **API 端點**：Uploader 會自動設定本身，將所有檔案上傳和相關的 API 呼叫路由到 Media Kit 的服務，確保所有媒體都儲存在一個中央位置。

下圖說明了此自動組態流程：

```d2
direction: down

blocklet-app: {
  label: "您的 Blocklet 應用程式"
  shape: rectangle

  uploader-component: {
    label: "Uploader 元件"
    shape: rectangle
  }
}

media-kit: {
  label: "Media Kit Blocklet"
  shape: rectangle

  config-api: {
    label: "組態 API\n(/api/uploader/status)"
  }

  upload-service: {
    label: "上傳服務\n(/api/uploads)"
  }

  storage: {
    label: "集中式儲存"
    shape: cylinder
  }

  config-api -> storage
  upload-service -> storage
}

blocklet-app.uploader-component -> media-kit: "1. 透過 DID 偵測是否存在"
blocklet-app.uploader-component -> media-kit.config-api: "2. 取得組態\n（限制、外掛）"
media-kit.config-api -> blocklet-app.uploader-component: "3. 回傳組態"
blocklet-app.uploader-component -> media-kit.upload-service: "4. 轉發上傳請求"
```

## 核心優勢

與 Media Kit 整合無需額外的開發工作，即可提供多項強大優勢。

<x-cards data-columns="2">
  <x-card data-title="集中式媒體管理" data-icon="lucide:library">
    所有上傳的檔案都在 Media Kit 內儲存和管理，為跨多個 Blocklet 的媒體資產建立單一事實來源。`Resources` 和 `Uploaded` 外掛讓使用者可以輕鬆瀏覽和重複使用現有資產。
  </x-card>
  <x-card data-title="動態功能外掛" data-icon="lucide:puzzle">
    如果 Media Kit 中開啟了相關功能，AI 影像生成外掛等進階功能將會自動啟用。這讓您的應用程式無需任何程式碼變更即可獲得新功能。
  </x-card>
  <x-card data-title="一致的上傳規則" data-icon="lucide:file-check-2">
    上傳限制在 Media Kit 中定義一次，並自動應用於 Uploader 的每個實例，確保一致性並簡化策略管理。
  </x-card>
  <x-card data-title="零後端設定" data-icon="lucide:server-off">
    由於 Media Kit 提供了檔案處理和儲存所需的後端服務，您無需在自己的 Blocklet 中安裝或組態 `@blocklet/uploader-server`，從而降低了複雜性。
  </x-card>
</x-cards>

## 選擇退出：停用整合

在需要使用您自己的後端邏輯和儲存（透過 `@blocklet/uploader-server`）來管理上傳的場景中，您可以停用與 Media Kit 的自動整合。這可透過將特定 props 傳遞給 `Uploader` 元件上的 `apiPathProps` 物件來完成。

-   `disableMediaKitStatus`：設定為 `true` 可防止 Uploader 從 Media Kit 取得組態（限制和外掛）。
-   `disableMediaKitPrefix`：設定為 `true` 可防止 Uploader 將 API 請求路由到 Media Kit 的端點。它將改為使用目前 Blocklet 的前綴。

```jsx 停用 Media Kit 整合的 Uploader icon=logos:react
import { Uploader } from '@blocklet/uploader/react';

export default function MyComponent() {
  return (
    <Uploader
      popup
      apiPathProps={{
        // 防止從 Media Kit 取得遠端組態
        disableMediaKitStatus: true,
        // 防止將 API 呼叫路由至 Media Kit
        disableMediaKitPrefix: true,
      }}
      // 您現在需要提供自己的限制
      // 並使用 @blocklet/uploader-server 組態您自己的後端。
      coreProps={{
        restrictions: {
          maxFileSize: 1024 * 1024 * 5, // 5MB
          allowedFileTypes: ['image/jpeg', 'image/png'],
        },
      }}
    />
  );
}
```

透過設定這些屬性，`Uploader` 元件將以獨立模式運作，完全依賴其自身的 props 以及您應用程式中組態的後端服務。您可以在 [後端設定](./getting-started-backend-setup.md) 指南中了解更多相關資訊。