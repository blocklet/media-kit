// @ts-ignore
import zh_CN from '@uppy/locales/lib/zh_CN';
// @ts-ignore
import en_US from '@uppy/locales/lib/en_US';
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
      },
    }
  ),
};
