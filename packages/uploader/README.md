# @blocklet/uploader

**@blocklet/uploader** is a package that integrates the **uppy** service to provide universal upload capability for blocklets. For more information about uppy, refer to the [official documentation](https://uppy.io/docs/quick-start/).

## Package Structure

The package is composed of both frontend and backend components. The frontend code resides in the `react` folder, while the backend code can be found in the `middlewares` folder.

## Development

### Install In Blocklet

```
# You can use npm / yarn
pnpm add @blocklet/uploader
```

### Install Dependencies

To install the required dependencies, run the following command:

```
pnpm i
```

### Build Packages

To build the packages, execute the following command:

```
pnpm build
```

### Build, Watch, and Run Development Server

For building, watching changes, and running the development server, use the following command:

```
pnpm run dev
```

## Frontend Example

```jsx
import { lazy } from 'react';

// eslint-disable-next-line import/no-unresolved
const UploaderComponent = lazy(() => import('@blocklet/uploader/react').then((res) => ({ default: res.Uploader })));

<UploaderComponent
  key="uploader"
  ref={uploaderRef}
  popup
  onUploadFinish={(result) => {
    prependUpload(result.data);
  }}
  plugins={['ImageEditor', 'Url', 'Webcam', canUseUnsplash && 'Unsplash'].filter(Boolean)}
  coreProps={{
    restrictions: {
      allowedFileTypes,
      maxFileSize,
    },
  }}
  apiPathProps={{
    uploader: '/api/uploads',
    companion: '/api/companion',
  }}
/>;
```

## Backend Example

```javascript
const { initLocalStorageServer, initCompanion } = require('@blocklet/uploader/middlewares');

// init uploader server
const localStorageServer = initLocalStorageServer({
  path: env.uploadDir,
  express,
  onUploadFinish: async (req, res, uploadMetadata) => {
    const {
      id: filename,
      size,
      metadata: { filename: originalname, filetype: mimetype },
    } = uploadMetadata;

    const obj = new URL(env.appUrl);
    obj.protocol = req.get('x-forwarded-proto') || req.protocol;
    obj.pathname = joinUrl(req.headers['x-path-prefix'] || '/', '/uploads', filename);

    const doc = await Upload.insert({
      mimetype,
      originalname,
      filename,
      size,
      remark: req.body.remark || '',
      tags: (req.body.tags || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      folderId: req.componentDid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user.did,
      updatedBy: req.user.did,
    });

    const resData = { url: obj.href, ...doc };

    return resData;
  },
});

router.use('/uploads', user, auth, ensureComponentDid, localStorageServer.handle);

// if you need to load file from remote
// companion
const companion = initCompanion({
  path: env.uploadDir,
  express,
  providerOptions: env.providerOptions,
  uploadUrls: [env.appUrl],
});

router.use('/companion', user, auth, ensureComponentDid, companion.handle);
```

## License

This package is licensed under the MIT license.
