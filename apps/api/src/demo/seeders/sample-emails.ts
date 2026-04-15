/**
 * Sample email fixtures for the DevInbox demo seeder.
 *
 * All content here is deliberately fake:
 * - `from` addresses use the reserved `example.com` / `example.org` domains (RFC 2606).
 * - All `href` attributes point to `#` (no real URLs, no tracking pixels).
 * - No PII, no real order IDs, no real brands.
 *
 * Shape matches the fields used by `DevInboxDemoSeeder` when calling
 * `prisma.email.createMany`: from, to, subject, bodyText, bodyHtml, headers.
 */
export interface SampleEmail {
  from: string;
  to: string[];
  subject: string;
  bodyText: string;
  bodyHtml: string;
  headers: Record<string, string>;
}

export const SAMPLE_EMAILS: SampleEmail[] = [
  // 1. Welcome / onboarding
  {
    from: 'welcome@example.com',
    to: ['demo-user@example.org'],
    subject: 'Welcome to the Demo Inbox',
    bodyText:
      'Hi there!\n\nWelcome to your demo inbox. This is a sample email to help you explore the interface. Feel free to click around — nothing here is real.\n\nEnjoy the tour!\n— The Demo Team',
    bodyHtml:
      '<!doctype html><html><body style="font-family:sans-serif;">' +
      '<h1>Welcome to the Demo Inbox</h1>' +
      '<p>Hi there!</p>' +
      '<p>Welcome to your demo inbox. This is a sample email to help you explore the interface. Feel free to click around — nothing here is real.</p>' +
      '<p><a href="#">Take the tour</a></p>' +
      '<p>Enjoy!<br/>— The Demo Team</p>' +
      '</body></html>',
    headers: {
      'Message-ID': '<demo-welcome-001@example.com>',
      'Content-Type': 'multipart/alternative',
      'X-Demo-Fixture': 'welcome',
    },
  },

  // 2. Password reset
  {
    from: 'noreply@example.com',
    to: ['demo-user@example.org'],
    subject: 'Reset your password',
    bodyText:
      'We received a request to reset your password. If this was not you, you can safely ignore this email.\n\nReset link: (demo — not a real link)\n\nThis link would normally expire in 30 minutes.',
    bodyHtml:
      '<!doctype html><html><body style="font-family:sans-serif;">' +
      '<h2>Reset your password</h2>' +
      '<p>We received a request to reset your password. If this was not you, you can safely ignore this email.</p>' +
      '<p style="margin:24px 0;">' +
      '<a href="#" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Reset password</a>' +
      '</p>' +
      '<p style="color:#666;font-size:12px;">This link would normally expire in 30 minutes. Demo email — link is inert.</p>' +
      '</body></html>',
    headers: {
      'Message-ID': '<demo-reset-002@example.com>',
      'Content-Type': 'multipart/alternative',
      'X-Demo-Fixture': 'password-reset',
    },
  },

  // 3. Order receipt
  {
    from: 'receipts@example.com',
    to: ['demo-user@example.org'],
    subject: 'Your demo receipt #DEMO-0001',
    bodyText:
      'Thanks for your (pretend) order!\n\nOrder: DEMO-0001\n\n1x Sample widget — $10.00\n2x Example gadget — $20.00\nSubtotal: $30.00\nTax: $2.40\nTotal: $32.40\n\nThis is a demo receipt. No charge was made.',
    bodyHtml:
      '<!doctype html><html><body style="font-family:sans-serif;">' +
      '<h2>Your demo receipt</h2>' +
      '<p>Order <strong>DEMO-0001</strong></p>' +
      '<table style="border-collapse:collapse;width:100%;max-width:480px;">' +
      '<thead><tr style="background:#f3f4f6;">' +
      '<th style="text-align:left;padding:8px;border:1px solid #e5e7eb;">Item</th>' +
      '<th style="text-align:right;padding:8px;border:1px solid #e5e7eb;">Price</th>' +
      '</tr></thead><tbody>' +
      '<tr><td style="padding:8px;border:1px solid #e5e7eb;">1x Sample widget</td><td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">$10.00</td></tr>' +
      '<tr><td style="padding:8px;border:1px solid #e5e7eb;">2x Example gadget</td><td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">$20.00</td></tr>' +
      '<tr><td style="padding:8px;border:1px solid #e5e7eb;">Tax</td><td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">$2.40</td></tr>' +
      '<tr><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Total</strong></td><td style="padding:8px;border:1px solid #e5e7eb;text-align:right;"><strong>$32.40</strong></td></tr>' +
      '</tbody></table>' +
      '<p style="margin-top:16px;"><a href="#">View order</a></p>' +
      '<p style="color:#666;font-size:12px;">This is a demo receipt. No charge was made.</p>' +
      '</body></html>',
    headers: {
      'Message-ID': '<demo-receipt-003@example.com>',
      'Content-Type': 'multipart/alternative',
      'X-Demo-Fixture': 'receipt',
    },
  },

  // 4. Newsletter
  {
    from: 'updates@example.com',
    to: ['demo-user@example.org'],
    subject: 'This week in the Demo Newsletter',
    bodyText:
      'This week in the Demo Newsletter:\n\n- A fake feature announcement\n- A pretend tutorial\n- Sample community highlights\n\nRead more at (demo link).',
    bodyHtml:
      '<!doctype html><html><body style="font-family:sans-serif;max-width:560px;">' +
      '<h1 style="color:#111;">Demo Newsletter</h1>' +
      '<p style="color:#555;">Your weekly roundup of pretend news.</p>' +
      '<hr/>' +
      '<h3>A fake feature announcement</h3>' +
      '<p>We shipped a brand new imaginary feature. It does nothing, beautifully. <a href="#">Read more</a></p>' +
      '<h3>A pretend tutorial</h3>' +
      '<p>Step-by-step guide to an entirely fictional workflow. <a href="#">Start tutorial</a></p>' +
      '<h3>Sample community highlights</h3>' +
      '<ul>' +
      '<li>Imaginary user shared a clever tip</li>' +
      '<li>Fake discussion on the forum</li>' +
      '<li>Pretend release notes</li>' +
      '</ul>' +
      '<hr/>' +
      '<p style="color:#999;font-size:12px;">You are receiving this demo newsletter as part of the sample inbox. <a href="#">Unsubscribe</a> (inert).</p>' +
      '</body></html>',
    headers: {
      'Message-ID': '<demo-newsletter-004@example.com>',
      'Content-Type': 'multipart/alternative',
      'List-Unsubscribe': '<mailto:unsubscribe@example.com>',
      'X-Demo-Fixture': 'newsletter',
    },
  },

  // 5. Email mentioning an attachment (HTML-only reference — no Attachment row).
  // We intentionally do not seed the Attachment table: attachments require
  // storage-path wiring that is out of scope for the demo UI showcase.
  // The message body references a pretend attachment so the UI can still
  // render an attachment-style email template.
  {
    from: 'reports@example.com',
    to: ['demo-user@example.org'],
    subject: 'Your monthly report (attachment)',
    bodyText:
      'Hi,\n\nYour monthly demo report would normally be attached to this email as "demo-report.pdf".\n\nNote: this is a demo inbox — no real file is attached. The attachment reference is shown only to illustrate the UI.\n\n— Demo Reports',
    bodyHtml:
      '<!doctype html><html><body style="font-family:sans-serif;">' +
      '<h2>Your monthly report</h2>' +
      '<p>Hi,</p>' +
      '<p>Your monthly demo report would normally be attached to this email.</p>' +
      '<div style="border:1px solid #e5e7eb;border-radius:6px;padding:12px;max-width:360px;margin:16px 0;background:#f9fafb;">' +
      '<strong>demo-report.pdf</strong><br/>' +
      '<span style="color:#666;font-size:12px;">PDF · 128 KB · <a href="#">Download (inert)</a></span>' +
      '</div>' +
      '<p style="color:#666;font-size:12px;">This is a demo email. No real file is attached — the reference above is illustrative only.</p>' +
      '<p>— Demo Reports</p>' +
      '</body></html>',
    headers: {
      'Message-ID': '<demo-attachment-005@example.com>',
      'Content-Type': 'multipart/mixed',
      'X-Demo-Fixture': 'attachment-reference',
    },
  },
];
