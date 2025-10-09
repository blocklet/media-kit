# 概要

Blocklet Uploaderは、blocklet向けに設計された包括的なファイルアップロードソリューションで、堅牢で拡張性の高い[Uppy](https://uppy.io/)ファイルアップローダーを基盤に構築されています。これは、ブラウザのユーザーインターフェースからサーバーでのファイル処理まで、シームレスな体験を提供するために連携する2つの主要なパッケージで構成されています。

<x-cards>
  <x-card data-title="@blocklet/uploader (フロントエンド)" data-icon="lucide:upload-cloud" data-href="/getting-started/frontend-setup">
    ファイル選択とアップロード進行状況のための、リッチでプラグイン可能なユーザーインターフェースを提供するReactコンポーネント。
  </x-card>
  <x-card data-title="@blocklet/uploader-server (バックエンド)" data-icon="lucide:server" data-href="/getting-started/backend-setup">
    ファイルの保存、処理、およびUnsplashのようなリモートソースとの統合を処理するExpressミドルウェア。
  </x-card>
</x-cards>

## 仕組み

標準的なワークフローでは、ユーザーはアプリケーションのフロントエンドで@blocklet/uploaderコンポーネントを操作します。このコンポーネントは、@blocklet/uploader-serverによって提供されるバックエンドエンドポイントと通信し、実際のファイルの保存と処理を処理します。

Media Kit blockletが存在する場合、@blocklet/uploaderはデフォルトのアップロード処理を提供するため、カスタムバックエンドなしで機能できることに注意が必要です。@blocklet/uploader-serverをインストールして設定する必要があるのは、アップロード完了後に特定のデータベースにファイルメタデータを保存するなど、カスタムのサーバーサイドロジックが必要な場合のみです。

```d2 基本的なアップロードフロー
direction: down

User: { 
  shape: c4-person 
}

App: {
  label: "あなたのBlockletアプリケーション"
  shape: rectangle

  Uploader-Component: {
    label: "@blocklet/uploader\n(フロントエンドコンポーネント)"
    shape: rectangle
  }

  Backend-Server: {
    label: "バックエンドサーバー"
    shape: rectangle

    Uploader-Server: {
      label: "@blocklet/uploader-server\n(ミドルウェア)"
    }

    DB: {
      label: "データベース"
      shape: cylinder
    }
  }
}

User -> App.Uploader-Component: "1. ファイルをドロップ"
App.Uploader-Component -> App.Backend-Server.Uploader-Server: "2. ファイルをアップロード"
App.Backend-Server.Uploader-Server -> App.Backend-Server.Uploader-Server: "3. onUploadFinishフックをトリガー"
App.Backend-Server.Uploader-Server -> App.Backend-Server.DB: "4. メタデータを保存"
App.Backend-Server.DB -> App.Backend-Server.Uploader-Server: "5. DBレコードを返す"
App.Backend-Server.Uploader-Server -> App.Uploader-Component: "6. JSONレスポンスを送信 (URL)"
App.Uploader-Component -> App.Uploader-Component: "7. onUploadFinishフックをトリガー"
App.Uploader-Component -> User: "8. UIを更新"
```

## 主な機能

*   **Uppyによる強力なサポート**: 成熟し、実績のあるコアを活用して、信頼性の高いアップロードを実現します。
*   **柔軟なアーキテクチャ**: 分離されたフロントエンドとバックエンドのパッケージにより、独立した使用とカスタマイズが可能です。
*   **豊富なプラグインシステム**: ImageEditor、Webcam、Urlなどの標準的なUppyプラグインに加え、カスタムのblocklet固有のプラグインもサポートします。
*   **リモートソース統合**: Companionミドルウェアを使用して、ユーザーがUnsplashなどの外部ソースからファイルを簡単にインポートできるようにします。
*   **カスタマイズ可能なフック**: クライアントとサーバーの両方でonUploadFinishコールバックを提供し、アップロード後の処理を完全に制御できます。
*   **自動Media Kit統合**: Media Kit blockletが利用可能な場合、シームレスに検出して自己設定します。

準備はできましたか？アップローダーをあなたのblockletに統合しましょう。

<x-card data-title="はじめに" data-icon="lucide:rocket" data-href="/getting-started" data-cta="ガイドを開始">
  ステップバイステップのガイドに従って、アプリケーションにフロントエンドコンポーネントとバックエンドサーバーの両方を設定します。
</x-card>