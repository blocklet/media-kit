// @jsxImportSource preact
import { UIPlugin } from '@uppy/core';
import { ProviderViews } from '@uppy/provider-views';
import uniqBy from 'lodash/uniqBy';
import debounce from 'lodash/debounce';
import { mediaKitApi, createImageUrl, parseStringToDot, mediaKitMountPoint } from '../../utils';

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

const PDF_ICON = `
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    aria-hidden="true"
    role="img"
    class="iconify iconify--vscode-icons MuiBox-root css-cv9zqr"
    width="1em"
    height="1em"
    viewBox="0 0 32 32">
    <path fill="#909090" d="m24.1 2.072l5.564 5.8v22.056H8.879V30h20.856V7.945z"></path>
    <path fill="#f4f4f4" d="M24.031 2H8.808v27.928h20.856V7.873z"></path>
    <path fill="#7a7b7c" d="M8.655 3.5h-6.39v6.827h20.1V3.5z"></path>
    <path fill="#dd2025" d="M22.472 10.211H2.395V3.379h20.077z"></path>
    <path
      fill="#464648"
      d="M9.052 4.534H7.745v4.8h1.028V7.715L9 7.728a2 2 0 0 0 .647-.117a1.4 1.4 0 0 0 .493-.291a1.2 1.2 0 0 0 .335-.454a2.1 2.1 0 0 0 .105-.908a2.2 2.2 0 0 0-.114-.644a1.17 1.17 0 0 0-.687-.65a2 2 0 0 0-.409-.104a2 2 0 0 0-.319-.026m-.189 2.294h-.089v-1.48h.193a.57.57 0 0 1 .459.181a.92.92 0 0 1 .183.558c0 .246 0 .469-.222.626a.94.94 0 0 1-.524.114m3.671-2.306c-.111 0-.219.008-.295.011L12 4.538h-.78v4.8h.918a2.7 2.7 0 0 0 1.028-.175a1.7 1.7 0 0 0 .68-.491a1.9 1.9 0 0 0 .373-.749a3.7 3.7 0 0 0 .114-.949a4.4 4.4 0 0 0-.087-1.127a1.8 1.8 0 0 0-.4-.733a1.6 1.6 0 0 0-.535-.4a2.4 2.4 0 0 0-.549-.178a1.3 1.3 0 0 0-.228-.017m-.182 3.937h-.1V5.392h.013a1.06 1.06 0 0 1 .6.107a1.2 1.2 0 0 1 .324.4a1.3 1.3 0 0 1 .142.526c.009.22 0 .4 0 .549a3 3 0 0 1-.033.513a1.8 1.8 0 0 1-.169.5a1.1 1.1 0 0 1-.363.36a.67.67 0 0 1-.416.106m5.08-3.915H15v4.8h1.028V7.434h1.3v-.892h-1.3V5.43h1.4v-.892"></path>
    <path
      fill="#dd2025"
      d="M21.781 20.255s3.188-.578 3.188.511s-1.975.646-3.188-.511m-2.357.083a7.5 7.5 0 0 0-1.473.489l.4-.9c.4-.9.815-2.127.815-2.127a14 14 0 0 0 1.658 2.252a13 13 0 0 0-1.4.288Zm-1.262-6.5c0-.949.307-1.208.546-1.208s.508.115.517.939a10.8 10.8 0 0 1-.517 2.434a4.4 4.4 0 0 1-.547-2.162Zm-4.649 10.516c-.978-.585 2.051-2.386 2.6-2.444c-.003.001-1.576 3.056-2.6 2.444M25.9 20.895c-.01-.1-.1-1.207-2.07-1.16a14 14 0 0 0-2.453.173a12.5 12.5 0 0 1-2.012-2.655a11.8 11.8 0 0 0 .623-3.1c-.029-1.2-.316-1.888-1.236-1.878s-1.054.815-.933 2.013a9.3 9.3 0 0 0 .665 2.338s-.425 1.323-.987 2.639s-.946 2.006-.946 2.006a9.6 9.6 0 0 0-2.725 1.4c-.824.767-1.159 1.356-.725 1.945c.374.508 1.683.623 2.853-.91a23 23 0 0 0 1.7-2.492s1.784-.489 2.339-.623s1.226-.24 1.226-.24s1.629 1.639 3.2 1.581s1.495-.939 1.485-1.035"></path>
    <path fill="#909090" d="M23.954 2.077V7.95h5.633z"></path>
    <path fill="#f4f4f4" d="M24.031 2v5.873h5.633z"></path>
    <path
      fill="#fff"
      d="M8.975 4.457H7.668v4.8H8.7V7.639l.228.013a2 2 0 0 0 .647-.117a1.4 1.4 0 0 0 .493-.291a1.2 1.2 0 0 0 .332-.454a2.1 2.1 0 0 0 .105-.908a2.2 2.2 0 0 0-.114-.644a1.17 1.17 0 0 0-.687-.65a2 2 0 0 0-.411-.105a2 2 0 0 0-.319-.026m-.189 2.294h-.089v-1.48h.194a.57.57 0 0 1 .459.181a.92.92 0 0 1 .183.558c0 .246 0 .469-.222.626a.94.94 0 0 1-.524.114m3.67-2.306c-.111 0-.219.008-.295.011l-.235.006h-.78v4.8h.918a2.7 2.7 0 0 0 1.028-.175a1.7 1.7 0 0 0 .68-.491a1.9 1.9 0 0 0 .373-.749a3.7 3.7 0 0 0 .114-.949a4.4 4.4 0 0 0-.087-1.127a1.8 1.8 0 0 0-.4-.733a1.6 1.6 0 0 0-.535-.4a2.4 2.4 0 0 0-.549-.178a1.3 1.3 0 0 0-.228-.017m-.182 3.937h-.1V5.315h.013a1.06 1.06 0 0 1 .6.107a1.2 1.2 0 0 1 .324.4a1.3 1.3 0 0 1 .142.526c.009.22 0 .4 0 .549a3 3 0 0 1-.033.513a1.8 1.8 0 0 1-.169.5a1.1 1.1 0 0 1-.363.36a.67.67 0 0 1-.416.106m5.077-3.915h-2.43v4.8h1.028V7.357h1.3v-.892h-1.3V5.353h1.4v-.892"></path>
  </svg>`;

class Uploaded extends UIPlugin {
  constructor(uppy, opts) {
    super(uppy, opts);
    this.id = this.opts.id || 'Uploaded';
    this.title = this.opts.title || 'Uploaded';
    this.params = this.opts.params || {};
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

      // use image-bin uploads api, so can hard code /api/uploads
      const { data } = await mediaKitApi.get(`/api/uploads`, {
        params: {
          page,
          pageSize,
          ...this.params,
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

            const fileUrl = createImageUrl(filename, 0, 0, mediaKitMountPoint);

            previewUrl = createImageUrl(filename, 400, 0, mediaKitMountPoint);

            return {
              ...item,
              // provider view props
              id: _id,
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
          <div class="uppy-ProviderBrowserItem-inner uploaded-add-item">
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
          if (!imgElement?.src) return;
          const { src } = imgElement;
          const currentData = this.uploadedAPIData.files?.find((item) => item.previewUrl === src);

          const wrapperElement = document.createElement('div');
          wrapperElement.style =
            'width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;  ';

          const nameElement = document.createElement('div');
          nameElement.className = 'uppy-ProviderBrowserItem-name';
          nameElement.style =
            'pointer-events: none; position: absolute; bottom: 0; left: 0; right: 0; padding: 5px; background: #0000004d; color: #fff; ';
          nameElement.innerHTML = parseStringToDot(currentData.originalname);

          if (['.mp4', '.webm'].find((item) => imgElement.src?.endsWith(item))) {
            const videoElement = document.createElement('video');
            videoElement.src = imgElement.src;
            videoElement.width = imgElement.width;
            videoElement.height = imgElement.height;
            videoElement.autoplay = true;
            // 禁止播放的时候自动全屏
            videoElement.setAttribute('playsinline', 'playsinline');
            videoElement.muted = true;
            videoElement.loop = true;
            videoElement.style = 'pointer-events: none;';

            // add to wrapper
            wrapperElement.appendChild(videoElement);
          } else if (['.pdf'].find((item) => imgElement.src?.endsWith(item))) {
            const pdfIconElement = document.createElement('div');
            pdfIconElement.className = 'pdf-icon';
            pdfIconElement.innerHTML = PDF_ICON;
            // 把 pdf icon 渲染到 wrapperElement
            wrapperElement.appendChild(pdfIconElement);
          } else {
            const objectElement = document.createElement('object');
            objectElement.data = src;
            objectElement.type = currentData.mimetype || 'image/png';
            objectElement.alt = currentData.originalname;

            objectElement.style =
              'pointer-events: none; max-width: 100%; max-height: 100%; webkit-user-drag: none; object-fit: contain;';
            objectElement.loading = 'lazy';

            // add to wrapper
            wrapperElement.appendChild(objectElement);
          }

          // add name
          wrapperElement.appendChild(nameElement);

          // replace
          imgElement.parentNode.replaceChild(wrapperElement, imgElement);
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
      provider: {},
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
