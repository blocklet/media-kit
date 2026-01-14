# API リファレンス

Blocklet Uploader パッケージの API リファレンスへようこそ。このセクションでは、フロントエンドとバックエンドの両ライブラリでエクスポートされるすべてのコンポーネント、関数、プロップ、および設定オプションに関する包括的な詳細を提供します。これは、詳細な技術情報を得るための頼りになるリソースです。

アップローダーは、2つの主要なパッケージに分かれています：

- **`@blocklet/uploader`**: アプリケーションのフロントエンド用の柔軟な React コンポーネント。
- **`@blocklet/uploader-server`**: バックエンドでファイルアップロードを処理するための Express ミドルウェアのセット。

これらはシームレスに連携するように設計されていますが、`@blocklet/uploader` は Tus の再開可能なアップロードプロトコルをサポートする任意のバックエンドで使用できることに注意してください。`@blocklet/uploader-server` は、Blocklet 内でアップロードロジックを処理するための強力で事前設定されたソリューションを提供しますが、その使用はオプションです。

```d2
direction: down

your-blocklet-app: {
  label: "あなたのBlockletアプリケーション"
  shape: rectangle

  frontend: {
    label: "フロントエンド (React)"
    shape: rectangle
  }

  backend: {
    label: "バックエンド (Express)"
    shape: rectangle
  }
}

uploader: {
  label: "@blocklet/uploader"
  shape: rectangle
  style.fill: "#E6F7FF"
}

uploader-server: {
  label: "@blocklet/uploader-server"
  shape: rectangle
  style.fill: "#F6FFED"
}

your-blocklet-app.frontend -> uploader: "<Uploader />コンポーネントをインポート"
your-blocklet-app.backend -> uploader-server: "アップロードミドルウェアを使用"

```

以下のパッケージを選択して、詳細な API ドキュメントをご覧ください。

<x-cards data-columns="2">
  <x-card data-title="フロントエンド: @blocklet/uploader" data-icon="lucide:component" data-href="/api-reference/uploader">
    リッチなファイルアップロード体験を作成するために、フロントエンドの React パッケージで利用可能なプロップ、コンポーネント、フック、およびユーティリティ関数を探索してください。
  </x-card>
  <x-card data-title="バックエンド: @blocklet/uploader-server" data-icon="lucide:server" data-href="/api-reference/uploader-server">
    ファイルストレージ、Companion を介したリモートソースの処理、および静的または動的リソースの提供に使用されるすべてのサーバーサイドミドルウェア関数の詳細なリファレンス。
  </x-card>
</x-cards>

これらのパッケージがどのように構築され、他のシステムとどのように統合されるかについて、より高いレベルの理解が必要な場合は、[コンセプト](./concepts.md) セクションをご覧ください。