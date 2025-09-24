# 创建自定义插件

`@blocklet/uploader` 具有可扩展性设计。虽然它内置了几个强大的插件，但你也可以轻松添加自己的自定义选项卡，以集成独特的工作流、连接到专有服务或提供专门的用户界面。本指南将向你展示如何使用提供的 `VirtualPlugin` 组件创建一个新的插件选项卡。

这种方法允许你将任何 React 组件注入到 Uploader 的仪表板中，为自定义提供了无限的可能性。

## 理解 `VirtualPlugin`

`VirtualPlugin` 是自定义插件的核心。它是一个特殊的 Uppy 插件，作用如同一个空白画布。当你配置它时，Uploader 会在仪表板中创建一个新的选项卡按钮，并提供一个容器元素，供你渲染自己的 React 组件。它简化了从头开始创建新的 Uppy UI 插件的过程。

## 通过 `plugins` 属性进行配置

要添加你的自定义插件，你需要在 `<Uploader />` 组件上配置 `plugins` 属性。该属性接受一个插件配置对象的数组。数组中的每个对象都定义了一个新的选项卡。

以下是自定义插件配置的结构：

```typescript UploaderProps.ts icon=logos:typescript
{
  id: string; // 你的插件的唯一标识符
  options: {
    id: string; // 必须与顶层 id 匹配
    title: string; // 选项卡按钮的文本
    icon?: string | React.ReactNode; // 用于图标的 SVG 字符串或 React 节点
    autoHide?: boolean; // 显示此面板时自动隐藏其他面板
  };
  onShowPanel?: (ref: React.RefObject<any>) => void; // 用于渲染你的组件的回调
}
```

### 关键属性

| Property | Type | Description |
|---|---|---|
| `id` | `string` | 你的插件实例的唯一标识符。这对于 Uppy 管理插件状态至关重要。 |
| `options` | `object` | 直接传递给 `VirtualPlugin` 构造函数的配置。 |
| `options.id` | `string` | 必须与顶层的 `id` 相同。 |
| `options.title` | `string` | 显示在 Uploader UI 中选项卡按钮上的文本。 |
| `options.icon` | `string \| React.ReactNode` | 一个 SVG 字符串或用于选项卡图标的 React 组件。如果是 SVG 字符串，它将使用 `dangerouslySetInnerHTML` 进行渲染。 |
| `onShowPanel` | `(ref) => void` | 自定义插件的核心。当用户点击你的插件选项卡时，此回调函数会触发。它会收到一个指向面板容器 `div` 的 React `RefObject`，你可以在其中渲染你的自定义 UI。 |

## 工作原理

下图说明了用户与自定义插件选项卡交互时的工作流程：

```d2
direction: down

User: {
  shape: c4-person
}

Uploader-UI: {
  label: "Uploader 仪表板"
  shape: rectangle

  Custom-Tab: {
    label: "我的插件选项卡"
  }
  Panel-Container: {
    label: "空面板 Div (ref)"
    style.stroke-dash: 2
  }
}

Your-App: {
  label: "你的应用程序代码"
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

User -> Uploader-UI.Custom-Tab: "1. 点击选项卡"
Uploader-UI.Custom-Tab -> Your-App.Uploader-Component: "2. 触发插件"
Your-App.Uploader-Component -> Your-App.onShowPanel-Callback: "3. 调用回调并传入 ref"
Your-App.onShowPanel-Callback -> Uploader-UI.Panel-Container: "4. ReactDOM 将组件渲染到 ref 中"
Your-App.My-Custom-Panel -> Uploader-UI.Panel-Container: "5. 显示自定义 UI"
```

## 完整示例

让我们创建一个简单的插件，允许根据提示生成图像，类似于 AI 图像生成器。这个例子演示了如何使用 `onShowPanel` 回调将自定义 React 组件渲染到插件的面板中。

首先，定义你的自定义面板组件。该组件将包含你插件的 UI。

```javascript MyCustomPanel.jsx icon=logos:react
import React from 'react';
import ReactDOM from 'react-dom/client';

// 你要渲染在面板中的自定义 UI 组件
function MyCustomPanel({ uppy }) {
  const [prompt, setPrompt] = React.useState('');

  const handleGenerate = () => {
    // 在实际应用中，你会从 API 获取图像
    // 在本例中，我们将使用一个占位符并将其添加到 Uppy
    const mockFile = {
      source: 'MyPlugin',
      name: `${prompt.slice(0, 10)}.png`,
      type: 'image/png',
      data: new Blob(['pretend-image-data'], { type: 'image/png' }), // 模拟文件数据
    };
    uppy.addFile(mockFile);
    uppy.getPlugin('Dashboard').openModal(); // 切换回主仪表板视图
  };

  return (
    <div style={{ padding: '20px' }}>
      <h4>AI 图像生成器</h4>
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="输入一个提示..."
        style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
      />
      <button onClick={handleGenerate} style={{ padding: '8px 16px' }}>
        生成图像
      </button>
    </div>
  );
}

export default MyCustomPanel;
```

接下来，配置 `<Uploader />` 组件以包含你的新插件。你将在 `plugins` 数组中定义该插件，并使用 `onShowPanel` 回调来渲染你的 `MyCustomPanel` 组件。

```javascript Uploader.jsx icon=logos:react
import React from 'react';
import ReactDOM from 'react-dom/client';
import Uploader from '@blocklet/uploader';
import MyCustomPanel from './MyCustomPanel';

// 用于图标的 SVG 字符串
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

在这个例子中，当点击‘AI Image’选项卡时，`onShowPanel` 函数会被执行。它接收 `panelRef` 并使用 `ReactDOM.createRoot` 将 `<MyCustomPanel />` 组件渲染到其中。我们还将 `uppy` 实例传递给我们的自定义组件，以便它能与 Uploader 交互，例如添加一个生成的文件。

## 后续步骤

现在你已经了解了如何使用自定义功能扩展 `@blocklet/uploader`。对于更高级的用例，你可以查阅官方的 [Uppy 插件编写文档](https://uppy.io/docs/writing-plugins/)。

要进一步自定义你的 Uploader，请查看我们 API 参考中的完整属性列表。

<x-card data-title="<Uploader /> 组件属性" data-icon="lucide:component" data-href="/api-reference/uploader/component-props">
浏览所有可用属性，以微调 Uploader 的行为和外观。
</x-card>