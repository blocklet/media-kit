/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable react/jsx-no-target-blank */
/* eslint-disable react/prop-types */
import styled from '@emotion/styled';
import prettyBytes from 'pretty-bytes';
import { format } from 'timeago.js';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import ButtonGroup from '@mui/material/ButtonGroup';
import { useRef } from 'react';
import Spinner from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Empty from '@arcblock/ux/lib/Empty';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useInfiniteScroll } from 'ahooks';

import { useUploadContext } from '../contexts/upload';
import { createImageUrl } from '../libs/api';
import Actions from './actions';

function BlockletLogo(props) {
  const { did, ...restProps } = props;
  const src = `/.well-known/service/blocklet/logo-bundle/${did}`;
  return <img width={24} height={24} src={src} alt={did} {...restProps} />;
}

function Gallery({ uploads }) {
  // @ts-ignore
  const isMobile = useMediaQuery((theme) => theme?.breakpoints?.down('md'));

  return (
    <ImageList variant="masonry" cols={isMobile ? 1 : 3} gap={16}>
      {uploads.map((x) => (
        <ImageListItem
          key={x._id}
          sx={{
            border: '1px solid rgba(0,0,0,0.1)',
            position: 'relative',
            borderRadius: '4px',
            '&, & *': {
              transition: 'all 0.25s ease-in-out',
            },
            '&:hover': {
              transform: 'translateY(-4px) ',
              border: (theme) => `1px solid ${theme.palette.primary.main}`,
              // boxShadow: (theme) => `4px 4px 0 0px ${theme.palette.primary.main}`,
            },
          }}>
          <a href={createImageUrl(x.filename, 0, 0)} target="_blank" title={x.originalname}>
            <object
              width="100%"
              height="100%"
              data={createImageUrl(x.filename, 500)}
              alt={x.originalname}
              loading="lazy"
              style={{
                WebkitUserDrag: 'none',
                objectFit: 'cover',
                minWidth: 200,
                minHeight: 200,
                overflow: 'hidden',
              }}
            />
          </a>
          <ImageListItemBar
            position="below"
            title={<>{prettyBytes(x.size)}</>}
            subtitle={format(x.createdAt)}
            actionIcon={
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                }}>
                <BlockletLogo
                  did={x.folderId}
                  style={{
                    marginRight: 8,
                  }}
                  width={32}
                  height={32}
                />
                <Actions data={x} />
              </Box>
            }
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 1.5,
              borderTop: '1px solid rgba(0,0,0,0.1)',
              mt: '-6px',
              '& .MuiImageListItemBar-titleWrap': {
                py: 1,
                '& > div': {
                  lineHeight: '1.25',
                },
              },
            }}
          />
        </ImageListItem>
      ))}
    </ImageList>
  );
}

export default function Uploads() {
  const uploadState = useUploadContext();

  // @ts-ignore
  const isMobile = useMediaQuery((theme) => theme?.breakpoints?.down('md'));

  const { uploads, folders, loading, loadMoreUploads, folderId, filterByFolder } = uploadState;
  const wrapperRef = useRef(null);

  useInfiniteScroll(loadMoreUploads, {
    target: wrapperRef,
    isNoMore: () => {
      return !uploadState.hasMore;
    },
  });

  return (
    <Div
      ref={wrapperRef}
      style={{
        height: 'calc(100vh - 64px - 80px)',
        padding: '24px',
        overflowY: 'auto',
      }}>
      <Box>
        <ButtonGroup size={isMobile ? 'small' : 'medium'} variant="outlined" aria-label="outlined button group">
          <Button onClick={() => filterByFolder('')} variant={folderId === '' ? 'contained' : 'outlined'}>
            All
          </Button>
          {folders.map((x) => (
            <Button
              key={x._id}
              title={x._id}
              onClick={() => filterByFolder(x._id)}
              startIcon={<BlockletLogo did={x._id} />}
              variant={folderId === x._id ? 'contained' : 'outlined'}>
              {x.name}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      {uploads.length === 0 ? (
        <Empty>No Uploads Found</Empty>
      ) : (
        <>
          <Gallery uploads={uploads} />
          {loading && (
            <div className="load-more">
              <Spinner />
            </div>
          )}
          {!uploadState.hasMore && <Divider sx={{ mt: 2.5, color: 'rgba(0, 0, 0, 0.3)' }}>No More</Divider>}
        </>
      )}
    </Div>
  );
}

const Div = styled.div`
  .load-more {
    padding: 24px 0;
    text-align: center;
  }
`;
