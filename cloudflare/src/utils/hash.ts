// @ts-ignore - js-md5 types don't match the actual API
import md5 from 'js-md5';

/**
 * Compute MD5 hash of an R2 object using streaming (O(1) memory).
 * Workers WebCrypto does NOT support MD5 — must use js-md5.
 */
export async function streamMD5(body: ReadableStream<Uint8Array>): Promise<string> {
  const hasher = (md5 as any).create();
  const reader = body.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    hasher.update(value);
  }

  return hasher.hex();
}

/**
 * Detect MIME type from file magic bytes (first 4KB).
 * Returns detected MIME type or null if unknown.
 */
export function detectMimeType(bytes: Uint8Array): string | null {
  if (bytes.length < 4) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'image/png';
  }

  // GIF: 47 49 46 38
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return 'image/gif';
  }

  // WebP: 52 49 46 46 ... 57 45 42 50
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes.length >= 12 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }

  // BMP: 42 4D
  if (bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return 'image/bmp';
  }

  // ICO: 00 00 01 00
  if (
    bytes[0] === 0x00 &&
    bytes[1] === 0x00 &&
    bytes[2] === 0x01 &&
    bytes[3] === 0x00
  ) {
    return 'image/x-icon';
  }

  // PDF: 25 50 44 46 (%PDF)
  if (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  ) {
    return 'application/pdf';
  }

  // SVG: check for <?xml or <svg (text-based)
  const text = new TextDecoder().decode(bytes.slice(0, 256));
  if (text.includes('<svg') || (text.includes('<?xml') && text.includes('<svg'))) {
    return 'image/svg+xml';
  }

  return null;
}

/**
 * Basic SVG sanitization for Workers environment.
 * DOMPurify requires DOM API (document/window) which Workers do NOT have.
 * This strips dangerous elements and attributes from SVG content.
 */
export function sanitizeSvg(svgContent: string): string {
  // Remove script tags and their content
  let sanitized = svgContent.replace(/<script[\s\S]*?<\/script>/gi, '');

  // Remove on* event attributes
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // Remove javascript: URLs
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href=""');
  sanitized = sanitized.replace(/xlink:href\s*=\s*["']javascript:[^"']*["']/gi, 'xlink:href=""');

  // Remove data: URLs (potential XSS vector)
  sanitized = sanitized.replace(/href\s*=\s*["']data:[^"']*["']/gi, 'href=""');

  // Remove foreignObject (can embed arbitrary HTML)
  sanitized = sanitized.replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '');

  // Remove use elements pointing to external resources
  sanitized = sanitized.replace(/<use[^>]*href\s*=\s*["']https?:[^"']*["'][^>]*\/>/gi, '');

  return sanitized;
}
