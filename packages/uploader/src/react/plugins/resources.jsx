// @jsxImportSource preact
import { UIPlugin } from '@uppy/core';
import { ProviderViews } from '@uppy/provider-views';
import uniqBy from 'lodash/uniqBy';
import debounce from 'lodash/debounce';
import toUpper from 'lodash/toUpper';
import { api, createImageUrl } from '../../utils';

const initAPIData = {
  initialized: false,
  data: [], // origin data
  files: [], // format file
  pageSize: 16,
  page: 1,
  loading: false,
  hasMore: true,
  folderId: '',
  componentDid: '',
  components: [],
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

const buttonStyle = {
  padding: '5px 15px',
  marginRight: '8px',
  marginTop: '8px',
  borderRadius: '4px',
  cursor: 'pointer',
  border: '1px solid rgb(29, 193, 199)',
  color: 'rgb(29, 193, 199)',
  backgroundColor: 'transparent',
  fontSize: '14px',
  lineHeight: '24.5px',
  fontWeight: 'bold',
};

const activeButtonStyle = {
  ...buttonStyle,
  color: '#fff',
  backgroundColor: 'rgb(29, 193, 199)',
};

/**
 * Resources
 *
 */
class Resources extends UIPlugin {
  constructor(uppy, opts) {
    super(uppy, opts);
    this.id = this.opts.id || 'Resources';
    this.title = this.opts.title || 'Resources';
    this.params = this.opts.params || {};
    this.type = 'acquirer';
    this.uppy = uppy;
    this.componentDid = '';

    this.apiData = { ...initAPIData };

    this.icon = () => (
      <svg
        t="1700146012231"
        class="icon"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="15673"
        width="200"
        height="200">
        <path
          d="M403.2 130.133333h-187.733333c-46.933333 0-85.333333 38.4-85.333334 85.333334v187.733333c0 46.933333 38.4 85.333333 85.333334 85.333333h187.733333c46.933333 0 85.333333-38.4 85.333333-85.333333v-187.733333c0-49.066667-38.4-85.333333-85.333333-85.333334zM426.666667 390.4c0 19.2-17.066667 36.266667-36.266667 36.266667h-160c-21.333333 0-38.4-17.066667-38.4-36.266667v-162.133333c0-19.2 17.066667-36.266667 36.266667-36.266667h160c19.2 0 36.266667 17.066667 36.266666 36.266667v162.133333z"
          fill="#0171F1"
          p-id="15674"></path>
        <path
          d="M808.533333 130.133333h-187.733333c-46.933333 0-85.333333 38.4-85.333333 85.333334v187.733333c0 46.933333 38.4 85.333333 85.333333 85.333333h187.733333c46.933333 0 85.333333-38.4 85.333334-85.333333v-187.733333c0-49.066667-36.266667-85.333333-85.333334-85.333334zM832 390.4c0 19.2-17.066667 36.266667-36.266667 36.266667h-160c-19.2 0-36.266667-17.066667-36.266666-36.266667v-162.133333c-2.133333-19.2 14.933333-36.266667 34.133333-36.266667h160c19.2 0 36.266667 17.066667 36.266667 36.266667v162.133333zM403.2 535.466667h-187.733333c-46.933333 0-85.333333 38.4-85.333334 85.333333V810.666667c0 46.933333 38.4 85.333333 85.333334 85.333333h187.733333c46.933333 0 85.333333-38.4 85.333333-85.333333v-189.866667c0-46.933333-38.4-85.333333-85.333333-85.333333zM426.666667 795.733333c0 21.333333-17.066667 36.266667-36.266667 36.266667h-162.133333c-21.333333 0-36.266667-17.066667-36.266667-36.266667v-162.133333c0-21.333333 17.066667-36.266667 36.266667-36.266667h162.133333c19.2 0 36.266667 17.066667 36.266667 36.266667v162.133333z"
          fill="#55ABE5"
          p-id="15675"></path>
        <path
          d="M808.533333 535.466667h-187.733333c-46.933333 0-85.333333 38.4-85.333333 85.333333V810.666667c0 46.933333 38.4 85.333333 85.333333 85.333333h187.733333c46.933333 0 85.333333-38.4 85.333334-85.333333v-189.866667c0-46.933333-36.266667-85.333333-85.333334-85.333333zM832 795.733333c0 21.333333-17.066667 36.266667-36.266667 36.266667h-162.133333c-19.2 0-36.266667-17.066667-36.266667-36.266667v-162.133333c0-21.333333 17.066667-36.266667 36.266667-36.266667h162.133333c21.333333 0 36.266667 17.066667 36.266667 36.266667v162.133333z"
          fill="#0171F1"
          p-id="15676"></path>
      </svg>
    );
  }

  render(state) {
    if (!this.apiData.loading && !this.apiData.initialized) {
      this.queryResources();
    }

    return (
      <div id="resources" className="uploaded">
        <div
          style={{
            padding: this.apiData.components.length ? '12px' : '0',
            backgroundColor: '#fff',
            display: 'flex',
            flexWrap: 'wrap',
            marginTop: '-8px',
          }}>
          {this.apiData.components.map((item) => (
            <button
              style={this.apiData.componentDid === item.did ? activeButtonStyle : buttonStyle}
              id={item.componentDid}
              onClick={() => {
                if (this.apiData.componentDid !== item.did) {
                  this.apiData.componentDid = item.did;
                  this.queryResources();
                }
              }}>
              {toUpper(item.name)}
            </button>
          ))}
        </div>
        {this.view.render(state)}
      </div>
    );
  }

  queryResources = async () => {
    if (!this.apiData.loading) {
      // set loading flag
      this.apiData.loading = true;

      // use image-bin uploads api, so can hard code /api/uploads
      const { data } = await api.get(`/api/resources`, {
        params: {
          componentDid: this.apiData.componentDid,
        },
      });

      this.apiData.loading = false;
      this.apiData.initialized = true;
      this.apiData.components = data.components || [];
      this.apiData.componentDid = data.componentDid || '';
      this.apiData.files = uniqBy(
        [
          // format data
          ...data.resources.map((item) => {
            let previewUrl = 'file';

            const { filename } = item;

            const fileUrl = createImageUrl(filename);

            previewUrl = createImageUrl(filename, 400);

            return {
              filename,
              _id: filename,
              id: filename,
              name: filename,
              icon: previewUrl,
              previewUrl,
              fileUrl,
            };
          }),
        ],
        'id'
      );

      this.resources.setPluginState({
        files: this.apiData.files,
        loading: false,
      });
    }
  };

  update() {}

  // eslint-disable-next-line class-methods-use-this
  onFirstRender() {
    // do nothing
  }

  resetState = () => {
    this.apiData = { ...initAPIData };
    this.resources.setPluginState({ ...initPluginState });
  };

  install() {
    // provider views
    this.view = new ProviderViews(this, {
      provider: {},
      viewType: 'grid',
      showBreadcrumbs: false,
      showFilter: false,
    });

    // resources
    this.resources = this.view.plugin;

    this.resources.setPluginState({ ...initPluginState });

    this.resources.uppy.on('dashboard:show-panel', this.resetState);

    // hacker toggleCheckbox
    this.view.toggleCheckbox = (event, file) => {
      const { currentSelection } = this.resources.getPluginState();
      const maxNumberOfFiles = this.resources.uppy.opts.restrictions.maxNumberOfFiles;
      const canAdd = maxNumberOfFiles ? currentSelection.length < maxNumberOfFiles : true;

      // not include
      if (!currentSelection.find((item) => item.id === file.id)) {
        if (!canAdd) {
          currentSelection.pop();
        }

        this.resources.setPluginState({
          currentSelection: [...currentSelection, file],
        });
      } else {
        // remove
        this.resources.setPluginState({
          currentSelection: [...currentSelection.filter((item) => item.id !== file.id)],
        });
      }
    };

    // hacker uppy.validateRestrictions
    this.resources.uppy.validateRestrictions = () => {
      return false;
    };

    // hacker donePicking
    this.view.donePicking = () => {
      const { currentSelection } = this.resources.getPluginState();
      this.uppy.emit('uploaded:selected', currentSelection);
      this.resources.parent.hideAllPanels();
    };

    const { target } = this.opts;

    if (target) {
      this.mount(target, this);
    }
  }

  uninstall() {
    this.unmount();
    this.resources.uppy.off('dashboard:show-panel', this.resetState);
  }
}

export default Resources;
