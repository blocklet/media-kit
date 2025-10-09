# フロントエンドの設定 (@blocklet/uploader)

このガイドでは、`@blocklet/uploader` React コンポーネントを Blocklet にインストールして統合するプロセスを説明します。このコンポーネントは、堅牢で拡張性の高い [Uppy](https://uppy.io/) ファイルアップローダーを基盤に構築された、機能豊富なファイルアップロード用ユーザーインターフェースを提供します。

このガイドを終える頃には、アプリケーションで動作する Uploader コンポーネントが完成し、バックエンドサービスに接続できる状態になります。シームレスな体験のために、コンパニオンのバックエンドパッケージの使用をお勧めします。詳細は[バックエンドの設定](./getting-started-backend-setup.md)ガイドで学ぶことができます。

## 1. インストール

まず、`@blocklet/uploader` パッケージをプロジェクトの依存関係に追加します。プロジェクトのルートディレクトリでターミナルを開き、次のコマンドを実行します。

```bash pnpm icon=logos:pnpm
pnpm add @blocklet/uploader
```

## 2. スタイルのインポート

Uploader コンポーネントは、その外観と機能性のために Uppy エコシステムのいくつかの CSS ファイルに依存しています。コンポーネントが正しくレンダリングされるように、これらのスタイルシートをアプリケーションのエントリーポイント（例：`src/index.js` や `src/App.js`）にインポートする必要があります。

```javascript App Entry Point (e.g., src/App.js) icon=logos:javascript
// Uppy のコアとプラグインのスタイルをインポート
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import '@uppy/webcam/dist/style.min.css';
import '@uppy/image-editor/dist/style.min.css';
import '@uppy/drag-drop/dist/style.min.css';
import '@uppy/drop-target/dist/style.min.css';
import '@uppy/status-bar/dist/style.min.css';

// ... アプリケーションのエントリーファイルの残りの部分
```

## 3. 基本的な使用法: モーダルアップローダー

アップローダーを使用する最も簡単な方法は、モーダルダイアログとしてレンダリングすることです。React の `lazy` ローディングを使用して、コンポーネントが必要なときにのみ読み込むことでパフォーマンスを向上させます。

以下は、アップローダーを開くためのボタンを含むコンポーネントの完全な例です。

```jsx UploaderButton.js icon=logos:react
import { lazy, useRef, Suspense } from 'react';

// Uploader コンポーネントを遅延インポート
const UploaderComponent = lazy(() => import('@blocklet/uploader').then((res) => ({ default: res.Uploader })));

export default function UploaderButton() {
  const uploaderRef = useRef(null);

  const handleUploadFinish = (result) => {
    // 'result' オブジェクトには、アップロードされたファイルの詳細が含まれています
    console.log('Upload successful!', result);
    // これで result.uploadURL または result.data からファイル URL を使用できます
    alert(`File uploaded to: ${result.uploadURL}`);
  };

  const openUploader = () => {
    // アップローダーインスタンスには `open` メソッドがあります
    uploaderRef.current?.getUploader()?.open();
  };

  return (
    <div>
      <button type="button" onClick={openUploader}>
        Open Uploader
      </button>

      {/* Uploader コンポーネントはレンダリングされますが、開かれるまで非表示です */}
      {/* Suspense を使用してコンポーネントの遅延ロードを処理します */}
      <Suspense fallback={<div>Loading...</div>}>
        <UploaderComponent
          ref={uploaderRef}
          popup // このプロップはアップローダーをモーダルダイアログにします
          onUploadFinish={handleUploadFinish}
        />
      </Suspense>
    </div>
  );
}
```

この例では：
- Uploader コンポーネントのインスタンスメソッドにアクセスするために `ref` (`uploaderRef`) を作成します。
- `popup` プロップは、アップローダーが内部で管理されるモーダルダイアログとして機能するように設定します。
- ボタンの `onClick` ハンドラは、アップローダーインスタンスの `open()` メソッドを呼び出して表示させます。
- `onUploadFinish` コールバック関数は、各ファイルが正常にアップロードされた後にトリガーされ、引数としてファイルのメタデータを受け取ります。

## 4. 高度な使用法: Provider の使用

より複雑なアプリケーションでは、コンポーネントツリーを介して ref を渡すことなく、さまざまなコンポーネントからアップローダーをトリガーしたい場合があります。`@blocklet/uploader` パッケージは、このシナリオのために `UploaderProvider` と `UploaderTrigger` を使用したコンテキストベースのソリューションを提供します。

このアプローチは、アップローダーの状態を、それをトリガーするコンポーネントから分離します。

```jsx App.js icon=logos:react
import { UploaderProvider, UploaderTrigger } from '@blocklet/uploader';

function MyPageComponent() {
  return (
    <div>
      <h2>My Page</h2>
      <p>Click the button below to upload a file.</p>
      {/* UploaderTrigger はクリック時にアップローダーを開くシンプルなラッパーです */}
      <UploaderTrigger>
        <button type="button">Upload File</button>
      </UploaderTrigger>
    </div>
  );
}

export default function App() {
  const handleUploadFinish = (result) => {
    console.log('File uploaded from Provider:', result.uploadURL);
  };

  return (
    // アプリケーションまたはその一部を UploaderProvider でラップします
    <UploaderProvider popup onUploadFinish={handleUploadFinish}>
      <h1>My Application</h1>
      <MyPageComponent />
      {/* ここに別のトリガーを置くこともできます */}
      <UploaderTrigger>
        <a>Or click this link</a>
      </UploaderTrigger>
    </UploaderProvider>
  );
}

```

### 仕組み

1.  **`UploaderProvider`**: このコンポーネントは Uploader インスタンスを初期化して保持します。コンポーネントツリーの上位に配置する必要があります。`Uploader` コンポーネントのすべてのプロップ（`popup` や `onUploadFinish` など）はプロバイダーに渡されます。
2.  **`UploaderTrigger`**: `UploaderTrigger` でラップされたコンポーネントは、アップローダーモーダルを開くクリック可能な要素になります。ボタン、リンク、またはその他の要素をラップできます。

このパターンは非常に柔軟で、コンポーネントのロジックをクリーンに保つのに役立ちます。

---

## 次のステップ

これで、完全に機能するフロントエンドのアップローダーコンポーネントが完成しました。ただし、アップロードされたファイルを実際に保存するには、それらを受け取るバックエンドサービスが必要です。

<x-card data-title="バックエンドの設定 (@blocklet/uploader-server)" data-icon="lucide:server" data-href="/getting-started/backend-setup" data-cta="続ける">
  Express ベースの blocklet に必要なバックエンドミドルウェアをインストールおよび設定して、ファイルアップロードを処理する方法を学びます。
</x-card>