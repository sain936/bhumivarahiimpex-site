import os, sys, json, html, pathlib
from urllib.parse import quote
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from core import ROOT, SITE, WAICON, G_TAG
from data import BASMATI, AROMATIC, NONBAS, SPICES
SHEETS_URL='https://script.google.com/macros/s/AKfycbzRctdjTuNZ-1JklyRoU8ZaZFS-JMvhf1DloyTOI1TqP6ZvrMBixsIAYRm9NP97Xdk/exec'
CAT='/catalogue/Bhumi-Varahi-Impex-Catalogue-2026.pdf'
L={
'ar':dict(dir='rtl',font="'Cairo', 'Tahoma', sans-serif",fontlink='family=Cairo:wght@400;600;700;800',tag='AR',
 title='بهومي فاراهي إمبكس | مصدّر أرز بسمتي وتوابل هندية',
 desc='مصدّر هندي للأرز البسمتي وغير البسمتي والتوابل. أسعار FOB وCIF، تعبئة بعلامتكم التجارية، وشحن من موانئ الهند الشرقية.',
 nav_products='المنتجات',nav_order='طريقة الطلب',nav_quote='اطلب عرض سعر',
 kicker='شريككم التجاري في الهند',h1='أرز وتوابل هندية للتصدير',
 lead='نوفّر الأرز البسمتي وغير البسمتي والتوابل الهندية من مطاحن ومعامل موثوقة، ونشحنها بأسعار FOB أو CIF إلى الخليج والشرق الأوسط وأفريقيا.',
 cta_quote='اطلب عرض سعر',cta_wa='تواصل عبر واتساب',
 wa_msg='مرحباً بهومي فاراهي إمبكس، أرغب في الحصول على عرض سعر.',
 about_h='من نحن',about='بهومي فاراهي إمبكس الخاصة المحدودة شركة تصدير هندية مسجّلة لدى وزارة شؤون الشركات في الهند. نربط المستوردين حول العالم بمطاحن الأرز ومعامل التوابل في الهند، ونتولّى فحص الجودة والتعبئة والمستندات والشحن من موانئ كاكينادا وفيشاخاباتنام وتشيناي.',
 why=[('من المصدر مباشرة','علاقات مباشرة مع المطاحن والمعامل في مناطق الزراعة الرئيسية.'),('فحص الجودة','نفحص كل شحنة وفق المواصفات المتفق عليها، مع فحص طرف ثالث (SGS) عند الطلب.'),('علامتكم التجارية','تعبئة بعلامتكم الخاصة بأحجام التجزئة والجملة.'),('رد خلال 24 ساعة','نرسل عرض السعر عادةً خلال 24 ساعة عمل.')],
 prod_h='منتجاتنا',prod_note='صفحات المواصفات التفصيلية متوفرة باللغة الإنجليزية.',
 groups=['الأرز البسمتي','الأرز العطري طويل الحبة','الأرز غير البسمتي','التوابل'],
 cat_btn='تحميل الكتالوج (PDF، بالإنجليزية)',
 order_h='طريقة الطلب',steps=['أرسلوا طلبكم: المنتج والكمية وميناء الوصول ونوع التعبئة.','نرسل لكم عرض سعر FOB أو CFR أو CIF.','نرسل عيّنة من الشحنة للموافقة عند الطلب.','تأكيد العقد وشروط الدفع (اعتماد مستندي أو تحويل بنكي) ثم الشحن مع جميع المستندات.'],
 form_h='اطلب عرض سعر',form_sub='املأ النموذج وسيتواصل معكم فريق التصدير خلال 24 ساعة عمل.',
 f_name='اسم الشركة / المشتري *',f_email='البريد الإلكتروني *',f_comm='المنتج',f_qty='الكمية المطلوبة',f_country='بلد الوصول',f_phone='الهاتف / واتساب',f_notes='ميناء الوصول والتعبئة والملاحظات',
 ph_name='مثال: شركة المنصور التجارية',ph_qty='مثال: 500 طن (20 حاوية)',ph_country='مثال: الإمارات العربية المتحدة',ph_notes='مثال: جبل علي، أكياس 25 كغ',
 submit='إرسال الطلب',sending='جارٍ الإرسال...',ok_t='تم استلام طلبكم',ok_b='شكراً لكم. سيرسل فريق التصدير عرض السعر قريباً، وستصلكم رسالة تأكيد على بريدكم.',err_t='تعذّر الإرسال',err_b='يرجى مراسلتنا مباشرة على info@bhumivarahiimpex.com',
 contact_h='تواصلوا معنا',hours='ساعات العمل: 10 صباحاً – 4 مساءً بتوقيت الهند',email_l='البريد الإلكتروني',wa_l='الهاتف / واتساب',ports_l='موانئ الشحن',ports='كاكينادا، فيشاخاباتنام، تشيناي',
 english='English',rights='© 2026 بهومي فاراهي إمبكس الخاصة المحدودة. جميع الحقوق محفوظة.'),
'fr':dict(dir='ltr',font="'Plus Jakarta Sans', system-ui, sans-serif",fontlink='family=Plus+Jakarta+Sans:wght@400;600;700;800',tag='FR',
 title='Bhumi Varahi Impex | Exportateur de riz basmati et d’épices indiennes',
 desc='Exportateur indien de riz basmati et non basmati et d’épices. Prix FOB et CIF, emballage à votre marque, expédition depuis les ports de l’est de l’Inde.',
 nav_products='Produits',nav_order='Commander',nav_quote='Demander un devis',
 kicker='Votre partenaire commercial en Inde',h1='Riz et épices indiennes à l’export',
 lead='Nous fournissons du riz basmati et non basmati et des épices indiennes, issus de rizeries et d’usines fiables, expédiés FOB ou CIF vers l’Afrique, le Moyen-Orient et l’Europe.',
 cta_quote='Demander un devis',cta_wa='Écrire sur WhatsApp',
 wa_msg='Bonjour Bhumi Varahi Impex, je souhaite recevoir un devis.',
 about_h='Qui sommes-nous',about='Bhumi Varahi Impex Private Limited est une société d’export indienne enregistrée auprès du ministère des Affaires des sociétés (MCA). Nous mettons en relation les importateurs du monde entier avec des rizeries et des usines d’épices en Inde, et nous gérons le contrôle qualité, l’emballage, les documents et l’expédition depuis Kakinada, Visakhapatnam et Chennai.',
 why=[('Directement à la source','Relations directes avec les rizeries et les transformateurs des principales régions de production.'),('Qualité contrôlée','Chaque lot est vérifié selon les spécifications du contrat, avec inspection par un tiers (SGS) sur demande.'),('Votre marque','Emballage à votre marque, en formats détail et vrac.'),('Réponse en 24 h','Nous envoyons généralement le devis sous 24 heures ouvrées.')],
 prod_h='Nos produits',prod_note='Les fiches techniques détaillées sont disponibles en anglais.',
 groups=['Riz basmati','Riz aromatique à grain long','Riz non basmati','Épices'],
 cat_btn='Télécharger le catalogue (PDF, en anglais)',
 order_h='Comment commander',steps=['Envoyez votre besoin : produit, quantité, port de destination et emballage.','Nous vous envoyons un prix FOB, CFR ou CIF.','Nous envoyons un échantillon du lot pour approbation, sur demande.','Confirmation du contrat et du paiement (lettre de crédit ou virement), puis expédition avec tous les documents.'],
 form_h='Demander un devis',form_sub='Remplissez le formulaire : notre service export vous répond sous 24 heures ouvrées.',
 f_name='Société / Acheteur *',f_email='E-mail professionnel *',f_comm='Produit',f_qty='Quantité',f_country='Pays de destination',f_phone='Téléphone / WhatsApp',f_notes='Port de destination, emballage et remarques',
 ph_name='ex. Société Diallo Import SARL',ph_qty='ex. 500 t (20 conteneurs)',ph_country='ex. Sénégal',ph_notes='ex. Dakar, sacs PP de 50 kg',
 submit='Envoyer la demande',sending='Envoi...',ok_t='Demande reçue',ok_b='Merci. Notre service export vous enverra un devis rapidement, et un e-mail de confirmation vous a été envoyé.',err_t='Envoi impossible',err_b='Merci de nous écrire directement à info@bhumivarahiimpex.com',
 contact_h='Contact',hours='Horaires : 10 h – 16 h (heure de l’Inde)',email_l='E-mail',wa_l='Téléphone / WhatsApp',ports_l='Ports de chargement',ports='Kakinada, Visakhapatnam, Chennai',
 english='English',rights='© 2026 Bhumi Varahi Impex Private Limited. Tous droits réservés.'),
}
groups=[('rice',BASMATI),('rice',AROMATIC),('rice',NONBAS),('spices',SPICES)]
e=html.escape
def page(code,t):
    other='fr' if code=='ar' else 'ar'
    alt=''.join(f'  <link rel="alternate" hreflang="{h}" href="{SITE}{u}" />\n' for h,u in [('en','/'),('ar','/ar/'),('fr','/fr/'),('x-default','/')])
    why=''.join(f'<div class="bg-white rounded-2xl border border-gray-200 p-6"><h3 class="font-bold text-slate-900 text-lg">{e(a)}</h3><p class="text-slate-600 mt-2 text-sm leading-relaxed">{e(b)}</p></div>' for a,b in t['why'])
    prods=''
    for (cat,items),gname in zip(groups,t['groups']):
        li=''.join(f'<li><a href="/{cat}/{p["slug"]}/" hreflang="en" class="text-brand-agriGreen hover:underline underline-offset-4">{e(p["name"])}</a></li>' for p in items)
        prods+=f'<div class="bg-white rounded-2xl border border-gray-200 p-6"><h3 class="font-bold text-slate-900 text-lg mb-3">{e(gname)}</h3><ul class="space-y-1.5 text-sm" dir="ltr">{li}</ul></div>'
    opts=''.join(f'<optgroup label="{e(g)}">'+''.join(f'<option value="{e(p["name"])}">{e(p["name"])}</option>' for p in items)+'</optgroup>' for (c,items),g in zip(groups,t['groups']))
    steps=''.join(f'<li class="flex gap-4"><span class="flex-none w-9 h-9 rounded-full bg-brand-warmGold text-slate-950 font-bold flex items-center justify-center">{i+1}</span><p class="pt-1.5 text-slate-700">{e(s)}</p></li>' for i,s in enumerate(t['steps']))
    wa=f"https://wa.me/919492992666?text={quote(t['wa_msg'])}"
    inp='w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-emerald-200/50 focus:outline-none focus:border-brand-warmGold text-sm'
    lab='block text-sm font-semibold text-emerald-100 mb-2'
    def field(id_,name,label,typ='text',ph='',req=False,ac=''):
        return f'<div><label for="{id_}" class="{lab}">{e(label)}</label><input type="{typ}" id="{id_}" name="{name}" {"required" if req else ""} {f"autocomplete={chr(34)}{ac}{chr(34)}" if ac else ""} placeholder="{e(ph)}" class="{inp}" /></div>'
    return f'''<!DOCTYPE html>
<html lang="{code}" dir="{t['dir']}" class="scroll-smooth">
<head>
  <meta charset="UTF-8" />
{G_TAG}  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{e(t['title'])}</title>
  <meta name="description" content="{e(t['desc'])}" />
  <link rel="canonical" href="{SITE}/{code}/" />
{alt}  <meta name="theme-color" content="#1B4D3E" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="{'ar_AE' if code=='ar' else 'fr_FR'}" />
  <meta property="og:title" content="{e(t['title'])}" />
  <meta property="og:description" content="{e(t['desc'])}" />
  <meta property="og:url" content="{SITE}/{code}/" />
  <meta property="og:image" content="{SITE}/og-image.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?{t['fontlink']}&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/styles.css" />
  <style>
    body{{font-family:{t['font']}}}
    .wa-float{{position:fixed;{'left' if t['dir']=='rtl' else 'right'}:20px;bottom:20px;z-index:45;width:56px;height:56px;border-radius:9999px;background:#25D366;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.25)}}
    .wa-float:focus-visible{{outline:3px solid #E5C158;outline-offset:3px}}
    select option, select optgroup{{color:#fff;background:#0f172a}}
  </style>
</head>
<body class="bg-slate-50 text-slate-800 antialiased">
  <header class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-2 border-brand-agriGreen/20 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3">
      <a href="/{code}/" aria-label="Bhumi Varahi Impex"><img src="/images/logo.png" alt="Bhumi Varahi Impex Private Limited" width="560" height="160" class="h-9 sm:h-14 w-auto"></a>
      <nav class="flex items-center gap-3 sm:gap-6 text-sm font-semibold text-slate-700" aria-label="Main">
        <a href="#products" class="hidden md:inline hover:text-brand-agriGreen">{e(t['nav_products'])}</a>
        <a href="#order" class="hidden md:inline hover:text-brand-agriGreen">{e(t['nav_order'])}</a>
        <span class="flex items-center gap-2 text-xs"><a href="/" lang="en" hreflang="en" class="hover:text-brand-agriGreen">EN</a><span aria-hidden="true">·</span><a href="/{other}/" lang="{other}" hreflang="{other}" class="hover:text-brand-agriGreen">{L[other]['tag']}</a></span>
        <a href="#rfq" class="inline-flex whitespace-nowrap bg-brand-agriGreen hover:bg-brand-darkGreen text-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-full border border-brand-warmGold/40">{e(t['nav_quote'])}</a>
      </nav>
    </div>
  </header>
  <main id="main">
    <section class="bg-brand-darkGreen text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 space-y-6">
        <span class="text-brand-goldLight font-bold text-sm tracking-wide">{e(t['kicker'])}</span>
        <h1 class="text-4xl sm:text-6xl font-extrabold leading-tight max-w-4xl">{e(t['h1'])}</h1>
        <p class="text-emerald-100 text-lg max-w-3xl leading-relaxed">{e(t['lead'])}</p>
        <div class="flex flex-col sm:flex-row gap-3 pt-2">
          <a href="#rfq" class="inline-flex justify-center bg-brand-warmGold hover:bg-yellow-500 text-slate-950 font-bold px-7 py-3.5 rounded-xl">{e(t['cta_quote'])}</a>
          <a href="{wa}" target="_blank" rel="noopener" class="inline-flex justify-center bg-white/10 hover:bg-white/20 text-white font-semibold px-7 py-3.5 rounded-xl border border-white/30">{e(t['cta_wa'])}</a>
        </div>
      </div>
    </section>
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 class="text-3xl font-extrabold text-slate-900 mb-4">{e(t['about_h'])}</h2>
      <p class="text-slate-700 leading-relaxed max-w-4xl text-lg">{e(t['about'])}</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">{why}</div>
    </section>
    <section id="products" class="bg-slate-100/70 py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-extrabold text-slate-900">{e(t['prod_h'])}</h2>
        <p class="text-slate-600 mt-2 mb-8 text-sm">{e(t['prod_note'])}</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">{prods}</div>
        <a href="{CAT}" download class="inline-flex mt-8 bg-brand-agriGreen hover:bg-brand-darkGreen text-white font-semibold px-6 py-3 rounded-xl">{e(t['cat_btn'])}</a>
      </div>
    </section>
    <section id="order" class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 class="text-3xl font-extrabold text-slate-900 mb-8">{e(t['order_h'])}</h2>
      <ol class="space-y-5">{steps}</ol>
    </section>
    <section id="rfq" class="bg-brand-darkGreen text-white py-16">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl font-extrabold">{e(t['form_h'])}</h2>
        <p class="text-emerald-100 mt-2 mb-8">{e(t['form_sub'])}</p>
        <form id="rfqForm" class="rounded-2xl p-6 sm:p-8 space-y-6 bg-white/5 border border-white/10">
          <input type="checkbox" name="botcheck" class="hidden" tabindex="-1" autocomplete="off" />
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {field('buyerName','name',t['f_name'],ph=t['ph_name'],req=True,ac='organization')}
            {field('buyerEmail','email',t['f_email'],typ='email',ph='procurement@buyer.com',req=True,ac='email')}
            <div><label for="commoditySelect" class="{lab}">{e(t['f_comm'])}</label><select id="commoditySelect" name="commodity" class="w-full px-4 py-3 rounded-lg bg-slate-900 border border-white/20 text-white text-sm" dir="ltr">{opts}</select></div>
            {field('quantity','quantity',t['f_qty'],ph=t['ph_qty'])}
            {field('country','country',t['f_country'],ph=t['ph_country'],ac='country-name')}
            {field('phone','phone',t['f_phone'],typ='tel',ph='+971 50 123 4567',ac='tel')}
          </div>
          <div><label for="rfqNotes" class="{lab}">{e(t['f_notes'])}</label><textarea id="rfqNotes" name="notes" rows="3" placeholder="{e(t['ph_notes'])}" class="{inp}"></textarea></div>
          <button type="submit" id="rfqSubmit" class="w-full disabled:opacity-60 py-4 bg-brand-warmGold hover:bg-yellow-500 text-slate-950 font-bold rounded-xl text-base">{e(t['submit'])}</button>
          <div id="formMsg" role="status" aria-live="polite" class="hidden rounded-xl p-4 text-sm"></div>
        </form>
      </div>
    </section>
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 class="text-3xl font-extrabold text-slate-900 mb-8">{e(t['contact_h'])}</h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div class="bg-white rounded-2xl border border-gray-200 p-6"><h3 class="font-bold text-slate-900">{e(t['email_l'])}</h3><a href="mailto:info@bhumivarahiimpex.com" class="text-brand-agriGreen font-semibold break-all" dir="ltr">info@bhumivarahiimpex.com</a></div>
        <div class="bg-white rounded-2xl border border-gray-200 p-6"><h3 class="font-bold text-slate-900">{e(t['wa_l'])}</h3><a href="{wa}" target="_blank" rel="noopener" class="text-brand-agriGreen font-semibold" dir="ltr">+91 94929 92666</a><p class="text-xs text-slate-600 mt-1">{e(t['hours'])}</p></div>
        <div class="bg-white rounded-2xl border border-gray-200 p-6"><h3 class="font-bold text-slate-900">{e(t['ports_l'])}</h3><p class="text-slate-700">{e(t['ports'])}</p></div>
      </div>
    </section>
  </main>
  <footer class="bg-slate-950 text-slate-400 py-10 text-sm text-center border-t-2 border-brand-agriGreen">
    <p>{e(t['rights'])}</p>
    <p class="mt-2"><a href="/" lang="en" class="hover:text-white underline underline-offset-4">{e(t['english'])}</a></p>
    <a href="{wa}" class="wa-float" target="_blank" rel="noopener" aria-label="WhatsApp">{WAICON}</a>
  </footer>
  <script>
    const SHEETS_URL = '{SHEETS_URL}';
    const f = document.getElementById('rfqForm'), btn = document.getElementById('rfqSubmit'), msg = document.getElementById('formMsg');
    const show = (ok, t, b) => {{ msg.className = 'rounded-xl p-4 text-sm ' + (ok ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'); msg.innerHTML = ''; const s = document.createElement('strong'); s.textContent = t; msg.append(s, document.createElement('br'), b); }};
    f.addEventListener('submit', async (ev) => {{
      ev.preventDefault();
      const data = new FormData(f);
      if (data.get('botcheck')) return;
      data.set('notes', '[{t['tag']}] ' + (data.get('notes') || ''));
      btn.disabled = true; btn.textContent = {json.dumps(t['sending'],ensure_ascii=False)};
      try {{
        await fetch(SHEETS_URL, {{ method: 'POST', mode: 'no-cors', body: new URLSearchParams(data) }});
        if (window.gtag) gtag('event', 'generate_lead', {{ commodity: data.get('commodity'), method: 'rfq_form_{code}' }});
        show(true, {json.dumps(t['ok_t'],ensure_ascii=False)}, {json.dumps(t['ok_b'],ensure_ascii=False)});
        f.reset();
      }} catch (err) {{
        show(false, {json.dumps(t['err_t'],ensure_ascii=False)}, {json.dumps(t['err_b'],ensure_ascii=False)});
      }} finally {{
        btn.disabled = false; btn.textContent = {json.dumps(t['submit'],ensure_ascii=False)};
      }}
    }});
  </script>
</body>
</html>
'''
for code,t in L.items():
    os.makedirs(f'{ROOT}/{code}',exist_ok=True)
    open(f'{ROOT}/{code}/index.html','w').write(page(code,t))
print('lang pages ok')
