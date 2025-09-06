# Internationalization (i18n)

The `@blocklet/uploader` component is designed for a global audience and comes with built-in support for multiple languages. This allows you to provide a localized user experience by changing the text in the UI to match the user's language preference. The internationalization system is built upon Uppy's locale packs, extending them with custom strings for features unique to the Blocklet Uploader.

This guide explains how to use the built-in languages and how to customize the text or add support for a new language.

## Using Built-in Languages

The Uploader component includes built-in support for English (`en`) and Chinese (`zh`). You can easily switch between these languages by passing the corresponding language code to the `locale` prop.

```jsx
import Uploader from '@blocklet/uploader';

// To display the Uploader in English (default)
<Uploader locale="en" />

// To display the Uploader in Chinese
<Uploader locale="zh" />
```

When you set the `locale` prop, the component automatically loads all the necessary strings, including both standard Uppy text and custom text for plugins like AI Image Generation.

## Customizing Locales

For more advanced control, such as overriding specific text strings or adding a new language, you can provide a full locale object to the Uploader's core configuration. This is done through the `coreProps.locale` prop.

The process involves three main steps:
1.  Import a base locale pack from Uppy.
2.  Define your custom strings or overrides.
3.  Merge the base pack with your custom strings and pass the result to the Uploader.

Here is an example of how to customize the English locale to change the text of the AI image generation button:

```jsx
import Uploader from '@blocklet/uploader';
import en_US from '@uppy/locales/lib/en_US';
import merge from 'lodash/merge';

// 1. Create a deep clone of the base locale to avoid modifying the original
const customLocale = { ...en_US };

// 2. Define the custom strings you want to override
const customStrings = {
  strings: {
    aiImageGenerate: 'Create with AI',
    dropHint: 'Drop your awesome files here!',
  },
};

// 3. Merge the base locale with your custom strings
const finalLocale = merge(customLocale, customStrings);

function MyCustomUploader() {
  return (
    <Uploader
      coreProps={{
        locale: finalLocale,
      }}
    />
  );
}
```

By passing a complete locale object to `coreProps.locale`, you gain full control over the text displayed in the Uploader interface.

## Custom Translation Keys

The `@blocklet/uploader` component adds several custom translation keys to support its unique features. You can override any of these in your custom locale object. Below is a reference of the available keys and their default English values.

| Key | Default English Text |
|---|---|
| `aiKitRequired` | Install and config the AI Kit component first |
| `aiImageSelectedUse` | Use selected images |
| `aiImageSelectedTip` | Please select images |
| `aiImagePrompt` | Prompt |
| `aiImagePromptTip` | Please enter the prompt |
| `aiImageSize` | Size |
| `aiImageModel` | Model |
| `aiImageNumber` | Number of images |
| `aiImageGenerate` | Generate |
| `aiImageGenerating` | Generating... |
| `browse` | browse |
| `browseFiles` | browse files |
| `browseFolders` | browse folders |
| `dropHint` | Drop your files here |
| `dropPasteBoth` | Drop files here, paste, %{browseFiles} or %{browseFolders} |
| `cancel` | Back |
| `loadingStatus` | Getting status... |
| `aspectRatioMessage` | Please edit the required ratio for image, currently the image ratio is %{imageAspectRatio}, need %{aspectRatio} |
| `editorLoading` | Waiting for image editor... |
| `downloadRemoteFileFailure` | Failure to get remote file ❌ |
| `noAllowedFileTypes` | No allowed any file types |
| `allowedFileTypes` | Allowed file types: |
| `error` | Failed to initialize, please check if the related service (Media Kit) is running normally |

---

Now that you understand how to customize the Uploader's text and language, you may want to explore the full range of configuration options available. For a detailed list of all component props, see the [<Uploader /> Component Props](./api-reference-uploader-component-props.md) documentation.