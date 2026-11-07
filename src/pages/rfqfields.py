"""RFQ form fields, shared by the English homepage and the Arabic / French pages.

Every field is required. Field names must match integrations/google-sheets-rfq.gs.
"""
import html
e = html.escape

T = {
 'en': dict(
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
 ),
 'ar': dict(
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
 ),
 'fr': dict(
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

    def L(id_, key):
        return f'<label for="{id_}" class="{lab}">{e(t[key])}{star}</label>'

    def text(id_, name, key, ph, typ='text', ac='', extra=''):
        a = f' autocomplete="{ac}"' if ac else ''
        d = ' dir="ltr"' if typ in ('email', 'tel') else ''
        return f'<div>{L(id_, key)}<input type="{typ}" id="{id_}" name="{name}" required{a}{d}{extra} placeholder="{e(ph)}" class="{INP}" /></div>'

    def select(id_, name, key, opts_key):
        o = f'<option value="" disabled selected>{e(t["choose"])}</option>' + ''.join(
            f'<option value="{e(v)}">{e(lbl)}</option>' for v, lbl in zip(EN[opts_key], t[opts_key]))
        return f'<div>{L(id_, key)}<select id="{id_}" name="{name}" required class="{SEL}">{o}</select></div>'

    prod = f'<option value="" disabled selected>{e(t["choose_prod"])}</option>' + ''.join(
        f'<optgroup label="{e(g)}">' + ''.join(f'<option value="{e(p["name"])}">{e(p["name"])}</option>' for p in items) + '</optgroup>'
        for (_, items), g in zip(product_groups, group_names))
    prod += f'<optgroup label="{e(t["other"])}"><option value="Other / Custom request">{e(t["other"])}</option></optgroup>'
    dz = DIAL[lang]
    phone = (f'<div>{L("phone", "phone")}<div class="flex gap-2" dir="ltr">'
             f'<select id="dialcode" data-dialcodes data-top-label="{e(dz["top"])}" data-all-label="{e(dz["all"])}" data-search="{e(dz["search"])}" data-none="{e(dz["none"])}" aria-label="{e(dz["aria"])}" class="w-[7.5rem] shrink-0 px-2 py-3 rounded-lg bg-white/10 border border-white/20 text-white text-sm [&>optgroup]:text-slate-900 [&_option]:text-slate-900"></select>'
             f'<input type="tel" id="phone" name="phone" required autocomplete="tel-national" inputmode="tel" minlength="6" placeholder="50 123 4567" class="min-w-0 flex-1 {INP}" dir="ltr" /></div></div>')
    fields = [
        text('buyerName', 'name', 'name', t['ph_name'], ac='organization'),
        text('contactPerson', 'contact', 'contact', t['ph_contact'], ac='name'),
        text('buyerEmail', 'email', 'email', 'procurement@buyer.com', typ='email', ac='email'),
        phone,
        f'<div>{L("commoditySelect", "comm")}<select id="commoditySelect" name="commodity" required class="{SEL}"{ltr}>{prod}</select></div>',
        text('grade', 'grade', 'grade', t['ph_grade']),
        text('quantity', 'quantity', 'qty', t['ph_qty']),
        text('country', 'country', 'country', t['ph_country'], ac='country-name'),
        text('port', 'port', 'port', t['ph_port']),
        select('incoterm', 'incoterm', 'incoterm', 'incoterm_o'),
        select('packing', 'packing', 'packing', 'packing_o'),
        select('bagLabel', 'label', 'label', 'label_o'),
        select('shipment', 'shipment', 'shipment', 'shipment_o'),
        select('payment', 'payment', 'payment', 'payment_o'),
    ]
    notes = f'<div>{L("rfqNotes", "notes")}<textarea id="rfqNotes" name="notes" rows="3" required placeholder="{e(t["ph_notes"])}" class="{INP}"></textarea></div>'
    return ('<div class="grid grid-cols-1 sm:grid-cols-2 gap-5">\n            ' + '\n            '.join(fields) +
            '\n          </div>\n          ' + notes)
