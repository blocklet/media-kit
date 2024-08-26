import * as xss from 'xss';
import omit from 'lodash/omit';
import { SanitizeOptions } from './types';

const ignoreTagList = [
  // here is a blacklist
  'script',
  'img',
  'iframe',
  'body',
  'form',
  'style',
  'link',
  'meta',
  'bgsound',
  'svg',
  'embed',
  'object',
  'video',
  'audio',
  'source',
  'track',
  'marquee',
  'blink',
  'noscript',
  'param',
  'textarea',
  'input',
  'select',
  'button',
] as string[];

const ignoreTagMap = ignoreTagList.reduce((acc: any, item: string) => {
  acc[item] = true;
  return acc;
}, {});

let defaultOptions = {
  escapeHtml: (str) => str,
  whiteList: omit(xss.getDefaultWhiteList(), ignoreTagList),
  onIgnoreTag: function (tag, html, options) {
    if (ignoreTagMap[tag]) {
      return '';
    }
  },
  stripIgnoreTagBody: ['script'],
} as SanitizeOptions;

export const initSanitize = (_options: SanitizeOptions = {}): any => {
  const options = {
    ...defaultOptions,
    ..._options,
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

  // console.info('sanitize ready:', options);

  return sanitize;
};
