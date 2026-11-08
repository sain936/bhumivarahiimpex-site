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
- **Internal costing (for us only), in two steps:**
  1. Click the RFQ row, then **Bhumi Varahi → Prepare internal costing inputs**. A tab named **IC <RFQ No.>** opens. It lists all 79 manual inputs from the sample dossier, already filled from the RFQ and your defaults. Check them and fill the **yellow cells**, which are required. The inputs are:
     - deal and buyer, including address, tax ID and HS code
     - quality specification
     - mill and mill price
     - origin shipping, including port of loading and containers
     - destination route, including port of discharge, final inland destination, corridor, transit regime, inspection, consignee, notify party and clearing agent
     - USD rate, margin and GST
     - buyer landed cost: freight, local charges, insurance, port, **destination Lo-Lo**, trucking, bond, duty with any minimum, non-recoverable levies, clearing, VAT, selling price and local currency. Import VAT is shown as a cash outlay at clearance and not counted as cost, unless you set "Is import VAT recoverable" to N
     - contract clauses
     - timeline
     - approver names

     At the bottom are this deal's **cost lines**, copied from Cost Rates, which you can edit for this deal only. **Lo-Lo (lift on / lift off)** is included by default with no rate, so the costing will not run until you enter it, or set Include to N.

     **Logistics quotes.** Rates change with the destination, so each cost line and each destination charge (ocean freight, carrier local charges, port, Lo-Lo, trucking, transit bond, clearing) has two quote columns, **H and I**. Type the vendor and amount, for example `Sea Hawk CHA: 2400` or `MSC: USD 2,150`. If the Value or Rate cell is blank, the lowest quote is used. On each run Gemini writes its web estimate for the same line into **column J**. The dossier then has a **Logistics quote comparison** table that flags any rate costed more than 10% above the lowest quote, any rate more than 40% away from the web estimate, and any destination charge that is only a web estimate. Every quote and estimate is also added to the **Logistics Quote Log** tab, with the route, so you can filter by port or destination and compare over time.

     **Web and market prices while you fill it in.** When Gemini is set up, **Prepare internal costing inputs** runs the research first and puts its figures in **column J** beside each input. That covers freight and destination charges, duty, VAT and levies, exchange rate, wholesale and retail prices, quality limits, insurance, transit days, a typical mill price and FOB for the grade, and a rate for each origin cost line. A research summary with its sources is added at the bottom of the tab. Your own Value cells are never changed. Run Prepare again on the same RFQ row to refresh the figures.

     **Quotes from earlier deals.** When a new IC tab is made for a route you have quoted before, columns H and I are pre-filled with the latest quotes from the log, with their dates. Quotes older than **Logistics quotes valid for (days)** in Cost Settings (default 30) are flagged to re-confirm.

     **Asking vendors for quotes.** List your forwarders, shipping lines, CHAs, transporters and destination clearing agents in the **Logistics Vendors** tab: name, type, email, contact, and the ports they cover (blank means all). Then choose **Bhumi Varahi → Draft logistics quote requests** on the RFQ row or IC tab. It writes one Gmail draft per matching vendor, each asking only for the items that vendor handles, with the cargo, containers, route and RFQ No. Nothing is sent: check the drafts in Gmail and press Send yourself.

     **What-if and price limits.** The dossier shows how our FOB, our margin (if the quoted price can't change) and the buyer's return move when the mill price changes by 10%, the rupee by 2%, origin logistics by 10% or ocean freight by 20%. It also shows our break-even FOB, our lowest FOB for a GO margin, the highest FOB the buyer can pay and keep the minimum buyer return, and the negotiation range between them. If there is no range, the scorecard shows "Negotiation room" as WATCH.
  2. Choose **Bhumi Varahi → Create internal costing**, from the IC tab or the RFQ row. It lists anything still missing. Otherwise it builds the **Consignment Decision Dossier**, numbered BV-IC-2026-001 and so on, in the Drive folder **Bhumi Varahi Internal Costing**. It is never emailed.
     - **Page 1:** a **GO / GO WITH CONDITIONS / NO-GO** verdict, the key numbers, and a scorecard. The scorecard covers our margin against a minimum, the buyer's target price, payment security, registrations, buyer profitability, our FOB against the typical India FOB for this product (below 75% is a STOP), price against the destination market, a mill price left at its default, a required destination inspection such as PVoC that is not costed (a STOP), and pending buyer documents. It also checks the **container load** (a part-filled 20 ft box is a STOP below 50% and a WATCH below 90%, with the full-load price shown), the **buyer's Incoterm** (when the buyer asks for CFR or CIF, the dossier shows that price next to FOB and compares the buyer's target with it), a buyer target so low it is probably a different unit or a typo, and a mill price far below the typical FOB for the grade.
     - **The rest follows the sample dossier:**
       - executive summary
       - buyer-view proforma, with scope and turnaround
       - cost accounting with the partner tariff schedule
       - market price tiers and duty structure
       - exporter return with ROCE
       - buyer landed cost and profit, and the two-party summary
       - zero-credit payment terms, bank details and protective clauses
       - KYC and shipment permission register
       - two-way information matrix
       - document checklist
       - our quality standard against the destination standard, and bagging standards
       - compliance framework
       - Incoterms matrix
       - 7-stage roadmap and transfer of risk
       - 14-point audit
       - Gemini research
       - approvals
     - **AI figures:** with Gemini on, empty buyer-side, market and destination-standard inputs are filled from its research and marked **(AI est.)**. Values you type always win. Minimum margin and minimum buyer return for GO are set in Cost Settings.
     - shipment summary and quality table
     - cost build-up in INR and USD with GST, margin and the FOB price
     - exporter net return
     - **buyer landed cost and profit**, and a two-party summary
     - payment rules
     - contract clauses and bank details
     - licence status
     - what we need from and give to the buyer
     - document checklist with the transit B/L clause
     - roadmap, internal checks, optional Gemini research and approvals

     It is never emailed. Company-wide values live in **Cost Settings**: USD rate, margin, GST, mill, port, CHA, bank details, and the status of IEC / GST-LUT / AD code / ICEGATE / APEDA RCMC and RCAC / FSSAI / PQIS. Standard rates live in **Cost Rates**. Afterwards, **Create quotation PDF** suggests the costed FOB price.
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
