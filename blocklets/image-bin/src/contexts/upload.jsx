/* eslint-disable import/no-cycle */
import { createContext, useContext, useRef } from 'react';
import PropTypes from 'prop-types';
import uniqBy from 'lodash/uniqBy';
import debounce from 'lodash/debounce';
import EventEmitter from 'wolfy87-eventemitter';
import { useReactive } from 'ahooks';

import api from '../libs/api';

const UploadContext = createContext({});
const { Provider, Consumer } = UploadContext;

const events = new EventEmitter();

function UploadProvider({ children, pageSize = 12, type = '' }) {
  const uploaderRef = useRef(null);
  const pageState = useReactive({
    folderId: '',
    uploads: [],
    folders: [],
    page: 0,
    loading: false,
    hasMore: true,
  });

  const loadMoreUploads = async () => {
    if (pageState.hasMore) {
      pageState.loading = true;
      pageState.page += 1;
      await api
        .get('/api/uploads', {
          params: {
            page: pageState.page,
            pageSize,
            type,
            folderId: pageState.folderId,
          },
        })
        .then(({ data }) => {
          pageState.hasMore = pageState.page < data.pageCount;
          pageState.uploads = uniqBy([...pageState.uploads, ...data.uploads], '_id');
          pageState.folders = data.folders;
          pageState.loading = false;
        })
        .catch(console.error);
    }

    return pageState;
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

  const currentFolderInfo = pageState.folders?.find(
    (item) => item._id === (pageState.folderId || 'z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9')
  ) || {
    // default is image bin
    name: 'Image Bin',
    did: 'z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9',
  };

  return (
    <Provider
      value={{
        ...pageState,
        uploaderRef,
        currentFolderInfo,
        events,
        prependUpload,
        deleteUpload,
        ensureFolder,
        loadMoreUploads: debounce(loadMoreUploads, 50),
        filterByFolder: (folderId) => {
          window.uploaderComponentId = folderId || window.blocklet?.componentId;
          pageState.uploads = [];
          pageState.folderId = folderId;
          pageState.page = 0;
          pageState.hasMore = true;
          loadMoreUploads();
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
  pageSize: 12,
  type: '',
};

function useUploadContext() {
  const result = useContext(UploadContext);
  return result;
}

export { UploadContext, UploadProvider, Consumer as UploadConsumer, useUploadContext };
