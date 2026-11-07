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

- Columns L to V hold the extra form answers: Contact person, Grade / type, Destination port, Incoterm, Packing, Bag branding, Shipment, Payment terms, Target price (USD/MT) Sample needed (both optional on the form) and Final destination (inland), which the form asks for only when a landlocked country such as Rwanda is reached through a transit port. Older sheets get these columns added automatically.
- Column B, **RFQ No.**, holds the reference sent to the buyer (for example BV-261108-003000). Copy it into "Your RFQ ref." on the quotation template. Sheets made before this column existed get it added the next time an RFQ arrives or any automation runs, and their old "Ref:" notes move into it.
- Each row has a **Status** dropdown: New, Contacted, Quoted, Won, Lost.
- Use the **Notes (internal)** column for follow-up notes.
- **Resend a buyer email:** click any cell in the RFQ row, then use the **Bhumi Varahi → Resend buyer email (selected row)** menu at the top of the sheet. It asks before sending and notes the resend in the Notes column. The menu appears after you reload the sheet once the new script is saved.
- **RFQ No. from the website:** the form now makes the RFQ No. (BV-yyMMdd-HHmmss, India time) and shows it to the buyer on screen straight away, with a copy button and an "Also send on WhatsApp" button that fills in the RFQ details. The script keeps that number in column B, so the screen, the sheet, the emails and WhatsApp all show the same one.
- **Internal costing (for us only):** click a cell in the RFQ row, then **Bhumi Varahi → Create internal costing (selected row)**. Type the mill price in INR per 100 kg (or leave it empty for the default). It builds a confidential costing dossier, numbered BV-IC-2026-001 and so on, in the Drive folder **Bhumi Varahi Internal Costing**. The dossier covers the shipment summary, the cost build-up from mill to ship's rail in INR and USD with 18% GST on the taxable CFS/CHA items, your margin, the FOB price to quote, net return, payment rules, registration and document checklists, the execution roadmap, internal checks and sign-off boxes. It is never emailed. The first run adds two tabs you can edit at any time: **Cost Settings** (USD rate, MT per container, margin %, port, CHA partner, mill) and **Cost Rates** (each charge, its rate, whether it is per MT, bag, container or shipment, whether GST applies, and Y/N to include it). Turn on the PVoC/CoC line only for countries that need it. Afterwards, **Create quotation PDF** shows the costed FOB price as a suggestion.
- **Gemini research in the internal costing (optional):** get an API key at aistudio.google.com/apikey. Turn on billing for that Google project, because search grounding is not on the free tier: the first 5,000 grounded prompts a month are free, then about USD 14 per 1,000 searches. In the sheet, choose **Bhumi Varahi → Set Gemini API key** and paste the key. It is stored in the script's private properties, not in the sheet. From then on every internal costing gets a section **"Destination research (AI draft: verify before use)"** with source links, covering India export rules, destination import compliance, duties and taxes, market prices, the buyer's landed cost and margin, and risks. Set **Gemini research** to N in Cost Settings to switch it off, or change **Gemini model** there if Google retires the current one. If the call fails, the costing is still created and shows the error.
- **Create a quotation PDF:** click any cell in the RFQ row, then **Bhumi Varahi → Create quotation PDF (selected row)**. Type your price in USD per MT. Choose **Yes** to email the PDF to the buyer straight away, or **No** to only create it so you can check it first. The quotation gets its own number (BV-Q-2026-001, 002 and so on), shows the buyer's RFQ No., the amount when the quantity is in MT, the Incoterm, payment, shipment, packing and branding terms, and is valid for 7 days. A PDF and an editable Google Doc are saved in the Drive folder **Bhumi Varahi Quotations**. Emailed quotations set Status to **Quoted**, and every quotation is noted in the Notes column. The first time, Google asks you to allow Docs and Drive access.
- Reply to the alert email to answer the buyer directly.
- The buyer automatically gets a branded "we are working on your quotation" email (replies come back to info@).

## If you change the script later

Use **Deploy → Manage deployments → Edit → Version: New version → Deploy**,
so the same URL keeps working.

## Weekly summary email

Every Monday at about 9 AM IST, info@ gets a summary: new requests this week,
counts by status, and a list of open requests (old "New" ones flagged in red).

One-time setup: in Apps Script, choose **setupWeeklySummary** in the function
dropdown and click **Run**, then allow the permission. To see it straight away,
run **sendWeeklySummary**.

## Automations

The script also runs these by itself once they are switched on:

| What | When | What it does |
| --- | --- | --- |
| Daily follow-ups email | Every day, about 9 AM IST | Lists RFQs still marked **New** after 24 hours, RFQs marked **Contacted** with no quote after 3 days, and Outreach contacts whose **Next follow-up** date has arrived. If nothing is due, no email is sent. |
| Spam filter | On every form submission | Submissions with no email and no phone, links in the name, 3+ links, or spam words (SEO, crypto, backlinks…) go to a **Spam** tab. No emails are sent for them. |
| Duplicate filter | On every form submission | If the same email or phone sends the same product again within an hour, no new row is added. A "Resubmitted" note (and any new details) is added to the first row, and the buyer doesn't get a second acknowledgement. |
| Outreach dates | When you change **Stage** in the Outreach tab | Fills in the Date and sets **Next follow-up**: Sent +4 days, Follow-up 1 +6, Replied +1, Quoted +3, Sample +7. Follow-up 2 clears it. |
| Health check | Every 6 hours | Opens the website and this RFQ endpoint. If either is down, info@ gets one alert, then one "resolved" email when it is back. |
| Monthly report | 1st of each month, about 9 AM IST | Last month's RFQs, quote rate, win rate, spam blocked, and counts by product and country. |

**One-time setup:**

1. Paste the new script and deploy it as a new version (**Deploy → Manage deployments → Edit → New version**). The web app URL stays the same.
2. Choose **setupAutomations** in the function menu and click **Run**. Google will ask for permission again, because the health check needs to fetch web pages. Approve it.
3. This creates the **Outreach** and **Spam** tabs and schedules everything above, including the weekly summary.

To test without waiting, run **dailyDigest**, **healthCheck** or **sendMonthlyReport** from the menu. You can change the 24-hour and 3-day limits at the top of the Automations section (`REPLY_AFTER_HOURS`, `QUOTE_AFTER_DAYS`).
