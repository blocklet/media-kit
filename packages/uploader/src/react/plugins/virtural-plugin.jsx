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

    // Default options merging
    this.opts = {
      icon: opts.icon || null, // Can be an SVG string or a Preact component function e.g. () => <svg>...</svg>
      restrictions: opts.restrictions || {}, // Default to no specific restrictions
      ...opts,
    };

    this.i18nInit(); // Initialize internationalization and strings

    // Store the icon if provided in options
    if (this.opts.icon) {
      this.icon = this.opts.icon;
    }

    // The core of this plugin is to simply exist as a selectable source
    // and to carry its specific restrictions (this.opts.pluginSpecificRestrictions).
    // The logic for applying these restrictions when this source is selected
    // will be handled in the main uploader.tsx component via the onShowPanel callback.
  }

  render() {}

  // install() {
  //   // Required if the plugin renders a UI that needs to be mounted.
  //   // For example, if target in opts is a DOM element or selector.
  //   // const target = this.opts.target;
  //   // if (target) {
  //   //   this.mount(target, this);
  //   // }
  // }

  // uninstall() {
  //   // Clean up if anything was mounted or set up during install.
  //   // this.unmount();
  // }
}
