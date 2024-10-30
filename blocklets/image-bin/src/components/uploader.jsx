/* eslint-disable jsx-a11y/alt-text */
import { lazy } from 'react';
import Button from '@arcblock/ux/lib/Button';
import IconButton from '@mui/material/IconButton';
import joinUrl from 'url-join';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useUploadContext } from '../contexts/upload';

const UploaderTrigger = lazy(() =>
  // eslint-disable-next-line import/no-unresolved
  import('@blocklet/uploader').then((res) => ({ default: res.UploaderTrigger }))
);
const UploaderProvider = lazy(() =>
  // eslint-disable-next-line import/no-unresolved
  import('@blocklet/uploader').then((res) => ({ default: res.UploaderProvider }))
);

const obj = new window.URL(window.location.origin);
obj.pathname = joinUrl(window.blocklet.prefix, '/api/uploads');

export default function Uploader() {
  const { currentFolderInfo } = useUploadContext();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const { t } = useLocaleContext();

  const ButtonWrapper = isMobile ? IconButton : Button;

  return (
    <UploaderTrigger>
      <ButtonWrapper
        key="button"
        variant="contained"
        color="secondary"
        type="button"
        className="submit"
        style={{ marginRight: 16 }}>
        {isMobile ? (
          <AddCircleIcon />
        ) : (
          t('common.upload', {
            name: currentFolderInfo?.name,
          })
        )}
      </ButtonWrapper>
    </UploaderTrigger>
  );
}

// eslint-disable-next-line react/prop-types
function UploaderProviderWrapper({ children }) {
  const { prependUpload } = useUploadContext();
  const { locale } = useLocaleContext();

  return (
    <UploaderProvider
      key="uploader"
      locale={locale}
      popup
      onUploadFinish={(result) => {
        prependUpload(result.data);
      }}
      coreProps={
        {
          // following are Media Kit Preferences
          // restrictions: {
          //   // allowedFileExts: '.jpg',
          //   // allowedFileTypes: ['image/jpeg'],
          //   // maxFileSize: '2MB',
          //   // maxNumberOfFiles: 2, // use to debug
          // },
        }
      }
      dropTargetProps={
        {
          // target: document.body, // use body as drop target
        }
      }
      // only for debug
      // imageEditorProps={{
      //   cropperOptions: {
      //     aspectRatio: 16 / 9,
      //   },
      //   actions: {
      //     cropSquare: false,
      //     cropWidescreen: false,
      //     cropWidescreenVertical: false,
      //   },
      // }}
      apiPathProps={{
        uploader: '/api/uploads',
        companion: '/api/companion',
      }}>
      {children}
    </UploaderProvider>
  );
}

export { UploaderProviderWrapper };
