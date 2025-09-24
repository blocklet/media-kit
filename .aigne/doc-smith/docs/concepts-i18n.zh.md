# 国际化 (i18n)

`@blocklet/uploader` 组件在设计时考虑到了全球用户，为多种语言和文本定制提供了强大的支持。这使您能够创建无缝的用户体验，让您的用户无论身在何处都能感到亲切自然。

本指南将说明如何在内置语言之间切换，以及如何提供您自己的自定义翻译。

## 切换内置语言

该组件附带了英语 (`en`) 和中文 (`zh`) 的预配置语言包。更改显示语言最简单的方法是使用 `locale` 属性。

```jsx Uploader with Chinese locale icon=logos:react
import { Uploader } from '@blocklet/uploader/react';

function MyComponent() {
  return <Uploader locale="zh" />;
}
```

设置 `locale="zh"` 将自动将整个用户界面翻译成中文。默认语言是英语 (`en`)。

## 自定义文本和添加新语言

为了实现更高级的控制，例如覆盖特定的文本字符串或添加对新语言的支持，您可以向 Uploader 提供一个自定义的 locale 对象。这可以通过 `coreProps.locale` 属性完成，它让您能够直接访问底层 Uppy 实例的配置。

一个 locale 对象包含一个 `strings` 键，该键包含了 UI 中使用的所有文本。

### 覆盖现有字符串

您可以轻松更改任何文本，以更好地匹配您应用程序的语气或术语。例如，让我们更改主要的拖放提示。

首先，从包中导入一个基础 locale 对象，然后合并您的更改。

```javascript Customizing the drop hint text icon=logos:javascript
import { Uploader } from '@blocklet/uploader/react';
import { locales } from '@blocklet/uploader/i18n';
import merge from 'lodash/merge';

// 创建默认英语 locale 的深拷贝
const customEnglishLocale = merge({}, locales.en);

// 覆盖您想要更改的特定字符串
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

### 添加新语言

要添加默认未包含的语言，您需要创建一个完整的 locale 对象。推荐的方法是从 Uppy 的庞大集合中导入一个基础 locale，然后将其与 `@blocklet/uploader` 特有的自定义字符串的翻译进行合并。

以下是如何创建一个基础法语 locale 的示例：

```javascript Adding a French locale icon=logos:javascript
import { Uploader } from '@blocklet/uploader/react';
import fr_FR from '@uppy/locales/lib/fr_FR'; // 基础 Uppy locale
import merge from 'lodash/merge';

// 通过合并 Uppy 的法语包创建一个自定义 locale 对象
// 并加入我们自定义字符串的翻译。
const customFrenchLocale = merge({}, fr_FR, {
  strings: {
    // 来自 @blocklet/uploader 的自定义字符串
    aiKitRequired: 'Veuillez installer et configurer le kit AI',
    aiImageGenerate: 'Générer',
    aiImageGenerating: 'Génération en cours...',
    browseFiles: 'parcourir les fichiers',
    browseFolders: 'parcourir les dossiers',
    dropHint: 'Déposez vos fichiers ici',
    // ... 等等，适用于所有其他自定义字符串
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

## 可自定义的字符串

虽然 `@blocklet/uploader` 从 Uppy 生态系统继承了大部分字符串，但它也为其独特功能添加了几个自定义字符串。以下是您可以覆盖的这些特定键的列表。

| 键 | 默认（英语）描述 |
|---|---|
| `aiKitRequired` | 当使用 AI 图像插件但未配置 AI Kit 时显示的文本。 |
| `aiImageSelectedUse` | 用于确认使用所选 AI 生成图像的按钮文本。 |
| `aiImageSelectedTip` | 提示用户选择一张图片的提示信息。 |
| `aiImagePrompt` | AI 图像提示输入字段的标签。 |
| `aiImagePromptTip` | 提示输入的占位符文本。 |
| `aiImageSize` | 图像尺寸选择器的标签。 |
| `aiImageModel` | 图像模型选择器的标签。 |
| `aiImageNumber` | 用于生成图像数量的标签。 |
| `aiImageGenerate` | 开始生成图像的按钮文本。 |
| `aiImageGenerating` | 生成图像时显示的文本。 |
| `browseFolders` | “浏览文件夹”链接的文本。 |
| `dropHint` | 拖放区域显示的主要文本。 |
| `dropPasteBoth` | 当文件和文件夹都可以浏览时，拖放区域的文本。 |
| `dropPasteFiles` | 当只能浏览文件时，拖放区域的文本。 |
| `dropPasteFolders` | 当只能浏览文件夹时，拖放区域的文本。 |
| `cancel` | “返回”或“取消”按钮的文本。 |
| `loadingStatus` | 检查 Media Kit 状态时显示的文本。 |
| `aspectRatioMessage` | 对于不符合所需宽高比的图像的警告消息。 |
| `editorLoading` | 图像编辑器加载时显示的消息。 |
| `downloadRemoteFileFailure` | 当远程文件（例如，来自 URL 的文件）下载失败时的错误消息。 |
| `noAllowedFileTypes` | 当 `allowedFileTypes` 为空数组时显示的消息。 |
| `allowedFileTypes` | 允许文件类型列表的前缀。 |
| `error` | 常规初始化错误消息。 |

有关可供翻译的所有字符串的完整列表，请参阅官方 Uppy locale 文档。

---

通过利用这个灵活的 i18n 系统，您可以确保您应用程序的文件上传器对所有用户都易于访问和直观。有关 Uppy 配置的更多详细信息，请参阅 [与 Uppy 集成](./concepts-uppy-integration.md) 指南。