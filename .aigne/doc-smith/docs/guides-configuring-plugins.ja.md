# プラグインの設定

`@blocklet/uploader` コンポーネントは、柔軟で強力な [Uppy](https://uppy.io/) ファイルアップローダーを基盤に構築されています。このアーキテクチャにより、プラグインベースのシステムを通じて広範なカスタマイズが可能です。Uploaderには、いくつかの必須プラグインが標準で事前設定されているほか、Blockletエコシステムと統合するために設計された特別なプラグインも付属しています。

このガイドでは、これらのプラグインを有効化、無効化、およびカスタマイズして、特定のニーズに合わせてアップローダーを調整する方法について説明します。

## アクティブなプラグインの制御

ユーザーが利用できるプラグインを制御する主な方法は、`Uploader` コンポーネントの `plugins` prop を使用することです。デフォルトでは、このpropを提供しない場合、Uploaderは利用可能なすべての組み込みプラグインを有効にしようとします。

カスタムのプラグインセットを指定するには、それらのIDの配列を文字列として渡します。これにより、デフォルトのセットが上書きされます。`ImageEditor` や `PrepareUpload` のような特定のコアプラグインは、基本的な機能を確保するために常にアクティブであることに注意してください。

以下は、制御できる主な取得プラグインのIDです：

| プラグインID | 説明 |
|---|---|
| `Webcam` | ユーザーがデバイスのカメラで写真撮影やビデオ録画をできるようにします。 |
| `Url` | ダイレクトURLからファイルをインポートできるようにします。 |
| `Unsplash` | ユーザーがUnsplashから画像を閲覧・インポートできるようにします（設定が必要）。 |
| `AIImage` | AI画像生成を可能にするカスタムプラグインです（Media Kitが必要）。 |
| `Uploaded` | Media Kitにすでにアップロードされたファイルを閲覧・再利用するためのカスタムプラグインです。 |
| `Resources` | 他のリソース提供Blockletからファイルを選択するためのカスタムプラグインです。 |


### 例：WebcamとURLのみを有効にする

ユーザーにウェブカメラまたはURLからのみアップロードさせたい場合は、次のようにUploaderを設定できます：

```jsx Uploader with specific plugins icon=logos:react
import Uploader from '@blocklet/uploader';

function MyComponent() {
  return (
    <Uploader
      popup
      plugins={['Webcam', 'Url']}
      // ... 他のprops
    />
  );
}
```

この設定により、標準のローカルファイル選択に加えて、WebcamとURLからのインポートオプションのみが表示されるアップローダーになります。

## プラグインオプションのカスタマイズ

プラグインを有効化または無効化するだけでなく、詳細な設定オブジェクトを渡してその動作をカスタマイズできます。これは、`Uploader` コンポーネント上の専用のpropsを介して行われ、それらが設定するプラグインにちなんで名付けられています。

### 画像エディタのカスタマイズ

最も一般的にカスタマイズされるプラグインは画像エディタです。`imageEditorProps` propを使用して、出力画像の品質から利用可能な切り抜きツールまで、すべてを制御できます。これらのオプションは、基盤となる `@uppy/image-editor` プラグインに直接渡されます。

利用可能なオプションの完全なリストについては、[Uppy画像エディタのドキュメント](https://uppy.io/docs/image-editor/#options)を参照してください。

```jsx Customizing Image Editor icon=logos:react
import Uploader from '@blocklet/uploader';

function MyImageEditor() {
  return (
    <Uploader
      popup
      imageEditorProps={{
        quality: 0.8, // JPEG品質を80%に設定
        cropperOptions: {
          viewMode: 1,
          aspectRatio: 16 / 9,
          background: false,
          autoCropArea: 1,
          responsive: true,
        },
      }}
      // ... 他のprops
    />
  );
}
```

この例では、画像の圧縮品質を80%に設定し、クロッパーが16:9のアスペクト比を強制するように設定しました。

### カスタムプラグインの設定

私たちのカスタムプラグインである `Uploaded` と `Resources` も、それぞれのpropsである `uploadedProps` と `resourcesProps` を通じて設定を受け入れます。一般的な使用例は、ユーザーがこれらのソースからファイルを選択したときにコールバック関数を提供することです。これにより、Uploaderがそれらをキューに追加する代わりに、選択を直接処理できます。

```jsx Handling selection from Resources plugin icon=logos:react
import Uploader from '@blocklet/uploader';

function MyResourceSelector() {
  const handleFilesSelected = (files) => {
    // files配列には、選択されたリソースに関するメタデータが含まれています。
    // 各ファイルには`uppyFile`プロパティが含まれます。
    console.log('User selected these files from Resources:', files);
    // これで、これらのファイルを処理できます。例えば、UIに表示するなど。
  };

  return (
    <Uploader
      popup
      plugins={['Resources']}
      resourcesProps={{
        onSelectedFiles: handleFilesSelected,
      }}
      // ... 他のprops
    />
  );
}
```

## 独自のプラグインの作成

Uploaderは拡張可能に設計されています。組み込みのプラグインがニーズを満たさない場合は、独自のカスタムプラグインタブを作成して、Uploaderのダッシュボードに独自の機能を直接統合できます。

<x-card data-title="カスタムプラグインの作成" data-icon="lucide:puzzle-piece" data-href="/guides/custom-plugin" data-cta="ガイドを読む">
  ステップバイステップのガイドで、独自のカスタムプラグインを構築・統合する方法を学びましょう。
</x-card>

---

プラグイン設定をマスターすることで、Uploaderを汎用ツールから、アプリケーションのワークフローに完璧にフィットする高度に専門化されたコンポーネントへと変えることができます。インターフェースの設定方法を学んだので、次にファイルが選択された後に何が起こるかについて詳しく見ていきましょう。

次に、ファイルが正常にアップロードされた後のファイルの扱い方について探ります。詳細は[アップロードの処理](./guides-handling-uploads.md)ガイドを参照してください。