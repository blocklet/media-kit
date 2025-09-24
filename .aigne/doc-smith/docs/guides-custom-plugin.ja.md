# カスタムプラグインの作成

`@blocklet/uploader`は拡張性を考慮して設計されています。いくつかの強力な組み込みプラグインが付属していますが、独自のカスタムタブを簡単に追加して、ユニークなワークフローを統合したり、プロプライエタリなサービスに接続したり、特化したユーザーインターフェースを提供したりすることができます。このガイドでは、提供されている`VirtualPlugin`コンポーネントを使用して新しいプラグインタブを作成する方法を説明します。

このアプローチにより、任意のReactコンポーネントをUploaderのダッシュボードに注入でき、カスタマイズの無限の可能性が広がります。

## `VirtualPlugin`を理解する

カスタムプラグインの中心にあるのが`VirtualPlugin`です。これは空白のキャンバスとして機能する特別なUppyプラグインです。これを設定すると、Uploaderはダッシュボードに新しいタブボタンを作成し、独自のReactコンポーネントをレンダリングするためのコンテナ要素を提供します。これにより、新しいUppy UIプラグインをゼロから作成するプロセスが簡素化されます。

## `plugins`プロップによる設定

カスタムプラグインを追加するには、`<Uploader />`コンポーネントの`plugins`プロップを設定します。このプロップは、プラグイン設定オブジェクトの配列を受け入れます。配列内の各オブジェクトが新しいタブを定義します。

カスタムプラグイン設定の構造は次のとおりです：

```typescript UploaderProps.ts icon=logos:typescript
{
  id: string; // A unique identifier for your plugin
  options: {
    id: string; // Must match the top-level id
    title: string; // The text for the tab button
    icon?: string | React.ReactNode; // SVG string or React node for the icon
    autoHide?: boolean; // Automatically hide other panels when this one is shown
  };
  onShowPanel?: (ref: React.RefObject<any>) => void; // Callback to render your component
}
```

### 主要なプロパティ

| Property | Type | Description |
|---|---|---|
| `id` | `string` | プラグインインスタンスの一意の識別子。Uppyがプラグインの状態を管理するために重要です。 |
| `options` | `object` | `VirtualPlugin`コンストラクタに直接渡される設定。 |
| `options.id` | `string` | トップレベルの`id`と同じでなければなりません。 |
| `options.title` | `string` | Uploader UIのタブボタンに表示されるテキスト。 |
| `options.icon` | `string \| React.ReactNode` | タブアイコン用のSVG文字列またはReactコンポーネント。SVG文字列の場合、`dangerouslySetInnerHTML`を使用してレンダリングされます。 |
| `onShowPanel` | `(ref) => void` | カスタムプラグインの中核。このコールバック関数は、ユーザーがプラグインのタブをクリックしたときに発火します。パネルのコンテナ`div`を指すReactの`RefObject`を受け取り、その中にカスタムUIをレンダリングできます。 |

## 仕組み

次の図は、ユーザーがカスタムプラグインタブを操作するときのワークフローを示しています：

```d2
direction: down

User: {
  shape: c4-person
}

Uploader-UI: {
  label: "Uploader ダッシュボード"
  shape: rectangle

  Custom-Tab: {
    label: "マイプラグインタブ"
  }
  Panel-Container: {
    label: "空のパネルDiv (ref)"
    style.stroke-dash: 2
  }
}

Your-App: {
  label: "あなたのアプリケーションコード"
  shape: rectangle
  Uploader-Component: {
    label: "<Uploader plugins={...} />"
  }
  onShowPanel-Callback: {
    label: "onShowPanel(ref)"
  }
  My-Custom-Panel: {
    label: "<MyCustomPanel />"
  }
}

User -> Uploader-UI.Custom-Tab: "1. タブをクリック"
Uploader-UI.Custom-Tab -> Your-App.Uploader-Component: "2. プラグインをトリガー"
Your-App.Uploader-Component -> Your-App.onShowPanel-Callback: "3. ref付きでコールバックを呼び出す"
Your-App.onShowPanel-Callback -> Uploader-UI.Panel-Container: "4. ReactDOMがコンポーネントをrefにレンダリング"
Your-App.My-Custom-Panel -> Uploader-UI.Panel-Container: "5. カスタムUIが表示される"
```

## 完全な例

AI画像ジェネレータのように、プロンプトから画像を生成できる簡単なプラグインを作成してみましょう。この例では、`onShowPanel`コールバックを使用して、プラグインのパネルにカスタムReactコンポーネントをレンダリングする方法を示します。

まず、カスタムパネルコンポーネントを定義します。このコンポーネントには、プラグインのUIが含まれます。

```javascript MyCustomPanel.jsx icon=logos:react
import React from 'react';
import ReactDOM from 'react-dom/client';

// パネルにレンダリングされるカスタムUIコンポーネント
function MyCustomPanel({ uppy }) {
  const [prompt, setPrompt] = React.useState('');

  const handleGenerate = () => {
    // 実際のアプリでは、APIから画像を取得します
    // この例では、プレースホルダーを使用してUppyに追加します
    const mockFile = {
      source: 'MyPlugin',
      name: `${prompt.slice(0, 10)}.png`,
      type: 'image/png',
      data: new Blob(['pretend-image-data'], { type: 'image/png' }), // モックファイルデータ
    };
    uppy.addFile(mockFile);
    uppy.getPlugin('Dashboard').openModal(); // メインのダッシュボードビューに戻る
  };

  return (
    <div style={{ padding: '20px' }}>
      <h4>AI Image Generator</h4>
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter a prompt..."
        style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
      />
      <button onClick={handleGenerate} style={{ padding: '8px 16px' }}>
        Generate Image
      </button>
    </div>
  );
}

export default MyCustomPanel;
```

次に、`<Uploader />`コンポーネントを設定して、新しいプラグインを含めます。`plugins`配列でプラグインを定義し、`onShowPanel`コールバックを使用して`MyCustomPanel`コンポーネントをレンダリングします。

```javascript Uploader.jsx icon=logos:react
import React from 'react';
import ReactDOM from 'react-dom/client';
import Uploader from '@blocklet/uploader';
import MyCustomPanel from './MyCustomPanel';

// アイコン用のSVG文字列
const customIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 1.9a2.5 2.5 0 0 0 0 3.54l1.9 1.9"/><path d="m12 21 1.9-1.9a2.5 2.5 0 0 0 0-3.54l-1.9-1.9"/><path d="M3 12h18"/><path d="m3 12 1.9 1.9a2.5 2.5 0 0 0 3.54 0l1.9-1.9"/><path d="m21 12-1.9-1.9a2.5 2.5 0 0 0-3.54 0l-1.9 1.9"/></svg>`;

function App() {
  const uploaderRef = React.useRef(null);

  const customPlugins = [
    {
      id: 'MyCustomPlugin',
      options: {
        id: 'MyCustomPlugin',
        title: 'AI Image',
        icon: customIcon,
      },
      onShowPanel: (panelRef) => {
        if (panelRef.current) {
          const uppy = uploaderRef.current?.uppy;
          const root = ReactDOM.createRoot(panelRef.current);
          root.render(<MyCustomPanel uppy={uppy} />);
        }
      },
    },
  ];

  return <Uploader ref={uploaderRef} plugins={customPlugins} />;
}

export default App;
```

この例では、「AI Image」タブがクリックされると、`onShowPanel`関数が実行されます。これは`panelRef`を受け取り、`ReactDOM.createRoot`を使用してその中に`<MyCustomPanel />`コンポーネントをレンダリングします。また、生成されたファイルを追加するなど、Uploaderと対話できるように、`uppy`インスタンスをカスタムコンポーネントに渡します。

## 次のステップ

これで、`@blocklet/uploader`をカスタム機能で拡張する方法がわかりました。より高度なユースケースについては、公式の[Uppyプラグイン作成ドキュメント](https://uppy.io/docs/writing-plugins/)を参照してください。

Uploaderをさらにカスタマイズするには、APIリファレンスでプロップの全リストを確認してください。

<x-card data-title="<Uploader /> コンポーネントのプロップ" data-icon="lucide:component" data-href="/api-reference/uploader/component-props">
Uploaderの動作と外観を微調整するために利用可能なすべてのプロップを調べてください。
</x-card>