/* eslint-disable no-console */
/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import Copy from 'copy-to-clipboard';
import styled from '@emotion/styled';

import Typography from '@mui/material/Typography';
import SplitButton from '@arcblock/ux/lib/SplitButton';
import { Confirm } from '@arcblock/ux/lib/Dialog';
import { createImageUrl } from '../libs/api';

export default function ImageActions({ data }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const imageUrl = createImageUrl(data.filename);

  const onCopy = () => {
    Copy(imageUrl);
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
    setOpen(true);
  };

  const onConfirmDelete = () => {
    setOpen(false);
    console.log('confirm to delete');
  };

  const onCancelDelete = () => {
    setOpen(false);
  };

  const onMoveToFolder = () => {
    onConfirmMoveToFolder();
  };

  const onConfirmMoveToFolder = () => {
    console.log('confirm to move');
  };

  const actions = [
    { children: 'Delete', onClick: onDelete },
    { children: 'Move to Folder', onClick: onMoveToFolder },
  ];

  const confirmButton = {
    text: 'Delete',
    props: {
      variant: 'contained',
      color: 'secondary',
    },
  };

  return (
    <>
      <SplitButton size="small" onClick={onCopy} variant="outlined" menu={actions}>
        {copied ? 'Copied' : 'Copy URL'}
      </SplitButton>
      <Confirm
        open={open}
        title="Confirm Delete Image"
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
        confirmButton={confirmButton}>
        <Typography textAlign="left">
          Are you sure you want to delete image <strong>{data.originalname}</strong>, this operation is not recoverable.
        </Typography>
        <ImagePreview>
          <img src={imageUrl} alt={data.originalname} />
        </ImagePreview>
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

  img {
    width: auto;
    height: auto;
    max-height: 100%;
    max-width: 100%;
    display: block;
  }
`;
