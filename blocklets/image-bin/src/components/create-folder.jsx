import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import TextField from '@mui/material/TextField';

import Toast from '@arcblock/ux/lib/Toast';
import { Confirm } from '@arcblock/ux/lib/Dialog';

import { useUploadContext } from '../contexts/upload';

export default function CreateFolder({ children }) {
  const { t } = useLocaleContext();
  const [show, setShow] = useState(false);
  const open = useCallback(() => setShow(true), [setShow]);
  const [folder, setFolder] = useState(null);
  const [loading, setLoading] = useState(false);
  const { ensureFolder } = useUploadContext();

  const addConfirmButton = {
    text: t('common.add'),
    props: {
      variant: 'contained',
      color: 'secondary',
      disabled: loading || !folder,
    },
  };

  const cancelConfirmButton = {
    text: t('common.cancel'),
  };

  const onConfirmAdd = async () => {
    setLoading(true);
    await ensureFolder(folder)
      .then(() => {
        setLoading(false);
        setShow(false);
        Toast.success(t('common.addFolderSuccess'));
      })
      .catch((err) => {
        setLoading(false);
        Toast.error(
          t('common.addFailed', {
            reason: err.message,
          })
        );
      });
  };

  const onCancelAdd = () => {
    setShow(false);
    setFolder(null);
  };

  return (
    <>
      {children(open)}
      {show && (
        <Confirm
          open={open}
          title={t('common.addFolderConfirmTitle')}
          onConfirm={onConfirmAdd}
          onCancel={onCancelAdd}
          confirmButton={addConfirmButton}
          cancelButton={cancelConfirmButton}>
          <TextField
            label={t('common.folderName')}
            value={folder}
            onChange={(e) => {
              setFolder(e.target.value);
            }}
            sx={{ width: 300 }}
          />
        </Confirm>
      )}
    </>
  );
}

CreateFolder.propTypes = {
  children: PropTypes.func.isRequired,
};
