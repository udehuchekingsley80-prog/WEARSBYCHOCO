// Backend-only. Builds the HTML (and matching plain-text) bodies for
// transactional emails, styled to read like a real bank's notification —
// still entirely for the fictional Northstar Financial product.

const BRAND_NAVY = '#0d1b33';
const BRAND_NAVY_DARK = '#0a1428';
const BRAND_BLUE = '#1c4fd6';
const GREEN = '#0a8a52';
const RED = '#c0293d';
const INK_900 = '#12161f';
const INK_500 = '#69707e';
const GRAY_50 = '#f5f6f9';
const GRAY_200 = '#e1e4ea';

function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

function detailRow(label, value) {
  if (value == null || value === '') return '';
  return `
    <tr>
      <td style="padding:11px 0;border-bottom:1px solid ${GRAY_200};color:${INK_500};font-size:13px;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(label)}</td>
      <td style="padding:11px 0;border-bottom:1px solid ${GRAY_200};color:${INK_900};font-size:13px;font-weight:600;font-family:Arial,Helvetica,sans-serif;text-align:right;">${value}</td>
    </tr>`;
}

/**
 * Wraps a notification in the shared Northstar Financial email chrome:
 * navy header with the brand mark, a white content card, and a footer.
 */
function wrapEmail({
  preheader, eyebrow, headline, amountText, amountColor, bodyHtml, footerNote,
}) {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(headline)}</title>
</head>
<body style="margin:0;padding:0;background:${GRAY_50};font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader || '')}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${GRAY_50};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${GRAY_200};">

        <tr>
          <td style="background:linear-gradient(135deg, ${BRAND_NAVY} 0%, ${BRAND_NAVY_DARK} 100%);padding:26px 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="width:34px;height:34px;background:${BRAND_BLUE};border-radius:9px;text-align:center;vertical-align:middle;font-family:Georgia,serif;font-weight:bold;color:#ffffff;font-size:17px;">N</td>
              <td style="padding-left:11px;color:#ffffff;font-size:16px;font-weight:700;font-family:Arial,Helvetica,sans-serif;">Northstar Financial</td>
            </tr></table>
          </td>
        </tr>

        <tr>
          <td style="padding:34px 32px 8px;">
            <div style="color:${INK_500};font-size:12px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(eyebrow)}</div>
            <div style="color:${INK_900};font-size:19px;font-weight:700;margin-top:6px;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(headline)}</div>
            ${amountText ? `<div style="color:${amountColor};font-size:36px;font-weight:700;margin-top:18px;font-variant-numeric:tabular-nums;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(amountText)}</div>` : ''}
          </td>
        </tr>

        <tr>
          <td style="padding:8px 32px 30px;">
            ${bodyHtml}
          </td>
        </tr>

        <tr>
          <td style="background:${GRAY_50};padding:22px 32px;border-top:1px solid ${GRAY_200};">
            <div style="color:${INK_500};font-size:11.5px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
              ${footerNote}
            </div>
            <div style="color:${INK_500};font-size:11px;margin-top:14px;font-family:Arial,Helvetica,sans-serif;">
              Northstar Financial · This is an automated notification — please do not reply with sensitive account details.
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Owner-facing "Debit Notification" — sent to the account holder whenever
 * money leaves their account via a transfer.
 */
function buildDebitNotificationEmail({
  recipientTitle, recipientName, amountText, accountNickname, accountLast4,
  toName, transferType, memo, confirmationCode, newBalanceText, whenText,
}) {
  const bodyHtml = `
    <p style="color:${INK_900};font-size:14px;line-height:1.6;margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;">
      Hello ${escapeHtml([recipientTitle, recipientName].filter(Boolean).join(' '))}, a transfer was sent from your account. Here are the details:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${detailRow('From account', `${escapeHtml(accountNickname)} •••${escapeHtml(accountLast4)}`)}
      ${detailRow('To', escapeHtml(toName))}
      ${detailRow('Transfer type', escapeHtml(transferType))}
      ${memo ? detailRow('Memo', escapeHtml(memo)) : ''}
      ${detailRow('Date', escapeHtml(whenText))}
      ${detailRow('Confirmation code', `<span style="font-family:'Courier New',monospace;">${escapeHtml(confirmationCode)}</span>`)}
      ${detailRow('New balance', escapeHtml(newBalanceText))}
    </table>
  `;

  const footerNote = `If you did not authorize this transfer, please contact Northstar Financial support immediately. Never share your password, PIN, or one-time codes with anyone — Northstar Financial will never ask for them by email.`;

  return wrapEmail({
    preheader: `A transfer of ${amountText} was sent from your ${accountNickname}.`,
    eyebrow: 'Debit Notification',
    headline: 'Money left your account',
    amountText: `-${amountText}`,
    amountColor: INK_900,
    bodyHtml,
    footerNote,
  });
}

/**
 * Recipient-facing "Transfer Notification" — the incoming-funds notice sent
 * to whoever the account holder is paying, styled like a real bank's
 * "you've received a payment" email.
 */
function buildTransferNotificationEmail({
  recipientName, amountText, senderName, memo, confirmationCode, whenText,
}) {
  const bodyHtml = `
    <p style="color:${INK_900};font-size:14px;line-height:1.6;margin:0 0 22px;font-family:Arial,Helvetica,sans-serif;">
      Hello ${escapeHtml(recipientName)}, ${escapeHtml(senderName)} sent you money using Northstar Financial. Funds have been sent to the account you provided.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${detailRow('From', escapeHtml(senderName))}
      ${memo ? detailRow('Memo', escapeHtml(memo)) : ''}
      ${detailRow('Date', escapeHtml(whenText))}
      ${detailRow('Confirmation code', `<span style="font-family:'Courier New',monospace;">${escapeHtml(confirmationCode)}</span>`)}
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
      <tr><td style="background:#e8f8ef;border-radius:10px;padding:13px 16px;">
        <span style="color:${GREEN};font-size:12.5px;font-weight:600;font-family:Arial,Helvetica,sans-serif;">✓ Payment confirmed and on its way to your account.</span>
      </td></tr>
    </table>
  `;

  const footerNote = `This transfer was initiated by ${escapeHtml(senderName)} through Northstar Financial. If you weren't expecting this payment or don't recognize the sender, you can safely disregard this email — no action is required on your part, and no personal information was shared with the sender beyond what they already provided.`;

  return wrapEmail({
    preheader: `${senderName} sent you ${amountText} via Northstar Financial.`,
    eyebrow: 'Incoming Transfer',
    headline: `You've received a transfer`,
    amountText: `+${amountText}`,
    amountColor: GREEN,
    bodyHtml,
    footerNote,
  });
}

module.exports = { buildDebitNotificationEmail, buildTransferNotificationEmail };
