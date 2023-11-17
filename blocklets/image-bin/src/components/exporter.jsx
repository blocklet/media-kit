import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import Button from '@arcblock/ux/lib/Button';
import Dialog from '@arcblock/ux/lib/Dialog';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import styled from '@emotion/styled';
import DialogContentText from '@mui/material/DialogContentText';

import { PROJECT_PAGE_PATH } from '../libs/constants';

function CreateResource({ open, onClose }) {
  const { t } = useLocaleContext();
  const iframeRef = useRef(null);

  if (!open) {
    return null;
  }

  return (
    <DialogWrapper
      title={t('common.resourceBlocklet')}
      maxWidth={false}
      fullWidth={false}
      PaperProps={{
        style: {
          maxWidth: 1350,
          width: '80%',
        },
      }}
      onClose={onClose}
      showCloseButton
      disableEscapeKeyDown
      open>
      <DialogContentWrapper>
        <iframe
          style={{ width: '100%', height: '100%' }}
          className="iframe"
          ref={iframeRef}
          src={PROJECT_PAGE_PATH}
          title="Add Resource"
        />
      </DialogContentWrapper>
    </DialogWrapper>
  );
}

CreateResource.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
};

CreateResource.defaultProps = {
  open: false,
  onClose: () => {},
};

const DialogWrapper = styled(Dialog)`
  .iframe {
    width: 100%;
    height: 100%;
    border: 0;
  }
`;

const DialogContentWrapper = styled(DialogContentText)`
  height: 72vh;
  position: relative;
`;

export default function Uploader() {
  const { t } = useLocaleContext();
  const [showCreateResource, setShowCreateResource] = useState(false);

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
      {showCreateResource && <CreateResource open onClose={() => setShowCreateResource(false)} />}
    </>
  );
}
