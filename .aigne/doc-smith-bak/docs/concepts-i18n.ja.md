# 国際化 (i18n)

`@blocklet/uploader` コンポーネントは、世界中のユーザーを念頭に置いて設計されており、多言語とテキストのカスタマイズを強力にサポートします。これにより、ユーザーの場所に関係なく、ネイティブに感じられるシームレスなユーザーエクスペリエンスを作成できます。

このガイドでは、組み込み言語を切り替える方法と、独自のカスタム翻訳を提供する方法について説明します。

## 組み込み言語の切り替え

コンポーネントには、英語 (`en`) と中国語 (`zh`) の事前設定された言語パックが付属しています。表示言語を変更する最も簡単な方法は、`locale` プロパティを使用することです。

```jsx Uploader with Chinese locale icon=logos:react
import { Uploader } from '@blocklet/uploader/react';

function MyComponent() {
  return <Uploader locale="zh" />;
}
```

`locale="zh"` を設定すると、UI全体が自動的に中国語に翻訳されます。デフォルトの言語は英語 (`en`) です。

## テキストのカスタマイズと新しい言語の追加

特定のテキスト文字列を上書きしたり、新しい言語のサポートを追加したりするなど、より高度な制御を行うには、Uploaderにカスタムロケールオブジェクトを提供できます。これは `coreProps.locale` プロパティを介して行われ、これにより、基盤となるUppyインスタンスの設定に直接アクセスできます。

ロケールオブジェクトは、UIで使用されるすべてのテキストを含む `strings` キーで構成されます。

### 既存の文字列の上書き

アプリケーションのトーンや用語によりよく一致するように、任意のテキストを簡単に変更できます。たとえば、メインのドロップヒントを変更してみましょう。

まず、パッケージによって提供されるベースロケールオブジェクトの1つをインポートし、変更をマージします。

```javascript Customizing the drop hint text icon=logos:javascript
import { Uploader } from '@blocklet/uploader/react';
import { locales } from '@blocklet/uploader/i18n';
import merge from 'lodash/merge';

// デフォルトの英語ロケールのディープコピーを作成
const customEnglishLocale = merge({}, locales.en);

// 変更したい特定の文字列を上書き
customEnglishLocale.strings.dropHint = 'ここに素晴らしいファイルをドロップしてください！';

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

### 新しい言語の追加

デフォルトで含まれていない言語を追加するには、完全なロケールオブジェクトを作成する必要があります。推奨されるアプローチは、Uppyの豊富なコレクションからベースロケールをインポートし、それを `@blocklet/uploader` に固有のカスタム文字列の翻訳とマージすることです。

以下は、基本的なフランス語ロケールを作成する方法の例です。

```javascript Adding a French locale icon=logos:javascript
import { Uploader } from '@blocklet/uploader/react';
import fr_FR from '@uppy/locales/lib/fr_FR'; // ベースのUppyロケール
import merge from 'lodash/merge';

// Uppyのフランス語パックとカスタム文字列の翻訳をマージして
// カスタムロケールオブジェクトを作成します。
const customFrenchLocale = merge({}, fr_FR, {
  strings: {
    // @blocklet/uploader のカスタム文字列
    aiKitRequired: 'Veuillez installer et configurer le kit AI',
    aiImageGenerate: 'Générer',
    aiImageGenerating: 'Génération en cours...',
    browseFiles: 'parcourir les fichiers',
    browseFolders: 'parcourir les dossiers',
    dropHint: 'Déposez vos fichiers ici',
    // ... 他のすべてのカスタム文字列についても同様
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

## カスタマイズ可能な文字列

`@blocklet/uploader` は、ほとんどの文字列をUppyエコシステムから継承していますが、独自の機能のためにいくつかのカスタム文字列も追加しています。以下は、上書きできるこれらの特定のキーのリストです。

| キー | デフォルト（英語）の説明 |
|---|---|
| `aiKitRequired` | AI Kitが設定されていない状態でAI画像プラグインが使用されたときに表示されるテキスト。 |
| `aiImageSelectedUse` | 選択したAI生成画像の使用を確認するためのボタンテキスト。 |
| `aiImageSelectedTip` | ユーザーに画像を選択するように促すヒント。 |
| `aiImagePrompt` | AI画像プロンプト入力フィールドのラベル。 |
| `aiImagePromptTip` | プロンプト入力のプレースホルダーテキスト。 |
| `aiImageSize` | 画像サイズセレクターのラベル。 |
| `aiImageModel` | 画像モデルセレクターのラベル。 |
| `aiImageNumber` | 生成する画像の数のラベル。 |
| `aiImageGenerate` | 画像生成を開始するためのボタンテキスト。 |
| `aiImageGenerating` | 画像が生成されている間に表示されるテキスト。 |
| `browseFolders` | 「フォルダを閲覧」リンクのテキスト。 |
| `dropHint` | ドロップエリアに表示されるメインテキスト。 |
| `dropPasteBoth` | ファイルとフォルダの両方を閲覧できる場合のドロップエリアのテキスト。 |
| `dropPasteFiles` | ファイルのみ閲覧できる場合のドロップエリアのテキスト。 |
| `dropPasteFolders` | フォルダのみ閲覧できる場合のドロップエリアのテキスト。 |
| `cancel` | 「戻る」または「キャンセル」ボタンのテキスト。 |
| `loadingStatus` | Media Kitのステータスを確認中に表示されるテキスト。 |
| `aspectRatioMessage` | 必要なアスペクト比を満たさない画像に対する警告メッセージ。 |
| `editorLoading` | 画像エディタの読み込み中に表示されるメッセージ。 |
| `downloadRemoteFileFailure` | リモートファイル（例：URLから）のダウンロードに失敗した場合のエラーメッセージ。 |
| `noAllowedFileTypes` | `allowedFileTypes`が空の配列の場合に表示されるメッセージ。 |
| `allowedFileTypes` | 許可されるファイルタイプのリストのプレフィックス。 |
| `error` | 一般的な初期化エラーメッセージ。 |

翻訳可能なすべての文字列の完全なリストについては、公式のUppyロケールドキュメントを参照してください。

---

この柔軟なi18nシステムを活用することで、アプリケーションのファイルアップローダーがすべてのユーザーにとってアクセスしやすく、直感的であることを保証できます。Uppyの設定に関する詳細については、[Uppyとの統合](./concepts-uppy-integration.md)ガイドを参照してください。