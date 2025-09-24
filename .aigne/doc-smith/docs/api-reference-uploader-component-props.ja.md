# <Uploader /> コンポーネントの Props

`<Uploader />`コンポーネントは、フル機能のファイルアップロードインターフェースをReactアプリケーションに統合するための主要な方法です。これは、人気のある[Uppy](https://uppy.io/)ライブラリの上に構築されており、包括的なPropsセットを通じて高度にカスタマイズ可能です。このガイドでは、利用可能なすべてのPropsに関する詳細なリファレンスを提供し、アップローダーの動作、外観、および機能を特定のニーズに合わせて調整できるようにします。

## 主なProps

ここでは、`<Uploader />`コンポーネントに渡すことができるPropsの完全なリストを示します。

| Prop | Type | Description |
| --- | --- | --- |
| `id` | `string` | Uppyインスタンスの一意の識別子。デフォルトは`'Uploader'`です。 |
| `popup` | `boolean` | `true`の場合、アップローダーはインラインではなくモーダルダイアログとしてレンダリングされます。デフォルトは`false`です。 |
| `locale` | `string` | UIの言語を設定します。サポートされている値には'en'、'zh'が含まれます。デフォルトは`'en'`です。 |
| `onAfterResponse` | `(response: any) => void` | すべてのHTTPレスポンス（TusとCompanionの両方から）の後に実行されるコールバック関数。 |
| `onUploadFinish` | `(request: any) => void` | ファイルが正常にアップロードされた後に実行される重要なコールバック。`request`オブジェクトには`uploadURL`などの詳細が含まれています。 |
| `onOpen` | `Function` | アップローダーUIが開かれたとき（特にポップアップモードで）に実行されるコールバック関数。 |
| `onClose` | `Function` | アップローダーUIが閉じられたときに実行されるコールバック関数。 |
| `onChange` | `Function` | ファイルが追加または削除されるたびに実行されるコールバックで、現在のすべてのファイルのリストを提供します。 |
| `plugins` | `string[]` or `object[]` | 有効にするUppyプラグインを設定するための配列。カスタムプラグインを渡すこともできます。詳細は[プラグインの設定](./guides-configuring-plugins.md)を参照してください。 |
| `installerProps` | `object` | Media Kitの`ComponentInstaller`に渡されるProps。`disabled`やカスタム`fallback`など。 |
| `uploadedProps` | `object` | カスタム'Uploaded'プラグインの設定。`params`と`onSelectedFiles`コールバックを含みます。 |
| `resourcesProps` | `object` | カスタム'Resources'プラグインの設定。`params`と`onSelectedFiles`コールバックを含みます。 |
| `tusProps` | `TusOptions` | `@uppy/tus`プラグインに直接渡されるオプションのオブジェクト。すべてのオプションについては[Tusのドキュメント](https://uppy.io/docs/tus/#Options)を参照してください。 |
| `wrapperProps` | `HTMLAttributes<HTMLDivElement>` | メインのラッパー`div`要素に適用されるProps。`sx`、`className`、`style`を含みます。 |
| `coreProps` | `UppyOptions` | Uppyコアインスタンスに直接渡されるオプションのオブジェクト。ここで`restrictions`のようなグローバル設定を構成します。すべてのオプションについては[Uppy Coreのドキュメント](https://uppy.io/docs/uppy/#Options)を参照してください。 |
| `dashboardProps` | `DashboardOptions` | `@uppy/dashboard`プラグインに直接渡されるオプションのオブジェクト。すべてのオプションについては[Uppy Dashboardのドキュメント](https://uppy.io/docs/dashboard/#Options)を参照してください。 |
| `apiPathProps` | `object` | アップローダーとCompanionのAPIエンドポイントを設定するためのオブジェクト。 |
| `dropTargetProps` | `DropTarget` | `@uppy/drop-target`プラグインの設定。指定された要素へのドラッグアンドドロップによるアップロードを可能にします。 |
| `initialFiles` | `any[]` | 初期化時にアップローダーに事前に入力しておくファイルオブジェクトの配列。 |
| `imageEditorProps` | `ImageEditorOptions` | `@uppy/image-editor`プラグインに直接渡されるオプションのオブジェクト。すべてのオプションについては[Uppy Image Editorのドキュメント](https://uppy.io/docs/image-editor/#Options)を参照してください。 |

## 主要なPropsの詳細

### `onUploadFinish`

これは最も重要なコールバックの一つです。バックエンドによって各ファイルが正常に処理・保存された後にトリガーされます。このコールバックは、最終的な`uploadURL`やその他のメタデータを含む`result`オブジェクトを受け取ります。これを使用して、アプリケーションの状態を更新したり、データベースに保存したりできます。

```javascript UploadHandler.jsx icon=logos:react
import React, { useState } from 'react';
import Uploader from '@blocklet/uploader/react';

export default function UploadHandler() {
  const [fileUrl, setFileUrl] = useState('');

  const handleUploadFinish = (result) => {
    console.log('File uploaded:', result);
    // resultオブジェクトには、アップロードされたファイルの最終URLが含まれています
    if (result.uploadURL) {
      setFileUrl(result.uploadURL);
      // このURLをstateやデータベースに保存できます
    }
  };

  return (
    <div>
      <Uploader onUploadFinish={handleUploadFinish} />
      {fileUrl && <p>Last upload: <a href={fileUrl}>{fileUrl}</a></p>}
    </div>
  );
}
```

### `coreProps`

このpropを使用すると、Uppyのコア設定に直接アクセスできます。主な使用例は、ファイルタイプ、ファイル数、ファイルサイズなどのアップロード制限の設定です。

```javascript RestrictedUploader.jsx icon=logos:react
import Uploader from '@blocklet/uploader/react';

export default function RestrictedUploader() {
  const restrictions = {
    maxFileSize: 1024 * 1024, // 1 MB
    maxNumberOfFiles: 3,
    allowedFileTypes: ['image/jpeg', 'image/png'],
  };

  return (
    <Uploader
      coreProps={{
        restrictions: restrictions,
      }}
    />
  );
}
```

### `plugins`

このpropを使用すると、Uploaderダッシュボードで利用可能なタブをカスタマイズできます。組み込みプラグインを有効または無効にしたり、独自のカスタムタブを追加したりすることもできます。

独自のプラグインを作成する方法についての詳細は、[カスタムプラグインの作成](./guides-custom-plugin.md)ガイドを参照してください。

```javascript CustomPluginUploader.jsx icon=logos:react
import Uploader from '@blocklet/uploader/react';
import { PhotoIcon } from '@heroicons/react/24/solid';

export default function CustomPluginUploader() {
  const customPlugins = [
    {
      id: 'MyCustomPlugin',
      options: {
        id: 'MyCustomPlugin',
        title: 'My Photos',
        icon: <PhotoIcon />,
      },
      onShowPanel: (ref) => {
        // カスタムパネルのコンテンツを表示するロジック
        console.log('Custom panel shown!', ref);
      },
    },
  ];

  return (
    <Uploader
      plugins={['Webcam', 'Url', ...customPlugins]}
    />
  );
}
```

### `apiPathProps`

デフォルトでは、アップローダーは`/api/uploads`（Tusアップロード用）および`/api/companion`（リモートソース用）のエンドポイントと通信します。バックエンドの構成が異なる場合は、これらのパスを上書きできます。

```javascript CustomEndpoints.jsx icon=logos:react
import Uploader from '@blocklet/uploader/react';

export default function CustomEndpoints() {
  const apiPaths = {
    uploader: '/custom/tus-endpoint',
    companion: '/custom/companion-endpoint',
  };

  return (
    <Uploader apiPathProps={apiPaths} />
  );
}
```

---

これらのpropsをしっかりと理解することで、Uploaderをさまざまなユースケースに合わせて設定できます。アップローダーをプログラムで開くなど、より高度な制御については、次のセクション[UploaderProviderとHooks](./api-reference-uploader-provider-hooks.md)に進んでください。