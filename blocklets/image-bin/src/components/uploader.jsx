/* eslint-disable jsx-a11y/alt-text */
import { lazy } from 'react';
import Button from '@arcblock/ux/lib/Button';
import joinUrl from 'url-join';
import xbytes from 'xbytes';
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

const defaultTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/bmp', 'image/webp'];

const allowedFileTypes = Array.isArray(window.blocklet.preferences.types)
  ? window.blocklet.preferences.types
  : defaultTypes;

// not use iec
const maxFileSize = xbytes.parseSize(window.blocklet.MAX_UPLOAD_SIZE, { iec: false });

export default function Uploader() {
  const { currentFolderInfo } = useUploadContext();

  return (
    <UploaderTrigger>
      <Button
        key="button"
        variant="contained"
        color="secondary"
        type="button"
        className="submit"
        style={{ marginRight: 16 }}>
        Upload to {currentFolderInfo?.name}
      </Button>
    </UploaderTrigger>
  );
}

// eslint-disable-next-line react/prop-types
function UploaderProviderWrapper({ children }) {
  const { prependUpload, uploaderRef } = useUploadContext();
  const { locale } = useLocaleContext();

  return (
    <UploaderProvider
      key="uploader"
      ref={uploaderRef}
      locale={locale}
      popup
      onUploadFinish={(result) => {
        prependUpload(result.data);
      }}
      coreProps={{
        restrictions: {
          allowedFileTypes,
          maxFileSize,
          // maxNumberOfFiles: 2, // use to debug
        },
      }}
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
