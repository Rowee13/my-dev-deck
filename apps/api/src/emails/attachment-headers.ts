// Attachment metadata comes from inbound mail and is fully attacker
// controlled, so it is sanitised before being reflected in response headers.

const MIME_PATTERN =
  /^[A-Za-z0-9][A-Za-z0-9!#$&^_.+-]{0,126}\/[A-Za-z0-9][A-Za-z0-9!#$&^_.+-]{0,126}$/;

// Types a browser may render in-origin rather than treat as an opaque download.
const RENDERABLE = new Set([
  'text/html',
  'application/xhtml+xml',
  'image/svg+xml',
  'application/xml',
  'text/xml',
]);

export function safeContentType(contentType: string | undefined): string {
  const fallback = 'application/octet-stream';
  if (!contentType) return fallback;

  const value = contentType.trim().toLowerCase();
  if (!MIME_PATTERN.test(value)) return fallback;
  if (RENDERABLE.has(value)) return fallback;

  return value;
}

export function contentDispositionFilename(
  filename: string | undefined,
): string {
  // Drop quotes, backslashes and control characters: the first two would end
  // the quoted-string early, the last could split the header.
  const QUOTE = 0x22;
  const BACKSLASH = 0x5c;
  const cleaned = Array.from(filename ?? '')
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      if (code < 0x20 || code === 0x7f) return false;
      return code !== QUOTE && code !== BACKSLASH;
    })
    .join('')
    .trim();

  return `attachment; filename="${cleaned || 'unnamed'}"`;
}
