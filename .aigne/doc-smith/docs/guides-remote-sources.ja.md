# リモートソースの統合 (Companion)

ユーザーが直接のURLやUnsplashのようなサービスなどの外部ソースからファイルをインポートできるようにするには、バックエンドにUppyのCompanionサービスをセットアップする必要があります。`@blocklet/uploader-server` パッケージは、このプロセスを簡素化する便利な `initCompanion` 関数を提供します。

Companionはサーバーサイドのプロキシとして機能します。ユーザーに代わってリモートプロバイダーからファイルを取得し、それをフロントエンドのアップローダーコンポーネントにストリーミングします。その後、通常のアップロードプロセスが進行します。基本的なファイルのアップロードはカスタムバックエンドなしで処理できますが、リモートソースを有効にするには `@blocklet/uploader-server` パッケージのセットアップが必要です。

### 仕組み

次の図は、ユーザーがリモートソースからファイルをインポートするときのデータフローを示しています：

```d2 リモートソース統合フロー
direction: down

User: {
  shape: c4-person
}

Frontend: {
  label: "フロントエンド (ブラウザ)"
  shape: rectangle

  Uploader-Component: {
    label: "Uploaderコンポーネント"
    shape: rectangle
  }
}

Backend: {
  label: "バックエンドサーバー"
  shape: rectangle

  Companion-Middleware: {
    label: "Companionミドルウェア\n(@blocklet/uploader-server)"
  }

  Local-Storage-Middleware: {
    label: "ローカルストレージミドルウェア"
    shape: rectangle
  }
}

Remote-Source: {
  label: "リモートソース\n(例: Unsplash, URL)"
  shape: cylinder
}

User -> Frontend.Uploader-Component: "1. ファイルを選択"
Frontend.Uploader-Component -> Backend.Companion-Middleware: "2. ファイルをリクエスト"
Backend.Companion-Middleware -> Remote-Source: "3. ファイルを取得"
Remote-Source -> Backend.Companion-Middleware: "4. ファイルデータをストリーム"
Backend.Companion-Middleware -> Frontend.Uploader-Component: "5. ブラウザに戻す"
Frontend.Uploader-Component -> Backend.Local-Storage-Middleware: "6. ファイルをアップロード"
```

## ステップ1: バックエンドミドルウェアの設定

まず、blockletのバックエンドExpressサーバーでCompanionミドルウェアを初期化してマウントする必要があります。これには `initCompanion` を呼び出してルーターに追加することが含まれます。

```javascript Server-side Companion Setup icon=logos:nodejs
import express from 'express';
import { initCompanion } from '@blocklet/uploader-server';

const router = express.Router();

// リモートソース用のCompanionミドルウェア
const companion = initCompanion({
  path: env.uploadDir, // ファイル処理用の一時ディレクトリ
  express,
  providerOptions: {
    // ここでプロバイダーを設定します。例: Unsplash
    unsplash: {
      key: process.env.UNSPLASH_KEY,
      secret: process.env.UNSPLASH_SECRET,
    },
  },
  uploadUrls: [env.appUrl], // あなたのblockletの公開URL
});

// 特定のルートにcompanionハンドラーをマウントします
router.use('/companion', companion.handle);
```

### `initCompanion` のオプション

| Option | Type | Description |
| :--- | :--- | :--- |
| `path` | `string` | **必須。** 転送中にCompanionがファイルを一時的に保存するサーバー上のディレクトリ。 |
| `express` | `Function` | **必須。** Expressアプリのインスタンス。 |
| `providerOptions` | `Object` | オプション。リモートプロバイダーの設定。例えば、Unsplashを有効にするには、APIキーとシークレットを提供します。プロバイダーとそのオプションの完全なリストについては、[Uppy Companionの公式ドキュメント](https://uppy.io/docs/companion/providers/) を参照してください。 |
| `uploadUrls` | `string[]` | オプションですが、セキュリティのために強く推奨されます。フロントエンドのアップローダーが実行されているURLの配列。これにより、他の人があなたのCompanionインスタンスを使用するのを防ぎます。 |

## ステップ2: フロントエンドコンポーネントの設定

バックエンドを設定した後、フロントエンドの `<Uploader />` コンポーネントをCompanionインスタンスと通信するように設定する必要があります。これは `apiPathProps` プロパティでルートを指定し、目的のプラグインを有効にすることで行います。

```jsx Uploader Component with Companion icon=logos:react
import { Uploader } from '@blocklet/uploader';

function MyUploaderComponent() {
  return (
    <Uploader
      popup
      apiPathProps={{
        // このパスはバックエンドのルートと一致する必要があります
        companion: '/api/companion',
        // 最終的なアップロードのためのuploaderパス
        uploader: '/api/uploads',
      }}
      plugins={[
        'Url', // 直接URLからのインポートを有効にします
        'Unsplash', // Unsplashからのインポートを有効にします
        'Webcam',
      ]}
    />
  );
}
```

バックエンドミドルウェアとフロントエンドコンポーネントの両方が設定されると、Uploaderのダッシュボードに「Link」(URL) と「Unsplash」のタブが表示され、ユーザーはこれらのソースから直接ファイルをインポートできるようになります。

---

ローカルソースとリモートソースの両方からのアップロードを処理できるようになったので、アップローダーの機能をさらに拡張したいと思うかもしれません。次のガイドで、Uploaderインターフェースに独自のカスタムタブを追加する方法を学びましょう。

<x-card data-title="カスタムプラグインの作成" data-icon="lucide:puzzle" data-href="/guides/custom-plugin" data-cta="続きを読む">
  提供されているVirtualPluginコンポーネントを使用して、独自のカスタムプラグインタブを作成し、Uploaderの機能を拡張します。
</x-card>