# Internationalization (i18n)

The `@blocklet/uploader` component is designed for a global audience and includes built-in support for multiple languages. You can easily switch the display language of the Uploader interface using the `locale` prop, and you can also provide your own custom translations to override the defaults or add support for new languages.

## Supported Languages

Out of the box, the Uploader component includes support for the following languages:

-   **English (`en`)**: The default language.
-   **Chinese (`zh`)**: Simplified Chinese.

## Basic Usage

To change the language, pass the appropriate language code string to the `locale` prop. If the `locale` prop is not provided, the interface will default to English.

```jsx
import { Uploader } from '@blocklet/uploader';

function App() {
  // Render the Uploader in Chinese
  return <Uploader locale="zh" />;
}
```

## How It Works

The component's internationalization system is built upon Uppy's locale packs. For each supported language, we import the base translation from Uppy (e.g., `@uppy/locales/lib/en_US`) and then merge it with our own custom strings. This allows us to add new text for custom features (like AI Image Generation) or override existing Uppy text.

Here is a simplified view of how the English (`en`) locale is constructed:

```javascript
import en_US from '@uppy/locales/lib/en_US';
import merge from 'lodash/merge';

const customStrings = {
  strings: {
    // Custom string for AI Image Generation feature
    aiKitRequired: 'Install and config the AI Kit component first',
    aiImageGenerate: 'Generate',

    // Override Uppy's default string
    dropHint: 'Drop your files here',

    // Add more specific browse options
    browse: 'browse',
    browseFiles: 'browse files',
    browseFolders: 'browse folders',
  },
};

// The final locale object is a deep merge of Uppy's defaults and our customizations
const enLocale = merge({ ...en_US }, customStrings);
```

## Customizing Locales

If you need to change a specific text string or add support for an unsupported language, you can pass a full locale object to the `coreProps.locale` property. This gives you complete control over the text displayed in the Uploader.

### Overriding Existing Strings

In this example, we'll customize the main drop hint text in the English locale.

```jsx
import { Uploader } from '@blocklet/uploader';
import uppyEn from '@uppy/locales/lib/en_US';
import merge from 'lodash/merge';

// Create a deep clone of the base Uppy English locale
const myCustomEnLocale = merge({}, uppyEn);

// Override specific strings
myCustomEnLocale.strings.dropHint = 'Drop your awesome files here!';
myCustomEnLocale.strings.aiImageGenerate = 'Create with AI';

function MyCustomUploader() {
  return (
    <Uploader
      coreProps={{
        locale: myCustomEnLocale,
      }}
    />
  );
}
```

### Adding a New Language

You can also define a completely new language by creating a new locale object.

```jsx
import { Uploader } from '@blocklet/uploader';

const frLocale = {
  strings: {
    // It's recommended to start by copying from the English locale
    // and translating the values.
    dropHint: 'Déposez vos fichiers ici',
    browse: 'parcourir',
    aiImageGenerate: 'Générer',
    // ... add all other required strings
  },
};

function MyFrenchUploader() {
  return (
    <Uploader
      coreProps={{
        locale: frLocale,
      }}
    />
  );
}
```

## Available Custom Strings

Below is a sample of the custom strings added or overridden by `@blocklet/uploader` that are available for customization.

| Key | English (`en`) | Chinese (`zh`) |
|---|---|---|
| `aiKitRequired` | Install and config the AI Kit component first | 请先安装并配置 AI Kit |
| `aiImageGenerate` | Generate | 生成图片 |
| `aiImageGenerating` | Generating... | 正在生成图片... |
| `browseFolders` | browse folders | 浏览文件夹 |
| `dropHint` | Drop your files here | 拖拽文件到这里 |
| `error` | Failed to initialize, please check if the related service (Media Kit) is running normally | 初始化失败，请检查相关服务（Media Kit）运行状态是否正常 |
| `downloadRemoteFileFailure` | Failure to get remote file ❌ | 获取远程文件失败 ❌ |

To learn more about how `@blocklet/uploader` builds upon Uppy, see our guide on [Integration with Uppy](./concepts-uppy-integration.md).