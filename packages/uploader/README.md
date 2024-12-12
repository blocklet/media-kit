# @blocklet/uploader

**@blocklet/uploader** is a package that integrates the **uppy** service to provide universal upload capability for blocklets. For more information about uppy, refer to the [official documentation](https://uppy.io/docs/quick-start/).

## Package Structure

The package is composed of both frontend and backend components. The frontend code resides in the `react` folder.

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
const UploaderComponent = lazy(() => import('@blocklet/uploader').then((res) => ({ default: res.Uploader })));

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
    disableMediaKitPrefix: false,
    disableAutoPrefix: false,
    disableMediaKitStatus: false,
  }}
/>;
```

## License

This package is licensed under the MIT license.
