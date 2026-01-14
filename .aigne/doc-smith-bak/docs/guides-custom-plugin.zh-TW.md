# 建立自訂外掛

`@blocklet/uploader` 的設計具有可擴充性。雖然它內建了幾個強大的外掛，但您可以輕鬆地新增自己的自訂分頁，以整合獨特的工作流程、連接到專有服務或提供專門的使用者介面。本指南將向您展示如何使用提供的 `VirtualPlugin` 元件建立一個新的外掛分頁。

這種方法允許您將任何 React 元件注入到 Uploader 的儀表板中，為客製化開啟了無限的可能性。

## 理解 `VirtualPlugin`

自訂外掛的核心是 `VirtualPlugin`。它是一個特殊的 Uppy 外掛，作用就像一塊空白畫布。當您設定它時，Uploader 會在儀表板中建立一個新的分頁按鈕，並提供一個容器元素供您渲染自己的 React 元件。它簡化了從頭開始建立一個新的 Uppy UI 外掛的過程。

## 透過 `plugins` Prop 進行設定

要新增您的自訂外掛，您需要在 `<Uploader />` 元件上設定 `plugins` prop。這個 prop 接受一個外掛設定物件的陣列。陣列中的每個物件都定義了一個新的分頁。

以下是自訂外掛設定的結構：

```typescript UploaderProps.ts icon=logos:typescript
{
  id: string; // 您的外掛的唯一識別碼
  options: {
    id: string; // 必須與頂層 id 相符
    title: string; // 分頁按鈕的文字
    icon?: string | React.ReactNode; // SVG 字串或 React 節點作為圖示
    autoHide?: boolean; // 顯示此面板時自動隱藏其他面板
  };
  onShowPanel?: (ref: React.RefObject<any>) => void; // 用於渲染您元件的回呼函式
}
```

### 關鍵屬性

| Property | Type | Description |
|---|---|---|
| `id` | `string` | 您的外掛實例的唯一識別碼。這對於 Uppy 管理外掛的狀態至關重要。 |
| `options` | `object` | 直接傳遞給 `VirtualPlugin` 建構函式的設定。 |
| `options.id` | `string` | 必須與頂層的 `id` 相同。 |
| `options.title` | `string` | 顯示在 Uploader UI 中分頁按鈕上的文字。 |
| `options.icon` | `string \| React.ReactNode` | 用於分頁圖示的 SVG 字串或 React 元件。若是 SVG 字串，將使用 `dangerouslySetInnerHTML` 進行渲染。 |
| `onShowPanel` | `(ref) => void` | 自訂外掛的核心。當使用者點擊您的外掛分頁時，此回呼函式會觸發。它會收到一個指向面板容器 `div` 的 React `RefObject`，您可以在其中渲染您的自訂 UI。 |

## 運作方式

下圖說明了當使用者與自訂外掛分頁互動時的工作流程：

```d2
direction: down

User: {
  shape: c4-person
}

Uploader-UI: {
  label: "Uploader 儀表板"
  shape: rectangle

  Custom-Tab: {
    label: "我的外掛分頁"
  }
  Panel-Container: {
    label: "空的面板 Div (ref)"
    style.stroke-dash: 2
  }
}

Your-App: {
  label: "您的應用程式碼"
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

User -> Uploader-UI.Custom-Tab: "1. 點擊分頁"
Uploader-UI.Custom-Tab -> Your-App.Uploader-Component: "2. 觸發外掛"
Your-App.Uploader-Component -> Your-App.onShowPanel-Callback: "3. 帶 ref 調用回呼函式"
Your-App.onShowPanel-Callback -> Uploader-UI.Panel-Container: "4. ReactDOM 將元件渲染到 ref 中"
Your-App.My-Custom-Panel -> Uploader-UI.Panel-Container: "5. 顯示自訂 UI"
```

## 完整範例

讓我們建立一個簡單的外掛，允許從提示詞生成圖片，類似於 AI 圖片生成器。這個範例展示了如何使用 `onShowPanel` 回呼函式將自訂 React 元件渲染到外掛的面板中。

首先，定義您的自訂面板元件。此元件將包含您外掛的 UI。

```javascript MyCustomPanel.jsx icon=logos:react
import React from 'react';
import ReactDOM from 'react-dom/client';

// 您要在面板中渲染的自訂 UI 元件
function MyCustomPanel({ uppy }) {
  const [prompt, setPrompt] = React.useState('');

  const handleGenerate = () => {
    // 在實際應用中，您會從 API 取得圖片
    // 在此範例中，我們將使用一個佔位符並將其添加到 Uppy
    const mockFile = {
      source: 'MyPlugin',
      name: `${prompt.slice(0, 10)}.png`,
      type: 'image/png',
      data: new Blob(['pretend-image-data'], { type: 'image/png' }), // 模擬檔案資料
    };
    uppy.addFile(mockFile);
    uppy.getPlugin('Dashboard').openModal(); // 切換回主儀表板視圖
  };

  return (
    <div style={{ padding: '20px' }}>
      <h4>AI 圖片生成器</h4>
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="輸入提示詞..."
        style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
      />
      <button onClick={handleGenerate} style={{ padding: '8px 16px' }}>
        生成圖片
      </button>
    </div>
  );
}

export default MyCustomPanel;
```

接下來，設定 `<Uploader />` 元件以包含您的新外掛。您將在 `plugins` 陣列中定義外掛，並使用 `onShowPanel` 回呼函式來渲染您的 `MyCustomPanel` 元件。

```javascript Uploader.jsx icon=logos:react
import React from 'react';
import ReactDOM from 'react-dom/client';
import Uploader from '@blocklet/uploader';
import MyCustomPanel from './MyCustomPanel';

// 用於圖示的 SVG 字串
const customIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 1.9a2.5 2.5 0 0 0 0 3.54l1.9 1.9"/><path d="m12 21 1.9-1.9a2.5 2.5 0 0 0 0-3.54l-1.9-1.9"/><path d="M3 12h18"/><path d="m3 12 1.9 1.9a2.5 2.5 0 0 0 3.54 0l1.9-1.9"/><path d="m21 12-1.9-1.9a2.5 2.5 0 0 0-3.54 0l-1.9 1.9"/></svg>`;

function App() {
  const uploaderRef = React.useRef(null);

  const customPlugins = [
    {
      id: 'MyCustomPlugin',
      options: {
        id: 'MyCustomPlugin',
        title: 'AI 圖片',
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

在此範例中，當點擊「AI 圖片」分頁時，`onShowPanel` 函式會被執行。它接收 `panelRef` 並使用 `ReactDOM.createRoot` 將 `<MyCustomPanel />` 元件渲染到其中。我們也將 `uppy` 實例傳遞給我們的自訂元件，以便它可以與 Uploader 互動，例如，新增一個生成的檔案。

## 後續步驟

您現在已經了解如何透過自訂功能來擴充 `@blocklet/uploader`。對於更進階的使用案例，您可以探索官方的 [Uppy 編寫外掛文件](https://uppy.io/docs/writing-plugins/)。

要進一步客製化您的 Uploader，請查閱我們 API 參考中的完整 props 列表。

<x-card data-title="<Uploader /> 元件 Props" data-icon="lucide:component" data-href="/api-reference/uploader/component-props">
探索所有可用的 props，以微調 Uploader 的行為和外觀。
</x-card>