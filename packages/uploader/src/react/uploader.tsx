import { UploaderProps } from '../types';
import keyBy from 'lodash/keyBy';
import { useReactive, useRequest } from 'ahooks';
import { createRoot } from 'react-dom/client';
import { Fragment, forwardRef, useCallback, useRef, useEffect, useImperativeHandle, lazy, useMemo } from 'react';
import get from 'lodash/get';
import { useTheme } from '@mui/material/styles';
import GlobalStyles from '@mui/material/GlobalStyles';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import { useMediaQuery } from '@mui/material';
import { CancelOutlined as CloseIcon } from '@mui/icons-material';
import Uppy from '@uppy/core';
import Webcam from '@uppy/webcam';
import ImportFromUrl from '@uppy/url';
import Unsplash from '@uppy/unsplash';
import isNil from 'lodash/isNil';
import uniq from 'lodash/uniq';
import { useKeyPress } from 'ahooks';
import { Dashboard } from '@uppy/react';
import DropTarget from '@uppy/drop-target';
import ImageEditor from '@uppy/image-editor';
import ThumbnailGenerator from '@uppy/thumbnail-generator';
import Tus from '@uppy/tus';
import localeMap from './i18n';
import { ComponentInstaller } from '@blocklet/ui-react';
import mime from 'mime-types';
import xbytes from 'xbytes';
import Modal from '@mui/material/Modal';
import Cookie from 'js-cookie';
import Spinner from '@mui/material/CircularProgress';

// Don't forget the CSS: core and the UI components + plugins you are using.
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import '@uppy/webcam/dist/style.min.css';
import '@uppy/image-editor/dist/style.min.css';
import '@uppy/drag-drop/dist/style.min.css';
import '@uppy/drop-target/dist/style.min.css';
import '@uppy/status-bar/dist/style.min.css';

import {
  mediaKitApi,
  setPrefixPath,
  isMediaKit,
  getMediaKitComponent,
  getExt,
  getUploaderEndpoint,
  base64ToFile,
  getAIKitComponent,
  getUrl,
  initUppy,
  mockUploaderFileResponse,
} from '../utils';

// @ts-ignore
import Uploaded from './plugins/uploaded';
// @ts-ignore
import Resources from './plugins/resources';
// @ts-ignore
import PrepareUpload from './plugins/prepare-upload';
// @ts-ignore
import AIImage from './plugins/ai-image';
// @ts-ignore
import VirtualPlugin from './plugins/virtual-plugin';
// @ts-ignore
import { SafariPastePlugin } from './plugins/safari-paste';
import { MEDIA_KIT_DID } from './constants';
import cloneDeep from 'lodash/cloneDeep';
import Typography from '@mui/material/Typography';
// @ts-ignore
const AIImageShowPanel = lazy(() => import('./plugins/ai-image/show-panel'));

const target = 'uploader-container';
const uploaderDashboardId = 'uploader-dashboard';
const autoFocusOverlaySelector = 'div[tabindex="-1"]';
const MAX_AUTO_FOCUS_ATTEMPTS = 50; // 最多尝试 50 次
const AUTO_FOCUS_INTERVAL = 10; // 自动聚焦间隔时间

const isDebug = localStorage.getItem('uppy_debug');

const getCompanionHeaders = () => {
  return Cookie.get('x-csrf-token') ? { 'x-csrf-token': Cookie.get('x-csrf-token') } : {};
};

const getPluginList = (props: any) => {
  const {
    apiPathProps,
    availablePluginMap = {},
    uploadedProps,
    resourcesProps,
    imageEditorProps = {},
    theme,
    plugins,
  } = props;

  const { companionUrl } = getUploaderEndpoint(apiPathProps);

  const companionHeaders = getCompanionHeaders();

  const getAIImageAPI = async (payload: any) => {
    const result = await mediaKitApi.post('/api/image/generations', payload);
    return result.data;
  };

  const AIrestrictions = {
    ...props?.restrictions,
    // default AI max file size is infinity
    maxFileSize: Infinity,
  };

  return [
    {
      id: 'ImageEditor',
      plugin: ImageEditor, // use image editor
      options: {
        quality: 1,
        // docs: https://uppy.io/docs/image-editor/#options
        ...imageEditorProps,
      },
      alwayUse: true,
    },
    // other blocklet may can use this plugin
    (isDebug || (getMediaKitComponent() && availablePluginMap.Uploaded && !isMediaKit())) && {
      id: 'Uploaded',
      plugin: Uploaded, //
      options: {
        params: uploadedProps?.params,
      },
    },
    (isDebug || (getMediaKitComponent() && availablePluginMap.Resources && !isMediaKit())) && {
      id: 'Resources',
      plugin: Resources, // use image from resource blocklets
      options: {
        params: resourcesProps?.params,
      },
    },
    // with AI Kit
    getMediaKitComponent() &&
      getAIKitComponent() &&
      availablePluginMap.AIImage && {
        id: 'AIImage',
        plugin: AIImage,
        options: {
          companionUrl,
          companionHeaders,
        },
        onShowPanel: (ref: any) => {
          function renderAIImageShowPanel() {
            // wait for render
            setTimeout(() => {
              const root = document.getElementById('ai-image');
              // render AIImageShowPanel
              if (root) {
                createRoot(root).render(
                  <AIImageShowPanel
                    theme={theme}
                    api={getAIImageAPI}
                    restrictions={AIrestrictions}
                    i18n={ref.current?.getUploader()?.i18n}
                    onSelect={(data: any) => {
                      const uploader = ref.current.getUploader();
                      uploader?.emit('ai-image:selected', data);

                      data.forEach(({ src: base64, alt }: any, index: number) => {
                        const getSliceText = (str: string) => {
                          return str?.length > 16 ? `${str?.slice(0, 8)}...${str?.slice(-4)}` : str;
                        };

                        const fileName = `${getSliceText(alt) || getSliceText(base64)}.png`; // must be png

                        const formatFile = {
                          name: fileName,
                          type: 'image/png', // must be png
                          data: base64ToFile(base64, fileName),
                          source: 'AIImage',
                          isRemote: false,
                        };

                        uploader?.addFile(formatFile);
                      });
                    }}
                  />
                );
              } else {
                renderAIImageShowPanel();
              }
            }, 100);
          }
          renderAIImageShowPanel();
        },
      },
    {
      id: 'Url',
      plugin: ImportFromUrl,
      options: {
        companionUrl,
        companionHeaders,
      },
    },
    {
      id: 'Webcam',
      plugin: Webcam,
      options: {
        showVideoSourceDropdown: true,
        showRecordingLength: true,
        mirror: false,
        videoConstraints: {
          facingMode: 'environment',
        },
      },
    },
    // with Unsplash key
    // @ts-ignore
    !!window?.blocklet?.UNSPLASH_KEY &&
      availablePluginMap.Unsplash && {
        id: 'Unsplash',
        plugin: Unsplash,
        options: {
          companionUrl,
          companionHeaders,
          companionCookiesRule: 'same-origin',
        },
      },
    {
      id: 'PrepareUpload',
      plugin: PrepareUpload,
      options: {
        companionUrl,
        companionHeaders,
        cropperOptions: imageEditorProps?.cropperOptions || null,
      },
      alwayUse: true,
    },
    {
      id: 'ThumbnailGeneratorNext', // fix console error
      plugin: ThumbnailGenerator,
      options: {
        thumbnailType: 'image/png',
        thumbnailWidth: '100%', // fixed width
      },
      alwayUse: true,
    },
    ...(plugins || [])
      .filter((item: any) => item?.id)
      .map((item: any) => {
        const { id, options, onShowPanel } = item;
        return {
          id,
          plugin: VirtualPlugin,
          options,
          onShowPanel,
        };
      }),
    {
      id: 'safari-paste',
      plugin: SafariPastePlugin,
      alwayUse: true,
    },
  ].filter(Boolean);
};

export function initUploader(props: any) {
  const {
    id,
    plugins,
    locale = 'en',
    onAfterResponse: _onAfterResponse,
    onUploadFinish: _onUploadFinish,
    coreProps,
    apiPathProps,
    tusProps,
    dropTargetProps,
    pluginList,
    restrictions,
    onChange,
    initialFiles,
  } = props;

  const pluginMap = keyBy(pluginList, 'id');

  // Adding to global `meta` will add it to every file.
  // Every Uppy instance needs a unique ID.

  const { uploaderUrl } = getUploaderEndpoint(apiPathProps);

  let currentUppy = new Uppy({
    id,
    meta: {
      uploaderId: id,
    },
    debug: ['true', true].includes(isDebug || ''),
    // @ts-ignore
    locale: localeMap[locale],
    onBeforeFileAdded: (file, files) => {
      if (Object.hasOwn(files, file.id)) {
        // is duplicate file
        return false;
      }
      const standardExt = !!mime.extension(file.type as string);
      const mimeType = (mime.lookup(file.name) || '') as string;

      // rewrite file extension and type: if file type is not standard and not equal to mime type
      if (!standardExt && mimeType && mimeType !== file.type) {
        const ext = getExt(file);
        if (ext) {
          file.extension = ext;
        }
        file.type = mimeType;
      }

      return file;
    },
    ...coreProps,
    restrictions,
  }).use(Tus, {
    chunkSize: 1024 * 1024 * 10, // default chunk size 10MB
    removeFingerprintOnSuccess: true,
    // docs: https://github.com/tus/tus-js-client/blob/main/docs/api.md
    withCredentials: true,
    endpoint: uploaderUrl,

    async onBeforeRequest(req, file) {
      // @ts-ignore
      const { hashFileName, id, meta } = file;

      // @ts-ignore
      const mockResponse = currentUppy.getFile(id)?.mockResponse || null;
      if (req.getMethod() === 'PATCH' && mockResponse) {
        // mock response to avoid next step upload
        req.send = () => mockResponse;
      }

      const ext = getExt(file);

      // put the hash in the header
      req.setHeader('x-uploader-file-name', `${hashFileName}`);
      req.setHeader('x-uploader-file-id', `${id}`);
      req.setHeader('x-uploader-file-ext', `${ext}`);
      req.setHeader('x-uploader-base-url', new URL(req.getURL()).pathname);
      req.setHeader('x-uploader-endpoint-url', uploaderUrl);
      req.setHeader(
        'x-uploader-metadata',
        JSON.stringify(meta, (key, value) => {
          if (typeof value === 'string') {
            return encodeURIComponent(value);
          }
          return value;
        })
      );
      // add csrf token if exist
      const csrfToken = Cookie.get('x-csrf-token');
      if (csrfToken) {
        req.setHeader('x-csrf-token', csrfToken);
      }

      // @ts-ignore get folderId when upload using
      const componentDid = window?.uploaderComponentId || window?.blocklet?.componentId;
      if (componentDid) {
        // @ts-ignore
        req.setHeader('x-component-did', (componentDid || '').split('/').pop());
      }
    },
    onAfterResponse: async (req, res) => {
      const result = {} as any;
      const xhr = req.getUnderlyingObject();

      try {
        if (xhr.response) {
          result.data = JSON.parse(xhr.response);
        }
      } catch (error) {
        result.data = {};
      }

      result.method = req.getMethod().toUpperCase();
      result.url = req.getURL();
      result.status = xhr.status;
      // @ts-ignore
      result.headers = {
        // @ts-ignore
        ...req._headers,
      };

      const allResponseHeaders = xhr.getAllResponseHeaders();

      // format headers
      if (allResponseHeaders) {
        const headers = allResponseHeaders.split('\r\n');
        headers.forEach((item: string) => {
          const [key, value] = item.split(': ');
          if (key && value) {
            result.headers[key] = value;
          }
        });
      }

      const file = currentUppy.getFile(result.headers['x-uploader-file-id']);

      // @ts-ignore
      if (req.getMethod() === 'PATCH' && file.mockResponse) {
        // mock response do nothing
        return;
      }

      // only call onUploadFinish if it's a PATCH / POST request
      if (['PATCH', 'POST'].includes(result.method) && [200, 500].includes(result.status)) {
        const isExist = [true, 'true'].includes(result.headers['x-uploader-file-exist']);
        const uploadURL = getUrl(result.url, result.headers['x-uploader-file-name']); // upload URL with file name

        result.file = file;
        result.uploadURL = uploadURL;

        const responseResult = {
          uploadURL,
          ...result,
        };

        currentUppy.setFileState(file.id, {
          responseResult,
        });

        // exist but not upload
        if (isExist && file) {
          // if POST method check exist
          if (result.method === 'POST') {
            // set mock response to avoid next step upload
            currentUppy.setFileState(file.id, {
              mockResponse: res,
            });
          }

          // only trigger uppy event when exist
          currentUppy.emit('upload-success', currentUppy.getFile(file.id), {
            ...responseResult,
            body: result.data,
          });
          currentUppy.emit('postprocess-complete', currentUppy.getFile(file.id));

          // @ts-ignore
          currentUppy.calculateTotalProgress();
        }

        if (result.status === 200) {
          await _onUploadFinish?.(result);

          // @ts-ignore custom event
          currentUppy.emitUploadSuccess(file, result);
        }
      }

      // each time a response is received
      if (_onAfterResponse) {
        await _onAfterResponse?.(xhr);
      }

      const uploadProgressDone = currentUppy.getState().totalProgress === 100;

      const shouldAutoCloseAfterDropUpload = currentUppy.getFiles().every((item: any) => item.source === 'DropTarget');

      // close uploader when upload progress done and all files are from DropTarget
      if (uploadProgressDone && shouldAutoCloseAfterDropUpload) {
        currentUppy.close();
      }
    },
    ...tusProps,
  });
  // .use(GoldenRetriever);

  const appendUploadIdEvent = ({ fileIDs, id }: { fileIDs: string[]; id: string }) => {
    fileIDs.forEach((fileId: any) => {
      currentUppy.setFileState(fileId, {
        uploadID: id,
      });
    });
  };

  // add upload event
  currentUppy.off('upload', appendUploadIdEvent);
  currentUppy.on('upload', appendUploadIdEvent);

  const onChangeEvent = (file: any) => {
    if (typeof onChange === 'function') {
      onChange(file, currentUppy.getFiles());
    }
  };

  // add file event
  currentUppy.off('file-added', onChangeEvent);
  currentUppy.on('file-added', onChangeEvent);

  // remove file event, use a new event
  // @ts-ignore
  currentUppy.off('file-removed-success', onChangeEvent);
  // @ts-ignore
  currentUppy.on('file-removed-success', onChangeEvent);

  // add drop target
  if (dropTargetProps) {
    currentUppy.use(DropTarget, {
      target: document.body,
      onDrop: (event: any) => {
        // @ts-ignore
        currentUppy?.open?.();
      },
      ...dropTargetProps,
    });
  }

  plugins?.forEach((item: string | any) => {
    if (item?.id || item) {
      const { plugin, options } = pluginMap[item?.id || item] || {};
      // @ts-ignore
      plugin && currentUppy.use(plugin, options);
    }
  });

  initUppy(currentUppy);

  // add initial files
  if (initialFiles && initialFiles?.length > 0) {
    currentUppy.addFiles(initialFiles);
  }

  return currentUppy;
}

export const Uploader = forwardRef((props: UploaderProps, ref: any) => {
  // apiPathProps default is use image-bin
  const apiPathProps = {
    uploader: '/api/uploads',
    companion: '/api/companion',
    disableMediaKitPrefix: false,
    disableMediaKitStatus: false,
    ...props?.apiPathProps,
  };

  const uploaderContainerRef = useRef<HTMLDivElement>(null);
  const autoFocusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoFocusAttemptsRef = useRef<number>(0);

  const state = useReactive({
    open: false,
    uppy: null as any,
    availablePluginMap: {} as any,
    restrictions: cloneDeep(props?.coreProps?.restrictions) || ({} as any),
  });

  const theme = useTheme();

  const mode = theme?.palette?.mode;

  const pluginList = getPluginList({
    ...props,
    apiPathProps,
    availablePluginMap: state.availablePluginMap,
    restrictions: state.restrictions,
    theme,
  });

  const {
    plugins: _plugins = pluginList.map((item) => item.id),
    id = 'Uploader',
    popup = false,
    onUploadFinish: _onUploadFinish,
    onOpen,
    onClose,
    locale = 'en',
    installerProps,
  } = props;

  // get pluginMap tp get plugin some props
  const pluginMap = keyBy(pluginList, 'id');

  // @ts-ignore
  const isMobile = useMediaQuery((theme) => theme?.breakpoints?.down('md'));

  const plugins = uniq([..._plugins, ...pluginList.filter((item) => item.alwayUse).map((item) => item.id)]);

  const { loading: loadingStatus } = useRequest(
    async () => {
      let restrictions = (
        !isNil(props?.coreProps?.restrictions) ? cloneDeep(props?.coreProps?.restrictions) : {}
      ) as any;

      // check if the media-kit is installed
      if (!apiPathProps.disableMediaKitStatus && getMediaKitComponent()) {
        try {
          await mediaKitApi.get('/api/uploader/status').then(({ data }: any) => {
            state.availablePluginMap = data.availablePluginMap;

            if (!apiPathProps.disableMediaKitPrefix && isNil(props?.coreProps?.restrictions)) {
              restrictions = data.restrictions || {};
            }
          });
        } catch (error) {
          // ignore error
        }
      }

      // no include allowedFileTypes and has allowedFileExts
      if (!restrictions?.allowedFileTypes?.length && restrictions?.allowedFileExts) {
        restrictions.allowedFileTypes = uniq(
          (
            (typeof restrictions?.allowedFileExts === 'string'
              ? restrictions?.allowedFileExts.split(',')
              : restrictions?.allowedFileExts) || []
          )
            ?.map((ext: string) => mime.lookup(ext?.replaceAll(' ', '') || ''))
            ?.filter((x: any) => x)
        );
        delete restrictions.allowedFileExts;
      }

      // format maxFileSize
      if (restrictions.maxFileSize && typeof restrictions.maxFileSize === 'string') {
        restrictions.maxFileSize = xbytes.parseSize(restrictions.maxFileSize, { iec: false }) || undefined;
      }

      state.restrictions = cloneDeep(restrictions);
    },
    {
      refreshDeps: [
        JSON.stringify({
          apiPathProps,
          restrictionsProps: props?.coreProps?.restrictions,
        }),
      ],
    }
  );

  const withoutAnyAllowedFileTypes =
    typeof state.restrictions?.allowedFileTypes === 'object' && state.restrictions?.allowedFileTypes?.length === 0;

  const extsNote = useMemo(() => {
    return (
      uniq(
        state.restrictions?.allowedFileTypes?.flatMap((item: string) => {
          // 处理通配符MIME类型如image/*
          if (item.endsWith('/*')) {
            const mainType = item.split('/')?.[0];
            switch (mainType) {
              case 'image':
                return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'tiff', 'avif', 'heic', 'ico', 'apng'];
              case 'video':
                return ['mp4', 'webm', 'mov', 'avi', 'wmv', 'flv', 'mkv', 'mpg', 'mpeg', '3gp', 'm4v', 'ts', 'm2ts'];
              case 'audio':
                return ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma', 'opus', 'mid', 'midi', 'amr'];
              case 'text':
                return ['txt', 'html', 'htm', 'css', 'csv', 'md', 'rtf', 'xml', 'json', 'js', 'ts', 'jsx', 'tsx'];
              case 'application':
                return [
                  'pdf',
                  'doc',
                  'docx',
                  'xls',
                  'xlsx',
                  'ppt',
                  'pptx',
                  'zip',
                  'rar',
                  '7z',
                  'tar',
                  'gz',
                  'exe',
                  'msi',
                  'apk',
                  'dmg',
                  'iso',
                ];
              case 'font':
                return ['ttf', 'otf', 'woff', 'woff2', 'eot'];
              case 'chemical':
                return ['mol', 'pdb', 'cml', 'xyz'];
              case 'model':
                return ['obj', 'stl', 'gltf', 'glb', 'fbx', '3ds', 'dae'];
              case 'message':
                return ['eml', 'msg', 'vcf', 'ics'];
              default:
                return mainType;
            }
          }
          return mime.extension(item);
        }) || []
      )
        ?.filter(Boolean)
        ?.join(', ') || ''
    );
  }, [state.restrictions?.allowedFileTypes]);

  let note = '' as any;
  if (withoutAnyAllowedFileTypes) {
    note = get(localeMap, `${locale}.strings.noAllowedFileTypes`, 'No allowed file types');
  } else if (state.restrictions?.allowedFileTypes?.length && extsNote) {
    note = get(localeMap, `${locale}.strings.allowedFileTypes`, 'Allowed file types: ') + extsNote;
  }

  if (isNil(note) || ['undefined', 'null', undefined, null].includes(note)) {
    note = '';
  }

  useKeyPress(
    'esc',
    (e) => {
      // close when esc key down
      if (state.open) {
        e.stopPropagation();
        e.preventDefault();
        close();
      }
    },
    {
      useCapture: true,
    }
  );

  useEffect(() => {
    setPrefixPath(apiPathProps);
    // @ts-ignore
    state.uppy = initUploader({
      ...props,
      id,
      plugins,
      apiPathProps,
      pluginList,
      restrictions: state.restrictions,
    });

    state.uppy.open = open;
    state.uppy.close = close;
    state.uppy.openPlugin = openPlugin;

    const onShowPanelEvent = (source: string) => {
      const { onShowPanel } = pluginMap[source];
      onShowPanel?.(ref);
    };

    state.uppy.off('dashboard:show-panel', onShowPanelEvent);
    state.uppy.on('dashboard:show-panel', onShowPanelEvent);

    // handle plugin selection event
    const handlePluginSelection = (files: Object[], state: any, props: any, pluginName: string) => {
      const propsKey = `${pluginName.toLowerCase()}Props`;
      const onSelectedFiles = props[propsKey]?.onSelectedFiles;

      if (typeof onSelectedFiles === 'function') {
        const formatFiles = files.map((data: any) => {
          const formatFile = {
            name: data.id || data.fileUrl?.split('/')?.slice(-1)?.[0],
            type: data.mimetype || mime.lookup(data.fileUrl),
            data: '', // mock a data, will upload auto download by isRemote
            preview: data.fileUrl,
            source: pluginName,
            isRemote: true,
          };

          const fileId = state.uppy.addFile(formatFile);

          return {
            ...data,
            uppyFile: state.uppy.getFile(fileId),
          };
        });

        onSelectedFiles?.(formatFiles);
      } else {
        const successful = [] as any;
        const failed = [] as any;
        const uploadID = `Mock-${Math.random().toString(36).substring(2, 15)}`;

        Promise.all(
          files.map(async (file: any) => {
            const result = mockUploaderFileResponse(file);
            // 确保所有文件共享相同的 uploadID
            if (result) {
              result.uploadID = uploadID;
              successful.push(result);
            }

            await _onUploadFinish?.(result);

            // @ts-ignore custom event
            state.uppy.emitUploadSuccess(result.file, result);
          })
        )
          .then(() => {
            // auto close when selected files
            state.uppy.close();
          })
          .finally(() => {
            // should emit complete event
            state.uppy.emit('complete', {
              failed,
              successful,
              uploadID,
            });
          });
      }
    };

    const pluginHandlers = [
      {
        name: 'Uploaded',
        event: 'uploaded:selected',
      },
      {
        name: 'Resources',
        event: 'resources:selected',
      },
    ];

    pluginHandlers.forEach(({ name, event }) => {
      if (plugins.includes(name)) {
        state.uppy.off(event);
        state.uppy.on(event, (files: Object[]) => handlePluginSelection(files, state, props, name));
      }
    });
  }, [
    JSON.stringify({
      id,
      plugins,
      apiPathProps,
      locale,
      restrictions: state.restrictions,
      theme,
    }),
  ]);

  function openPlugin(pluginName: string) {
    pluginName = pluginName.replace(/\s/g, '');
    const pluginNameList = plugins.map((item: any) => item.id || item);
    // @ts-ignore if plugin exist, click the plugin Button
    if (['MyDevice', ...pluginNameList].map((item) => item.toLowerCase()).includes(pluginName.toLowerCase())) {
      let selectorKey = `div[data-uppy-acquirer-id="${pluginName}"] > button`;
      document
        ?.getElementById(uploaderDashboardId)
        ?.querySelector(selectorKey)
        // @ts-ignore
        ?.click?.();
    }
  }

  function open(pluginName?: string | undefined) {
    state.open = true;

    if (pluginName) {
      setTimeout(() => {
        openPlugin(pluginName);
      }, 200); // delay 200ms to open plugin
    }
    state.uppy.emitOpen();
    onOpen?.();

    // 清除可能存在的上一个定时器
    if (autoFocusIntervalRef.current) {
      clearInterval(autoFocusIntervalRef.current);
      autoFocusIntervalRef.current = null;
    }

    // 重置尝试次数
    autoFocusAttemptsRef.current = 0;

    autoFocusIntervalRef.current = setInterval(() => {
      const autoFocusOverlay = uploaderContainerRef.current?.querySelector(autoFocusOverlaySelector);
      autoFocusAttemptsRef.current += 1;

      // 如果尝试次数超过最大值或成功聚焦，则清除定时器
      if (
        autoFocusAttemptsRef.current > MAX_AUTO_FOCUS_ATTEMPTS ||
        (autoFocusOverlay && autoFocusOverlay !== document.activeElement)
      ) {
        if (autoFocusOverlay && autoFocusOverlay !== document.activeElement) {
          // @ts-ignore
          autoFocusOverlay.focus?.();
          console.info('[Uploader] Trigger auto focus overlay success');
        } else if (autoFocusAttemptsRef.current > MAX_AUTO_FOCUS_ATTEMPTS) {
          console.info('[Uploader] Auto focus overlay failed after maximum attempts');
        }

        clearInterval(autoFocusIntervalRef.current!);
        autoFocusIntervalRef.current = null;
      }
    }, AUTO_FOCUS_INTERVAL);
  }

  function close() {
    // 清除自动聚焦定时器
    if (autoFocusIntervalRef.current) {
      clearInterval(autoFocusIntervalRef.current);
      autoFocusIntervalRef.current = null;
    }

    state.uppy.getPlugin(uploaderDashboardId)?.hideAllPanels();
    state.open = false;
    state.uppy.emitClose();
    onClose?.();

    setTimeout(() => {
      if (state.uppy.getState().totalProgress === 100) {
        // reset uploader state
        state.uppy.setState({ files: {}, currentUploads: {} });
        // @ts-ignore
        state.uppy.calculateTotalProgress();
      }
    }, 500);
  }

  useImperativeHandle(
    ref,
    () =>
      ({
        getUploader: () => state.uppy,
        open,
        close,
      } as {
        getUploader: Function;
        open: Function;
        close: Function;
      })
  );

  const Wrapper = popup ? Modal : Fragment;
  const wrapperProps = popup
    ? {
        sx: {
          zIndex: 99999999999,
          '& > *': {
            display: !state.open ? 'none' : 'block', // hide uppy when close
          },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          ...props?.wrapperProps?.sx,
        },
        invisible: true,
        open: state.open,
        onClick: (e: any) => {
          if (document.activeElement === document.body) {
            e.stopPropagation();
            close();
          }
        },
        ...props.wrapperProps,
      }
    : ({
        ...props.wrapperProps,
      } as any);

  const closeIconSize = isMobile ? '42px' : '40px';

  return (
    <Wrapper key="uploader-wrapper" {...wrapperProps}>
      <ComponentInstaller onClose={close} did={MEDIA_KIT_DID} disabled={!state.open} {...installerProps}>
        <GlobalStyles
          styles={() => {
            return {
              '.uppy-is-drag-over': {
                '&::after': {
                  transition: 'all 0.3s ease-in-out',
                  border: '2px dashed #bbb !important',
                  borderRadius: 4,
                  background: `rgba(234, 234, 234, 0.5)`,
                },
              },
            };
          }}
        />
        {/* ignore backdrop trigger */}
        <Box
          className="uploader-container"
          key="uploader-container"
          ref={uploaderContainerRef}
          id={target}
          onClick={(e: any) => e.stopPropagation()}
          sx={{
            position: 'relative',
            width: isMobile ? '90vw' : 720,
            // 增加出现的动画，避免直接出现
            animation: state.open ? 'uppy-Dashboard-fadeIn 150ms ease-in-out' : 'none',
            '@keyframes uppy-Dashboard-fadeIn': {
              from: {
                opacity: 0,
              },
              to: {
                opacity: 1,
              },
            },

            '.uppy-Dashboard-inner': {
              borderColor: 'divider',
            },
            '.uppy-ProviderBrowserItem > *': {
              transition: 'all 0.3s ease-in-out',
            },
            '.uppy-ProviderBrowserItem-inner': {
              flex: 1,
              color: 'transparent',
              'img, object': {
                objectFit: 'contain !important',
              },
            },
            '.uppy-ProviderBrowserItem-checkbox': {
              backgroundColor: `${theme?.palette?.primary?.main} !important`,
            },
            '.uppy-Dashboard-Item-previewInnerWrap, .uppy-ProviderBrowserItem-inner': {
              boxShadow: 'none !important',
              background: 'repeating-conic-gradient(#e0e0e0 0 25%,#fff 0 50%) 50%/18px 18px !important',
            },
            '.uppy-ProviderBrowserItem--selected .uppy-ProviderBrowserItem-inner': {
              boxShadow: (theme) => `0 0 0 3px ${theme.palette.primary.main} !important`,
            },
            '.uploaded-add-item': {
              background:
                theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1) !important' : 'rgba(0,0,0,0.1) !important',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                background:
                  theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.13) !important' : 'rgba(0,0,0,0.13) !important',
              },
            },
            '.uppy-StatusBar-actions, .uppy-ProviderBrowser-footer': {
              justifyContent: 'flex-end',
            },
            '.uppy-ProviderBrowser-footer': {
              button: {
                marginRight: '0 !important',
                '&:last-child': {
                  display: 'none',
                },
              },
            },
            '.uppy-Dashboard-AddFiles-title': {
              whiteSpace: 'normal',
            },
            '.uppy-ProviderBrowser-body': {
              height: '100%',
            },
            '.uppy-ProviderBrowser-list': {
              height: 'fit-content',
              maxHeight: '100%',
              bgcolor: 'background.paper',
            },
            '.uploaded, .ai-image': {
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column',
              '& > div': {
                width: '100%',
                bgcolor: 'background.paper',
              },
              '& .uppy-ProviderBrowser-header': {
                // hide the logout
                display: 'none',
              },
            },
            '& .uppy-Url': {
              width: '100% !important',
              display: 'flex',
              justifyContent: 'center',
              '& input': {
                width: '70%',
              },
            },
            '& .uppy-Dashboard-browse, & .uppy-DashboardContent-addMore, & .uppy-DashboardContent-back, & .uppy-StatusBar-actionBtn--done, & .uppy-DashboardContent-save, & .uppy-StatusBar-actionBtn--upload':
              {
                color: `${theme?.palette?.primary?.main}`,
                transition: 'all 0.3s ease-in-out',
                '&:hover, &:focus': {
                  color: `${theme?.palette?.primary?.main}`,
                  filter: 'brightness(1.2)',
                },
              },
            '& .uppy-Dashboard-browse': {
              textDecoration: 'underline !important',
            },
            '& .uppy-c-btn-primary': {
              backgroundColor: `${theme?.palette?.primary?.main} !important`,
              transition: 'all 0.3s ease-in-out',
              '&:hover, &:focus': {
                backgroundColor: `${theme?.palette?.primary?.main} !important`,
                filter: 'brightness(1.2)',
              },
            },
            '& .button-color-style': {
              border: '1px solid',
              borderColor: 'primary.main',
              color: 'primary.main',
              backgroundColor: 'transparent',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                filter: 'brightness(1.2)',
              },
            },
            '& .button-color-style-active': {
              backgroundColor: 'primary.main',
              color: 'white',
            },
          }}>
          {popup && (
            <IconButton
              aria-label="close"
              onClick={close}
              sx={{
                color: mode === 'dark' ? '#ddd' : '#fafafa',
                position: 'absolute',
                ...(isMobile
                  ? {
                      bottom: `calc(0px - ${closeIconSize} - 16px)`,
                      left: `calc(50vw - ${closeIconSize} - 8px)`,
                    }
                  : {
                      right: `calc(0px - ${closeIconSize} - 16px)`,
                      top: -12,
                    }),
              }}>
              <CloseIcon
                sx={{
                  fontSize: closeIconSize,
                }}
              />
            </IconButton>
          )}
          {loadingStatus && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 99999999999,
                flexDirection: 'column',
                background: 'rgba(256, 256, 256, 0.2)',
                backdropFilter: 'blur(4px)',
                borderRadius: 1,
                pointerEvents: 'none',
              }}>
              <Spinner size={32} />
              <Typography
                variant="body2"
                color="primary"
                sx={{
                  mt: 1.5,
                  fontWeight: 'bold',
                }}>
                {get(localeMap, `${locale}.strings.loadingStatus`, 'Loading...')}
              </Typography>
            </Box>
          )}
          {/* @ts-ignore */}
          {state.uppy && (
            <Dashboard
              // showNativePhotoCameraButton={isMobile}
              // showNativeVideoCameraButton={isMobile}
              inline
              // @ts-ignore
              target={`#${target}`}
              id={uploaderDashboardId}
              disabled={withoutAnyAllowedFileTypes}
              uppy={state.uppy}
              plugins={plugins}
              fileManagerSelectionType={state.restrictions?.maxNumberOfFiles === 1 ? 'files' : 'both'}
              proudlyDisplayPoweredByUppy={false}
              showProgressDetails
              disableThumbnailGenerator
              theme={mode === 'dark' ? 'dark' : 'light'}
              note={note}
              doneButtonHandler={close}
              {...props.dashboardProps}
            />
          )}
        </Box>
      </ComponentInstaller>
    </Wrapper>
  );
});

export default Uploader;
