/* eslint-disable import/no-extraneous-dependencies */
import { Skeleton } from '@mui/material';
import { forwardRef, useRef } from 'react';
import { useReactive } from 'ahooks';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import styled from '@emotion/styled';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
// import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleTwoToneIcon from '@mui/icons-material/CheckCircleTwoTone';
import Box from '@mui/material/Box';

const LoadingImage = forwardRef(
  (
    {
      onDelete,
      selected,
      onLoad,
      src,
      width,
      ...rest
    }: {
      onDelete: (src: string) => void;
      selected: boolean;
      onLoad?: () => void;
      src: string;
      [key: string]: any;
    },
    ref: any
  ) => {
    const imageRef = useRef(null);
    const state = useReactive({
      loading: true,
    });

    return (
      <div style={{ position: 'relative' }} ref={ref || imageRef}>
        <div
          className="lazy-image-wrapper"
          style={{
            visibility: state.loading ? 'hidden' : 'visible',
            background: '#f4f4f4',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <img
            alt=""
            src={src}
            {...rest}
            onLoad={() => {
              state.loading = false;
              try {
                onLoad?.();
              } catch (error) {
                console.error('image onLoad error: ', error);
              }
            }}
            loading="eager" // must be eager to make sure the image is loaded
          />
        </div>
        {state.loading && (
          <Skeleton
            className="lazy-image-skeleton"
            animation="wave"
            variant="rectangular"
            style={{
              width: width,
              height: width,
              position: 'absolute',
              top: 0,
            }}
          />
        )}

        <DeleteButton onClick={() => onDelete(src)} sx={{ position: 'absolute', left: 10, bottom: 10 }}>
          <DeleteIcon sx={{ fontSize: 20 }} />
        </DeleteButton>

        <Box sx={{ position: 'absolute', right: 10, top: 10 }} onClick={rest?.onClick}>
          {selected ? (
            <CheckCircleIcon sx={{ fontSize: 30, color: '#2482F6' }} />
          ) : (
            <RadioButtonUncheckedIcon sx={{ fontSize: 30, color: '#fff' }} />
          )}
        </Box>
      </div>
    );
  }
);

export default LoadingImage;

const DeleteButton = styled(IconButton)`
  height: 36px;
  width: 36px;
  padding: 0;
  background: rgba(0, 0, 0, 0.42);
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
  color: #f7f8f8;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 6px;

  &:hover {
    background: rgba(0, 0, 0, 0.69);
  }
`;

const CheckCircleIcon = styled(CheckCircleTwoToneIcon)`
  & > svg > path:first-child {
    opacity: 1;
  }
`;
