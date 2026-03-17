import { describe, it, expect } from 'vitest';
import { detectMimeType, sanitizeSvg } from '../utils/hash';

describe('detectMimeType', () => {
  it('detects JPEG', () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00]);
    expect(detectMimeType(bytes)).toBe('image/jpeg');
  });

  it('detects PNG', () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(detectMimeType(bytes)).toBe('image/png');
  });

  it('detects GIF', () => {
    const bytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39]);
    expect(detectMimeType(bytes)).toBe('image/gif');
  });

  it('detects BMP', () => {
    const bytes = new Uint8Array([0x42, 0x4d, 0x00, 0x00]);
    expect(detectMimeType(bytes)).toBe('image/bmp');
  });

  it('detects ICO', () => {
    const bytes = new Uint8Array([0x00, 0x00, 0x01, 0x00]);
    expect(detectMimeType(bytes)).toBe('image/x-icon');
  });

  it('detects PDF', () => {
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
    expect(detectMimeType(bytes)).toBe('application/pdf');
  });

  it('detects SVG', () => {
    const svgStr = '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>';
    const bytes = new TextEncoder().encode(svgStr);
    expect(detectMimeType(bytes)).toBe('image/svg+xml');
  });

  it('returns null for unknown', () => {
    const bytes = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
    expect(detectMimeType(bytes)).toBeNull();
  });

  it('returns null for too-short input', () => {
    const bytes = new Uint8Array([0xff, 0xd8]);
    expect(detectMimeType(bytes)).toBeNull();
  });
});

describe('sanitizeSvg', () => {
  it('removes script tags', () => {
    const input = '<svg><script>alert("xss")</script><rect/></svg>';
    const result = sanitizeSvg(input);
    expect(result).not.toContain('<script');
    expect(result).toContain('<rect/>');
  });

  it('removes on* event attributes', () => {
    const input = '<svg><rect onclick="alert(1)" onload="hack()"/></svg>';
    const result = sanitizeSvg(input);
    expect(result).not.toContain('onclick');
    expect(result).not.toContain('onload');
  });

  it('removes javascript: URLs', () => {
    const input = '<svg><a href="javascript:alert(1)"><text>click</text></a></svg>';
    const result = sanitizeSvg(input);
    expect(result).not.toContain('javascript:');
  });

  it('removes foreignObject', () => {
    const input = '<svg><foreignObject><body><script>alert(1)</script></body></foreignObject></svg>';
    const result = sanitizeSvg(input);
    expect(result).not.toContain('foreignObject');
  });

  it('preserves safe SVG content', () => {
    const input = '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="red"/></svg>';
    const result = sanitizeSvg(input);
    expect(result).toBe(input);
  });
});
