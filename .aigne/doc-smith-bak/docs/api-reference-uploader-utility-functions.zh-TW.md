# 公用程式函式

`@blocklet/uploader/utils` 模組匯出一系列輔助函式，旨在簡化與檔案處理、URL 操作、Uppy 實例自訂和網路配置相關的常見任務。這些公用程式由 Uploader 元件內部使用，但也可用於您的應用程式中，以實現更進階的整合。

## 檔案與 Blob 操作

這些函式可幫助您處理不同的檔案格式和表示形式，例如 Blob、base64 字串和 File 物件。

| 函式 | 說明 |
| --- | --- |
| `isBlob(file)` | 檢查給定的輸入是否為 `Blob` 的實例。 |
| `getObjectURL(fileBlob)` | 從 `Blob` 或 `File` 物件建立一個本地物件 URL（例如 `blob:http://...`），可用於客戶端預覽。 |
| `blobToFile(blob, fileName)` | 將 `Blob` 物件轉換為 `File` 物件，並為其指定檔案名稱。 |
| `base64ToFile(base64, fileName)` | 將 base64 編碼的字串轉換為 `File` 物件。對於處理資料 URL 很有用。 |
| `isSvgFile(file)` | 透過檢查檔案的 MIME 類型、副檔名和內容，非同步地檢查檔案是否為 SVG。 |
| `getExt(uppyFile)` | 從 Uppy 檔案物件中提取檔案副檔名，同時使用其名稱和 MIME 類型以確保準確性。 |

### 範例：將 Base64 轉換為檔案

```javascript icon=logos:javascript
import { base64ToFile, getObjectURL } from '@blocklet/uploader/utils';

const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...';
const imageFile = base64ToFile(base64Image, 'my-image.png');

// 現在您可以使用此檔案物件，例如，建立預覽
const previewUrl = getObjectURL(imageFile);
console.log(previewUrl);

// 或將其新增至 Uppy 實例
// uppy.addFile({ name: imageFile.name, type: imageFile.type, data: imageFile });
```

## URL 與路徑管理

用於建構和操作 URL 的函式，特別是與 Media Kit 的 CDN 和上傳器的後端端點互動。

| 函式 | 說明 |
| --- | --- |
| `createImageUrl(filename, width, height, overwritePrefixPath)` | 為儲存在 Media Kit 中的圖片建構一個 URL。它可以附加查詢參數以進行即時調整大小（`w`、`h`）。 |
| `getDownloadUrl(src)` | 取得 Media Kit 圖片 URL 並移除調整大小參數（`w`、`h`、`q`），以建立用於下載原始檔案的 URL。 |
| `getUploaderEndpoint(apiPathProps)` | 根據傳遞給 `Uploader` 元件的 props，產生上傳器 (Tus) 和 Companion 端點的絕對 URL。 |
| `setPrefixPath(apiPathProps)` | 設定用於 API 請求的內部前綴路徑，讓您可以覆寫使用 Media Kit 掛載點的預設行為。 |

### 範例：產生調整大小後的圖片 URL

```javascript icon=logos:javascript
import { createImageUrl } from '@blocklet/uploader/utils';

// 為 'photo.jpg' 產生一個寬度為 200px 的 URL
const thumbnailUrl = createImageUrl('photo.jpg', 200);
// 結果：https://your-cdn.com/uploads/photo.jpg?imageFilter=resize&w=200

// 為同一張圖片產生同時具有寬度和高度的 URL
const sizedImageUrl = createImageUrl('photo.jpg', 400, 300);
// 結果：https://your-cdn.com/uploads/photo.jpg?imageFilter=resize&w=400&h=300
```

## Uppy 實例增強

### `initUppy(uppyInstance)`

這是一個強大的函式，它透過自訂方法、事件處理常式和為 Blocklet 環境量身打造的改進邏輯，來增強標準的 Uppy 核心實例。它由 `<Uploader />` 元件自動使用，但如果您要建立自己的 Uppy 實例，也可以手動使用。

**主要增強功能：**

*   **自訂成功事件**：新增一個強大的事件系統來處理成功上傳。
    *   `uppy.onUploadSuccess(file, callback)`：監聽成功上傳，可選地針對特定檔案。
    *   `uppy.onceUploadSuccess(file, callback)`：與上述相同，但監聽器在執行一次後會被移除。
    *   `uppy.emitUploadSuccess(file, response)`：手動觸發成功事件。
*   **程式化上傳**：新增一個 `async` 輔助方法，以便輕鬆進行程式化上傳。
    *   `uppy.uploadFile(blobFile)`：接收一個 `Blob` 或 `File` 物件，將其新增至 Uppy，上傳它，並傳回一個 Promise，該 Promise 會解析為上傳結果。
*   **自訂開啟/關閉事件**：提供一種簡潔的方式來監聽 Uploader 儀表板的開啟或關閉。
    *   `uppy.onOpen(callback)` / `uppy.onClose(callback)`
*   **改進的邏輯**：覆寫預設的 Uppy 方法，如 `removeFiles` 和 `calculateTotalProgress`，以更好地與後端整合並提供更準確的進度報告。

### 範例：使用 `initUppy` 進行程式化上傳

```javascript icon=logos:javascript
import Uppy from '@uppy/core';
import { initUppy } from '@blocklet/uploader/utils';

// 1. 建立一個標準的 Uppy 實例
let uppy = new Uppy();

// 2. 使用自訂方法增強它
uppy = initUppy(uppy);

async function uploadMyFile(fileBlob) {
  try {
    console.log('開始上傳...');
    const result = await uppy.uploadFile(fileBlob);
    console.log('上傳成功！', result.response.data.fileUrl);
  } catch (error) {
    console.error('上傳失敗：', error);
  }
}

// 建立一個假檔案並上傳它
const myFile = new File(['hello world'], 'hello.txt', { type: 'text/plain' });
uploadMyFile(myFile);
```

## 模擬與測試

### `mockUploaderFileResponse(file)`

此公用程式對於測試或將預先存在的檔案新增至 Uploader 的 UI 而無需實際的上傳，非常有價值。它接收一個簡單的檔案物件，並產生一個完整的、與 Uppy 相容的回應物件，模擬成功的 Tus 上傳。

這讓您可以使用已儲存在 Media Kit 中的檔案來填充儀表板。

### 範例：將現有檔案新增至 UI

```javascript icon=logos:javascript
import { mockUploaderFileResponse } from '@blocklet/uploader/utils';

// 假設 'uppy' 是您已初始化的 Uppy 實例

// 1. 定義您現有的檔案資料
const existingFile = {
  fileUrl: 'https://domain.com/uploads/existing-image.png',
  originalname: 'existing-image.png',
  mimetype: 'image/png',
  size: 12345,
  _id: 'file123',
};

// 2. 產生模擬回應
const mockResponse = mockUploaderFileResponse(existingFile);

// 3. 將檔案新增至 Uppy 的狀態並發出成功事件
if (mockResponse) {
  uppy.addFile(mockResponse.file);
  uppy.emit('upload-success', mockResponse.file, mockResponse.responseResult);
}
```