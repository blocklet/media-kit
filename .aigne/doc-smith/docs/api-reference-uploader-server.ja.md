# バックエンド: @blocklet/uploader-server

`@blocklet/uploader-server` パッケージは、ブロックレットのバックエンドで様々なファイル処理タスクを扱うために設計された Express.js ミドルウェアのスイートを提供します。これは、`@blocklet/uploader` フロントエンドコンポーネントのサーバーサイド対応部分として機能し、ダイレクトファイルアップロード、リモートソースとの統合、リソース提供などの機能を有効にします。

フロントエンドのパートナーとシームレスに連携するように設計されていますが、カスタマイズされたファイルアップロードロジックのスタンドアロンソリューションとしても使用できます。このパッケージは、Express アプリケーションに簡単に統合できるいくつかのモジュラーミドルウェアイニシャライザをエクスポートします。

### コアミドルウェアの相互作用

以下の図は、アップロードプロセス中に主要なミドルウェアコンポーネントがフロントエンドおよび外部サービスとどのように相互作用するかを示しています。

```d2
direction: down

Frontend-Uploader: {
  label: "@blocklet/uploader"
}

Backend-Server: {
  label: "Expressサーバー"
  shape: rectangle

  uploader-server-middleware: {
    label: "@blocklet/uploader-server"

    initLocalStorageServer
    initCompanion
  }
}

Remote-Sources: {
  label: "リモートソース\n(例: Unsplash)"
  shape: cylinder
}

File-Storage: {
  label: "サーバーファイルシステム"
  shape: cylinder
}

Frontend-Uploader -> Backend-Server.uploader-server-middleware.initLocalStorageServer: "直接アップロード"
Frontend-Uploader -> Backend-Server.uploader-server-middleware.initCompanion: "リモートアップロードリクエスト"
Backend-Server.uploader-server-middleware.initCompanion -> Remote-Sources: "ファイルの取得"
Backend-Server.uploader-server-middleware.initLocalStorageServer -> File-Storage: "ファイルの保存"

```

## インストール

開始するには、パッケージをブロックレットの依存関係に追加します。

```bash Installation icon=mdi:language-bash
pnpm add @blocklet/uploader-server
```

## 一般的な使用法

これは、アップロードおよびコンパニオンミドルウェアをExpressアプリケーションのルーターに統合する典型的な例です。必要なミドルウェアを初期化し、そのハンドラーを特定のルートにマウントできます。

```javascript Express Router Example icon=logos:javascript
import { initLocalStorageServer, initCompanion } from '@blocklet/uploader-server';
import express from 'express';

// `env`、`user`、`auth`、`ensureComponentDid`、および `Upload` モデルは他の場所で定義されていると仮定します
const router = express.Router();

// 1. 直接アップロードのためにローカルストレージサーバーを初期化します
const localStorageServer = initLocalStorageServer({
  path: env.uploadDir, // アップロードを保存するディレクトリ
  express,
  // オプション：ファイルが正常にアップロードされた後に実行されるコールバック
  onUploadFinish: async (req, res, uploadMetadata) => {
    const {
      id: filename,
      size,
      metadata: { filename: originalname, filetype: mimetype },
    } = uploadMetadata;

    // アップロードされたファイルの公開URLを構築します
    const obj = new URL(env.appUrl);
    obj.protocol = req.get('x-forwarded-proto') || req.protocol;
    obj.pathname = `/uploads/${filename}`;

    // ファイルのメタデータをデータベースに保存します
    const doc = await Upload.insert({
      mimetype,
      originalname,
      filename,
      size,
      // ... リクエストからの他のメタデータ
    });

    // フロントエンドにJSONレスポンスを返します
    const resData = { url: obj.href, ...doc };
    return resData;
  },
});

// アップロードハンドラーを特定のルートにマウントします
router.use('/uploads', user, auth, ensureComponentDid, localStorageServer.handle);

// 2. リモートソース（例：URL、Unsplash）のためにCompanionを初期化します
const companion = initCompanion({
  path: env.uploadDir,
  express,
  providerOptions: env.providerOptions, // プロバイダーキー（例：Unsplash）
  uploadUrls: [env.appUrl], // アプリのURL
});

// コンパニオンハンドラーをそのルートにマウントします
router.use('/companion', user, auth, ensureComponentDid, companion.handle);
```

## 利用可能なミドルウェア

このパッケージは、さまざまな機能のためにいくつかのミドルウェアイニシャライザをエクスポートします。カードをクリックして、詳細なAPIリファレンスと設定オプションを表示します。

<x-cards data-columns="2">
  <x-card data-title="initLocalStorageServer" data-icon="lucide:hard-drive-upload" data-href="/api-reference/uploader-server/local-storage">
    ユーザーのコンピュータからの直接のファイルアップロードを処理し、サーバーのローカルストレージに保存します。
  </x-card>
  <x-card data-title="initCompanion" data-icon="lucide:link" data-href="/api-reference/uploader-server/companion">
    Uppy Companionと統合し、ユーザーが直接URLやUnsplashなどのリモートソースからファイルをインポートできるようにします。
  </x-card>
  <x-card data-title="initStaticResourceMiddleware" data-icon="lucide:folder-static" data-href="/api-reference/uploader-server/static-resource">
    他のインストールされたブロックレットから静的アセット（例：画像、CSS）を提供し、リソース共有を可能にします。
  </x-card>
  <x-card data-title="initDynamicResourceMiddleware" data-icon="lucide:folder-sync" data-href="/api-reference/uploader-server/dynamic-resource">
    指定されたディレクトリからリソースを提供し、リアルタイムでファイルの変更を監視できるため、開発に役立ちます。
  </x-card>
</x-cards>

## 次のステップ

`@blocklet/uploader-server` パッケージは、ブロックレット内で堅牢なファイル処理システムを構築するための不可欠なサーバーサイドのビルディングブロックを提供します。これらのミドルウェア機能を組み合わせることで、ユーザーに機能豊富なアップロード体験を提供できます。

開始するには、[initLocalStorageServer](./api-reference-uploader-server-local-storage.md) のドキュメントを参照して、コアとなる直接アップロード機能を設定することをお勧めします。