# フロントエンド: @blocklet/uploader

`@blocklet/uploader` パッケージは、Blockletエコシステム内でファイルアップロードを処理するための、強力で高度にカスタマイズ可能なReactコンポーネントを提供します。洗練されたモジュール式のオープンソースファイルアップローダーである [Uppy](https://uppy.io/) をベースに構築されており、堅牢でユーザーフレンドリーな体験を保証します。

このパッケージは、どのReactアプリケーションでもスタンドアロンコンポーネントとしてシームレスに動作するように設計されています。しかし、その真価は、[Media Kit blocklet](./concepts-media-kit-integration.md) と組み合わせて使用することで発揮されます。Media Kit blockletは、一元的なファイル管理、AI画像生成などの高度な機能、および事前設定された設定を提供します。

### アーキテクチャ概要

`Uploader`コンポーネントは、Uppyインスタンスのオーケストレーターとして機能します。Uppyのコアロジックと、一連の標準プラグイン（WebcamやURLインポートなど）およびBlocklet環境に合わせたカスタムプラグイン（AI画像やリソースなど）を組み合わせています。このモジュラーアーキテクチャにより、高い柔軟性と豊富な機能が実現されます。

```d2 コンポーネントアーキテクチャ icon=mdi:sitemap
direction: down

blocklet-app: {
  label: "あなたのBlockletアプリケーション"
  shape: rectangle

  uploader-component: {
    label: "Uploaderコンポーネント"
    shape: rectangle

    uppy-ecosystem: {
      label: "Uppyエコシステム"
      shape: rectangle

      uppy-core: {
        label: "Uppyコアインスタンス"
      }

      standard-plugins: {
        label: "標準Uppyプラグイン"
        shape: rectangle
        Dashboard: {}
        Tus: {}
        Webcam: {}
        Url: {}
      }

      custom-plugins: {
        label: "カスタムBlockletプラグイン"
        shape: rectangle
        AIImage: {}
        Resources: {}
        Uploaded: {}
      }
    }
  }
}

media-kit: {
  label: "Media Kit Blocklet"
  shape: cylinder
}

blocklet-app.uploader-component.uppy-ecosystem.uppy-core -> blocklet-app.uploader-component.uppy-ecosystem.standard-plugins
blocklet-app.uploader-component.uppy-ecosystem.uppy-core -> blocklet-app.uploader-component.uppy-ecosystem.custom-plugins
blocklet-app.uploader-component <-> media-kit: "設定とプラグインを提供"
```

### コアコンセプト

このパッケージは、アップローダーを統合するための2つの主要な方法を公開しています:

1.  **直接コンポーネント:** `<Uploader />` コンポーネントは、アプリケーションに直接レンダリングできます。インラインまたはモーダルダイアログとして表示するように設定できます。
2.  **プロバイダーパターン:** より複雑なユースケースでは、`<UploaderProvider />` と `<UploaderTrigger />` コンポーネントを使用すると、ボタンクリックなど、アプリケーションの任意の部分からプログラムでアップローダーを開くことができます。

### 基本的な使用法

以下は、Uploaderをポップアップモーダルとしてレンダリングする最小限の例です。refを使用して、その`open`および`close`メソッドにアクセスします。

```javascript 基本的なUploaderの例 icon=logos:react
import { useRef } from 'react';
import Uploader from '@blocklet/uploader';
import Button from '@mui/material/Button';

export default function MyComponent() {
  const uploaderRef = useRef(null);

  const handleOpen = () => {
    uploaderRef.current?.open();
  };

  return (
    <div>
      <Button onClick={handleOpen}>Uploaderを開く</Button>
      <Uploader ref={uploaderRef} popup={true} />
    </div>
  );
}
```

この簡単なセットアップで、クリックすると全機能のUploaderモーダルが開くボタンがレンダリングされます。

### APIリファレンスの詳細

`@blocklet/uploader` の能力を最大限に活用するには、そのコンポーネント、フック、およびユーティリティに関する詳細なAPIドキュメントを参照してください。

<x-cards data-columns="2">
  <x-card data-title="<Uploader /> コンポーネントのProps" data-icon="lucide:component" data-href="/api-reference/uploader/component-props">
    Uploaderコンポーネントの全プロパティ（コア設定、ダッシュボードオプション、プラグイン設定など）をご覧ください。
  </x-card>
  <x-card data-title="<UploaderProvider /> とフック" data-icon="lucide:workflow" data-href="/api-reference/uploader/provider-hooks">
    UploaderProviderとフックを使用して、アプリのどこからでもプログラムでアップローダーを制御する方法を学びます。
  </x-card>
  <x-card data-title="利用可能なプラグイン" data-icon="lucide:puzzle" data-href="/api-reference/uploader/plugins">
    AI画像生成、アップロード済みファイル、リソースなど、アップローダーの機能を強化するカスタムビルドのプラグインをご覧ください。
  </x-card>
  <x-card data-title="ユーティリティ関数" data-icon="lucide:wrench" data-href="/api-reference/uploader/utility-functions">
    ファイル変換、URL生成、Uppyインスタンスの操作などのタスクのためのヘルパー関数のリファレンスです。
  </x-card>
</x-cards>

これらの構成要素を理解することで、アプリケーションのニーズに完全に合うようにアップローダーを調整できます。完全なファイルアップロードソリューションを実現するには、[@blocklet/uploader-server](./api-reference-uploader-server.md) のドキュメントで説明されているように、対応するバックエンドサービスも設定することを忘れないでください。