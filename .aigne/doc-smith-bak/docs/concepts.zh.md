# 概念

`@blocklet/uploader` 包的设计兼具强大的功能和易于集成的特点。要充分利用它们，了解为其功能提供支持的核心概念和关键集成至关重要。本节探讨了上传器背后的基础技术和设计原则。

`@blocklet/uploader` 的核心是建立在经过验证的可靠开源技术基础之上，并通过与 Blocklet 生态系统的无缝集成得到增强。以下是理解其工作原理的关键概念。

```d2 高级架构
direction: down

blocklet-app: {
  label: "你的 Blocklet 应用"
  shape: rectangle

  uploader-component: {
    label: "上传器组件\n(@blocklet/uploader)"
    shape: rectangle

    uppy-ecosystem: {
      label: "Uppy 生态系统"
      shape: rectangle

      uppy-core: {
        label: "Uppy 核心实例"
      }

      standard-plugins: {
        label: "标准 Uppy 插件"
        shape: rectangle
        Dashboard: {}
        Tus: {}
        Webcam: {}
        Url: {}
      }

      custom-plugins: {
        label: "自定义 Blocklet 插件"
        shape: rectangle
        AIImage: {}
        Resources: {}
        Uploaded: {}
      }
    }
  }
}

media-kit: {
  label: "媒体套件 Blocklet"
  shape: cylinder
}

blocklet-app.uploader-component.uppy-ecosystem.uppy-core -> blocklet-app.uploader-component.uppy-ecosystem.standard-plugins
blocklet-app.uploader-component.uppy-ecosystem.uppy-core -> blocklet-app.uploader-component.uppy-ecosystem.custom-plugins
blocklet-app.uploader-component <-> media-kit: "提供配置和插件"
```

<x-cards data-columns="3">
  <x-card data-title="与 Uppy 集成" data-icon="lucide:puzzle" data-href="/concepts/uppy-integration">
    了解 @blocklet/uploader 如何利用强大、模块化的 Uppy 库来实现其核心上传功能，包括其插件架构和可续传上传。
  </x-card>
  <x-card data-title="与媒体套件集成" data-icon="lucide:cloud" data-href="/concepts/media-kit-integration">
    探索“零配置”体验。当存在媒体套件 Blocklet 时，上传器会自动配置自身并获得强大的新插件。
  </x-card>
  <x-card data-title="国际化 (i18n)" data-icon="lucide:languages" data-href="/concepts/i18n">
    了解如何使用内置的本地化支持为不同语言和地区自定义上传器的界面。
  </x-card>
</x-cards>

理解这些概念将帮助你根据特定需求自定义和扩展上传器。要深入了解，请从探索[与 Uppy 集成](./concepts-uppy-integration.md)开始。