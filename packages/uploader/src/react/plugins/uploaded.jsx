// @jsxImportSource preact
import { UIPlugin } from '@uppy/core';
import { ProviderViews } from '@uppy/provider-views';
import uniqBy from 'lodash/uniqBy';
import debounce from 'lodash/debounce';
import { api, createImageUrl } from '../../utils';

const initUploadedAPIData = {
  data: [], // origin data
  files: [], // format file
  pageSize: 16,
  page: 1,
  loading: false,
  hasMore: true,
  folderId: '',
};

const initPluginState = {
  authenticated: true,
  files: [],
  folders: [],
  breadcrumbs: [],
  filterInput: '',
  isSearchVisible: false,
  currentSelection: [],
  loading: true,
  loadAllFiles: true,
};
/**
 * Uploaded
 *
 */

class Uploaded extends UIPlugin {
  constructor(uppy, opts) {
    super(uppy, opts);
    this.id = this.opts.id || 'Uploaded';
    this.title = this.opts.title || 'Uploaded';
    this.type = 'acquirer';
    this.uppy = uppy;

    this.uploadedAPIData = { ...initUploadedAPIData };

    this.addUploadItemFlag = true;

    this.icon = () => (
      <svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 1024 1024">
        <path
          d="M145.6 0c-44.8 0-80 36.8-80 81.6V944c0 44.8 35.2 80 80 80h732.8c44.8 0 81.6-35.2 81.6-80V326.4L657.6 0h-512z"
          fill="#49C9A7"
        />
        <path d="M960 326.4v16H755.2s-100.8-20.8-99.2-108.8c0 0 4.8 92.8 97.6 92.8H960z" fill="#49C9A7" />
        <path d="M657.6 0v233.6c0 25.6 17.6 92.8 97.6 92.8H960L657.6 0z" fill="#37BB91" />
        <path
          d="M225.6 859.2V524.8H560v334.4H225.6z m300.8-300.8H259.2v201.6h267.2V558.4z m-153.6 134.4l62.4-84.8 20.8 33.6 20.8-6.4 16 89.6H283.2l56-52.8 33.6 20.8z m-60.8-59.2c-14.4 0-27.2-9.6-27.2-24 0-12.8 12.8-24 27.2-24 14.4 0 25.6 11.2 25.6 24 0 14.4-11.2 24-25.6 24z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  render(state) {
    if (!this.uploadedAPIData.loading && this.uploadedAPIData.files?.length === 0) {
      this.queryUploadedFromMediaKit();
    }

    return (
      <div id="uploaded" className="uploaded">
        {this.view.render(state)}
      </div>
    );
  }

  queryUploadedFromMediaKit = async () => {
    const { pageSize, page, files, hasMore, loading } = this.uploadedAPIData;

    if (hasMore && !loading) {
      // set loading flag
      this.uploadedAPIData.loading = true;
      this.uploadedAPIData.page += 1;

      const folderId = window.uploaderComponentId || (window?.blocklet?.componentId || '').split('/').pop();

      // use image-bin uploads api, so can hard code /api/uploads
      const { data } = await api.get(`/api/uploads`, {
        params: {
          page,
          pageSize,
          folderId,
        },
        headers: {
          'x-component-did': folderId,
        },
      });

      this.uploadedAPIData.loading = false;
      this.uploadedAPIData.hasMore = this.uploadedAPIData.page <= data.pageCount;

      this.uploadedAPIData.files = uniqBy(
        [
          ...files,
          // format data
          ...data.uploads.map((item) => {
            let previewUrl = 'file';

            const { filename, _id, originalname } = item;

            const fileUrl = createImageUrl(filename);

            previewUrl = createImageUrl(filename, 400);

            return {
              ...item,
              // provider view props
              id: _id,
              name: originalname,
              icon: previewUrl,
              previewUrl,
              fileUrl,
            };
          }),
        ],
        '_id'
      );

      this.uploaded.setPluginState({
        files: this.uploadedAPIData.files,
        loading: false,
      });

      this.canConvertImgToObject = true;
    }
  };

  addUploadItem = debounce(
    () => {
      if (this.addUploadItemFlag) {
        const listWrapper = document.querySelector('#uploaded .uppy-ProviderBrowser-list');
        if (listWrapper) {
          // insert upload item to first
          const uploadItem = document.createElement('li');
          uploadItem.className = 'uppy-ProviderBrowserItem';

          uploadItem.innerHTML = `
          <div class="uppy-ProviderBrowserItem-inner" style="background: rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center">
            <svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 0 24 24" width="48px" fill="#ffffff"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
          </div>
        `;

          uploadItem.addEventListener('click', async () => {
            // await this.uppy.getPlugin('upload-dashboard').hideAllPanels();
            await this.uppy.openPlugin('My Device');
          });

          // insert upload item to first
          listWrapper.insertBefore(uploadItem, listWrapper.firstChild);

          this.addUploadItemFlag = false;
        }
      }
    },
    {
      wait: 200,
    }
  );

  convertImgToObject = debounce(
    () => {
      if (this.canConvertImgToObject) {
        const imgElementList = document.querySelectorAll('#uploaded img');

        // hacker uppy image element
        imgElementList.forEach((imgElement) => {
          if (['.mp4', '.webm'].find((item) => imgElement.src?.indexOf(item) > -1)) {
            const videoElement = document.createElement('video');
            videoElement.src = imgElement.src;
            videoElement.width = imgElement.width;
            videoElement.height = imgElement.height;
            videoElement.autoplay = true;
            videoElement.muted = true;
            videoElement.loop = true;
            videoElement.style = 'pointer-events: none;';
            // replace img element
            imgElement.parentNode.replaceChild(videoElement, imgElement);
          }
        });

        this.canConvertImgToObject = false;
      }
    },
    {
      wait: 200,
    }
  );

  update() {
    this.convertImgToObject();
    this.addUploadItem();
  }

  // eslint-disable-next-line class-methods-use-this
  onFirstRender() {
    // do nothing
  }

  resetState = () => {
    this.uploadedAPIData = { ...initUploadedAPIData };
    this.uploaded.setPluginState({ ...initPluginState });
    this.addUploadItemFlag = true;
  };

  install() {
    // provider views
    this.view = new ProviderViews(this, {
      viewType: 'grid',
      showBreadcrumbs: false,
      showFilter: false,
    });

    // uploaded
    this.uploaded = this.view.plugin;

    this.uploaded.setPluginState({ ...initPluginState });

    this.uploaded.uppy.on('dashboard:show-panel', this.resetState);

    // hacker toggleCheckbox
    this.view.toggleCheckbox = (event, file) => {
      const { currentSelection } = this.uploaded.getPluginState();
      const maxNumberOfFiles = this.uploaded.uppy.opts.restrictions.maxNumberOfFiles;
      const canAdd = maxNumberOfFiles ? currentSelection.length < maxNumberOfFiles : true;

      // not include
      if (!currentSelection.find((item) => item._id === file._id)) {
        if (!canAdd) {
          currentSelection.pop();
        }

        this.uploaded.setPluginState({
          currentSelection: [...currentSelection, file],
        });
      } else {
        // remove
        this.uploaded.setPluginState({
          currentSelection: [...currentSelection.filter((item) => item._id !== file._id)],
        });
      }
    };

    // hacker donePicking
    this.view.donePicking = () => {
      const { currentSelection } = this.uploaded.getPluginState();

      this.uppy.emit('uploaded:selected', currentSelection);
      this.uploaded.parent.hideAllPanels();
    };

    // hacker uppy.validateRestrictions
    this.uploaded.uppy.validateRestrictions = () => {
      return false;
    };

    // hacker handle scroll
    this.view.handleScroll = (event) => {
      const { scrollHeight, scrollTop, offsetHeight } = event.target;
      const scrollPosition = scrollHeight - (scrollTop + offsetHeight);
      if (scrollPosition < 30) {
        this.queryUploadedFromMediaKit();
      }
    };

    const { target } = this.opts;

    if (target) {
      this.mount(target, this);
    }
  }

  uninstall() {
    this.unmount();
    this.uploaded.uppy.off('dashboard:show-panel', this.resetState);
  }
}

export default Uploaded;
