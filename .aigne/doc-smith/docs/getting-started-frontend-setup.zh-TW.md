# 前端設定 (@blocklet/uploader)

本指南將引導您完成在 Blocklet 中安裝與整合 `@blocklet/uploader` React 元件的過程。此元件提供一個功能豐富的檔案上傳使用者介面，它建立在功能強大且可擴展的 [Uppy](https://uppy.io/) 檔案上傳器之上。

閱讀完本指南後，您的應用程式中將會有一個可運作的上傳器元件，並準備好連接到後端服務。為獲得無縫的體驗，我們建議使用我們的配套後端套件，您可以在 [後端設定](./getting-started-backend-setup.md) 指南中了解相關資訊。

## 1. 安裝

首先，將 `@blocklet/uploader` 套件新增至您專案的依賴項中。在您專案的根目錄中開啟終端機，並執行以下指令：

```bash pnpm icon=logos:pnpm
pnpm add @blocklet/uploader
```

## 2. 匯入樣式

The Uploader 元件依賴 Uppy 生態系統中的數個 CSS 檔案來實現其外觀和功能。您需要將這些樣式表匯入到應用程式的進入點（例如 `src/index.js` 或 `src/App.js`），以確保元件能正確渲染。

```javascript App Entry Point (e.g., src/App.js) icon=logos:javascript
// 匯入 Uppy 的核心和外掛程式樣式
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import '@uppy/webcam/dist/style.min.css';
import '@uppy/image-editor/dist/style.min.css';
import '@uppy/drag-drop/dist/style.min.css';
import '@uppy/drop-target/dist/style.min.css';
import '@uppy/status-bar/dist/style.min.css';

// ... 您應用程式進入點檔案的其餘部分
```

## 3. 基本用法：彈出式上傳器

使用上傳器最簡單的方法是將其渲染為一個彈出式對話方塊。我們將使用 React 的 `lazy` 載入，僅在需要時才載入元件，以提高效能。

以下是一個包含開啟上傳器按鈕的元件完整範例。

```jsx UploaderButton.js icon=logos:react
import { lazy, useRef, Suspense } from 'react';

// 延遲匯入 Uploader 元件
const UploaderComponent = lazy(() => import('@blocklet/uploader').then((res) => ({ default: res.Uploader })));

export default function UploaderButton() {
  const uploaderRef = useRef(null);

  const handleUploadFinish = (result) => {
    // 'result' 物件包含有關已上傳檔案的詳細資訊
    console.log('Upload successful!', result);
    // 您現在可以使用 result.uploadURL 或 result.data 中的檔案 URL
    alert(`File uploaded to: ${result.uploadURL}`);
  };

  const openUploader = () => {
    // 上傳器實例有一個 `open` 方法
    uploaderRef.current?.getUploader()?.open();
  };

  return (
    <div>
      <button type="button" onClick={openUploader}>
        Open Uploader
      </button>

      {/* Uploader 元件已渲染但隱藏，直到被開啟 */}
      {/* 使用 Suspense 來處理元件的延遲載入 */}
      <Suspense fallback={<div>Loading...</div>}>
        <UploaderComponent
          ref={uploaderRef}
          popup // 此 prop 使上傳器成為一個彈出式對話方塊
          onUploadFinish={handleUploadFinish}
        />
      </Suspense>
    </div>
  );
}
```

在此範例中：
- 我們建立一個 `ref` (`uploaderRef`) 來存取 Uploader 元件的實例方法。
- `popup` prop 將上傳器設定為一個彈出式對話方塊，其由內部管理。
- 按鈕的 `onClick` 處理常式呼叫上傳器實例上的 `open()` 方法，使其可見。
- 每個檔案成功上傳後，會觸發 `onUploadFinish` 回呼函式，並接收檔案的元資料作為參數。

## 4. 進階用法：使用 Provider

對於更複雜的應用程式，您可能希望從各種元件觸發上傳器，而無需在元件樹中向下傳遞 ref。`@blocklet/uploader` 套件透過 `UploaderProvider` 和 `UploaderTrigger` 為此情境提供了一個基於 context 的解決方案。

這種方法將上傳器的狀態與觸發它的元件分離開來。

```jsx App.js icon=logos:react
import { UploaderProvider, UploaderTrigger } from '@blocklet/uploader';

function MyPageComponent() {
  return (
    <div>
      <h2>My Page</h2>
      <p>Click the button below to upload a file.</p>
      {/* UploaderTrigger 是一個簡單的包裝器，點擊時會開啟上傳器 */}
      <UploaderTrigger>
        <button type="button">Upload File</button>
      </UploaderTrigger>
    </div>
  );
}

export default function App() {
  const handleUploadFinish = (result) => {
    console.log('File uploaded from Provider:', result.uploadURL);
  };

  return (
    // 用 UploaderProvider 包裝您的應用程式或其一部分
    <UploaderProvider popup onUploadFinish={handleUploadFinish}>
      <h1>My Application</h1>
      <MyPageComponent />
      {/* 您可以在這裡有另一個觸發器 */}
      <UploaderTrigger>
        <a>Or click this link</a>
      </UploaderTrigger>
    </UploaderProvider>
  );
}

```

### 運作方式

1.  **`UploaderProvider`**: 此元件初始化並持有 Uploader 實例。它應放置在元件樹的較高層級。`Uploader` 元件的所有 props（如 `popup` 和 `onUploadFinish`）都會傳遞給 provider。
2.  **`UploaderTrigger`**: 任何被 `UploaderTrigger` 包裝的元件都會變成一個可點擊的元素，用來開啟上傳器彈出視窗。它可以包裝按鈕、連結或任何其他元素。

這種模式非常靈活，有助於保持您的元件邏輯清晰。

---

## 後續步驟

您現在擁有一個功能齊全的前端上傳器元件。然而，要實際儲存上傳的檔案，您需要一個後端服務來接收它們。

<x-card data-title="後端設定 (@blocklet/uploader-server)" data-icon="lucide:server" data-href="/getting-started/backend-setup" data-cta="Continue">
  了解如何在您基於 Express 的 blocklet 中安裝和設定必要的後端中介軟體來處理檔案上傳。
</x-card>