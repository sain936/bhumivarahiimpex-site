"""RFQ form fields, shared by the English homepage and the Arabic / French pages.

Every field is required. Field names must match integrations/google-sheets-rfq.gs.
"""
import html
e = html.escape

T = {
 'en': dict(
   optional='(optional)', sel_country='Select country…', sel_port='Select port…', port_first='Choose the country first',
   other_country='Other country', other_port='Other port', ph_country_other='Type the country name', ph_port_other='Type the port name',
   search_country='Search country', search_port='Search port',
   name='Company name', contact='Contact person', email='Work email', phone='Phone / WhatsApp',
   comm='Product', grade='Grade / type', qty='Quantity (metric tons)', country='Destination country',
   port='Destination port', incoterm='Delivery terms (Incoterm)', packing='Packing', label='Bag branding',
   shipment='Shipment timeline', payment='Payment terms', notes='Other specifications & requirements',
   ph_name='e.g. Al-Mansoor Trading LLC', ph_contact='e.g. Ahmed Khan, Procurement Manager',
   ph_grade='e.g. Golden Sella, 8.35 mm, 2% broken', ph_qty='e.g. 100 MT (4 x 20 ft FCL)',
   ph_country='e.g. United Arab Emirates', ph_port='e.g. Jebel Ali',
   ph_notes='Moisture, broken %, crop year, documents needed (phyto, fumigation, COO), inspection (SGS), etc. Write "None" if nothing else.',
   choose='Select…', choose_prod='Select a product…', other='Other / custom request',
   incoterm_o=['FOB (Indian port)', 'CFR / C&F (to your port)', 'CIF (to your port, insured)', 'Not sure, please advise'],
   packing_o=['1 kg retail packs', '5 kg', '10 kg', '20 kg', '25 kg', '40 kg', '50 kg', 'Jumbo / bulk bags', 'Other (describe below)'],
   label_o=['Plain / neutral bags', 'Our own brand (private label)', 'Bhumi Varahi brand', 'Not decided yet'],
   shipment_o=['Within 30 days', 'In 1–2 months', 'In 3 months or later', 'Regular monthly contract'],
   payment_o=['LC at sight', 'TT advance + balance against documents', 'CAD (cash against documents)', 'To be discussed'],
   price='Target price (USD per MT)', ph_price='e.g. 950', sample='Sample needed?', sample_o=['Yes, please send a sample', 'No'],
 ),
 'ar': dict(
   optional='(اختياري)', sel_country='اختر الدولة…', sel_port='اختر الميناء…', port_first='اختر الدولة أولاً',
   other_country='دولة أخرى', other_port='ميناء آخر', ph_country_other='اكتب اسم الدولة', ph_port_other='اكتب اسم الميناء',
   search_country='ابحث عن دولة', search_port='ابحث عن ميناء',
   name='اسم الشركة', contact='الشخص المسؤول', email='البريد الإلكتروني', phone='الهاتف / واتساب',
   comm='المنتج', grade='الصنف / النوع', qty='الكمية (طن متري)', country='بلد الوصول',
   port='ميناء الوصول', incoterm='شروط التسليم', packing='التعبئة', label='العلامة على الأكياس',
   shipment='موعد الشحن', payment='شروط الدفع', notes='مواصفات ومتطلبات أخرى',
   ph_name='مثال: شركة المنصور التجارية', ph_contact='مثال: أحمد خان، مدير المشتريات',
   ph_grade='مثال: سيلا ذهبي، 8.35 مم، كسر 2%', ph_qty='مثال: 100 طن (4 حاويات 20 قدم)',
   ph_country='مثال: الإمارات العربية المتحدة', ph_port='مثال: جبل علي',
   ph_notes='الرطوبة، نسبة الكسر، سنة المحصول، الوثائق المطلوبة (شهادة صحة نباتية، تبخير، شهادة منشأ)، الفحص (SGS)... اكتب «لا يوجد» إن لم يكن هناك شيء آخر.',
   choose='اختر…', choose_prod='اختر المنتج…', other='أخرى / طلب خاص',
   incoterm_o=['FOB (ميناء هندي)', 'CFR / C&F (إلى ميناءكم)', 'CIF (إلى ميناءكم مع التأمين)', 'غير متأكد، أرجو النصيحة'],
   packing_o=['عبوات 1 كغ', '5 كغ', '10 كغ', '20 كغ', '25 كغ', '40 كغ', '50 كغ', 'أكياس جامبو / سائب', 'أخرى (وضّح أدناه)'],
   label_o=['أكياس محايدة بدون علامة', 'علامتنا التجارية الخاصة', 'علامة بومي فاراهي', 'لم يتحدد بعد'],
   shipment_o=['خلال 30 يوماً', 'خلال شهر إلى شهرين', 'بعد 3 أشهر أو أكثر', 'عقد شهري منتظم'],
   payment_o=['اعتماد مستندي بالاطلاع', 'دفعة مقدمة بالتحويل والباقي مقابل المستندات', 'الدفع مقابل المستندات (CAD)', 'للنقاش'],
   price='السعر المستهدف (دولار للطن)', ph_price='مثال: 950', sample='هل تحتاجون عينة؟', sample_o=['نعم، أرسلوا عينة', 'لا'],
 ),
 'fr': dict(
   optional='(facultatif)', sel_country='Choisir un pays…', sel_port='Choisir un port…', port_first='Choisissez d’abord le pays',
   other_country='Autre pays', other_port='Autre port', ph_country_other='Saisissez le nom du pays', ph_port_other='Saisissez le nom du port',
   search_country='Rechercher un pays', search_port='Rechercher un port',
   name='Société', contact='Personne à contacter', email='E-mail professionnel', phone='Téléphone / WhatsApp',
   comm='Produit', grade='Qualité / type', qty='Quantité (tonnes)', country='Pays de destination',
   port='Port de destination', incoterm='Conditions de livraison (Incoterm)', packing='Conditionnement', label='Marquage des sacs',
   shipment='Délai d’expédition', payment='Conditions de paiement', notes='Autres spécifications et exigences',
   ph_name='ex. Société Diallo Import SARL', ph_contact='ex. Moussa Diallo, Responsable achats',
   ph_grade='ex. étuvé, 5 % de brisures', ph_qty='ex. 100 t (4 conteneurs 20 pieds)',
   ph_country='ex. Sénégal', ph_port='ex. Dakar',
   ph_notes='Humidité, % de brisures, récolte, documents requis (phytosanitaire, fumigation, origine), inspection (SGS), etc. Écrivez « Aucune » s’il n’y a rien d’autre.',
   choose='Choisir…', choose_prod='Choisir un produit…', other='Autre / demande spéciale',
   incoterm_o=['FOB (port indien)', 'CFR / C&F (jusqu’à votre port)', 'CIF (jusqu’à votre port, assuré)', 'Je ne sais pas, conseillez-moi'],
   packing_o=['Sachets de 1 kg', '5 kg', '10 kg', '20 kg', '25 kg', '40 kg', '50 kg', 'Big bags / vrac', 'Autre (préciser ci-dessous)'],
   label_o=['Sacs neutres', 'Notre propre marque', 'Marque Bhumi Varahi', 'Pas encore décidé'],
   shipment_o=['Sous 30 jours', 'Dans 1 à 2 mois', 'Dans 3 mois ou plus', 'Contrat mensuel régulier'],
   payment_o=['Crédit documentaire à vue', 'Acompte par virement + solde contre documents', 'CAD (paiement contre documents)', 'À discuter'],
   price='Prix cible (USD par tonne)', ph_price='ex. 950', sample='Besoin d’un échantillon ?', sample_o=['Oui, envoyez un échantillon', 'Non'],
 ),
}
# Values stored in the sheet are always English, whatever the page language.
EN = T['en']
DIAL = {
 'en': dict(top='Gulf & India', all='All countries', search='Search country or code', none='No match', aria='Country calling code'),
 'ar': dict(top='الخليج والهند', all='جميع الدول', search='ابحث عن دولة أو رمز', none='لا توجد نتائج', aria='رمز الاتصال الدولي'),
 'fr': dict(top='Golfe et Inde', all='Tous les pays', search='Rechercher un pays ou un indicatif', none='Aucun résultat', aria='Indicatif pays'),
}
INP = 'w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-emerald-200/50 focus:outline-none focus:border-brand-warmGold text-sm'
SEL = 'w-full px-4 py-3 rounded-lg bg-slate-900 border border-white/20 text-white text-sm focus:outline-none focus:border-brand-warmGold'


def render(lang, product_groups, group_names, lab):
    """product_groups: [(cat, [product dicts])]; group_names: translated group labels."""
    t = T[lang]
    ltr = ' dir="ltr"' if lang == 'ar' else ''
    star = ' <span class="text-brand-goldLight" aria-hidden="true">*</span>'

    def L(id_, key, opt=False):
        mark = f' <span class="normal-case font-normal text-emerald-200/70">{e(t["optional"])}</span>' if opt else star
        return f'<label for="{id_}" class="{lab}">{e(t[key])}{mark}</label>'

    def text(id_, name, key, ph, typ='text', ac='', extra='', opt=False):
        a = f' autocomplete="{ac}"' if ac else ''
        d = ' dir="ltr"' if typ in ('email', 'tel') else ''
        r = '' if opt else ' required'
        return f'<div>{L(id_, key, opt)}<input type="{typ}" id="{id_}" name="{name}"{r}{a}{d}{extra} placeholder="{e(ph)}" class="{INP}" /></div>'

    def select(id_, name, key, opts_key, opt=False):
        o = f'<option value=""{"" if opt else " disabled"} selected>{e(t["choose"])}</option>' + ''.join(
            f'<option value="{e(v)}">{e(lbl)}</option>' for v, lbl in zip(EN[opts_key], t[opts_key]))
        r = '' if opt else ' required'
        return f'<div>{L(id_, key, opt)}<select id="{id_}" name="{name}"{r} class="{SEL}">{o}</select></div>'

    prod = f'<option value="" disabled selected>{e(t["choose_prod"])}</option>' + ''.join(
        f'<optgroup label="{e(g)}">' + ''.join(f'<option value="{e(p["name"])}">{e(p["name"])}</option>' for p in items) + '</optgroup>'
        for (_, items), g in zip(product_groups, group_names))
    prod += f'<optgroup label="{e(t["other"])}"><option value="Other / Custom request">{e(t["other"])}</option></optgroup>'
    dz = DIAL[lang]
    phone = (f'<div>{L("phone", "phone")}<div class="flex gap-2" dir="ltr">'
             f'<select id="dialcode" data-dialcodes data-top-label="{e(dz["top"])}" data-all-label="{e(dz["all"])}" data-search="{e(dz["search"])}" data-none="{e(dz["none"])}" aria-label="{e(dz["aria"])}" class="w-[7.5rem] shrink-0 px-2 py-3 rounded-lg bg-white/10 border border-white/20 text-white text-sm [&>optgroup]:text-slate-900 [&_option]:text-slate-900"></select>'
             f'<input type="tel" id="phone" name="phone" required autocomplete="tel-national" inputmode="tel" minlength="6" placeholder="50 123 4567" class="min-w-0 flex-1 {INP}" dir="ltr" /></div></div>')
    country = (f'<div>{L("country", "country")}<div class="relative">'
               f'<select id="country" name="country" required data-country-picker data-ph="{e(t["sel_country"])}" data-other="{e(t["other_country"])}" data-search="{e(t["search_country"])}" data-none="{e(dz["none"])}" data-top-label="{e(dz["top"])}" data-all-label="{e(dz["all"])}" class="{SEL}">'
               f'<option value="" disabled selected>{e(t["sel_country"])}</option></select></div>'
               f'<input type="text" name="country_other" hidden maxlength="80" placeholder="{e(t["ph_country_other"])}" aria-label="{e(t["ph_country_other"])}" class="mt-2 {INP}" /></div>')
    port = (f'<div>{L("port", "port")}<div class="relative">'
            f'<select id="port" name="port" required data-port-picker data-ph="{e(t["sel_port"])}" data-first="{e(t["port_first"])}" data-other="{e(t["other_port"])}" data-search="{e(t["search_port"])}" data-none="{e(dz["none"])}" class="{SEL}">'
            f'<option value="" disabled selected>{e(t["port_first"])}</option></select></div>'
            f'<input type="text" name="port_other" hidden maxlength="80" placeholder="{e(t["ph_port_other"])}" aria-label="{e(t["ph_port_other"])}" class="mt-2 {INP}" /></div>')
    G = lambda *xs: '<div class="grid grid-cols-1 sm:grid-cols-2 gap-5">' + ''.join(xs) + '</div>'
    notes = f'<div>{L("rfqNotes", "notes")}<textarea id="rfqNotes" name="notes" rows="3" required placeholder="{e(t["ph_notes"])}" class="{INP}"></textarea></div>'
    steps = [
        G(text('buyerName', 'name', 'name', t['ph_name'], ac='organization'),
          text('contactPerson', 'contact', 'contact', t['ph_contact'], ac='name'),
          text('buyerEmail', 'email', 'email', 'procurement@buyer.com', typ='email', ac='email'),
          phone),
        G(f'<div>{L("commoditySelect", "comm")}<select id="commoditySelect" name="commodity" required class="{SEL}"{ltr}>{prod}</select></div>',
          text('grade', 'grade', 'grade', t['ph_grade'], opt=True),
          text('quantity', 'quantity', 'qty', t['ph_qty']),
          select('packing', 'packing', 'packing', 'packing_o'),
          select('bagLabel', 'label', 'label', 'label_o'),
          select('sample', 'sample', 'sample', 'sample_o', opt=True),
          text('targetPrice', 'price', 'price', t['ph_price'], opt=True, extra=' inputmode="decimal" maxlength="40" dir="ltr"')),
        G(country, port,
          select('incoterm', 'incoterm', 'incoterm', 'incoterm_o'),
          select('shipment', 'shipment', 'shipment', 'shipment_o'),
          select('payment', 'payment', 'payment', 'payment_o')) + notes,
    ]
    u = UI[lang]
    prog = ('<div data-rfq-progress class="hidden" aria-hidden="true"><div class="flex justify-between text-xs font-semibold text-emerald-200/80 mb-2">'
            + ''.join(f'<span data-rfq-steplabel="{i}" class="transition-colors">{i + 1}. {e(x)}</span>' for i, x in enumerate(u['steps']))
            + '</div><div class="h-1.5 rounded-full bg-white/10 overflow-hidden"><div data-rfq-bar class="h-full bg-brand-warmGold rounded-full transition-all duration-300" style="width:33%"></div></div>'
            + '<p data-rfq-stepof class="sr-only" aria-live="polite"></p></div>')
    fs = ''.join(f'<fieldset data-rfq-step="{i}" class="space-y-5 border-0 p-0 m-0 min-w-0"><legend class="sr-only">{e(u["steps"][i])}</legend>{x}</fieldset>' for i, x in enumerate(steps))
    btn = 'py-3.5 rounded-xl text-base font-bold transition-transform active:scale-[0.99] disabled:opacity-60'
    nav = (f'<div data-rfq-nav class="flex gap-3 pt-1">'
           f'<button type="button" data-rfq-back hidden class="{btn} px-6 border border-white/30 text-white hover:bg-white/10">{e(u["back"])}</button>'
           f'<button type="button" data-rfq-next hidden class="{btn} flex-1 bg-white/90 hover:bg-white text-slate-950">{e(u["next"])}</button>'
           f'<button type="submit" id="rfqSubmit" class="{btn} flex-1 w-full bg-brand-warmGold hover:bg-yellow-500 text-slate-950 shadow-lg">{e(u["submit"])}</button></div>')
    note = ('<div data-rfq-restored hidden class="rounded-lg border border-brand-warmGold/40 bg-brand-warmGold/10 px-4 py-2.5 text-sm text-emerald-50 flex flex-wrap items-center justify-between gap-2">'
            f'<span>{e(u["restored"])}</span><button type="button" data-rfq-clear class="font-semibold text-brand-goldLight underline underline-offset-4">{e(u["clear"])}</button></div>')
    done = ('<div data-rfq-done hidden tabindex="-1" class="text-center py-6 outline-none">'
            '<div class="mx-auto w-16 h-16 rounded-full bg-brand-warmGold/15 border-2 border-brand-warmGold flex items-center justify-center text-brand-goldLight"><svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg></div>'
            f'<h3 class="hfont text-2xl font-bold mt-5">{e(u["ok_t"])}</h3>'
            f'<p class="text-emerald-100 text-sm mt-2 max-w-md mx-auto leading-relaxed">{e(u["ok_b"])}</p>'
            f'<div class="mt-6 inline-flex flex-col items-center rounded-2xl border border-brand-warmGold/50 bg-black/20 px-6 py-4"><span class="text-xs font-bold uppercase tracking-widest text-brand-goldLight">{e(u["ref_l"])}</span>'
            '<div class="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 mt-1" dir="ltr"><span data-rfq-ref class="whitespace-nowrap text-2xl sm:text-3xl font-extrabold tracking-wide text-white select-all"></span>'
            f'<button type="button" data-rfq-copy class="text-xs font-bold px-3 py-1.5 rounded-lg border border-white/30 hover:bg-white/10" data-copied="{e(u["copied"])}">{e(u["copy"])}</button></div></div>'
            f'<p class="text-emerald-100 text-sm mt-6">{e(u["wa_hint"])}</p>'
            f'<a data-rfq-wa href="https://wa.me/919492992666" target="_blank" rel="noopener" class="mt-3 inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5b] text-slate-950 font-bold shadow-lg">{WA_SVG}{e(u["wa"])}</a>'
            f'<div class="mt-6"><button type="button" data-rfq-another class="text-sm font-semibold text-brand-goldLight underline underline-offset-4">{e(u["another"])}</button></div></div>')
    err = '<div data-rfq-error role="alert" hidden class="rounded-xl p-4 text-sm bg-red-100 text-red-900"></div>'
    i18n = {k: u[k] for k in ('steps', 'step_of', 'submit', 'sending', 'err', 'wa_msg', 'copied', 'copy')}
    import json
    return (prog + note + fs + err + nav + done +
            f'<script type="application/json" id="rfqI18n">{json.dumps(i18n, ensure_ascii=False).replace("</", "<\\/")}</script>')


WA_SVG = '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z"/></svg>'

UI = {
 'en': dict(steps=['Company', 'Product', 'Shipping & terms'], step_of='Step {n} of {t}', next='Next', back='Back',
   submit='Submit RFQ', sending='Sending…', ok_t='Thank you, we have your request',
   ok_b='Our export desk will send your quotation within 24 business hours. A confirmation email is on its way; please check your spam folder if you don’t see it.',
   ref_l='Your RFQ No.', copy='Copy', copied='Copied', wa_hint='Want a faster reply? Send your request to our export desk on WhatsApp too.',
   wa='Also send on WhatsApp', another='Submit another request',
   err='Your request could not be sent. Please check your connection and try again, or email info@bhumivarahiimpex.com.',
   restored='We restored the answers you started earlier.', clear='Start over',
   wa_msg='Hello Bhumi Varahi Impex, I have just sent an RFQ on your website.'),
 'ar': dict(steps=['الشركة', 'المنتج', 'الشحن والشروط'], step_of='الخطوة {n} من {t}', next='التالي', back='رجوع',
   submit='إرسال الطلب', sending='جارٍ الإرسال…', ok_t='شكراً لكم، استلمنا طلبكم',
   ok_b='سيرسل فريق التصدير عرض السعر خلال 24 ساعة عمل. أرسلنا لكم رسالة تأكيد بالبريد؛ يرجى مراجعة مجلد الرسائل غير المرغوب فيها إن لم تجدوها.',
   ref_l='رقم طلبكم', copy='نسخ', copied='تم النسخ', wa_hint='تريدون رداً أسرع؟ أرسلوا طلبكم إلى فريق التصدير عبر واتساب أيضاً.',
   wa='أرسلوا عبر واتساب أيضاً', another='إرسال طلب آخر',
   err='تعذر إرسال الطلب. يرجى التحقق من الاتصال والمحاولة مرة أخرى، أو مراسلتنا على info@bhumivarahiimpex.com.',
   restored='استعدنا الإجابات التي بدأتم بها سابقاً.', clear='البدء من جديد',
   wa_msg='مرحباً بومي فاراهي إمبكس، أرسلت للتو طلب عرض سعر عبر موقعكم.'),
 'fr': dict(steps=['Société', 'Produit', 'Expédition et conditions'], step_of='Étape {n} sur {t}', next='Suivant', back='Retour',
   submit='Envoyer la demande', sending='Envoi…', ok_t='Merci, nous avons bien reçu votre demande',
   ok_b='Notre service export vous enverra un devis sous 24 heures ouvrées. Un e-mail de confirmation est en route ; vérifiez vos courriers indésirables si vous ne le voyez pas.',
   ref_l='Votre n° de demande', copy='Copier', copied='Copié', wa_hint='Pour une réponse plus rapide, envoyez aussi votre demande à notre service export sur WhatsApp.',
   wa='Envoyer aussi sur WhatsApp', another='Faire une autre demande',
   err='Votre demande n’a pas pu être envoyée. Vérifiez votre connexion et réessayez, ou écrivez à info@bhumivarahiimpex.com.',
   restored='Nous avons restauré les réponses que vous aviez commencées.', clear='Recommencer',
   wa_msg='Bonjour Bhumi Varahi Impex, je viens d’envoyer une demande de devis sur votre site.'),
}
