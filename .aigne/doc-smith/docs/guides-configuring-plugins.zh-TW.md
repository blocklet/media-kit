# 設定外掛

`@blocklet/uploader` 元件建立在靈活且強大的 [Uppy](https://uppy.io/) 檔案上傳器之上。這種架構允許透過基於外掛的系統進行廣泛的自訂。Uploader 預設配置了幾個必要的外掛，以及為與 Blocklet 生態系統整合而設計的特殊外掛。

本指南將引導您如何啟用、停用和自訂這些外掛的行為，以根據您的特定需求客製化上傳器。

## 控制啟用的外掛

控制使用者可使用哪些外掛的主要方法是透過 `Uploader` 元件上的 `plugins` 屬性。預設情況下，如果您不提供此屬性，Uploader 將嘗試啟用所有可用的內建外掛。

要指定自訂的外掛集，請傳遞一個包含其 ID 字串的陣列。這將覆蓋預設設定。請注意，某些核心外掛（如 `ImageEditor` 和 `PrepareUpload`）始終處於啟用狀態，以確保基本功能。

以下是您可以控制的主要擷取器外掛的 ID：

| Plugin ID | 說明 |
|---|---|
| `Webcam` | 允許使用者使用其裝置的相機拍照和錄製影片。 |
| `Url` | 啟用從直接 URL 匯入檔案的功能。 |
| `Unsplash` | 允許使用者瀏覽並從 Unsplash 匯入圖片（需要設定）。 |
| `AIImage` | 一個啟用 AI 圖片生成功能的自訂外掛（需要 Media Kit）。 |
| `Uploaded` | 一個自訂外掛，用於瀏覽和重複使用已上傳到 Media Kit 的檔案。 |
| `Resources` | 一個自訂外掛，用於從其他提供資源的 Blocklets 中選擇檔案。 |


### 範例：僅啟用 Webcam 和 URL

如果您只希望使用者從其網路攝影機或 URL 上傳，可以這樣設定 Uploader：

```jsx Uploader with specific plugins icon=logos:react
import Uploader from '@blocklet/uploader';

function MyComponent() {
  return (
    <Uploader
      popup
      plugins={['Webcam', 'Url']}
      // ... other props
    />
  );
}
```

此設定將產生一個上傳器，除了標準的本地檔案選擇外，僅顯示 Webcam 和從 URL 匯入的選項。

## 自訂外掛選項

除了僅啟用或停用外掛之外，您還可以傳遞詳細的設定物件來自訂其行為。這是透過 `Uploader` 元件上的專用屬性完成的，這些屬性以其設定的外掛命名。

### 自訂圖片編輯器

最常被自訂的外掛是圖片編輯器。您可以使用 `imageEditorProps` 屬性控制從輸出圖片品質到可用的裁剪工具等所有內容。這些選項會直接傳遞給底層的 `@uppy/image-editor` 外掛。

有關可用選項的完整列表，請參閱 [Uppy 圖片編輯器文件](https://uppy.io/docs/image-editor/#options)。

```jsx Customizing Image Editor icon=logos:react
import Uploader from '@blocklet/uploader';

function MyImageEditor() {
  return (
    <Uploader
      popup
      imageEditorProps={{
        quality: 0.8, // Set JPEG quality to 80%
        cropperOptions: {
          viewMode: 1,
          aspectRatio: 16 / 9,
          background: false,
          autoCropArea: 1,
          responsive: true,
        },
      }}
      // ... other props
    />
  );
}
```

在此範例中，我們將圖片壓縮品質設定為 80%，並將裁剪器設定為強制執行 16:9 的長寬比。

### 設定自訂外掛

我們的自訂外掛 `Uploaded` 和 `Resources` 也透過其各自的屬性 `uploadedProps` 和 `resourcesProps` 接受設定。一個常見的用例是提供一個回呼函式，當使用者從這些來源選擇檔案時觸發，讓您可以直接處理選擇，而不是讓 Uploader 將它們新增到其佇列中。

```jsx Handling selection from Resources plugin icon=logos:react
import Uploader from '@blocklet/uploader';

function MyResourceSelector() {
  const handleFilesSelected = (files) => {
    // The files array contains metadata about the selected resources,
    // including a `uppyFile` property for each.
    console.log('User selected these files from Resources:', files);
    // You can now process these files, e.g., display them in your UI.
  };

  return (
    <Uploader
      popup
      plugins={['Resources']}
      resourcesProps={{
        onSelectedFiles: handleFilesSelected,
      }}
      // ... other props
    />
  );
}
```

## 建立您自己的外掛

Uploader 的設計是可擴充的。如果內建外掛無法滿足您的需求，您可以建立自己的自訂外掛標籤，將獨特的功能直接整合到 Uploader 的儀表板中。

<x-card data-title="建立自訂外掛" data-icon="lucide:puzzle-piece" data-href="/guides/custom-plugin" data-cta="閱讀指南">
  透過逐步指南，學習如何建置和整合您自己的自訂外掛。
</x-card>

---

透過掌握外掛設定，您可以將 Uploader 從一個通用工具轉變為一個高度專業化的元件，完美地融入您的應用程式工作流程。既然您已經知道如何設定介面，讓我們來深入了解檔案被選取後會發生什麼。

接下來，我們將探討如何在檔案成功上傳後處理它們。更多詳細資訊，請參閱 [處理上傳](./guides-handling-uploads.md) 指南。