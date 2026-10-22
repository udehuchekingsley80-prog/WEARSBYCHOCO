// Backend-only. This module must never be imported by anything served to
// the browser — it is only required from server-side route handlers.
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { EmailNotification } = require('../models');

const SENT_EMAILS_DIR = path.join(__dirname, '..', 'sent-emails');

function buildTransport() {
  const transportMode = process.env.EMAIL_TRANSPORT || 'stream';

  if (transportMode === 'smtp') {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
      // Without this, nodemailer's EHLO/HELO greeting identifies the client
      // as a bracketed IP literal (e.g. "[127.0.0.1]") rather than a real
      // hostname — a classic spam-filter red flag that can get an otherwise
      // cleanly-accepted, authenticated message routed straight to Junk.
      // Greeting with the sending domain itself matches what a legitimate
      // mail client would send.
      name: process.env.SMTP_HOST,
      // This host's connection has been observed to be marginal — a slow
      // handshake shouldn't be treated as a hard failure before it's had a
      // real chance to complete.
      connectionTimeout: 20000,
      greetingTimeout: 20000,
      socketTimeout: 30000,
    });
  }

  return nodemailer.createTransport({ streamTransport: true, newline: 'unix', buffer: true });
}

function delay(ms) {
  return new Promise((resolve) => { setTimeout(resolve, ms); });
}

/**
 * Sends an email and logs it to the emailnotifications collection. In
 * `stream` mode (the default), a real RFC 822 message is generated and
 * written to sent-emails/*.eml with no external network call.
 */
async function sendEmail({
  userId, toEmail, subject, body, html = null, type, relatedTransferId = null,
}) {
  const transportMode = process.env.EMAIL_TRANSPORT || 'stream';
  const from = process.env.EMAIL_FROM || 'Northstar Financial <no-reply@northstarfinancial.example>';

  let status = 'sent';
  let emlPath = null;
  const maxAttempts = transportMode === 'smtp' ? 3 : 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const transport = buildTransport();
      const info = await transport.sendMail({
        from,
        to: toEmail,
        subject,
        text: body,
        ...(html ? { html } : {}),
        // Deliverability + notification headers so the message lands in the
        // recipient's primary inbox instead of spam, and reads as a
        // transactional notification rather than a marketing email.
        replyTo: from,
        headers: {
          'X-Mailer': 'Northstar Financial Notifications',
          'X-Priority': '3 (Normal)',
          'X-Auto-Response-Suppress': 'OOF, AutoReply',
          'List-Unsubscribe': `<mailto:${process.env.EMAIL_FROM ? process.env.EMAIL_FROM.replace(/.*<|>.*/g, '') : 'no-reply@northstarfinancial.example'}?subject=unsubscribe>`,
        },
      });

      if (transportMode === 'stream' && info.message) {
        if (!fs.existsSync(SENT_EMAILS_DIR)) {
          fs.mkdirSync(SENT_EMAILS_DIR, { recursive: true });
        }
        const timestamp = Date.now();
        const safeSubject = subject.replace(/[^a-z0-9]+/gi, '-').slice(0, 60);
        const fileName = `${timestamp}-${safeSubject}.eml`;
        const fullPath = path.join(SENT_EMAILS_DIR, fileName);
        fs.writeFileSync(fullPath, info.message);
        emlPath = path.relative(path.join(__dirname, '..'), fullPath);
      }

      status = 'sent';
      break;
    } catch (err) {
      status = 'failed';
      // eslint-disable-next-line no-console
      console.error(`Email send failed (attempt ${attempt}/${maxAttempts}, to: ${toEmail}, subject: "${subject}"):`, err.message);
      if (attempt < maxAttempts) await delay(1500 * attempt);
    }
  }

  await EmailNotification.create({
    userId,
    toEmail,
    subject,
    body,
    type,
    relatedTransferId,
    status,
    emlPath,
  });

  return { status, emlPath };
}

module.exports = { sendEmail };
