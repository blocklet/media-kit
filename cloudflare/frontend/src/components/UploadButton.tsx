import { lazy, Suspense, useRef, useCallback } from 'react';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { createPortal } from 'react-dom';

const UploaderComponent = lazy(() =>
  import('@blocklet/uploader').then((res) => ({
    default: res.Uploader,
  }))
);

interface Props {
  folderId?: string;
  onUploadFinish?: (data: any) => void;
}

export default function UploadButton({ folderId, onUploadFinish }: Props) {
  const uploaderRef = useRef<any>(null);

  const handleOpen = useCallback(() => {
    uploaderRef.current?.open();
  }, []);

  const uploaderPortal = (
    <Suspense fallback={null}>
      <UploaderComponent
        ref={uploaderRef}
        popup
        onUploadFinish={(result: any) => {
          onUploadFinish?.(result.data);
        }}
        uploadedProps={{
          onSelectedFiles: (files: any[]) => {
            if (files.length) {
              onUploadFinish?.(files[0]);
            }
          },
        }}
        coreProps={{
          restrictions: {
            allowedFileExts: ['.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp', '.ico', '.jpg'],
            maxFileSize: 500 * 1024 * 1024,
          },
          meta: { folderId: folderId || '' },
        }}
        apiPathProps={{
          uploader: '/api/uploads',
          companion: '/api/companion',
        }}
        installerProps={{
          disabled: true,
        }}
        locale="en"
      />
    </Suspense>
  );

  return (
    <>
      <Button variant="contained" startIcon={<CloudUploadIcon />} onClick={handleOpen}>
        Upload
      </Button>
      {createPortal(uploaderPortal, document.body)}
    </>
  );
}
