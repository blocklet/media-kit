/* eslint-disable import/no-cycle */
import { createContext, useState, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import uniqBy from 'lodash/uniqBy';
import Center from '@arcblock/ux/lib/Center';
import Spinner from '@mui/material/CircularProgress';
import useAsync from 'react-use/lib/useAsync';
import EventEmitter from 'wolfy87-eventemitter';

import api from '../libs/api';
import { useSessionContext } from './session';

const UploadContext = createContext({});
const { Provider, Consumer } = UploadContext;

const events = new EventEmitter();

function UploadProvider({ children, pageSize = 20, type = '' }) {
  const [uploads, setUploads] = useState([]);
  const [folders, setFolders] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const { session } = useSessionContext();

  const loadInitialPosts = async () => {
    const { data } = await api.get(`/api/uploads?page=1&pageSize=${pageSize}&type=${type}`);
    setUploads(data.uploads);
    setFolders(data.folders);
    setHasMore(data.pageCount > 1);
    return data;
  };

  const loadMoreUploads = () => {
    setLoading(true);
    api
      .get(`/api/uploads?page=${page + 1}&pageSize=${pageSize}&type=${type}`)
      .then(({ data }) => {
        setPage(page + 1);
        setHasMore(page + 1 < data.pageCount);
        setUploads(uniqBy([...uploads, ...data.uploads], '_id'));
        setLoading(false);
      })
      .catch(console.error);
  };

  const prependUpload = (upload) => {
    if (upload) {
      setUploads(uniqBy([upload, ...uploads], '_id'));
      events.emit('upload.added', upload);
    }
  };

  const deleteUpload = (postId) => {
    const index = uploads.findIndex((p) => p._id === postId);
    if (index > -1) {
      setUploads(uniqBy([...uploads.slice(0, index), ...uploads.slice(index + 1)], '_id'));
      events.emit('upload.removed', postId);
    }
  };

  const ensureFolder = async (name) => {
    const exist = folders.some((x) => x.name === name);
    if (exist) {
      return exist;
    }

    const { data: folder } = await api.post('/api/folders', { name });
    setFolders(uniqBy([folder, ...folders], '_id'));

    return folder;
  };

  const state = useAsync(loadInitialPosts, []);
  useEffect(() => loadInitialPosts, [session.user]); // eslint-disable-line

  if (state.loading) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  return (
    <Provider
      value={{
        loading,
        uploads,
        folders,
        events,
        prependUpload,
        deleteUpload,
        ensureFolder,
        loadMoreUploads,
        hasMore,
      }}>
      {children}
    </Provider>
  );
}

UploadProvider.propTypes = {
  children: PropTypes.any.isRequired,
  pageSize: PropTypes.number,
  type: PropTypes.string,
};

UploadProvider.defaultProps = {
  pageSize: 16,
  type: '',
};

function useUploadContext() {
  const result = useContext(UploadContext);
  return result;
}

export { UploadContext, UploadProvider, Consumer as UploadConsumer, useUploadContext };
