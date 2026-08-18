import * as path from 'path';
import { safeAttachmentPath } from './attachment-path';

describe('safeAttachmentPath', () => {
  const uploadsDir = path.join('/app', 'uploads', 'attachments');
  const now = 1787046668457;

  it('keeps an ordinary filename inside the uploads directory', () => {
    const result = safeAttachmentPath(uploadsDir, 'report.pdf', now);

    expect(result).toBe(path.join(uploadsDir, `${now}-report.pdf`));
  });

  it.each([
    ['../../../../etc/cron.d/pwn', 'pwn'],
    ['../../../../../../root/.ssh/authorized_keys', 'authorized_keys'],
    ['../escape.txt', 'escape.txt'],
    ['/etc/passwd', 'passwd'],
    ['nested/dir/file.txt', 'file.txt'],
  ])('strips traversal from %j', (input, expected) => {
    const result = safeAttachmentPath(uploadsDir, input, now);

    expect(result).toBe(path.join(uploadsDir, `${now}-${expected}`));
    expect(path.dirname(result as string)).toBe(uploadsDir);
  });

  it('falls back to a placeholder when there is no usable filename', () => {
    expect(safeAttachmentPath(uploadsDir, undefined, now)).toBe(
      path.join(uploadsDir, `${now}-unnamed`),
    );
    expect(safeAttachmentPath(uploadsDir, '', now)).toBe(
      path.join(uploadsDir, `${now}-unnamed`),
    );
    expect(safeAttachmentPath(uploadsDir, '..', now)).toBe(
      path.join(uploadsDir, `${now}-unnamed`),
    );
    expect(safeAttachmentPath(uploadsDir, '.', now)).toBe(
      path.join(uploadsDir, `${now}-unnamed`),
    );
  });

  it('rejects filenames containing a null byte', () => {
    expect(safeAttachmentPath(uploadsDir, 'evil\u0000.png', now)).toBeNull();
  });

  it('always resolves within the uploads directory', () => {
    const hostile = [
      '../../../../etc/passwd',
      '....//....//etc/passwd',
      '..',
      '../',
      'a/../../../b',
    ];

    for (const name of hostile) {
      const result = safeAttachmentPath(uploadsDir, name, now);
      if (result === null) continue;
      expect(
        path.resolve(result).startsWith(path.resolve(uploadsDir) + path.sep),
      ).toBe(true);
    }
  });
});
