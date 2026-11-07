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
    const clean = v => {
      v = String(v || '').trim().slice(0, 2000);
      return /^[=+\-@]/.test(v) ? "'" + v : v; // stop formula injection
    };
    sheet.appendRow([new Date(), clean(p.name), clean(p.email), clean(p.phone), clean(p.country),
                     clean(p.commodity), clean(p.quantity), clean(p.notes), 'New', '']);

    notify_(p);
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
      ${row('Company / Buyer', p.name)}${row('Email', p.email)}${row('Phone / WhatsApp', p.phone)}
      ${row('Country', p.country)}${row('Commodity', p.commodity)}${row('Quantity', p.quantity)}${row('Port & packaging', p.notes)}
    </table>
    <div style="background:#0E2820;color:#cbd5e1;padding:10px 18px;font-size:12px;">Reply to this email to answer the buyer directly. Saved in the RFQs sheet.</div>
  </div>`;
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    replyTo: p.email || NOTIFY_EMAIL,
    subject: `New RFQ: ${p.commodity || 'Inquiry'} from ${p.name || 'website visitor'}`,
    htmlBody: html,
    name: 'Bhumi Varahi Website'
  });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
