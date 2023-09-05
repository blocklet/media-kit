/* eslint-disable jsx-a11y/alt-text */
import { useCallback, useRef, lazy } from 'react';
import Button from '@arcblock/ux/lib/Button';
import joinUrl from 'url-join';
import xbytes from 'xbytes';
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

const canUseUnsplash = !!window.blocklet.UNSPLASH_KEY;

export default function Uploader() {
  const { prependUpload } = useUploadContext();

  const uploaderRef = useRef(null);

  const handleOpen = useCallback(() => {
    uploaderRef.current.open();
  }, []);

  return [
    <Button
      key="button"
      variant="contained"
      color="secondary"
      onClick={handleOpen}
      type="button"
      className="submit"
      style={{ marginRight: 16 }}>
      Upload to Media Library
    </Button>,
    <UploaderComponent
      key="uploader"
      ref={uploaderRef}
      popup
      onUploadFinish={(result) => {
        prependUpload(result.data);
      }}
      plugins={[
        // 'Uploaded', // image-bin unused, but leave it to debug later
        'ImageEditor',
        'Url',
        'Webcam',
        canUseUnsplash && 'Unsplash',
      ].filter(Boolean)}
      coreProps={{
        restrictions: {
          allowedFileTypes,
          maxFileSize,
        },
      }}
      apiPathProps={{
        uploader: '/api/uploads',
        companion: '/api/companion',
      }}
    />,
  ];
}
