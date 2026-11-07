import json, os, html
import pathlib; ROOT=os.environ.get('SITE_ROOT') or str(pathlib.Path(__file__).resolve().parent.parent.parent)
SITE='https://www.bhumivarahiimpex.com'
WA='https://wa.me/919492992666?text='
from urllib.parse import quote
WAICON='<svg class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 01-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 01-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43 2.52 0 4.89.98 6.67 2.77a9.37 9.37 0 012.76 6.67c0 5.2-4.24 9.43-9.44 9.43zm8.03-17.46A11.27 11.27 0 0012.05.72C5.8.72.7 5.8.7 12.06c0 2 .52 3.95 1.52 5.67L.6 23.6l6.01-1.58a11.32 11.32 0 005.43 1.38h.01c6.25 0 11.34-5.09 11.34-11.34 0-3.03-1.18-5.88-3.32-8.02z"/></svg>'
G_TAG='  <!-- Google Analytics 4 -->\n  <script async src="https://www.googletagmanager.com/gtag/js?id=G-822DQESRXK"></script>\n  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag(\'js\',new Date());gtag(\'config\',\'G-822DQESRXK\');\n  document.addEventListener(\'click\',function(e){var a=e.target.closest&&e.target.closest(\'a[href*="wa.me"]\');if(a)gtag(\'event\',\'whatsapp_click\',{link_url:a.href,page_path:location.pathname});});</script>\n'
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
  <!-- Google Analytics 4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-822DQESRXK"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments);}}gtag('js',new Date());gtag('config','G-822DQESRXK');
  document.addEventListener('click',function(e){{var a=e.target.closest&&e.target.closest('a[href*="wa.me"]');if(a)gtag('event','whatsapp_click',{{link_url:a.href,page_path:location.pathname}});}});</script>
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
        <a href="/rice/" class="hidden sm:inline hover:text-brand-agriGreen">Rice</a>
        <a href="/spices/" class="hidden sm:inline hover:text-brand-agriGreen">Spices</a>
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
        <p class="text-xs leading-relaxed">Merchant exporters of Indian rice and spices, shipping from Kakinada, Visakhapatnam and Chennai.</p>
      </div>
      <div>
        <h2 class="text-white font-bold text-xs uppercase tracking-wider mb-3 font-montserrat">Products</h2>
        <ul class="space-y-1.5 text-xs">
          <li><a href="/rice/" class="hover:text-white">Basmati &amp; non-basmati rice</a></li>
          <li><a href="/spices/" class="hover:text-white">Indian spices</a></li>
          <li><a href="/#rfq" class="hover:text-white">Request a quotation</a></li>
          <li><a href="/catalogue/Bhumi-Varahi-Impex-Catalogue-2026.pdf" download class="hover:text-white">Download catalogue (PDF)</a></li>
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
    <a href="{WA}{quote('Hello Bhumi Varahi Impex, I would like a quotation.')}" class="wa-float" target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp">{WAICON}</a>
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


CATS={
 'rice':{'title':'Rice','kicker':'Indian Rice Export','img':RICE_IMG,'alt':'Close-up of long-grain white rice',
   'note':'Typical export specifications. Final specifications, inspection and tolerances are agreed in each contract.'},
 'spices':{'title':'Spices','kicker':'Indian Spice Export','img':'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=80','alt':'Bowls of whole and ground Indian spices',
   'note':'Typical export specifications. Final specifications, lab analysis and tolerances are agreed in each contract.'},
}

def product(cat, p):
    C=CATS[cat]; name=p['name']
    items, fld = faq_block(p['faqs'])
    var=''.join(f'<div class="bg-white border border-gray-200 rounded-xl p-5"><h3 class="font-bold text-slate-900">{html.escape(t)}</h3><p class="text-sm text-slate-600 mt-1 leading-relaxed">{html.escape(d)}</p></div>' for t,d in p['types'])
    cols='md:grid-cols-3' if len(p['types'])%3==0 else 'md:grid-cols-2'
    body=f'''
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <div class="rounded-3xl overflow-hidden bg-brand-darkGreen text-white grid grid-cols-1 lg:grid-cols-2">
        <div class="p-8 sm:p-12 space-y-5">
          <span class="text-brand-goldLight font-bold text-xs uppercase tracking-widest font-montserrat">{C['kicker']}</span>
          <h1 class="text-3xl sm:text-5xl font-cinzel font-bold leading-tight">{html.escape(name)}</h1>
          <p class="text-emerald-100 text-lg">{html.escape(p['tagline'])}</p>
          {quote_btns(name, name)}
        </div>
        <img src="{C['img']}" alt="{C['alt']}" width="1200" height="800" class="w-full h-64 lg:h-full object-cover bg-brand-agriGreen">
      </div>
    </section>
    <section class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 space-y-4 text-slate-700 leading-relaxed">
      {''.join(f'<p>{html.escape(x)}</p>' for x in p['intro'])}
    </section>
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
      <h2 class="text-2xl sm:text-3xl font-cinzel font-bold text-slate-900 mb-6">Available types</h2>
      <div class="grid grid-cols-1 {cols} gap-5">{var}</div>
    </section>
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 grid grid-cols-1 lg:grid-cols-2 gap-10">
      <div>
        <h2 class="text-2xl sm:text-3xl font-cinzel font-bold text-slate-900 mb-6">Specifications</h2>
        {table(p['specs'])}
        <p class="text-xs text-slate-500 mt-3">{C['note']}</p>
      </div>
      <div class="space-y-10">
        <div>
          <h2 class="text-2xl sm:text-3xl font-cinzel font-bold text-slate-900 mb-6">Packing options</h2>
          {table(p['packing'])}
        </div>
        <div>
          <h2 class="text-2xl sm:text-3xl font-cinzel font-bold text-slate-900 mb-6">Shipping</h2>
          {table(p['ship'])}
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
        {quote_btns(name, name)}
      </div>
    </section>'''
    path=f"/{cat}/{p['slug']}/"
    out=shell(path, f"{name} Exporter from India | Bhumi Varahi Impex", p['desc'],
              [('Home','/'),(C['title'],f'/{cat}/'),(name,path)], body, [fld])
    os.makedirs(ROOT+path,exist_ok=True); open(ROOT+path+'index.html','w').write(out)

def hub(cat, groups, h1, lead, title, desc, other):
    C=CATS[cat]; secs=''; allitems=[]
    for gname, items in groups:
        gid={'Basmati rice':'basmati','Aromatic long-grain rice':'aromatic','Non-basmati rice':'non-basmati'}.get(gname,'all')
        cards=''
        for p in items:
            u=f"/{cat}/{p['slug']}/"; allitems.append((p['name'],u))
            cards+=f'''<a href="{u}" class="group bg-white rounded-2xl border border-gray-200 hover:border-brand-agriGreen hover:shadow-lg transition p-6 flex flex-col">
            <h3 class="text-lg font-cinzel font-bold text-slate-900">{html.escape(p['name'])}</h3>
            <p class="text-sm text-slate-600 mt-2 flex-1">{html.escape(p['card'])}</p>
            <span class="mt-4 text-sm font-semibold text-brand-agriGreen group-hover:underline underline-offset-4">View specifications &rarr;</span>
          </a>'''
        secs+=f'''
    <section id="{gid}" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 scroll-mt-28">
      <h2 class="text-2xl sm:text-3xl font-cinzel font-bold text-slate-900 mb-6">{html.escape(gname)}</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{cards}</div>
    </section>'''
    body=f'''
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <div class="rounded-3xl overflow-hidden bg-brand-darkGreen text-white grid grid-cols-1 lg:grid-cols-2">
        <div class="p-8 sm:p-12 space-y-4">
          <span class="text-brand-goldLight font-bold text-xs uppercase tracking-widest font-montserrat">{C['kicker']}</span>
          <h1 class="text-3xl sm:text-5xl font-cinzel font-bold">{html.escape(h1)}</h1>
          <p class="text-emerald-100 text-lg">{html.escape(lead)}</p>
        </div>
        <img src="{C['img']}" alt="{C['alt']}" width="1200" height="800" class="w-full h-56 lg:h-full object-cover bg-brand-agriGreen">
      </div>
    </section>{secs}
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
      <div class="bg-white border border-gray-200 rounded-2xl p-8">
        <h2 class="text-2xl font-cinzel font-bold text-slate-900">Looking for something else?</h2>
        <p class="text-slate-600 mt-2">{html.escape(other)}</p>
        <div class="flex flex-wrap gap-3 mt-5"><a href="/#rfq" class="inline-flex bg-brand-agriGreen hover:bg-brand-darkGreen text-white font-semibold px-6 py-3 rounded-xl">Send a request</a>
        <a href="/catalogue/Bhumi-Varahi-Impex-Catalogue-2026.pdf" download class="inline-flex border border-brand-agriGreen text-brand-agriGreen hover:bg-emerald-50 font-semibold px-6 py-3 rounded-xl">Download catalogue (PDF)</a></div>
      </div>
    </section>'''
    coll={"@context":"https://schema.org","@type":"ItemList","itemListElement":[{"@type":"ListItem","position":i+1,"url":SITE+u,"name":n} for i,(n,u) in enumerate(allitems)]}
    os.makedirs(ROOT+f'/{cat}',exist_ok=True)
    open(ROOT+f'/{cat}/index.html','w').write(shell(f'/{cat}/',title,desc,[('Home','/'),(C['title'],f'/{cat}/')],body,[coll]))
    return allitems
