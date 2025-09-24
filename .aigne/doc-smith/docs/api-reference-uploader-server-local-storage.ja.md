# initLocalStorageServer(options)

`initLocalStorageServer` 関数は、ユーザーのデバイスから Blocklet のローカルストレージへ直接ファイルをアップロードする処理を行うための中核となるミドルウェアです。堅牢な [Tus resumable upload protocol](https://tus.io/) を利用しており、信頼性の高いアップロードと、ネットワーク中断後のアップロード再開を保証します。

このミドルウェアは、ファイルチャンクを受信してサーバー上で完全なファイルに組み立て、アップロード完了後にファイルメタデータを処理するためのコールバックをトリガーする役割を担います。

### 仕組み

以下の図は、`initLocalStorageServer` を使用するバックエンドに接続された `Uploader` コンポーネントを使ってユーザーがファイルをアップロードする際の、典型的なデータフローを示したものです。

```d2 アップロードフロー図
direction: down

User: {
  label: "ユーザー"
  shape: c4-person
}

App: {
  label: "あなたのBlockletアプリケーション"
  shape: rectangle

  Uploader-Component: {
    label: "<Uploader /> コンポーネント"
    shape: rectangle
  }

  Backend-Server: {
    label: "バックエンドサーバー"
    shape: rectangle

    Uploader-Server: {
      label: "initLocalStorageServer"
    }

    DB: {
      label: "データベース"
      shape: cylinder
    }
  }
}

User -> App.Uploader-Component: "1. ファイルをドロップ"
App.Uploader-Component -> App.Backend-Server.Uploader-Server: "2. ファイルチャンクをアップロード (Tus)"
App.Backend-Server.Uploader-Server -> App.Backend-Server.Uploader-Server: "3. onUploadFinishフックをトリガー"
App.Backend-Server.Uploader-Server -> App.Backend-Server.DB: "4. ファイルメタデータを保存"
App.Backend-Server.DB -> App.Backend-Server.Uploader-Server: "5. DBレコードを返す"
App.Backend-Server.Uploader-Server -> App.Uploader-Component: "6. JSONレスポンスを送信"
App.Uploader-Component -> App.Uploader-Component: "7. フロントエンドのonUploadFinishをトリガー"
App.Uploader-Component -> User: "8. ファイルURLでUIを更新"

```

### 基本的な使い方

まず、Express アプリケーションでミドルウェアを初期化し、特定のルートにマウントします。最も重要なオプションは `onUploadFinish` で、ファイルが正常に保存された後の処理をここで定義します。

```javascript Basic Backend Setup icon=logos:express
import express from 'express';
import { initLocalStorageServer } from '@blocklet/uploader-server';
import Upload from '../models/upload'; // データベースモデル

const router = express.Router();

// uploaderサーバーミドルウェアを初期化
const localStorageServer = initLocalStorageServer({
  // アップロードされたファイルが保存されるディレクトリ
  path: process.env.UPLOAD_DIR,
  express,

  // このコールバックはファイルが正常にアップロードされた後に実行されます
  onUploadFinish: async (req, res, uploadMetadata) => {
    const {
      id: filename, // ディスク上の一意でランダム化されたファイル名
      size,
      metadata: { filename: originalname, filetype: mimetype },
    } = uploadMetadata;

    // アップロードされたファイルの公開URLを構築
    const fileUrl = new URL(process.env.APP_URL);
    fileUrl.pathname = `/uploads/${filename}`;

    // ファイル情報をデータベースに保存
    const doc = await Upload.insert({
      mimetype,
      originalname,
      filename,
      size,
      url: fileUrl.href,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user.did,
    });

    // データベースドキュメントをJSONレスポンスとして返す
    // このデータはフロントエンドのonUploadFinishコールバックに渡されます
    return doc;
  },
});

// '/uploads' ルートにミドルウェアをマウント
// 必要な認証/認可ミドルウェアがその前に実行されることを確認
router.use('/uploads', yourAuthMiddleware, localStorageServer.handle);

export default router;
```

### 設定オプション

`initLocalStorageServer` 関数は、以下のプロパティを持つオプションオブジェクトを受け付けます。

| Option                | Type       | Required | Description                                                                                                                                                                                          | 
| --------------------- | ---------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `path`                | `string`   | はい      | アップロードされたファイルが保存されるディレクトリへの絶対パス。                                                                                                                              |
| `express`             | `Function` | はい      | Express アプリケーションのインスタンス。                                                                                                                                                                    |
| `onUploadFinish`      | `Function` | いいえ       | ファイルのアップロード完了後に実行される `async` コールバック関数。`(req, res, uploadMetadata)` を受け取ります。戻り値はフロントエンドにJSONレスポンスとして送信されます。                   |
| `onUploadCreate`      | `Function` | いいえ       | 新しいアップロードが開始されたが、データが転送される前に実行される `async` コールバック関数。検証や認可チェックに便利です。`(req, res, uploadMetadata)` を受け取ります。 |
| `expiredUploadTime`   | `Number`   | いいえ       | 未完了のアップロードが期限切れと見なされ、バックグラウンドジョブによってクリーンアップされるまでの時間（ミリ秒）。**デフォルト:** `1000 * 60 * 60 * 24 * 3` (3日間)。                 |
| `...restProps`        | `object`   | いいえ       | 基盤となる `@tus/server` パッケージのその他の有効なオプションは、そのまま渡されます。                                                                                                             |

### コールバックの詳細

#### `onUploadFinish(req, res, uploadMetadata)`

これは、完了したアップロードを処理するための主要なコールバックです。ファイルメタデータをデータベースに保存したり、Webhookをトリガーしたり、その他のアップロード後のアクションを実行したりするのに最適な場所です。

**`uploadMetadata` オブジェクト**

コールバックに渡される `uploadMetadata` オブジェクトには、アップロードされたファイルに関する詳細な情報が含まれています。

| Property           | Type     | Description                                                                 |
| ------------------ | -------- | --------------------------------------------------------------------------- |
| `id`               | `string` | サーバーのディスク上の一意でランダムに生成されたファイル名。               |
| `size`             | `number` | ファイルの合計サイズ（バイト単位）。                                        |
| `offset`           | `number` | 現在アップロードされているバイト数。このコールバックでは `size` と等しくなるはずです。 |
| `metadata`         | `object` | クライアントから提供されたメタデータを含むオブジェクト。                       |
| `metadata.filename`| `string` | ユーザーのコンピュータ上の元のファイル名。                             |
| `metadata.filetype`| `string` | ファイルのMIMEタイプ（例：`image/jpeg`）。                             |
| `runtime`          | `object` | ファイルの場所に関するランタイム情報を持つオブジェクト。               |
| `runtime.absolutePath` | `string` | サーバーのファイルシステム上のファイルへのフルパス。                 |

**戻り値**

`onUploadFinish` から返された値はJSONにシリアライズされ、フロントエンドの `Uploader` コンポーネントに送り返されます。これにより、データベースのレコードIDや公開URLなど、関連データを返すことができます。

### 自動クリーンアップ

このミドルウェアは、1時間ごとに実行されるバックグラウンドのcronジョブ（`auto-cleanup-expired-uploads`）を自動的に設定します。このジョブは、`expiredUploadTime` を超えた部分的なアップロードや期限切れのアップロードをストレージディレクトリから安全に削除し、サーバーが不完全なファイルでいっぱいになるのを防ぎます。

### 高度な機能

#### EXIFデータの削除
プライバシーとセキュリティのため、アップロード完了後、ミドルウェアはアップロードされた画像（`.jpeg`、`.tiff` など）からEXIF（Exchangeable image file format）メタデータを自動的に削除しようと試みます。

#### 手動でのファイル削除
返されるサーバーインスタンスには `delete` メソッドが含まれており、これを使用してアップロードされたファイルとそれに関連するメタデータファイルをプログラムで削除できます。

```javascript Manually Deleting a File icon=mdi:code-block-tags
import { localStorageServer } from './setup'; // インスタンスをエクスポートしたと仮定

async function deleteFile(filename) {
  try {
    await localStorageServer.delete(filename);
    console.log(`Successfully deleted ${filename}`);
  } catch (error) {
    console.error(`Failed to delete ${filename}:`, error);
  }
}
```

---

これで直接アップロードの処理方法を理解できたので、次はユーザーが外部サービスからファイルをインポートできるようにすることを考えましょう。次のセクションに進み、`initCompanion` について学んでください。

<x-card data-title="次へ: initCompanion(options)" data-icon="lucide:link" data-href="/api-reference/uploader-server/companion">
  Companionミドルウェアを設定して、ユーザーがUnsplashやダイレクトURLなどのリモートソースからファイルをインポートできるようにする方法を学びます。
</x-card>