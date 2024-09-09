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
import Resources from './plugins/resources';
// @ts-ignore
import PrepareUpload from './plugins/prepare-upload';
// @ts-ignore
import AIImage from './plugins/ai-image';
import { MEDIA_KIT_DID } from './constants';
// @ts-ignore
const AIImageShowPanel = lazy(() => import('./plugins/ai-image/show-panel'));

const target = 'uploader-container';
const uploaderDashboardId = 'uploader-dashboard';

const isDebug = localStorage.getItem('uppy_debug');

const getPluginList = (props: any) => {
  const { apiPathProps, availablePluginMap = {}, uploadedProps } = props;

  const { companionUrl } = getUploaderEndpoint(apiPathProps);

  const getAIImageAPI = async (payload: any) => {
    const result = await api.post('/api/image/generations', payload);
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
      },
      alwayUse: true,
    },
    // other blocklet may can use this plugin
    (isDebug || (getMediaKitComponent() && !isMediaKit())) && {
      id: 'Uploaded',
      plugin: Uploaded, //
      options: {
        params: uploadedProps?.params,
      },
    },
    (isDebug || (getMediaKitComponent() && !isMediaKit())) && {
      id: 'Resources',
      plugin: Resources, // use image from resource blocklets
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
                    restrictions={AIrestrictions}
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
    {
      id: 'ThumbnailGeneratorNext', // fix console error
      plugin: ThumbnailGenerator,
      options: {
        thumbnailType: 'image/png',
        thumbnailWidth: '100%', // fixed width
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
    restrictions,
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
    locale: localeMap[locale || 'en'],
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
    restrictions: {} as any,
  });

  const pluginList = getPluginList({
    ...props,
    apiPathProps,
    availablePluginMap: state.availablePluginMap,
    restrictions: state.restrictions,
  });

  const {
    plugins: _plugins = pluginList.map((item) => item.id),
    id = 'Uploader',
    popup = false,
    uploadedProps,
    onOpen,
    onClose,
    locale,
    installerProps,
  } = props;

  // get pluginMap tp get plugin some props
  const pluginMap = keyBy(pluginList, 'id');

  // @ts-ignore
  const isMobile = useMediaQuery((theme) => theme?.breakpoints?.down('md'));

  const plugins = uniq([..._plugins, ...pluginList.filter((item) => item.alwayUse).map((item) => item.id)]);

  useLayoutEffect(() => {
    const updateRestrictions = async () => {
      let restrictions = (!isNil(props?.coreProps?.restrictions) ? props?.coreProps?.restrictions : {}) as any;

      // check if the media-kit is installed
      if (getMediaKitComponent() && !apiPathProps.disableMediaKitPrefix && isNil(props?.coreProps?.restrictions)) {
        await api.get('/api/uploader/status').then(({ data }: any) => {
          state.availablePluginMap = data.availablePluginMap;

          restrictions = data.restrictions || {};
        });
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

      state.restrictions = restrictions;
    };

    updateRestrictions();
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

    state.uppy.on('dashboard:show-panel', (source: string) => {
      const { onShowPanel } = pluginMap[source];
      onShowPanel?.(ref);
    });

    // handle uploaded:selected
    if (plugins.includes('Uploaded') || plugins.includes('Resources')) {
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
      restrictions: state.restrictions,
    }),
  ]);

  function openPlugin(pluginName: string) {
    pluginName = pluginName.replace(/\s/g, '');
    // @ts-ignore if plugin exist, click the plugin Button
    if (['MyDevice', ...plugins].map((item) => item.toLowerCase()).includes(pluginName.toLowerCase())) {
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

    // @ts-ignore set blur and focus body
    document.activeElement?.blur?.();
    const uppyRoot = state.uppy.getPlugin(uploaderDashboardId).el;

    // uppyRoot?.setAttribute?.('tabIndex', '0');
    uppyRoot?.focus?.();
    uppyRoot?.click?.();
  }

  function close() {
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

  const Wrapper = popup ? Backdrop : Fragment;
  const wrapperProps = popup
    ? {
        sx: {
          zIndex: 99999999999,
          background: 'rgba(0,0,0,0.5)',
          '& > *': {
            display: !state.open ? 'none' : 'block', // hide uppy when close
          },
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
          key="uploader-container"
          id={target}
          onClick={(e: any) => e.stopPropagation()}
          sx={{
            position: 'relative',
            width: isMobile ? '90vw' : 720,
            '.uppy-ProviderBrowserItem-inner': {
              flex: 1,
              color: 'transparent',
              'img, object': {
                objectFit: 'contain !important',
              },
            },
            '.uppy-Dashboard-Item-previewInnerWrap, .uppy-ProviderBrowserItem-inner': {
              background: 'repeating-conic-gradient(#bdbdbd33 0 25%,#fff 0 50%) 50%/16px 16px !important',
            },
            '.uploaded-add-item': {
              background: 'rgba(0,0,0,0.1) !important',
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
            aria-label="close"
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
              // showNativePhotoCameraButton={isMobile}
              // showNativeVideoCameraButton={isMobile}
              inline
              // @ts-ignore
              target={`#${target}`}
              id={uploaderDashboardId}
              uppy={state.uppy}
              plugins={plugins}
              fileManagerSelectionType="both"
              proudlyDisplayPoweredByUppy={false}
              showProgressDetails
              disableThumbnailGenerator
              // theme="light"
              note=""
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

export { initUploader, Uploader };
