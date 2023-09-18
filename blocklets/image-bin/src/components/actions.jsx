/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import Copy from 'copy-to-clipboard';
import styled from '@emotion/styled';

import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import Toast from '@arcblock/ux/lib/Toast';

import SplitButton from '@arcblock/ux/lib/SplitButton';
import { Confirm } from '@arcblock/ux/lib/Dialog';
import { isValid as isValidDid } from '@arcblock/did';

import api, { createImageUrl } from '../libs/api';
import { useUploadContext } from '../contexts/upload';
import MediaItem from './media-item';

const filter = createFilterOptions();

export default function ImageActions({ data }) {
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [isMoveOpen, setMoveOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [value, setValue] = useState(null);
  const { folders, deleteUpload, ensureFolder, folderId } = useUploadContext();

  const onCopy = () => {
    Copy(createImageUrl(data.filename, 0, 0));
    setCopied(true);
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
        Toast.success('Image deleted successfully');
      })
      .catch((err) => {
        setLoading(false);
        console.warn(err);
        Toast.error(`Image delete failed: ${err.message}`);
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
      Toast.success('Folder created successfully');
      folder = await ensureFolder(value.name);
    }

    await api
      .put(`/api/uploads/${data._id}`, { folderId: folder._id })
      .then(() => {
        setLoading(false);
        setMoveOpen(false);
        deleteUpload(data._id);
        Toast.success('Image updated successfully');
      })
      .catch((err) => {
        setLoading(false);
        Toast.error(`Image updated failed: ${err.message}`);
      });
  };

  const onCancelMove = () => {
    setMoveOpen(false);
    setValue(null);
  };

  const isMediaKitFile =
    (data.folderId || 'z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9') === 'z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9' ||
    !isValidDid(data.folderId);

  const actions = [
    // can't delete other blocklet files
    { children: 'Delete', disabled: !isMediaKitFile, onClick: onDelete },
    { children: 'Move to Folder', disabled: !isMediaKitFile, onClick: onMove },
  ];

  const deleteConfirmButton = {
    text: 'Delete',
    props: {
      variant: 'contained',
      color: 'secondary',
      disabled: loading,
    },
  };

  const moveConfirmButton = {
    text: 'Move',
    props: {
      variant: 'contained',
      color: 'secondary',
      disabled: loading,
    },
  };

  return (
    <>
      <SplitButton size="small" onClick={onCopy} variant="outlined" menu={actions}>
        {copied ? 'Copied' : 'Copy URL'}
      </SplitButton>
      <Confirm
        open={isDeleteOpen}
        title="Confirm Delete Image"
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
        confirmButton={deleteConfirmButton}>
        <Typography textAlign="left">
          Are you sure you want to delete image <strong>{data.originalname}</strong>, this operation is not recoverable.
        </Typography>
        <ImagePreview>
          <MediaItem {...data} />
        </ImagePreview>
      </Confirm>
      <Confirm
        open={isMoveOpen}
        title="Move Image to Folder"
        onConfirm={onConfirmMove}
        onCancel={onCancelMove}
        confirmButton={moveConfirmButton}>
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
                name: `Add "${inputValue}"`,
              });
            }

            return filtered;
          }}
          selectOnFocus
          clearOnBlur
          handleHomeEndKeys
          options={folders.filter((item) => item._id !== folderId)}
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
          renderInput={(params) => <TextField {...params} label="Filter or Create Folder" />}
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
