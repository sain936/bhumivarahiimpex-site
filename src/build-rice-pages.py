import json, os, html
import pathlib; ROOT=str(pathlib.Path(__file__).resolve().parent.parent)
SITE='https://www.bhumivarahiimpex.com'
WA='https://wa.me/919492992666?text='
from urllib.parse import quote
WAICON='<svg class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 01-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 01-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43 2.52 0 4.89.98 6.67 2.77a9.37 9.37 0 012.76 6.67c0 5.2-4.24 9.43-9.44 9.43zm8.03-17.46A11.27 11.27 0 0012.05.72C5.8.72.7 5.8.7 12.06c0 2 .52 3.95 1.52 5.67L.6 23.6l6.01-1.58a11.32 11.32 0 005.43 1.38h.01c6.25 0 11.34-5.09 11.34-11.34 0-3.03-1.18-5.88-3.32-8.02z"/></svg>'
RICE_IMG='https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=1200&q=80'

def shell(path, title, desc, crumbs, body, ld):
    canon=SITE+path
    bc={"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":i+1,"name":n,"item":SITE+u} for i,(n,u) in enumerate(crumbs)]}
    crumbs_html=' <span aria-hidden="true">/</span> '.join(
        (f'<a href="{u}" class="hover:text-brand-agriGreen underline-offset-4 hover:underline">{html.escape(n)}</a>' if i<len(crumbs)-1 else f'<span aria-current="page" class="text-slate-900 font-semibold">{html.escape(n)}</span>')
        for i,(n,u) in enumerate(crumbs))
    lds=''.join(f'\n  <script type="application/ld+json">{json.dumps(x,ensure_ascii=False)}</script>' for x in [bc]+ld)
    return f'''<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{html.escape(title)}</title>
  <meta name="description" content="{html.escape(desc)}" />
  <link rel="canonical" href="{canon}" />
  <meta name="theme-color" content="#1B4D3E" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Bhumi Varahi Impex Pvt. Ltd." />
  <meta property="og:title" content="{html.escape(title)}" />
  <meta property="og:description" content="{html.escape(desc)}" />
  <meta property="og:url" content="{canon}" />
  <meta property="og:image" content="{SITE}/og-image.png" />
  <meta name="twitter:card" content="summary_large_image" />{lds}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Montserrat:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/styles.css" />
  <style>
    .font-cinzel {{ font-family: 'Playfair Display', Georgia, serif; }}
    .font-montserrat {{ font-family: 'Montserrat', sans-serif; }}
    body {{ font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }}
    .wa-float{{position:fixed;right:20px;bottom:20px;z-index:45;width:56px;height:56px;border-radius:9999px;background:#25D366;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.25);transition:transform .2s}}
    .wa-float:hover{{transform:scale(1.08)}}
    .wa-float:focus-visible{{outline:3px solid #E5C158;outline-offset:3px}}
    .spec-table tr:nth-child(even){{background:#f8fafc}}
  </style>
</head>
<body class="bg-slate-50 text-slate-800 antialiased">
  <a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:bg-white focus:text-brand-agriGreen focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg font-semibold">Skip to content</a>
  <header class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-2 border-brand-agriGreen/20 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
      <a href="/" aria-label="Bhumi Varahi Impex home"><img src="/images/logo.png" alt="Bhumi Varahi Impex Private Limited" width="560" height="160" class="h-12 sm:h-14 w-auto"></a>
      <nav class="flex items-center gap-4 sm:gap-6 text-sm font-semibold text-slate-700" aria-label="Main">
        <a href="/rice/" class="hidden sm:inline hover:text-brand-agriGreen">Rice Range</a>
        <a href="/#faq" class="hidden md:inline hover:text-brand-agriGreen">FAQ</a>
        <a href="/#rfq" class="inline-flex items-center bg-brand-agriGreen hover:bg-brand-darkGreen text-white px-4 sm:px-5 py-2.5 rounded-full border border-brand-warmGold/40">Get a Quote</a>
      </nav>
    </div>
  </header>
  <main id="main">
    <nav aria-label="Breadcrumb" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 text-sm text-slate-600">{crumbs_html}</nav>
{body}
  </main>
  <footer class="bg-slate-950 text-slate-400 py-12 mt-16 border-t-2 border-brand-agriGreen text-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="space-y-2">
        <p class="text-white font-bold font-cinzel text-lg">Bhumi Varahi Impex Pvt. Ltd.</p>
        <p class="text-xs leading-relaxed">Merchant exporters of Indian rice, shipping from Kakinada, Visakhapatnam and Chennai.</p>
      </div>
      <div>
        <h2 class="text-white font-bold text-xs uppercase tracking-wider mb-3 font-montserrat">Rice Range</h2>
        <ul class="space-y-1.5 text-xs">
          <li><a href="/rice/1121-basmati-rice/" class="hover:text-white">1121 Basmati Rice</a></li>
          <li><a href="/rice/1010-non-basmati-rice/" class="hover:text-white">1010 Non-Basmati Rice</a></li>
          <li><a href="/rice/" class="hover:text-white">All rice varieties</a></li>
        </ul>
      </div>
      <div class="text-xs space-y-1">
        <h2 class="text-white font-bold text-xs uppercase tracking-wider mb-3 font-montserrat">Export Desk</h2>
        <p class="text-white font-semibold">Email: <a href="mailto:info@bhumivarahiimpex.com" class="hover:underline">info@bhumivarahiimpex.com</a></p>
        <p class="text-white font-semibold">Phone / WhatsApp: <a href="tel:+919492992666" class="hover:underline">+91 94929 92666</a></p>
        <p>Desk hours: 10 AM – 4 PM IST</p>
      </div>
    </div>
    <p class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 pt-6 border-t border-slate-900 text-center text-xs">&copy; 2026 Bhumi Varahi Impex Private Limited. All Rights Reserved.</p>
    <a href="{WA}{quote('Hello Bhumi Varahi Impex, I would like a quotation for rice.')}" class="wa-float" target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp">{WAICON}</a>
  </footer>
</body>
</html>
'''

def quote_btns(commodity, label):
    q='/?commodity='+quote(commodity)+'#rfq'
    w=WA+quote(f'Hello Bhumi Varahi Impex, I would like a quotation for {label}.')
    return f'''<div class="flex flex-col sm:flex-row gap-3">
          <a href="{q}" class="inline-flex justify-center items-center bg-brand-warmGold hover:bg-yellow-500 text-slate-950 font-bold px-7 py-3.5 rounded-xl shadow whitespace-nowrap">Get a quote</a>
          <a href="{w}" target="_blank" rel="noopener" class="inline-flex justify-center items-center bg-white/10 hover:bg-white/20 text-white font-semibold px-7 py-3.5 rounded-xl border border-white/30 whitespace-nowrap">Ask on WhatsApp</a>
        </div>'''

def table(rows):
    return '<table class="spec-table w-full text-sm border border-gray-200 rounded-xl overflow-hidden bg-white"><tbody>'+''.join(
        f'<tr class="border-b border-gray-100"><th scope="row" class="text-left font-semibold text-slate-700 px-4 py-3 w-1/2 align-top">{html.escape(k)}</th><td class="px-4 py-3 text-slate-900">{html.escape(v)}</td></tr>' for k,v in rows)+'</tbody></table>'

def faq_block(faqs):
    items=''.join(f'<details class="group bg-white border border-gray-200 rounded-xl p-5"><summary class="font-semibold text-slate-900 cursor-pointer">{html.escape(q)}</summary><p class="mt-3 text-slate-600 text-sm leading-relaxed">{html.escape(a)}</p></details>' for q,a in faqs)
    ld={"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in faqs]}
    return items, ld

NOTE='<p class="text-xs text-slate-500 mt-3">Typical export specifications. Final specifications, inspection and tolerances are agreed in each contract.</p>'

def product(slug, name, commodity, tagline, intro, variants, specs, packing, logistics, faqs, desc):
    items, fld = faq_block(faqs)
    var=''.join(f'<div class="bg-white border border-gray-200 rounded-xl p-5"><h3 class="font-bold text-slate-900">{html.escape(t)}</h3><p class="text-sm text-slate-600 mt-1 leading-relaxed">{html.escape(d)}</p></div>' for t,d in variants)
    body=f'''
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <div class="rounded-3xl overflow-hidden bg-brand-darkGreen text-white grid grid-cols-1 lg:grid-cols-2">
        <div class="p-8 sm:p-12 space-y-5">
          <span class="text-brand-goldLight font-bold text-xs uppercase tracking-widest font-montserrat">Indian Rice Export</span>
          <h1 class="text-3xl sm:text-5xl font-cinzel font-bold leading-tight">{html.escape(name)}</h1>
          <p class="text-emerald-100 text-lg">{html.escape(tagline)}</p>
          {quote_btns(commodity, name)}
        </div>
        <img src="{RICE_IMG}" alt="Close-up of long-grain white rice" width="1200" height="800" class="w-full h-64 lg:h-full object-cover bg-brand-agriGreen">
      </div>
    </section>
    <section class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 space-y-4 text-slate-700 leading-relaxed">
      {''.join(f'<p>{html.escape(p)}</p>' for p in intro)}
    </section>
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
      <h2 class="text-2xl sm:text-3xl font-cinzel font-bold text-slate-900 mb-6">Available types</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">{var}</div>
    </section>
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 grid grid-cols-1 lg:grid-cols-2 gap-10">
      <div>
        <h2 class="text-2xl sm:text-3xl font-cinzel font-bold text-slate-900 mb-6">Specifications</h2>
        {table(specs)}
        {NOTE}
      </div>
      <div class="space-y-10">
        <div>
          <h2 class="text-2xl sm:text-3xl font-cinzel font-bold text-slate-900 mb-6">Packing options</h2>
          {table(packing)}
        </div>
        <div>
          <h2 class="text-2xl sm:text-3xl font-cinzel font-bold text-slate-900 mb-6">Shipping</h2>
          {table(logistics)}
        </div>
      </div>
    </section>
    <section class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
      <h2 class="text-2xl sm:text-3xl font-cinzel font-bold text-slate-900 mb-6">Frequently asked questions</h2>
      <div class="space-y-3">{items}</div>
    </section>
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
      <div class="rounded-3xl bg-brand-agriGreen text-white p-8 sm:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 class="text-2xl sm:text-3xl font-cinzel font-bold">Need a price for {html.escape(name)}?</h2>
          <p class="text-emerald-100 mt-2">Tell us the quantity, destination port and packing. Our export desk replies within 24 business hours.</p>
        </div>
        {quote_btns(commodity, name)}
      </div>
    </section>'''
    prod={"@context":"https://schema.org","@type":"Product","name":name,"description":desc,"category":"Rice","image":RICE_IMG,
          "brand":{"@type":"Brand","name":"Bhumi Varahi Impex"},"countryOfOrigin":"IN",
          "manufacturer":{"@type":"Organization","name":"Bhumi Varahi Impex Private Limited","url":SITE+"/"}}
    path=f'/rice/{slug}/'
    out=shell(path, f'{name} Exporter from India | Bhumi Varahi Impex', desc,
              [('Home','/'),('Rice','/rice/'),(name,path)], body, [fld])
    os.makedirs(ROOT+path,exist_ok=True); open(ROOT+path+'index.html','w').write(out)

product('1121-basmati-rice','1121 Basmati Rice','1121 Basmati Rice',
 'Extra-long grain basmati in Steam, Sella and Raw, packed to your brand.',
 ['1121 is the longest-grain basmati variety grown in India. Each grain stretches to around two and a half times its length when cooked, stays separate and carries the natural basmati aroma. That makes it the first choice for biryani, pulao and restaurant use across the Gulf, Middle East and Africa.',
  'We source 1121 from established mills, check every lot against the agreed specification before loading, and ship in your choice of bag size and private-label print.'],
 [('1121 Steam','Steam-processed for a firm, non-sticky cooked grain with a creamy white colour. Popular with restaurants and retail.'),
  ('1121 Golden Sella','Parboiled for a golden colour and maximum grain strength through cooking. The favourite for Gulf biryani.'),
  ('1121 White Sella / Raw','White Sella (parboiled, white colour) and Raw (unprocessed) for buyers who want a softer texture or fresher aroma.')],
 [('Average grain length (before cooking)','8.30 – 8.40 mm'),('Average grain length (after cooking)','18 – 22 mm'),('Moisture','12 – 13% max'),
  ('Broken grains','1 – 2% max'),('Damaged / discoloured grains','1% max'),('Chalky grains','1% max'),('Purity (1121 variety)','95% min'),
  ('Foreign matter','Nil'),('Polish','Double / silky sortex cleaned'),('HS code','1006 30 20')],
 [('Bag sizes','1 kg, 5 kg, 10 kg, 20 kg, 25 kg, 39 kg, 40 kg, 50 kg'),('Bag types','PP woven, BOPP printed, non-woven, jute'),
  ('Private label','Available, with your brand artwork'),('Retail packs','On request')],
 [('Incoterms','FOB, CFR, CIF'),('Ports of loading','Kakinada, Visakhapatnam, Chennai'),('20 ft container','About 24 – 25 MT'),
  ('Documents','Commercial invoice, packing list, certificate of origin, phytosanitary certificate, third-party inspection (SGS or similar) on request')],
 [('What is the minimum order for 1121 Basmati?','Our standard minimum is one 20 ft container, about 24 – 25 MT. Smaller trial lots can be discussed for new buyers.'),
  ('Can you pack under our own brand?','Yes. We can print your brand on BOPP or non-woven bags in any of the standard sizes.'),
  ('Which type is best for biryani?','1121 Golden Sella is the most popular for biryani in the Gulf, because the grains stay long and separate after cooking. 1121 Steam is preferred where a whiter grain is wanted.'),
  ('Can I get a sample before ordering?','Yes. We can courier a sample of the exact lot for your approval before the contract is confirmed.')],
 'Export-grade 1121 Basmati Rice (Steam, Golden Sella, White Sella, Raw) from India. 8.30 mm+ average grain length, private-label packing, FOB / CIF from Indian ports.')

product('1010-non-basmati-rice','1010 Non-Basmati Rice','1010 Non-Basmati Rice',
 'Long-grain parboiled and raw rice from Andhra Pradesh, at a dependable everyday price.',
 ['1010 is a long-grain non-basmati rice grown widely in Andhra Pradesh and Telangana, close to our loading ports. It gives buyers a reliable, affordable everyday rice for wholesale, food service and government or institutional tenders.',
  'Because the growing area sits near Kakinada and Visakhapatnam ports, we can move 1010 quickly from mill to vessel. We offer it as parboiled or raw, in 5%, 25% or 100% broken grades.'],
 [('1010 Parboiled','Parboiled for a firm, separate grain and longer shelf life. Popular across West and East Africa.'),
  ('1010 Raw (White)','Milled and polished white rice for buyers who prefer a softer texture.'),
  ('Broken grades','5%, 25% and 100% broken, for price-sensitive markets and food processing.')],
 [('Average grain length','5.8 – 6.0 mm'),('Moisture','14% max'),('Broken grains','5% / 25% / 100% (as ordered)'),
  ('Damaged / discoloured grains','1 – 2% max'),('Chalky grains','5% max'),('Red / striped grains','2% max'),('Foreign matter','0.1% max'),
  ('Polish','Double polished, sortex cleaned'),('HS code','1006 30 10 (parboiled) / 1006 30 90 (raw)')],
 [('Bag sizes','25 kg, 50 kg'),('Bag types','PP woven, BOPP printed, jute'),('Private label','Available, with your brand artwork'),('Bulk','Breakbulk vessel loads on request')],
 [('Incoterms','FOB, CFR, CIF'),('Ports of loading','Kakinada, Visakhapatnam, Chennai'),('20 ft container','About 26 – 27 MT'),
  ('Documents','Commercial invoice, packing list, certificate of origin, phytosanitary certificate, fumigation certificate, third-party inspection (SGS or similar) on request')],
 [('What is the minimum order for 1010 rice?','One 20 ft container, about 26 – 27 MT. Larger volumes and breakbulk vessel loads are also available.'),
  ('Parboiled or raw: which should I choose?','Parboiled keeps the grains firm and separate and stores longer, so it is the most popular choice in Africa. Raw white rice is softer and is often chosen for domestic retail.'),
  ('Which ports do you ship from?','Mainly Kakinada and Visakhapatnam, which are closest to the 1010 growing area, as well as Chennai.'),
  ('Can I get a sample before ordering?','Yes. We can courier a sample of the exact lot for your approval before the contract is confirmed.')],
 'Export-grade 1010 Non-Basmati Rice (parboiled and raw, 5% / 25% / 100% broken) from Andhra Pradesh, India. 25 / 50 kg bags, FOB / CIF from Kakinada and Visakhapatnam.')

# Hub
cards=[('1121 Basmati Rice','/rice/1121-basmati-rice/','Extra-long grain basmati in Steam, Golden Sella, White Sella and Raw.','8.30 mm+ grain · 1–50 kg bags'),
       ('1010 Non-Basmati Rice','/rice/1010-non-basmati-rice/','Long-grain parboiled and raw rice from Andhra Pradesh, in 5%, 25% and 100% broken.','25 / 50 kg bags · 26–27 MT per 20 ft')]
ch=''.join(f'''<a href="{u}" class="group bg-white rounded-2xl border border-gray-200 hover:border-brand-agriGreen hover:shadow-lg transition overflow-hidden flex flex-col">
          <img src="{RICE_IMG}" alt="" width="1200" height="800" loading="lazy" class="h-48 w-full object-cover bg-brand-agriGreen">
          <div class="p-6 flex-1 flex flex-col">
            <h2 class="text-xl font-cinzel font-bold text-slate-900">{n}</h2>
            <p class="text-sm text-slate-600 mt-2 flex-1">{d}</p>
            <p class="text-xs font-bold text-brand-agriGreen bg-emerald-100/70 inline-block px-3 py-1 rounded mt-4 self-start">{t}</p>
            <span class="mt-5 font-semibold text-brand-agriGreen group-hover:underline underline-offset-4">View specifications &rarr;</span>
          </div>
        </a>''' for n,u,d,t in cards)
hub=f'''
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <div class="rounded-3xl bg-brand-darkGreen text-white p-8 sm:p-12 space-y-4">
        <span class="text-brand-goldLight font-bold text-xs uppercase tracking-widest font-montserrat">Our Rice Range</span>
        <h1 class="text-3xl sm:text-5xl font-cinzel font-bold">Indian Rice for Export</h1>
        <p class="text-emerald-100 text-lg max-w-3xl">Basmati and non-basmati rice sourced from established Indian mills, checked against your specification and shipped FOB or CIF from Kakinada, Visakhapatnam and Chennai.</p>
      </div>
    </section>
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">{ch}</div>
    </section>
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
      <div class="bg-white border border-gray-200 rounded-2xl p-8">
        <h2 class="text-2xl font-cinzel font-bold text-slate-900">Looking for another variety?</h2>
        <p class="text-slate-600 mt-2">We can also source other Indian varieties on request, such as Sona Masoori, IR 64, Swarna, Ponni, 1509 and Pusa Basmati. Tell us what you need and we will check availability and price.</p>
        <a href="/?commodity={quote('1010 Non-Basmati Rice')}#rfq" class="inline-flex mt-5 bg-brand-agriGreen hover:bg-brand-darkGreen text-white font-semibold px-6 py-3 rounded-xl">Send a request</a>
      </div>
    </section>'''
coll={"@context":"https://schema.org","@type":"ItemList","itemListElement":[{"@type":"ListItem","position":i+1,"url":SITE+u,"name":n} for i,(n,u,_,_) in enumerate(cards)]}
os.makedirs(ROOT+'/rice',exist_ok=True)
open(ROOT+'/rice/index.html','w').write(shell('/rice/','Indian Rice Exporter: Basmati & Non-Basmati | Bhumi Varahi Impex',
 'Export 1121 Basmati and 1010 Non-Basmati rice from India. Specifications, packing and FOB / CIF shipping from Kakinada, Visakhapatnam and Chennai.',
 [('Home','/'),('Rice','/rice/')], hub, [coll]))
print('ok')
