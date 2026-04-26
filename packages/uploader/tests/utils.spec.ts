import { describe, expect, it } from 'vitest';

import { getMimeExtension, lookupMimeType } from '../src/mime';

describe('browser-safe MIME helpers', () => {
  it('looks up MIME types from file names and URLs without Node path APIs', () => {
    expect(lookupMimeType('avatar.png')).toBe('image/png');
    expect(lookupMimeType('https://example.com/files/avatar.jpeg?size=large')).toBe('image/jpeg');
    expect(lookupMimeType('.gitignore')).toBe(false);
  });

  it('resolves extensions from MIME types', () => {
    expect(getMimeExtension('image/jpeg')).toBe('jpg');
    expect(getMimeExtension('image/png')).toBe('png');
    expect(getMimeExtension('avatar.webp')).toBe('webp');
  });
});
