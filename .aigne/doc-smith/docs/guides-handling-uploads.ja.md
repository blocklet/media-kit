# アップロードの処理

ファイルが正常にアップロードされた後、クライアントとサーバーの両方でアクションを実行する必要がよくあります。このガイドでは、`@blocklet/uploader` フロントエンドコンポーネントと `@blocklet/uploader-server` ミドルウェアの両方で `onUploadFinish` コールバックを使用して、ファイルとそのメタデータを処理する方法を説明します。

フロントエンドのコールバックはUIの更新に最適であり、バックエンドのコールバックはファイル情報をデータベースに保存するなどのサーバーサイドタスクに使用されます。

### アップロードフロー

以下の図は、ユーザーがファイルをドロップしてから最終的なUI更新までの完全なプロセスを示しており、フロントエンドとバックエンドのコールバックがどのように連携するかを示しています。

```d2
direction: down

User: { 
  shape: c4-person 
  label: "ユーザー"
}

App: {
  label: "あなたのBlockletアプリケーション"
  shape: rectangle

  Uploader-Component: {
    label: "Uploaderコンポーネント"
    shape: rectangle
  }

  Backend-Server: {
    label: "バックエンドサーバー"
    shape: rectangle

    Uploader-Server: {
      label: "@blocklet/uploader-server"
    }

    DB: {
      label: "データベース"
      shape: cylinder
    }
  }
}

User -> App.Uploader-Component: "1. ファイルをドロップ"
App.Uploader-Component -> App.Backend-Server.Uploader-Server: "2. ファイルをアップロード (Tus)"
App.Backend-Server.Uploader-Server -> App.Backend-Server.Uploader-Server: "3. バックエンドのonUploadFinishをトリガー"
App.Backend-Server.Uploader-Server -> App.Backend-Server.DB: "4. メタデータを保存"
App.Backend-Server.DB -> App.Backend-Server.Uploader-Server: "5. DBレコードを返す"
App.Backend-Server.Uploader-Server -> App.Uploader-Component: "6. JSONレスポンスを送信"
App.Uploader-Component -> App.Uploader-Component: "7. フロントエンドのonUploadFinishをトリガー"
App.Uploader-Component -> User: "8. ファイルURLでUIを更新"
```

---

## フロントエンド：`onUploadFinish` Prop

`Uploader` コンポーネントは `onUploadFinish` prop を受け入れます。これは、各ファイルのアップロードが完了した後に実行される関数です。このコールバックは、バックエンドの `onUploadFinish` ハンドラから送信されたJSONレスポンスを受け取ります。

これは、アプリケーションの状態を更新したり、アップロードされた画像を表示したり、返されたファイルURLを保存したりするのに最適な場所です。

**Propの定義**

| Prop | 型 | 説明 |
|---|---|---|
| `onUploadFinish` | `(result: any) => void` | バックエンドがファイルを処理した後に、最終的なアップロード結果オブジェクトを受け取るコールバック関数。 |

**使用例**

この例では、`onUploadFinish` コールバックを使用してバックエンドからファイルURLを受け取り、それをコンポーネントの状態に保存します。

```javascript Uploader Component icon=logos:react
import { Uploader } from '@blocklet/uploader/react';
import { useState } from 'react';

export default function MyComponent() {
  const [fileUrl, setFileUrl] = useState('');

  const handleUploadFinish = (result) => {
    // 'result' オブジェクトは、バックエンドからのJSONレスポンスです
    console.log('Upload finished:', result);

    // 'result.data' には、サーバーから返されたボディが含まれます
    if (result.data && result.data.url) {
      setFileUrl(result.data.url);
    }
  };

  return (
    <div>
      <Uploader onUploadFinish={handleUploadFinish} />
      {fileUrl && (
        <div>
          <p>アップロード成功！</p>
          <img src={fileUrl} alt="アップロードされたコンテンツ" width="200" />
        </div>
      )}
    </div>
  );
}
```

フロントエンドのコールバックに渡される `result` オブジェクトには、サーバーからのレスポンスを含む、アップロードに関する詳細情報が含まれています。

**`result` オブジェクトの例**

```json
{
  "uploadURL": "http://localhost:3030/api/uploads/f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6.png",
  "data": {
    "url": "http://localhost:3030/api/uploads/f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6.png",
    "_id": "z2k...",
    "mimetype": "image/png",
    "originalname": "screenshot.png",
    "filename": "f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6.png",
    "size": 123456,
    "folderId": "component_did",
    "createdBy": "user_did",
    "updatedBy": "user_did",
    "createdAt": "2023-10-27T10:00:00.000Z",
    "updatedAt": "2023-10-27T10:00:00.000Z"
  },
  "method": "POST",
  "url": "http://localhost:3030/api/uploads/f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6.png",
  "status": 200,
  "headers": { ... },
  "file": { ... } // Uppyファイルオブジェクト
}
```

---

## バックエンド：`onUploadFinish` オプション

サーバー側では、`initLocalStorageServer` を初期化する際に `onUploadFinish` 関数を提供します。この関数は、ファイルが完全に受信され、サーバーのローカルディスクに保存された後、最終的なレスポンスがクライアントに送信される前にトリガーされます。

ここは、次のようなコアビジネスロジックを処理する場所です：
- アップロードされたファイルの検証。
- ファイルメタデータのデータベースへの保存。
- ファイルと現在のユーザーの関連付け。
- カスタムJSONオブジェクトのフロントエンドへの返却。

**関数シグネチャ**

```typescript
(req: Request, res: Response, uploadMetadata: object) => Promise<any>
```

- `req`：Expressリクエストオブジェクト。ヘッダーとユーザー情報を含みます。
- `res`：Expressレスポンスオブジェクト。
- `uploadMetadata`：アップロードされたファイルに関する詳細を含むオブジェクト。

**使用例**

この例では、ファイルメタデータをデータベースに保存し（架空の `Upload` モデルを使用）、作成されたレコードをフロントエンドに返す方法を示します。

```javascript Backend Server Setup icon=logos:nodejs
import { initLocalStorageServer } from '@blocklet/uploader-server';
import express from 'express';
import { joinUrl } from 'url-join';

// 'Upload' がデータベースモデルであると仮定します
import Upload from '../models/upload';

const app = express();

const localStorageServer = initLocalStorageServer({
  path: process.env.UPLOAD_DIR,
  express,
  onUploadFinish: async (req, res, uploadMetadata) => {
    const {
      id: filename, // ディスク上の一意なハッシュ化されたファイル名
      size,
      metadata: { filename: originalname, filetype: mimetype },
    } = uploadMetadata;

    // ファイルの公開URLを構築します
    const fileUrl = joinUrl(process.env.APP_URL, '/api/uploads', filename);

    // ファイルメタデータをデータベースに保存します
    const doc = await Upload.insert({
      mimetype,
      originalname,
      filename, // ハッシュ化されたファイル名
      size,
      folderId: req.componentDid, // アップロードが発生したコンポーネントのDID
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user.did, // ユーザー認証ミドルウェアを想定しています
      updatedBy: req.user.did,
    });

    // 返されたオブジェクトはJSONレスポンスとしてフロントエンドに送信されます
    const responseData = { url: fileUrl, ...doc };

    return responseData;
  },
});

// uploaderミドルウェアをマウントします
app.use('/api/uploads', localStorageServer.handle);
```

**`uploadMetadata` オブジェクトの詳細**

`uploadMetadata` オブジェクトは、ファイルに関する重要な情報を提供します：

```json
{
  "id": "f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6.png",
  "size": 123456,
  "offset": 123456,
  "is_final": true,
  "metadata": {
    "relativePath": null,
    "name": "screenshot.png",
    "filename": "screenshot.png",
    "type": "image/png",
    "filetype": "image/png",
    "uploaderId": "Uploader"
  },
  "runtime": {
    "relativePath": null,
    "absolutePath": "/path/to/uploads/f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6.png",
    "size": 123456,
    "hashFileName": "f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6.png",
    "originFileName": "screenshot.png",
    "type": "image/png",
    "fileType": "image/png"
  }
}
```

両方のコールバックを実装することで、ブラウザでのユーザーアクションとサーバーサイドのビジネスロジックをシームレスに接続する堅牢なアップロードパイプラインを作成できます。Unsplashのような外部ソースからのファイルを処理する方法を学ぶには、次のガイドに進んでください。

<x-card data-title="リモートソースの統合（Companion）" data-icon="lucide:link" data-href="/guides/remote-sources">
  Companionミドルウェアを設定して、ユーザーが直接URLや他のサービスからファイルをインポートできるようにする方法を学びます。
</x-card>