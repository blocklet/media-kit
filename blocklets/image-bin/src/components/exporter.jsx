import { useState, useRef, useEffect } from 'react';
import Button from '@arcblock/ux/lib/Button';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import { PROJECT_PAGE_PATH } from '../libs/constants';

export default function Exporter() {
  const { t } = useLocaleContext();
  const [showCreateResource, setShowCreateResource] = useState(false);

  const iframeRef = useRef(null);

  useEffect(() => {
    const listener = (event) => {
      if (event?.data?.event === 'resourceDialog.close') {
        setShowCreateResource(false);
      }
    };
    setTimeout(() => {
      if (iframeRef.current) {
        window.addEventListener('message', listener);
      }
    }, 600);
    return () => {
      window.removeEventListener('message', listener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Button
        key="button"
        variant="outlined"
        color="secondary"
        type="button"
        className="submit"
        onClick={() => setShowCreateResource(true)}
        style={{ marginRight: 16 }}>
        {t('common.export')}
      </Button>
      {showCreateResource && (
        <iframe
          className="iframe"
          ref={iframeRef}
          src={PROJECT_PAGE_PATH}
          title="Add Resource"
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
