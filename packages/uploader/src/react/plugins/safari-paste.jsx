import { UIPlugin } from '@uppy/core';

export class SafariPastePlugin extends UIPlugin {
  constructor(uppy, opts) {
    super(uppy, opts);
    this.id = opts?.id || 'safari-paste';
    this.type = 'editor';
  }
  
  onMount() {
    // if (safari) // todo
    this.parent.handlePasteOnBody = this.parent.handlePaste
  }
}
