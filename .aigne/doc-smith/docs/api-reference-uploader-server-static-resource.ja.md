# initStaticResourceMiddleware(options)

`initStaticResourceMiddleware`は、インストール済みの他のblockletから静的アセットを配信するために設計された、強力なExpressミドルウェアです。これにより、アプリケーションは、ファイルシステム上の正確な場所を知らなくても、依存するコンポーネントから画像、スタイルシート、フォントなどの共有リソースにアクセスできるようになります。

このミドルウェアは、指定されたリソースタイプに一致するインストール済みのblockletのディレクトリをスキャンし、利用可能なファイルのインメモリマップを作成することで機能します。リクエストが来た際には、このマップで効率的にファイルを検索し、配信します。

### 仕組み

以下に、プロセスの概要を示します：

```d2
direction: down

Browser: {
  shape: c4-person
  label: "ユーザーのブラウザ"
}

Your-Blocklet: {
  label: "あなたのBlocklet"
  shape: rectangle

  Express-Server: {
    label: "Expressサーバー"
  }

  Static-Middleware: {
    label: "initStaticResourceMiddleware"
  }
}

Dependent-Blocklets: {
    label: "依存Blocklet"
    shape: rectangle
    style.stroke-dash: 2
    grid-columns: 2

    Image-Bin: {
        label: "Image Bin Blocklet"
        shape: cylinder
        imgpack: {
            label: "imgpack/"
            "logo.png"
        }
    }

    Theme-Blocklet: {
        label: "テーマBlocklet"
        shape: rectangle
        assets: {
            label: "assets/"
            "style.css"
        }
    }
}

Your-Blocklet.Express-Server -> Your-Blocklet.Static-Middleware: "1. 設定で初期化"
Your-Blocklet.Static-Middleware -> Dependent-Blocklets: "2. リソースをスキャン"
Browser -> Your-Blocklet.Express-Server: "3. GET /logo.png"
Your-Blocklet.Static-Middleware -> Browser: "4. Image Binからファイルを配信"

```

### 使用方法

このミドルウェアを使用するには、インポートしてExpressアプリケーションに追加します。どのリソースタイプを検索するかを設定する必要があります。

```javascript server.js icon=logos:express
import express from 'express';
import { initStaticResourceMiddleware } from '@blocklet/uploader-server';

const app = express();

// 'imgpack'タイプのリソースを配信するためにミドルウェアを初期化
// それを提供するインストール済みの任意のblockletから
app.use(
  initStaticResourceMiddleware({
    express,
    resourceTypes: ['imgpack'], // 文字列を使用したシンプルな設定
  })
);

app.listen(3000, () => {
  console.log('サーバーはhttp://localhost:3000で実行中です');
});
```

この例では、他のインストール済みblockletの`blocklet.yml`に`imgpack`タイプのリソースのエントリがある場合、そのリソースのディレクトリ内のすべてのファイルが配信されます。例えば、`/example.png`へのリクエストは、そのblockletから`example.png`ファイルを配信します。

### オプション

`initStaticResourceMiddleware`関数は、以下のプロパティを持つ設定オブジェクトを受け入れます：

| Option | Type | Description |
| --- | --- | --- |
| `express` | `object` | **必須**。Expressアプリケーションのインスタンス。 |
| `resourceTypes` | `(string \| ResourceType)[]` | **必須**。スキャンするリソースタイプを定義する配列。詳細は後述の`ResourceType`オブジェクトを参照してください。 |
| `options` | `object` | オプション。内部の`serve-static`ハンドラに渡される設定オブジェクト。一般的なプロパティには、キャッシュヘッダーを制御するための`maxAge`（例：'365d'）や`immutable`（例：`true`）が含まれます。 |
| `skipRunningCheck` | `boolean` | オプション。`true`の場合、ミドルウェアはインストール済みだが現在実行されていないblockletもスキャンします。デフォルトは`false`です。 |

### `ResourceType`オブジェクト

より詳細な制御を行うには、`resourceTypes`オプションに単純な文字列の代わりにオブジェクトの配列を指定できます。各オブジェクトは以下のプロパティを持つことができます：

| Property | Type | Description |
| --- | --- | --- |
| `type` | `string` | **必須**。リソースタイプの名前。依存するblockletの`blocklet.yml`で定義されたタイプと一致する必要があります。 |
| `did` | `string` | **必須**。リソースを提供するblockletコンポーネントのDID。標準のMedia Kitには`ImageBinDid`を使用できます。 |
| `folder` | `string \| string[]` | オプション。スキャン対象となるリソースディレクトリ内の特定のサブフォルダ、またはサブフォルダの配列。デフォルトはリソースディレクトリのルート（`''`）です。 |
| `whitelist` | `string[]` | オプション。含めるファイル拡張子の配列（例：`['.png', '.jpg']`）。指定した場合、これらの拡張子を持つファイルのみが配信されます。 |
| `blacklist` | `string[]` | オプション。除外するファイル拡張子の配列（例：`['.md', '.txt']`）。 |
| `setHeaders` | `(res, path, stat) => void` | オプション。配信されるファイルにカスタムレスポンスヘッダーを設定するための関数。 |
| `immutable` | `boolean` | オプション。この特定のリソースタイプに対してトップレベルの`options.immutable`を上書きし、`Cache-Control`ヘッダーを制御します。 |
| `maxAge` | `string` | オプション。この特定のリソースタイプに対してトップレベルの`options.maxAge`を上書きします。 |

### 高度な例

この例では、特定のルールを持つ2つの異なるタイプのリソースを配信する、より複雑な設定を示します。

```javascript server.js icon=logos:express
import express from 'express';
import { initStaticResourceMiddleware } from '@blocklet/uploader-server';
import { ImageBinDid } from '@blocklet/uploader-server/constants';

const app = express();

app.use(
  initStaticResourceMiddleware({
    express,
    skipRunningCheck: true,
    resourceTypes: [
      {
        type: 'imgpack',
        did: ImageBinDid,
        folder: 'public/images',
        whitelist: ['.png', '.jpg', '.gif'],
      },
      {
        type: 'theme-assets',
        did: 'z2q...someThemeBlockletDid', // 特定のテーマblockletのDID
        folder: ['css', 'fonts'],
        blacklist: ['.map'],
      },
    ],
    options: {
      maxAge: '7d', // デフォルトのキャッシュは7日間
    },
  })
);

app.listen(3000);
```

この設定は、以下の処理を行います：
1.  Media Kit（`ImageBinDid`）によって提供される`imgpack`リソースをスキャンしますが、`public/images`サブフォルダ内のみを対象とし、`.png`、`.jpg`、`.gif`ファイルのみを配信します。
2.  特定のDIDを持つblockletから`theme-assets`リソースをスキャンし、`css`と`fonts`の両方のサブフォルダを検索し、ソースマップ（`.map`）ファイルを無視します。
3.  一致したすべてのファイルに対して、デフォルトの`Cache-Control`のmax-ageを7日間に設定します。

### 自動更新

このミドルウェアは動的な環境向けに設計されています。blockletのライフサイクルイベントを自動的にリッスンします。コンポーネントが追加、削除、開始、停止、または更新されると、ミドルウェアは自動的に再スキャンして内部のリソースマップを更新するため、アプリケーションを再起動する必要はありません。

---

次に、アプリケーションの再起動を必要とせずに、リアルタイムで更新可能なディレクトリからファイルを配信する方法を学びます。

<x-card data-title="initDynamicResourceMiddleware(options)" data-icon="lucide:file-diff" data-href="/api-reference/uploader-server/dynamic-resource" data-cta="続きを読む">
リアルタイムのファイル監視をサポートし、指定されたディレクトリから動的リソースを配信するためのAPIリファレンス。
</x-card>