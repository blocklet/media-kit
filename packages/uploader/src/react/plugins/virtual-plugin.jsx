// @jsxImportSource preact
import { UIPlugin } from '@uppy/core';
// import { h } from 'preact'; // Uncomment if you want to provide a Preact icon function

export default class VirtualPlugin extends UIPlugin {
  constructor(uppy, opts) {
    super(uppy, opts);

    // The 'id' in opts is crucial for Uppy to identify this plugin instance.
    // It's also used by our custom logic in uploader.tsx to manage active restrictions.
    this.id = opts.id;
    this.title = opts.title;

    this.type = 'acquirer'; // This makes it appear in the list of file sources in the Dashboard
    this.uppy = uppy;

    this.i18nInit(); // Initialize internationalization and strings

    this.autoHide = opts.autoHide ?? true;

    if (typeof opts.icon === 'string') {
      this.icon = () => {
        return (
          <div
            dangerouslySetInnerHTML={{ __html: opts.icon }}
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
        );
      };
    }
  }

  getDashboard() {
    return this.uppy.getPlugin(this.id)?.parent;
  }

  render() {
    if (this.autoHide && this.getDashboard()?.hideAllPanels) {
      this.getDashboard().hideAllPanels();
    }

    return <div id={this.id} className="uppy-VirtualPlugin"></div>;
  }

  update() {}

  // eslint-disable-next-line class-methods-use-this
  onFirstRender() {
    // do nothing
  }

  uninstall() {
    this.unmount();
  }
}
