# ユーティリティ関数

`@blocklet/uploader/utils` モジュールは、ファイルの処理、URL の操作、Uppy インスタンスのカスタマイズ、およびネットワーク設定に関連する一般的なタスクを簡素化するために設計されたヘルパー関数のコレクションをエクスポートします。これらのユーティリティは、Uploader コンポーネントによって内部で使用されますが、より高度な統合のためにアプリケーションで使用することもできます。

## ファイルと Blob の操作

これらの関数は、Blob、base64 文字列、File オブジェクトなど、さまざまなファイル形式や表現を扱うのに役立ちます。

| 関数 | 説明 |
| --- | --- |
| `isBlob(file)` | 指定された入力が `Blob` のインスタンスであるかどうかをチェックします。 |
| `getObjectURL(fileBlob)` | `Blob` または `File` オブジェクトからローカルオブジェクト URL (例: `blob:http://...`) を作成します。これはクライアントサイドのプレビューに使用できます。 |
| `blobToFile(blob, fileName)` | `Blob` オブジェクトを `File` オブジェクトに変換し、指定されたファイル名を割り当てます。 |
| `base64ToFile(base64, fileName)` | base64 エンコードされた文字列を `File` オブジェクトに変換します。データ URL の処理に便利です。 |
| `isSvgFile(file)` | ファイルの MIME タイプ、拡張子、および内容を調べて、ファイルが SVG であるかどうかを非同期でチェックします。 |
| `getExt(uppyFile)` | Uppy ファイルオブジェクトからファイル拡張子を抽出します。精度を高めるために、名前と MIME タイプを両方使用します。 |

### 例: Base64 をファイルに変換

```javascript icon=logos:javascript
import { base64ToFile, getObjectURL } from '@blocklet/uploader/utils';

const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...';
const imageFile = base64ToFile(base64Image, 'my-image.png');

// これで、このファイルオブジェクトを使用して、例えばプレビューを作成できます
const previewUrl = getObjectURL(imageFile);
console.log(previewUrl);

// または、Uppy インスタンスに追加します
// uppy.addFile({ name: imageFile.name, type: imageFile.type, data: imageFile });
```

## URL とパスの管理

URL を構築および操作するための関数です。特に Media Kit の CDN やアップローダーのバックエンドエンドポイントとのやり取りに使用します。

| 関数 | 説明 |
| --- | --- |
| `createImageUrl(filename, width, height, overwritePrefixPath)` | Media Kit に保存されている画像の URL を構築します。オンザフライでのリサイズ用のクエリパラメータ (`w`, `h`) を追加できます。 |
| `getDownloadUrl(src)` | Media Kit の画像 URL を受け取り、リサイズパラメータ (`w`, `h`, `q`) を削除して、元のファイルをダウンロードするための URL を作成します。 |
| `getUploaderEndpoint(apiPathProps)` | `Uploader` コンポーネントに渡された props に基づいて、アップローダー (Tus) および Companion エンドポイントの絶対 URL を生成します。 |
| `setPrefixPath(apiPathProps)` | API リクエストに使用される内部プレフィックスパスを設定し、Media Kit のマウントポイントを使用するデフォルトの動作を上書きできます。 |

### 例: リサイズされた画像 URL の生成

```javascript icon=logos:javascript
import { createImageUrl } from '@blocklet/uploader/utils';

// 'photo.jpg' の幅 200px の URL を生成します
const thumbnailUrl = createImageUrl('photo.jpg', 200);
// 結果: https://your-cdn.com/uploads/photo.jpg?imageFilter=resize&w=200

// 同じ画像の幅と高さの両方を指定した URL を生成します
const sizedImageUrl = createImageUrl('photo.jpg', 400, 300);
// 結果: https://your-cdn.com/uploads/photo.jpg?imageFilter=resize&w=400&h=300
```

## Uppy インスタンスの強化

### `initUppy(uppyInstance)`

これは、標準の Uppy コアインスタンスを、Blocklet 環境に合わせて調整されたカスタムメソッド、イベントハンドラ、および改善されたロジックで強化する強力な関数です。`<Uploader />` コンポーネントによって自動的に使用されますが、独自の Uppy インスタンスを作成する場合は手動で使用することもできます。

**主な強化点:**

*   **カスタム成功イベント**: 成功したアップロードを処理するための堅牢なイベントシステムを追加します。
    *   `uppy.onUploadSuccess(file, callback)`: 成功したアップロードをリッスンします。オプションで特定のファイルを指定できます。
    *   `uppy.onceUploadSuccess(file, callback)`: 上記と同じですが、リスナーは一度実行されると削除されます。
    *   `uppy.emitUploadSuccess(file, response)`: 成功イベントを手動でトリガーします。
*   **プログラムによるアップロード**: 簡単なプログラムによるアップロードのための `async` ヘルパーメソッドを追加します。
    *   `uppy.uploadFile(blobFile)`: `Blob` または `File` オブジェクトを受け取り、それを Uppy に追加し、アップロードして、アップロード結果で解決される Promise を返します。
*   **カスタム開閉イベント**: Uploader Dashboard の開閉をリッスンするためのクリーンな方法を提供します。
    *   `uppy.onOpen(callback)` / `uppy.onClose(callback)`
*   **ロジックの改善**: `removeFiles` や `calculateTotalProgress` のようなデフォルトの Uppy メソッドをオーバーライドして、バックエンドとの統合を改善し、より正確な進捗報告を提供します。

### 例: `initUppy` を使用したプログラムによるアップロード

```javascript icon=logos:javascript
import Uppy from '@uppy/core';
import { initUppy } from '@blocklet/uploader/utils';

// 1. 標準の Uppy インスタンスを作成
let uppy = new Uppy();

// 2. カスタムメソッドで強化
uppy = initUppy(uppy);

async function uploadMyFile(fileBlob) {
  try {
    console.log('アップロードを開始しています...');
    const result = await uppy.uploadFile(fileBlob);
    console.log('アップロード成功!', result.response.data.fileUrl);
  } catch (error) {
    console.error('アップロードに失敗しました:', error);
  }
}

// ダミーファイルを作成してアップロード
const myFile = new File(['hello world'], 'hello.txt', { type: 'text/plain' });
uploadMyFile(myFile);
```

## モックとテスト

### `mockUploaderFileResponse(file)`

このユーティリティは、テストや、実際にアップロードすることなく既存のファイルを Uploader の UI に追加する場合に非常に役立ちます。単純なファイルオブジェクトを受け取り、成功した Tus アップロードを模倣した、Uppy と互換性のある完全なレスポンスオブジェクトを生成します。

これにより、Media Kit にすでに保存されているファイルでダッシュボードを埋めることができます。

### 例: 既存のファイルを UI に追加

```javascript icon=logos:javascript
import { mockUploaderFileResponse } from '@blocklet/uploader/utils';

// 'uppy' が初期化された Uppy インスタンスであると仮定します

// 1. 既存のファイルデータを定義
const existingFile = {
  fileUrl: 'https://domain.com/uploads/existing-image.png',
  originalname: 'existing-image.png',
  mimetype: 'image/png',
  size: 12345,
  _id: 'file123',
};

// 2. モックレスポンスを生成
const mockResponse = mockUploaderFileResponse(existingFile);

// 3. ファイルを Uppy の状態に追加し、成功イベントを発生させる
if (mockResponse) {
  uppy.addFile(mockResponse.file);
  uppy.emit('upload-success', mockResponse.file, mockResponse.responseResult);
}
```