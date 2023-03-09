/* eslint-disable import/no-cycle */
import { createContext, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import uniqBy from 'lodash/uniqBy';
import Center from '@arcblock/ux/lib/Center';
import Spinner from '@mui/material/CircularProgress';
import useAsync from 'react-use/lib/useAsync';
import EventEmitter from 'wolfy87-eventemitter';
import { useReactive } from 'ahooks';

import api from '../libs/api';
import { useSessionContext } from './session';

const UploadContext = createContext({});
const { Provider, Consumer } = UploadContext;

const events = new EventEmitter();

function UploadProvider({ children, pageSize = 20, type = '' }) {
  const pageState = useReactive({
    folderId: '',
    uploads: [],
    folders: [],
    page: 1,
    loading: false,
    hasMore: false,
  });
  const { session } = useSessionContext();

  const loadInitialPosts = async (_fid = pageState.folderId) => {
    const { data } = await api.get(`/api/uploads?page=1&pageSize=${pageSize}&type=${type}&folderId=${_fid}`);
    pageState.uploads = data.uploads;
    pageState.folders = data.folders;
    pageState.hasMore = data.pageCount > 1;
    return data;
  };

  const loadMoreUploads = () => {
    pageState.loading = true;
    api
      .get(`/api/uploads?page=${pageState.page + 1}&pageSize=${pageSize}&type=${type}&folderId=${pageState.folderId}`)
      .then(({ data }) => {
        pageState.page += 1;
        pageState.hasMore = state.page + 1 < data.pageCount;
        pageState.uploads = uniqBy([...pageState.uploads, ...data.uploads], '_id');
        pageState.loading = false;
      })
      .catch(console.error);
  };

  const prependUpload = (upload) => {
    if (upload) {
      pageState.uploads = uniqBy([upload, ...pageState.uploads], '_id');
      events.emit('upload.added', upload);
    }
  };

  const deleteUpload = (postId) => {
    const index = pageState.uploads.findIndex((p) => p._id === postId);
    if (index > -1) {
      pageState.uploads = uniqBy([...pageState.uploads.slice(0, index), ...pageState.uploads.slice(index + 1)], '_id');
      events.emit('upload.removed', postId);
    }
  };

  const ensureFolder = async (name) => {
    const exist = pageState.folders.some((x) => x.name === name);
    if (exist) {
      return exist;
    }

    const { data: folder } = await api.post('/api/folders', { name });
    pageState.folders = uniqBy([folder, ...pageState.folders], '_id');

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
        ...pageState,
        events,
        prependUpload,
        deleteUpload,
        ensureFolder,
        loadMoreUploads,
        filterByFolder: (x) => {
          pageState.folderId = x;
          loadInitialPosts(x);
        },
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
