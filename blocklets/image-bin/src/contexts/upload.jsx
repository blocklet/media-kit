/* eslint-disable import/no-cycle */
import { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import uniqBy from 'lodash/uniqBy';
import debounce from 'lodash/debounce';
import EventEmitter from 'wolfy87-eventemitter';
import { useReactive } from 'ahooks';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useSearchParams } from 'react-router-dom';

import api from '../libs/api';

const UploadContext = createContext({});
const { Provider, Consumer } = UploadContext;

const events = new EventEmitter();

function UploadProvider({ children, pageSize = 12, type = '' }) {
  const { t } = useLocaleContext();
  const [searchParams] = useSearchParams();
  const pageState = useReactive({
    folderId: '',
    uploads: [],
    folders: [],
    page: 0,
    loading: false,
    hasMore: true,
  });

  const tabs = [
    { key: 'bucket', value: t('common.buckets') },
    { key: 'resource', value: t('common.resources') },
  ];
  const [tab, setTab] = useState('bucket');

  const setImageBinToMediaKit = (item) => {
    if (item._id === 'z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9') {
      return {
        ...item,
        name: 'Media Kit',
      };
    }

    return item;
  };

  const loadMoreUploads = async () => {
    if (pageState.hasMore) {
      pageState.loading = true;
      pageState.page += 1;
      try {
        await api
          .get('/api/uploads', {
            params: {
              page: pageState.page,
              pageSize,
              type,
              folderId: pageState.folderId,
              createdBy: searchParams.get('createdBy') || null,
            },
          })
          .then(({ data }) => {
            pageState.hasMore = pageState.page < data.pageCount;
            pageState.uploads = uniqBy([...pageState.uploads, ...data.uploads], '_id');
            pageState.folders = data.folders?.map?.(setImageBinToMediaKit);
            pageState.loading = false;
          });
      } catch (e) {
        console.error(e);
      } finally {
        pageState.loading = false;
      }
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
    pageState.folders = uniqBy([folder, ...pageState.folders], '_id')?.map(setImageBinToMediaKit);

    return folder;
  };

  const currentFolderInfo = pageState.folders?.find(
    (item) => item._id === (pageState.folderId || 'z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9')
  ) || {
    // default is image bin
    name: 'Media Kit',
    did: 'z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9',
  };

  return (
    <Provider
      value={{
        ...pageState,
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
        tabs,
        tab,
        setTab,
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
