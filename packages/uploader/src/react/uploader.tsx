import { UploaderProps } from '../types';
import keyBy from 'lodash/keyBy';
import { useReactive } from 'ahooks';
import { createRoot } from 'react-dom/client';
import { Fragment, IframeHTMLAttributes, forwardRef, useEffect, useImperativeHandle, lazy } from 'react';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import Uppy from '@uppy/core';
import Webcam from '@uppy/webcam';
import ImportFromUrl from '@uppy/url';
import Unsplash from '@uppy/unsplash';
import uniq from 'lodash/uniq';
import { Dashboard, DragDrop as UppyDragDrop } from '@uppy/react';
import ImageEditor from '@uppy/image-editor';
import Tus from '@uppy/tus';
// import GoldenRetriever from '@uppy/golden-retriever';

// Don't forget the CSS: core and the UI components + plugins you are using.
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';
import '@uppy/webcam/dist/style.min.css';
import '@uppy/image-editor/dist/style.min.css';
import '@uppy/drag-drop/dist/style.min.css';
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

const getPluginList = (props: UploaderProps) => {
  const { apiPathProps } = props;

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
    getMediaKitComponent() &&
      !isMediaKit() && {
        id: 'Uploaded',
        plugin: Uploaded, //
        options: {},
      },
    // with AI Kit
    getAIKitComponent() && {
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
    !!window.blocklet.UNSPLASH_KEY && {
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

function useUploader(props: UploaderProps) {
  const {
    id,
    plugins,
    onAfterResponse: _onAfterResponse,
    onUploadFinish: _onUploadFinish,
    coreProps,
    apiPathProps,
  } = props;

  const pluginList = getPluginList(props);

  const pluginMap = keyBy(pluginList, 'id');

  // Adding to global `meta` will add it to every file.
  // Every Uppy instance needs a unique ID.

  const endpoint = getUploaderEndpoint(apiPathProps?.uploader as string);

  let currentUppy = new Uppy({
    id,
    meta: {
      uploaderId: id,
    },
    debug: localStorage.getItem('uppy_debug') === 'true',
    ...coreProps,
  }).use(Tus, {
    chunkSize: 1024 * 1024 * 10, // 10MB
    // docs: https://github.com/tus/tus-js-client/blob/main/docs/api.md
    withCredentials: true,
    endpoint,
    async onBeforeRequest(req, file) {
      // @ts-ignore
      const { hashFileName, id } = file;

      const ext = getExt(file);

      // put the hash in the header
      req.setHeader('x-uploader-file-name', `${hashFileName}`);
      req.setHeader('x-uploader-file-id', `${id}`);
      req.setHeader('x-uploader-file-ext', `${ext}`);
      req.setHeader('x-uploader-base-url', new URL(req.getURL()).pathname);

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
          // pause first
          currentUppy.pauseResume(file.id);

          // only trigger uppy event when exist
          currentUppy.emit('upload-success', file, {
            uploadURL,
          });
        }

        if (result.status === 200) {
          await _onUploadFinish?.(result);

          // @ts-ignore custom event
          currentUppy.emitUploadSuccess(file, result);
        }

        if (result.method === 'PATCH') {
          // remove uppy record
          Object.keys(localStorage).forEach((item) => {
            if (item.indexOf(result.headers['x-uploader-file-id']) !== -1) {
              try {
                localStorage.removeItem(item);
              } catch (error) {
                // do noting
              }
            }
          });
        }
      }

      // each time a response is received
      if (_onAfterResponse) {
        await _onAfterResponse?.(xhr);
      }
    },
  });

  // .use(GoldenRetriever);

  plugins?.forEach((item) => {
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

  const pluginList = getPluginList({ ...props, apiPathProps });

  const {
    plugins: _plugins = pluginList.map((item) => item.id),
    id = 'Uploader',
    popup = false,
    uploadedProps,
    onOpen,
    onClose,
  } = props;

  // get pluginMap tp get plugin some props
  const pluginMap = keyBy(pluginList, 'id');

  const plugins = uniq([..._plugins, ...pluginList.filter((item) => item.alwayUse).map((item) => item.id)]);

  // @ts-ignore
  const isMobile = useMediaQuery((theme) => theme?.breakpoints?.down('md'));

  const state = useReactive({
    open: false,
    uppy: null as any,
  });

  useEffect(() => {
    // @ts-ignore
    state.uppy = useUploader({
      ...props,
      id,
      plugins,
      apiPathProps,
    });
    state.uppy.open = open;
    state.uppy.close = close;
  }, [id, JSON.stringify(plugins)]);

  function open(pluginName?: string | undefined) {
    state.open = true;

    if (pluginName) {
      pluginName = pluginName.replace(/\s/g, '');
      setTimeout(() => {
        // @ts-ignore if plugin exist, click the plugin Button
        if (['MyDevice', ...plugins].includes(pluginName)) {
          let selectorKey = `div[data-uppy-acquirer-id="${pluginName}"] > button`;
          document
            ?.getElementById('upload-dashboard')
            ?.querySelector(selectorKey)
            // @ts-ignore
            ?.click?.();
        }
      }, 200); // delay 200ms to open plugin
    }
    state.uppy.emitOpen();
    onOpen?.();
  }

  function close() {
    state.uppy.getPlugin('upload-dashboard')?.hideAllPanels();
    state.open = false;
    state.uppy.emitClose();
    onClose?.();
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

  // custom plugin
  useEffect(() => {
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

    state.uppy.on('dashboard:show-panel', (source: string) => {
      const { onShowPanel } = pluginMap[source];
      onShowPanel?.(ref);
    });
  }, plugins);

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

  return (
    <Wrapper key="uploader-wrapper" {...wrapperProps}>
      {/* ignore backdrop trigger */}
      <Box
        key="uploader-container"
        id={target}
        onClick={(e: any) => e.stopPropagation()}
        sx={{
          width: isMobile ? '90vw' : 720,

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
            doneButtonHandler={() => {
              state.uppy.cancelAll();
              close();
            }}
            {...props.dashboardProps}
          />
        )}
      </Box>
    </Wrapper>
  );
});

const DragDrop = ({ uploader }: { uploader: any }) => {
  return <UppyDragDrop uppy={uploader}></UppyDragDrop>;
};

export default Uploader;

export { DragDrop, useUploader, Uploader };
