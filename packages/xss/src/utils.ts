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

/**
 * Restores original tag name casing after XSS processing.
 *
 * The 'xss' library forcefully converts all tag names to lowercase via the keysToLowerCase() function,
 * which breaks SVG elements like 'linearGradient', 'clipPath', 'radialGradient' etc.
 * This post-processing function restores the correct case for SVG tag names.
 *
 * @param content - The HTML/SVG content processed by XSS library (with lowercase tag names)
 * @returns The content with original tag name casing restored
 */
function preserveTagCase(content: string) {
  // Create mapping from lowercase to correct case tag names
  const tagCaseMapping: Record<string, string> = {};

  Object.keys(svgWhiteList).forEach((originalTag) => {
    const lowerCaseTag = originalTag.toLowerCase();
    if (lowerCaseTag !== originalTag) {
      tagCaseMapping[lowerCaseTag] = originalTag;
    }
  });

  let result = content;

  // Restore proper case for tag names: <tagname> -> <TagName>
  Object.entries(tagCaseMapping).forEach(([lowercase, original]) => {
    // Match opening and self-closing tags: <lowercase...>
    result = result.replace(new RegExp(`<${lowercase}([^>]*)>`, 'gi'), (_match, rest) => `<${original}${rest}>`);

    // Match closing tags: </lowercase>
    result = result.replace(new RegExp(`</${lowercase}>`, 'gi'), `</${original}>`);
  });

  return result;
}

/** same as preserveTagCase, but for attributes */
function preserveAttrCase(tag: string, name: string, value: string, isWhiteAttr: boolean) {
  if (isWhiteAttr) {
    const originalTagKey = Object.keys(svgWhiteList).find((key) => key.toLowerCase() === tag.toLowerCase());

    if (originalTagKey) {
      const originalAttrName = svgWhiteList[originalTagKey as keyof typeof svgWhiteList].find(
        (attr) => attr.toLowerCase() === name.toLowerCase()
      );
      if (originalAttrName) {
        // @ts-ignore
        value = xss.safeAttrValue(tag, name, value);
        if (value) {
          return originalAttrName + '="' + value + '"';
        } else {
          return originalAttrName;
        }
      }
    }
  }
}

// define svg white list
export const svgWhiteList = {
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

export const sanitizeSvg = (
  svgContent: string,
  options?: SanitizeOptions,
  svgOptions?: xss.IFilterXSSOptions
): string => {
  const isSvg = isSvgFile(svgContent);
  if (!isSvg) {
    throw new Error('Invalid SVG content');
  }

  const filterOptions = { ...svgSanitizeOptions, ...(svgOptions || {}) };

  if (options?.preserveCase) {
    filterOptions.onTagAttr = preserveAttrCase;
  }

  const xssInstance = new xss.FilterXSS(filterOptions);
  const processedContent = xssInstance.process(svgContent);

  // Post-process: restore original tag name casing because XSS library converts all tags to lowercase
  return options?.preserveCase ? preserveTagCase(processedContent) : processedContent;
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
