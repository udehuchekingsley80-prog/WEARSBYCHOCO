// Backend-only. This module must never be imported by anything served to
// the browser — it is only required from server-side route handlers.
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { EmailNotification } = require('../models');

const SENT_EMAILS_DIR = path.join(__dirname, '..', 'sent-emails');

let transporter = null;

function buildTransport() {
  const transportMode = process.env.EMAIL_TRANSPORT || 'smtp';

  if (transportMode === 'smtp') {
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = process.env.SMTP_SECURE !== undefined 
      ? process.env.SMTP_SECURE === 'true' 
      : port === 465;
    
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: port,
      secure: secure,
      auth: process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
      name: process.env.SMTP_HOST,
      connectionTimeout: 20000,
      greetingTimeout: 20000,
      socketTimeout: 30000,
    });
  }

  return nodemailer.createTransport({ streamTransport: true, newline: 'unix', buffer: true });
}

function getTransporter() {
  if (!transporter) {
    transporter = buildTransport();
  }
  return transporter;
}

async function verifyTransport() {
  try {
    const transportMode = process.env.EMAIL_TRANSPORT || 'smtp';
    if (transportMode === 'smtp') {
      const transport = getTransporter();
      await transport.verify();
      console.log('SMTP transport verified successfully');
      return { success: true };
    } else {
      console.log('Email transport in stream mode (no SMTP verification needed)');
      return { success: true, mode: 'stream' };
    }
  } catch (err) {
    console.error('SMTP transport verification failed:', err.message);
    if (err.code) console.error('Error code:', err.code);
    return { success: false, error: err.message, code: err.code };
  }
}

function delay(ms) {
  return new Promise((resolve) => { setTimeout(resolve, ms); });
}

/**
 * Sends an email and logs it to the emailnotifications collection.
 */
async function sendEmail({
  userId, toEmail, subject, body, html = null, type, relatedTransferId = null,
}) {
  const transportMode = process.env.EMAIL_TRANSPORT || 'smtp';
  const from = process.env.EMAIL_FROM || 'Northstar Financial <no-reply@northstarfinancial.example>';

  let status = 'sent';
  let emlPath = null;
  let errorReason = null;
  const maxAttempts = transportMode === 'smtp' ? 3 : 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const transport = getTransporter();
      const info = await transport.sendMail({
        from,
        to: toEmail,
        subject,
        text: body,
        ...(html ? { html } : {}),
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
      errorReason = null;
      break;
    } catch (err) {
      status = 'failed';
      errorReason = err.message;
      console.error(`Email send failed (attempt ${attempt}/${maxAttempts}, to: ${toEmail}, subject: "${subject}"):`, err.message);
      if (err.code) console.error(`Error code: ${err.code}`);
      if (attempt < maxAttempts) await delay(1500 * attempt);
    }
  }

  try {
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
  } catch (dbErr) {
    console.error('Failed to log email notification:', dbErr.message);
  }

  return { status, emlPath, error: errorReason };
}

module.exports = { sendEmail, verifyTransport };
