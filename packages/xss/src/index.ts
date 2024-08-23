import { initSanitize } from './utils';
import { SanitizeOptions } from './types';
export * from './utils';

export function xss(options = {} as SanitizeOptions) {
  const sanitize = initSanitize(options);
  return (req: any, res: any, next: Function) => {
    ['body', 'params', 'headers', 'query'].forEach((k) => {
      if (req[k]) {
        req[k] = sanitize(req[k]);
      }
    });
    next();
  };
}

export default {
  xss,
  initSanitize,
};
