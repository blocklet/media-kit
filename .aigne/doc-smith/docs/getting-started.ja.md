# はじめに

このガイドでは、強力なファイルアップローダーをあなたのblockletに統合するための基本的な手順を説明します。フロントエンドUIコンポーネントと、オプションのバックエンドサーバー設定の両方について説明し、迅速に使い始められるようにします。

このソリューションは、主に2つのパッケージに分かれています：

- **`@blocklet/uploader`**: ファイルをアップロードするためのリッチなユーザーインターフェースを提供するReactコンポーネントです。
- **`@blocklet/uploader-server`**: あなたのblockletのバックエンドでファイルの保存と処理を行うためのExpressミドルウェアです。

特筆すべきは、`@blocklet/uploader` は単独で動作可能で、特に必要なバックエンドエンドポイントを提供する Media Kit blocklet と統合されている場合にそのように動作します。独自のカスタムアップロードロジックをサーバーに実装したい場合にのみ、`@blocklet/uploader-server` を使用する必要があります。

```d2
direction: down

user: {
  shape: c4-person
  label: "開発者"
}

blocklet: {
  label: "あなたのBlocklet"
  shape: rectangle

  frontend: {
    label: "フロントエンド (React)"
    shape: rectangle
    blocklet-uploader: {
      label: "@blocklet/uploader"
    }
  }

  backend: {
    label: "バックエンド (Express)"
    shape: rectangle
    blocklet-uploader-server: {
      label: "@blocklet/uploader-server"
    }
  }
}

user -> blocklet.frontend.blocklet-uploader: "コンポーネントを統合"
user -> blocklet.backend.blocklet-uploader-server: "ミドルウェアを統合"
blocklet.frontend -> blocklet.backend: "ファイルをアップロード"
```

始めるには、あなたのニーズに合ったセットアップガイドを選択してください。フロントエンドのセットアップから始めることをお勧めします。

<x-cards data-columns="2">
  <x-card data-title="フロントエンド設定 (@blocklet/uploader)" data-icon="lucide:layout-template" data-href="/getting-started/frontend-setup">
    Reactアプリケーションに基本的なフロントエンドアップローダーコンポーネントをインストールし、レンダリングするためのステップバイステップガイドです。
  </x-card>
  <x-card data-title="バックエンド設定 (@blocklet/uploader-server)" data-icon="lucide:server" data-href="/getting-started/backend-setup">
    Expressベースのblockletに必要なバックエンドミドルウェアをインストールし、設定してファイルのアップロードを処理する方法を学びます。
  </x-card>
</x-cards>

これらのガイドを完了すると、完全に機能するファイルアップローダーが完成します。プラグインのカスタマイズやアップロードコールバックの処理など、より高度な機能を探求するには、[ガイド](./guides.md)セクションに進んでください。