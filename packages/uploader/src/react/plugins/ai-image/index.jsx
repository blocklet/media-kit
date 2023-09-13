// @jsxImportSource preact
import { UIPlugin } from '@uppy/core';
import { ProviderViews } from '@uppy/provider-views';
import uniqBy from 'lodash/uniqBy';
import { api, createImageUrl } from '../../../utils';

const initAIImageAPIData = {
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
 * AIImage
 *
 */
class AIImage extends UIPlugin {
  constructor(uppy, opts) {
    super(uppy, opts);
    this.id = this.opts.id || 'AIImage';
    this.title = this.opts.title || 'AI Image';
    this.type = 'acquirer';
    this.uppy = uppy;

    this.uploadedAPIData = { ...initAIImageAPIData };

    this.icon = () => (
      <svg width="20" height="20" viewBox="0 0 24 24">
        <g fill="none" stroke="#a482fe" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
          <path d="M15 8h.01M10 21H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v5" />
          <path d="m3 16l5-5c.928-.893 2.072-.893 3 0l1 1m2 9v-4a2 2 0 1 1 4 0v4m-4-2h4m3-4v6" />
        </g>
      </svg>
    );
  }

  render(state) {
    if (!this.uploadedAPIData.loading && this.uploadedAPIData.files?.length === 0) {
      this.queryAIImageFromAIKit();
    }

    return (
      <div id="ai-image" className="ai-image">
        {/* {this.view.render(state)} */}
      </div>
    );
  }

  queryAIImageFromAIKit = async () => {
    const { pageSize, page, files, hasMore, loading } = this.uploadedAPIData;

    if (hasMore && !loading) {
      // set loading flag
      this.uploadedAPIData.loading = true;
      this.uploadedAPIData.page += 1;

      const folderId = (window?.blocklet?.componentId || '').split('/').pop();

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
            const { filename, _id, originalname, mimetype } = item;
            let previewUrl = 'file';
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

  update() {
    // do noting
  }

  // eslint-disable-next-line class-methods-use-this
  onFirstRender() {
    // do nothing
  }

  resetState = () => {
    this.uploadedAPIData = { ...initAIImageAPIData };
    this.uploaded.setPluginState({ ...initPluginState });
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

    this.uploaded.uppy.on('dashboard:show-panel', () => {
      this.resetState();
    });

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
        this.queryAIImageFromAIKit();
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

export default AIImage;
