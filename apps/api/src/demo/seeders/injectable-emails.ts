/**
 * Injectable email templates for the demo "Inject test email" feature.
 *
 * Demo users cannot receive real SMTP mail (sandboxed), so instead they click
 * an "Inject test email" button in the UI which drops one of these realistic
 * fake emails into one of their projects.
 *
 * Cap accounting
 * --------------
 * All `from` addresses in this pool use the reserved `@inject.demo.local`
 * domain so injected rows can be counted without a separate marker column:
 *
 *   await prisma.email.count({
 *     where: { projectId, from: { endsWith: '@inject.demo.local' } }
 *   });
 *
 * The 5 seeded emails from `sample-emails.ts` use `@example.com` /
 * `@example.org` (RFC 2606 reserved) so they never collide with this cap.
 *
 * Everything here is fake:
 * - `from` uses the `@inject.demo.local` reserved marker domain.
 * - `href` attributes point to `#`.
 * - No PII, no real brands, no tracking pixels.
 */

export interface InjectableEmail {
  from: string;
  to: string[];
  subject: string;
  bodyText: string;
  bodyHtml: string;
  headers: Record<string, string>;
}

export const INJECT_DOMAIN = '@inject.demo.local';

export const INJECTABLE_EMAILS: InjectableEmail[] = [
  // 1. Shipping notification
  {
    from: `shipping${INJECT_DOMAIN}`,
    to: ['demo-user@example.org'],
    subject: 'Your order has shipped',
    bodyText:
      'Good news — your demo order is on its way!\n\nTracking: DEMO-TRK-0001 (inert)\nEstimated delivery: in 3 pretend days.',
    bodyHtml:
      '<!doctype html><html><body style="font-family:sans-serif;">' +
      '<h2>Your order has shipped</h2>' +
      '<p>Good news — your demo order is on its way.</p>' +
      '<p><strong>Tracking:</strong> DEMO-TRK-0001 (inert)</p>' +
      '<p><a href="#">Track package</a></p>' +
      '</body></html>',
    headers: {
      'Content-Type': 'multipart/alternative',
      'X-Demo-Injected': 'shipping',
    },
  },

  // 2. Meeting invite
  {
    from: `calendar${INJECT_DOMAIN}`,
    to: ['demo-user@example.org'],
    subject: 'Invitation: Demo sync @ Thu 2pm',
    bodyText:
      'You are invited to a pretend meeting.\n\nWhen: Thursday, 2:00 PM (fake time)\nWhere: Imaginary conference room\n\nAgenda:\n- Review fictional roadmap\n- Discuss invented metrics',
    bodyHtml:
      '<!doctype html><html><body style="font-family:sans-serif;">' +
      '<h2>Demo sync</h2>' +
      '<p><strong>When:</strong> Thursday, 2:00 PM (fake)</p>' +
      '<p><strong>Where:</strong> Imaginary conference room</p>' +
      '<p><a href="#">Accept</a> · <a href="#">Decline</a></p>' +
      '</body></html>',
    headers: {
      'Content-Type': 'multipart/alternative',
      'X-Demo-Injected': 'calendar-invite',
    },
  },

  // 3. Security alert
  {
    from: `security${INJECT_DOMAIN}`,
    to: ['demo-user@example.org'],
    subject: 'New sign-in to your demo account',
    bodyText:
      'We detected a sign-in from a new (pretend) device.\n\nDevice: Demo browser on Imaginary OS\nLocation: Nowheresville\n\nIf this was not you, the demo would normally let you lock the account.',
    bodyHtml:
      '<!doctype html><html><body style="font-family:sans-serif;">' +
      '<h2>New sign-in detected</h2>' +
      '<p><strong>Device:</strong> Demo browser on Imaginary OS</p>' +
      '<p><strong>Location:</strong> Nowheresville</p>' +
      '<p><a href="#">Review activity</a> (inert)</p>' +
      '</body></html>',
    headers: {
      'Content-Type': 'multipart/alternative',
      'X-Demo-Injected': 'security-alert',
    },
  },

  // 4. Invoice
  {
    from: `billing${INJECT_DOMAIN}`,
    to: ['demo-user@example.org'],
    subject: 'Invoice DEMO-INV-0042 is available',
    bodyText:
      'Your demo invoice is ready.\n\nInvoice: DEMO-INV-0042\nAmount: $49.00 (pretend)\nDue: in 14 fake days.\n\nNo real charge — this is a demo.',
    bodyHtml:
      '<!doctype html><html><body style="font-family:sans-serif;">' +
      '<h2>Invoice DEMO-INV-0042</h2>' +
      '<p><strong>Amount:</strong> $49.00 (pretend)</p>' +
      '<p><strong>Due:</strong> in 14 fake days</p>' +
      '<p><a href="#">View invoice</a></p>' +
      '<p style="color:#666;font-size:12px;">No real charge — demo only.</p>' +
      '</body></html>',
    headers: {
      'Content-Type': 'multipart/alternative',
      'X-Demo-Injected': 'invoice',
    },
  },

  // 5. Comment / mention notification
  {
    from: `notifications${INJECT_DOMAIN}`,
    to: ['demo-user@example.org'],
    subject: 'Someone mentioned you in a comment',
    bodyText:
      '@demo-user — "Can you take a look at this pretend PR when you get a sec?"\n\n— Imaginary teammate',
    bodyHtml:
      '<!doctype html><html><body style="font-family:sans-serif;">' +
      '<h2>New mention</h2>' +
      '<blockquote style="border-left:3px solid #ccc;padding-left:12px;color:#444;">' +
      '@demo-user — "Can you take a look at this pretend PR when you get a sec?"' +
      '</blockquote>' +
      '<p>— Imaginary teammate</p>' +
      '<p><a href="#">Reply</a></p>' +
      '</body></html>',
    headers: {
      'Content-Type': 'multipart/alternative',
      'X-Demo-Injected': 'mention',
    },
  },

  // 6. CI build failure
  {
    from: `ci${INJECT_DOMAIN}`,
    to: ['demo-user@example.org'],
    subject: 'Build failed: main @ demo-abcd123',
    bodyText:
      'The pretend build for commit demo-abcd123 on main failed.\n\n1 test failing:\n- fake-suite > imaginary test > should not pretend\n\nInspect the fictional log for details.',
    bodyHtml:
      '<!doctype html><html><body style="font-family:sans-serif;">' +
      '<h2 style="color:#b91c1c;">Build failed</h2>' +
      '<p><code>demo-abcd123</code> on <strong>main</strong></p>' +
      '<pre style="background:#f3f4f6;padding:12px;border-radius:6px;">FAIL fake-suite > imaginary test\n  expected: truth\n  received: pretense</pre>' +
      '<p><a href="#">View log</a> (inert)</p>' +
      '</body></html>',
    headers: {
      'Content-Type': 'multipart/alternative',
      'X-Demo-Injected': 'ci-failure',
    },
  },

  // 7. Magic login link
  {
    from: `auth${INJECT_DOMAIN}`,
    to: ['demo-user@example.org'],
    subject: 'Your magic sign-in link',
    bodyText:
      'Click the link to finish signing in. This pretend link expires in 10 imaginary minutes.\n\n(Demo — link is inert.)',
    bodyHtml:
      '<!doctype html><html><body style="font-family:sans-serif;">' +
      '<h2>Sign in</h2>' +
      '<p style="margin:24px 0;">' +
      '<a href="#" style="display:inline-block;padding:12px 20px;background:#111;color:#fff;text-decoration:none;border-radius:6px;">Sign in</a>' +
      '</p>' +
      '<p style="color:#666;font-size:12px;">Expires in 10 pretend minutes. Inert demo link.</p>' +
      '</body></html>',
    headers: {
      'Content-Type': 'multipart/alternative',
      'X-Demo-Injected': 'magic-link',
    },
  },

  // 8. Feature announcement
  {
    from: `product${INJECT_DOMAIN}`,
    to: ['demo-user@example.org'],
    subject: 'New: fictional feature now in beta',
    bodyText:
      'We just shipped an entirely imaginary feature — and you can try it in (pretend) beta.\n\nHighlights:\n- Does nothing, gracefully\n- Imaginary performance gains\n- Zero real impact',
    bodyHtml:
      '<!doctype html><html><body style="font-family:sans-serif;">' +
      '<h1>Fictional feature, now in beta</h1>' +
      '<ul>' +
      '<li>Does nothing, gracefully</li>' +
      '<li>Imaginary performance gains</li>' +
      '<li>Zero real impact</li>' +
      '</ul>' +
      '<p><a href="#">Try the beta</a></p>' +
      '</body></html>',
    headers: {
      'Content-Type': 'multipart/alternative',
      'X-Demo-Injected': 'product-announcement',
    },
  },

  // 9. Survey / feedback request
  {
    from: `feedback${INJECT_DOMAIN}`,
    to: ['demo-user@example.org'],
    subject: 'Got 30 (pretend) seconds?',
    bodyText:
      'We would love your imaginary feedback on the demo. No data is collected — the link is inert.\n\nThanks!',
    bodyHtml:
      '<!doctype html><html><body style="font-family:sans-serif;">' +
      '<h2>Quick feedback</h2>' +
      '<p>Got 30 pretend seconds? Share your imaginary thoughts.</p>' +
      '<p><a href="#">Start survey</a> (inert)</p>' +
      '</body></html>',
    headers: {
      'Content-Type': 'multipart/alternative',
      'X-Demo-Injected': 'survey',
    },
  },

  // 10. Support ticket reply
  {
    from: `support${INJECT_DOMAIN}`,
    to: ['demo-user@example.org'],
    subject: 'Re: your (pretend) ticket #DEMO-7',
    bodyText:
      'Thanks for reaching out to fake support.\n\nWe took a look at ticket #DEMO-7 and confirmed it was entirely imaginary. Marking as resolved.\n\n— Demo Support',
    bodyHtml:
      '<!doctype html><html><body style="font-family:sans-serif;">' +
      '<h2>Ticket #DEMO-7 update</h2>' +
      '<p>Thanks for reaching out to fake support. We confirmed the ticket was imaginary and marked it resolved.</p>' +
      '<p><a href="#">View ticket</a></p>' +
      '<p>— Demo Support</p>' +
      '</body></html>',
    headers: {
      'Content-Type': 'multipart/alternative',
      'X-Demo-Injected': 'support-reply',
    },
  },
];
