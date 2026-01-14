# Uppyとの統合

`@blocklet/uploader` パッケージは、ウェブ向けの洗練されたモジュール式のオープンソースファイルアップローダーである [Uppy](https://uppy.io/) の上に直接構築されています。ファイルアップローダーをゼロから構築する代わりに、私たちは Uppy の強力なコアエンジン、豊富なプラグインエコシステム、洗練されたユーザーインターフェースを活用しています。これにより、Blocklet エコシステム内でのシームレスな統合に焦点を当てながら、堅牢で機能豊富なアップロード体験を提供することができます。

このアプローチは、`@blocklet/uploader` が本質的に、Blocklet 開発に特化して調整された、事前設定済みで強化された Uppy のラッパーであることを意味します。

## コアアーキテクチャ

`Uploader` コンポーネントは、コアとなる Uppy インスタンスを初期化し、管理します。そして、共通機能（Dashboard UI、Webcam アクセス、再開可能なアップロードのための Tus など）のために一連の標準 Uppy プラグインを統合し、その上に Media Kit のような他の Blocklet と対話するように設計されたカスタムプラグインを重ね合わせます。

次の図は、この関係を示しています：

```d2
direction: down

blocklet-app: {
  label: "あなたの Blocklet アプリケーション"
  shape: rectangle

  uploader-component: {
    label: "Uploader コンポーネント\n(@blocklet/uploader)"
    shape: rectangle

    uppy-ecosystem: {
      label: "Uppy エコシステム"
      shape: rectangle

      uppy-core: {
        label: "Uppy コアインスタンス"
      }

      standard-plugins: {
        label: "標準 Uppy プラグイン"
        shape: rectangle
        Dashboard: {}
        Tus: {}
        Webcam: {}
        Url: {}
        ImageEditor: {}
      }

      custom-plugins: {
        label: "カスタム Blocklet プラグイン"
        shape: rectangle
        AIImage: {}
        Resources: {}
        Uploaded: {}
      }
    }
  }
}

blocklet-app.uploader-component.uppy-ecosystem.uppy-core -> blocklet-app.uploader-component.uppy-ecosystem.standard-plugins: "管理"
blocklet-app.uploader-component.uppy-ecosystem.uppy-core -> blocklet-app.uploader-component.uppy-ecosystem.custom-plugins: "管理"
```

## コア Uppy インスタンスへのアクセス

高度なユースケースでは、豊富な API にアクセスするために、基盤となる Uppy インスタンスと直接やり取りする必要がある場合があります。`Uploader` コンポーネントは `getUploader()` メソッドを公開する `ref` を提供し、Uppy オブジェクトへの完全なアクセスを可能にします。

これにより、アップローダーをプログラムで制御したり、Uppy 固有のイベントをリッスンしたり、[Uppy API ドキュメント](https://uppy.io/docs/uppy/)で利用可能な任意のメソッドを呼び出したりすることができます。

```jsx Uploader インスタンスへのアクセス icon=logos:react
import { useRef, useEffect } from 'react';
import { Uploader } from '@blocklet/uploader';

export default function MyComponent() {
  const uploaderRef = useRef(null);

  useEffect(() => {
    if (uploaderRef.current) {
      const uppy = uploaderRef.current.getUploader();

      // これで、Uppy API の全機能を使用できます
      uppy.on('complete', (result) => {
        console.log('アップロード完了！', result.successful);
      });

      console.log('Uppy インスタンスの準備ができました:', uppy.getID());
    }
  }, []);

  return <Uploader ref={uploaderRef} popup />;
}
```

## フロントエンドとバックエンドの分離

`@blocklet/uploader` はフロントエンド専用のパッケージであることを理解することが重要です。これはユーザーインターフェースとクライアントサイドのアップロードロジックを担当します。これは **`@blocklet/uploader-server` に依存しません**。

デフォルトでは、再開可能なアップロードのために [Tus プロトコル](https://tus.io/) を使用します。これは、Tus 仕様を実装する *任意* のバックエンドサーバーと通信できることを意味します。`@blocklet/uploader-server` は、Blocklet 開発者向けの便利ですぐに使えるバックエンドソリューションとして提供されていますが、独自に実装したり、別の Tus 互換サービスを使用したりすることも自由です。

## 詳細情報

本ドキュメントは `@blocklet/uploader` の最も一般的なユースケースと設定をカバーしていますが、より高度なトピックについては、公式の Uppy ドキュメントが非常に貴重なリソースです。Uppy のコアコンセプトを深く掘り下げたり、その全範囲のプラグインを探索したり、独自のカスタムプラグインを作成したりしたい場合は、彼らのウェブサイトが最適な出発点です。

<x-card data-title="Uppy 公式ドキュメント" data-icon="lucide:book-open" data-href="https://uppy.io/docs/quick-start/" data-cta="Uppy.io にアクセス">
  詳細なガイド、API リファレンス、高度なカスタマイズオプションについては、包括的な Uppy のドキュメントをご覧ください。
</x-card>