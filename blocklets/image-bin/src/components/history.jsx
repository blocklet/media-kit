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
import { useInfiniteScroll, useResponsive } from 'ahooks';

import { useUploadContext } from '../contexts/upload';
import { createImageUrl } from '../libs/api';
import Actions from './actions';

const borderRadius = '4px !important';
const transformY = '4px';

function BlockletLogo(props) {
  const { did, ...restProps } = props;
  const src = `/.well-known/service/blocklet/logo-bundle/${did}`;
  return <img width={24} height={24} src={src} alt={did} {...restProps} />;
}

function Gallery({ uploads }) {
  // @ts-ignore
  const isMobile = useMediaQuery((theme) => theme?.breakpoints?.down('md'));

  const responsive = useResponsive();
  // eslint-disable-next-line no-nested-ternary
  const cols = responsive.xl ? 4 : responsive.md ? 3 : 1;

  const gap = 16;
  return (
    <ImageList
      // variant="masonry"
      cols={cols}
      gap={gap}
      sx={{
        pt: transformY,
        mt: `calc(16px - ${transformY})`,
        overflow: 'hidden',
      }}>
      {uploads.map((x) => (
        <ImageListItem
          key={x._id}
          sx={{
            border: '1px solid rgba(0,0,0,0.1)',
            position: 'relative',
            borderRadius,
            '&, & *': {
              transition: 'all 0.25s ease-in-out',
            },
            '&:hover': {
              transform: `translateY(-${transformY})`,
              border: (theme) => `1px solid ${theme?.palette?.primary?.main}`,
              // boxShadow: (theme) => `4px 4px 0 0px ${theme?.palette?.primary?.main}`,
              object: {
                animation: 'scroll 2s linear 1', // 'scroll 4s linear infinite',
                '@keyframes scroll': {
                  '0%': {
                    objectPosition: 'center',
                  },
                  '25%': {
                    objectPosition: 'top',
                  },
                  '75%': {
                    objectPosition: 'bottom',
                  },
                  '100%': {
                    objectPosition: 'center',
                  },
                },
              },
            },
          }}>
          <a
            href={createImageUrl(x.filename, 0, 0)}
            target="_blank"
            title={x.originalname}
            style={{
              width: '100%',
              position: 'relative',
              height: isMobile
                ? 'calc(100vw - 24px - 24px)'
                : `calc((100vw - 255px - 24px - 24px - (16px) * ${cols - 1}) / ${cols})`,
            }}>
            <object
              width="100%"
              height="100%"
              data={createImageUrl(x.filename, 500)}
              alt={x.originalname}
              // loading="lazy"
              style={{
                WebkitUserDrag: 'none',
                objectFit: 'cover',
              }}
            />
            <BlockletLogo
              did={x.folderId}
              style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                opacity: 0.85,
                // borderRadius,
              }}
              width={24}
              height={24}
            />
          </a>
          <ImageListItemBar
            position="below"
            title={
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 14,
                }}>
                {prettyBytes(x.size)}
              </Box>
            }
            subtitle={format(x.createdAt)}
            actionIcon={
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                }}>
                <Actions data={x} />
              </Box>
            }
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 1.5,
              borderTop: '1px solid rgba(0,0,0,0.1)',
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
        overflowY: 'auto',
        padding: '24px',
      }}>
      <Box>
        <ButtonGroup
          size={isMobile ? 'small' : 'medium'}
          variant="outlined"
          aria-label="outlined button group"
          sx={{
            flexWrap: 'wrap',
            '&  button': {
              border: '1px solid currentColor !important',
              mr: 1,
              mb: 1,
              ml: '0px !important',
              borderRadius,
            },
          }}>
          <Button onClick={() => filterByFolder('')} variant={folderId === '' ? 'contained' : 'outlined'}>
            All
          </Button>
          {[...folders].map((x) => (
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
        <Box>
          <Gallery uploads={uploads} />
          {loading && (
            <div className="load-more">
              <Spinner />
            </div>
          )}
          {!uploadState.hasMore && <Divider sx={{ mt: 2.5, color: 'rgba(0, 0, 0, 0.3)' }}>No More</Divider>}
        </Box>
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
