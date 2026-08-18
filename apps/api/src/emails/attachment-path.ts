import * as path from 'path';

/**
 * Build the on-disk path for an inbound attachment.
 *
 * Attachment filenames come from the MIME headers of mail that anyone can send
 * to the public SMTP listener, so they are untrusted. Only the basename is
 * kept, and the result is checked to be inside `uploadsDir` before it is used.
 *
 * Returns null when the name cannot be made safe, in which case the attachment
 * should be skipped rather than written.
 */
export function safeAttachmentPath(
  uploadsDir: string,
  filename: string | undefined,
  now: number = Date.now(),
): string | null {
  // A null byte can truncate the path inside libc, so refuse it outright.
  if (filename?.includes('\u0000')) return null;

  const base = path.basename(filename ?? '');
  const safeName =
    base === '' || base === '.' || base === '..' ? 'unnamed' : base;

  const filepath = path.join(uploadsDir, `${now}-${safeName}`);

  // Defence in depth: the basename above should make this unreachable.
  const root = path.resolve(uploadsDir) + path.sep;
  if (!path.resolve(filepath).startsWith(root)) return null;

  return filepath;
}
