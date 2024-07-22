import { useState, useRef, useEffect } from 'react';
import Button from '@arcblock/ux/lib/Button';
import IconButton from '@mui/material/IconButton';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import useMediaQuery from '@mui/material/useMediaQuery';

import FileUploadIcon from '@mui/icons-material/FileUpload';
// import ExportIcon from '@mui/icons-material/Export';
import { PROJECT_PAGE_PATH } from '../libs/constants';

export default function Exporter() {
  const { t } = useLocaleContext();
  const [showCreateResource, setShowCreateResource] = useState(false);
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'));

  const iframeRef = useRef(null);

  useEffect(() => {
    const listener = (event) => {
      if (event?.data?.event === 'resourceDialog.close') {
        setShowCreateResource(false);
      }
    };
    setTimeout(() => {
      if (showCreateResource && iframeRef.current) {
        window.addEventListener('message', listener);
      }
    }, 600);
    return () => {
      window.removeEventListener('message', listener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCreateResource]);

  const ButtonWrapper = isMobile ? IconButton : Button;

  return (
    <>
      <ButtonWrapper
        key="button"
        variant="outlined"
        color="secondary"
        type="button"
        className="submit"
        onClick={() => setShowCreateResource(true)}
        style={{ marginRight: 16 }}>
        {isMobile ? <FileUploadIcon /> : t('common.export')}
      </ButtonWrapper>
      {showCreateResource && (
        <iframe
          className="iframe"
          ref={iframeRef}
          src={PROJECT_PAGE_PATH}
          title="Create Resource"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9999,
            backgroundColor: 'transparent',
          }}
        />
      )}
    </>
  );
}
