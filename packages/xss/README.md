# @blocklet/xss

**@blocklet/xss** is a package that integrates the **xss** refer to the [official documentation](https://www.npmjs.com/package/xss).

## Development

### Install In Blocklet

```
# You can use npm / yarn
pnpm add @blocklet/xss
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

## Example

```jsx
const { xss } = require('@blocklet/xss');
const express = require('express');

const app = express();
// ---- body-parser ----

app.use(xss());
```

## License

This package is licensed under the MIT license.
