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
                 'Commodity', 'Quantity', 'Port & Packaging', 'Status', 'Notes (internal)'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const p = (e && e.parameter) || {};
    if (p.botcheck) return json_({ success: true }); // spam trap filled in

    const sheet = getSheet_();
    p.ref = 'BV-' + Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyMMdd-HHmmss');
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
      cell.setValue(cell.getValue() + ' · Resubmitted ' + Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd MMM HH:mm') + extra);
      return json_({ success: true });
    }

    sheet.appendRow([new Date(), p.ref, clean(p.name), clean(p.email), clean(p.phone), clean(p.country),
                     clean(p.commodity), clean(p.quantity), clean(p.notes), 'New', '']);

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
  if (sheet.getLastRow() > 0) migrateRfqNo_(sheet);
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
      ${row('Reference', p.ref)}${row('Company / Buyer', p.name)}${row('Email', p.email)}${row('Phone / WhatsApp', p.phone)}
      ${row('Country', p.country)}${row('Commodity', p.commodity)}${row('Quantity', p.quantity)}${row('Port & packaging', p.notes)}
    </table>
    <div style="background:#0E2820;color:#cbd5e1;padding:10px 18px;font-size:12px;">Reply to this email to answer the buyer directly. Saved in the RFQs sheet.</div>
  </div>`;
  MailApp.sendEmail({
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
  const name = esc(p.name || 'Sir / Madam');
  const row = (k, v) => `<tr><td style="padding:6px 12px;color:#5A6A72;width:150px;">${k}</td><td style="padding:6px 12px;color:#1e293b;font-weight:bold;">${esc(v)}</td></tr>`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
    <div style="background:#1B4D3E;padding:18px 24px;border-bottom:3px solid #C9A227;">
      <img src="https://raw.githubusercontent.com/sain936/bhumivarahiimpex-site/main/brand/email-logo.png" alt="Bhumi Varahi Impex" height="48" style="display:block;">
    </div>
    <div style="padding:24px;color:#334155;font-size:15px;line-height:1.6;">
      <p style="margin:0 0 14px;">Dear ${name},</p>
      <p style="margin:0 0 14px;">Thank you for your request for quotation. We have received it, and our export desk is now working on your quotation.</p>
      <p style="margin:0 0 18px;">We will be in touch with you as soon as the quotation is ready. If you have anything to add, such as specifications, packaging or delivery timelines, simply reply to this email or message us on <a href="https://wa.me/919492992666" style="color:#1B4D3E;font-weight:bold;">WhatsApp</a>.</p>
      <div style="background:#F8F5EC;border-left:3px solid #C9A227;border-radius:4px;padding:8px 4px;margin:0 0 18px;">
        <div style="padding:4px 12px;font-size:12px;letter-spacing:1px;color:#8A6508;font-weight:bold;">YOUR REQUEST</div>
        <table style="border-collapse:collapse;font-size:14px;">
          ${row('Reference', p.ref)}${row('Commodity', p.commodity)}${row('Quantity', p.quantity)}${row('Destination', p.country)}${row('Port & packaging', p.notes)}
        </table>
      </div>
      <p style="margin:0;">Warm regards,<br><strong style="color:#1B4D3E;">Export Desk</strong><br>Bhumi Varahi Impex Pvt Ltd</p>
    </div>
    <div style="background:#0E2820;color:#cbd5e1;padding:12px 24px;font-size:12px;">
      <a href="mailto:${NOTIFY_EMAIL}" style="color:#E5C158;text-decoration:none;">${NOTIFY_EMAIL}</a> &nbsp;|&nbsp;
      <a href="https://wa.me/919492992666" style="color:#E5C158;text-decoration:none;">WhatsApp +91 94929 92666</a> &nbsp;|&nbsp;
      <a href="https://www.bhumivarahiimpex.com" style="color:#E5C158;text-decoration:none;">www.bhumivarahiimpex.com</a>
    </div>
  </div>`;
  const text = `Dear ${p.name || 'Sir / Madam'},\n\nThank you for your request for quotation. We have received it, and our export desk is now working on your quotation. We will be in touch as soon as the quotation is ready.\n\nReference: ${p.ref}\nCommodity: ${p.commodity || '-'}\nQuantity: ${p.quantity || '-'}\n\nWarm regards,\nExport Desk, Bhumi Varahi Impex Pvt Ltd\n${NOTIFY_EMAIL} | WhatsApp +91 94929 92666 | www.bhumivarahiimpex.com`;
  MailApp.sendEmail({
    to: email,
    replyTo: NOTIFY_EMAIL,
    subject: `We received your RFQ ${p.ref}: ${p.commodity || 'Quotation request'} | Bhumi Varahi Impex`,
    body: text,
    htmlBody: html,
    name: 'Bhumi Varahi Impex'
  });
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
  MailApp.sendEmail({ to: NOTIFY_EMAIL, subject: `Weekly RFQ summary: ${newThisWeek.length} new, ${open.length} open`, htmlBody: html, name: 'Bhumi Varahi Website' });
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
  MailApp.sendEmail({ to: NOTIFY_EMAIL, subject: `Today's follow-ups: ${parts.join(', ')}`, htmlBody: html, name: 'Bhumi Varahi Website' });
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
    MailApp.sendEmail({ to: NOTIFY_EMAIL, name: 'Bhumi Varahi Website',
      subject: 'ALERT: website or RFQ form is down',
      body: 'The automatic check found a problem:\n\n- ' + problems.join('\n- ') +
            '\n\nCheck GitHub Pages (github.com/sain936/bhumivarahiimpex-site/settings/pages), the domain DNS, and the Apps Script deployment.\nYou will get one more email when it is working again.' });
  } else if (!problems.length && wasDown) {
    props.deleteProperty('healthDown');
    MailApp.sendEmail({ to: NOTIFY_EMAIL, name: 'Bhumi Varahi Website',
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
  MailApp.sendEmail({ to: NOTIFY_EMAIL, subject: `Monthly RFQ report, ${label}: ${rows.length} RFQs, ${status('Won')} won`, htmlBody: html, name: 'Bhumi Varahi Website' });
  return 'Monthly report sent for ' + label;
}

function isDate_(v) { return Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime()); }
