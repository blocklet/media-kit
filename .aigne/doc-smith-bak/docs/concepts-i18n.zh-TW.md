# 國際化 (i18n)

`@blocklet/uploader` 元件的設計考慮到了全球使用者，為多語言和文字自訂提供了強大的支援。這讓您能夠創造出無縫的使用者體驗，讓使用者無論身在何處都能感到親切自然。

本指南將說明如何在內建語言之間切換，以及如何提供您自己的自訂翻譯。

## 在內建語言之間切換

該元件隨附了英語 (`en`) 和中文 (`zh`) 的預設語言包。變更顯示語言最簡單的方法是使用 `locale` 屬性。

```jsx Uploader with Chinese locale icon=logos:react
import { Uploader } from '@blocklet/uploader/react';

function MyComponent() {
  return <Uploader locale="zh" />;
}
```

設定 `locale="zh"` 會自動將整個使用者介面翻譯成中文。預設語言是英語 (`en`)。

## 自訂文字與新增語言

若想進行更進階的控制，例如覆蓋特定的文字字串或新增對新語言的支援，您可以向 Uploader 提供一個自訂的 locale 物件。這可以透過 `coreProps.locale` 屬性來完成，它讓您能夠直接存取底層 Uppy 實例的設定。

一個 locale 物件包含一個 `strings` 鍵，其中包含了使用者介面中使用的所有文字。

### 覆蓋現有字串

您可以輕鬆地更改任何文字，以更好地匹配您應用程式的語氣或術語。例如，讓我們來更改主要的拖放提示。

首先，從套件中匯入一個基礎 locale 物件，然後合併您的變更。

```javascript Customizing the drop hint text icon=logos:javascript
import { Uploader } from '@blocklet/uploader/react';
import { locales } from '@blocklet/uploader/i18n';
import merge from 'lodash/merge';

// 建立預設英語 locale 的深度副本
const customEnglishLocale = merge({}, locales.en);

// 覆蓋您想要變更的特定字串
customEnglishLocale.strings.dropHint = 'Drop your awesome files here!';

function MyComponent() {
  return (
    <Uploader
      coreProps={{
        locale: customEnglishLocale,
      }}
    />
  );
}
```

### 新增語言

要新增預設未包含的語言，您需要建立一個完整的 locale 物件。建議的方法是從 Uppy 龐大的集合中匯入一個基礎 locale，然後將其與針對 `@blocklet/uploader` 的自訂字串的翻譯進行合併。

以下是一個如何建立基本法語 locale 的範例：

```javascript Adding a French locale icon=logos:javascript
import { Uploader } from '@blocklet/uploader/react';
import fr_FR from '@uppy/locales/lib/fr_FR'; // 基礎 Uppy locale
import merge from 'lodash/merge';

// 透過合併 Uppy 的法語包與我們自訂字串的翻譯
// 來建立一個自訂的 locale 物件。
const customFrenchLocale = merge({}, fr_FR, {
  strings: {
    // 來自 @blocklet/uploader 的自訂字串
    aiKitRequired: 'Veuillez installer et configurer le kit AI',
    aiImageGenerate: 'Générer',
    aiImageGenerating: 'Génération en cours...',
    browseFiles: 'parcourir les fichiers',
    browseFolders: 'parcourir les dossiers',
    dropHint: 'Déposez vos fichiers ici',
    // ... 等等，適用於所有其他自訂字串
  },
});

function MyComponent() {
  return (
    <Uploader
      coreProps={{
        locale: customFrenchLocale,
      }}
    />
  );
}
```

## 可自訂的字串

雖然 `@blocklet/uploader` 從 Uppy 生態系統繼承了大部分字串，但它也為其獨特功能新增了幾個自訂字串。以下是您可以覆蓋的這些特定鍵的列表。

| 鍵 | 預設（英文）描述 |
|---|---|
| `aiKitRequired` | 當使用 AI 圖片外掛程式但未設定 AI Kit 時顯示的文字。 |
| `aiImageSelectedUse` | 用於確認使用所選 AI 生成圖片的按鈕文字。 |
| `aiImageSelectedTip` | 提示使用者選擇一張圖片的提示文字。 |
| `aiImagePrompt` | AI 圖片提示詞輸入欄位的標籤。 |
| `aiImagePromptTip` | 提示詞輸入框的佔位文字。 |
| `aiImageSize` | 圖片大小選擇器的標籤。 |
| `aiImageModel` | 圖片模型選擇器的標籤。 |
| `aiImageNumber` | 要生成圖片數量的標籤。 |
| `aiImageGenerate` | 開始生成圖片的按鈕文字。 |
| `aiImageGenerating` | 圖片生成過程中顯示的文字。 |
| `browseFolders` | 「瀏覽資料夾」連結的文字。 |
| `dropHint` | 顯示在拖放區域的主要文字。 |
| `dropPasteBoth` | 當可以瀏覽檔案和資料夾時，拖放區域顯示的文字。 |
| `dropPasteFiles` | 當只能瀏覽檔案時，拖放區域顯示的文字。 |
| `dropPasteFolders` | 當只能瀏覽資料夾時，拖放區域顯示的文字。 |
| `cancel` | 「返回」或「取消」按鈕的文字。 |
| `loadingStatus` | 檢查 Media Kit 狀態時顯示的文字。 |
| `aspectRatioMessage` | 針對不符合所需長寬比的圖片的警告訊息。 |
| `editorLoading` | 圖片編輯器載入時顯示的訊息。 |
| `downloadRemoteFileFailure` | 當遠端檔案（例如，來自 URL）下載失敗時的錯誤訊息。 |
| `noAllowedFileTypes` | 當 `allowedFileTypes` 為空陣列時顯示的訊息。 |
| `allowedFileTypes` | 允許檔案類型列表的前綴。 |
| `error` | 一般的初始化錯誤訊息。 |

有關所有可供翻譯的字串的完整列表，請參閱官方 Uppy locale 文件。

---

透過利用這個靈活的 i18n 系統，您可以確保您應用程式的檔案上傳工具對所有使用者都是可存取且直觀的。有關 Uppy 設定的更多詳細資訊，請參閱 [與 Uppy 整合](./concepts-uppy-integration.md) 指南。