import {
  contentDispositionFilename,
  safeContentType,
} from './attachment-headers';

describe('safeContentType', () => {
  it('passes through a well-formed mime type', () => {
    expect(safeContentType('image/png')).toBe('image/png');
    expect(safeContentType('application/vnd.ms-excel')).toBe(
      'application/vnd.ms-excel',
    );
  });

  it('falls back to octet-stream for renderable or malformed types', () => {
    expect(safeContentType('text/html')).toBe('application/octet-stream');
    expect(safeContentType('image/svg+xml')).toBe('application/octet-stream');
    expect(safeContentType('application/xhtml+xml')).toBe(
      'application/octet-stream',
    );
    expect(safeContentType(undefined)).toBe('application/octet-stream');
    expect(safeContentType('not a mime type')).toBe('application/octet-stream');
    expect(safeContentType('text/html\r\nX-Injected: 1')).toBe(
      'application/octet-stream',
    );
  });
});

describe('contentDispositionFilename', () => {
  it('quotes an ordinary filename', () => {
    expect(contentDispositionFilename('report.pdf')).toBe(
      'attachment; filename="report.pdf"',
    );
  });

  it('does not let a quote escape the filename parameter', () => {
    const header = contentDispositionFilename('a".txt');

    expect(header).toBe('attachment; filename="a.txt"');
    expect(header.match(/"/g)).toHaveLength(2);
  });

  it('strips CR/LF so headers cannot be split', () => {
    const header = contentDispositionFilename('a\r\nX-Injected: 1');

    expect(header).not.toContain('\r');
    expect(header).not.toContain('\n');
  });

  it('always emits the attachment disposition', () => {
    for (const name of ['inline; x', '', undefined, '../../etc/passwd']) {
      expect(contentDispositionFilename(name).startsWith('attachment;')).toBe(
        true,
      );
    }
  });
});
