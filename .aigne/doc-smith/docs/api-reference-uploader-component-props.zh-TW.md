# <Uploader /> 元件 Props

`<Uploader />` 元件是將功能齊全的檔案上傳介面整合到您的 React 應用程式中的主要方式。它建立在廣受歡迎的 [Uppy](https://uppy.io/) 函式庫之上，並可透過一組全面的 props 進行高度自訂。本指南為所有可用的 props 提供了詳細的參考，讓您可以根據您的特定需求調整上傳工具的行為、外觀和功能。

## 主要 Props

以下是您可以傳遞給 `<Uploader />` 元件的完整 props 列表。

| Prop | Type | Description |
| --- | --- | --- |
| `id` | `string` | Uppy 實例的唯一識別碼。預設為 `'Uploader'`。 |
| `popup` | `boolean` | 如果為 `true`，上傳工具將以彈出對話框的形式呈現，而非內聯。預設為 `false`。 |
| `locale` | `string` | 設定 UI 的語言。支援的值包括 'en'、'zh'。預設為 `'en'`。 |
| `onAfterResponse` | `(response: any) => void` | 在每次 HTTP 回應（來自 Tus 和 Companion）後觸發的回呼函數。 |
| `onUploadFinish` | `(request: any) => void` | 在檔案成功上傳後觸發的關鍵回呼函數。`request` 物件包含 `uploadURL` 等詳細資訊。 |
| `onOpen` | `Function` | 在上傳工具 UI（特別是在彈出模式下）開啟時觸發的回呼函數。 |
| `onClose` | `Function` | 在上傳工具 UI 關閉時觸發的回呼函數。 |
| `onChange` | `Function` | 每當新增或移除檔案時觸發的回呼函數，提供所有檔案的當前列表。 |
| `plugins` | `string[]` or `object[]` | 用於設定啟用哪些 Uppy 插件的陣列。您也可以傳遞自訂插件。詳情請參閱[設定插件](./guides-configuring-plugins.md)。 |
| `installerProps` | `object` | 傳遞給 Media Kit 的 `ComponentInstaller` 的 props，例如 `disabled` 或自訂的 `fallback`。 |
| `uploadedProps` | `object` | 自訂 'Uploaded' 插件的設定，包括 `params` 和 `onSelectedFiles` 回呼。 |
| `resourcesProps` | `object` | 自訂 'Resources' 插件的設定，包括 `params` 和 `onSelectedFiles` 回呼。 |
| `tusProps` | `TusOptions` | 直接傳遞給 `@uppy/tus` 插件的選項物件。所有選項請參閱 [Tus 文件](https://uppy.io/docs/tus/#Options)。 |
| `wrapperProps` | `HTMLAttributes<HTMLDivElement>` | 應用於主包裝 `div` 元素的 props，包括 `sx`、`className` 和 `style`。 |
| `coreProps` | `UppyOptions` | 直接傳遞給 Uppy 核心實例的選項物件。您可以在此設定全域設定，例如 `restrictions`。所有選項請參閱 [Uppy Core 文件](https://uppy.io/docs/uppy/#Options)。 |
| `dashboardProps` | `DashboardOptions` | 直接傳遞給 `@uppy/dashboard` 插件的選項物件。所有選項請參閱 [Uppy Dashboard 文件](https://uppy.io/docs/dashboard/#Options)。 |
| `apiPathProps` | `object` | 用於設定上傳工具和 Companion 的 API 端點的物件。 |
| `dropTargetProps` | `DropTarget` | `@uppy/drop-target` 插件的設定，允許將檔案拖放到指定的元素上進行上傳。 |
| `initialFiles` | `any[]` | 在上傳工具初始化時，用來預先填充的檔案物件陣列。 |
| `imageEditorProps` | `ImageEditorOptions` | 直接傳遞給 `@uppy/image-editor` 插件的選項物件。所有選項請參閱 [Uppy Image Editor 文件](https://uppy.io/docs/image-editor/#Options)。 |

## 關鍵 Props 詳解

### `onUploadFinish`

這是最重要的回呼之一。它在後端成功處理並儲存每個檔案後觸發。此回呼會收到一個包含最終 `uploadURL` 和其他元資料的 `result` 物件，您可以使用它來更新應用程式的狀態或儲存到資料庫中。

```javascript UploadHandler.jsx icon=logos:react
import React, { useState } from 'react';
import Uploader from '@blocklet/uploader/react';

export default function UploadHandler() {
  const [fileUrl, setFileUrl] = useState('');

  const handleUploadFinish = (result) => {
    console.log('File uploaded:', result);
    // result 物件包含已上傳檔案的最終 URL
    if (result.uploadURL) {
      setFileUrl(result.uploadURL);
      // 現在您可以將此 URL 儲存到您的狀態或資料庫中
    }
  };

  return (
    <div>
      <Uploader onUploadFinish={handleUploadFinish} />
      {fileUrl && <p>Last upload: <a href={fileUrl}>{fileUrl}</a></p>}
    </div>
  );
}
```

### `coreProps`

此 prop 讓您能直接存取 Uppy 核心設定。一個主要的使用情境是設定上傳限制，例如檔案類型、檔案數量和檔案大小。

```javascript RestrictedUploader.jsx icon=logos:react
import Uploader from '@blocklet/uploader/react';

export default function RestrictedUploader() {
  const restrictions = {
    maxFileSize: 1024 * 1024, // 1 MB
    maxNumberOfFiles: 3,
    allowedFileTypes: ['image/jpeg', 'image/png'],
  };

  return (
    <Uploader
      coreProps={{
        restrictions: restrictions,
      }}
    />
  );
}
```

### `plugins`

此 prop 允許您自訂 Uploader 儀表板中可用的標籤頁。您可以啟用或停用內建插件，甚至可以新增自己的自訂標籤頁。

關於如何建立您自己的插件的深入探討，請參閱[建立自訂插件](./guides-custom-plugin.md)指南。

```javascript CustomPluginUploader.jsx icon=logos:react
import Uploader from '@blocklet/uploader/react';
import { PhotoIcon } from '@heroicons/react/24/solid';

export default function CustomPluginUploader() {
  const customPlugins = [
    {
      id: 'MyCustomPlugin',
      options: {
        id: 'MyCustomPlugin',
        title: 'My Photos',
        icon: <PhotoIcon />,
      },
      onShowPanel: (ref) => {
        // 顯示自訂面板內容的邏輯
        console.log('Custom panel shown!', ref);
      },
    },
  ];

  return (
    <Uploader
      plugins={['Webcam', 'Url', ...customPlugins]}
    />
  );
}
```

### `apiPathProps`

預設情況下，上傳工具會與位於 `/api/uploads`（用於 Tus 上傳）和 `/api/companion`（用於遠端來源）的端點進行通訊。如果您的後端設定不同，您可以覆寫這些路徑。

```javascript CustomEndpoints.jsx icon=logos:react
import Uploader from '@blocklet/uploader/react';

export default function CustomEndpoints() {
  const apiPaths = {
    uploader: '/custom/tus-endpoint',
    companion: '/custom/companion-endpoint',
  };

  return (
    <Uploader apiPathProps={apiPaths} />
  );
}
```

---

在對這些 props 有了扎實的理解後，您可以設定 Uploader 以適應各種使用情境。若想進行更進階的控制，例如以程式化方式開啟上傳工具，請前往下一節關於 [UploaderProvider and Hooks](./api-reference-uploader-provider-hooks.md) 的內容。