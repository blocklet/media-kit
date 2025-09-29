import * as xss from 'xss';

export interface SanitizeOptions extends xss.IFilterXSSOptions {
  allowedKeys?: string[];
  preserveCase?: boolean;
}
