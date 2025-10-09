# <UploaderProvider /> とフック

より高度なユースケースでは、アプリケーションの別の部分からUploaderをトリガーしたり、プログラムでその動作を制御したりする必要があるかもしれません。`UploaderProvider` コンポーネントとそれに関連するフックは、ReactのContext APIを使用して、UploaderのUIをそのトリガーから分離する柔軟な方法を提供します。

このパターンは、ヘッダーのボタン、メニューのリンク、またはUploader自体の直接の子ではない任意の要素からUploaderモーダルを開きたい場合に最適です。

このアプローチには、主に3つの部分が含まれます。

<x-cards data-columns="3">
  <x-card data-title="UploaderProvider" data-icon="lucide:box">
    Uploaderをインスタンス化し、コンテキストを介してそのインスタンスを提供するラッパーコンポーネント。
  </x-card>
  <x-card data-title="UploaderTrigger" data-icon="lucide:mouse-pointer-click">
    Uploaderモーダルを開くためのクリック可能な領域を作成するシンプルなコンポーネント。
  </x-card>
  <x-card data-title="useUploaderContext" data-icon="lucide:webhook">
    カスタムロジックのためにUploaderインスタンスに直接アクセスするためのフック。
  </x-card>
</x-cards>

### 仕組み

`UploaderProvider`は`<Uploader />`コンポーネントをレンダリングし（多くの場合、ドキュメントボディにアタッチされたポータル内で）、そのインスタンスへの参照（`ref`）を保持します。プロバイダーのツリー内の任意の子コンポーネントは、`useUploaderContext`フックを使用してこの`ref`にアクセスできます。`UploaderTrigger`は、このフックを使用してUploaderインスタンスの`open()`メソッドを呼び出す、事前に構築されたコンポーネントです。

```d2
direction: down

app-ui: {
  label: "あなたのアプリケーションUI"
  shape: rectangle

  uploader-provider: {
    label: "UploaderProvider"
    shape: rectangle
    style.fill: "#f0f9ff"

    header: {
      label: "ヘッダー"
      shape: rectangle

      upload-button: {
        label: "<UploaderTrigger>"
        shape: rectangle
      }
    }

    main-content: {
      label: "メインコンテンツ"
      shape: rectangle
    }
  }
}

uploader-instance: {
  label: "<Uploader /> インスタンス\n(React Portal内)"
  shape: rectangle
  style.stroke-dash: 2
}

app-ui.uploader-provider.header.upload-button -> uploader-instance: "3. コンテキスト ref を介して open() を呼び出す"

context: {
  label: "UploaderContext"
  shape: cylinder
}

app-ui.uploader-provider -> context: "1. uploader ref を提供"
context -> app-ui.uploader-provider.header.upload-button: "2. ref を消費"

```

---

## `UploaderProvider`

このコンポーネントは、このパターンの基盤です。Uploaderと対話する必要があるすべてのコンポーネント（`UploaderTrigger`や`useUploaderContext`フックを使用するカスタムコンポーネントを含む）をラップする必要があります。

これは`<Uploader />`コンポーネントと同じすべてのプロップを受け入れ、Uploaderの動作、プラグイン、外観を設定できます。このパターンでは、ほとんどの場合`popup={true}`を設定することになります。

### プロップ

| Prop | Type | Description |
|---|---|---|
| `children` | `ReactNode` | Uploaderコンテキストにアクセスできる子コンポーネント。 |
| `popup` | `boolean` | `true`の場合、UploaderはReact Portalを使用してモーダルでレンダリングされます。`false`の場合、インラインでレンダリングされます。デフォルトは`true`です。 |
| `...restProps` | `UploaderProps` | 他のすべてのプロップは、基になる`<Uploader />`コンポーネントに直接渡されます。完全なリストについては、[Uploader Component Props](./api-reference-uploader-component-props.md) を参照してください。 |

### 使用方法

アプリケーションの一部、またはアプリケーション全体を`UploaderProvider`でラップします。

```javascript MyUploader.jsx icon=logos:react
import React from 'react';
import { UploaderProvider, UploaderTrigger } from '@blocklet/uploader/react';
import Button from '@mui/material/Button';

export default function MyUploader() {
  const handleUploadSuccess = (result) => {
    console.log('Files uploaded: ', result);
    // resultには、ファイルオブジェクトの{ successful, failed }配列が含まれます
  };

  return (
    <UploaderProvider endpoint="/api/upload" popup={true}>
      <UploaderTrigger onChange={handleUploadSuccess}>
        <Button variant="contained">Upload File</Button>
      </UploaderTrigger>

      {/* アプリ内の他のコンポーネントもここに配置できます */}
    </UploaderProvider>
  );
}
```

---

## `UploaderTrigger`

`UploaderTrigger`コンポーネントは、その子要素をクリック可能にし、Uploaderモーダルを開くトリガーとなる便利なラッパーです。

### プロップ

| Prop | Type | Description |
|---|---|---|
| `children` | `ReactNode` | トリガーとして使用するReact要素（`<Button>`や`<a>`タグなど）。 |
| `onChange` | `Function` | アップロードが成功した後に一度だけトリガーされるオプションのコールバック関数。Uppyからの結果オブジェクトを受け取ります。 |
| `...restProps` | `object` | 追加のプロップは、基になるMaterial-UIの`<Box>`コンポーネントに渡されます。 |

### 使用方法

クリック可能なコンポーネントを`UploaderTrigger`内に配置します。`onChange`プロップは、アップロードの結果を処理する簡単な方法を提供します。

```javascript icon=logos:react
<UploaderTrigger onChange={(result) => alert(`Uploaded ${result.successful.length} files!`)}>
  <Button>Click me to Upload</Button>
</UploaderTrigger>
```

---

## `useUploaderContext`

最大限の制御を行うために、`useUploaderContext`フックはUploaderのインスタンスrefへの直接アクセスを提供します。これにより、Uploaderまたはその基になるUppyインスタンスの任意のメソッドをプログラムで呼び出すことができます。

### 戻り値

| Value | Type | Description |
|---|---|---|
| `uploaderRef` | `React.RefObject` | Reactのrefオブジェクト。Uploaderインスタンスは`uploaderRef.current`にあります。Uppyインスタンスにアクセスするには、`uploaderRef.current.getUploader()`を使用します。 |

> **注：** このフックは、`UploaderProvider`の子孫ではないコンポーネントで使用されるとエラーをスローします。

### 使用方法

以下は、フックを使用してUploaderを開き、現在選択されているファイルの数をログに記録するカスタムコンポーネントの例です。

```javascript CustomControls.jsx icon=logos:react
import React from 'react';
import { useUploaderContext } from '@blocklet/uploader/react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

export default function CustomControls() {
  const uploaderRef = useUploaderContext();

  const handleOpenUploader = () => {
    const uploader = uploaderRef?.current?.getUploader();
    uploader?.open();
  };

  const handleLogFiles = () => {
    const uploader = uploaderRef?.current?.getUploader();
    const files = uploader?.getFiles();
    console.log('Current files in Uppy:', files);
    alert(`There are ${files.length} files selected.`);
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
      <Button variant="outlined" onClick={handleOpenUploader}>
        Open Uploader Manually
      </Button>
      <Button variant="outlined" color="secondary" onClick={handleLogFiles}>
        Log Current Files
      </Button>
    </Box>
  );
}
```

この`CustomControls`コンポーネントを使用するには、次のように`UploaderProvider`内に配置します。

```javascript App.jsx icon=logos:react
// ... インポート
import CustomControls from './CustomControls';

export default function App() {
  return (
    <UploaderProvider endpoint="/api/upload">
      {/* プライマリートリガーをそのまま使用することもできます */}
      <UploaderTrigger>
        <Button>Upload</Button>
      </UploaderTrigger>

      {/* そして、より多くの制御のためにカスタムコンポーネントも使用できます */}
      <CustomControls />
    </UploaderProvider>
  );
}
```

このパターンは高度な柔軟性を提供し、アップローダーを複雑なアプリケーションレイアウトやワークフローにシームレスに統合することができます。

次に、一般的なタスクを簡素化できるヘルパー関数をいくつか見てみましょう。

<x-card data-title="ユーティリティ関数" data-icon="lucide:wrench" data-href="/api-reference/uploader/utility-functions" data-cta="ユーティリティを見る">
  ファイル変換やURL生成などのタスクのためのヘルパー関数について学びます。
</x-card>