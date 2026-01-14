# コンセプト

`@blocklet/uploader` パッケージは、強力で統合しやすいように設計されています。最大限に活用するためには、その機能を支えるコアコンセプトと主要な統合を理解することが役立ちます。このセクションでは、アップローダーの背後にある基盤技術と設計原則について説明します。

`@blocklet/uploader` の中核は、実績のあるオープンソース技術の強固な基盤の上に構築されており、Blocklet エコシステムとのシームレスな統合によって強化されています。以下のコンセプトは、これらすべてがどのように連携して機能するかを理解するための鍵となります。

```d2 High-Level Architecture
direction: down

blocklet-app: {
  label: "あなたの Blocklet アプリケーション"
  shape: rectangle

  uploader-component: {
    label: "Uploader コンポーネント\n(@blocklet/uploader)"
    shape: rectangle

    uppy-ecosystem: {
      label: "Uppy エコシステム"
      shape: rectangle

      uppy-core: {
        label: "Uppy コアインスタンス"
      }

      standard-plugins: {
        label: "標準 Uppy プラグイン"
        shape: rectangle
        Dashboard: {}
        Tus: {}
        Webcam: {}
        Url: {}
      }

      custom-plugins: {
        label: "カスタム Blocklet プラグイン"
        shape: rectangle
        AIImage: {}
        Resources: {}
        Uploaded: {}
      }
    }
  }
}

media-kit: {
  label: "Media Kit Blocklet"
  shape: cylinder
}

blocklet-app.uploader-component.uppy-ecosystem.uppy-core -> blocklet-app.uploader-component.uppy-ecosystem.standard-plugins
blocklet-app.uploader-component.uppy-ecosystem.uppy-core -> blocklet-app.uploader-component.uppy-ecosystem.custom-plugins
blocklet-app.uploader-component <-> media-kit: "設定とプラグインを提供"
```

<x-cards data-columns="3">
  <x-card data-title="Uppyとの統合" data-icon="lucide:puzzle" data-href="/concepts/uppy-integration">
    @blocklet/uploader が、強力でモジュール式の Uppy ライブラリをコアアップロード機能（プラグインアーキテクチャや再開可能なアップロードを含む）にどのように活用しているかを学びます。
  </x-card>
  <x-card data-title="Media Kitとの統合" data-icon="lucide:cloud" data-href="/concepts/media-kit-integration">
    「ゼロコンフィグ」体験を発見してください。Media Kit blocklet が存在する場合、アップローダーは自動的に設定され、強力な新しいプラグインが利用可能になります。
  </x-card>
  <x-card data-title="国際化 (i18n)" data-icon="lucide:languages" data-href="/concepts/i18n">
    組み込みのローカリゼーションサポートを使用して、さまざまな言語や地域に合わせてアップローダーのインターフェースをカスタマイズする方法を理解します。
  </x-card>
</x-cards>

これらのコンセプトを理解することで、特定のニーズに合わせてアップローダーをカスタマイズおよび拡張するのに役立ちます。さらに詳しく知りたい場合は、[Uppyとの統合](./concepts-uppy-integration.md)から始めてください。