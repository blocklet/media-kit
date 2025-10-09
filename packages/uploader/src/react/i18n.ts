// @ts-ignore
import zh_CN from '@uppy/locales/lib/zh_CN';
// @ts-ignore
import en_US from '@uppy/locales/lib/en_US';
// @ts-ignore
import ja_JP from '@uppy/locales/lib/ja_JP';
// @ts-ignore
import zh_TW from '@uppy/locales/lib/zh_TW';
import merge from 'lodash/merge';

export default {
  zh: merge(
    { ...zh_CN }, // deep clone
    {
      strings: {
        // ai image
        aiKitRequired: '请先安装并配置 AI Kit',
        aiImageSelectedUse: '使用已选择的图片',
        aiImageSelectedTip: '请选择心仪的图片',
        aiImagePrompt: '提示词',
        aiImagePromptTip: '请输入提示词',
        aiImageSize: '图片尺寸',
        aiImageModel: '图片模型',
        aiImageNumber: '生成数量',
        aiImageGenerate: '生成图片',
        aiImageGenerating: '正在生成图片...',
        // hacker add browseFolders
        browse: '浏览',
        browseFiles: '浏览文件',
        browseFolders: '浏览文件夹',
        dropHereOr: '拖拽文件到这里，或%{browse}',
        dropHint: '拖拽文件到这里',
        dropPasteBoth: '拖拽文件到这里、%{browseFiles}或者%{browseFolders}',
        dropPasteFiles: '拖拽文件到这里或者%{browseFiles}',
        dropPasteFolders: '拖拽文件到这里或者%{browseFolders}',
        dropPasteImportBoth: '拖拽文件到这里、粘贴、%{browseFiles}、%{browseFolders}或者通过下方导入：',
        dropPasteImportFiles: '拖拽文件到这里、粘贴、%{browseFiles}或者通过下方导入：',
        dropPasteImportFolders: '拖拽文件到这里、粘贴、%{browseFolders}或者通过下方导入：',
        cancel: '返回',
        loadingStatus: '正在获取状态...',
        aspectRatioMessage: '请编辑图片适配所需比例，目前图片比例为 %{imageAspectRatio}，需要 %{aspectRatio}',
        editorLoading: '等待图片编辑...',
        // download remote file failure
        downloadRemoteFileFailure: '获取远程文件失败 ❌',
        noAllowedFileTypes: '不允许上传任何文件类型',
        allowedFileTypes: '允许上传的文件类型：',
        error: '初始化失败，请检查相关服务（Media Kit）运行状态是否正常',
      },
    }
  ),
  en: merge(
    { ...en_US },
    {
      strings: {
        // ai image
        aiKitRequired: 'Install and config the AI Kit component first',
        aiImageSelectedUse: 'Use selected images',
        aiImageSelectedTip: 'Please select images',
        aiImagePrompt: 'Prompt',
        aiImagePromptTip: 'Please enter the prompt',
        aiImageSize: 'Size',
        aiImageModel: 'Model',
        aiImageNumber: 'Number of images',
        aiImageGenerate: 'Generate',
        aiImageGenerating: 'Generating...',
        // hacker add browseFolders
        browse: 'browse',
        browseFiles: 'browse files',
        browseFolders: 'browse folders',
        dropHint: 'Drop your files here',
        dropPasteBoth: 'Drop files here, paste, %{browseFiles} or %{browseFolders}',
        dropPasteFiles: 'Drop files here, paste or %{browseFiles}',
        dropPasteFolders: 'Drop files here, paste or %{browseFolders}',
        dropPasteImportBoth: 'Drop files here, paste, %{browseFiles}, %{browseFolders} or import from:',
        dropPasteImportFiles: 'Drop files here, paste, %{browseFiles} or import from:',
        dropPasteImportFolders: 'Drop files here, paste, %{browseFolders} or import from:',
        cancel: 'Back',
        loadingStatus: 'Getting status...',
        aspectRatioMessage:
          'Please edit the required ratio for image, currently the image ratio is %{imageAspectRatio}, need %{aspectRatio}',
        editorLoading: 'Waiting for image editor...',
        // download remote file failure
        downloadRemoteFileFailure: 'Failure to get remote file ❌',
        noAllowedFileTypes: 'No allowed any file types',
        allowedFileTypes: 'Allowed file types: ',
        error: 'Failed to initialize, please check if the related service (Media Kit) is running normally',
      },
    }
  ),
  ja: merge(
    { ...ja_JP },
    {
      strings: {
        // ai image
        aiKitRequired: 'まず AI Kit コンポーネントをインストールして設定してください',
        aiImageSelectedUse: '選択した画像を使用',
        aiImageSelectedTip: '画像を選択してください',
        aiImagePrompt: 'プロンプト',
        aiImagePromptTip: 'プロンプトを入力してください',
        aiImageSize: 'サイズ',
        aiImageModel: 'モデル',
        aiImageNumber: '画像数',
        aiImageGenerate: '生成',
        aiImageGenerating: '生成中...',
        // hacker add browseFolders
        browse: 'ブラウズ',
        browseFiles: 'ファイルをブラウズ',
        browseFolders: 'フォルダをブラウズ',
        dropHint: 'ファイルをここにドロップ',
        dropPasteBoth: 'ファイルをここにドロップ、貼り付け、%{browseFiles} または %{browseFolders}',
        dropPasteFiles: 'ファイルをここにドロップ、貼り付け、または %{browseFiles}',
        dropPasteFolders: 'ファイルをここにドロップ、貼り付け、または %{browseFolders}',
        dropPasteImportBoth: 'ファイルをここにドロップ、貼り付け、%{browseFiles}、%{browseFolders} または以下からインポート：',
        dropPasteImportFiles: 'ファイルをここにドロップ、貼り付け、%{browseFiles} または以下からインポート：',
        dropPasteImportFolders: 'ファイルをここにドロップ、貼り付け、%{browseFolders} または以下からインポート：',
        cancel: '戻る',
        loadingStatus: 'ステータスを取得中...',
        aspectRatioMessage: '画像の必要な比率を編集してください。現在の画像比率は %{imageAspectRatio} で、%{aspectRatio} が必要です',
        editorLoading: '画像エディターを待機中...',
        // download remote file failure
        downloadRemoteFileFailure: 'リモートファイルの取得に失敗しました ❌',
        noAllowedFileTypes: '許可されたファイルタイプがありません',
        allowedFileTypes: '許可されたファイルタイプ：',
        error: '初期化に失敗しました。関連サービス（Media Kit）が正常に実行されているか確認してください',
      },
    }
  ),
  'zh-TW': merge(
    { ...zh_TW },
    {
      strings: {
        // ai image
        aiKitRequired: '請先安裝並配置 AI Kit',
        aiImageSelectedUse: '使用已選擇的圖片',
        aiImageSelectedTip: '請選擇心儀的圖片',
        aiImagePrompt: '提示詞',
        aiImagePromptTip: '請輸入提示詞',
        aiImageSize: '圖片尺寸',
        aiImageModel: '圖片模型',
        aiImageNumber: '生成數量',
        aiImageGenerate: '生成圖片',
        aiImageGenerating: '正在生成圖片...',
        // hacker add browseFolders
        browse: '瀏覽',
        browseFiles: '瀏覽檔案',
        browseFolders: '瀏覽資料夾',
        dropHereOr: '拖拽檔案到這裡，或%{browse}',
        dropHint: '拖拽檔案到這裡',
        dropPasteBoth: '拖拽檔案到這裡、%{browseFiles}或者%{browseFolders}',
        dropPasteFiles: '拖拽檔案到這裡或者%{browseFiles}',
        dropPasteFolders: '拖拽檔案到這裡或者%{browseFolders}',
        dropPasteImportBoth: '拖拽檔案到這裡、貼上、%{browseFiles}、%{browseFolders}或者透過下方匯入：',
        dropPasteImportFiles: '拖拽檔案到這裡、貼上、%{browseFiles}或者透過下方匯入：',
        dropPasteImportFolders: '拖拽檔案到這裡、貼上、%{browseFolders}或者透過下方匯入：',
        cancel: '返回',
        loadingStatus: '正在獲取狀態...',
        aspectRatioMessage: '請編輯圖片適配所需比例，目前圖片比例為 %{imageAspectRatio}，需要 %{aspectRatio}',
        editorLoading: '等待圖片編輯...',
        // download remote file failure
        downloadRemoteFileFailure: '獲取遠端檔案失敗 ❌',
        noAllowedFileTypes: '不允許上傳任何檔案類型',
        allowedFileTypes: '允許上傳的檔案類型：',
        error: '初始化失敗，請檢查相關服務（Media Kit）執行狀態是否正常',
      },
    }
  ),
};
