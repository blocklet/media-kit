# initCompanion(options)

`initCompanion` 関数は、Uppy Companion ミドルウェアを初期化して設定します。これは、ユーザーが Unsplash、Google Drive、Instagram、または直接 URL などのリモートソースからファイルをインポートできるようにするために不可欠です。この関数は、blocklet 環境内でシームレスに統合できるように調整された、公式の [`@uppy/companion`](https://uppy.io/docs/companion/) ライブラリのラッパーです。

この設定に関する実践的なガイドについては、[リモートソースの統合 (Companion)](./guides-remote-sources.md) をご覧ください。

### 仕組み

Companion はサーバーサイドプロキシとして機能します。ユーザーがリモートソースからファイルを選択すると、リクエストはバックエンドの Companion エンドポイントに送信されます。その後、サーバーはリモートソースからファイルを取得し、ユーザーのブラウザにストリーミングで返します。ブラウザに取り込まれたファイルは、ローカルファイルとして扱われ、最終的な宛先（例：`initLocalStorageServer` が処理するエンドポイント）にアップロードされます。

```d2 Companion の仕組み icon=mdi:diagram-outline
direction: down

User: {
  shape: c4-person
}

Frontend: {
  label: "フロントエンド (ブラウザ)"
  shape: rectangle

  Uploader-Component: {
    label: "Uploader コンポーネント"
    shape: rectangle
  }
}

Backend: {
  label: "バックエンドサーバー"
  shape: rectangle

  Companion-Middleware: {
    label: "Companion ミドルウェア\n(@blocklet/uploader-server)"
  }

  Local-Storage-Middleware: {
    label: "ローカルストレージミドルウェア"
    shape: rectangle
  }
}

Remote-Source: {
  label: "リモートソース\n(例：Unsplash, URL)"
  shape: cylinder
}

User -> Frontend.Uploader-Component: "1. リモートファイルを選択"
Frontend.Uploader-Component -> Backend.Companion-Middleware: "2. ファイルをリクエスト"
Backend.Companion-Middleware -> Remote-Source: "3. ファイルを取得"
Remote-Source -> Backend.Companion-Middleware: "4. ファイルデータをストリーミング"
Backend.Companion-Middleware -> Frontend.Uploader-Component: "5. ブラウザにストリーミングで返す"
Frontend.Uploader-Component -> Backend.Local-Storage-Middleware: "6. ファイルをアップロード (Tus)"

```

### 使用方法

Companion を使用するには、設定オプションで初期化し、その `handle` を Express ルーターパスにアタッチします。フロントエンドの `Uploader` コンポーネントは、`companionUrl` プロパティに同じパスを設定する必要があります。

```javascript Basic Companion Setup icon=logos:javascript
import express from 'express';
import { initCompanion } from '@blocklet/uploader-server';

const router = express.Router();

// Companion の基本設定
const companion = initCompanion({
  // ファイル処理のためにサーバー上の一時ディレクトリ
  path: '/tmp/uploads',
  express,
  // 必要なキーとシークレットを含むプロバイダーオプション
  providerOptions: {
    unsplash: {
      key: process.env.UNSPLASH_KEY,
      secret: process.env.UNSPLASH_SECRET,
    },
  },
  // blocklet の公開 URL、一部のプロバイダーで必須
  uploadUrls: [process.env.APP_URL],
});

// 特定のパスに companion ミドルウェアをマウント
// このパスはフロントエンドの `companionUrl` プロパティと一致する必要があります
router.use('/companion', companion.handle);
```

### パラメータ

`initCompanion` 関数は、次のプロパティを持つ単一のオプションオブジェクトを受け入れます。

| 名前              | 型       | 説明                                                                                                                                                                                          | 
| ----------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `path`            | `string`   | **必須。** 処理中にファイルが保存されるサーバー上の一時ディレクトリへの絶対パス。これは Uppy Companion の `filePath` オプションに対応します。                        |
| `express`         | `Function` | **必須。** Express アプリケーションインスタンス。これは Companion に必要なサブアプリとミドルウェアスタックを作成するために使用されます。                                                                        |
| `providerOptions` | `object`   | オプション。有効にしたい各リモートプロバイダーの設定を含むオブジェクト。各キーはプロバイダー名（例：`unsplash`）で、値はその設定（APIキーやシークレットなど）です。 |
| `...restProps`    | `any`      | 公式の [Uppy Companion options](https://uppy.io/docs/companion/options/) に記載されている他の有効なオプションもここで渡すことができます。例えば、`uploadUrls` は一般的で、しばしば必須のオプションです。          |

### 戻り値

この関数は、次の主要なプロパティを持つ `companion` インスタンスを返します。

| プロパティ            | 型       | 説明                                                                                                                                                                                                                              |
| ------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `handle`            | `Function` | ルート（例：`/companion`）にマウントする必要がある Express ミドルウェア。このハンドルには、リモートファイルリクエストを処理するためのすべてのロジックが含まれています。                                                                                |
| `setProviderOptions`| `(options: object) => void` | 初期化後に `providerOptions` を動的に更新できるメソッド。データベースから API キーをロードしたり、サーバーを再起動せずに設定を変更したりする必要がある場合に便利です。 |

#### 例：動的なプロバイダーオプション

プロバイダーオプションは実行時に変更できます。これは、マルチテナントアプリケーションや、シークレットが非同期でロードされる場合に便利です。

```javascript Dynamic Provider Options icon=logos:javascript
// 最初はプロバイダーオプションなしで companion を初期化
const companion = initCompanion({
  path: '/tmp/uploads',
  express,
});

// 後で、データベースからシークレットを取得した後など
async function updateCompanionConfig() {
  const secrets = await getSecretsFromDb();
  companion.setProviderOptions({
    unsplash: {
      key: secrets.unsplashKey,
      secret: secrets.unsplashSecret,
    },
  });
}
```

### 追加機能

- **ステータスコードの書き換え**: セキュリティとエラーハンドリングの向上のため、リモートプロバイダーが 500 以上のステータスコードでエラーを返した場合、このミドルウェアは自動的にそれを `400 Bad Request` に書き換えます。これにより、サーバーエラーの詳細がクライアントに漏洩するのを防ぎます。

---

Companion を設定することで、アップローダーは多種多様なソースからのファイルを扱えるようになります。また、自身の blocklet や他の blocklet から静的ファイルを提供する必要がある場合もあります。

<x-cards>
  <x-card data-title="ガイド：リモートソースの統合" data-icon="lucide:link" data-href="/guides/remote-sources">
    フロントエンドとバックエンドの両方をリモートアップロード用に設定するためのステップバイステップガイド。
  </x-card>
  <x-card data-title="API: initStaticResourceMiddleware" data-icon="lucide:file-code" data-href="/api-reference/uploader-server/static-resource">
    他のインストール済み blocklet から静的アセットを提供する方法を学びます。
  </x-card>
</x-cards>