import { UIPlugin } from '@uppy/core';

const isSafari = () => {
  return navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');
};

export class SafariPastePlugin extends UIPlugin {
  constructor(uppy, opts) {
    super(uppy, opts);
    this.id = opts?.id || 'safari-paste';
    this.type = 'editor';
  }
  
  onMount() {
    if (isSafari() && this.parent?.handlePaste) {
      document.addEventListener('paste', this.parent.handlePaste)
    }
  }
  
  onUnmount() {
    if (isSafari() && this.parent?.handlePaste) {
      document.removeEventListener('paste', this.parent.handlePaste)
    }
  }
}
