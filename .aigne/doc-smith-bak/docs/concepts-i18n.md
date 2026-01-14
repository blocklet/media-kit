# Internationalization (i18n)

The `@blocklet/uploader` component is designed with a global audience in mind, offering robust support for multiple languages and text customization. This allows you to create a seamless user experience that feels native to your users, regardless of their location.

This guide explains how to switch between built-in languages and how to provide your own custom translations.

## Switching Between Built-in Languages

The component ships with pre-configured language packs for English (`en`) and Chinese (`zh`). The simplest way to change the display language is by using the `locale` prop.

```jsx Uploader with Chinese locale icon=logos:react
import { Uploader } from '@blocklet/uploader/react';

function MyComponent() {
  return <Uploader locale="zh" />;
}
```

Setting `locale="zh"` will automatically translate the entire UI into Chinese. The default language is English (`en`).

## Customizing Text and Adding New Languages

For more advanced control, such as overriding specific text strings or adding support for a new language, you can provide a custom locale object to the Uploader. This is done through the `coreProps.locale` property, which gives you direct access to the underlying Uppy instance's configuration.

A locale object consists of a `strings` key, which contains all the text used in the UI.

### Overriding Existing Strings

You can easily change any text to better match your application's tone or terminology. For example, let's change the main drop hint.

First, import one of the base locale objects provided by the package, then merge your changes.

```javascript Customizing the drop hint text icon=logos:javascript
import { Uploader } from '@blocklet/uploader/react';
import { locales } from '@blocklet/uploader/i18n';
import merge from 'lodash/merge';

// Create a deep copy of the default English locale
const customEnglishLocale = merge({}, locales.en);

// Override the specific string you want to change
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

### Adding a New Language

To add a language not included by default, you'll need to create a complete locale object. The recommended approach is to import a base locale from Uppy's extensive collection and then merge it with translations for the custom strings specific to `@blocklet/uploader`.

Here is an example of how you might create a basic French locale:

```javascript Adding a French locale icon=logos:javascript
import { Uploader } from '@blocklet/uploader/react';
import fr_FR from '@uppy/locales/lib/fr_FR'; // Base Uppy locale
import merge from 'lodash/merge';

// Create a custom locale object by merging Uppy's French pack
// with translations for our custom strings.
const customFrenchLocale = merge({}, fr_FR, {
  strings: {
    // Custom strings from @blocklet/uploader
    aiKitRequired: 'Veuillez installer et configurer le kit AI',
    aiImageGenerate: 'Générer',
    aiImageGenerating: 'Génération en cours...',
    browseFiles: 'parcourir les fichiers',
    browseFolders: 'parcourir les dossiers',
    dropHint: 'Déposez vos fichiers ici',
    // ... and so on for all other custom strings
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

## Customizable Strings

While `@blocklet/uploader` inherits most of its strings from the Uppy ecosystem, it also adds several custom strings for its unique features. Below is a list of these specific keys that you can override.

| Key | Default (English) Description |
|---|---|
| `aiKitRequired` | Text shown when the AI Image plugin is used without AI Kit being configured. |
| `aiImageSelectedUse` | Button text to confirm the use of a selected AI-generated image. |
| `aiImageSelectedTip` | A hint asking the user to select an image. |
| `aiImagePrompt` | Label for the AI image prompt input field. |
| `aiImagePromptTip` | Placeholder text for the prompt input. |
| `aiImageSize` | Label for the image size selector. |
| `aiImageModel` | Label for the image model selector. |
| `aiImageNumber` | Label for the number of images to generate. |
| `aiImageGenerate` | Button text to start image generation. |
| `aiImageGenerating` | Text displayed while images are being generated. |
| `browseFolders` | Text for the 'browse folders' link. |
| `dropHint` | The main text displayed in the drop area. |
| `dropPasteBoth` | Drop area text when both files and folders can be browsed. |
| `dropPasteFiles` | Drop area text when only files can be browsed. |
| `dropPasteFolders` | Drop area text when only folders can be browsed. |
| `cancel` | Text for the 'Back' or 'Cancel' button. |
| `loadingStatus` | Text shown when checking the Media Kit status. |
| `aspectRatioMessage` | Warning message for images that don't meet the required aspect ratio. |
| `editorLoading` | Message shown while the image editor is loading. |
| `downloadRemoteFileFailure` | Error message when a remote file (e.g., from a URL) fails to download. |
| `noAllowedFileTypes` | Message shown when `allowedFileTypes` is an empty array. |
| `allowedFileTypes` | Prefix for the list of allowed file types. |
| `error` | General initialization error message. |

For a complete list of all strings available for translation, please refer to the official Uppy locale documentation.

---

By leveraging this flexible i18n system, you can ensure your application's file uploader is accessible and intuitive for all users. For more details on Uppy's configuration, see the [Integration with Uppy](./concepts-uppy-integration.md) guide.