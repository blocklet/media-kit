# バックエンド設定 (@blocklet/uploader-server)

このガイドでは、Express.jsベースのblockletに`@blocklet/uploader-server`パッケージを設定する方法を説明します。このパッケージは、`@blocklet/uploader`フロントエンドコンポーネントによって開始されるファイルアップロードを処理するために必要なサーバーサイドミドルウェアを提供します。

フロントエンドの`@blocklet/uploader`は、Tusリジュマブルアップロードプロトコルをサポートする任意のカスタムバックエンドで使用できますが、`@blocklet/uploader-server`は、ローカルファイルストレージ、メタデータ処理、および期限切れアップロードのクリーンアップを処理する、すぐに使える統合ソリューションを提供します。

## アップロードフローの概要

以下の図は、ユーザーがフロントエンドコンポーネントとバックエンドサーバーミドルウェアを使用してファイルをアップロードする際の典型的なデータフローを示しています。

```d2
direction: down

User: {
  shape: c4-person
}

App: {
  label: "Your Blocklet Application"
  shape: rectangle

  Uploader-Component: {
    label: "Uploader Component\n(Frontend)"
    shape: rectangle
  }

  Backend-Server: {
    label: "Backend Server (Express)"
    shape: rectangle

    Uploader-Middleware: {
      label: "@blocklet/uploader-server\n(initLocalStorageServer)"
    }

    File-System: {
      label: "Upload Directory"
      shape: cylinder
    }

    Database: {
      label: "Database"
      shape: cylinder
    }
  }
}

User -> App.Uploader-Component: "1. Selects & drops file"
App.Uploader-Component -> App.Backend-Server.Uploader-Middleware: "2. Uploads file chunks (Tus protocol)"
App.Backend-Server.Uploader-Middleware -> App.File-System: "3. Saves file to disk"
App.Backend-Server.Uploader-Middleware -> App.Backend-Server.Uploader-Middleware: "4. Triggers onUploadFinish callback"
App.Backend-Server.Uploader-Middleware -> App.Database: "5. Save file metadata"
App.Database -> App.Backend-Server.Uploader-Middleware: "6. Return saved record"
App.Backend-Server.Uploader-Middleware -> App.Uploader-Component: "7. Send JSON response with file URL"
App.Uploader-Component -> User: "8. Update UI with final file"
```

## ステップ1：インストール

まず、パッケージをblockletの依存関係に追加します。

```bash
pnpm add @blocklet/uploader-server
```

## ステップ2：基本設定

このパッケージからの主要なエクスポートは`initLocalStorageServer`です。この関数は、ファイルアップロードを処理し、ローカルファイルシステムに保存するExpressミドルウェアを作成します。

blockletに新しいルートファイル（例：`routes/uploads.js`）を作成し、以下の基本設定を追加します。

```javascript Basic upload endpoint icon=logos:javascript
import express from 'express';
import { initLocalStorageServer } from '@blocklet/uploader-server';

const router = express.Router();

// アップローダーサーバーミドルウェアを初期化します
const localStorageServer = initLocalStorageServer({
  path: process.env.UPLOAD_DIR, // アップロードされたファイルを保存するディレクトリ
  express,
});

// このルートへのすべてのリクエストを処理するためにアップローダーミドルウェアをマウントします
router.use('/', localStorageServer.handle);

export default router;
```

この最小限のセットアップでは：
- `initLocalStorageServer`をインポートします。
- `path`オプションを指定して呼び出します。これは、ファイルが保存されるサーバー上のディレクトリを指定します。これは絶対パスである必要があります。
- `express`オブジェクト自体をミドルウェアに渡します。
- 最後に、返されたハンドラーをルーターにマウントします。

これで、このルーターをメインの`app.js`ファイルにマウントできます。

```javascript app.js icon=logos:javascript
// ... 他のインポート
import uploadRouter from './routes/uploads';

// ... アプリのセットアップ
app.use('/api/uploads', uploadRouter);
```

これにより、バックエンドは`/api/uploads`エンドポイントでファイルのアップロードを受け取る準備が整いました。

## ステップ3：アップロード完了の処理

ファイルを保存するだけでは不十分です。通常は、そのメタデータをデータベースに保存し、公開アクセス可能なURLをフロントエンドに返す必要があります。これは`onUploadFinish`コールバックを使用して行われます。

`onUploadFinish`関数は、ファイルがサーバーに正常かつ完全にアップロードされた後に実行されます。

以下は、その使用方法を示すより完全な例です。

```javascript Full backend example icon=logos:javascript
import { initLocalStorageServer } from '@blocklet/uploader-server';
import express from 'express';
import url from 'url';
import path from 'path';

// アップロード用のデータベースモデルがあると仮定します
// import Upload from '../models/upload';

const router = express.Router();

const localStorageServer = initLocalStorageServer({
  path: process.env.UPLOAD_DIR,
  express,
  onUploadFinish: async (req, res, uploadMetadata) => {
    // 1. 完了したアップロードからメタデータを分割代入します
    const {
      id: filename, // ディスク上の一意でランダム化されたファイル名
      size,
      metadata: { filename: originalname, filetype: mimetype },
    } = uploadMetadata;

    // 2. ファイルの公開URLを構築します
    const publicUrl = new URL(process.env.APP_URL);
    publicUrl.pathname = path.join('/api/uploads', filename);

    // 3. (任意ですが推奨) ファイルメタデータをデータベースに保存します
    /*
    const doc = await Upload.insert({
      mimetype,
      originalname,
      filename,
      size,
      url: publicUrl.href,
      createdAt: new Date().toISOString(),
      createdBy: req.user.did,
    });
    */

    // 4. JSONオブジェクトをフロントエンドに返します。このオブジェクトは
    // フロントエンドのonUploadSuccessコールバックで利用可能になります。
    const responseData = {
      url: publicUrl.href,
      // ...doc, // データベースレコードを作成した場合はそれを含めます
    };

    return responseData;
  },
});

// ハンドラーをマウントします。認証用ミドルウェア（`user`、`auth`など）は
// ハンドラーの前に配置する必要があります。
router.use('/', localStorageServer.handle);

export default router;
```

### キーポイント：

- **`uploadMetadata`**: このオブジェクトには、アップロードされたファイルに関するすべての情報が含まれます。これには、一意のID（ディスク上のファイル名でもあります）、サイズ、およびクライアントから送信された元のメタデータ（`originalname`や`mimetype`など）が含まれます。
- **データベース統合**: このコールバックは、アップロードされたファイルをアプリケーションのユーザーや他のリソースにリンクするレコードをデータベースに作成するのに最適な場所です。
- **戻り値**: `onUploadFinish`によって返されたオブジェクトはJSONにシリアライズされ、レスポンスとしてフロントエンドに送信されます。フロントエンドの`onUploadSuccess`コールバックはこのオブジェクトを受け取り、これによってアップロードされたファイルの最終的なURLを知ることができます。

## 次のステップ

バックエンドの設定が完了したら、より高度な機能やカスタマイズを探求する準備が整いました。

<x-cards>
  <x-card data-title="アップロードの処理" data-icon="lucide:upload-cloud" data-href="/guides/handling-uploads">
    `onUploadFinish`コールバックをさらに深く掘り下げ、クライアントとサーバーの両方でファイルメタデータを処理する方法を学びます。
  </x-card>
  <x-card data-title="リモートソースの統合" data-icon="lucide:link" data-href="/guides/remote-sources">
    Companionミドルウェアを設定して、ユーザーがURLやUnsplashなどからファイルをインポートできるようにする方法を学びます。
  </x-card>
  <x-card data-title="initLocalStorageServer() API" data-icon="lucide:book-open" data-href="/api-reference/uploader-server/local-storage">
    ローカルストレージミドルウェアをカスタマイズするためのすべての利用可能なオプションについて、完全なAPIリファレンスを探索します。
  </x-card>
</x-cards>