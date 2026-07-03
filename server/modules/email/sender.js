const nodemailer = require('nodemailer');
const config = require('../../config');
const logger = require('../../utils/logger');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: false,
      auth: { user: config.email.user, pass: config.email.pass },
    });
  }
  return transporter;
}

async function send(params) {
  const { to, subject, text, html, attachments } = params;
  if (!to) return { success: false, error: 'Recipient (to) is required' };

  try {
    const info = await getTransporter().sendMail({
      from: `"AI Wakeel" <${config.email.user}>`,
      to,
      subject: subject || 'Message from AI Agent',
      text,
      html: html || (text ? undefined : `<p>${text || ''}</p>`),
      attachments,
    });
    logger.info('EmailSender', `Sent to ${to}`, { messageId: info.messageId });
    return { success: true, messageId: info.messageId, to, subject };
  } catch (err) {
    logger.error('EmailSender', `Failed to send to ${to}`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { send };
