import * as xss from 'xss';

import { SanitizeOptions } from './types';

let defaultOptions = {
  escapeHtml: (str) => str,
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script'],
} as SanitizeOptions;

function hasOwn(object: object, key: string): boolean {
  const keys = Reflect.ownKeys(object).filter((item) => typeof item !== 'symbol') as string[];
  return keys.includes(key);
}

const initializeOptions = (options: SanitizeOptions): SanitizeOptions => {
  const sanitizerOptions: any = {};

  if (hasOwn(options, 'allowedKeys') && Array.isArray(options.allowedKeys) && options.allowedKeys.length > 0) {
    sanitizerOptions.allowedKeys = options.allowedKeys;
  }

  if (hasOwn(options, 'whiteList') && typeof options.whiteList === 'object') {
    sanitizerOptions.whiteList = options.whiteList;
  }

  return sanitizerOptions;
};

export const initSanitize = (_options: SanitizeOptions = {}): any => {
  const options = {
    ...defaultOptions,
    ...initializeOptions(_options),
  };

  const xssInstance = new xss.FilterXSS(options);

  const sanitize = (data: any): any => {
    if (typeof data === 'string') {
      return xssInstance.process(data);
    }

    if (Array.isArray(data)) {
      return data.map((item) => {
        if (typeof item === 'string') {
          return xssInstance.process(item);
        }
        if (Array.isArray(item) || typeof item === 'object') {
          return sanitize(item);
        }
        return item;
      });
    }
    if (typeof data === 'object' && data !== null) {
      Object.keys(data).forEach((key) => {
        if (options?.allowedKeys?.includes(key)) {
          return;
        }
        const item = data[key];

        if (typeof item === 'string') {
          data[key] = xssInstance.process(item);
        } else if (Array.isArray(item) || typeof item === 'object') {
          data[key] = sanitize(item);
        }
      });
    }

    return data;
  };

  console.info('sanitize ready:', options);

  return sanitize;
};
