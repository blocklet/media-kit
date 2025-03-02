import * as xss from 'xss';
import omit from 'lodash/omit';
import { SanitizeOptions } from './types';
import path from 'path';
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

// define svg white list
const svgWhiteList = {
  svg: ['width', 'height', 'viewBox', 'xmlns', 'version', 'preserveAspectRatio', 'xml:space'],
  circle: ['cx', 'cy', 'r', 'fill', 'stroke', 'stroke-width', 'fill-opacity', 'stroke-opacity'],
  ellipse: ['cx', 'cy', 'rx', 'ry', 'fill', 'stroke', 'stroke-width'],
  line: ['x1', 'y1', 'x2', 'y2', 'stroke', 'stroke-width'],
  path: ['d', 'fill', 'stroke', 'stroke-width', 'fill-rule', 'stroke-linecap', 'stroke-linejoin'],
  polygon: ['points', 'fill', 'stroke', 'stroke-width'],
  polyline: ['points', 'fill', 'stroke', 'stroke-width'],
  rect: ['x', 'y', 'width', 'height', 'rx', 'ry', 'fill', 'stroke', 'stroke-width'],
  g: ['transform', 'fill', 'stroke'],
  text: ['x', 'y', 'font-size', 'font-family', 'text-anchor', 'fill'],
  defs: [],
  clipPath: ['id'],
  mask: ['id'],
  use: ['x', 'y', 'width', 'height'],
  linearGradient: ['id', 'x1', 'y1', 'x2', 'y2', 'gradientUnits'],
  radialGradient: ['id', 'cx', 'cy', 'r', 'fx', 'fy', 'gradientUnits'],
  stop: ['offset', 'stop-color', 'stop-opacity'],
  pattern: ['id', 'width', 'height', 'patternUnits', 'patternTransform'],
};

// define svg sanitize options
const svgSanitizeOptions: SanitizeOptions = {
  whiteList: svgWhiteList,
  stripIgnoreTagBody: ['script', 'style'],
  onIgnoreTag: function (tag, html, options) {
    return '';
  },
  onIgnoreTagAttr: function (tag, name, value, isWhiteAttr) {
    // check if it is event attribute or dangerous attribute
    if (name.startsWith('on') || name === 'href' || name === 'xlink:href') {
      return '';
    }

    // allow safe style attribute
    if (name === 'style') {
      // only allow safe css attribute
      const safeValue = value.replace(/expression\(.*\)|javascript:|data:|@import|behavior|binding|moz-binding/gi, '');
      if (safeValue !== value) {
        return '';
      }
      return `${name}="${safeValue}"`;
    }

    if (tag === 'use' && (name === 'href' || name === 'xlink:href')) {
      // only allow internal reference, starting with # and not containing dangerous characters
      if (value.startsWith('#') && !/[<>"']/.test(value)) {
        return `${name}="${value}"`;
      }
      return '';
    }

    // allow safe id, class attribute
    if (name === 'id' || name === 'class') {
      return `${name}="${value}"`;
    }
  },
};

export const sanitizeSvg = (svgContent: string): string => {
  const isSvg = isSvgFile(svgContent);
  if (!isSvg) {
    throw new Error('Invalid SVG content');
  }

  const xssInstance = new xss.FilterXSS(svgSanitizeOptions);
  return xssInstance.process(svgContent);
};

export const isSvgFile = (
  svgContent: string,
  file?: {
    name?: string;
    type?: string;
  }
): boolean => {
  if (typeof svgContent !== 'string') {
    return false;
  }

  // Check for SVG signature in content
  const svgRegex = /<svg[^>]*?(?:>|\/>)|<\?xml[^>]*>\s*<svg[^>]*?(?:>|\/?>)/i;
  const isSvg = svgRegex.test(svgContent);

  if (!isSvg) {
    return false;
  }

  if (file?.name) {
    const ext = path.extname(file.name).toLowerCase();
    if (ext !== '.svg') {
      return false;
    }
  }

  if (file?.type) {
    if (!file.type.toLowerCase().includes('image/svg')) {
      return false;
    }
  }

  return true;
};
