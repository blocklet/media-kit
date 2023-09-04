// @jsxImportSource preact
import { UIPlugin } from '@uppy/core';
import { Provider } from '@uppy/companion-client';
import { ProviderViews } from '@uppy/provider-views';

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

    Provider.initPlugin(this, opts, {});

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
    return <div className="uploaded">{this.view.render(state)}</div>;
  }

  // eslint-disable-next-line class-methods-use-this
  onFirstRender() {
    // do nothing
  }

  install() {
    // provider views
    this.view = new ProviderViews(this, {
      viewType: 'grid',
      showBreadcrumbs: false,
      showFilter: true,
    });

    // uploaded
    this.uploaded = this.view.plugin;

    this.uploaded.setPluginState({
      authenticated: true,
      files: [
        // {
        //   name: '1',
        //   id: '1',
        //   icon: 'https://bbqasj5yrz4unkundhmuwzaq5krgooiatbtyzaetio4.did.abtnet.io/uploads/22352457ab537e081fbcc51c19bb591e.gif',
        // },
      ],
      folders: [],
      breadcrumbs: [],
      filterInput: '',
      isSearchVisible: true,
      currentSelection: [],
    });

    // hacker donePicking
    this.view.donePicking = () => {
      const { currentSelection } = this.uploaded.getPluginState();
      this.uppy.emit('uploaded:selected', currentSelection);
      this.uploaded.parent.hideAllPanels();
    };

    const { target } = this.opts;

    if (target) {
      this.mount(target, this);
    }
  }

  uninstall() {
    this.unmount();
  }
}

export default Uploaded;
