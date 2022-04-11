/* eslint-disable no-console */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import joinUrl from 'url-join';
import Paginator from 'react-paginate';
import styled from 'styled-components';
import useAsync from 'react-use/lib/useAsync';

import Spinner from '@arcblock/ux/lib/Spinner';
import Center from '@arcblock/ux/lib/Center';
import Grid from '@material-ui/core/Grid';

import api from '../libs/api';

function Gallery({ docs }) {
  return (
    <Grid container spacing={3}>
      {docs.map((x) => (
        <Grid key={x._id} item xs={12} sm={6} md={3}>
          <div className="doc-wrapper">
            <div className="img-wrapper">
              <img src={joinUrl('/uploads/', x.filename)} alt={x.originalname} />
            </div>
          </div>
        </Grid>
      ))}
    </Grid>
  );
}

const cache = {};

export default function Uploads({ pageSize = 8 }) {
  const [docs, setDocs] = useState([]);
  const [page, setPage] = useState(1);

  const state = useAsync(async () => {
    const { data } = await api.get(`/api/uploads?page=1&pageSize=${pageSize}`);
    cache[data.page] = data.docs;
    setDocs(data.docs);
    return data;
  }, []);

  console.log(state);

  useEffect(() => {
    if (cache[page]) {
      setDocs(cache[page]);
    } else {
      api.get(`/api/uploads?page=${page}&pageSize=${pageSize}`).then(({ data }) => {
        cache[page] = data.docs;
        setDocs(data.docs);
      });
    }
  }, [page]);

  const onSelectPage = (e) => setPage(e.selected + 1);

  if (state.loading) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  return (
    <Div>
      <Gallery docs={docs} />
      {state.value.pageCount > 1 && (
        <Paginator
          breakLabel="..."
          nextLabel="next >"
          initialPage={page - 1}
          onPageChange={onSelectPage}
          pageRangeDisplayed={10}
          pageCount={state.value.pageCount}
          previousLabel="< previous"
          renderOnZeroPageCount={null}
        />
      )}
    </Div>
  );
}

const Div = styled.div`
  ul {
    margin: 24px auto;
    display: inline-flex;
    flex-direction: row;
    justify-content: space-between;
    list-style-type: none;
    li a {
      border-radius: 7px;
      padding: 0.1rem 1rem;
      border: gray 1px solid;
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
    .img-wrapper {
      width: 100%;
      height: 250px;
      display: flex;
      justify-content: center;
      align-items: center;

      img {
        width: 100%;
        height: auto;
        max-height: 250px;
      }
    }
  }
`;
