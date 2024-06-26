/* eslint-disable jsx-a11y/alt-text */
import { lazy } from 'react';
import Button from '@arcblock/ux/lib/Button';
import joinUrl from 'url-join';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useUploadContext } from '../contexts/upload';

const UploaderTrigger = lazy(() =>
  // eslint-disable-next-line import/no-unresolved
  import('@blocklet/uploader/react').then((res) => ({ default: res.UploaderTrigger }))
);
const UploaderProvider = lazy(() =>
  // eslint-disable-next-line import/no-unresolved
  import('@blocklet/uploader/react').then((res) => ({ default: res.UploaderProvider }))
);

const obj = new window.URL(window.location.origin);
obj.pathname = joinUrl(window.blocklet.prefix, '/api/uploads');

export default function Uploader() {
  const { currentFolderInfo } = useUploadContext();
  const { t } = useLocaleContext();

  return (
    <UploaderTrigger>
      <Button
        key="button"
        variant="contained"
        color="secondary"
        type="button"
        className="submit"
        style={{ marginRight: 16 }}>
        {t('common.upload', {
          name: currentFolderInfo?.name,
        })}
      </Button>
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
      apiPathProps={{
        uploader: '/api/uploads',
        companion: '/api/companion',
      }}>
      {children}
    </UploaderProvider>
  );
}

export { UploaderProviderWrapper };
