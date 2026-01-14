# ガイド

ガイドセクションへようこそ。ここでは、アップローダーの一般的な機能やカスタマイズを実装するための、実践的でタスク指向のウォークスルーを提供します。これらのガイドは、[はじめに](./getting-started.md)セクションで紹介された概念に基づいており、実際のシナリオに沿ったステップバイステップの手順を説明します。

これらのガイドは、フロントエンドの `@blocklet/uploader` コンポーネントと、`@blocklet/uploader-server` を使用したオプションのバックエンドカスタマイズの両方を対象としています。フロントエンドコンポーネントは独立して動作できますが、バックエンドパッケージはカスタムのサーバーサイドアップロード処理を追加したり、リモートソースを有効にしたりするために使用されます。

<x-cards data-columns="2">
  <x-card data-title="プラグインの設定" data-icon="lucide:settings-2" data-href="/guides/configuring-plugins">
    Image Editor、Webcam、URLインポーターなどのUppyプラグインを有効化、無効化し、カスタムオプションを渡す方法を学びます。
  </x-card>
  <x-card data-title="アップロードの処理" data-icon="lucide:upload-cloud" data-href="/guides/handling-uploads">
    フロントエンドとバックエンドの両方でコールバックを実装し、アップロード成功後にファイルを処理してメタデータにアクセスします。
  </x-card>
  <x-card data-title="リモートソースの統合" data-icon="lucide:link" data-href="/guides/remote-sources">
    バックエンドでCompanionミドルウェアを設定し、ユーザーがUnsplashや直接URLなどのリモートソースからファイルをインポートできるようにします。
  </x-card>
  <x-card data-title="カスタムプラグインの作成" data-icon="lucide:puzzle" data-href="/guides/custom-plugin">
    提供されているVirtualPluginコンポーネントを使用して独自のカスタムプラグインタブを作成し、アップローダーの機能を拡張します。
  </x-card>
</x-cards>

これらのガイドを読み終えれば、特定のニーズに合わせてアップローダーを調整する方法をしっかりと理解できるでしょう。より詳細な情報については、[APIリファレンス](./api-reference.md)をご覧ください。