/* eslint-disable react/jsx-no-target-blank */
/* eslint-disable react/prop-types */
import React from 'react';
import joinUrl from 'url-join';
import styled from 'styled-components';
import prettyBytes from 'pretty-bytes';
import { format } from 'timeago.js';

import Spinner from '@arcblock/ux/lib/Spinner';
import Center from '@arcblock/ux/lib/Center';
import Empty from '@arcblock/ux/lib/Empty';
import Button from '@arcblock/ux/lib/Button';

import Grid from '@material-ui/core/Grid';

import { useUploadContext } from '../contexts/upload';
import Copy from './copy';

const createImageUrl = (host = window.location.origin, prefix, filename) => {
  const obj = new URL(host);
  obj.pathname = joinUrl(prefix, '/uploads/', filename);
  return obj.href;
};

function Gallery({ uploads }) {
  const { prefix = '/', CDN_HOST = '' } = window.blocklet;
  return (
    <Grid container spacing={4}>
      {uploads.map((x) => {
        const imageUrl = createImageUrl(CDN_HOST, prefix, x.filename);
        return (
          <Grid key={x._id} item xs={12} sm={6} md={3} xl={2}>
            <div className="doc-wrapper">
              <a href={imageUrl} target="_blank" title={x.originalname}>
                <div className="img-wrapper">
                  <img src={imageUrl} alt={x.originalname} />
                </div>
              </a>
              <div className="img-meta">
                <span className="img-size">{prettyBytes(x.size)}</span>
                <span className="img-time">{format(x.createdAt)}</span>
                <span className="img-copy">
                  <Copy content={imageUrl} />
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
  const { uploads, loading, hasMore, loadMoreUploads } = useUploadContext();

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

      img {
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
      width: 90px;
      text-align: right;
    }
  }

  .load-more {
    padding: 24px 0;
    text-align: center;
  }
`;
