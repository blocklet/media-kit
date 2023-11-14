import { UploaderProps } from '../types';
import keyBy from 'lodash/keyBy';
import { useReactive } from 'ahooks';
import { createRoot } from 'react-dom/client';
import {
  Fragment,
  IframeHTMLAttributes,
  forwardRef,
  useEffect,
  useImperativeHandle,
  lazy,
  useLayoutEffect,
} from 'react';
import Backdrop from '@mui/material/Backdrop';
import GlobalStyles from '@mui/material/GlobalStyles';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import { CancelOutlined as CloseIcon } from '@mui/icons-material';
import Uppy from '@uppy/core';
import Webcam from '@uppy/webcam';
import ImportFromUrl from '@uppy/url';
import Unsplash from '@uppy/unsplash';
import uniq from 'lodash/uniq';
import { useKeyPress } from 'ahooks';
import { Dashboard } from '@uppy/react';
import DropTarget from '@uppy/drop-target';
import ImageEditor from '@uppy/image-editor';
import Tus from '@uppy/tus';
import localeMap from './i18n';
// import GoldenRetriever from '@uppy/golden-retriever';

// Don't forget the CSS: core and the UI components + plugins you are using.
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import '@uppy/webcam/dist/style.min.css';
import '@uppy/image-editor/dist/style.min.css';
import '@uppy/drag-drop/dist/style.min.css';
import '@uppy/drop-target/dist/style.min.css';
import '@uppy/status-bar/dist/style.min.css';

import {
  api,
  setPrefixPath,
  isMediaKit,
  getMediaKitComponent,
  getExt,
  getUploaderEndpoint,
  base64ToFile,
  getAIKitComponent,
  getUrl,
  initUppy,
} from '../utils';

// @ts-ignore
import Uploaded from './plugins/uploaded';
// @ts-ignore
import PrepareUpload from './plugins/prepare-upload';
// @ts-ignore
import AIImage from './plugins/ai-image';
// @ts-ignore
const AIImageShowPanel = lazy(() => import('./plugins/ai-image/show-panel'));

const target = 'uploader-container';

const isDebug = localStorage.getItem('uppy_debug');

const getPluginList = (props: any) => {
  const { apiPathProps, availablePluginMap = {}, uploadedProps } = props;

  const companionUrl = getUploaderEndpoint(apiPathProps?.companion as string);

  const getAIImageAPI = async (payload: any) => {
    const result = await api.post('/api/image/generations', payload);
    return result.data;
  };

  const restrictions = props?.coreProps?.restrictions || {};

  return [
    {
      id: 'ImageEditor',
      plugin: ImageEditor, // use image editor
      options: {
        quality: 1,
      },
    },
    // other blocklet may can use this plugin
    (isDebug || (getMediaKitComponent() && !isMediaKit())) && {
      id: 'Uploaded',
      plugin: Uploaded, //
      options: {
        params: uploadedProps?.params,
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
                    api={getAIImageAPI}
                    restrictions={restrictions}
                    i18n={ref.current?.getUploader()?.i18n}
                    onSelect={(data: any) => {
                      const uploader = ref.current.getUploader();
                      uploader?.emit('ai-image:selected', data);

                      data.forEach((base64: any, index: number) => {
                        const fileName = `AI Image [${index + 1}].png`; // must be png

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
      },
    },
    {
      id: 'Webcam',
      plugin: Webcam,
      options: {},
    },
    // with Unsplash key
    // @ts-ignore
    !!window?.blocklet?.UNSPLASH_KEY &&
      availablePluginMap.Unsplash && {
        id: 'Unsplash',
        plugin: Unsplash,
        options: {
          companionUrl,
          companionHeaders: {},
          companionCookiesRule: 'same-origin',
        },
      },
    {
      id: 'PrepareUpload',
      plugin: PrepareUpload,
      options: {
        companionUrl,
      },
      alwayUse: true,
    },
  ].filter(Boolean);
};

function initUploader(props: any) {
  const {
    id,
    plugins,
    locale,
    onAfterResponse: _onAfterResponse,
    onUploadFinish: _onUploadFinish,
    coreProps,
    apiPathProps,
    tusProps,
    dropTargetProps,
    pluginList,
  } = props;

  const pluginMap = keyBy(pluginList, 'id');

  // Adding to global `meta` will add it to every file.
  // Every Uppy instance needs a unique ID.

  const endpoint = getUploaderEndpoint(apiPathProps?.uploader as string);

  let currentUppy = new Uppy({
    id,
    meta: {
      uploaderId: id,
    },
    debug: ['true', true].includes(isDebug || ''),
    // @ts-ignore
    locale: localeMap[locale || 'en'],
    ...coreProps,
  }).use(Tus, {
    chunkSize: 1024 * 1024 * 10, // default chunk size 10MB
    removeFingerprintOnSuccess: true,
    // docs: https://github.com/tus/tus-js-client/blob/main/docs/api.md
    withCredentials: true,
    endpoint,
    async onBeforeRequest(req, file) {
      // @ts-ignore
      const { hashFileName, id, meta } = file;

      const ext = getExt(file);

      // put the hash in the header
      req.setHeader('x-uploader-file-name', `${hashFileName}`);
      req.setHeader('x-uploader-file-id', `${id}`);
      req.setHeader('x-uploader-file-ext', `${ext}`);
      req.setHeader('x-uploader-base-url', new URL(req.getURL()).pathname);
      req.setHeader('x-uploader-endpoint-url', endpoint);
      req.setHeader(
        'x-uploader-metadata',
        JSON.stringify(meta, (key, value) => {
          if (typeof value === 'string') {
            return encodeURIComponent(value);
          }
          return value;
        })
      );

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

      // only call onUploadFinish if it's a PATCH / POST request
      if (['PATCH', 'POST'].includes(result.method) && [200, 500].includes(result.status)) {
        const isExist = [true, 'true'].includes(result.headers['x-uploader-file-exist']);
        const uploadURL = getUrl(result.url, result.headers['x-uploader-file-name']); // upload URL with file name
        const file = currentUppy.getFile(result.headers['x-uploader-file-id']);

        result.file = file;
        result.uploadURL = uploadURL;

        // exist but not upload
        if (isExist && file) {
          // if POST method check exist
          if (result.method === 'POST') {
            // pause first,  that not trigger PATCH request
            currentUppy.pauseResume(file.id);
          }

          // only trigger uppy event when exist
          currentUppy.emit('upload-success', file, {
            uploadURL,
          });

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
      if (uploadProgressDone && shouldAutoCloseAfterDropUpload) currentUppy.close();
    },
    ...tusProps,
  });

  // .use(GoldenRetriever);

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

  plugins?.forEach((item: string) => {
    if (item) {
      const { plugin, options } = pluginMap[item] || {};
      // @ts-ignore
      plugin && currentUppy.use(plugin, options);
    }
  });

  initUppy(currentUppy);

  return currentUppy;
}

const Uploader = forwardRef((props: UploaderProps & IframeHTMLAttributes<HTMLIFrameElement>, ref: any) => {
  // apiPathProps default is use image-bin
  const apiPathProps = {
    uploader: '/api/uploads',
    companion: '/api/companion',
    disableMediaKitPrefix: false,
    ...props?.apiPathProps,
  };

  const state = useReactive({
    open: false,
    uppy: null as any,
    availablePluginMap: {} as any,
  });

  const pluginList = getPluginList({ ...props, apiPathProps, availablePluginMap: state.availablePluginMap });

  const {
    plugins: _plugins = pluginList.map((item) => item.id),
    id = 'Uploader',
    popup = false,
    uploadedProps,
    onOpen,
    onClose,
    locale,
  } = props;

  // get pluginMap tp get plugin some props
  const pluginMap = keyBy(pluginList, 'id');

  // @ts-ignore
  const isMobile = useMediaQuery((theme) => theme?.breakpoints?.down('md'));

  const plugins = uniq([..._plugins, ...pluginList.filter((item) => item.alwayUse).map((item) => item.id)]);

  useLayoutEffect(() => {
    // check if the media-kit is installed
    if (getMediaKitComponent() && !apiPathProps.disableMediaKitPrefix) {
      api.get('/api/uploader/status').then(({ data }) => {
        state.availablePluginMap = data.availablePluginMap;
      });
    }
  }, []);

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
    // @ts-ignore
    state.uppy = initUploader({
      ...props,
      id,
      plugins,
      apiPathProps,
      pluginList,
    });

    state.uppy.open = open;
    state.uppy.close = close;
    state.uppy.openPlugin = openPlugin;

    state.uppy.on('dashboard:show-panel', (source: string) => {
      const { onShowPanel } = pluginMap[source];
      onShowPanel?.(ref);
    });

    // handle uploaded:selected
    if (plugins.includes('Uploaded')) {
      state.uppy.off('uploaded:selected');
      // @ts-ignore
      state.uppy.on('uploaded:selected', (files: Object[]) => {
        files.forEach((data: any) => {
          // emit to upload success, mock http response
          state.uppy.emitUploadSuccess(
            {
              id: data._id, // mock id
            },
            {
              data,
              isMock: true,
            }
          );
        });
        uploadedProps?.onSelectedFiles?.(files);
        // auto close
        close();
      });
    }
  }, [
    JSON.stringify({
      id,
      plugins,
      apiPathProps,
      locale,
    }),
  ]);

  function openPlugin(pluginName: string) {
    pluginName = pluginName.replace(/\s/g, '');
    // @ts-ignore if plugin exist, click the plugin Button
    if (['MyDevice', ...plugins].map((item) => item.toLowerCase()).includes(pluginName.toLowerCase())) {
      let selectorKey = `div[data-uppy-acquirer-id="${pluginName}"] > button`;
      document
        ?.getElementById('upload-dashboard')
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

    // @ts-ignore set blur and focus body
    document.activeElement?.blur?.();
    // auto focus upload-dashboard to key paste event
    const targetElement = document.getElementById('upload-dashboard'); // 通过 ID 获取元素
    // @ts-ignore
    targetElement?.querySelector('div > div')?.click?.();
  }

  function close() {
    state.uppy.getPlugin('upload-dashboard')?.hideAllPanels();
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

  useEffect(() => {
    setPrefixPath(apiPathProps.disableMediaKitPrefix);
  }, [apiPathProps.disableMediaKitPrefix]);

  const Wrapper = popup ? Backdrop : Fragment;
  const wrapperProps = popup
    ? {
        sx: {
          zIndex: 999999,
          '& > *': {
            display: !state.open ? 'none' : 'block', // hide uppy when close
          },
        },
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
        key="uploader-container"
        id={target}
        onClick={(e: any) => e.stopPropagation()}
        sx={{
          position: 'relative',
          width: isMobile ? '90vw' : 720,
          '.uploaded-add-item': {
            background: 'rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              background: 'rgba(0,0,0,0.13)',
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
            background: '#fff',
            height: '100%',
          },
          '.uppy-ProviderBrowser-list': {
            height: 'fit-content',
            maxHeight: '100%',
          },
          '.uploaded, .ai-image': {
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            '& > div': {
              width: '100%',
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
        }}>
        <IconButton
          onClick={close}
          sx={{
            color: '#fafafa',
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
        {/* @ts-ignore */}
        {state.uppy && (
          <Dashboard
            inline
            // @ts-ignore
            target={`#${target}`}
            id="upload-dashboard"
            uppy={state.uppy}
            plugins={plugins}
            fileManagerSelectionType="both"
            proudlyDisplayPoweredByUppy={false}
            showProgressDetails
            waitForThumbnailsBeforeUpload
            // theme="light"
            note=""
            doneButtonHandler={close}
            {...props.dashboardProps}
          />
        )}
      </Box>
    </Wrapper>
  );
});

export default Uploader;

export { initUploader, Uploader };
