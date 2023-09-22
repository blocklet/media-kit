/* eslint-disable jsx-a11y/alt-text */
import { useCallback, lazy } from 'react';
import Button from '@arcblock/ux/lib/Button';
import joinUrl from 'url-join';
import xbytes from 'xbytes';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useUploadContext } from '../contexts/upload';

// eslint-disable-next-line import/no-unresolved
const UploaderComponent = lazy(() => import('@blocklet/uploader/react').then((res) => ({ default: res.Uploader })));

const obj = new window.URL(window.location.origin);
obj.pathname = joinUrl(window.blocklet.prefix, '/api/uploads');

const defaultTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/bmp', 'image/webp'];

const allowedFileTypes = Array.isArray(window.blocklet.preferences.types)
  ? window.blocklet.preferences.types
  : defaultTypes;

// not use iec
const maxFileSize = xbytes.parseSize(window.blocklet.MAX_UPLOAD_SIZE, { iec: false });

export default function Uploader() {
  const { prependUpload, currentFolderInfo, uploaderRef } = useUploadContext();

  const { locale } = useLocaleContext();

  const handleOpen = useCallback(() => {
    uploaderRef.current.open();
  }, [uploaderRef]);

  return [
    <Button
      key="button"
      variant="contained"
      color="secondary"
      onClick={handleOpen}
      type="button"
      className="submit"
      style={{ marginRight: 16 }}>
      Upload to {currentFolderInfo?.name}
    </Button>,
    <UploaderComponent
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
      apiPathProps={{
        uploader: '/api/uploads',
        companion: '/api/companion',
      }}
    />,
  ];
}
