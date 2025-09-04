# Internationalization (i18n)

The `@blocklet/uploader` component is designed for a global audience and comes with built-in support for multiple languages. This is achieved by extending the robust internationalization (i18n) system provided by its underlying engine, Uppy. You can easily switch between pre-configured languages or even provide your own custom translations to tailor the user interface text to your specific needs.

## Switching Languages

The simplest way to change the display language is by using the `locale` prop. By default, the uploader interface is in English (`en`). The component also includes a built-in Chinese (`zh`) locale.

To set the language, simply pass the corresponding language code to the `locale` prop:

```jsx
import Uploader from '@blocklet/uploader/react';

function App() {
  // To display the uploader in Chinese
  return <Uploader locale="zh" />;
}
```

To revert to the default English interface, you can either pass `locale="en"` or omit the prop entirely.

## Customizing Locales

For more advanced control, such as overriding specific text strings or adding a new language, you can pass a full locale object directly to `coreProps.locale`. This object allows you to define custom strings that will be merged with Uppy's base translations.

### Overriding Existing Strings

You can change any text in the interface by providing your own version. It is recommended to import the base locale from Uppy, clone it, and merge your changes to ensure all other strings have a fallback.

Here is an example of how to change the "browse" text in the English locale:

```jsx
import Uploader from '@blocklet/uploader/react';
import en_US from '@uppy/locales/lib/en_US';
import merge from 'lodash/merge';

// Create a custom locale object by merging our changes into Uppy's base English locale
const customEnglishLocale = merge(
  { ...en_US }, // Deep clone the base locale
  {
    strings: {
      browse: 'select your files',
      dropHint: 'You can drop your files here',
    },
  }
);

function App() {
  return (
    <Uploader
      coreProps={{
        locale: customEnglishLocale,
      }}
    />
  );
}
```

### Adding a New Language

The process for adding a new, unsupported language is similar. You would import a base locale from Uppy (if one exists for your target language) and then merge in your translations for the custom strings specific to `@blocklet/uploader`.

## Available Custom Strings

The `@blocklet/uploader` component adds several custom strings to the Uppy defaults. The following table lists the keys and their default values in the supported languages that you can override.

| Key | Default English Value | Default Chinese Value |
|---|---|---|
| `aiKitRequired` | Install and config the AI Kit component first | 请先安装并配置 AI Kit |
| `aiImageSelectedUse` | Use selected images | 使用已选择的图片 |
| `aiImageSelectedTip` | Please select images | 请选择心仪的图片 |
| `aiImagePrompt` | Prompt | 提示词 |
| `aiImagePromptTip` | Please enter the prompt | 请输入提示词 |
| `aiImageSize` | Size | 图片尺寸 |
| `aiImageModel` | Model | 图片模型 |
| `aiImageNumber` | Number of images | 生成数量 |
| `aiImageGenerate` | Generate | 生成图片 |
| `aiImageGenerating` | Generating... | 正在生成图片... |
| `browse` | browse | 浏览 |
| `browseFiles` | browse files | 浏览文件 |
| `browseFolders` | browse folders | 浏览文件夹 |
| `dropHint` | Drop your files here | 拖拽文件到这里 |
| `dropPasteBoth` | Drop files here, paste, %{browseFiles} or %{browseFolders} | 拖拽文件到这里、%{browseFiles}或者%{browseFolders} |
| `dropPasteFiles` | Drop files here, paste or %{browseFiles} | 拖拽文件到这里或者%{browseFiles} |
| `dropPasteFolders` | Drop files here, paste or %{browseFolders} | 拖拽文件到这里或者%{browseFolders} |
| `dropPasteImportBoth` | Drop files here, paste, %{browseFiles}, %{browseFolders} or import from: | 拖拽文件到这里、粘贴、%{browseFiles}、%{browseFolders}或者通过下方导入： |
| `dropPasteImportFiles` | Drop files here, paste, %{browseFiles} or import from: | 拖拽文件到这里、粘贴、%{browseFiles}或者通过下方导入： |
| `dropPasteImportFolders` | Drop files here, paste, %{browseFolders} or import from: | 拖拽文件到这里、粘贴、%{browseFolders}或者通过下方导入： |
| `cancel` | Back | 返回 |
| `loadingStatus` | Getting status... | 正在获取状态... |
| `aspectRatioMessage` | Please edit the required ratio for image, currently the image ratio is %{imageAspectRatio}, need %{aspectRatio} | 请编辑图片适配所需比例，目前图片比例为 %{imageAspectRatio}，需要 %{aspectRatio} |
| `editorLoading` | Waiting for image editor... | 等待图片编辑... |
| `downloadRemoteFileFailure` | Failure to get remote file ❌ | 获取远程文件失败 ❌ |
| `noAllowedFileTypes` | No allowed any file types | 不允许上传任何文件类型 |
| `allowedFileTypes` | Allowed file types: | 允许上传的文件类型： |
| `error` | Failed to initialize, please check if the related service (Media Kit) is running normally | 初始化失败，请检查相关服务（Media Kit）运行状态是否正常 |

---

Now that you understand how to handle internationalization, you may want to dive deeper into all the available configurations. For a comprehensive list of all component settings, see the [<Uploader /> Component Props](./api-reference-uploader-component-props.md) documentation.