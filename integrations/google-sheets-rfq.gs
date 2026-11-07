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
const HEADERS = ['Received', 'Company / Buyer', 'Email', 'Phone / WhatsApp', 'Country',
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
    sheet.appendRow([new Date(), clean(p.name), clean(p.email), clean(p.phone), clean(p.country),
                     clean(p.commodity), clean(p.quantity), clean(p.notes), 'New', 'Ref: ' + p.ref]);

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
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight('bold').setBackground('#1B4D3E').setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, HEADERS.length, 170);
    sheet.getRange('A:A').setNumberFormat('dd-mmm-yyyy hh:mm');
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['New', 'Contacted', 'Quoted', 'Won', 'Lost'], true).build();
    sheet.getRange(2, 9, 1000, 1).setDataValidation(rule);
  }
  return sheet;
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
  const rows = data.filter(r => isDate(r[0]) && (r[1] || r[2]));
  const newThisWeek = rows.filter(r => r[0] >= weekAgo);
  const count = s => rows.filter(r => String(r[8] || 'New') === s).length;
  const open = rows.filter(r => ['New', 'Contacted', 'Quoted'].includes(String(r[8] || 'New')))
                   .sort((a, b) => a[0] - b[0]);
  const esc = s => String(s == null || s === '' ? '-' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = d => Utilities.formatDate(d, 'Asia/Kolkata', 'dd MMM');
  const days = d => Math.floor((now - d) / 864e5);
  const ref = r => (String(r[9]).match(/BV-\d{6}-\d{6}/) || [''])[0];
  const stat = (label, n, bg) => `<td style="padding:10px;text-align:center;background:${bg};border-radius:6px;"><div style="font-size:22px;font-weight:bold;color:#1B4D3E;">${n}</div><div style="font-size:11px;color:#5A6A72;text-transform:uppercase;letter-spacing:1px;">${label}</div></td>`;
  const th = t => `<th style="text-align:left;padding:6px 8px;background:#1B4D3E;color:#fff;font-size:12px;">${t}</th>`;
  const td = (t, extra) => `<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-size:12px;${extra || ''}">${t}</td>`;
  const openRows = open.slice(0, 30).map(r => `<tr>${td(fmt(r[0]))}${td(esc(ref(r)))}${td(esc(r[1]))}${td(esc(r[5]))}${td(esc(r[6]))}${td(esc(r[4]))}${td(esc(r[8] || 'New'))}${td(days(r[0]) + ' d', days(r[0]) > 3 && String(r[8] || 'New') === 'New' ? 'color:#b91c1c;font-weight:bold;' : '')}</tr>`).join('');
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
