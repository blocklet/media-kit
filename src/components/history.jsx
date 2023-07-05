/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable react/jsx-no-target-blank */
/* eslint-disable react/prop-types */
import styled from '@emotion/styled';
import prettyBytes from 'pretty-bytes';
import { format } from 'timeago.js';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';

import Spinner from '@mui/material/CircularProgress';
import Center from '@arcblock/ux/lib/Center';
import Empty from '@arcblock/ux/lib/Empty';

import Grid from '@mui/material/Grid';

import { useUploadContext } from '../contexts/upload';
import { createImageUrl } from '../libs/api';
import Actions from './actions';

function Gallery({ uploads }) {
  return (
    <Grid container spacing={4}>
      {uploads.map((x) => {
        const imageUrl = createImageUrl(x.filename);
        return (
          <Grid key={x._id} item xs={12} sm={6} md={4} xl={3}>
            <div className="doc-wrapper">
              <a href={imageUrl} target="_blank" title={x.originalname}>
                <div className="img-wrapper">
                  <object data={imageUrl} alt={x.originalname} />
                </div>
              </a>
              <div className="img-meta">
                <span className="img-size">{prettyBytes(x.size)}</span>
                <span className="img-time">{format(x.createdAt)}</span>
                <span className="img-copy">
                  <Actions data={x} />
                </span>
              </div>
            </div>
          </Grid>
        );
      })}
    </Grid>
  );
}

export default function Uploads() {
  const { uploads, folders, loading, hasMore, loadMoreUploads, folderId, filterByFolder } = useUploadContext();

  if (loading) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  if (uploads.length === 0) {
    return <Empty>No uploads found</Empty>;
  }

  return (
    <Div>
      {folders.length > 0 && (
        <ButtonGroup variant="outlined" aria-label="outlined button group" style={{ marginBottom: 24 }}>
          <Button onClick={() => filterByFolder('')} variant={folderId === '' ? 'contained' : 'outlined'}>
            All
          </Button>
          {folders.map((x) => (
            <Button
              key={x._id}
              title={x._id}
              onClick={() => filterByFolder(x._id)}
              variant={folderId === x._id ? 'contained' : 'outlined'}>
              {x.name}
            </Button>
          ))}
        </ButtonGroup>
      )}
      <Gallery uploads={uploads} />
      {hasMore && (
        <div className="load-more">
          <Button onClick={loadMoreUploads} disabled={loading} variant="outlined" color="secondary" size="small">
            Load More
          </Button>
        </div>
      )}
    </Div>
  );
}

const Div = styled.div`
  ul {
    margin: 32px auto;
    display: inline-flex;
    flex-direction: row;
    justify-content: space-between;
    list-style-type: none;
    li a {
      border-radius: 7px;
      padding: 0.1rem 1rem;
      border: gray 1px solid;
      margin-right: 8px;
      cursor: pointer;
    }
    li.previous a,
    li.next a,
    li.break a {
      border-color: transparent;
    }
    li.active a {
      background-color: #0366d6;
      border-color: transparent;
      color: white;
      min-width: 32px;
    }
    li.disabled a {
      color: grey;
    }
    li.disable,
    li.disabled a {
      cursor: default;
    }
  }

  .doc-wrapper {
    cursor: pointer;
    border: 1px solid #282c2c;
    padding: 8px;
    border-radius: 5px;

    .img-wrapper {
      height: 250px;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;

      object {
        width: auto;
        height: auto;
        max-height: 100%;
        max-width: 100%;
        display: block;
      }
    }

    .img-meta {
      margin-top: 12px;
      display: flex;
      justify-content: space-between;
    }
    .img-copy {
      width: 120px;
      text-align: right;
    }
  }

  .load-more {
    padding: 24px 0;
    text-align: center;
  }
`;
