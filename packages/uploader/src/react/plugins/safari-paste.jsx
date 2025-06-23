import { UIPlugin } from '@uppy/core';

const isSafari = () => {
  return navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');
};

export class SafariPastePlugin extends UIPlugin {
  originalHandlePasteOnBody = null
  constructor(uppy, opts) {
    super(uppy, opts);
    this.id = opts?.id || 'safari-paste';
    this.type = 'editor';
  }
  
  onMount() {
    if (isSafari() && this.parent?.handlePaste && this.parent?.handlePasteOnBody) {
      this.originalHandlePasteOnBody = this.parent.handlePasteOnBody
      this.parent.handlePasteOnBody = this.parent.handlePaste
    }
  }
  
  onUnmount() {
    if (this.originalHandlePasteOnBody) {
      this.parent.handlePasteOnBody = this.originalHandlePasteOnBody
    }
  }
}
