const Imap = require('imap');
const { simpleParser } = require('mailparser');
const config = require('../../config');
const logger = require('../../utils/logger');

function fetchInbox(count = 10) {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: config.email.user,
      password: config.email.pass,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
    });

    const emails = [];

    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err, box) => {
        if (err) { imap.end(); return reject(err); }

        imap.search(['UNSEEN'], (err, results) => {
          if (err) { imap.end(); return reject(err); }
          if (!results || !results.length) { imap.end(); return resolve([]); }

          const fetch = imap.fetch(results.slice(-count), { bodies: '', struct: true });

          fetch.on('message', (msg) => {
            msg.on('body', (stream) => {
              simpleParser(stream, (err, parsed) => {
                if (!err) {
                  emails.push({
                    subject: parsed.subject,
                    from: parsed.from?.text,
                    to: parsed.to?.text,
                    text: parsed.text,
                    html: parsed.html,
                    date: parsed.date,
                  });
                }
              });
            });
          });

          fetch.once('end', () => {
            imap.end();
            resolve(emails);
          });
        });
      });
    });

    imap.once('error', (err) => reject(err));
    imap.connect();
  });
}

async function check() {
  try {
    const emails = await fetchInbox(5);
    logger.info('EmailReceiver', `Fetched ${emails.length} new emails`);
    return { success: true, emails };
  } catch (err) {
    logger.error('EmailReceiver', 'Failed to fetch emails', err.message);
    return { success: false, error: err.message, emails: [] };
  }
}

module.exports = { check, fetchInbox };
