/**
 * Bhumi Varahi Impex - RFQ form backup to Google Sheets
 *
 * Saves every quotation request from the website into this spreadsheet
 * and emails a notification to the export desk.
 *
 * Setup: see integrations/README.md
 */

const SHEET_NAME = 'RFQs';
const NOTIFY_EMAIL = 'info@bhumivarahiimpex.com';
const HEADERS = ['Received', 'RFQ No.', 'Company / Buyer', 'Email', 'Phone / WhatsApp', 'Country',
                 'Commodity', 'Quantity', 'Specs & notes', 'Status', 'Notes (internal)',
                 'Contact person', 'Grade / type', 'Destination port', 'Incoterm', 'Packing', 'Bag branding',
                 'Shipment', 'Payment terms', 'Target price (USD/MT)', 'Sample needed', 'Final destination (inland)'];
// Form fields stored in columns 12-22, in this order (added Nov 2026).
const EXTRA_FIELDS = ['contact', 'grade', 'port', 'incoterm', 'packing', 'label', 'shipment', 'payment', 'price', 'sample', 'final_dest'];

// "Dar es Salaam, Tanzania (transit) -> Kigali (Masaka ICD), Rwanda" for landlocked buyers, else "Jebel Ali, United Arab Emirates".
function destText_(p) {
  const port = String(p.port || '');
  if (/\(transit\)$/.test(port) || p.final_dest) return [port, [p.final_dest, p.country].filter(Boolean).join(', ')].filter(Boolean).join(' -> ');
  return [port, p.country].filter(Boolean).join(', ');
}
function portName_(p) { return String(p.port || '').replace(/\s*\(transit\)$/, '').split(',')[0].trim(); }

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const p = (e && e.parameter) || {};
    if (p.botcheck) return json_({ success: true }); // spam trap filled in

    const sheet = getSheet_();
    // The website makes the RFQ No. so the buyer sees it on screen at once; otherwise make one here.
    p.ref = /^BV-\d{6}-\d{6}$/.test(String(p.ref || '')) ? String(p.ref)
      : 'BV-' + Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyMMdd-HHmmss');
    const clean = v => {
      v = String(v || '').trim().slice(0, 2000);
      return /^[=+\-@]/.test(v) ? "'" + v : v; // stop formula injection
    };

    // Junk goes to a separate Spam tab, with no emails sent.
    const spamReason = spamReason_(p);
    if (spamReason) {
      getSpamSheet_().appendRow([new Date(), clean(p.name), clean(p.email), clean(p.phone), clean(p.country),
                                 clean(p.commodity), clean(p.quantity), clean(p.notes), spamReason]);
      return json_({ success: true });
    }

    // Same buyer, same product within an hour: note it on the first request instead of a new row.
    const dup = findRecentDuplicate_(sheet, p);
    if (dup) {
      const cell = sheet.getRange(dup.row, 11);
      const extra = String(p.notes || '').trim() && String(p.notes).trim() !== String(dup.notes).trim()
        ? ' (new details: ' + clean(p.notes).slice(0, 300) + ')' : '';
      cell.setValue(cell.getValue() + ' · Resubmitted ' + Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd MMM HH:mm') + ' as ' + p.ref + extra);
      return json_({ success: true });
    }

    sheet.appendRow([new Date(), p.ref, clean(p.name), clean(p.email), clean(p.phone), clean(p.country),
                     clean(p.commodity), clean(p.quantity), clean(p.notes), 'New', '']
                     .concat(EXTRA_FIELDS.map(k => clean(p[k]))));

    notify_(p);
    try { acknowledge_(p); } catch (ackErr) { console.warn('Buyer acknowledgement failed: ' + ackErr); }
    return json_({ success: true });
  } catch (err) {
    return json_({ success: false, message: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Lets you open the web app URL in a browser to check it is live.
function doGet() {
  return json_({ success: true, message: 'Bhumi Varahi RFQ endpoint is live.' });
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() > 0) { migrateRfqNo_(sheet); addNewColumns_(sheet); }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight('bold').setBackground('#1B4D3E').setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, HEADERS.length, 170);
    sheet.getRange('A:A').setNumberFormat('dd-mmm-yyyy hh:mm');
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['New', 'Contacted', 'Quoted', 'Won', 'Lost'], true).build();
    sheet.getRange(2, 10, 1000, 1).setDataValidation(rule);
  }
  return sheet;
}

// Older sheets had no RFQ No. column (the reference sat in Notes as "Ref: BV-...").
// This inserts the column as B once, and moves each existing reference into it.
// Adds the newer form columns (Contact person ... Payment terms) to an older sheet, once.
function addNewColumns_(sheet) {
  const width = Math.max(sheet.getLastColumn(), HEADERS.length);
  const head = sheet.getRange(1, 1, 1, width).getValues()[0];
  if (String(head[HEADERS.length - 1]) === HEADERS[HEADERS.length - 1]) return;
  if (String(head[8]) === 'Port & Packaging') sheet.getRange(1, 9).setValue('Specs & notes');
  const start = 12, n = HEADERS.length - start + 1;
  sheet.getRange(1, start, 1, n).setValues([HEADERS.slice(start - 1)])
    .setFontWeight('bold').setBackground('#1B4D3E').setFontColor('#FFFFFF');
}

function migrateRfqNo_(sheet) {
  if (String(sheet.getRange(1, 2).getValue()) === 'RFQ No.') return;
  sheet.insertColumnBefore(2);
  sheet.getRange(1, 2).setValue('RFQ No.').setFontWeight('bold').setBackground('#1B4D3E').setFontColor('#FFFFFF');
  sheet.setColumnWidth(2, 150);
  const n = sheet.getLastRow() - 1;
  if (n < 1) return;
  const notes = sheet.getRange(2, 11, n, 1).getValues();
  const refs = notes.map(r => [(String(r[0]).match(/BV-\d{6}-\d{6}/) || [''])[0]]);
  const rest = notes.map(r => [String(r[0]).replace(/^Ref: BV-\d{6}-\d{6}\s*(·\s*)?/, '')]);
  sheet.getRange(2, 2, n, 1).setValues(refs);
  sheet.getRange(2, 11, n, 1).setValues(rest);
}

function notify_(p) {
  const esc = s => String(s || '-').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const row = (k, v) => `<tr><td style="padding:6px 12px;color:#5A6A72;">${k}</td><td style="padding:6px 12px;font-weight:bold;color:#1e293b;">${esc(v)}</td></tr>`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
    <div style="background:#1B4D3E;color:#E5C158;padding:14px 18px;font-weight:bold;letter-spacing:1px;">NEW REQUEST FOR QUOTATION</div>
    <table style="border-collapse:collapse;font-size:14px;margin:10px 6px;">
      ${row('RFQ No.', p.ref)}${row('Company / Buyer', p.name)}${row('Email', p.email)}${row('Phone / WhatsApp', p.phone)}
      ${row('Contact person', p.contact)}${row('Country', p.country)}${row('Destination port', p.port)}${p.final_dest ? row('Final destination (inland)', p.final_dest) : ''}
      ${row('Commodity', p.commodity)}${row('Grade / type', p.grade)}${row('Quantity', p.quantity)}${row('Incoterm', p.incoterm)}
      ${row('Packing', p.packing)}${row('Bag branding', p.label)}${row('Shipment', p.shipment)}${row('Payment terms', p.payment)}
      ${row('Target price (USD/MT)', p.price)}${row('Sample needed', p.sample)}
      ${row('Specs & notes', p.notes)}
    </table>
    <div style="background:#0E2820;color:#cbd5e1;padding:10px 18px;font-size:12px;">Reply to this email to answer the buyer directly. Saved in the RFQs sheet.</div>
  </div>`;
  sendMail_({
    to: NOTIFY_EMAIL,
    replyTo: p.email || NOTIFY_EMAIL,
    subject: `New RFQ ${p.ref}: ${p.commodity || 'Inquiry'} from ${p.name || 'website visitor'}`,
    htmlBody: html,
    name: 'Bhumi Varahi Website'
  });
}

// Thank-you email to the buyer, so they know the request reached us.
function acknowledge_(p) {
  const email = String(p.email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
  const esc = s => String(s || '-').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const name = esc(p.contact || p.name || 'Sir / Madam');
  const row = (k, v) => `<tr><td style="padding:6px 12px;color:#5A6A72;width:150px;">${k}</td><td style="padding:6px 12px;color:#1e293b;font-weight:bold;">${esc(v)}</td></tr>`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
    <div style="background:#1B4D3E;padding:18px 24px;border-bottom:3px solid #C9A227;">
      <img src="https://www.bhumivarahiimpex.com/brand/email-logo.png" alt="Bhumi Varahi Impex" height="48" style="display:block;">
    </div>
    <div style="padding:24px;color:#334155;font-size:15px;line-height:1.6;">
      <p style="margin:0 0 14px;">Dear ${name},</p>
      <p style="margin:0 0 14px;">Thank you for your request for quotation. We have received it, and our export desk is now working on your quotation.</p>
      <p style="margin:0 0 18px;">We will be in touch with you as soon as the quotation is ready. If you have anything to add, such as specifications, packaging or delivery timelines, simply reply to this email or message us on <a href="https://wa.me/919492992666" style="color:#1B4D3E;font-weight:bold;">WhatsApp</a>.</p>
      <div style="background:#F8F5EC;border-left:3px solid #C9A227;border-radius:4px;padding:8px 4px;margin:0 0 18px;">
        <div style="padding:4px 12px;font-size:12px;letter-spacing:1px;color:#8A6508;font-weight:bold;">YOUR REQUEST</div>
        <table style="border-collapse:collapse;font-size:14px;">
          ${row('RFQ No.', p.ref)}${row('Company', p.name)}${row('Email / Phone', [p.email, p.phone].filter(Boolean).join('  |  '))}${row('Contact person', p.contact)}${row('Commodity', p.commodity)}${row('Grade / type', p.grade)}${row('Quantity', p.quantity)}${row('Destination', destText_(p))}${row('Incoterm', p.incoterm)}${row('Packing', p.packing)}${row('Bag branding', p.label)}${row('Shipment', p.shipment)}${row('Payment terms', p.payment)}${p.price ? row('Target price (USD/MT)', p.price) : ''}${p.sample ? row('Sample', p.sample) : ''}${row('Other specifications', p.notes)}
        </table>
      </div>
      <p style="margin:0 0 14px;font-size:13px;color:#5A6A72;">Please quote your RFQ No. <strong style="color:#1B4D3E;">${esc(p.ref)}</strong> in any reply, and you will find it on our quotation.</p>
      <p style="margin:0;">Warm regards,<br><strong style="color:#1B4D3E;">Export Desk</strong><br>Bhumi Varahi Impex Pvt Ltd</p>
    </div>
    <div style="background:#0E2820;color:#cbd5e1;padding:12px 24px;font-size:12px;">
      <span style="color:#E5C158;">${NOTIFY_EMAIL}</span> &nbsp;|&nbsp;
      <span style="color:#E5C158;">WhatsApp +91 94929 92666</span> &nbsp;|&nbsp;
      <a href="https://www.bhumivarahiimpex.com" style="color:#E5C158;text-decoration:none;">www.bhumivarahiimpex.com</a>
    </div>
  </div>`;
  const text = `Dear ${p.contact || p.name || 'Sir / Madam'},\n\nThank you for your request for quotation. We have received it, and our export desk is now working on your quotation. We will be in touch as soon as the quotation is ready.\n\nRFQ No.: ${p.ref}\nCommodity: ${p.commodity || '-'}\nQuantity: ${p.quantity || '-'}\nDestination: ${destText_(p) || '-'}\nIncoterm: ${p.incoterm || '-'}\nPacking: ${p.packing || '-'}\n\nWarm regards,\nExport Desk, Bhumi Varahi Impex Pvt Ltd\n${NOTIFY_EMAIL} | WhatsApp +91 94929 92666 | www.bhumivarahiimpex.com`;
  sendMail_({
    to: email,
    replyTo: NOTIFY_EMAIL,
    subject: `We received your RFQ ${p.ref}: ${p.commodity || 'Quotation request'} | Bhumi Varahi Impex`,
    body: text,
    htmlBody: html,
    name: 'Bhumi Varahi Impex'
  });
}

// Sends through the info@ Gmail account itself (GmailApp), like an email typed by hand:
// it gets a normal Message-ID, shows in Sent, and Gmail recipients trust it more than
// the generic Apps Script mailer. Falls back to MailApp if Gmail sending is unavailable.
function sendMail_(o) {
  const text = o.body || String(o.htmlBody || '').replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>|<\/(p|div|tr|h\d)>/gi, '\n').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ').replace(/\n\s*\n\s*/g, '\n\n').trim();
  const opts = { name: o.name || 'Bhumi Varahi Impex' };
  if (o.htmlBody) opts.htmlBody = o.htmlBody;
  if (o.replyTo) opts.replyTo = o.replyTo;
  if (o.attachments) opts.attachments = o.attachments;
  try {
    GmailApp.sendEmail(o.to, o.subject, text, opts);
  } catch (err) {
    console.warn('GmailApp failed, using MailApp: ' + err);
    MailApp.sendEmail(o);
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ===== WEEKLY SUMMARY =====
// Run setupWeeklySummary() once from the editor. After that, info@ gets
// a summary every Monday around 9 AM IST. Run sendWeeklySummary() any time to test.
function setupWeeklySummary() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'sendWeeklySummary')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('sendWeeklySummary').timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(9).inTimezone('Asia/Kolkata').create();
  return 'Weekly summary scheduled for Mondays at about 9 AM IST.';
}

function sendWeeklySummary() {
  const sheet = getSheet_();
  const data = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length).getValues() : [];
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 864e5);
  const isDate = v => Object.prototype.toString.call(v) === '[object Date]';
  const rows = data.filter(r => isDate(r[0]) && (r[2] || r[3]));
  const newThisWeek = rows.filter(r => r[0] >= weekAgo);
  const count = s => rows.filter(r => String(r[9] || 'New') === s).length;
  const open = rows.filter(r => ['New', 'Contacted', 'Quoted'].includes(String(r[9] || 'New')))
                   .sort((a, b) => a[0] - b[0]);
  const esc = s => String(s == null || s === '' ? '-' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = d => Utilities.formatDate(d, 'Asia/Kolkata', 'dd MMM');
  const days = d => Math.floor((now - d) / 864e5);
  const ref = r => String(r[1] || '') || (String(r[10]).match(/BV-\d{6}-\d{6}/) || [''])[0];
  const stat = (label, n, bg) => `<td style="padding:10px;text-align:center;background:${bg};border-radius:6px;"><div style="font-size:22px;font-weight:bold;color:#1B4D3E;">${n}</div><div style="font-size:11px;color:#5A6A72;text-transform:uppercase;letter-spacing:1px;">${label}</div></td>`;
  const th = t => `<th style="text-align:left;padding:6px 8px;background:#1B4D3E;color:#fff;font-size:12px;">${t}</th>`;
  const td = (t, extra) => `<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:12px;${extra || ''}">${t}</td>`;
  const openRows = open.slice(0, 30).map(r => `<tr>${td(fmt(r[0]))}${td(esc(ref(r)))}${td(esc(r[2]))}${td(esc(r[6]))}${td(esc(r[7]))}${td(esc(r[5]))}${td(esc(r[9] || 'New'))}${td(days(r[0]) + ' d', days(r[0]) > 3 && String(r[9] || 'New') === 'New' ? 'color:#b91c1c;font-weight:bold;' : '')}</tr>`).join('');
  const html = `<div style="font-family:Arial,sans-serif;max-width:720px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
    <div style="background:#1B4D3E;color:#E5C158;padding:14px 18px;font-weight:bold;letter-spacing:1px;">WEEKLY RFQ SUMMARY · ${fmt(weekAgo)} – ${fmt(now)}</div>
    <div style="padding:16px 18px;">
      <table style="width:100%;border-collapse:separate;border-spacing:6px;"><tr>
        ${stat('New this week', newThisWeek.length, '#F8F5EC')}${stat('Awaiting reply', count('New'), '#FEF3C7')}${stat('Contacted', count('Contacted'), '#F1F5F9')}${stat('Quoted', count('Quoted'), '#F1F5F9')}${stat('Won', count('Won'), '#DCFCE7')}${stat('Lost', count('Lost'), '#FEE2E2')}
      </tr></table>
      <h3 style="color:#1B4D3E;font-size:15px;margin:18px 0 8px;">Open requests (${open.length})</h3>
      ${open.length ? `<table style="width:100%;border-collapse:collapse;"><tr>${th('Received')}${th('Ref')}${th('Buyer')}${th('Commodity')}${th('Qty')}${th('Country')}${th('Status')}${th('Age')}</tr>${openRows}</table>` : '<p style="color:#5A6A72;font-size:13px;">No open requests. Nice work.</p>'}
      <p style="color:#5A6A72;font-size:12px;margin-top:14px;">Red ages are "New" requests older than 3 days. Update the Status column in the sheet as you follow up: <a href="${SpreadsheetApp.getActiveSpreadsheet().getUrl()}" style="color:#1B4D3E;">open the RFQ sheet</a>.</p>
    </div></div>`;
  sendMail_({ to: NOTIFY_EMAIL, subject: `Weekly RFQ summary: ${newThisWeek.length} new, ${open.length} open`, htmlBody: html, name: 'Bhumi Varahi Website' });
}

// ===== AUTOMATIONS =====
// Run setupAutomations() once from the editor (it also keeps the weekly summary).
// It schedules:
//   dailyDigest     every day ~9 AM IST: RFQs waiting for a reply or a quote, and outreach follow-ups due today
//   healthCheck     every 6 hours: emails info@ only if the website or this RFQ endpoint is down (and once when it recovers)
//   sendMonthlyReport on the 1st of each month ~9 AM IST: last month's RFQs by product, country and status
const SITE_URL = 'https://www.bhumivarahiimpex.com/';
const OUTREACH_SHEET = 'Outreach';
const OUTREACH_HEADERS = ['Date', 'Company', 'Country', 'Contact name', 'Email / WhatsApp', 'Product interest',
                          'Language', 'Stage', 'Next follow-up', 'Notes'];
const OUTREACH_STAGES = ['Sent', 'Follow-up 1', 'Follow-up 2', 'Replied', 'Quoted', 'Sample', 'Order', 'Not interested'];
const REPLY_AFTER_HOURS = 24;   // "New" RFQs older than this are flagged
const QUOTE_AFTER_DAYS = 3;     // "New" / "Contacted" RFQs older than this without a quote are flagged

function setupAutomations() {
  const handlers = ['dailyDigest', 'healthCheck', 'sendMonthlyReport'];
  ScriptApp.getProjectTriggers()
    .filter(t => handlers.includes(t.getHandlerFunction()))
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('dailyDigest').timeBased().everyDays(1).atHour(9).inTimezone('Asia/Kolkata').create();
  ScriptApp.newTrigger('healthCheck').timeBased().everyHours(6).create();
  ScriptApp.newTrigger('sendMonthlyReport').timeBased().onMonthDay(1).atHour(9).inTimezone('Asia/Kolkata').create();
  setupWeeklySummary();
  getOutreachSheet_();
  getSpamSheet_();
  return 'Automations scheduled: daily digest, health check every 6 hours, monthly report, weekly summary.';
}

// --- Spam and duplicates (used by doPost) ---
function spamReason_(p) {
  const all = [p.name, p.email, p.phone, p.country, p.commodity, p.quantity, p.notes].map(v => String(v || '')).join(' ');
  const links = (all.match(/https?:\/\/|www\./gi) || []).length;
  if (!String(p.email || '').trim() && !String(p.phone || '').trim()) return 'No email or phone';
  if (/https?:\/\/|www\./i.test(String(p.name || '') + String(p.phone || ''))) return 'Link in name or phone';
  if (links >= 3) return 'Too many links';
  if (/\b(seo|backlinks?|casino|crypto|bitcoin|forex|viagra|loan offer|guest post|rank your website|web design services)\b/i.test(all)) return 'Spam keywords';
  return '';
}

function findRecentDuplicate_(sheet, p) {
  const email = String(p.email || '').trim().toLowerCase();
  const phone = String(p.phone || '').replace(/\D/g, '');
  if (!email && phone.length < 6) return null;
  const last = sheet.getLastRow();
  if (last < 2) return null;
  const start = Math.max(2, last - 49);
  const rows = sheet.getRange(start, 1, last - start + 1, HEADERS.length).getValues();
  const cutoff = Date.now() - 60 * 60 * 1000;
  const commodity = String(p.commodity || '').trim().toLowerCase();
  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i];
    if (!isDate_(r[0]) || r[0].getTime() < cutoff) continue;
    const sameBuyer = (email && String(r[3]).trim().toLowerCase() === email) ||
                      (phone.length >= 6 && String(r[4]).replace(/\D/g, '') === phone);
    if (sameBuyer && String(r[6]).trim().toLowerCase() === commodity) return { row: start + i, notes: r[8] };
  }
  return null;
}

function getSpamSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName('Spam');
  if (!sh) {
    sh = ss.insertSheet('Spam');
    sh.appendRow(['Received', 'Company / Buyer', 'Email', 'Phone / WhatsApp', 'Country', 'Commodity', 'Quantity', 'Port & Packaging', 'Reason']);
    sh.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#64748b').setFontColor('#FFFFFF');
    sh.setFrozenRows(1);
  }
  return sh;
}

// --- Outreach tab ---
function getOutreachSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(OUTREACH_SHEET);
  if (!sh) {
    sh = ss.insertSheet(OUTREACH_SHEET);
    sh.appendRow(OUTREACH_HEADERS);
    sh.getRange(1, 1, 1, OUTREACH_HEADERS.length).setFontWeight('bold').setBackground('#1B4D3E').setFontColor('#FFFFFF');
    sh.setFrozenRows(1);
    sh.setColumnWidths(1, OUTREACH_HEADERS.length, 150);
    sh.getRange('A:A').setNumberFormat('dd-mmm-yyyy');
    sh.getRange('I:I').setNumberFormat('dd-mmm-yyyy');
    sh.getRange(2, 8, 1000, 1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(OUTREACH_STAGES, true).build());
    sh.getRange(2, 7, 1000, 1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(['English', 'Arabic', 'French'], true).build());
  }
  return sh;
}

// Runs by itself when anyone edits the sheet. In the Outreach tab, choosing a Stage
// fills in the Date (if empty) and the Next follow-up date: Sent +4 days, Follow-up 1 +6 days.
function onEdit(e) {
  if (!e || !e.range) return;
  const sh = e.range.getSheet();
  if (sh.getName() !== OUTREACH_SHEET || e.range.getColumn() !== 8 || e.range.getRow() < 2) return;
  const row = e.range.getRow();
  const stage = String(e.range.getValue());
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (!sh.getRange(row, 1).getValue()) sh.getRange(row, 1).setValue(today);
  const gap = { 'Sent': 4, 'Follow-up 1': 6, 'Replied': 1, 'Quoted': 3, 'Sample': 7 }[stage];
  sh.getRange(row, 9).setValue(gap ? new Date(today.getTime() + gap * 864e5) : '');
}

// --- Daily digest ---
function dailyDigest() {
  const now = new Date();
  const ist = d => Utilities.formatDate(d, 'Asia/Kolkata', 'yyyy-MM-dd');
  const today = ist(now);
  const fmt = d => Utilities.formatDate(d, 'Asia/Kolkata', 'dd MMM');
  const esc = s => String(s == null || s === '' ? '-' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const th = t => `<th style="text-align:left;padding:6px 8px;background:#1B4D3E;color:#fff;font-size:12px;">${t}</th>`;
  const td = t => `<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:12px;">${t}</td>`;
  const ref = r => String(r[1] || '') || (String(r[10]).match(/BV-\d{6}-\d{6}/) || [''])[0];
  const hours = d => (now - d) / 36e5;

  const sheet = getSheet_();
  const data = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length).getValues() : [];
  const rfqs = data.filter(r => isDate_(r[0]) && (r[2] || r[3]));
  const needReply = rfqs.filter(r => String(r[9] || 'New') === 'New' && hours(r[0]) >= REPLY_AFTER_HOURS);
  const needQuote = rfqs.filter(r => String(r[9] || 'New') === 'Contacted' && hours(r[0]) >= QUOTE_AFTER_DAYS * 24);

  const out = getOutreachSheet_();
  const odata = out.getLastRow() > 1 ? out.getRange(2, 1, out.getLastRow() - 1, OUTREACH_HEADERS.length).getValues() : [];
  const closed = ['Order', 'Not interested'];
  const due = odata.filter(r => r[1] && isDate_(r[8]) && ist(r[8]) <= today && !closed.includes(String(r[7])));
  const nextStep = s => ({ 'Sent': 'Send Follow-up 1', 'Follow-up 1': 'Send Follow-up 2 (last note)', 'Follow-up 2': 'Close or mark Not interested',
                           'Replied': 'Answer and quote', 'Quoted': 'Check on the quote', 'Sample': 'Ask for sample feedback' }[s] || 'Follow up');

  if (!needReply.length && !needQuote.length && !due.length) return 'Nothing due today, no email sent.';

  const rfqTable = (rows, label, colour) => rows.length ? `<h3 style="color:${colour};font-size:15px;margin:18px 0 8px;">${label} (${rows.length})</h3>
    <table style="width:100%;border-collapse:collapse;"><tr>${th('Received')}${th('Ref')}${th('Buyer')}${th('Commodity')}${th('Qty')}${th('Country')}${th('Email')}</tr>
    ${rows.sort((a, b) => a[0] - b[0]).slice(0, 30).map(r => `<tr>${td(fmt(r[0]))}${td(esc(ref(r)))}${td(esc(r[2]))}${td(esc(r[6]))}${td(esc(r[7]))}${td(esc(r[5]))}${td(esc(r[3]))}</tr>`).join('')}</table>` : '';
  const outTable = due.length ? `<h3 style="color:#1B4D3E;font-size:15px;margin:18px 0 8px;">Outreach follow-ups due (${due.length})</h3>
    <table style="width:100%;border-collapse:collapse;"><tr>${th('Due')}${th('Company')}${th('Country')}${th('Contact')}${th('Email / WhatsApp')}${th('Language')}${th('Next step')}</tr>
    ${due.sort((a, b) => a[8] - b[8]).slice(0, 40).map(r => `<tr>${td(fmt(r[8]))}${td(esc(r[1]))}${td(esc(r[2]))}${td(esc(r[3]))}${td(esc(r[4]))}${td(esc(r[6]))}${td(esc(nextStep(String(r[7]))))}</tr>`).join('')}</table>` : '';

  const html = `<div style="font-family:Arial,sans-serif;max-width:720px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
    <div style="background:#1B4D3E;color:#E5C158;padding:14px 18px;font-weight:bold;letter-spacing:1px;">TODAY'S FOLLOW-UPS · ${fmt(now)}</div>
    <div style="padding:6px 18px 16px;">
      ${rfqTable(needReply, 'RFQs waiting for a first reply (over ' + REPLY_AFTER_HOURS + ' hours)', '#b91c1c')}
      ${rfqTable(needQuote, 'Contacted but no quote yet (over ' + QUOTE_AFTER_DAYS + ' days)', '#b45309')}
      ${outTable}
      <p style="color:#5A6A72;font-size:12px;margin-top:14px;">Update the Status (RFQs tab) or Stage (Outreach tab) as you go, and these drop off tomorrow's list. <a href="${SpreadsheetApp.getActiveSpreadsheet().getUrl()}" style="color:#1B4D3E;">Open the sheet</a>.</p>
    </div></div>`;
  const parts = [];
  if (needReply.length) parts.push(needReply.length + ' to reply');
  if (needQuote.length) parts.push(needQuote.length + ' to quote');
  if (due.length) parts.push(due.length + ' outreach');
  sendMail_({ to: NOTIFY_EMAIL, subject: `Today's follow-ups: ${parts.join(', ')}`, htmlBody: html, name: 'Bhumi Varahi Website' });
  return 'Digest sent: ' + parts.join(', ');
}

// --- Health check ---
function healthCheck() {
  const problems = [];
  const check = (label, url, test) => {
    try {
      const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
      const code = res.getResponseCode();
      if (code !== 200) problems.push(`${label} returned HTTP ${code}`);
      else if (test && !test(res.getContentText())) problems.push(`${label} loaded but its content looks wrong`);
    } catch (err) {
      problems.push(`${label} could not be reached (${String(err).slice(0, 120)})`);
    }
  };
  check('Website homepage', SITE_URL, t => t.indexOf('Bhumi Varahi') !== -1 && t.indexOf('id="rfq"') !== -1);
  const endpoint = ScriptApp.getService().getUrl();
  if (endpoint) check('RFQ form endpoint', endpoint, t => t.indexOf('"success":true') !== -1);

  const props = PropertiesService.getScriptProperties();
  const wasDown = props.getProperty('healthDown') === '1';
  if (problems.length && !wasDown) {
    props.setProperty('healthDown', '1');
    sendMail_({ to: NOTIFY_EMAIL, name: 'Bhumi Varahi Website',
      subject: 'ALERT: website or RFQ form is down',
      body: 'The automatic check found a problem:\n\n- ' + problems.join('\n- ') +
            '\n\nCheck GitHub Pages (github.com/sain936/bhumivarahiimpex-site/settings/pages), the domain DNS, and the Apps Script deployment.\nYou will get one more email when it is working again.' });
  } else if (!problems.length && wasDown) {
    props.deleteProperty('healthDown');
    sendMail_({ to: NOTIFY_EMAIL, name: 'Bhumi Varahi Website',
      subject: 'Resolved: website and RFQ form are working again',
      body: 'The website and the RFQ form endpoint are responding normally again.' });
  }
  return problems.length ? 'Problems: ' + problems.join('; ') : 'All good.';
}

// --- Monthly report ---
function sendMonthlyReport() {
  const now = new Date();
  const y = Number(Utilities.formatDate(now, 'Asia/Kolkata', 'yyyy'));
  const m = Number(Utilities.formatDate(now, 'Asia/Kolkata', 'M')); // this month, 1-12
  const prev = m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 };
  const key = d => Utilities.formatDate(d, 'Asia/Kolkata', 'yyyy-M');
  const target = prev.y + '-' + prev.m;
  const label = Utilities.formatDate(new Date(prev.y, prev.m - 1, 15), 'Asia/Kolkata', 'MMMM yyyy');

  const sheet = getSheet_();
  const data = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length).getValues() : [];
  const rows = data.filter(r => isDate_(r[0]) && (r[2] || r[3]) && key(r[0]) === target);
  const tally = idx => {
    const t = {};
    rows.forEach(r => { const k = String(r[idx] || '').trim() || 'Not given'; t[k] = (t[k] || 0) + 1; });
    return Object.keys(t).map(k => [k, t[k]]).sort((a, b) => b[1] - a[1]);
  };
  const status = s => rows.filter(r => String(r[9] || 'New') === s).length;
  const quotedOrLater = status('Quoted') + status('Won') + status('Lost');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const list = (title, pairs) => `<h3 style="color:#1B4D3E;font-size:15px;margin:18px 0 8px;">${title}</h3>
    ${pairs.length ? `<table style="border-collapse:collapse;font-size:13px;">${pairs.slice(0, 15).map(([k, n]) =>
      `<tr><td style="padding:4px 12px 4px 0;">${esc(k)}</td><td style="padding:4px 0;font-weight:bold;">${n}</td></tr>`).join('')}</table>` : '<p style="font-size:13px;color:#5A6A72;">None</p>'}`;
  const stat = (lbl, n, bg) => `<td style="padding:10px;text-align:center;background:${bg};border-radius:6px;"><div style="font-size:22px;font-weight:bold;color:#1B4D3E;">${n}</div><div style="font-size:11px;color:#5A6A72;text-transform:uppercase;letter-spacing:1px;">${lbl}</div></td>`;

  let spam = 0;
  const sp = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Spam');
  if (sp && sp.getLastRow() > 1) spam = sp.getRange(2, 1, sp.getLastRow() - 1, 1).getValues().filter(r => isDate_(r[0]) && key(r[0]) === target).length;

  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
    <div style="background:#1B4D3E;color:#E5C158;padding:14px 18px;font-weight:bold;letter-spacing:1px;">MONTHLY RFQ REPORT · ${label.toUpperCase()}</div>
    <div style="padding:16px 18px;">
      <table style="width:100%;border-collapse:separate;border-spacing:6px;"><tr>
        ${stat('RFQs', rows.length, '#F8F5EC')}${stat('Quoted', quotedOrLater, '#F1F5F9')}${stat('Won', status('Won'), '#DCFCE7')}${stat('Lost', status('Lost'), '#FEE2E2')}${stat('Still open', status('New') + status('Contacted') + status('Quoted'), '#FEF3C7')}
      </tr></table>
      <p style="font-size:13px;color:#334155;">Quote rate: <b>${rows.length ? Math.round(100 * quotedOrLater / rows.length) : 0}%</b> · Win rate on quotes: <b>${quotedOrLater ? Math.round(100 * status('Won') / quotedOrLater) : 0}%</b> · Spam blocked: <b>${spam}</b></p>
      ${list('By product', tally(6))}
      ${list('By country', tally(5))}
      <p style="color:#5A6A72;font-size:12px;margin-top:14px;"><a href="${SpreadsheetApp.getActiveSpreadsheet().getUrl()}" style="color:#1B4D3E;">Open the RFQ sheet</a></p>
    </div></div>`;
  sendMail_({ to: NOTIFY_EMAIL, subject: `Monthly RFQ report, ${label}: ${rows.length} RFQs, ${status('Won')} won`, htmlBody: html, name: 'Bhumi Varahi Website' });
  return 'Monthly report sent for ' + label;
}

function isDate_(v) { return Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime()); }

// ===== RESEND BUYER EMAIL =====
// Adds a "Bhumi Varahi" menu to the sheet. Click any cell in an RFQ row, then
// Bhumi Varahi -> Resend buyer email, to send the acknowledgement again
// (for example after the buyer says it went to spam, or after correcting their email address).
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Bhumi Varahi')
    .addItem('Resend buyer email (selected row)', 'resendAcknowledgement')
    .addItem('Prepare internal costing inputs (selected row)', 'prepareCostingInputs')
    .addItem('Create internal costing (selected row or IC tab)', 'createInternalCosting')
    .addItem('Draft logistics quote requests (selected row or IC tab)', 'draftQuoteRequests')
    .addItem('Set Gemini API key (for costing research)', 'setGeminiKey')
    .addItem('Create quotation PDF (selected row)', 'createQuotation')
    .addItem('Send today\'s follow-ups now', 'dailyDigest')
    .addToUi();
}

function resendAcknowledgement() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSheet();
  if (sheet.getName() !== SHEET_NAME) { ui.alert('Open the "' + SHEET_NAME + '" tab and click a cell in the RFQ row first.'); return; }
  const row = sheet.getActiveRange().getRow();
  if (row < 2) { ui.alert('Click a cell in an RFQ row (not the header) first.'); return; }
  const result = resendRow_(sheet, row, function (msg) { return ui.alert('Resend buyer email', msg, ui.ButtonSet.YES_NO) === ui.Button.YES; });
  ui.alert(result);
}

// Shared by the menu (and tests). confirm(msg) returns true to go ahead.
function resendRow_(sheet, row, confirm) {
  migrateRfqNo_(sheet);
  const r = sheet.getRange(row, 1, 1, HEADERS.length).getValues()[0];
  const p = { ref: String(r[1] || ''), name: r[2], email: String(r[3] || '').trim(), phone: r[4], country: r[5],
              commodity: r[6], quantity: r[7], notes: r[8] };
  EXTRA_FIELDS.forEach((k, i) => { p[k] = r[11 + i]; });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) return 'Row ' + row + ' has no valid buyer email. Fix the Email column and try again.';
  if (!p.ref) {
    p.ref = 'BV-' + Utilities.formatDate(isDate_(r[0]) ? r[0] : new Date(), 'Asia/Kolkata', 'yyMMdd-HHmmss');
    sheet.getRange(row, 2).setValue(p.ref);
  }
  if (confirm && !confirm('Send the acknowledgement for ' + p.ref + ' again to ' + p.email + '?')) return 'Cancelled. Nothing was sent.';
  acknowledge_(p);
  const note = sheet.getRange(row, 11);
  const stamp = 'Buyer email resent ' + Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd MMM HH:mm');
  note.setValue(note.getValue() ? note.getValue() + ' · ' + stamp : stamp);
  return 'Sent to ' + p.email + ' (' + p.ref + '). Ask the buyer to check spam and mark it "Not spam" if it lands there.';
}

// ===== QUOTATION PDF =====
// Click a cell in an RFQ row, then Bhumi Varahi -> Create quotation PDF.
// Enter the price in USD per MT. The script makes a quotation (Google Doc + PDF) in the
// Drive folder "Bhumi Varahi Quotations", can email the PDF to the buyer, and marks the row Quoted.
const QUOTE_FOLDER = 'Bhumi Varahi Quotations';
const QUOTE_VALID_DAYS = 7;

function createQuotation() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSheet();
  if (sheet.getName() !== SHEET_NAME) { ui.alert('Open the "' + SHEET_NAME + '" tab and click a cell in the RFQ row first.'); return; }
  const row = sheet.getActiveRange().getRow();
  if (row < 2) { ui.alert('Click a cell in an RFQ row (not the header) first.'); return; }
  const ref = String(sheet.getRange(row, 2).getValue() || '');
  const costed = ref && PropertiesService.getScriptProperties().getProperty('costFob_' + ref);
  const ans = ui.prompt('Create quotation', 'Price in USD per MT (for example 1150):' +
    (costed ? '\n\nYour internal costing for ' + ref + ' gave FOB USD ' + costed + ' per MT.' : ''), ui.ButtonSet.OK_CANCEL);
  if (ans.getSelectedButton() !== ui.Button.OK) return;
  const price = parseFloat(String(ans.getResponseText()).replace(/[^0-9.]/g, ''));
  if (!(price > 0)) { ui.alert('Please enter a price such as 1150.'); return; }
  const send = ui.alert('Create quotation', 'Email the PDF to the buyer now?\n\nYes: create and email it.\nNo: only create it in Drive, so you can check it first.', ui.ButtonSet.YES_NO) === ui.Button.YES;
  ui.alert(quoteRow_(sheet, row, price, send).message);
}

function nextQuoteNo_() {
  const props = PropertiesService.getScriptProperties();
  const year = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy');
  const n = Number(props.getProperty('quoteSeq_' + year) || 0) + 1;
  props.setProperty('quoteSeq_' + year, String(n));
  return 'BV-Q-' + year + '-' + ('00' + n).slice(-3);
}

// First number in "50 MT", "2 x 25 MT", "100 tons" etc. Returns null when it is not in MT/tons.
function quantityMt_(q) {
  q = String(q || '').replace(/,/g, '');
  const m = q.match(/(\d+(?:\.\d+)?)\s*(mt|metric|ton|tonne|t\b)?/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (/fcl|container|kg\b/i.test(q) && !m[2]) return null;
  return n > 0 ? n : null;
}

function quoteFolder_() {
  const it = DriveApp.getFoldersByName(QUOTE_FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(QUOTE_FOLDER);
}

// Shared by the menu (and tests). Returns { message, quoteNo, pdfUrl }.
function quoteRow_(sheet, row, price, send) {
  migrateRfqNo_(sheet);
  const r = sheet.getRange(row, 1, 1, HEADERS.length).getValues()[0];
  const p = { ref: String(r[1] || ''), name: String(r[2] || ''), email: String(r[3] || '').trim(), phone: String(r[4] || ''),
              country: String(r[5] || ''), commodity: String(r[6] || ''), quantity: String(r[7] || ''), notes: String(r[8] || '') };
  EXTRA_FIELDS.forEach((k, i) => { p[k] = String(r[11 + i] || ''); });
  if (!p.ref) {
    p.ref = 'BV-' + Utilities.formatDate(isDate_(r[0]) ? r[0] : new Date(), 'Asia/Kolkata', 'yyMMdd-HHmmss');
    sheet.getRange(row, 2).setValue(p.ref);
  }
  const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email);
  if (send && !okEmail) return { message: 'Row ' + row + ' has no valid buyer email. Fix the Email column, or choose No to only create the PDF.' };

  const quoteNo = nextQuoteNo_();
  const today = new Date();
  const fmt = d => Utilities.formatDate(d, 'Asia/Kolkata', 'dd MMM yyyy');
  const valid = new Date(today.getTime() + QUOTE_VALID_DAYS * 864e5);
  const mt = quantityMt_(p.quantity);
  const money = n => 'USD ' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const dest = destText_(p);
  const term = (String(p.incoterm).match(/^(FOB|CFR|CIF|FCA|EXW|CPT|CIP|DAP|DDP)\b/i) || [])[1];
  const basis = term ? term.toUpperCase() + ' ' + (/^(FOB|FCA|EXW)$/i.test(term) ? 'Indian port' : (portName_(p) || p.country)) : '';

  const doc = DocumentApp.create(quoteNo + ' ' + (p.name || 'Buyer'));
  const body = doc.getBody();
  body.setMarginTop(36).setMarginBottom(36).setMarginLeft(48).setMarginRight(48);
  const GREEN = '#1B4D3E', GOLD = '#8A6508', GREY = '#5A6A72';
  try {
    const logo = UrlFetchApp.fetch('https://www.bhumivarahiimpex.com/brand/email-logo.png').getBlob();
    const img = body.getParagraphs()[0].appendInlineImage(logo);
    const h = 44; img.setWidth(Math.round(img.getWidth() * h / img.getHeight())).setHeight(h);
  } catch (e) { body.getParagraphs()[0].appendText('BHUMI VARAHI IMPEX PVT LTD').setBold(true).setForegroundColor(GREEN).setFontSize(16); }
  body.appendParagraph('Bhumi Varahi Impex Pvt Ltd  |  ' + NOTIFY_EMAIL + '  |  WhatsApp +91 94929 92666  |  www.bhumivarahiimpex.com')
    .setFontSize(8).setForegroundColor(GREY);
  body.appendHorizontalRule();
  body.appendParagraph('QUOTATION').setHeading(DocumentApp.ParagraphHeading.HEADING1)
    .editAsText().setForegroundColor(GREEN).setBold(true).setFontSize(20);

  const style = (t, widths) => {
    t.setBorderColor('#D6DDE0');
    for (let i = 0; i < t.getNumRows(); i++) for (let j = 0; j < t.getRow(i).getNumCells(); j++) {
      const c = t.getCell(i, j); c.setPaddingTop(4).setPaddingBottom(4).setPaddingLeft(6).setPaddingRight(6);
      c.editAsText().setFontSize(9.5);
      if (widths && widths[j]) c.setWidth(widths[j]);
    }
    return t;
  };
  const info = style(body.appendTable([
    ['Quotation No.', quoteNo, 'Date', fmt(today)],
    ['Your RFQ No.', p.ref, 'Valid until', fmt(valid)],
  ]), [90, 150, 70, 150]);
  [0, 2].forEach(j => { for (let i = 0; i < 2; i++) info.getCell(i, j).editAsText().setForegroundColor(GREY); });
  [1, 3].forEach(j => { for (let i = 0; i < 2; i++) info.getCell(i, j).editAsText().setBold(true); });

  body.appendParagraph('TO').editAsText().setFontSize(9).setBold(true).setForegroundColor(GOLD);
  body.appendParagraph([p.name, p.contact ? 'Attn: ' + p.contact : '', [p.email, p.phone].filter(Boolean).join('  |  '), p.country]
    .filter(Boolean).join('\n')).editAsText().setFontSize(10).setBold(false).setForegroundColor('#1e293b');

  body.appendParagraph('PRODUCT AND PRICE').editAsText().setFontSize(9).setBold(true).setForegroundColor(GOLD);
  const prod = [p.commodity, p.grade].filter(Boolean).join(', ') + (p.notes && p.notes !== 'None' ? '\nSpecifications: ' + p.notes.replace(/^\[(AR|FR)\]\s*/, '') : '');
  const amount = mt ? money(mt * price) : 'On confirmed quantity';
  const pt = style(body.appendTable([
    ['Product', 'Quantity', 'Price (USD/MT, ' + (basis || 'basis on request') + ')', 'Amount'],
    [prod || '-', p.quantity || '-', money(price), amount],
  ]), [210, 80, 110, 80]);
  for (let j = 0; j < 4; j++) { const c = pt.getCell(0, j); c.setBackgroundColor(GREEN); c.editAsText().setBold(true).setForegroundColor('#FFFFFF'); }
  pt.getCell(1, 3).editAsText().setBold(true);

  body.appendParagraph('TERMS').editAsText().setFontSize(9).setBold(true).setForegroundColor(GOLD);
  const terms = [
    ['Delivery terms', [p.incoterm, dest].filter(Boolean).join(', ') || 'To be agreed'],
    ['Payment', p.payment || 'To be agreed'],
    ['Shipment', p.shipment || 'To be agreed'],
    ['Packing', p.packing || 'To be agreed'],
    ['Bag branding', p.label || 'To be agreed'],
    ['Validity', 'This quotation is valid until ' + fmt(valid) + '. Prices may change after that date with market and freight rates.'],
    ['Bank details', 'Bank details will be shared on the proforma invoice.'],
  ];
  if (p.sample && !/^no/i.test(p.sample)) terms.splice(5, 0, ['Sample', p.sample]);
  const tt = style(body.appendTable(terms), [110, 370]);
  for (let i = 0; i < terms.length; i++) tt.getCell(i, 0).editAsText().setForegroundColor(GREY);

  body.appendParagraph('Please quote ' + quoteNo + ' and your RFQ No. ' + p.ref + ' when you confirm the order.')
    .editAsText().setFontSize(9.5).setForegroundColor(GREY).setBold(false);
  body.appendParagraph('For Bhumi Varahi Impex Pvt Ltd\n\n\nAuthorised Signatory\nExport Desk')
    .editAsText().setFontSize(10).setForegroundColor('#1e293b').setBold(false);
  doc.saveAndClose();

  const folder = quoteFolder_();
  const docFile = DriveApp.getFileById(doc.getId());
  docFile.moveTo(folder);
  const pdf = folder.createFile(docFile.getAs(MimeType.PDF).setName(quoteNo + '.pdf'));

  let sent = false;
  if (send) {
    const esc = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const who = esc(p.contact || p.name || 'Sir / Madam');
    sendMail_({
      to: p.email, replyTo: NOTIFY_EMAIL, name: 'Bhumi Varahi Impex',
      subject: 'Quotation ' + quoteNo + ' for your RFQ ' + p.ref + ': ' + (p.commodity || 'your request') + ' | Bhumi Varahi Impex',
      htmlBody: '<div style="font-family:Arial,sans-serif;max-width:600px;color:#334155;font-size:15px;line-height:1.6;">' +
        '<p>Dear ' + who + ',</p><p>Thank you for your request. Please find attached our quotation <strong>' + esc(quoteNo) +
        '</strong> for your RFQ <strong>' + esc(p.ref) + '</strong> (' + esc(p.commodity) + ', ' + esc(p.quantity) + ').</p>' +
        '<p>Price: <strong>' + esc(money(price)) + ' per MT</strong>' + (basis ? ', ' + esc(basis) : '') + '. Valid until ' + esc(fmt(valid)) + '.</p>' +
        '<p>To confirm, or if you would like any changes, simply reply to this email or message us on WhatsApp at +91 94929 92666.</p>' +
        '<p>Warm regards,<br><strong style="color:#1B4D3E;">Export Desk</strong><br>Bhumi Varahi Impex Pvt Ltd<br>' + NOTIFY_EMAIL + ' | www.bhumivarahiimpex.com</p></div>',
      attachments: [pdf.getBlob()]
    });
    sent = true;
  }

  if (sent) sheet.getRange(row, 10).setValue('Quoted');
  const note = sheet.getRange(row, 11);
  const stamp = quoteNo + ' at ' + money(price) + '/MT ' + (sent ? 'emailed ' : 'created ') + Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd MMM HH:mm');
  note.setValue(note.getValue() ? note.getValue() + ' · ' + stamp : stamp);
  return {
    quoteNo: quoteNo, pdfUrl: pdf.getUrl(),
    message: quoteNo + (sent ? ' was emailed to ' + p.email + '.' : ' was created. It was not emailed.') +
      '\n\nPDF: ' + pdf.getUrl() + '\nEditable copy: ' + docFile.getUrl() + '\n\nBoth are in the Drive folder "' + QUOTE_FOLDER + '".'
  };
}

// ===== INTERNAL COSTING DOSSIER =====
// Step 1: click an RFQ row, Bhumi Varahi -> Prepare internal costing inputs. A tab "IC <RFQ No.>"
//         opens with every input the costing needs, pre-filled from the RFQ and your defaults.
//         Yellow cells are required. Cost lines at the bottom can be changed for this deal only.
// Step 2: Bhumi Varahi -> Create internal costing (from that tab or the RFQ row). It checks the
//         required cells, then builds the confidential dossier (Doc + PDF in Drive). Never emailed.
// Company-wide defaults live in "Cost Settings" (rates, bank, licence status) and "Cost Rates".
const COST_SETTINGS_TAB = 'Cost Settings';
const COST_RATES_TAB = 'Cost Rates';
const COSTING_FOLDER = 'Bhumi Varahi Internal Costing';
const IC_PREFIX = 'IC ';
const QUOTE_LOG_TAB = 'Logistics Quote Log';
// Destination-side inputs that take logistics quotes (USD per 20 ft container), with their Gemini keys.
const QUOTE_FIELDS = { b_freight: 'ocean_freight_usd_per_20ft', b_local: 'carrier_local_usd_per_20ft', b_port: 'dest_port_usd_per_20ft',
  b_lolo: 'dest_lolo_usd_per_20ft', b_inland: 'inland_trucking_usd_per_20ft', b_bond: 'transit_bond_usd_per_20ft', b_clear: 'import_clearing_usd_per_20ft' };
const VENDOR_TAB = 'Logistics Vendors';
const QUOTE_HEAD = ['Quote A (vendor: amount)', 'Quote B (vendor: amount)', 'Web estimate (Gemini, filled on each run)'];
const COST_SETTINGS_DEFAULT = [
  ['USD rate (INR per 1 USD)', 94.85],
  ['MT per 20 ft container', 25],
  ['Margin (% of cargo cost)', 10],
  ['GST on logistics services (%)', 18],
  ['Default mill price (INR per 100 kg)', 3750],
  ['Mill name', ''],
  ['Mill / origin', 'Jaggampeta, East Godavari, A.P.'],
  ['Inland distance (km)', 170],
  ['Port of loading', 'Visakhapatnam Port (VCTPL)'],
  ['CHA / CFS partner', 'Sree Shipping & Logistics'],
  ['Quotation validity (days)', 7],
  ['Minimum margin for GO (%)', 8],
  ['Minimum buyer return for GO (%)', 8],
  ['Logistics quotes valid for (days)', 30],
  ['Gemini research (Y/N)', 'Y'],
  ['Gemini model', 'gemini-3.8-flash'],
  // Bank details: printed on the internal costing only when filled in.
  ['Bank: account name', 'Bhumi Varahi Impex Private Limited'],
  ['Bank: bank name', ''],
  ['Bank: branch', ''],
  ['Bank: account number', ''],
  ['Bank: AD code', ''],
  ['Bank: IFSC', ''],
  ['Bank: SWIFT / BIC', ''],
  ['Bank: remittance purpose code', 'P0102 (export of food commodities)'],
  // Registration status: type Active, Pending, Applied or Not needed, plus the number once you have it.
  ['Licence: PAN (company)', 'In progress'],
  ['Licence: Directors KYC (Aadhaar / DIN)', 'In progress'],
  ['Licence: IEC (DGFT)', 'In progress'],
  ['Licence: GST registration + LUT', 'In progress'],
  ['Licence: Bank AD code letter', 'In progress'],
  ['Licence: AD code registered at port', 'In progress'],
  ['Licence: ICEGATE registration', 'In progress'],
  ['Licence: APEDA RCMC', 'In progress'],
  ['Licence: APEDA RCAC (rice export contract registration)', 'In progress'],
  ['Licence: FSSAI', 'In progress'],
  ['Licence: Plant quarantine (PQIS) login', 'In progress'],
];
// Item | Basis shown on the sheet | Rate (INR) | Per (MT / bag / container / shipment) | GST (Y/N) | Include (Y/N)
const COST_RATES_DEFAULT = [
  ['New export jute bags', 'Export-grade virgin jute bag', 65, 'bag', 'N', 'Y'],
  ['CFS rebagging & stitching', 'Per bag at CFS', 18, 'bag', 'N', 'Y'],
  ['Inland road haulage (mill to CFS)', 'Open lorry per container load', 18000, 'container', 'N', 'Y'],
  ['Pre-FOB inland transit insurance', 'ITC-A all-risk, mill gate to CFS', 2000, 'container', 'N', 'Y'],
  ['CHA professional services', 'ICEGATE EDI filing, customs clearance, LEO', 3500, 'shipment', 'Y', 'Y'],
  ['CFS direct container stuffing & drayage', 'Receiving, stuffing, kraft paper, tarpaulin, port movement', 12000, 'container', 'Y', 'Y'],
  ['Supplemental desiccant (absorb gel)', '2 kg extra @ INR 450/kg (1 kg included)', 900, 'container', 'Y', 'Y'],
  ['Fumigation upgrade (MBR 48 g)', 'Methyl bromide 48 g/m3', 2600, 'container', 'N', 'Y'],
  ['Container weighment (VGM)', 'Certified tare / gross weight', 450, 'container', 'Y', 'Y'],
  ['Terminal handling charges (origin THC)', 'Per 20 ft box', 8500, 'container', 'N', 'Y'],
  ['Lo-Lo charges (lift on / lift off, origin)', 'Container lift on / lift off at CFS, ICD or yard. Enter the CHA / CFS rate.', '', 'container', 'Y', 'Y'],
  ['Certificate of Origin (COO)', 'Non-preferential COO, chamber seal', 1500, 'shipment', 'N', 'Y'],
  ['Destination pre-shipment inspection (PVoC / CoC)', 'Only for countries that require it (e.g. Rwanda, Kenya)', 38000, 'shipment', 'N', 'N'],
  ['Banking, courier & e-BRC / EDPMS', 'Bank document handling, courier, RBI closure', 4500, 'shipment', 'N', 'Y'],
  ['Warehouse storage handling', 'Only if cargo is staged in the CFS warehouse', 125, 'MT', 'N', 'N'],
  ['Empty container off-dock pickup', 'Only if the carrier names an outside yard', 2500, 'container', 'N', 'N'],
  ['CTO & SRF charges (carrier, at actuals)', 'Terminal operator tolls and shipping request fee', 2500, 'container', 'N', 'N'],
  ['Demurrage beyond free time', 'INR 2,000 per week per box beyond 14 free days', 2000, 'container', 'N', 'N'],
];

// Every manual input of the internal costing: [key, label, required, help]. '#' rows are section headings.
// Defaults and RFQ pre-fill come from icDefaults_().
const IC_FIELDS = [
  ['#', '1. Deal and buyer'],
  ['buyer', 'Buyer company', true, 'From the RFQ'],
  ['contact', 'Contact person', false, ''],
  ['buyer_country', 'Buyer country', true, ''],
  ['buyer_address', 'Buyer registered address', false, 'Needed for the proforma and B/L'],
  ['buyer_tin', 'Buyer tax ID (TIN / VAT no.)', false, 'Ask the buyer'],
  ['commodity', 'Commodity', true, ''],
  ['variety', 'Variety / grade', false, 'e.g. 1010, IR 64, 1121 Steam'],
  ['crop_year', 'Crop year', false, ''],
  ['hs_code', 'HS code', false, 'e.g. 1006.30 milled rice, 0910.30 turmeric'],
  ['qty_mt', 'Quantity (MT)', true, 'Number only'],
  ['bag_kg', 'Bag size (kg)', true, 'Number only'],
  ['bag_type', 'Bag type', false, 'Jute / PP / BOPP / non-woven'],
  ['branding', 'Bag branding', false, ''],
  ['incoterm', 'Incoterm asked by buyer', false, 'Costing is always FOB; CFR/CIF need freight added'],
  ['payment_option', 'Payment structure', true, 'A: 30% advance + 70% against BL copy, or B: 100% confirmed sight L/C'],
  ['shipment_window', 'Shipment window', false, ''],
  ['validity_days', 'Quote validity (days)', true, ''],
  ['#', '2. Quality specification'],
  ['q_moisture', 'Moisture (max)', false, ''],
  ['q_broken', 'Broken grains (max)', false, ''],
  ['q_fm_inorg', 'Foreign matter, inorganic (max)', false, ''],
  ['q_fm_org', 'Foreign matter, organic (max)', false, ''],
  ['q_damaged', 'Damaged / discoloured / chalky (max)', false, ''],
  ['q_milling', 'Milling degree & polish', false, ''],
  ['q_aflatoxin', 'Aflatoxin', false, ''],
  ['q_heavy', 'Heavy metals (Pb / Cd)', false, ''],
  ['q_other', 'Other quality terms', false, 'Grain length, purity, colour, crop, etc.'],
  ['q_dest_std', 'Destination standard', false, 'e.g. EAS 128:2017 (Rwanda), GSO (Gulf)'],
  ['dq_moisture', 'Destination limit: moisture', false, 'From the destination standard'],
  ['dq_broken', 'Destination limit: broken grains', false, ''],
  ['dq_fm_inorg', 'Destination limit: foreign matter, inorganic', false, ''],
  ['dq_fm_org', 'Destination limit: foreign matter, organic', false, ''],
  ['dq_damaged', 'Destination limit: damaged / discoloured', false, ''],
  ['dq_aflatoxin', 'Destination limit: aflatoxin', false, ''],
  ['dq_heavy', 'Destination limit: heavy metals', false, ''],
  ['#', '3. Procurement (origin)'],
  ['mill_name', 'Mill / supplier name', false, ''],
  ['mill_location', 'Mill location', true, ''],
  ['mill_price', 'Mill price (INR per 100 kg)', true, 'Number only'],
  ['inland_km', 'Mill to CFS distance (km)', false, ''],
  ['lorry', 'Inland transport', false, ''],
  ['#', '4. Origin shipping'],
  ['cha', 'CHA / CFS partner', true, ''],
  ['cfs_facility', 'CFS facility', false, 'e.g. Sree Shipping CFS, Visakhapatnam'],
  ['pol', 'Port of loading', true, 'e.g. Visakhapatnam (VCTPL), Gangavaram, Kakinada'],
  ['container_type', 'Container type', false, ''],
  ['mt_per_ctr', 'MT per container', true, 'Number only; containers are worked out from this'],
  ['shipping_line', 'Shipping line / booking', false, 'Buyer-nominated or ours'],
  ['stuffing', 'Stuffing method', false, ''],
  ['#', '5. Destination and route'],
  ['pod', 'Port of discharge', true, ''],
  ['final_dest', 'Final inland destination', false, 'Only for landlocked buyers, e.g. Kigali (Masaka ICD)'],
  ['corridor', 'Overland corridor', false, 'e.g. Central Corridor (Dar es Salaam - Kigali)'],
  ['transit_regime', 'Transit regime', false, 'e.g. EAC bonded transit (T1) with ECTS seals'],
  ['dest_inspection', 'Destination inspection / certificate', false, 'e.g. PVoC CoC by SGS / Cotecna'],
  ['consignee', 'Consignee (exact B/L wording)', false, ''],
  ['notify_party', 'Notify party', false, ''],
  ['clearing_agent', 'Buyer clearing agent', false, ''],
  ['import_permit', 'Import declaration / permit no.', false, 'e.g. Rwanda IDF on ReSW'],
  ['#', '6. Money and margin'],
  ['fx', 'USD rate (INR per USD)', true, 'Number only'],
  ['margin_pct', 'Margin (% of cargo cost)', true, 'Number only'],
  ['fob_benchmark', 'Typical India FOB price for this product (USD per MT)', false, 'Market check for our price; Gemini fills it if empty'],
  ['gst_pct', 'GST on logistics services (%)', true, 'Number only'],
  ['#', '7. Buyer landed cost (USD). Empty cells are filled from Gemini research when available, and marked as AI estimates'],
  ['b_freight', 'Ocean freight per container (USD)', false, 'Shipping line quote'],
  ['b_local', 'Carrier local charges per container (USD)', false, 'B/L, seal, ISPS'],
  ['b_ins_pct', 'Marine insurance (% of CFR value)', false, 'Leave empty if not counted'],
  ['b_port', 'Destination port / transit clearance per container (USD)', false, 'Wharfage, handling'],
  ['b_lolo', 'Destination Lo-Lo (lift on / lift off) per container (USD)', false, 'At port, ICD or dry port; enter 0 if included above'],
  ['b_inland', 'Overland trucking per container (USD)', false, 'Port to final destination'],
  ['b_bond', 'Transit bond / cargo tracking per container (USD)', false, ''],
  ['b_duty_pct', 'Import duty (% of CIF)', false, ''],
  ['b_duty_min', 'Minimum duty (USD per MT)', false, 'If the tariff says "or USD x/MT, whichever is higher"'],
  ['b_clear', 'Import clearing & dry port handling per container (USD)', false, ''],
  ['b_levy_pct', 'Other import levies (% of CIF)', false, 'Non-recoverable only, e.g. AU levy 0.2% + IDL 1.5%. Not VAT or withholding tax'],
  ['b_vat_pct', 'Import VAT (% of CIF + duty + levies)', false, 'Leave empty if exempt'],
  ['b_vat_recoverable', 'Is import VAT recoverable by the buyer? (Y/N)', false, 'Y for VAT-registered importers: shown as cash outlay, not a cost'],
  ['b_sell', 'Buyer selling price (USD per MT)', false, 'Leave empty to use the middle of the wholesale range'],
  ['local_ccy', 'Local currency code', false, 'e.g. RWF, AED, KES'],
  ['local_fx', 'Local currency per 1 USD', false, ''],
  ['#', '7b. Destination market prices (local currency per kg)'],
  ['m_whole_low', 'Wholesale / distributor: low', false, ''],
  ['m_whole_high', 'Wholesale / distributor: high', false, ''],
  ['m_semi_low', 'Semi-wholesale / regional: low', false, ''],
  ['m_semi_high', 'Semi-wholesale / regional: high', false, ''],
  ['m_retail_low', 'Retail / supermarkets: low', false, ''],
  ['m_retail_high', 'Retail / supermarkets: high', false, ''],
  ['m_notes', 'Market notes', false, 'Demand, import share, preferred packing'],
  ['#', '8. Contract clauses'],
  ['balance_days', 'Balance payment due (business days after BL scan)', false, ''],
  ['moisture_tol', 'Transit moisture tolerance', false, ''],
  ['payload', 'Container payload rating', false, ''],
  ['forex_recal', 'Re-price if INR strengthens by more than (%)', false, ''],
  ['free_days', 'CFS free time (days)', false, ''],
  ['demurrage', 'Demurrage after free time', false, ''],
  ['#', '9. Timeline'],
  ['t_procure', 'Procurement & haulage (days)', false, ''],
  ['t_cfs', 'CFS rebagging & stuffing (days)', false, ''],
  ['t_cha', 'CHA clearance & gate-in (days)', false, ''],
  ['t_ready', 'Total cargo readiness (days)', false, ''],
  ['t_sea', 'Sea transit to port of discharge (days)', false, ''],
  ['t_inland', 'Overland transit to final destination (days)', false, ''],
  ['#', '10. Approvals'],
  ['appr_costing', 'Costing & pricing verified by', false, 'Name'],
  ['appr_logistics', 'Logistics & CHA cleared by', false, 'Name'],
  ['appr_director', 'Final commercial sign-off by', false, 'Name'],
];

function setupCosting_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let st = ss.getSheetByName(COST_SETTINGS_TAB);
  if (!st) {
    st = ss.insertSheet(COST_SETTINGS_TAB);
    st.getRange(1, 1, 1, 2).setValues([['Setting', 'Value']]).setFontWeight('bold').setBackground('#1B4D3E').setFontColor('#FFFFFF');
    st.getRange(2, 1, COST_SETTINGS_DEFAULT.length, 2).setValues(COST_SETTINGS_DEFAULT);
    st.setColumnWidth(1, 300); st.setColumnWidth(2, 300); st.setFrozenRows(1);
  }
  let rt = ss.getSheetByName(COST_RATES_TAB);
  if (!rt) {
    rt = ss.insertSheet(COST_RATES_TAB);
    rt.getRange(1, 1, 1, 6).setValues([['Cost item', 'Basis / what it covers', 'Rate (INR)', 'Per (MT / bag / container / shipment)', 'GST (Y/N)', 'Include (Y/N)']])
      .setFontWeight('bold').setBackground('#1B4D3E').setFontColor('#FFFFFF');
    rt.getRange(2, 1, COST_RATES_DEFAULT.length, 6).setValues(COST_RATES_DEFAULT);
    rt.setColumnWidths(1, 6, 190); rt.setColumnWidth(2, 320); rt.setFrozenRows(1);
  }
  const settings = {};
  st.getRange(2, 1, Math.max(1, st.getLastRow() - 1), 2).getValues().forEach(r => { if (r[0]) settings[String(r[0]).trim()] = r[1]; });
  // Settings added in later versions are appended to older sheets.
  const missing = COST_SETTINGS_DEFAULT.filter(d => !(d[0] in settings));
  if (missing.length) {
    st.getRange(st.getLastRow() + 1, 1, missing.length, 2).setValues(missing);
    missing.forEach(d => { settings[d[0]] = d[1]; });
  }
  let rateRows = rt.getRange(2, 1, Math.max(1, rt.getLastRow() - 1), 6).getValues();
  const have = rateRows.map(r => String(r[0]).trim());
  const newItems = COST_RATES_DEFAULT.filter(d => have.indexOf(d[0]) < 0 && /^(Lo-Lo|CTO|Demurrage)/.test(d[0]));
  if (newItems.length) { rt.getRange(rt.getLastRow() + 1, 1, newItems.length, 6).setValues(newItems); rateRows = rateRows.concat(newItems); }
  const rates = rateRows
    .filter(r => r[0] && (r[2] === '' || r[2] == null || Number(r[2]) >= 0))
    .map(r => ({ item: String(r[0]), basis: String(r[1] || ''), rate: r[2] === '' || r[2] == null ? null : Number(r[2]), per: String(r[3] || 'shipment').toLowerCase().trim(),
                 gst: /^y/i.test(String(r[4])), include: !/^n/i.test(String(r[5])) }));
  return { settings, rates };
}

function setting_(s, name, dflt) {
  const v = s[name];
  return v === undefined || v === '' ? dflt : v;
}

function num_(v) {
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v || '').replace(/,/g, '').replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? null : n;
}

// Pure calculation (no Google services), so it can be checked against the sample dossier.
function computeCosting_(o) {
  const fx = Number(o.fx), mt = Number(o.mt), bagKg = Number(o.bagKg) || 50;
  const gstPct = o.gstPct == null ? 18 : Number(o.gstPct);
  const containers = Math.max(1, Math.ceil(mt / (Number(o.containerMt) || 25) - 1e-9));
  const bags = Math.ceil(mt * 1000 / bagKg);
  const qty = { mt: mt, bag: bags, container: containers, shipment: 1 };
  const r2 = n => Math.round(n * 100) / 100;
  const lines = [{ item: 'Base cargo: ' + o.commodity, basis: o.mill + ': ' + mt + ' MT @ INR ' + o.millPer100kg + ' / 100 kg',
                   inr: r2(mt * 10 * o.millPer100kg) }];
  let gstBase = 0;
  o.rates.filter(x => x.include && x.rate != null).forEach(x => {
    const per = x.per.indexOf('bag') === 0 ? 'bag' : x.per.indexOf('cont') === 0 ? 'container' : (x.per === 'mt' || x.per.indexOf('ton') === 0) ? 'mt' : 'shipment';
    const n = qty[per];
    const inr = r2(n * x.rate);
    lines.push({ item: x.item, basis: x.basis + (per === 'shipment' ? '' : ' (' + n + ' ' + (per === 'mt' ? 'MT' : per + (n === 1 ? '' : 's')) + ' @ INR ' + x.rate + ')'), inr: inr });
    if (x.gst) gstBase += inr;
  });
  if (gstBase > 0 && gstPct > 0) lines.push({ item: 'GST on logistics services (' + gstPct + '%)', basis: gstPct + '% on CFS / CHA taxable services (INR ' + gstBase.toFixed(2) + '), claimable as export input credit', inr: Math.round(gstBase * gstPct / 100) });
  lines.forEach(l => { l.usd = r2(l.inr / fx); });
  const cost = r2(lines.reduce((a, l) => a + l.inr, 0));
  const margin = r2(lines[0].inr * Number(o.marginPct) / 100);
  const fob = r2(cost + margin);
  return { lines, containers, bags, cost, costUsd: r2(cost / fx), margin, marginUsd: r2(margin / fx), fob, fobUsd: r2(fob / fx),
           fobPerMt: r2(fob / mt), fobUsdPerMt: r2(fob / fx / mt), marginPerMt: r2(margin / mt), gstBase };
}

// Buyer's landed cost and profit, from our FOB value (USD) and the buyer-side inputs. Pure.
// Returns null when no freight is entered.
function computeBuyer_(fobUsd, mt, containers, b) {
  const v = k => num_(b[k]) || 0;
  if (!num_(b.b_freight)) return null;
  const r2 = n => Math.round(n * 100) / 100;
  const freight = v('b_freight') * containers, local = v('b_local') * containers;
  const insurance = v('b_ins_pct') ? r2((fobUsd + freight) * v('b_ins_pct') / 100) : 0;
  const cif = fobUsd + freight + local + insurance;
  const port = v('b_port') * containers, lolo = v('b_lolo') * containers, inland = v('b_inland') * containers, bond = v('b_bond') * containers;
  const preCustoms = cif + port + lolo + inland + bond;
  const duty = r2(Math.max(cif * v('b_duty_pct') / 100, v('b_duty_min') * mt));
  const levy = v('b_levy_pct') ? r2(cif * v('b_levy_pct') / 100) : 0;
  const clear = v('b_clear') * containers;
  const vatAll = v('b_vat_pct') ? r2((cif + duty + levy) * v('b_vat_pct') / 100) : 0;
  const vatRecoverable = !/^n/i.test(String(b.b_vat_recoverable || 'Y'));
  const vat = vatRecoverable ? 0 : vatAll;
  const landed = preCustoms + duty + levy + clear + vat;
  const sell = v('b_sell') * mt;
  const rows = [
    ['FOB purchase price (our invoice)', fobUsd],
    ['Ocean freight', freight],
    ['Carrier local charges (B/L, seal, ISPS)', local],
  ].concat(insurance ? [['Marine insurance (' + v('b_ins_pct') + '%)', insurance]] : [])
   .concat([['CIF value at port of discharge', cif, 'sub']])
   .concat(port ? [['Port / transit clearance and handling', port]] : [])
   .concat(lolo ? [['Lo-Lo (lift on / lift off) at destination', lolo]] : [])
   .concat(inland ? [['Overland trucking', inland]] : [])
   .concat(bond ? [['Transit bond and cargo tracking', bond]] : [])
   .concat([['Landed cost before customs', preCustoms, 'sub']])
   .concat(duty ? [['Import duty (' + v('b_duty_pct') + '% of CIF' + (v('b_duty_min') ? ' or USD ' + v('b_duty_min') + '/MT, whichever is higher' : '') + ')', duty]] : [])
   .concat(levy ? [['Other import levies (' + v('b_levy_pct') + '% of CIF)', levy]] : [])
   .concat(clear ? [['Import clearing and dry port handling', clear]] : [])
   .concat(vat ? [['Import VAT (' + v('b_vat_pct') + '%, not recoverable)', vat]] : [])
   .concat([['Duty-paid landed cost', landed, 'total']])
   .concat(vatAll && vatRecoverable ? [['Import VAT ' + v('b_vat_pct') + '% paid at clearance (recoverable, so not counted as cost)', vatAll, 'info']] : []);
  const out = { rows: rows.map(r => ({ label: r[0], total: r2(r[1]), perMt: r2(r[1] / mt), kind: r[2] || '' })),
                vatOutlay: vatRecoverable ? vatAll : 0, cif: r2(cif), cifPerMt: r2(cif / mt), duty: duty, landed: r2(landed), landedPerMt: r2(landed / mt) };
  if (sell) {
    out.sell = r2(sell); out.sellPerMt = r2(v('b_sell'));
    out.profit = r2(sell - landed); out.profitPerMt = r2((sell - landed) / mt); out.roi = r2((sell - landed) / landed * 100);
  }
  return out;
}

// What-if table and price limits. Pure: ccIn is the computeCosting_ input, V the buyer-side inputs.
// Returns { rows: [{name, fobPerMt, heldMarginPct, buyerLandedPerMt, buyerRoi}], breakEven, minFob, buyerMax }.
function sensitivity_(ccIn, V, minMargin, minBuyer) {
  const r2 = n => Math.round(n * 100) / 100;
  const base = computeCosting_(ccIn);
  const mt = Number(ccIn.mt), cargo = base.lines[0].inr;
  const run = (name, cc, b) => {
    const c = computeCosting_(Object.assign({}, ccIn, cc || {}));
    const mS = Number((cc && cc.mt) || mt);
    const B = computeBuyer_(c.fobUsd, mS, c.containers, Object.assign({}, V, b || {}));
    const held = base.fobUsdPerMt * mS * Number((cc && cc.fx) || ccIn.fx) - c.cost;
    return { name: name, fobPerMt: c.fobUsdPerMt, heldMarginPct: r2(held / c.lines[0].inr * 100),
             buyerLandedPerMt: B ? B.landedPerMt : null, buyerRoi: B && B.sell ? B.roi : null };
  };
  const fx = Number(ccIn.fx), mill = Number(ccIn.millPer100kg), fr = num_(V.b_freight);
  const scale = k => (ccIn.rates || []).map(x => Object.assign({}, x, { rate: x.rate == null ? null : x.rate * k }));
  const rows = [run('Base case (this costing)'),
    run('Mill price +10%', { millPer100kg: mill * 1.1 }), run('Mill price -10%', { millPer100kg: mill * 0.9 }),
    run('Rupee 2% stronger (INR ' + r2(fx * 0.98) + ' / USD)', { fx: fx * 0.98 }), run('Rupee 2% weaker (INR ' + r2(fx * 1.02) + ' / USD)', { fx: fx * 1.02 }),
    run('Origin logistics +10%', { rates: scale(1.1) })]
    .concat(fr ? [run('Ocean freight +20%', null, { b_freight: fr * 1.2 }), run('Ocean freight -20%', null, { b_freight: fr * 0.8 })] : []);
  const full = base.containers * (Number(ccIn.containerMt) || 25);
  if (mt < full * 0.9) rows.push(run('Full container load (' + full + ' MT)', { mt: full }));
  const breakEven = r2(base.cost / fx / mt);
  const minFob = r2((base.cost + cargo * (Number(minMargin) || 0) / 100) / fx / mt);
  let buyerMax = null;
  const roiAt = f => { const B = computeBuyer_(f * mt, mt, base.containers, V); return B && B.sell ? B.roi : null; };
  if (roiAt(base.fobUsdPerMt) != null) {
    let lo = 0, hi = Math.max(base.fobUsdPerMt * 5, 1);
    if (roiAt(lo) >= minBuyer) {
      for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (roiAt(m) >= minBuyer) lo = m; else hi = m; }
      buyerMax = r2(lo);
    } else buyerMax = 0;
  }
  return { rows: rows, breakEven: breakEven, minFob: minFob, buyerMax: buyerMax };
}

// Defaults for a new input tab: RFQ answers first, then Cost Settings, then the sample dossier's terms.
function icDefaults_(p, S) {
  const rice = /rice/i.test(p.commodity);
  const port = String(p.port || '');
  return {
    buyer: p.name, contact: p.contact, buyer_country: p.country, commodity: p.commodity, variety: p.grade,
    crop_year: Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy'), hs_code: rice ? (/basmati/i.test(p.commodity) ? '1006.30.20' : '1006.30.90') : '',
    qty_mt: quantityMt_(p.quantity) || '', bag_kg: (String(p.packing).match(/(\d+(?:\.\d+)?)\s*kg/i) || [])[1] || 50,
    bag_type: 'Export-grade virgin jute', branding: p.label, incoterm: p.incoterm,
    payment_option: /l\/?c/i.test(p.payment) ? 'B: 100% irrevocable confirmed sight L/C' : 'A: 30% advance + 70% against BL copy',
    shipment_window: p.shipment, validity_days: setting_(S, 'Quotation validity (days)', 7),
    q_moisture: rice ? '13.5%' : '', q_broken: rice ? '5%' : '', q_fm_inorg: rice ? '0.1%' : '', q_fm_org: rice ? '0.4%' : '',
    q_damaged: rice ? '1.5%' : '', cfs_facility: setting_(S, 'CHA / CFS partner', '') ? setting_(S, 'CHA / CFS partner', '') + ' CFS' : '', q_milling: rice ? 'Well-milled, 100% sortexed, double polished' : '',
    q_aflatoxin: 'Total B1+B2+G1+G2 < 4 ppb', q_heavy: 'Within WHO limits', q_other: p.notes && p.notes !== 'None' ? String(p.notes).replace(/^\[(AR|FR)\]\s*/, '') : '',
    mill_name: setting_(S, 'Mill name', ''), mill_location: setting_(S, 'Mill / origin', ''),
    mill_price: setting_(S, 'Default mill price (INR per 100 kg)', ''), inland_km: setting_(S, 'Inland distance (km)', ''),
    lorry: 'Open lorry, mill direct to CFS', cha: setting_(S, 'CHA / CFS partner', ''), pol: setting_(S, 'Port of loading', ''),
    container_type: "20 ft heavy-duty (30.48 MT payload)", mt_per_ctr: setting_(S, 'MT per 20 ft container', 25),
    stuffing: 'Direct CFS stuffing', pod: port.replace(/\s*\(transit\)$/, ''), final_dest: p.final_dest || '',
    transit_regime: /\(transit\)$/.test(port) ? 'Bonded transit to ' + p.country : '',
    fx: setting_(S, 'USD rate (INR per 1 USD)', 94.85), margin_pct: setting_(S, 'Margin (% of cargo cost)', 10),
    gst_pct: setting_(S, 'GST on logistics services (%)', 18),
    b_vat_recoverable: 'Y', balance_days: 3, moisture_tol: '±0.75%', payload: '30.48 MT (20 ft heavy-tested)', forex_recal: 1.5, free_days: 14,
    demurrage: 'INR 2,000 per week per box', t_procure: '2-3', t_cfs: '2', t_cha: '2', t_ready: '7-10', t_sea: '', t_inland: ''
  };
}

function rfqFromRow_(sheet, row) {
  migrateRfqNo_(sheet);
  const r = sheet.getRange(row, 1, 1, HEADERS.length).getValues()[0];
  const p = { ref: String(r[1] || ''), name: String(r[2] || ''), email: String(r[3] || '').trim(), phone: String(r[4] || ''),
              country: String(r[5] || ''), commodity: String(r[6] || ''), quantity: String(r[7] || ''), notes: String(r[8] || '') };
  EXTRA_FIELDS.forEach((k, i) => { p[k] = String(r[11 + i] || ''); });
  if (!p.ref) {
    p.ref = 'BV-' + Utilities.formatDate(isDate_(r[0]) ? r[0] : new Date(), 'Asia/Kolkata', 'yyMMdd-HHmmss');
    sheet.getRange(row, 2).setValue(p.ref);
  }
  return p;
}

function findRfqRow_(sheet, ref) {
  const n = sheet.getLastRow();
  if (n < 2) return 0;
  const refs = sheet.getRange(2, 2, n - 1, 1).getValues();
  for (let i = 0; i < refs.length; i++) if (String(refs[i][0]) === ref) return i + 2;
  return 0;
}

// Creates the "IC <RFQ No.>" input tab (or returns the existing one).
function icSheet_(p, cfg, create) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const name = IC_PREFIX + p.ref;
  let sh = ss.getSheetByName(name);
  if (sh || !create) return { sheet: sh, created: false };
  sh = ss.insertSheet(name);
  const d = icDefaults_(p, cfg.settings);
  const rows = [['key', 'Input', 'Value', 'Help', '', '', ''].concat(QUOTE_HEAD)];
  IC_FIELDS.forEach(f => rows.push(f[0] === '#' ? ['#', f[1], '', ''] : [f[0], f[1], d[f[0]] == null ? '' : d[f[0]],
    (f[2] ? 'Required. ' : '') + (f[3] || '') + (QUOTE_FIELDS[f[0]] ? (f[3] ? '. ' : '') + 'Put forwarder / agent quotes in columns H and I; if Value is blank the lowest quote is used' : '')]));
  rows.push(['#', '11. Cost lines for this deal (copied from "' + COST_RATES_TAB + '"; edit rates or Include for this deal only. Put CHA / CFS / transporter quotes in columns H and I, e.g. "Sea Hawk CHA: 2400")', '', '']);
  rows.push(['__lines__', 'Cost item', 'Rate (INR)', 'Per (MT / bag / container / shipment)', 'GST (Y/N)', 'Include (Y/N)', 'Basis'].concat(QUOTE_HEAD));
  cfg.rates.forEach(x => rows.push(['line', x.item, x.rate == null ? '' : x.rate, x.per, x.gst ? 'Y' : 'N', x.include ? 'Y' : 'N', x.basis]));
  // Pre-fill quotes from earlier deals on the same route (Logistics Quote Log).
  const past = pastQuotes_(String(d.pol || ''), [d.pod, d.final_dest].filter(Boolean).join(' -> ') + (d.buyer_country ? ', ' + d.buyer_country : ''));
  let prefilled = 0;
  rows.forEach(r => {
    const qs = past[r[0] === 'line' ? r[1] : QUOTE_FIELDS[r[0]] ? quoteLabel_(r[0]) : ''];
    if (!qs) return;
    while (r.length < 7) r.push('');
    r[7] = quoteCell_(qs[0]); r[8] = qs[1] ? quoteCell_(qs[1]) : '';
    prefilled++;
  });
  const width = 10;
  sh.getRange(1, 3, rows.length + 200, 1).setNumberFormat('@');
  sh.getRange(1, 1, rows.length, width).setValues(rows.map(r => r.concat(Array(width - r.length).fill(''))));
  sh.getRange(1, 1, 1, width).setFontWeight('bold').setBackground('#1B4D3E').setFontColor('#FFFFFF');
  rows.forEach((r, i) => {
    if (r[0] === '#') sh.getRange(i + 1, 2, 1, width - 1).setFontWeight('bold').setBackground('#F8F5EC').setFontColor('#8A6508');
    else if (r[0] === '__lines__') sh.getRange(i + 1, 2, 1, width - 1).setFontWeight('bold').setBackground('#1B4D3E').setFontColor('#FFFFFF');
    else if (/^Required/.test(String(r[3])) || (r[0] === 'line' && r[2] === '' && r[5] === 'Y')) sh.getRange(i + 1, 3).setBackground('#FFF3C4');
    if (r[0] === 'line' || QUOTE_FIELDS[r[0]]) sh.getRange(i + 1, 8, 1, 2).setBackground('#E8F1FB');
  });
  sh.setColumnWidth(2, 330); sh.setColumnWidth(3, 300); sh.setColumnWidth(4, 360); sh.setColumnWidths(5, 3, 110); sh.setColumnWidths(8, 3, 190);
  sh.hideColumns(1); sh.setFrozenRows(1);
  return { sheet: sh, created: true, prefilled: prefilled };
}

// Sheets turns "13.5%" into 0.135 and "2-3" into a date; turn them back into what was typed.
function icValue_(k, x) {
  if (isDate_(x)) return /^t_/.test(k) ? (x.getMonth() + 1) + '-' + x.getDate() : Utilities.formatDate(x, 'Asia/Kolkata', 'dd MMM yyyy');
  if (typeof x === 'number' && /^d?q_/.test(k) && x > 0 && x < 1) return +(x * 100).toFixed(3) + '%';
  return typeof x === 'string' ? x.trim() : x;
}

// Adds the quote column headings to an input tab made before quotes existed.
function icQuoteCols_(sh) {
  const data = sh.getRange(1, 1, sh.getLastRow(), 8).getValues();
  data.forEach((r, i) => {
    if ((i === 0 || r[0] === '__lines__') && !r[7]) sh.getRange(i + 1, 8, 1, 3).setValues([QUOTE_HEAD]).setFontWeight('bold').setBackground('#1B4D3E').setFontColor('#FFFFFF');
  });
}

// "Maersk: USD 2,150", "2150" or 2150 -> { vendor, amt }. Null when there is no number.
function parseQuote_(x) {
  if (x === '' || x == null) return null;
  if (typeof x === 'number') return isFinite(x) ? { vendor: '', amt: x } : null;
  let s = String(x).trim(), date = '';
  const dm = s.match(/\s*\(([^)]*\d{4}[^)]*)\)\s*$/);
  if (dm) { date = dm[1].trim(); s = s.slice(0, dm.index).trim(); }
  const nums = s.match(/\d[\d,]*(?:\.\d+)?/g);
  if (!nums) return null;
  const last = nums[nums.length - 1];
  const vendor = s.slice(0, s.lastIndexOf(last)).replace(/\s*(INR|USD|Rs\.?|₹|\$)\s*$/i, '').replace(/[\s:\-–=@]+$/, '').trim();
  const q = { vendor: vendor, amt: Number(last.replace(/,/g, '')) };
  if (date) q.date = date;
  return q;
}
// Short label used for a destination charge in the comparison and the Quote Log.
function quoteLabel_(k) { return (IC_FIELDS.find(f => f[0] === k) || [k, k])[1].replace(/ per container \(USD\)$/, ''); }

// Latest written quotes (up to 2 vendors per cost item) from the Quote Log for this route.
// Origin items match on the port of loading; destination charges match on port + final destination + country.
function pastQuotes_(pol, destRoute) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(QUOTE_LOG_TAB);
  const out = {};
  if (!sh || sh.getLastRow() < 2) return out;
  const rows = sh.getRange(2, 1, sh.getLastRow() - 1, 10).getValues();
  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i];
    if (r[6] !== 'Written quote' || num_(r[8]) == null) continue;
    const parts = String(r[3]).split(' -> ');
    const match = /^INR/.test(String(r[5])) ? parts[0] === pol : parts.slice(1).join(' -> ') === destRoute;
    if (!match) continue;
    const list = out[r[4]] = out[r[4]] || [];
    if (list.length < 2 && !list.some(q => q.vendor === String(r[7]))) {
      list.push({ vendor: String(r[7]), amt: num_(r[8]), date: isDate_(r[0]) ? Utilities.formatDate(r[0], 'Asia/Kolkata', 'dd MMM yyyy') : String(r[0]) });
    }
  }
  return out;
}
const quoteCell_ = q => (q.vendor ? q.vendor + ': ' : '') + q.amt + (q.date ? ' (' + q.date + ')' : '');

const lowest_ = qs => qs.slice().sort((a, b) => a.amt - b.amt)[0] || null;

// Reads the input tab into { v: {key: value}, lines: [...], missing: [labels], quotes: {key: [..]}, src: {key: 'quote'} }.
// A blank Value or Rate with quotes in columns H / I takes the lowest quote.
function readIc_(sh) {
  const data = sh.getRange(1, 1, sh.getLastRow(), 10).getValues();
  const v = {}, lines = [], quotes = {}, src = {};
  const qOf = r => [parseQuote_(r[7]), parseQuote_(r[8])].filter(Boolean);
  const labels = {};
  IC_FIELDS.forEach(f => { if (f[0] !== '#') labels[f[0]] = f; });
  data.forEach(r => {
    const k = String(r[0]);
    if (k === 'line') {
      if (!r[1]) return;
      const x = { item: String(r[1]), rate: num_(r[2]), per: String(r[3] || 'shipment').toLowerCase().trim(),
                  gst: /^y/i.test(String(r[4])), include: !/^n/i.test(String(r[5])), basis: String(r[6] || ''), quotes: qOf(r) };
      if (x.rate == null && x.quotes.length) { x.rate = lowest_(x.quotes).amt; x.fromQuote = true; }
      lines.push(x);
    } else if (labels[k]) {
      v[k] = icValue_(k, r[2]);
      if (QUOTE_FIELDS[k]) {
        quotes[k] = qOf(r);
        if ((v[k] === '' || v[k] == null) && quotes[k].length) { v[k] = lowest_(quotes[k]).amt; src[k] = 'quote'; }
      }
    }
  });
  const missing = Object.keys(labels).filter(k => labels[k][2] && (v[k] === '' || v[k] == null)).map(k => labels[k][1]);
  // An included cost line must have a rate (0 is allowed when it truly costs nothing).
  lines.filter(x => x.include && x.rate == null).forEach(x => missing.push('Rate for cost line "' + x.item + '" (or set Include to N)'));
  ['qty_mt', 'bag_kg', 'mill_price', 'mt_per_ctr', 'fx'].forEach(k => {
    if (v[k] !== '' && v[k] != null && !(num_(v[k]) > 0)) missing.push(labels[k][1] + ' (must be a number above 0)');
  });
  return { v, lines, missing, quotes, src };
}

function prepareCostingInputs() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSheet();
  if (sheet.getName() !== SHEET_NAME) { ui.alert('Open the "' + SHEET_NAME + '" tab and click a cell in the RFQ row first.'); return; }
  const row = sheet.getActiveRange().getRow();
  if (row < 2) { ui.alert('Click a cell in an RFQ row (not the header) first.'); return; }
  const p = rfqFromRow_(sheet, row);
  const cfg = setupCosting_();
  const ic = icSheet_(p, cfg, true);
  if (!ic.created) icQuoteCols_(ic.sheet);
  const w = prefillWeb_(ic.sheet, p, cfg);
  ic.sheet.activate();
  ui.alert((ic.created
    ? 'Tab "' + ic.sheet.getName() + '" is ready, filled with what the RFQ and your defaults already say.' +
      (ic.prefilled ? ' ' + ic.prefilled + ' line(s) have quotes from earlier deals on this route (columns H and I).' : '') + '\n\nCheck every value, fill the yellow (required) cells and anything else you know, then choose Bhumi Varahi -> Create internal costing.'
    : 'Opened the existing input tab "' + ic.sheet.getName() + '" and refreshed the web prices in column J.') + webNote_(w));
}

function createInternalCosting() {
  const ui = SpreadsheetApp.getUi();
  const active = SpreadsheetApp.getActiveSheet();
  const rfqs = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  let row;
  if (active.getName().indexOf(IC_PREFIX) === 0) {
    row = findRfqRow_(rfqs, active.getName().slice(IC_PREFIX.length));
    if (!row) { ui.alert('Could not find RFQ ' + active.getName().slice(IC_PREFIX.length) + ' in the "' + SHEET_NAME + '" tab.'); return; }
  } else if (active.getName() === SHEET_NAME) {
    row = active.getActiveRange().getRow();
    if (row < 2) { ui.alert('Click a cell in an RFQ row (not the header) first.'); return; }
  } else { ui.alert('Click a cell in an RFQ row, or open its "IC ..." input tab, first.'); return; }
  const cfg = setupCosting_();
  const p = rfqFromRow_(rfqs, row);
  const ic = icSheet_(p, cfg, true);
  if (ic.created) {
    const w = prefillWeb_(ic.sheet, p, cfg);
    ic.sheet.activate();
    ui.alert('First, the inputs. Tab "' + ic.sheet.getName() + '" is ready with what we already know.' +
      (ic.prefilled ? '\n\n' + ic.prefilled + ' line(s) have quotes from earlier deals on this route in columns H and I, with their dates. Replace them with fresh quotes where you can.' : '') +
      '\n\nCheck it, fill the yellow cells, then run Create internal costing again.' + webNote_(w));
    return;
  }
  icQuoteCols_(ic.sheet);
  const r = costingRow_(rfqs, row, cfg, readIc_(ic.sheet));
  if (r.web) writeWebEstimates_(ic.sheet, r.web);
  if (r.missing) { ic.sheet.activate(); ui.alert('Please fill these in the "' + ic.sheet.getName() + '" tab first:\n\n- ' + r.missing.join('\n- ')); return; }
  ui.alert(r.message);
}

// Gemini research for an input tab's values. Returns null (no key), { error } or the research.
function researchInputs_(p, V, c, S, lines) {
  const val = k => (V[k] === '' || V[k] == null) ? '' : String(V[k]);
  const finalDest = val('final_dest'), country = val('buyer_country');
  const rp = Object.assign({}, p, { commodity: val('commodity'), grade: val('variety'), packing: (num_(V.bag_kg) || 50) + ' kg ' + val('bag_type'),
    port: val('pod') + (finalDest ? ', ' + country + ' (transit)' : ''), final_dest: finalDest, country: country, incoterm: val('incoterm'), payment: val('payment_option') });
  return researchDestination_(rp, c, { mt: num_(V.qty_mt), pol: val('pol'), fx: num_(V.fx), lines: (lines || []).filter(x => x.include),
    model: String(setting_(S, 'Gemini model', 'gemini-3.8-flash')) });
}

// Every input Gemini has a figure for, as { key: value } (nothing is written into Value). Pure.
function webFields_(fig, transit) {
  const W = {};
  if (!fig) return W;
  applyAiFigures_(W, fig, transit);
  if (num_(fig.india_mill_price_inr_per_100kg_typical) != null) W.mill_price = num_(fig.india_mill_price_inr_per_100kg_typical);
  return W;
}

// Runs Gemini when the input tab is prepared, and puts its web / market figures in column J beside
// each input, with the research summary and sources at the bottom. Your own values are not touched.
function prefillWeb_(sh, p, cfg) {
  const S = cfg.settings;
  if (/^n/i.test(String(setting_(S, 'Gemini research (Y/N)', 'Y')))) return { off: true };
  const inp = readIc_(sh), V = inp.v;
  const mt = num_(V.qty_mt), fx = num_(V.fx), mill = num_(V.mill_price);
  let c = null;
  if (mt > 0 && fx > 0 && mill > 0) {
    c = computeCosting_({ fx: fx, mt: mt, bagKg: num_(V.bag_kg), containerMt: num_(V.mt_per_ctr), millPer100kg: mill, commodity: String(V.commodity || ''),
      mill: '', rates: inp.lines, marginPct: num_(V.margin_pct) || 0, gstPct: num_(V.gst_pct) });
  }
  if (!c) c = { containers: Math.max(1, Math.ceil((mt || 25) / (num_(V.mt_per_ctr) || 25) - 1e-9)), fobUsdPerMt: null };
  const r = researchInputs_(p, V, c, S, inp.lines);
  if (!r) return { nokey: true };
  if (r.error) return { error: r.error };
  const fig = r.figures || {};
  const web = { fields: webFields_(fig, !!V.final_dest), lines: {} };
  originEstimates_(fig.origin_costs_inr, r.text, inp.lines).forEach(e => { web.lines[e.item] = e.rate; });
  writeWebEstimates_(sh, web);
  // Research summary and sources at the bottom of the tab (replaced on each run)
  const day = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd MMM yyyy');
  const notes = [['#', '12. Web research by Gemini (' + day + '): verify before use. Figures are in column J beside each input', '', ''],
    ['web', 'Research summary', '', String(r.text).slice(0, 45000)],
    ['web', 'Sources', '', r.sources.map((x, i) => (i + 1) + '. ' + x.title + ' ' + x.uri).join('\n')]];
  const ab = sh.getRange(1, 1, sh.getLastRow(), 2).getValues();
  let at = ab.findIndex(x => x[0] === '#' && /^12\. Web research/.test(String(x[1])));
  at = at >= 0 ? at + 1 : sh.getLastRow() + 2;
  sh.getRange(at, 1, notes.length, 4).setValues(notes);
  sh.getRange(at, 2, 1, 3).setFontWeight('bold').setBackground('#F8F5EC').setFontColor('#8A6508');
  return { filled: Object.keys(web.fields).length + Object.keys(web.lines).length, sources: r.sources.length };
}
const webNote_ = w => !w ? '' : w.off ? '' : w.nokey ? '\n\nGemini web prices were not added: set the key with Bhumi Varahi -> Set Gemini API key.'
  : w.error ? '\n\nGemini web prices could not be added this time: ' + w.error
  : '\n\nGemini added web / market figures for ' + w.filled + ' inputs in column J (from ' + w.sources + ' sources), with a research summary at the bottom of the tab. Use them as a guide while you enter your own values.';

// Writes Gemini's latest logistics estimates into column J of the input tab, beside the quotes.
function writeWebEstimates_(sh, web) {
  const data = sh.getRange(1, 1, sh.getLastRow(), 2).getValues();
  data.forEach((r, i) => {
    const x = r[0] === 'line' ? web.lines[String(r[1])] : web.fields[String(r[0])];
    if (x != null) sh.getRange(i + 1, 10).setValue(x);
  });
}

// Gemini's origin rates matched to our cost lines: from the JSON (array or object), else from the
// "India origin logistics" bullets in the text. Names are matched loosely. Pure.
function originEstimates_(raw, text, lines) {
  const norm = x => String(x || '').toLowerCase().replace(/\(per [^)]*\)\s*$/, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const find = name => { const n = norm(name); return n && lines.find(l => { const m = norm(l.item); return m === n || m.indexOf(n) === 0 || n.indexOf(m) === 0; }); };
  let list = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? Object.keys(raw).map(k => ({ item: k, rate: raw[k] })) : [];
  const out = [], seen = {};
  const push = (name, rate) => { const l = find(name), r = num_(rate); if (l && r != null && !seen[l.item]) { seen[l.item] = 1; out.push({ item: l.item, rate: r }); } };
  list.forEach(e => e && push(e.item, e.rate));
  if (!out.length && text) {
    const sec = String(text).split(/\n(?=#{1,4}\s)/).find(x => /^#{1,4}\s*India origin logistics/i.test(x)) || '';
    sec.split(/\n/).forEach(line => {
      const m = line.match(/^\s*[-*•]\s*\**(.+?)\**\s*:\s*(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d+)?)/i);
      if (m) push(m[1], m[2]);
    });
  }
  return out;
}

// Compares each cost line with its written quotes and the web estimate. Pure.
// items: [{ label, unit, used, src ('entered' | 'quote' | 'AI'), quotes: [{vendor, amt}], web }]
function compareQuotes_(items, opts) {
  opts = opts || {};
  const ageDays = q => { const t = q.date ? Date.parse(q.date) : NaN; return isNaN(t) || !opts.now ? null : Math.floor((opts.now - t) / 864e5); };
  return items.map(x => {
    const low = lowest_(x.quotes || []), notes = [];
    let flag = 'ok';
    const old = opts.validDays ? (x.quotes || []).filter(q => ageDays(q) > opts.validDays) : [];
    if (low && x.used != null && x.used > low.amt * 1.1) {
      flag = 'high';
      notes.push(Math.round((x.used / low.amt - 1) * 100) + '% above the lowest quote' + (low.vendor ? ' (' + low.vendor + ')' : ''));
    }
    if (x.web != null && x.web > 0 && x.used != null && x.src !== 'AI') {
      const g = (x.used - x.web) / x.web * 100;
      if (Math.abs(g) > 40) { if (flag === 'ok') flag = 'web'; notes.push(Math.abs(Math.round(g)) + '% ' + (g > 0 ? 'above' : 'below') + ' the web estimate: re-check'); }
    }
    if (!(x.quotes || []).length) { if (flag === 'ok') flag = x.src === 'AI' ? 'aionly' : 'noquote'; notes.push(x.src === 'AI' ? 'Web estimate only: get a written quote' : 'No written quote entered'); }
    else if (flag === 'ok') notes.push(x.used <= low.amt ? 'Lowest quote used' : 'Within 10% of the lowest quote');
    if (old.length) { notes.push('Quote' + (old.length > 1 ? 's' : '') + ' from ' + old.map(q => q.date).join(', ') + ' older than ' + opts.validDays + ' days: re-confirm'); }
    return Object.assign({}, x, { low: low, flag: flag, stale: old.length > 0, note: notes.join('. ') });
  });
}

// Fills empty buyer-side and market inputs from Gemini's figures. Returns the keys it filled. Pure.
function applyAiFigures_(V, f, transit) {
  const filled = [];
  if (!f) return filled;
  const map = [['b_freight', 'ocean_freight_usd_per_20ft'], ['b_local', 'carrier_local_usd_per_20ft'], ['b_port', 'dest_port_usd_per_20ft'],
    ['b_lolo', 'dest_lolo_usd_per_20ft'], ['b_duty_pct', 'import_duty_pct'], ['b_levy_pct', 'other_levies_pct'],
    ['b_clear', 'import_clearing_usd_per_20ft'], ['b_vat_pct', 'import_vat_pct'], ['local_ccy', 'local_currency'], ['local_fx', 'local_per_usd'],
    ['m_whole_low', 'wholesale_local_per_kg_low'], ['m_whole_high', 'wholesale_local_per_kg_high'],
    ['m_semi_low', 'semi_wholesale_local_per_kg_low'], ['m_semi_high', 'semi_wholesale_local_per_kg_high'],
    ['m_retail_low', 'retail_local_per_kg_low'], ['m_retail_high', 'retail_local_per_kg_high'],
    ['q_dest_std', 'dest_standard'], ['dq_moisture', 'dest_moisture_max'], ['dq_broken', 'dest_broken_max'], ['dq_aflatoxin', 'dest_aflatoxin_max'],
    ['b_ins_pct', 'marine_insurance_pct_of_cfr'], ['fob_benchmark', 'india_fob_usd_per_mt_typical'], ['t_sea', 'sea_transit_days']];
  if (f.pre_shipment_inspection_required === true && (V.dest_inspection === '' || V.dest_inspection == null)) {
    V.dest_inspection = String(f.pre_shipment_inspection_name || 'Pre-shipment inspection / Certificate of Conformity');
    filled.push('dest_inspection');
  }
  if (transit) map.push(['b_inland', 'inland_trucking_usd_per_20ft'], ['b_bond', 'transit_bond_usd_per_20ft'], ['corridor', 'overland_corridor'], ['t_inland', 'overland_transit_days']);
  map.forEach(m => {
    const x = f[m[1]];
    if ((V[m[0]] === '' || V[m[0]] == null) && x !== null && x !== undefined && x !== '') {
      if (typeof x === 'number' && /^dq_/.test(m[0])) V[m[0]] = x + (/aflatoxin/.test(m[0]) ? ' ppb' : '%');
      else V[m[0]] = x;
      filled.push(m[0]);
    }
  });
  return filled;
}

// Go / No-Go scorecard. Pure: returns { verdict, rows: [[criterion, status, detail]] }.
// status is GO, WATCH or STOP. Any STOP -> NO-GO; any WATCH -> GO WITH CONDITIONS.
function decide_(o) {
  const rows = [];
  const add = (k, st, d) => rows.push([k, st, d]);
  const pct = n => (Math.round(n * 100) / 100) + '%';
  // 1. Our margin
  add('Our margin', o.marginPct >= o.minMargin ? 'GO' : o.marginPct > 0 ? 'WATCH' : 'STOP',
      pct(o.marginPct) + ' of cargo cost (minimum for GO: ' + o.minMargin + '%), ' + o.marginUsd + ' net');
  // 2. Buyer's target price
  const qBasis = o.quoteBasis || 'FOB', qPerMt = o.quotePerMt || o.fobPerMt;
  if (o.target && o.target < qPerMt * 0.15) {
    add('Buyer target price', 'WATCH', 'USD ' + o.target + '/MT is far below any real price for this product (our ' + qBasis + ' is USD ' + qPerMt.toFixed(2) +
        '/MT). It is probably a different unit (per kg or per bag) or a typo. Confirm with the buyer before replying.');
  } else if (o.target) {
    const m = o.marginAtTarget;
    add('Buyer target price', o.target >= qPerMt ? 'GO' : m >= o.minMargin ? 'GO' : m > 0 ? 'WATCH' : 'STOP',
        'USD ' + o.target + '/MT vs our ' + qBasis + ' USD ' + qPerMt.toFixed(2) + '/MT' + (o.target < qPerMt ? '; at their price our margin would be ' + pct(m) : ''));
  } else add('Buyer target price', 'WATCH', 'Not given; confirm the buyer accepts USD ' + qPerMt.toFixed(2) + '/MT ' + qBasis);
  // 2b. Container fill
  if (o.fill && o.fill.pct < 0.9) {
    const F = o.fill;
    add('Container load', F.pct < 0.5 ? 'STOP' : 'WATCH', F.mt + ' MT fills ' + Math.round(F.pct * 100) + '% of ' + F.containers + ' x 20 ft (' + F.capacity + ' MT each). ' +
        'Freight, THC, haulage and stuffing are paid per container, so our price is USD ' + o.fobPerMt.toFixed(2) + '/MT against USD ' + F.fullFobPerMt.toFixed(2) +
        '/MT for a full load. ' + (F.pct < 0.5 ? 'Ask the buyer for a full container, or quote LCL / courier for a sample.' : 'Suggest filling the container to ' + (F.containers * F.capacity) + ' MT.'));
  }
  // 2c. Buyer's Incoterm
  if (qBasis !== 'FOB') {
    if (!o.quotePerMt) add('Buyer\'s Incoterm', 'WATCH', 'Buyer asked for ' + qBasis + ' but there is no freight figure, so only FOB can be quoted. Get a freight quote.');
    else add('Buyer\'s Incoterm', o.freightAi ? 'WATCH' : 'GO', qBasis + ' price USD ' + qPerMt.toFixed(2) + '/MT' +
        (o.freightAi ? ' uses a web freight estimate. Get a written freight quote before quoting ' + qBasis + '.' : ' (freight from ' + (o.freightQuote ? 'the lowest written quote' : 'the input tab') + ').'));
  }
  // 3. Payment security
  add('Payment security', /^[AB]\b/i.test(o.payment) ? 'GO' : 'STOP', o.payment || 'Not set');
  // 4. Registrations
  add('Our registrations', o.licencesPending.length ? 'STOP' : 'GO',
      o.licencesPending.length ? 'Not yet Active: ' + o.licencesPending.join(', ') : 'All Active');
  // 5. Buyer viability
  if (o.buyerRoi == null) add('Buyer profitability', 'WATCH', 'Buyer landed cost or selling price not available');
  else add('Buyer profitability', o.buyerRoi >= o.minBuyer ? 'GO' : o.buyerRoi > 0 ? 'WATCH' : 'STOP',
           pct(o.buyerRoi) + ' return on landed cost (minimum for GO: ' + o.minBuyer + '%)' + (o.aiBuyer ? '; uses AI estimates' : ''));
  // 6a. Our price against the typical India FOB for this product
  if (o.fobBenchmark) {
    const part = o.fill && o.fill.pct < 0.9, bf = part ? o.fill.fullFobPerMt : o.fobPerMt;
    const r = bf / o.fobBenchmark;
    add('Price vs typical India FOB', r < 0.75 ? 'STOP' : r < 0.9 || r > 1.25 ? 'WATCH' : 'GO',
        'Our FOB USD ' + bf.toFixed(2) + '/MT' + (part ? ' (at a full container)' : '') + ' is ' + Math.round(r * 100) + '% of the typical USD ' + Math.round(o.fobBenchmark) + '/MT' + (o.benchAi ? ' (AI est.)' : '') +
        (r < 0.75 ? '. Far too low: the mill price or grade is probably wrong, and customs may query under-invoicing. Do not quote this price.' : r < 0.9 ? '. Below market: re-check the mill price.' : r > 1.25 ? '. Above market: the buyer may not accept it.' : ''));
  }
  // 6b. Price sanity against the destination market
  if (o.wholesaleUsdLow) {
    const ratio = o.fobPerMt / o.wholesaleUsdLow;
    add('Price vs destination market', ratio < 0.35 ? 'WATCH' : 'GO',
        'Our FOB is ' + Math.round(ratio * 100) + '% of the lowest wholesale price (USD ' + o.wholesaleUsdLow.toFixed(0) + '/MT)' + (ratio < 0.35 ? '. Unusually low: check the mill price and grade, and under-invoicing risk' : ''));
  }
  // 7. Inputs left at defaults
  if (!o.millDefault && o.fobBenchmark && o.millUsdPerMt && o.millUsdPerMt < o.fobBenchmark * 0.6)
    add('Mill price', 'WATCH', 'INR ' + o.millPrice + '/100 kg is USD ' + o.millUsdPerMt.toFixed(0) + '/MT, only ' + Math.round(o.millUsdPerMt / o.fobBenchmark * 100) +
        '% of the typical FOB of USD ' + Math.round(o.fobBenchmark) + '/MT. The cargo is usually 80-90% of FOB, so check the mill quote is for this grade.');
  if (o.millDefault) add('Mill price', 'WATCH', 'Still the default from Cost Settings (INR ' + o.millPrice + '/100 kg). Get a quote for this grade.');
  // 8. Destination inspection
  if (o.inspectionNeeded && !o.inspectionCosted) add('Destination inspection', 'STOP', o.inspection + (o.inspectionAi ? ' (AI est.)' : '') + ' is required but its cost is not in the costing. Set the PVoC / CoC cost line to Include = Y (or enter the agency quote).');
  else if (o.inspectionNeeded) add('Destination inspection', 'GO', o.inspection + ' costed');
  // 8a. Room between our minimum price and the most the buyer can pay
  if (o.priceRoom) {
    const R = o.priceRoom, f = n => 'USD ' + n.toFixed(2);
    add('Negotiation room', R.buyerMax >= R.minFob ? 'GO' : 'WATCH', R.buyerMax >= R.minFob
      ? 'Any FOB from ' + f(R.minFob) + ' (our ' + R.minMargin + '% margin) to ' + f(R.buyerMax) + ' / MT (buyer keeps ' + R.minBuyer + '%) works for both sides'
      : R.buyerMax <= 0 ? 'No price works: even at FOB USD 0 the buyer\'s freight and local costs leave less than ' + R.minBuyer + '% at these market prices'
      : 'No price works for both sides: we need at least ' + f(R.minFob) + ' / MT, the buyer can pay at most ' + f(R.buyerMax) + ' / MT to keep ' + R.minBuyer + '%');
  }
  // 8b. Logistics rates against quotes and web estimates
  if (o.logistics) {
    const L = o.logistics, bits = [];
    if (L.high.length) bits.push('Costed above the lowest quote: ' + L.high.join(', '));
    if (L.web.length) bits.push('Far from the web estimate: ' + L.web.join(', '));
    if (L.aiOnly.length) bits.push('Web estimate only, no written quote: ' + L.aiOnly.join(', '));
    if ((L.stale || []).length) bits.push('Quotes to re-confirm (older than ' + L.validDays + ' days): ' + L.stale.join(', '));
    if (bits.length || L.quoted) add('Logistics quotes', bits.length ? 'WATCH' : 'GO', bits.length ? bits.join('. ') : L.quoted + ' cost line(s) match the written quotes');
  }
  // 9. Buyer documents
  add('Buyer documents', o.buyerPending ? 'WATCH' : 'GO', o.buyerPending ? o.buyerPending + ' items still pending from the buyer' : 'All received');
  const verdict = rows.some(r => r[1] === 'STOP') ? 'NO-GO' : rows.some(r => r[1] === 'WATCH') ? 'GO WITH CONDITIONS' : 'GO';
  return { verdict, rows };
}

// Shared by the menu (and tests). inp = readIc_() result. Returns { message, costNo, pdfUrl, calc, buyer, decision } or { missing }.
function costingRow_(sheet, row, cfg, inp) {
  if (inp.missing.length) return { missing: inp.missing };
  const p = rfqFromRow_(sheet, row);
  const V = Object.assign({}, inp.v), S = cfg.settings;
  const val = k => (V[k] === '' || V[k] == null) ? '' : String(V[k]);
  const mt = num_(V.qty_mt), fx = num_(V.fx), bagKg = num_(V.bag_kg), marginPct = num_(V.margin_pct) || 0;
  const ccIn = { fx: fx, mt: mt, bagKg: bagKg, containerMt: num_(V.mt_per_ctr), millPer100kg: num_(V.mill_price),
    commodity: [val('commodity'), val('variety')].filter(Boolean).join(', '), mill: [val('mill_name'), val('mill_location')].filter(Boolean).join(', '),
    rates: inp.lines, marginPct: marginPct, gstPct: num_(V.gst_pct) };
  const c = computeCosting_(ccIn);
  const pol = val('pol'), pod = val('pod'), finalDest = val('final_dest'), country = val('buyer_country');
  const year = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy');

  // Destination research first, so its figures can fill empty buyer-side inputs.
  let research = null;
  if (!/^n/i.test(String(setting_(S, 'Gemini research (Y/N)', 'Y')))) {
    research = researchInputs_(p, V, c, S, inp.lines);
  }
  const aiFilled = research && !research.error ? applyAiFigures_(V, research.figures, !!finalDest) : [];
  const isAi = k => aiFilled.indexOf(k) >= 0;
  const AI = ' (AI est.)';

  // Logistics quotes vs web estimates
  const fig = (research && !research.error && research.figures) || {};
  const webField = {}, webLine = {};
  Object.keys(QUOTE_FIELDS).forEach(k => { const x = num_(fig[QUOTE_FIELDS[k]]); if (x != null && fig[QUOTE_FIELDS[k]] !== '') webField[k] = x; });
  originEstimates_(fig.origin_costs_inr, research && research.text, inp.lines).forEach(e => { webLine[e.item] = e.rate; });
  const fieldLabel = quoteLabel_;
  const qOpts = { now: Date.now(), validDays: num_(setting_(S, 'Logistics quotes valid for (days)', 30)) || 30 };
  const originQ = compareQuotes_(inp.lines.filter(l => l.include).map(l => ({ label: l.item, unit: 'INR / ' + l.per, used: l.rate,
    src: l.fromQuote ? 'quote' : 'entered', quotes: l.quotes || [], web: webLine[l.item] })), qOpts);
  const destQ = compareQuotes_(Object.keys(QUOTE_FIELDS).map(k => ({ key: k, label: fieldLabel(k), unit: 'USD / container', used: num_(V[k]),
    src: (inp.src || {})[k] === 'quote' ? 'quote' : isAi(k) ? 'AI' : 'entered', quotes: (inp.quotes || {})[k] || [], web: webField[k] }))
    .filter(x => x.used || x.quotes.length || (x.web != null && (finalDest || !/^b_(inland|bond)$/.test(x.key)))), qOpts);
  const allQ = originQ.concat(destQ);
  const logistics = allQ.some(x => x.quotes.length || x.web != null) ? {
    high: allQ.filter(x => x.flag === 'high').map(x => x.label), web: allQ.filter(x => x.flag === 'web').map(x => x.label),
    aiOnly: destQ.filter(x => x.flag === 'aionly' && x.used).map(x => x.label), quoted: allQ.filter(x => x.quotes.length).length,
    stale: allQ.filter(x => x.stale).map(x => x.label), validDays: qOpts.validDays } : null;

  // Market prices (local per kg) -> USD per MT
  const lfx = num_(V.local_fx), ccy = val('local_ccy') || 'local';
  const tiers = [['Wholesale / distributor', 'm_whole'], ['Semi-wholesale / regional', 'm_semi'], ['Retail / supermarkets', 'm_retail']]
    .map(t => ({ name: t[0], lo: num_(V[t[1] + '_low']), hi: num_(V[t[1] + '_high']), ai: isAi(t[1] + '_low') }))
    .filter(t => t.lo || t.hi);
  const usdMt = perKg => lfx ? perKg * 1000 / lfx : null;
  const whole = tiers[0] && tiers[0].name.indexOf('Wholesale') === 0 ? tiers[0] : null;
  let sellAi = false;
  if (!num_(V.b_sell) && whole && lfx) { V.b_sell = Math.round(usdMt(((whole.lo || whole.hi) + (whole.hi || whole.lo)) / 2) * 100) / 100; sellAi = whole.ai; }
  const B = computeBuyer_(c.fobUsd, mt, c.containers, V);
  const aiBuyer = !!B && (aiFilled.some(k => /^b_/.test(k)) || sellAi);

  const props = PropertiesService.getScriptProperties();
  const seq = Number(props.getProperty('costSeq_' + year) || 0) + 1;
  props.setProperty('costSeq_' + year, String(seq));
  const costNo = 'BV-IC-' + year + '-' + ('00' + seq).slice(-3);
  props.setProperty('costFob_' + p.ref, c.fobUsdPerMt.toFixed(2));

  // Decision
  const licences = COST_SETTINGS_DEFAULT.filter(d => /^Licence: /.test(d[0])).map(d => [d[0].replace(/^Licence: /, ''), String(setting_(S, d[0], 'Not entered'))]);
  const isRice = /rice/i.test(val('commodity')), isBasmati = /basmati/i.test(val('commodity')) && !/non.?basmati/i.test(val('commodity'));
  const notActive = licences.filter(l => !/^(active|not needed|n\/a|not applicable)/i.test(l[1]) && !(/RCAC/.test(l[0]) && !isRice)).map(l => l[0]);
  const buyerNeeds = [['Full company name and registered address', val('buyer_address') ? 'Received' : ''], ['Tax ID (TIN / VAT no.)', val('buyer_tin')],
    ['Signed proforma invoice and purchase order', ''], ['30% advance (SWIFT MT103) or confirmed sight L/C', ''], ['Import declaration / permit', val('import_permit')],
    ['Shipping line booking or freight nomination', val('shipping_line')],
    ['Consignee and notify party wording for the B/L', val('consignee') ? val('consignee') + (val('notify_party') ? ' / notify: ' + val('notify_party') : '') : ''],
    ['Clearing agent at destination', val('clearing_agent')]].concat(finalDest ? [['Final dry port / inland destination', finalDest]] : []);
  const cargoInr = c.lines[0].inr;
  const target = num_(p.price);
  // Price on the buyer's Incoterm (CFR / CIF) from our FOB plus freight and insurance
  const buyerTerm = (String(val('incoterm')).match(/^(FOB|CFR|C&F|CIF)/i) || ['FOB'])[0].toUpperCase().replace('C&F', 'CFR');
  const frUsd = (num_(V.b_freight) || 0) * c.containers, frLocal = (num_(V.b_local) || 0) * c.containers;
  const insUsd = buyerTerm === 'CIF' ? Math.round((c.fobUsd + frUsd) * (num_(V.b_ins_pct) || 0)) / 100 : 0;
  const termUsd = buyerTerm !== 'FOB' && frUsd ? Math.round((c.fobUsd + frUsd + frLocal + insUsd) * 100) / 100 : null;
  const termPerMt = termUsd ? Math.round(termUsd / mt * 100) / 100 : null;
  const marginAtTarget = target ? ((target * mt - (termUsd ? termUsd - c.fobUsd : 0)) * fx - c.cost) / cargoInr * 100 : null;
  const capacity = num_(V.mt_per_ctr) || 25;
  const fill = { pct: mt / (c.containers * capacity), mt: mt, containers: c.containers, capacity: capacity,
                 fullFobPerMt: computeCosting_(Object.assign({}, ccIn, { mt: c.containers * capacity })).fobUsdPerMt };
  const inspectionCosted = c.lines.some(l => /PVoC|CoC|inspection/i.test(l.item));
  const minMarginS = num_(setting_(S, 'Minimum margin for GO (%)', 8)), minBuyerS = num_(setting_(S, 'Minimum buyer return for GO (%)', 8));
  const sens = sensitivity_(ccIn, V, minMarginS, minBuyerS);
  const decision = decide_({
    marginPct: marginPct, minMargin: num_(setting_(S, 'Minimum margin for GO (%)', 8)), marginUsd: 'USD ' + c.marginUsd.toFixed(2),
    target: target, fobPerMt: c.fobUsdPerMt, marginAtTarget: marginAtTarget, payment: val('payment_option'), licencesPending: notActive,
    buyerRoi: B && B.sell ? B.roi : null, minBuyer: num_(setting_(S, 'Minimum buyer return for GO (%)', 8)), aiBuyer: aiBuyer,
    wholesaleUsdLow: whole && lfx ? usdMt(whole.lo || whole.hi) : null,
    millDefault: num_(V.mill_price) === num_(setting_(S, 'Default mill price (INR per 100 kg)', '')), millPrice: num_(V.mill_price),
    inspectionNeeded: !!val('dest_inspection'), inspectionCosted: inspectionCosted, inspection: val('dest_inspection'), inspectionAi: isAi('dest_inspection'),
    fobBenchmark: num_(V.fob_benchmark), benchAi: isAi('fob_benchmark'), logistics: logistics,
    quoteBasis: termPerMt ? buyerTerm + ' ' + (pod || 'destination') : buyerTerm === 'FOB' ? 'FOB' : buyerTerm, quotePerMt: termPerMt,
    freightAi: isAi('b_freight'), freightQuote: (inp.src || {}).b_freight === 'quote', fill: fill, millUsdPerMt: num_(V.mill_price) * 10 / fx,
    priceRoom: sens.buyerMax != null ? { minFob: sens.minFob, buyerMax: sens.buyerMax, minMargin: minMarginS, minBuyer: minBuyerS } : null,
    buyerPending: buyerNeeds.filter(b => !b[1]).length });

  const grp = n => Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const inr = n => (n < 0 ? '-' : '') + 'INR ' + grp(n);
  const usd = n => (n < 0 ? '-' : '') + 'USD ' + grp(n);
  const lc = n => lfx && val('local_ccy') ? val('local_ccy') + ' ' + Math.round(n * lfx).toLocaleString('en-US') : '';
  const loc = n => lc(n) ? '  (~' + lc(n) + ')' : '';
  const fmt = d => Utilities.formatDate(d, 'Asia/Kolkata', 'dd MMM yyyy');
  const GREEN = '#1B4D3E', GOLD = '#8A6508', GREY = '#5A6A72', CREAM = '#F8F5EC', RED = '#9B1C1C';
  const validDays = num_(V.validity_days) || 7;
  const NA = 'To confirm';
  const or = (k, d) => val(k) || d || NA;
  const commodityFull = [val('commodity'), val('variety')].filter(Boolean).join(', ');

  const doc = DocumentApp.create(costNo + ' INTERNAL ' + (val('buyer') || 'Buyer'));
  const body = doc.getBody();
  body.setMarginTop(36).setMarginBottom(36).setMarginLeft(42).setMarginRight(42);
  try {
    const logo = UrlFetchApp.fetch('https://www.bhumivarahiimpex.com/brand/email-logo.png').getBlob();
    const img = body.getParagraphs()[0].appendInlineImage(logo);
    const h = 40; img.setWidth(Math.round(img.getWidth() * h / img.getHeight())).setHeight(h);
  } catch (e) { body.getParagraphs()[0].appendText('BHUMI VARAHI IMPEX PVT LTD').setBold(true).setForegroundColor(GREEN).setFontSize(16); }
  const para = (t, o) => {
    const x = body.appendParagraph(t); const e = x.editAsText();
    e.setFontSize(o && o.size || 9.5).setBold(!!(o && o.bold)).setForegroundColor(o && o.color || '#1e293b');
    return x;
  };
  const sub = t => { const x = body.appendParagraph(t); x.editAsText().setFontSize(10).setBold(true).setForegroundColor(GOLD); x.setSpacingBefore(6); return x; };
  const table = (rows, opts) => {
    opts = opts || {};
    const t = body.appendTable(rows); t.setBorderColor('#D6DDE0');
    for (let i = 0; i < t.getNumRows(); i++) for (let j = 0; j < t.getRow(i).getNumCells(); j++) {
      const cell = t.getCell(i, j);
      cell.setPaddingTop(3).setPaddingBottom(3).setPaddingLeft(5).setPaddingRight(5);
      cell.editAsText().setFontSize(8.5).setBold(false).setForegroundColor('#1e293b');
      if (opts.widths && opts.widths[j]) cell.setWidth(opts.widths[j]);
      if (i === 0 && opts.head !== false) { cell.setBackgroundColor(GREEN); cell.editAsText().setBold(true).setForegroundColor('#FFFFFF'); }
    }
    (opts.bold || []).forEach(i => { for (let j = 0; j < t.getRow(i).getNumCells(); j++) { t.getCell(i, j).setBackgroundColor(CREAM); t.getCell(i, j).editAsText().setBold(true).setForegroundColor(GOLD); } });
    (opts.dark || []).forEach(i => { for (let j = 0; j < t.getRow(i).getNumCells(); j++) { t.getCell(i, j).setBackgroundColor(GREEN); t.getCell(i, j).editAsText().setBold(true).setForegroundColor('#FFFFFF'); } });
    (opts.colour || []).forEach(x => { const cl = t.getCell(x[0], x[1]); cl.setBackgroundColor(x[2]); cl.editAsText().setBold(true).setForegroundColor('#FFFFFF'); });
    return t;
  };
  const kv = rows => table(rows.filter(r => r[1] !== '' && r[1] != null), { head: false, widths: [150, 360] });
  let n = 0;
  const H = t => { const x = body.appendParagraph((++n) + '. ' + t.toUpperCase()); x.editAsText().setFontSize(11.5).setBold(true).setForegroundColor(GREEN); x.setSpacingBefore(12); return x; };
  const stColour = { GO: '#15803D', WATCH: '#B45309', STOP: RED };

  // ---------- Cover and decision ----------
  para('Bhumi Varahi Impex Pvt Ltd  |  ' + NOTIFY_EMAIL + '  |  +91 94929 92666', { size: 8, color: GREY });
  body.appendHorizontalRule();
  para('CONSIGNMENT DECISION DOSSIER & INTERNAL QUOTATION', { size: 16, bold: true, color: GREEN });
  para('CONFIDENTIAL. Single internal reference for deciding whether to take this consignment. Do not send to the buyer.', { size: 9, bold: true, color: RED });
  table([
    ['Dossier No.', costNo, 'Date of assessment', fmt(new Date())],
    ['Buyer RFQ No.', p.ref, 'Forex benchmark', '1 USD = INR ' + fx],
    ['Delivery term', 'FOB ' + pol + ' (Incoterms 2020)', 'Quote validity', validDays + ' calendar days'],
    ['Payment scope', or('payment_option'), 'Buyer asked for', val('incoterm') || '-'],
  ], { head: false, widths: [95, 160, 105, 150] });

  const vColour = decision.verdict === 'GO' ? '#15803D' : decision.verdict === 'NO-GO' ? RED : '#B45309';
  table([['DECISION: ' + decision.verdict]], { head: false, colour: [[0, 0, vColour]] }).getCell(0, 0).editAsText().setFontSize(14);
  table([
    ['FOB price to quote', usd(c.fobUsdPerMt) + ' / MT', 'Contract value', usd(c.fobUsd)],
  ].concat(termPerMt ? [[buyerTerm + ' ' + (pod || '') + ' (buyer\'s term)', usd(termPerMt) + ' / MT' + (isAi('b_freight') ? AI : ''), buyerTerm + ' contract value', usd(termUsd)]] : []).concat([
    ['Our net profit', inr(c.margin) + ' (' + usd(c.marginUsd) + ')', 'Margin / ROCE', marginPct + '% on cargo / ' + (c.margin / c.cost * 100).toFixed(2) + '% on capital'],
    ['Buyer landed cost', B ? usd(B.landedPerMt) + ' / MT' + (aiBuyer ? AI : '') : 'Not available', 'Buyer profit', B && B.sell ? usd(B.profit) + ' (' + B.roi + '%)' : 'Not available'],
  ]), { head: false, widths: [95, 160, 105, 150] });
  table([['Criterion', 'Status', 'Detail']].concat(decision.rows),
    { widths: [130, 60, 320], colour: decision.rows.map((r, i) => [i + 1, 1, stColour[r[1]]]) });
  para(decision.verdict === 'NO-GO' ? 'Do not commit funds or confirm the price until every STOP line is resolved.'
    : decision.verdict === 'GO' ? 'All checks pass. Proceed to proforma invoice after the sign-offs in the last section.'
    : 'Can proceed once the WATCH lines are confirmed. Record how each was cleared before sign-off.', { size: 9, bold: true, color: vColour });

  // ---------- 1. Executive summary ----------
  H('Executive summary & shipment architecture');
  kv([
    ['Buyer', [val('buyer'), val('contact') ? 'Attn: ' + val('contact') : ''].filter(Boolean).join(', ')],
    ['Buyer address', val('buyer_address')], ['Buyer tax ID', val('buyer_tin')],
    ['Commodity & variety', commodityFull + (val('crop_year') ? ' (crop ' + val('crop_year') + ')' : '')],
    ['HS code', val('hs_code')],
    ['Total volume', mt + ' MT (' + (mt * 10) + ' quintals)'],
    ['Packaging', c.bags + ' bags x ' + bagKg + ' kg' + (val('bag_type') ? ' ' + val('bag_type') : '') + (val('branding') ? ', ' + val('branding') : '')],
    ['Procurement origin', [val('mill_name'), val('mill_location')].filter(Boolean).join(', ')],
    ['Inland haulage', [val('lorry'), val('inland_km') ? 'about ' + val('inland_km') + ' km' : ''].filter(Boolean).join(', ')],
    ['Container equipment', c.containers + ' x ' + or('container_type', '20 ft FCL') + (val('stuffing') ? ', ' + val('stuffing') : '')],
    ['Customs house agent', val('cha')], ['CFS facility', val('cfs_facility')],
    ['Port of loading', pol], ['Shipping line', val('shipping_line')],
    ['Discharge / transit port', pod + (finalDest ? ' (transit)' : '')],
    ['Final destination', finalDest ? finalDest + ', ' + country + (val('corridor') ? ' via ' + val('corridor') : '') : country],
    ['Transit status', val('transit_regime')], ['Destination inspection', val('dest_inspection')],
    ['Shipment window', val('shipment_window')],
  ]);

  // ---------- 2. Buyer-view proforma ----------
  H('Commercial proforma quotation (buyer view)');
  const specs = ['Variety: ' + (val('variety') || val('commodity'))]
    .concat(val('q_milling') ? [val('q_milling')] : [])
    .concat([['Max broken', 'q_broken'], ['max moisture', 'q_moisture'], ['max foreign matter', 'q_fm_inorg']].filter(q => val(q[1])).length ? ['Specs: ' + [['max ' + val('q_broken') + ' brokens', 'q_broken'], ['max ' + val('q_moisture') + ' moisture', 'q_moisture'], ['max ' + val('q_fm_inorg') + ' foreign matter', 'q_fm_inorg']].filter(q => val(q[1])).map(q => q[0]).join(', ')] : [])
    .concat(['Packing: ' + c.bags + ' x ' + bagKg + ' kg ' + (val('bag_type') || 'bags'), 'Delivery: loaded on board at ' + pol])
    .concat(finalDest ? ['In transit to ' + finalDest + ', ' + country + ' via ' + pod] : ['Destination: ' + pod + ', ' + country]);
  table([
    ['Item description & specifications', 'Quantity', 'Unit rate (FOB)', 'Total (FOB)'],
    [commodityFull + (val('crop_year') ? ' (crop ' + val('crop_year') + ')' : '') + '\n- ' + specs.join('\n- '), mt + ' MT\n(' + c.bags + ' bags)',
     inr(c.fobPerMt) + ' / MT\n' + usd(c.fobUsdPerMt) + ' / MT', inr(c.fob) + '\n' + usd(c.fobUsd)],
    ['TOTAL FOB ' + pol.toUpperCase() + ' CONTRACT VALUE', '', '', usd(c.fobUsd)],
  ].concat(termPerMt ? [['Alternative on the buyer\'s term: ' + buyerTerm + ' ' + pod + ' (ocean freight ' + usd(frUsd / c.containers) + ' / container' + (isAi('b_freight') ? ', web estimate: confirm before quoting' : '') + ')', mt + ' MT', usd(termPerMt) + ' / MT', usd(termUsd)]] : []),
  { widths: [250, 70, 95, 95], dark: [2] });
  table([
    ['Commercial terms & scope', 'Turnaround & execution schedule'],
    ['- Incoterm: FOB ' + pol + ' (Incoterms 2020)\n- Included: milling, packing, inland freight, pre-FOB insurance, CFS rebagging & stuffing, fumigation, CHA clearance, phyto, COO' + (inspectionCosted ? ', ' + (val('dest_inspection') || 'destination inspection') : '') + ', bank e-BRC documentation\n- Currency benchmark: 1 USD = INR ' + fx + '\n- Quotation validity: ' + validDays + ' calendar days',
     '- Procurement & haulage: ' + or('t_procure', '2-3') + ' days from advance\n- CFS rebagging, sampling & stuffing: ' + or('t_cfs', '2') + ' days\n- CHA filing (LEO) & gate-in: ' + or('t_cha', '2') + ' days\n- Total cargo readiness: ' + or('t_ready', '7-10') + ' days, matched to the booking window'],
  ], { widths: [255, 255] });

  // ---------- 3. Cost accounting ----------
  H('Master cost accounting & CHA breakdown');
  para('Cost build-up from ' + (val('mill_location') || 'the mill') + ' to ship\'s rail at ' + pol + ', with CHA services, CFS tariffs and pre-FOB provisions itemised.', { size: 9 });
  const rows = [['No', 'Cost component', 'Tariff base / service', 'Cost (INR)', 'Cost (USD)']]
    .concat(c.lines.map((l, i) => [String(i + 1), l.item, l.basis, inr(l.inr), usd(l.usd)]));
  rows.push(['', 'Net landed cost (break-even at ship\'s rail)', '', inr(c.cost), usd(c.costUsd)]);
  rows.push([String(c.lines.length + 1), 'Target exporter margin (' + marginPct + '% on cargo base)', 'INR ' + grp(c.marginPerMt) + ' / MT net return', inr(c.margin), usd(c.marginUsd)]);
  rows.push(['', 'FINAL FOB ' + pol.toUpperCase() + ' PRICE (to quote buyer)', '', inr(c.fob), usd(c.fobUsd)]);
  table(rows, { widths: [24, 150, 170, 85, 80], bold: [rows.length - 3], dark: [rows.length - 1] });
  sub('Partner tariff schedule (' + (val('cha') || 'CHA / CFS') + ')');
  table([['Tariff / activity', 'Rate', 'Status & scope']].concat(inp.lines.map(x => [x.item, x.rate == null ? 'Rate not entered' : 'INR ' + grp(x.rate) + ' / ' + x.per + (x.gst ? ' + GST' : ''), (x.include ? 'Included. ' : 'Optional, not in this costing. ') + x.basis])),
    { widths: [170, 120, 220] });
  para('Statutory GST of ' + (num_(V.gst_pct) || 18) + '% applies to taxable CFS / CHA services and is claimable as export input credit. CTO / SRF and demurrage are charged at actuals when they occur.', { size: 8.5, color: GREY });
  sub('Logistics quote comparison');
  para('Logistics rates change with the destination, carrier and season. Each rate used here is set against the written quotes in the input tab (columns H and I) and Gemini\'s web estimate (column J). Web estimates are a guide only; book on written quotes.', { size: 8.5, color: GREY });
  const qv = (q, cur) => q ? (q.vendor ? q.vendor + ': ' : '') + cur + ' ' + grp(q.amt) + (q.date ? '\n(' + q.date + ')' : '') : '-';
  const qTable = (list, cur) => table([['Cost item', 'Used in costing', 'Quote A', 'Quote B', 'Web estimate', 'Check']].concat(list.map(x => [
    x.label + ' (' + x.unit.replace(/^\w+ \/ /, 'per ') + ')', x.used == null ? '-' : cur + ' ' + grp(x.used) + (x.src === 'quote' ? ' (lowest quote)' : x.src === 'AI' ? AI : ''),
    qv(x.quotes[0], cur), qv(x.quotes[1], cur), x.web == null ? '-' : cur + ' ' + grp(x.web), x.note])), { widths: [125, 80, 80, 80, 70, 75] });
  para('Origin (India side, INR)', { size: 9, bold: true });
  qTable(originQ, 'INR');
  if (destQ.length) { para('Destination side (USD per 20 ft container)', { size: 9, bold: true }); qTable(destQ, 'USD'); }

  // ---------- 4. Market intelligence ----------
  H('Destination market intelligence & pricing: ' + [country, finalDest].filter(Boolean).join(', '));
  if (tiers.length) {
    table([['Market level', 'Price per kg (' + ccy + ')', 'Price per ' + bagKg + ' kg bag', 'Price per MT (USD)']].concat(tiers.map(t => {
      const r = (a, b, f) => [a, b].filter(x => x).map(f).join(' - ');
      return [t.name + (t.ai ? AI : ''), r(t.lo, t.hi, x => ccy + ' ' + Math.round(x).toLocaleString('en-US')), r(t.lo, t.hi, x => ccy + ' ' + Math.round(x * bagKg).toLocaleString('en-US')),
              lfx ? r(t.lo, t.hi, x => usd(usdMt(x))) : 'Enter local currency rate'];
    })), { widths: [140, 120, 120, 130] });
  } else para('No market prices entered. Fill section 7b of the input tab, or turn on Gemini research.', { size: 9, color: GREY });
  if (val('m_notes')) para(val('m_notes'), { size: 9 });
  kv([
    ['Exchange rate', lfx ? '1 USD = ' + lfx + ' ' + ccy + (isAi('local_fx') ? AI : '') : ''],
    ['HS classification', val('hs_code')],
    ['Import duty', val('b_duty_pct') ? val('b_duty_pct') + '% of CIF' + (val('b_duty_min') ? ' or USD ' + val('b_duty_min') + '/MT, whichever is higher' : '') + (isAi('b_duty_pct') ? AI : '') : ''],
    ['Other levies', val('b_levy_pct') ? val('b_levy_pct') + '% of CIF' + (isAi('b_levy_pct') ? AI : '') : ''],
    ['Import VAT', val('b_vat_pct') ? val('b_vat_pct') + '%' + (isAi('b_vat_pct') ? AI : '') : ''],
    ['Quality benchmark', val('q_dest_std') ? val('q_dest_std') + (isAi('q_dest_std') ? AI : '') : ''],
  ]);

  // ---------- 5. Profit economics ----------
  H('Consignment profit economics & landed cost analysis');
  sub('Part A: Exporter net return (Bhumi Varahi Impex)');
  table([
    ['Financial metric', 'Amount (INR)', 'Amount (USD)'],
    ['Gross export FOB revenue (' + mt + ' MT @ ' + usd(c.fobUsdPerMt) + ' / MT)', inr(c.fob), usd(c.fobUsd)],
    ['Less: total net operational cost', inr(-c.cost), usd(-c.costUsd)],
    ['NET REALISED EXPORTER PROFIT', inr(c.margin), usd(c.marginUsd)],
    ['Net margin on base procurement', marginPct + '% (' + inr(c.marginPerMt) + ' / MT)', usd(c.marginUsd / mt) + ' / MT'],
    ['Return on capital employed per consignment', (c.margin / c.cost * 100).toFixed(2) + '% over a ' + or('t_ready', '7-10') + ' day cycle', ''],
  ].concat(target ? [['At the buyer\'s target of USD ' + target + ' / MT', inr(target * mt * fx - c.cost) + ' profit', marginAtTarget.toFixed(2) + '% on cargo']] : []),
  { widths: [250, 130, 130], bold: [3] });
  if (B) {
    sub('Part B: Importer / buyer landed cost & profitability' + (aiBuyer ? ' (includes AI estimates)' : ''));
    const keyOf = { 'Ocean freight': 'b_freight', 'Carrier local': 'b_local', 'Port / transit': 'b_port', 'Lo-Lo': 'b_lolo', 'Overland': 'b_inland', 'Transit bond': 'b_bond', 'Import duty': 'b_duty_pct', 'Other import levies': 'b_levy_pct', 'Import clearing': 'b_clear', 'Import VAT': 'b_vat_pct', 'Marine insurance': 'b_ins_pct' };
    const tag = lbl => Object.keys(keyOf).some(k => lbl.indexOf(k) === 0 && isAi(keyOf[k])) ? AI : '';
    const br = [['Cost & realisation component', 'Per MT (USD)', 'Total (USD)']].concat(B.rows.map(r => [r.label + tag(r.label), usd(r.perMt), usd(r.total) + (r.kind === 'total' ? loc(r.total) : '')]));
    const subs = [], tot = [];
    B.rows.forEach((r, i) => { if (r.kind === 'sub') subs.push(i + 1); if (r.kind === 'total') tot.push(i + 1); });
    if (B.sell) {
      br.push(['Projected importer sales realisation (at ' + usd(B.sellPerMt) + ' / MT)' + (sellAi || isAi('m_whole_low') && !num_(inp.v.b_sell) ? AI : ''), usd(B.sellPerMt), usd(B.sell) + loc(B.sell)]);
      br.push(['PROJECTED IMPORTER NET PROFIT (' + B.roi + '% ROI)', (B.profit >= 0 ? '+' : '') + usd(B.profitPerMt), (B.profit >= 0 ? '+' : '') + usd(B.profit) + loc(B.profit)]);
    }
    table(br, { widths: [270, 110, 130], bold: subs.concat(B.sell ? [br.length - 1] : []), dark: tot });
    sub('Part C: Two-party consignment profit summary');
    table([
      ['Stakeholder', 'Financial outlay', 'Realised revenue', 'Net profit & yield'],
      ['Seller / exporter\n(Bhumi Varahi Impex)', inr(c.cost) + '\n(' + usd(c.costUsd) + ')', inr(c.fob) + '\n(' + usd(c.fobUsd) + ' FOB)', '+' + inr(c.margin) + ' (' + usd(c.marginUsd) + ')\n' + marginPct + '% cargo margin (' + (c.margin / c.cost * 100).toFixed(2) + '% ROCE)'],
      ['Buyer / importer\n(' + (val('buyer') || country) + ')', usd(B.landed) + (lc(B.landed) ? '\n(~' + lc(B.landed) + ')' : ''), B.sell ? usd(B.sell) + (lc(B.sell) ? '\n(~' + lc(B.sell) + ')' : '') : 'Selling price not entered', B.sell ? (B.profit >= 0 ? '+' : '') + usd(B.profit) + (lc(B.profit) ? '\n' + lc(B.profit) : '') + '\n(' + B.roi + '% ROI)' : '-'],
    ], { widths: [120, 130, 130, 130] });
    if (B.sell) para('COMMERCIAL TAKEAWAY: ' + (B.profit > 0
      ? 'After ocean freight, ' + (finalDest ? 'overland transit, ' : '') + 'duties and local charges, the buyer nets about ' + usd(B.profit / c.containers) + ' per container (' + B.roi + '% on landed cost). Our FOB offer of ' + usd(c.fobUsdPerMt) + ' / MT leaves the buyer a ' + (B.roi >= 15 ? 'strong' : B.roi >= 8 ? 'workable' : 'thin') + ' margin.'
      : 'At these figures the buyer loses ' + usd(-B.profit) + ' on the consignment. Expect strong price pressure or a cancelled order.'), { size: 9, bold: true, color: GOLD });
  } else para('Part B (buyer landed cost) skipped: no ocean freight entered and no AI figure available. Fill section 7 of the input tab.', { size: 9, color: GREY });

  sub('What-if sensitivity');
  para('How the numbers move if a cost changes after we quote. "Margin if price held" is our margin when the FOB already quoted to the buyer cannot be changed.', { size: 8.5, color: GREY });
  table([['Scenario', 'Our FOB (re-priced) / MT', 'Our margin if price held', 'Buyer landed / MT', 'Buyer return']].concat(sens.rows.map(r => [r.name, usd(r.fobPerMt),
    r.heldMarginPct.toFixed(2) + '%', r.buyerLandedPerMt == null ? '-' : usd(r.buyerLandedPerMt), r.buyerRoi == null ? '-' : r.buyerRoi.toFixed(2) + '%'])),
    { widths: [150, 95, 90, 95, 80], bold: [1] });
  kv([['Our break-even FOB (zero margin)', usd(sens.breakEven) + ' / MT'], ['Our lowest FOB for a GO margin (' + minMarginS + '%)', usd(sens.minFob) + ' / MT'],
    ['Highest FOB the buyer can pay and keep ' + minBuyerS + '%', sens.buyerMax == null ? 'Needs the buyer selling price or market prices' : sens.buyerMax <= 0 ? 'None: even at FOB USD 0 the buyer cannot make ' + minBuyerS + '%' : usd(sens.buyerMax) + ' / MT'],
    ['Negotiation range', sens.buyerMax == null ? '-' : sens.buyerMax >= sens.minFob ? usd(sens.minFob) + ' to ' + usd(sens.buyerMax) + ' / MT' : 'None at these figures']]);

  // ---------- 6. Payment ----------
  H('Non-negotiable payment terms & zero-credit policy');
  para('NO CREDIT UNDER ANY CIRCUMSTANCES. Bhumi Varahi Impex works on a 100% secured cash / L/C basis. Open account, documents against acceptance, post-dated cheques and deferred credit are not allowed. Cargo does not leave the mill without advance clearance, and original Bills of Lading or telex release are not given until 100% of contract funds are in our bank.', { size: 9, bold: true, color: RED });
  table([
    ['Approved structure', 'How it works', 'Release condition'],
    ['Option A (preferred): 30% advance + 70% against BL copy', '30% T/T on signing the proforma invoice; triggers mill procurement and haulage. 70% T/T within ' + or('balance_days', 3) + ' business days of the non-negotiable BL scan, phyto' + (val('dest_inspection') ? ' and ' + val('dest_inspection') : '') + '.', 'Original BL, phyto and certificates released or telex release only after 100% is credited.'],
    ['Option B: 100% irrevocable confirmed sight L/C', 'Sight L/C from a prime bank, confirmed by a first-class Indian bank. No usance (no 30/60/90 days). Advising, confirmation and amendment charges for the buyer.', 'Payment guaranteed by the confirming bank on compliant documents within L/C validity.'],
  ], { widths: [130, 230, 150] });
  para('Selected for this deal: ' + or('payment_option'), { size: 9, bold: true, color: GOLD });
  const bank = [['Account name', 'Bank: account name'], ['Bank', 'Bank: bank name'], ['Branch', 'Bank: branch'], ['Account number', 'Bank: account number'],
    ['AD code', 'Bank: AD code'], ['IFSC', 'Bank: IFSC'], ['SWIFT / BIC', 'Bank: SWIFT / BIC'], ['Remittance purpose code', 'Bank: remittance purpose code']]
    .map(b => [b[0], String(setting_(S, b[1], ''))]);
  sub('Exporter banking details');
  if (bank.some(b => b[1] && b[0] !== 'Account name' && b[0] !== 'Remittance purpose code')) kv(bank);
  else para('Not filled yet. Add the "Bank:" rows in ' + COST_SETTINGS_TAB + ' to print them here.', { size: 8.5, color: GREY });
  sub('Protective contract clauses');
  kv([
    [or('balance_days', 3) + '-day payment & demurrage', 'Balance due within ' + or('balance_days', 3) + ' business days of the BL scan. Port demurrage at ' + (pod || 'destination') + ' caused by late payment is for the buyer\'s account.'],
    ['Heavy-duty payload & OWS', val('payload') ? 'Carrier booking must specify ' + val('payload') + '. Any overweight surcharge is for the buyer\'s account.' : ''],
    ['Weight finality & moisture', val('moisture_tol') ? 'Port of loading VGM weight is final. Natural transit moisture variation of ' + val('moisture_tol') + ' is accepted.' : ''],
    ['Forex protection', val('forex_recal') ? 'Pegged at INR ' + fx + ' / USD. If the INR strengthens by more than ' + val('forex_recal') + '% before the advance arrives, the USD price is recalculated.' : ''],
    ['CFS free time', val('free_days') ? val('free_days') + ' days free at CFS; then ' + or('demurrage') + '.' : ''],
    ['Quote validity', validDays + ' calendar days from issue.'],
  ]);

  // ---------- 7. Statutory register ----------
  H('Statutory pre-shipment permissions & port setup register');
  para('These registrations must be active before cargo leaves the mill or export declarations are filed. Status comes from ' + COST_SETTINGS_TAB + '.', { size: 9 });
  const part = (title, items) => { sub(title); table([['Check', 'Registration / document', 'Status / scope']].concat(items.map(x => ['[  ]', x[0], x[1]])), { widths: [40, 220, 250] }); };
  const st = name => (licences.filter(l => l[0].indexOf(name) === 0)[0] || ['', 'Not entered'])[1];
  part('Part A: Mandatory KYC & port registration', [
    ['PAN (company)', st('PAN')], ['Directors KYC (Aadhaar / DIN)', st('Directors KYC')], ['Import-Export Code (IEC, DGFT)', st('IEC')],
    ['GST registration + LUT for zero-rated export', st('GST')], ['Bank AD code letter', st('Bank AD')], ['AD code registered at ' + (pol || 'port') + ' customs', st('AD code registered')],
    ['ICEGATE EDI registration', st('ICEGATE')]]);
  part('Part B: Shipment permissions & certificates', [
    ['Commercial invoice (HS ' + (val('hs_code') || '-') + ', FOB value, bank AD details)', 'Prepare after contract'],
    ['Packing list (' + c.bags + ' x ' + bagKg + ' kg, net ' + grp(mt * 1000).replace(/\.00$/, '') + ' kg)', 'Prepare after stuffing'],
    ['Sales contract / purchase order (FOB, zero-credit, destination standards)', 'Pending signature'],
    ['FSSAI licence', st('FSSAI')], ['APEDA RCMC', st('APEDA RCMC')],
    ['APEDA RCAC (registration of this rice export contract)', isRice ? st('APEDA RCAC') : 'Not needed for this product'],
    ['Plant quarantine (PQIS) login for phyto', st('Plant quarantine')]]
    .concat(isBasmati ? [['Basmati DNA authenticity / quality test (APEDA-approved lab)', 'Book before shipment']] : []));

  // ---------- 8. Information matrix ----------
  H('Two-way information & requirement matrix');
  table([['What we need from the buyer', 'Status']].concat(buyerNeeds.map(b => [b[0], b[1] || 'Pending'])), { widths: [300, 210] });
  table([
    ['What the buyer needs from us', 'Issued by'],
    ['Commercial invoice and packing list (signed)', 'Bhumi Varahi Impex'], ['Certificate of Origin (non-preferential)', 'Chamber of Commerce'],
    ['Phytosanitary certificate', 'Plant Quarantine (PQIS)'], ['Fumigation certificate', 'Accredited fumigator'],
    ['Verified gross mass (VGM)', 'Terminal weighbridge / CHA'], ['Bill of Lading draft' + (finalDest ? ' with transit clause' : ''), 'Shipping line'],
  ].concat(val('dest_inspection') ? [[val('dest_inspection'), 'Inspection agency']] : []).concat([['Dispatch notice and courier tracking', 'Bhumi Varahi Impex']]), { widths: [300, 210] });

  // ---------- 9. Documents ----------
  H('Shipping documentation dispatch checklist');
  para('Once the vessel is loaded and the balance is received, this document set is compiled and dispatched:', { size: 9 });
  table([['Check', 'Document', 'Originals / copies', 'Issued by']].concat([
    ['Bill of Lading' + (finalDest ? ', with transit clause to ' + finalDest : ''), '3 originals + 3 copies', 'Shipping line'], ['Commercial invoice', '1 original + 3 copies', 'Bhumi Varahi Impex'],
    ['Packing list', '1 original + 3 copies', 'Bhumi Varahi Impex'], ['Certificate of Origin', '1 original + 1 copy', 'Chamber of Commerce'],
    ['Phytosanitary certificate', '1 original + 2 copies', 'Plant Quarantine (PQIS)'], ['Fumigation certificate', '1 original + 1 copy', 'Accredited fumigator'],
    ['VGM certificate', '1 electronic / print', 'Terminal weighbridge / CHA'],
  ].concat(val('dest_inspection') || inspectionCosted ? [[val('dest_inspection') || 'Certificate of Conformity (PVoC)', '1 original + 1 copy', 'SGS / Cotecna / BV']] : [])
   .map(x => ['[  ]'].concat(x))), { widths: [40, 170, 140, 160] });

  // ---------- 10. Technical specs ----------
  H('Technical specifications & quality parameters');
  const qp = [['Moisture', 'q_moisture', 'dq_moisture'], ['Broken grains', 'q_broken', 'dq_broken'], ['Foreign matter (inorganic)', 'q_fm_inorg', 'dq_fm_inorg'],
    ['Foreign matter (organic)', 'q_fm_org', 'dq_fm_org'], ['Damaged / discoloured / chalky', 'q_damaged', 'dq_damaged'], ['Milling degree & polish', 'q_milling', ''],
    ['Aflatoxin', 'q_aflatoxin', 'dq_aflatoxin'], ['Heavy metals (Pb / Cd)', 'q_heavy', 'dq_heavy'], ['Other', 'q_other', '']]
    .filter(q => val(q[1]) || (q[2] && val(q[2]))).map(q => [q[0], val(q[1]) || '-', q[2] ? (val(q[2]) ? val(q[2]) + (isAi(q[2]) ? AI : '') : '-') : '']);
  table([['Quality parameter', 'Bhumi Varahi export standard', (val('q_dest_std') || 'Destination standard') + (isAi('q_dest_std') ? AI : '')]].concat(qp), { widths: [150, 180, 180] });
  sub('Bagging & containerisation standards');
  ['Bag construction: ' + (val('bag_type') || 'export-grade bags') + ', ' + bagKg + ' kg net, machine-stitched with double-fold seam.',
   'Desiccant: absorb gel / dry bags hung along the container top to prevent condensation.',
   'Protective barrier: kraft paper floor and side lining, topped with water-resistant tarpaulin inside the container.',
   'Fumigation seal: container fumigated under gas-tight seal before terminal transfer.']
    .forEach(t => { const li = body.appendListItem(t); li.setGlyphType(DocumentApp.GlyphType.BULLET); li.editAsText().setFontSize(9).setBold(false).setForegroundColor('#1e293b'); });

  // ---------- 11. Compliance framework ----------
  H('Statutory compliance framework');
  sub('Part A: Government of India export compliance (origin CHA formalities)');
  table([['Instrument', 'Authority', 'Function'],
    ['IEC & APEDA registration', 'DGFT / APEDA', 'Exporter registration' + (/rice/i.test(val('commodity')) ? ' and rice export allocation' : '')],
    ['ICEGATE shipping bill & LEO', 'Indian Customs, ' + (pol || 'port of loading'), 'Electronic export declaration, assessment, examination and Let Export Order via CHA'],
    ['Phytosanitary certificate', 'Plant Quarantine (PQIS)', 'Confirms the cargo is free of quarantine pests'],
    ['Fumigation certificate', 'Accredited fumigator', 'Dosage, exposure period and degassing before gate-in'],
    ['Certificate of Origin', 'Chamber of Commerce / DGFT', 'Confirms Indian origin']]
    .concat(isRice ? [['APEDA RCAC', 'APEDA', 'Rice export contract registered before the shipping bill is filed']] : [])
    .concat(isBasmati ? [['Basmati DNA / quality test', 'APEDA-approved laboratory', 'Confirms genuine basmati variety before export']] : []), { widths: [150, 150, 210] });
  sub('Part B: Destination' + (finalDest ? ' and transit' : '') + ' requirements');
  table([['Requirement', 'Agency', 'What it involves']]
    .concat(val('dest_inspection') ? [[val('dest_inspection'), 'Destination standards body / appointed agency', 'Pre-export verification against ' + (val('q_dest_std') || 'the destination standard') + '; lab tests for moisture, heavy metals and aflatoxin']] : [])
    .concat(val('import_permit') || country ? [['Import declaration / permit', country + ' customs / regulator', val('import_permit') || 'Buyer files before shipment']] : [])
    .concat(finalDest ? [['Transit clause on B/L', pod.split(',').slice(-1)[0].trim() + ' customs', 'B/L must state "Cargo in transit to ' + finalDest + ', ' + country + ' on account and risk of consignee" so no transit-country import tax applies'],
                         ['Bonded overland transit', val('transit_regime') || 'Regional customs transit', 'Transit bond and cargo tracking seals from ' + pod + ' to ' + finalDest]] : []),
    { widths: [150, 150, 210] });

  // ---------- 12. Incoterms matrix ----------
  const term = buyerTerm;
  H('Incoterms 2020 allocation matrix: ' + term + ' ' + (term === 'FOB' ? pol : pod));
  const ours = 'INCLUDED', theirs = 'BUYER\'S ACCOUNT';
  table([['Cost / milestone', 'Bhumi Varahi', 'Buyer']].concat([
    ['Procurement, packaging and rebagging', 1], ['Inland transport, mill to CFS', 1], ['CFS stuffing, desiccant, fumigation', 1],
    ['CHA clearance, ICEGATE filing and LEO', 1], ['Phyto, COO' + (val('dest_inspection') ? ', ' + val('dest_inspection') : ''), 1], ['Origin THC and loading over ship\'s rail', 1],
    ['Ocean freight to ' + (pod || 'destination port'), term !== 'FOB'], ['B/L charges, ISPS and seal', term !== 'FOB'],
    ['Marine insurance' + (finalDest ? ' to ' + finalDest : ''), term === 'CIF'],
    ['Discharge, ' + (finalDest ? 'transit clearance and overland trucking to ' + finalDest : 'import clearance and delivery'), false],
    ['Import duty and taxes at destination', false]].map(r => [r[0], r[1] ? ours : '-', r[1] ? '-' : theirs])), { widths: [300, 105, 105] });

  // ---------- 13. Roadmap ----------
  H('Step-by-step consignment execution roadmap');
  table([['Stage / timeline', 'Phase', 'Action steps & deliverables']].concat([
    ['Stage 1 (Day 1)', 'Contract & advance', '1. Issue proforma invoice with weight and overweight clauses.\n2. Buyer sends 30% advance or opens confirmed sight L/C.\n3. Treasury confirms funds; issue procurement release.'],
    ['Stage 2 (Days ' + or('t_procure', '2-3') + ')', 'Procurement & haulage', '1. Bind pre-FOB inland insurance.\n2. Inspector checks moisture' + (val('q_moisture') ? ' (< ' + val('q_moisture') + ')' : '') + ' and quality at ' + (val('mill_location') || 'the mill') + '.\n3. Order ' + c.bags + ' bags; dispatch to ' + (val('cfs_facility') || 'the CFS') + '.\n4. Dispatch at least 5-6 days before port cut-off.'],
    ['Stage 3 (' + or('t_cfs', '2') + ' days)', 'CFS receiving & stuffing', '1. Unload and verify quality and weight.\n2. Rebag and double-stitch.\n3. Line the container, add desiccant.' + (val('dest_inspection') ? '\n4. Agency draws samples for ' + val('dest_inspection') + '.' : '') + '\n5. Stuff and fumigate under gas seal.'],
    ['Stage 4 (' + or('t_cha', '2') + ' days)', 'CHA customs clearance', '1. CHA files the shipping bill on ICEGATE.\n2. Customs inspection; LEO granted.\n3. Phyto and COO issued.\n4. VGM weighment.'],
    ['Stage 5 (ready in ' + or('t_ready', '7-10') + ' days)', 'Terminal drayage & loading', '1. Move container to ' + pol + '.\n2. Settle THC.\n3. Load on the nominated vessel.\n4. Risk passes to the buyer under FOB.'],
    ['Stage 6 (post-loading)', 'Document release & settlement', '1. Carrier issues on-board B/L' + (finalDest ? ' with transit clause' : '') + '.\n2. Send document scans.\n3. Buyer pays balance within ' + or('balance_days', 3) + ' business days.\n4. Release originals or telex release.\n5. Close EDPMS and generate e-BRC.'],
    ['Stage 7 (destination)', 'Buyer scope', '1. Vessel arrives at ' + pod + (val('t_sea') ? ' (about ' + val('t_sea') + ' days)' : '') + '.' + (finalDest ? '\n2. Buyer\'s agent files transit bond' + (val('transit_regime') ? ' (' + val('transit_regime') + ')' : '') + '.\n3. Overland to ' + finalDest + (val('corridor') ? ' via ' + val('corridor') : '') + (val('t_inland') ? ' (about ' + val('t_inland') + ' days)' : '') + '.\n4. Import clearance at ' + finalDest + '.' : '\n2. Import clearance and delivery.')],
  ]), { widths: [95, 115, 300] });
  para('TRANSFER OF RISK: under FOB, risk passes to the buyer once the container is loaded on board at ' + pol + '. Pre-FOB inland transit is covered by our insurance. The buyer must insure the ocean ' + (finalDest ? 'and overland ' : '') + 'leg' + (finalDest ? 's to ' + finalDest : '') + '.', { size: 9, bold: true, color: GOLD });

  // ---------- 14. Audit checklist ----------
  H('Mandatory pre-issuance & execution audit checklist');
  para('Each checkpoint is signed off by its desk before the proforma is released and procurement funds are committed.', { size: 9 });
  table([['Check', 'Audit item', 'Verification', 'Desk']].concat([
    ['Mill quality & moisture', 'Lot meets ' + [val('q_moisture') ? 'moisture < ' + val('q_moisture') : '', val('q_broken') ? 'broken < ' + val('q_broken') : ''].filter(Boolean).join(', ') + ' and sortex purity', 'Procurement'],
    ['Pre-FOB inland insurance', 'Policy bound from mill gate to CFS', 'Finance'],
    ['Bag strength', c.bags + ' bags undamaged, export weave, double-stitched', 'Packaging'],
    ['Lorry freight & lead time', 'Rate fixed; dispatch 5-6 days before cut-off', 'Logistics'],
    ['Heavy container & OWS', 'Booking specifies ' + or('payload', 'heavy-tested box') + '; buyer bears overweight surcharge', 'CHA desk'],
    ['CHA desk', 'Shipping bill, EDI and examination arranged; CTO / SRF pass-through checked', 'CHA desk'],
    ['CFS stuffing & free time', 'Empty box from CHA yard; ' + or('free_days', '14') + '-day free time monitored', 'CHA desk'],
    ['Desiccant', 'Absorb gel hung in container', 'Operations'],
    ['Fumigation', 'Dosage booked to destination biosecurity norms', 'CHA desk'],
    ['Destination testing lead time', val('dest_inspection') ? val('dest_inspection') + ' sampler scheduled (48-72 h lab time)' : 'Not required / confirm', 'Quality'],
    ['Weight tolerance & finality', 'Contract has VGM finality and ' + or('moisture_tol', 'moisture') + ' tolerance', 'Commercial'],
    ['Transit B/L clause', finalDest ? 'Liner instructed: in transit to ' + finalDest : 'Not a transit shipment', 'Documentation'],
    ['Payment terms', 'Buyer accepted ' + or('payment_option'), 'Finance'],
    ['Bank e-BRC / EDPMS closure', 'Bank handling and courier reserve budgeted', 'Treasury'],
  ].map(x => ['[  ]'].concat(x))), { widths: [40, 140, 240, 90] });

  // ---------- 15. AI research ----------
  if (research) {
    H('Destination research (AI draft: verify before use)');
    if (research.error) {
      para('Research could not be completed: ' + research.error, { size: 9, color: RED });
    } else {
      para('Prepared by Gemini with Google Search on ' + fmt(new Date()) + '. Figures marked "(AI est.)" elsewhere in this dossier come from here. Check duties, rules and prices with the official source or your CHA, and type confirmed figures into the input tab.', { size: 8.5, color: GOLD, bold: true });
      researchToDoc_(body, research.text, GREEN);
      if (research.sources.length) {
        para('Sources', { size: 9, bold: true, color: GREY });
        research.sources.forEach((src, i) => {
          const x = para((i + 1) + '. ' + src.title, { size: 8, color: '#1d4ed8' });
          try { x.editAsText().setLinkUrl(src.uri); } catch (e) {}
        });
      }
      if (research.queries.length) para('Searches run: ' + research.queries.join(' | '), { size: 7.5, color: GREY });
    }
  }

  // ---------- 16. Approvals ----------
  H('Internal operational approvals & clearance to issue');
  para('Decision recorded: ' + decision.verdict + '. Sign only when every STOP is resolved and each WATCH is cleared.', { size: 9, bold: true, color: vColour });
  const sig = (role, k) => role + '\n' + (val(k) || '') + '\n\nSignature: ____________\nDate: ____ / ____ / ' + year;
  table([
    ['Costing & pricing verified', 'Logistics & CHA clearances', 'Final commercial sign-off'],
    [sig('Commercial & procurement lead', 'appr_costing'), sig('Logistics & compliance lead', 'appr_logistics'), sig('Director / Managing Partner', 'appr_director')],
  ], { widths: [170, 170, 170] });
  doc.saveAndClose();

  const it = DriveApp.getFoldersByName(COSTING_FOLDER);
  const folder = it.hasNext() ? it.next() : DriveApp.createFolder(COSTING_FOLDER);
  const docFile = DriveApp.getFileById(doc.getId());
  docFile.moveTo(folder);
  const pdf = folder.createFile(docFile.getAs(MimeType.PDF).setName(costNo + ' INTERNAL.pdf'));

  logQuotes_(p.ref, costNo, [pol, pod, finalDest].filter(Boolean).join(' -> ') + (country ? ', ' + country : ''), allQ);

  const note = sheet.getRange(row, 11);
  const stamp = costNo + ' ' + decision.verdict + ': FOB ' + usd(c.fobUsdPerMt) + '/MT, margin ' + marginPct + '% (internal)';
  note.setValue(note.getValue() ? note.getValue() + ' · ' + stamp : stamp);
  return {
    costNo: costNo, pdfUrl: pdf.getUrl(), calc: c, buyer: B, decision: decision, aiFilled: aiFilled, quotes: allQ,
    web: research && !research.error ? { fields: Object.assign(webFields_(fig, !!finalDest), webField), lines: webLine } : null,
    message: costNo + ' created (internal, not sent to anyone).\n\nDECISION: ' + decision.verdict +
      decision.rows.filter(r => r[1] !== 'GO').map(r => '\n- ' + r[1] + ': ' + r[0] + '. ' + r[2]).join('') +
      '\n\nFOB price to quote: ' + usd(c.fobUsdPerMt) + ' / MT  (' + usd(c.fobUsd) + ' total)\nOur net profit: ' + usd(c.marginUsd) +
      (B ? '\nBuyer landed cost: ' + usd(B.landedPerMt) + ' / MT' + (B.sell ? ', buyer profit ' + usd(B.profitPerMt) + ' / MT (' + B.roi + '%)' : '') + (aiBuyer ? ' (uses AI estimates)' : '') : '') +
      (research ? (research.error ? '\n\nGemini research failed: ' + research.error : '\n\nGemini research added (' + research.sources.length + ' sources' + (aiFilled.length ? '; filled ' + aiFilled.length + ' empty inputs' : '') + ').') : '') +
      '\n\nPDF: ' + pdf.getUrl() + '\nEditable copy: ' + docFile.getUrl()
  };
}

// ===== LOGISTICS QUOTE REQUESTS (Gmail drafts, never sent automatically) =====
function vendorSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(VENDOR_TAB);
  if (!sh) {
    sh = ss.insertSheet(VENDOR_TAB);
    sh.getRange(1, 1, 1, 6).setValues([['Vendor', 'Type (Forwarder / Shipping line / CHA / CFS / Transporter / Clearing agent)', 'Email', 'Contact name', 'Ports / routes covered (blank = all; e.g. Visakhapatnam; Dar es Salaam)', 'Active (Y/N)']])
      .setFontWeight('bold').setBackground('#1B4D3E').setFontColor('#FFFFFF');
    sh.setColumnWidths(1, 6, 200); sh.setFrozenRows(1);
  }
  return sh;
}

function vendorKind_(t) {
  t = String(t || '').toLowerCase();
  if (/clearing|destination|import agent/.test(t)) return 'agent';
  if (/forward|shipping|line|nvocc|carrier/.test(t)) return 'forwarder';
  if (/transport|truck|haul|lorry/.test(t)) return 'transporter';
  if (/\bcha\b|cfs|custom/.test(t)) return 'cha';
  return '';
}

// Which vendors cover this deal, and what each should quote. Pure.
// d: { ref, commodity, variety, qty, containers, bags, bagKg, pol, pod, finalDest, country, millLocation, window, incoterm, payload, lines }
function quoteRequests_(vendors, d) {
  const out = [];
  const near = (cov, places) => {
    const toks = String(cov || '').toLowerCase().split(/[;,\n\/]+/).map(x => x.trim()).filter(x => x.length > 2);
    if (!toks.length) return true;
    const ps = places.filter(Boolean).map(x => String(x).toLowerCase());
    return toks.some(t => ps.some(p => p.indexOf(t) >= 0 || t.indexOf(p) >= 0));
  };
  const transit = !!d.finalDest;
  const origin = (d.lines || []).filter(l => l.include && !/jute|insurance|bank|inspection|pvoc|haulage/i.test(l.item));
  vendors.forEach(v => {
    const kind = vendorKind_(v.type);
    if (!kind || !/@/.test(v.email) || /^n/i.test(String(v.active))) return;
    const places = kind === 'cha' || kind === 'transporter' ? [d.pol] : kind === 'agent' ? [d.pod, d.finalDest, d.country] : [d.pol, d.pod, d.finalDest];
    if (!near(v.cover, places)) return;
    const items = kind === 'forwarder' ? [
        'Ocean freight ' + d.pol + ' to ' + d.pod + ' (USD per 20 ft)', 'Carrier local charges: B/L, seal, ISPS (USD per 20 ft)', 'Origin THC at ' + d.pol + ' (INR per 20 ft)',
        'Sea transit time and free days at ' + d.pod, 'Next sailings and rate validity'].concat(transit ? ['Through rate to ' + d.finalDest + ', if you offer it (USD per 20 ft)'] : [])
      : kind === 'cha' ? origin.map(l => l.item + ' (INR per ' + l.per + ')')
      : kind === 'transporter' ? ['Road haulage ' + (d.millLocation || 'mill') + ' to CFS at ' + d.pol + ' (INR per container load)', 'Loading / unloading charges, if extra', 'Transit time']
      : ['Port / transit clearance at ' + d.pod + ' (USD per 20 ft)', 'Lo-Lo (lift on / lift off) at port, ICD or dry port (USD per 20 ft)']
          .concat(transit ? ['Overland trucking ' + d.pod + ' to ' + d.finalDest + ' (USD per 20 ft)', 'Transit bond and cargo tracking (USD per 20 ft)'] : [])
          .concat(['Import clearing and dry port handling at ' + (d.finalDest || d.pod) + ' (USD per 20 ft)', 'Current import duty, VAT and levies for HS ' + (d.hs || 'this product')]);
    const route = d.pol + ', India to ' + d.pod + (transit ? ', then overland to ' + d.finalDest + ', ' + d.country + ' (transit)' : d.country ? ', ' + d.country : '');
    const body = ['Dear ' + (v.contact || 'Sir / Madam') + ',', '',
      'Please send us your best rates for this export shipment (our ref ' + d.ref + '):', '',
      '- Cargo: ' + [d.commodity, d.variety].filter(Boolean).join(', ') + ', ' + d.qty + ' MT in ' + d.bags + ' x ' + d.bagKg + ' kg bags',
      '- Containers: ' + d.containers + ' x 20 ft' + (d.payload ? ', payload ' + d.payload : ''),
      '- Route: ' + route,
      d.window ? '- Shipment window: ' + d.window : '',
      d.incoterm ? '- Our sale term: ' + d.incoterm : '', '',
      'Please quote:'].filter((x, i, a) => x !== '' || a[i - 1] !== '')
      .concat(items.map((x, i) => (i + 1) + '. ' + x))
      .concat(['', 'Please mention how long the rates are valid, the free days, and anything charged at actuals. A reply as "item: amount" lines helps us compare quotes quickly.', '',
        'Regards,', 'Bhumi Varahi Impex Pvt Ltd', NOTIFY_EMAIL]).join('\n');
    out.push({ vendor: v.name, kind: kind, email: v.email, subject: 'Rate request ' + d.ref + ': ' + d.containers + ' x 20ft ' + (d.commodity || 'cargo') + ', ' + d.pol + ' to ' + (d.finalDest || d.pod), body: body });
  });
  return out;
}

function draftQuoteRequests() {
  const ui = SpreadsheetApp.getUi();
  const active = SpreadsheetApp.getActiveSheet();
  const rfqs = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  let row;
  if (active.getName().indexOf(IC_PREFIX) === 0) row = findRfqRow_(rfqs, active.getName().slice(IC_PREFIX.length));
  else if (active.getName() === SHEET_NAME) row = active.getActiveRange().getRow();
  if (!row || row < 2) { ui.alert('Click a cell in an RFQ row, or open its "IC ..." input tab, first.'); return; }
  const vs = vendorSheet_();
  const vendors = vs.getLastRow() < 2 ? [] : vs.getRange(2, 1, vs.getLastRow() - 1, 6).getValues().filter(r => r[0] || r[2])
    .map(r => ({ name: String(r[0]), type: String(r[1]), email: String(r[2]).trim(), contact: String(r[3]), cover: String(r[4]), active: String(r[5]) }));
  if (!vendors.length) { vs.activate(); ui.alert('Add your forwarders, CHAs, transporters and destination clearing agents to the "' + VENDOR_TAB + '" tab first, then run this again.'); return; }
  const cfg = setupCosting_();
  const p = rfqFromRow_(rfqs, row);
  const ic = icSheet_(p, cfg, true);
  const inp = readIc_(ic.sheet), V = inp.v;
  const s = k => (V[k] === '' || V[k] == null) ? '' : String(V[k]);
  const mt = num_(V.qty_mt) || quantityMt_(p.quantity) || 0, bagKg = num_(V.bag_kg) || 50;
  const reqs = quoteRequests_(vendors, { ref: p.ref, commodity: s('commodity'), variety: s('variety'), hs: s('hs_code'), qty: mt,
    containers: Math.max(1, Math.ceil(mt / (num_(V.mt_per_ctr) || 25) - 1e-9)), bags: Math.ceil(mt * 1000 / bagKg), bagKg: bagKg,
    pol: s('pol'), pod: s('pod'), finalDest: s('final_dest'), country: s('buyer_country'), millLocation: s('mill_location'),
    window: s('shipment_window'), incoterm: s('incoterm'), payload: s('payload'), lines: inp.lines });
  if (!reqs.length) { ui.alert('None of the active vendors in "' + VENDOR_TAB + '" cover ' + [s('pol'), s('pod'), s('final_dest')].filter(Boolean).join(' / ') + '. Check the Type, Email and Ports columns.'); return; }
  reqs.forEach(r => GmailApp.createDraft(r.email, r.subject, r.body, { name: 'Bhumi Varahi Impex', replyTo: NOTIFY_EMAIL }));
  const note = rfqs.getRange(row, 11);
  const stamp = 'Quote requests drafted ' + Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd MMM') + ': ' + reqs.map(r => r.vendor).join(', ');
  note.setValue(note.getValue() ? note.getValue() + ' · ' + stamp : stamp);
  ui.alert(reqs.length + ' Gmail draft(s) created. Nothing has been sent.\n\n' + reqs.map(r => '- ' + r.vendor + ' (' + r.email + ')').join('\n') +
    '\n\nOpen Gmail > Drafts, check each one and press Send. When the replies come in, type the amounts into columns H and I of "' + ic.sheet.getName() + '".');
}

// Appends every quote and web estimate of a costing run to the "Logistics Quote Log" tab,
// so rates can be compared across destinations and over time.
function logQuotes_(ref, costNo, route, items) {
  const rows = [], day = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd MMM yyyy');
  items.forEach(x => {
    x.quotes.forEach(q => rows.push([q.date || day, ref, costNo, route, x.label, x.unit, 'Written quote', q.vendor, q.amt, x.used == null ? '' : x.used]));
    if (x.web != null) rows.push([day, ref, costNo, route, x.label, x.unit, 'Web estimate (Gemini)', '', x.web, x.used == null ? '' : x.used]);
  });
  if (!rows.length) return;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(QUOTE_LOG_TAB);
  if (!sh) {
    sh = ss.insertSheet(QUOTE_LOG_TAB);
    sh.getRange(1, 1, 1, 10).setValues([['Date', 'RFQ No.', 'Costing No.', 'Route', 'Cost item', 'Unit', 'Source', 'Vendor', 'Amount', 'Rate used in costing']])
      .setFontWeight('bold').setBackground('#1B4D3E').setFontColor('#FFFFFF');
    sh.setFrozenRows(1);
  }
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, 10).setValues(rows);
}

// ===== GEMINI RESEARCH (for the internal costing) =====
// One-time: Bhumi Varahi -> Set Gemini API key. Get a key at https://aistudio.google.com/apikey
// (Search grounding needs billing turned on for that Google Cloud project; the first
// 5,000 grounded prompts a month are free, then about USD 14 per 1,000 searches.)
// The key is kept in Script Properties, never in the sheet.
function setGeminiKey() {
  const ui = SpreadsheetApp.getUi();
  const props = PropertiesService.getScriptProperties();
  const has = !!props.getProperty('GEMINI_API_KEY');
  const ans = ui.prompt('Gemini API key', (has ? 'A key is already saved. Paste a new one to replace it, or type DELETE to remove it.' : 'Paste your Gemini API key from aistudio.google.com/apikey.') +
    '\n\nIt is stored in this script\'s private properties, not in the sheet.', ui.ButtonSet.OK_CANCEL);
  if (ans.getSelectedButton() !== ui.Button.OK) return;
  const v = String(ans.getResponseText()).trim();
  if (v === 'DELETE') { props.deleteProperty('GEMINI_API_KEY'); ui.alert('Gemini key removed. Costings will skip the research section.'); return; }
  if (v.length < 20) { ui.alert('That does not look like an API key. Nothing was saved.'); return; }
  props.setProperty('GEMINI_API_KEY', v);
  ui.alert('Saved. The next internal costing will include destination research.');
}

function researchPrompt_(p, c, o) {
  const dest = destText_(p) || 'the buyer\'s country';
  return [
    'You are an export analyst for Bhumi Varahi Impex Pvt Ltd, an Indian agri-commodity exporter. Research this consignment using Google Search and current, official sources where possible.',
    '',
    'Consignment: ' + [p.commodity, p.grade].filter(Boolean).join(', ') + ', ' + o.mt + ' MT in ' + c.containers + ' x 20 ft container(s), packed ' + (p.packing || '50 kg bags') + '.',
    (c.fobUsdPerMt != null ? 'Our price: FOB ' + o.pol + ', India at USD ' + c.fobUsdPerMt.toFixed(2) + ' per MT.' : 'Our FOB price from ' + o.pol + ', India is not set yet.') + ' Buyer destination: ' + dest + '. Buyer asked for: ' + (p.incoterm || 'not stated') + ', payment ' + (p.payment || 'not stated') + '.',
    '',
    'Write these sections, each starting with a line "### <title>". Use short bullet lines starting with "- ". Give numbers with currency, units and the date or year of the figure.',
    '### India export rules',
    '- HS code for this product, and any current Indian export restrictions, duty, minimum export price, APEDA or other registration, and quality checks that apply now.',
    '### Destination import compliance',
    '- Import permit or registration, standards, pre-shipment inspection (e.g. PVoC/CoC), phytosanitary and fumigation rules, labelling and any transit country rules.',
    '### Duties and taxes at destination',
    '- Import duty rate on this HS code (and any regional bloc tariff), VAT and levies, with the basis (CIF or other).',
    '### Destination market prices',
    '- Current wholesale and retail price ranges in local currency and converted to USD per MT, with the exchange rate used.',
    '### Buyer landed cost and margin',
    '- Starting from our FOB price, estimate ocean freight per 20 ft container from ' + o.pol + ' to ' + (portName_(p) || 'the nearest main port') + ', insurance, destination port charges' + (p.final_dest ? ', transit clearance and overland trucking to ' + p.final_dest : ' and inland charges') + ', and duty, giving a landed cost per MT. Compare it with the wholesale price and give the buyer\'s estimated margin per MT and per container. Show the calculation.',
    '### India origin logistics',
    '- Typical current rates at ' + o.pol + ' for these origin cost items, in INR per the unit shown: ' + (o.lines || []).map(l => l.item + ' (per ' + l.per + ')').join('; ') + '.',
    '### Risks and notes',
    '- Anything that could stop or delay the shipment, or change the price (for example policy changes, seasonality, currency).',
    '',
    'If you cannot find a reliable figure, write "Not found, check with CHA / buyer" instead of guessing. Do not invent licences or certifications for Bhumi Varahi Impex. Keep the whole answer under 800 words.',
    '',
    'At the very end, add a fenced ```json block with your best current figures as plain numbers (null when not found), using exactly these keys:',
    '{"india_mill_price_inr_per_100kg_typical":null,"origin_costs_inr":[{"item":"<exact cost item name from the list>","rate":null}],"india_fob_usd_per_mt_typical":null,"marine_insurance_pct_of_cfr":null,"pre_shipment_inspection_required":null,"pre_shipment_inspection_name":null,"overland_corridor":null,"sea_transit_days":null,"overland_transit_days":null,"ocean_freight_usd_per_20ft":null,"carrier_local_usd_per_20ft":null,"dest_port_usd_per_20ft":null,"dest_lolo_usd_per_20ft":null,"inland_trucking_usd_per_20ft":null,"transit_bond_usd_per_20ft":null,"import_duty_pct":null,"other_levies_pct":null,"import_clearing_usd_per_20ft":null,"import_vat_pct":null,"local_currency":null,"local_per_usd":null,"wholesale_local_per_kg_low":null,"wholesale_local_per_kg_high":null,"semi_wholesale_local_per_kg_low":null,"semi_wholesale_local_per_kg_high":null,"retail_local_per_kg_low":null,"retail_local_per_kg_high":null,"dest_standard":null,"dest_moisture_max":null,"dest_broken_max":null,"dest_aflatoxin_max":null}',
    'Use the import duty that applies today (including any stay of application), and per-container figures for one 20 ft container. other_levies_pct must only include non-recoverable levies (not VAT, not withholding or advance income tax). india_mill_price_inr_per_100kg_typical is the current typical ex-mill price in India for this exact product and grade, in INR per 100 kg (quintal). india_fob_usd_per_mt_typical is the current typical FOB price from Indian ports for this exact product and grade. pre_shipment_inspection_required is true or false; transit days are numbers or ranges like "16-20". origin_costs_inr has one entry per origin cost item listed above, with the item name copied exactly (without the "(per ...)" part) and the INR rate per its unit.'
  ].join('\n');
}

// Returns null (no key), { error } or { text, sources: [{title, uri}], queries }.
function researchDestination_(p, c, o) {
  const key = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!key) return null;
  try {
    const res = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(o.model) + ':generateContent', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { 'x-goog-api-key': key },
      payload: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: researchPrompt_(p, c, o) }] }], tools: [{ google_search: {} }] })
    });
    const code = res.getResponseCode();
    let j = {};
    try { j = JSON.parse(res.getContentText()); } catch (e) {}
    if (code !== 200) return { error: 'Gemini returned ' + code + (j.error && j.error.message ? ': ' + String(j.error.message).slice(0, 300) : '') };
    const cand = (j.candidates || [])[0] || {};
    const text = ((cand.content || {}).parts || []).map(x => x.text || '').join('').trim();
    if (!text) return { error: 'Gemini returned no text' + (cand.finishReason ? ' (' + cand.finishReason + ')' : '') };
    const gm = cand.groundingMetadata || {};
    const seen = {};
    const sources = (gm.groundingChunks || []).map(g => g.web || {}).filter(w => w.uri && !seen[w.uri] && (seen[w.uri] = 1))
      .map(w => ({ title: String(w.title || w.uri), uri: String(w.uri) })).slice(0, 15);
    let figures = null;
    const m = text.match(/```json\s*([\s\S]*?)```/);
    if (m) { try { figures = JSON.parse(m[1]); } catch (e) {} }
    return { text: text.replace(/```json[\s\S]*?```/, '').trim(), figures: figures, sources: sources, queries: (gm.webSearchQueries || []).slice(0, 10) };
  } catch (err) {
    return { error: String(err).slice(0, 300) };
  }
}

// Light Markdown to Doc: "### " headings, "- " bullets, **bold** markers removed.
function researchToDoc_(body, text, color) {
  String(text).split(/\r?\n/).forEach(line => {
    const t = line.replace(/\*\*/g, '').replace(/\s+$/, '');
    if (!t.trim()) return;
    const h = t.match(/^#{1,4}\s*(.+)/);
    if (h) { const x = body.appendParagraph(h[1]); x.editAsText().setFontSize(10).setBold(true).setForegroundColor(color); return; }
    const b = t.match(/^\s*[-*•]\s+(.+)/);
    if (b) { const li = body.appendListItem(b[1]); li.setGlyphType(DocumentApp.GlyphType.BULLET); li.editAsText().setFontSize(9).setBold(false).setForegroundColor('#1e293b'); return; }
    const x = body.appendParagraph(t.trim()); x.editAsText().setFontSize(9).setBold(false).setForegroundColor('#1e293b');
  });
}
