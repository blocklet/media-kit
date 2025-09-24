# Media Kitとの連携

`@blocklet/uploader`パッケージは、**Media Kit** blockletとのシームレスでゼロコンフィギュレーションの連携を実現するために設計されています。Media Kitは、メディアの保存、管理、処理のための一元化されたサービスを提供します。Uploaderコンポーネントが同じ環境にMedia Kitがインストールされていることを検出すると、開発者による追加の設定なしに自動的にその機能を強化します。

この自動連携により、ファイルストレージが一元化され、すべてのblockletで一貫したアップロードルールが適用され、AI画像生成のような高度な機能が動的に有効になります。この動作は、効率的な体験のためにデフォルトで有効になっていますが、独自のblockletのバックエンド内でアップロードを処理する必要がある場合は、オプトアウトすることもできます。

## 仕組み：自動検出と設定

連携プロセスは完全に自動化されており、コンポーネントの初期化時に簡単な2段階のプロセスに従います：

1.  **検出**: `Uploader`コンポーネントは、Media Kitの固有DID（`z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9`）を持つインストール済みのblockletを環境内でスキャンします。

2.  **設定**: Media Kitが見つかると、Uploaderはその`/api/uploader/status`エンドポイントにAPIリクエストを送信します。このエンドポイントは、以下の情報を含む設定オブジェクトを返します：
    *   **アップロード制限**: Media Kitで一元管理される`maxFileSize`や`allowedFileTypes`などのグローバルルール。
    *   **利用可能なプラグイン**: どの高度なプラグイン（例：`AIImage`、`Resources`、`Uploaded`）が有効で、UploaderのUIに表示されるべきかを示すマップ。
    *   **APIエンドポイント**: Uploaderは、すべてのファイルアップロードと関連APIコールをMedia Kitのサービスにルーティングするように自動設定し、すべてのメディアが一元的に保存されるようにします。

以下の図は、この自動設定フローを示しています：

```d2
direction: down

blocklet-app: {
  label: "あなたのBlockletアプリケーション"
  shape: rectangle

  uploader-component: {
    label: "Uploaderコンポーネント"
    shape: rectangle
  }
}

media-kit: {
  label: "Media Kit Blocklet"
  shape: rectangle

  config-api: {
    label: "設定API\n(/api/uploader/status)"
  }

  upload-service: {
    label: "アップロードサービス\n(/api/uploads)"
  }

  storage: {
    label: "一元化ストレージ"
    shape: cylinder
  }

  config-api -> storage
  upload-service -> storage
}

blocklet-app.uploader-component -> media-kit: "1. DID経由で存在を検出"
blocklet-app.uploader-component -> media-kit.config-api: "2. 設定を取得\n(制限、プラグイン)"
media-kit.config-api -> blocklet-app.uploader-component: "3. 設定を返す"
blocklet-app.uploader-component -> media-kit.upload-service: "4. アップロードリクエストを転送"
```

## 主な利点

Media Kitとの連携は、追加の開発作業なしにいくつかの強力な利点を提供します。

<x-cards data-columns="2">
  <x-card data-title="一元化されたメディア管理" data-icon="lucide:library">
    アップロードされたすべてのファイルはMedia Kit内で保存・管理され、複数のblockletにまたがるメディア資産の単一の情報源を構築します。`Resources`および`Uploaded`プラグインにより、ユーザーは既存の資産を簡単に閲覧し、再利用できます。
  </x-card>
  <x-card data-title="動的な機能プラグイン" data-icon="lucide:puzzle">
    AI画像生成プラグインのような高度な機能は、Media Kitでその機能がオンになっている場合に自動的に有効になります。これにより、アプリケーションはコードの変更なしに新機能を追加できます。
  </x-card>
  <x-card data-title="一貫したアップロードルール" data-icon="lucide:file-check-2">
    アップロード制限はMedia Kitで一度定義され、Uploaderのすべてのインスタンスに自動的に適用されるため、一貫性が確保され、ポリシー管理が簡素化されます。
  </x-card>
  <x-card data-title="バックエンド設定不要" data-icon="lucide:server-off">
    Media Kitはファイル処理と保存に必要なバックエンドサービスを提供するため、独自のblockletに`@blocklet/uploader-server`をインストールしたり設定したりする必要がなく、複雑さを軽減します。
  </x-card>
</x-cards>

## オプトアウト：連携の無効化

独自のバックエンドロジックとストレージ（`@blocklet/uploader-server`を使用）でアップロードを管理する必要があるシナリオでは、Media Kitとの自動連携を無効にできます。これは、`Uploader`コンポーネントの`apiPathProps`オブジェクトに特定のpropsを渡すことで行います。

-   `disableMediaKitStatus`: `true`に設定すると、UploaderがMedia Kitから設定（制限とプラグイン）を取得するのを防ぎます。
-   `disableMediaKitPrefix`: `true`に設定すると、UploaderがAPIリクエストをMedia Kitのエンドポイントにルーティングするのを防ぎます。代わりに、現在のblockletのプレフィックスを使用します。

```jsx Uploader with Media Kit Integration Disabled icon=logos:react
import { Uploader } from '@blocklet/uploader/react';

export default function MyComponent() {
  return (
    <Uploader
      popup
      apiPathProps={{
        // Media Kitからのリモート設定の取得を防止
        disableMediaKitStatus: true,
        // Media KitへのAPIコールのルーティングを防止
        disableMediaKitPrefix: true,
      }}
      // ここで独自の制限を提供する必要があります
      // そして@blocklet/uploader-serverで独自のバックエンドを設定します。
      coreProps={{
        restrictions: {
          maxFileSize: 1024 * 1024 * 5, // 5MB
          allowedFileTypes: ['image/jpeg', 'image/png'],
        },
      }}
    />
  );
}
```

これらのプロパティを設定することで、`Uploader`コンポーネントはスタンドアロンモードで動作し、自身のpropsとアプリケーション内で設定されたバックエンドサービスに完全に依存します。詳細については、[バックエンド設定](./getting-started-backend-setup.md)ガイドをご覧ください。