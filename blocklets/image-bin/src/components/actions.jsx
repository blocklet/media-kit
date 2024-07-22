/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import Copy from 'copy-to-clipboard';
import styled from '@emotion/styled';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import Toast from '@arcblock/ux/lib/Toast';

import SplitButton from '@arcblock/ux/lib/SplitButton';
import Button from '@arcblock/ux/lib/Button';
import { Confirm } from '@arcblock/ux/lib/Dialog';
import { isValid as isValidDid } from '@arcblock/did';
import { useSessionContext } from '../contexts/session';
import api, { createImageUrl } from '../libs/api';
import { useUploadContext } from '../contexts/upload';
import MediaItem from './media-item';

const filter = createFilterOptions();

export default function ImageActions({ data, isResource }) {
  const { session } = useSessionContext();
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [isMoveOpen, setMoveOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [value, setValue] = useState(null);
  const { folders, deleteUpload, ensureFolder, folderId } = useUploadContext();
  const { t } = useLocaleContext();

  const onCopy = () => {
    Copy(createImageUrl(data.filename, 0, 0));
    setCopied(true);
    Toast.success(t('common.copySuccess'));
  };

  useEffect(() => {
    let timer = null;
    if (copied) {
      timer = setTimeout(() => {
        setCopied(false);
      }, 2000);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  });

  const onDelete = () => {
    setDeleteOpen(true);
  };

  const onConfirmDelete = async () => {
    setLoading(true);
    await api
      .delete(`/api/uploads/${data._id}`)
      .then((res) => {
        if (res?.data?.error) {
          throw new Error(res.data.error);
        }
        setLoading(false);
        deleteUpload(data._id);
        setDeleteOpen(false);
        Toast.success(t('common.deleteSuccess'));
      })
      .catch((err) => {
        setLoading(false);
        console.warn(err);
        Toast.error(t('common.deleteFailed', { reason: err.message }));
      });
  };

  const onCancelDelete = () => {
    setDeleteOpen(false);
  };

  const onMove = () => {
    setMoveOpen(true);
  };

  const onConfirmMove = async () => {
    setLoading(true);
    let folder = value;
    if (value.createNew) {
      Toast.success(t('common.moveFolderAddNewSuccess'));
      folder = await ensureFolder(value.name);
    }

    await api
      .put(`/api/uploads/${data._id}`, { folderId: folder._id })
      .then(() => {
        setLoading(false);
        setMoveOpen(false);
        deleteUpload(data._id);
        Toast.success(t('common.updateSuccess'));
      })
      .catch((err) => {
        setLoading(false);
        Toast.error(
          t('common.updateFailed', {
            reason: err.message,
          })
        );
      });
  };

  const onCancelMove = () => {
    setMoveOpen(false);
    setValue(null);
  };

  const isMediaKitFile =
    (data.folderId || 'z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9') === 'z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9' ||
    !isValidDid(data.folderId);

  const isAdmin = ['admin', 'owner'].includes(session?.user?.role);

  const getDownloadUrl = () => {
    return `${createImageUrl(data.filename, 0, 0)}?filename=${encodeURIComponent(data.originalname)}`;
  };

  const onDownload = () => {
    window.open(getDownloadUrl());
  };

  const copyDownload = () => {
    Copy(getDownloadUrl());
    Toast.success(t('common.copyDownloadSuccess'));
  };

  const actions = [
    { children: t('common.download'), onClick: onDownload },
    { children: t('common.copyDownload'), onClick: copyDownload },
    // can't delete other blocklet files
    { children: t('common.delete'), disabled: !isMediaKitFile && !isAdmin, onClick: onDelete },
    { children: t('common.moveFolder'), disabled: !isMediaKitFile && !isAdmin, onClick: onMove },
  ].map((item) => {
    return {
      ...item,
      children: <Typography variant="body2">{item.children}</Typography>,
    };
  });

  const deleteConfirmButton = {
    text: t('common.delete'),
    props: {
      variant: 'contained',
      color: 'secondary',
      disabled: loading,
    },
  };

  const moveConfirmButton = {
    text: t('common.move'),
    props: {
      variant: 'contained',
      color: 'secondary',
      disabled: loading,
    },
  };

  const cancelConfirmButton = {
    text: t('common.cancel'),
  };

  const button = isResource ? (
    <Button size="small" onClick={onCopy} variant="outlined">
      {copied ? t('common.copied') : t('common.copyUrl')}
    </Button>
  ) : (
    <SplitButton size="small" onClick={onCopy} variant="outlined" menu={actions}>
      {copied ? t('common.copied') : t('common.copyUrl')}
    </SplitButton>
  );

  return (
    <>
      {button}
      <Confirm
        open={isDeleteOpen}
        title={t('common.deleteConfirmTitle')}
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
        confirmButton={deleteConfirmButton}
        cancelButton={cancelConfirmButton}>
        <Typography textAlign="left">
          <div
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: t('common.deleteConfirmMessage', {
                name: data.originalname,
              }),
            }}
          />
        </Typography>
        <ImagePreview>
          <MediaItem {...data} />
        </ImagePreview>
      </Confirm>
      <Confirm
        open={isMoveOpen}
        title={t('common.moveFolderConfirmTitle')}
        onConfirm={onConfirmMove}
        onCancel={onCancelMove}
        confirmButton={moveConfirmButton}
        cancelButton={cancelConfirmButton}>
        <Autocomplete
          value={value}
          onChange={(e, newValue) => {
            if (typeof newValue === 'string') {
              setValue({ name: newValue });
            } else if (newValue && newValue.inputValue) {
              // Create a new value from the user input
              setValue({ name: newValue.inputValue, createNew: true });
            } else {
              setValue(newValue);
            }
          }}
          filterOptions={(options, params) => {
            const filtered = filter(options, params);

            const { inputValue } = params;
            // Suggest the creation of a new value
            const isExisting = options.some((option) => inputValue === option.name);
            if (inputValue !== '' && !isExisting) {
              filtered.push({
                inputValue,
                name: t('common.moveFolderConfirmAddNew', {
                  name: inputValue,
                }),
              });
            }

            return filtered;
          }}
          selectOnFocus
          clearOnBlur
          handleHomeEndKeys
          options={folders.filter((item) => item._id !== (folderId || 'z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9'))}
          getOptionLabel={(option) => {
            // Value selected with enter, right from the input
            if (typeof option === 'string') {
              return option;
            }
            // Add "xxx" option created dynamically
            if (option.inputValue) {
              return option.inputValue;
            }
            // Regular option
            return option.name;
          }}
          renderOption={(props, option) => <li {...props}>{option.name}</li>}
          sx={{ width: 300 }}
          freeSolo
          renderInput={(params) => <TextField {...params} label={t('common.moveFolderConfirmSelect')} />}
        />
      </Confirm>
    </>
  );
}

const ImagePreview = styled.div`
  height: 250px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 24px;

  object,
  video {
    pointer-events: none;
    width: auto;
    height: auto;
    max-height: 100%;
    max-width: 100%;
    display: block;
  }
`;
