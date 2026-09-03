// Disposable/throwaway domains no mailer should ever address. Extracted from
// send-campaign.mjs (which now imports it) so the confirmation nudge applies
// the same hygiene — sending to burner addresses is how a domain's sender
// reputation dies.

export const BLOCKED_DOMAINS = new Set([
  'example.com', 'mailinator.com', 'guerrillamail.com', 'tempmail.com',
  'throwaway.email', 'sharklasers.com', 'guerrillamailblock.com',
  'grr.la', 'guerrillamail.info', 'spam4.me', 'trashmail.com',
  'trashmail.me', 'trashmail.net', 'yopmail.com', 'dispostable.com',
  'maildrop.cc', 'mailnull.com', 'spamgourmet.com', 'spamgourmet.net',
  'spamgourmet.org', 'spamtrap.ro', 'tempr.email', 'fakeinbox.com',
  'getairmail.com', 'filzmail.com', '33mail.com', 'spamfree24.org',
]);

export function isBlockedEmail(email) {
  if (!email || !email.includes('@')) return true;
  const domain = email.split('@')[1].toLowerCase();
  return BLOCKED_DOMAINS.has(domain);
}
