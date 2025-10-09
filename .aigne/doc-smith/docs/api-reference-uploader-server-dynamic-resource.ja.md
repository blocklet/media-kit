# initDynamicResourceMiddleware(options)

`initDynamicResourceMiddleware`は、指定された1つ以上のディレクトリからファイルを動的に提供するために設計された強力なExpressミドルウェアです。`initStaticResourceMiddleware`とは異なり、ファイルシステムの変更（追加、削除、変更）をリアルタイムでアクティブに監視するため、ユーザーがアップロードしたファイル、テーマ、プラグインなど、ランタイム中に変更される可能性のあるコンテンツの提供に最適です。

高速な検索のためにリソースのインメモリマップを構築し、キャッシング、ファイルフィルタリング、競合解決を適切に処理します。

## 動作の仕組み

このミドルウェアは、初期化、スキャン、監視、提供という明確なライフサイクルに従います。リクエストが来ると、内部マップで迅速な検索を実行します。監視対象のディレクトリからファイルが追加または削除されると、マップは自動的に更新されます。

```d2
direction: down

App-Startup: {
  label: "Application Startup"
  shape: oval
}

Middleware: {
  label: "Dynamic Resource Middleware"
  shape: rectangle

  scan: {
    label: "1. Scan Directories"
    shape: rectangle
  }

  map: {
    label: "2. Build Resource Map"
    shape: cylinder
  }

  watch: {
    label: "3. Watch for Changes"
  }
}

Request-Handling: {
  label: "Request Handling"
  shape: rectangle

  Request: {
    label: "Incoming Request\n(e.g., GET /my-asset.png)"
    shape: rectangle
  }

  Lookup: {
    label: "4. Lookup in Map"
  }

  Serve: {
    label: "5a. Serve Resource"
    shape: rectangle
  }

  Next: {
    label: "5b. Not Found, call next()"
    shape: rectangle
  }
}

File-System: {
  label: "File System Event\n(e.g., file added)"
  shape: rectangle
}

App-Startup -> Middleware.scan: "initDynamicResourceMiddleware(options)"
Middleware.scan -> Middleware.map
Middleware.scan -> Middleware.watch

Request-Handling.Request -> Request-Handling.Lookup
Request-Handling.Lookup -> Middleware.map: "Read"
Middleware.map -> Request-Handling.Lookup
Request-Handling.Lookup -> Request-Handling.Serve: "Found"
Request-Handling.Lookup -> Request-Handling.Next: "Not Found"

File-System -> Middleware.watch: "Triggers Event"
Middleware.watch -> Middleware.map: "Update Map"
```

## 基本的な使用方法

以下に、動的な `uploads` ディレクトリから画像を提供するためにミドルウェアを設定する方法を示します。

```javascript Server Setup icon=mdi:code
import express from 'express';
import { initDynamicResourceMiddleware } from '@blocklet/uploader-server';
import path from 'path';

const app = express();

const dynamicResourceMiddleware = initDynamicResourceMiddleware({
  resourcePaths: [
    {
      path: path.join(__dirname, 'uploads/images'),
      whitelist: ['.jpg', '.jpeg', '.png', '.gif'],
    },
  ],
  onReady: (count) => {
    console.log(`${count} dynamic resources are ready to be served.`);
  },
  onFileChange: (filePath, event) => {
    console.log(`File ${filePath} was ${event}.`);
  },
});

// Mount the middleware
app.use('/uploads/images', dynamicResourceMiddleware);

// On server shutdown, clean up watchers
process.on('SIGINT', () => {
  if (dynamicResourceMiddleware.cleanup) {
    dynamicResourceMiddleware.cleanup();
  }
  process.exit();
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```

## 設定オプション

`initDynamicResourceMiddleware` 関数は、次のプロパティを持つ単一のオプションオブジェクトを受け入れます：

| Option | Type | Description |
| --- | --- | --- |
| `componentDid` | `string` | オプション。提供された場合、現在のコンポーネントのDIDがこの値と一致する場合にのみミドルウェアがアクティブになります。 |
| `resourcePaths` | `DynamicResourcePath[]` | **必須。** 監視および提供するディレクトリを定義するオブジェクトの配列。詳細は下記を参照してください。 |
| `watchOptions` | `object` | オプション。ファイルシステムウォッチャーの設定。 |
| `cacheOptions` | `object` | オプション。HTTPキャッシングヘッダーの設定。 |
| `onFileChange` | `(filePath: string, event: string) => void` | オプション。ファイルが変更、追加、または削除されたときにトリガーされるコールバック関数。`event` は `'change'`、`'rename'`、または `'delete'` のいずれかです。 |
| `onReady` | `(resourceCount: number) => void` | オプション。初期スキャンが完了した後、およびリソースマップが変更されたときに実行されるコールバック。利用可能なリソースの総数を提供します。 |
| `setHeaders` | `(res, filePath, stat) => void` | オプション。ファイルを配信する前にレスポンスにカスタムヘッダーを設定する関数。 |
| `conflictResolution` | `'first-match'` \| `'last-match'` \| `'error'` | オプション。複数のディレクトリに同じ名前のファイルが含まれている場合のファイル名の衝突を処理する戦略。デフォルトは `'first-match'` です。 |

### `DynamicResourcePath` オブジェクト

`resourcePaths` 配列内の各オブジェクトは、動的アセットのソースを定義します。

| Property | Type | Description |
| --- | --- | --- |
| `path` | `string` | **必須。** ディレクトリへの絶対パス。複数のマッチするディレクトリを監視するために、globパターン（例：`/path/to/plugins/*/assets`）をサポートします。 |
| `whitelist` | `string[]` | オプション。含めるファイル拡張子の配列（例：`['.png', '.svg']`）。指定された場合、これらの拡張子を持つファイルのみが提供されます。 |
| `blacklist` | `string[]` | オプション。除外するファイル拡張子の配列。 |

### `watchOptions` オブジェクト

| Property | Type | Description |
| --- | --- | --- |
| `ignorePatterns` | `string[]` | 監視中に無視する文字列パターンまたは正規表現の配列。 |
| `persistent` | `boolean` | `true` の場合、ファイルが監視されている間、プロセスは実行を続けます。デフォルトは `true` です。 |
| `usePolling` | `boolean` | ファイルの監視にポーリングを使用するかどうか。特定のネットワークファイルシステムで必要になる場合があります。 |
| `depth` | `number` | 監視するサブディレクトリの深さ。`undefined` の場合、再帰的に監視します。 |

### `cacheOptions` オブジェクト

| Property | Type | Description |
| --- | --- | --- |
| `maxAge` | `string` \| `number` | `Cache-Control` の max-age ヘッダーを設定します。ミリ秒単位の数値または `'365d'` のような文字列を指定できます。デフォルトは `'365d'` です。 |
| `immutable` | `boolean` | `true` の場合、`Cache-Control` ヘッダーに `immutable` ディレクティブを追加します。デフォルトは `true` です。 |
| `etag` | `boolean` | ETag生成を有効にするかどうか。 |
| `lastModified` | `boolean` | `Last-Modified` ヘッダーを有効にするかどうか。 |

## 高度な使用方法

### Globパターンの使用

複数のプラグインディレクトリからアセットを提供するには、globパターンを使用できます。ミドルウェアは、一致するすべてのディレクトリを見つけて、それらの変更を監視します。

```javascript Glob Pattern Example icon=mdi:folder-search-outline
const middleware = initDynamicResourceMiddleware({
  resourcePaths: [
    {
      // Watch the 'assets' folder inside every directory under 'plugins'
      path: path.join(__dirname, 'plugins', '*', 'assets'),
      whitelist: ['.css', '.js', '.png'],
    },
  ],
});
```

### 競合解決

監視対象の2つのディレクトリに `logo.png` という名前のファイルが含まれている場合、`conflictResolution` 戦略によってどちらが提供されるかが決まります：

-   `'first-match'` (デフォルト): 初期スキャン中に最初に見つかったものが使用されます。後続で見つかったものは無視されます。
-   `'last-match'`: 最後に見つかったものが以前のエントリを上書きします。これは、オーバーライド機構がある場合に便利です。
-   `'error'`: 競合を示すエラーをコンソールに記録し、通常は first-match の動作が使用されます。

## 戻り値

`initDynamicResourceMiddleware` 関数は、Expressミドルウェア関数を返します。この返された関数には `cleanup` メソッドもアタッチされています。

### `cleanup()`

このメソッドは、サーバーのグレースフルシャットダウン中に呼び出す必要があります。すべてのファイルシステムウォッチャーを停止し、内部リソースマップをクリアして、メモリリークを防ぎ、ファイルハンドルを解放します。

```javascript Cleanup Example icon=mdi:power-plug-off
const server = app.listen(3000);
const dynamicMiddleware = initDynamicResourceMiddleware(/* ...options */);

// ...

function gracefulShutdown() {
  console.log('Shutting down server...');
  if (dynamicMiddleware.cleanup) {
    dynamicMiddleware.cleanup();
  }
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
```