# RFQ form → Google Sheets

Every quotation request from the website is saved as a row in a Google Sheet,
and an email alert goes to info@bhumivarahiimpex.com.

## One-time setup (about 5 minutes)

1. Signed in as info@bhumivarahiimpex.com, create a new Google Sheet named
   "Bhumi Varahi RFQs".
2. In the sheet, open **Extensions → Apps Script**.
3. Delete the sample code, paste everything from `google-sheets-rfq.gs`, and click **Save**.
4. Click **Deploy → New deployment**. Choose type **Web app**.
   - Description: RFQ form
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**, then **Authorize access**, and allow the permissions
   (Google may show "unverified app": click Advanced → Go to project).
6. Copy the **Web app URL** (ends in `/exec`).
7. In `index.html`, replace `PASTE_APPS_SCRIPT_URL_HERE` with that URL,
   or send the URL to Claude to do it.

## Using the sheet

- Each row has a **Status** dropdown: New, Contacted, Quoted, Won, Lost.
- Use the **Notes (internal)** column for follow-up notes.
- Reply to the alert email to answer the buyer directly.
- The buyer automatically gets a branded "we are working on your quotation" email (replies come back to info@).

## If you change the script later

Use **Deploy → Manage deployments → Edit → Version: New version → Deploy**,
so the same URL keeps working.
