# <UploaderProvider /> 與 Hooks

對於更進階的使用案例，您可能需要從應用程式的不同部分觸發 Uploader，或以程式化方式控制其行為。`UploaderProvider` 元件及其相關的 hooks 提供了一種靈活的方式，使用 React 的 Context API 將 Uploader 的 UI 與其觸發器分離。

當您想從標頭中的按鈕、選單中的連結或任何不是 Uploader 本身直接子元素的元素開啟 Uploader 模態框時，此模式非常理想。

此方法包含三個主要部分：

<x-cards data-columns="3">
  <x-card data-title="UploaderProvider" data-icon="lucide:box">
    一個包裝元件，它實例化 Uploader 並透過 context 提供其實例。
  </x-card>
  <x-card data-title="UploaderTrigger" data-icon="lucide:mouse-pointer-click">
    一個簡單的元件，它建立一個可點擊的區域來開啟 Uploader 模態框。
  </x-card>
  <x-card data-title="useUploaderContext" data-icon="lucide:webhook">
    一個用於直接存取 Uploader 實例以實現自訂邏輯的 hook。
  </x-card>
</x-cards>

### 運作方式

`UploaderProvider` 渲染 `<Uploader />` 元件（通常在附加到 document body 的 portal 中）並持有其實例的參考（`ref`）。提供者樹中的任何子元件都可以使用 `useUploaderContext` hook 存取此 `ref`。`UploaderTrigger` 是一個預先建置的元件，它使用此 hook 來呼叫 Uploader 實例上的 `open()` 方法。

```d2
direction: down

app-ui: {
  label: "您的應用程式 UI"
  shape: rectangle

  uploader-provider: {
    label: "UploaderProvider"
    shape: rectangle
    style.fill: "#f0f9ff"

    header: {
      label: "標頭"
      shape: rectangle

      upload-button: {
        label: "<UploaderTrigger>"
        shape: rectangle
      }
    }

    main-content: {
      label: "主要內容"
      shape: rectangle
    }
  }
}

uploader-instance: {
  label: "<Uploader /> 實例\n(在 React Portal 中)"
  shape: rectangle
  style.stroke-dash: 2
}

app-ui.uploader-provider.header.upload-button -> uploader-instance: "3. 透過 context ref 呼叫 open()"

context: {
  label: "UploaderContext"
  shape: cylinder
}

app-ui.uploader-provider -> context: "1. 提供 uploader ref"
context -> app-ui.uploader-provider.header.upload-button: "2. 使用 ref"

```

---

## `UploaderProvider`

此元件是該模式的基礎。它必須包裝任何需要與 Uploader 互動的元件，包括任何 `UploaderTrigger` 或使用 `useUploaderContext` hook 的自訂元件。

它接受與 `<Uploader />` 元件相同的所有 props，讓您可以設定 Uploader 的行為、外掛程式和外觀。對於此模式，您幾乎總是會希望設定 `popup={true}`。

### Props

| Prop | Type | Description |
|---|---|---|
| `children` | `ReactNode` | 將有權存取 Uploader context 的子元件。 |
| `popup` | `boolean` | 當為 `true` 時，Uploader 會使用 React Portal 在模態框中渲染。當為 `false` 時，它會內聯渲染。預設為 `true`。 |
| `...restProps` | `UploaderProps` | 所有其他 props 都會直接傳遞給底層的 `<Uploader />` 元件。有關完整列表，請參閱 [Uploader 元件 Props](./api-reference-uploader-component-props.md)。 |

### 使用方式

用 `UploaderProvider` 包裝您的應用程式的一部分或整個應用程式。

```javascript MyUploader.jsx icon=logos:react
import React from 'react';
import { UploaderProvider, UploaderTrigger } from '@blocklet/uploader/react';
import Button from '@mui/material/Button';

export default function MyUploader() {
  const handleUploadSuccess = (result) => {
    console.log('Files uploaded: ', result);
    // result 包含 { successful, failed } 檔案物件陣列
  };

  return (
    <UploaderProvider endpoint="/api/upload" popup={true}>
      <UploaderTrigger onChange={handleUploadSuccess}>
        <Button variant="contained">Upload File</Button>
      </UploaderTrigger>

      {/* 您的應用程式中的其他元件也可以放在這裡 */}
    </UploaderProvider>
  );
}
```

---

## `UploaderTrigger`

`UploaderTrigger` 元件是一個方便的包裝器，使其子元件可點擊，觸發 Uploader 模態框開啟。

### Props

| Prop | Type | Description |
|---|---|---|
| `children` | `ReactNode` | 用作觸發器的 React 元素，例如 `<Button>` 或 `<a>` 標籤。 |
| `onChange` | `Function` | 一個可選的回呼函式，在成功上傳後僅觸發一次。它會接收來自 Uppy 的結果物件。 |
| `...restProps` | `object` | 任何額外的 props 都會傳遞給底層的 Material-UI `<Box>` 元件。 |

### 使用方式

將任何可點擊的元件放在 `UploaderTrigger` 內。`onChange` prop 提供了一種簡單的方式來處理上傳結果。

```javascript icon=logos:react
<UploaderTrigger onChange={(result) => alert(`Uploaded ${result.successful.length} files!`)}>
  <Button>Click me to Upload</Button>
</UploaderTrigger>
```

---

## `useUploaderContext`

為了獲得最大程度的控制，`useUploaderContext` hook 讓您可以直接存取 Uploader 的實例 ref。這讓您可以以程式化方式呼叫 Uploader 或其底層 Uppy 實例上的任何方法。

### 回傳值

| Value | Type | Description |
|---|---|---|
| `uploaderRef` | `React.RefObject` | 一個 React ref 物件。Uploader 實例位於 `uploaderRef.current`。要存取 Uppy 實例，請使用 `uploaderRef.current.getUploader()`。 |

> **注意：** 如果在不是 `UploaderProvider` 後代的元件中使用此 hook，將會拋出錯誤。

### 使用方式

以下是一個自訂元件的範例，它使用 hook 來開啟 Uploader 並記錄當前選擇的檔案數量。

```javascript CustomControls.jsx icon=logos:react
import React from 'react';
import { useUploaderContext } from '@blocklet/uploader/react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

export default function CustomControls() {
  const uploaderRef = useUploaderContext();

  const handleOpenUploader = () => {
    const uploader = uploaderRef?.current?.getUploader();
    uploader?.open();
  };

  const handleLogFiles = () => {
    const uploader = uploaderRef?.current?.getUploader();
    const files = uploader?.getFiles();
    console.log('Current files in Uppy:', files);
    alert(`There are ${files.length} files selected.`);
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
      <Button variant="outlined" onClick={handleOpenUploader}>
        Open Uploader Manually
      </Button>
      <Button variant="outlined" color="secondary" onClick={handleLogFiles}>
        Log Current Files
      </Button>
    </Box>
  );
}
```

要使用此 `CustomControls` 元件，您需要將其放置在 `UploaderProvider` 內，如下所示：

```javascript App.jsx icon=logos:react
// ... 引入
import CustomControls from './CustomControls';

export default function App() {
  return (
    <UploaderProvider endpoint="/api/upload">
      {/* 您仍然可以有一個主要觸發器 */}
      <UploaderTrigger>
        <Button>Upload</Button>
      </UploaderTrigger>

      {/* 並且也可以使用您的自訂元件以獲得更多控制 */}
      <CustomControls />
    </UploaderProvider>
  );
}
```

此模式提供了高度的靈活性，讓您能夠將上傳器無縫整合到複雜的應用程式佈局和工作流程中。

接下來，您可能想探索一些可以簡化常見任務的輔助函式。

<x-card data-title="工具函式" data-icon="lucide:wrench" data-href="/api-reference/uploader/utility-functions" data-cta="檢視工具">
  了解用於檔案轉換和 URL 生成等任務的輔助函式。
</x-card>