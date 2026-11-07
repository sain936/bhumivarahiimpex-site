import html, json
import rfqfields
from urllib.parse import quote
from core import SITE, WAICON, G_TAG
e=html.escape
RICE='https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=75'
SPICE='https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=900&q=75'
HERO='https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=2000&q=80'
ICONS=['M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
       'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
       'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
       'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z']
def page(code,t,L,groups,SHEETS_URL,CAT):
    rtl=t['dir']=='rtl'; other='fr' if code=='ar' else 'ar'
    wa=f"https://wa.me/919492992666?text={quote(t['wa_msg'])}"
    alt=''.join(f'  <link rel="alternate" hreflang="{h}" href="{SITE}{u}" />\n' for h,u in [('en','/'),('ar','/ar/'),('fr','/fr/'),('x-default','/')])
    kick=lambda k,light=False: f'<span class="kick {"text-brand-goldLight" if light else "text-[#8A6508]"} block mb-3">{e(k)}</span>'
    stats=''.join(f'<div><div class="text-2xl sm:text-3xl font-extrabold text-white" dir="ltr">{e(a)}</div><div class="text-xs sm:text-sm text-emerald-200 mt-1">{e(b)}</div></div>' for a,b in t['stats'])
    why=''.join(f'''<div class="group bg-white rounded-2xl border border-gray-200 p-7 hover:border-brand-agriGreen hover:shadow-lg transition">
          <span class="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-agriGreen text-brand-goldLight" aria-hidden="true"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="{ICONS[i]}"/></svg></span>
          <h3 class="hfont mt-5 font-bold text-slate-900 text-xl">{e(a)}</h3><p class="text-slate-600 mt-2 text-sm leading-relaxed">{e(b)}</p></div>''' for i,(a,b) in enumerate(t['why']))
    prods=''
    for (cat,items),gname in zip(groups,t['groups']):
        img=SPICE if cat=='spices' else RICE
        chips=''.join(f'<a href="/{cat}/{p["slug"]}/" hreflang="en" dir="ltr" class="inline-block text-xs font-semibold text-brand-agriGreen bg-emerald-50 border border-emerald-100 hover:bg-brand-agriGreen hover:text-white px-3 py-1.5 rounded-full transition">{e(p["name"])}</a>' for p in items)
        prods+=f'''<div class="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition flex flex-col">
          <div class="h-36 relative overflow-hidden bg-brand-agriGreen"><img src="{img}" alt="" loading="lazy" width="900" height="600" class="w-full h-full object-cover"><div class="absolute inset-0 bg-gradient-to-t from-brand-darkGreen/90 to-transparent"></div>
          <h3 class="hfont absolute bottom-3 {'right-4' if rtl else 'left-4'} text-white font-bold text-xl">{e(gname)}</h3></div>
          <div class="p-5 flex flex-wrap gap-2">{chips}</div></div>'''
    steps=''.join(f'''<div class="relative text-center px-2">
          <div class="mx-auto w-16 h-16 rounded-full bg-brand-darkGreen text-brand-goldLight border-2 border-brand-warmGold flex items-center justify-center text-2xl font-bold relative z-10">{i+1}</div>
          <p class="mt-4 text-slate-700 text-sm leading-relaxed">{e(s)}</p></div>''' for i,s in enumerate(t['steps']))
    opts=''.join(f'<optgroup label="{e(g)}">'+''.join(f'<option value="{e(p["name"])}">{e(p["name"])}</option>' for p in items)+'</optgroup>' for (c,items),g in zip(groups,t['groups']))
    inp='w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-emerald-200/50 focus:outline-none focus:border-brand-warmGold text-sm'
    lab='block text-xs font-bold tracking-wide text-emerald-200 mb-2'
    def field(id_,name,label,typ='text',ph='',req=False,ac=''):
        a=f' autocomplete="{ac}"' if ac else ''
        return f'<div><label for="{id_}" class="{lab}">{e(label)}</label><input type="{typ}" id="{id_}" name="{name}"{" required" if req else ""}{a} placeholder="{e(ph)}" class="{inp}"{" dir=ltr" if typ in ("email","tel") else ""} /></div>'
    arrow='M15 19l-7-7 7-7' if rtl else 'M9 5l7 7-7 7'
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
    .hfont{{font-family:{t['hfont']}}}
    .kick{{font-size:{'.85rem' if rtl else '.72rem'};font-weight:700;letter-spacing:{'0' if rtl else '.18em'};text-transform:uppercase{";font-family:Montserrat,sans-serif" if not rtl else ""}}}
    .hero-bg{{background:linear-gradient(135deg,rgba(8,23,17,.95) 0%,rgba(27,77,62,.88) 55%,rgba(14,40,32,.97) 100%),url('{HERO}') center/cover no-repeat}}
    .glass-card{{background:rgba(14,40,32,.85);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(212,175,55,.28)}}
    .wa-float{{position:fixed;{'left' if rtl else 'right'}:20px;bottom:20px;z-index:45;width:56px;height:56px;border-radius:9999px;background:#25D366;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.25);transition:transform .2s}}
    .wa-float:hover{{transform:scale(1.08)}}
    a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{{outline:3px solid #D4AF37;outline-offset:2px}}
    select option,select optgroup{{color:#fff;background:#0f172a}}
    html{{scroll-padding-top:6rem}}
    @media (min-width:1024px){{.steps-line::before{{content:'';position:absolute;top:2rem;left:12%;right:12%;height:2px;background:linear-gradient(90deg,#D4AF37,#1B4D3E,#D4AF37)}}}}
  </style>
</head>
<body class="bg-slate-50 text-slate-800 antialiased">
  <header class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-2 border-brand-agriGreen/20 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 lg:h-24 flex items-center justify-between gap-3">
      <a href="/{code}/" aria-label="Bhumi Varahi Impex" class="shrink-0"><img src="/images/logo.png" alt="Bhumi Varahi Impex Private Limited" width="560" height="160" class="h-10 sm:h-14 w-auto"></a>
      <nav class="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-700" aria-label="Main">
        <a href="#about" class="hover:text-brand-agriGreen">{e(t['about_h'])}</a>
        <a href="#products" class="hover:text-brand-agriGreen">{e(t['nav_products'])}</a>
        <a href="#order" class="hover:text-brand-agriGreen">{e(t['nav_order'])}</a>
        <a href="#contact" class="hover:text-brand-agriGreen">{e(t['contact_h'])}</a>
      </nav>
      <div class="flex items-center gap-3">
        <span class="flex items-center gap-1 text-xs font-bold text-slate-600 border border-gray-200 rounded-full px-2 py-1" dir="ltr">
          <a href="/" lang="en" hreflang="en" class="px-1.5 py-0.5 rounded-full hover:text-brand-agriGreen">EN</a>
          <a href="/{other}/" lang="{other}" hreflang="{other}" class="px-1.5 py-0.5 rounded-full hover:text-brand-agriGreen">{L[other]['tag']}</a>
          <span class="px-2 py-0.5 rounded-full bg-brand-agriGreen text-white" aria-current="true">{t['tag']}</span>
        </span>
        <a href="#rfq" class="hidden sm:inline-flex whitespace-nowrap items-center bg-brand-agriGreen hover:bg-brand-darkGreen text-white font-semibold text-sm px-5 py-2.5 rounded-full shadow-md border border-brand-warmGold/40">{e(t['nav_quote'])}</a>
      </div>
    </div>
  </header>
  <main id="main">
    <section class="hero-bg text-white py-16 lg:py-24">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div class="lg:col-span-7 space-y-6">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-darkGreen/80 border border-brand-warmGold/40 text-brand-goldLight text-xs sm:text-sm font-bold">
            <span class="w-2 h-2 rounded-full bg-brand-warmGold animate-pulse"></span>{e(t['badge'])}</div>
          <h1 class="hfont text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.2]">{e(t['h1a'])} <span class="text-brand-warmGold">{e(t['h1b'])}</span></h1>
          <p class="text-base sm:text-lg text-emerald-100/90 max-w-2xl leading-relaxed">{e(t['lead'])}</p>
          <div class="flex flex-wrap gap-4 pt-2">
            <a href="#rfq" class="inline-flex items-center gap-2 bg-brand-warmGold hover:bg-yellow-500 text-slate-950 font-bold px-7 py-3.5 rounded-lg shadow-lg transition">{e(t['cta_quote'])}<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="{arrow}"/></svg></a>
            <a href="{wa}" target="_blank" rel="noopener" class="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-7 py-3.5 rounded-lg border border-brand-warmGold/40 backdrop-blur-md transition">{e(t['cta_wa'])}</a>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-brand-warmGold/20">{stats}</div>
        </div>
        <div class="lg:col-span-5">
          <div class="glass-card rounded-2xl p-7 shadow-2xl space-y-5">
            <div class="flex items-center gap-3 pb-4 border-b border-white/10">
              <img src="/favicon.svg" alt="" class="w-11 h-11"><div><p class="hfont font-bold text-xl text-white">{e(t['card_h'])}</p><p class="text-xs text-emerald-200">{e(t['hours'])}</p></div></div>
            <p class="text-sm text-emerald-100">{e(t['card_p'])}</p>
            <a href="{wa}" target="_blank" rel="noopener" class="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-brand-warmGold/60 transition"><span class="w-10 h-10 rounded-lg flex items-center justify-center text-white" style="background:#1DA851">{WAICON.replace('w-8 h-8','w-6 h-6')}</span><span><span class="block text-xs text-emerald-200">{e(t['wa_l'])}</span><span class="font-bold" dir="ltr">+91 94929 92666</span></span></a>
            <a href="mailto:info@bhumivarahiimpex.com" class="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-brand-warmGold/60 transition"><span class="w-10 h-10 rounded-lg bg-brand-warmGold text-slate-950 flex items-center justify-center" aria-hidden="true"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg></span><span><span class="block text-xs text-emerald-200">{e(t['email_l'])}</span><span class="font-bold text-sm sm:text-base" dir="ltr">info@bhumivarahiimpex.com</span></span></a>
            <a href="{CAT}" download class="block w-full py-3 text-center bg-brand-agriGreen hover:bg-emerald-800 font-bold text-sm rounded-xl border border-brand-warmGold/40">{e(t['cat_short'])} (PDF)</a>
          </div>
        </div>
      </div>
    </section>
    <section id="about" class="py-20 bg-white border-b border-gray-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="max-w-3xl">{kick(t['k_about'])}<h2 class="hfont text-3xl sm:text-4xl font-bold text-slate-900">{e(t['about_h'])}</h2><p class="text-slate-600 mt-4 text-lg leading-relaxed">{e(t['about'])}</p></div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">{why}</div>
      </div>
    </section>
    <section id="products" class="py-20 bg-slate-100/70 border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-3xl mx-auto mb-12">{kick(t['k_prod'])}<h2 class="hfont text-3xl sm:text-4xl font-bold text-slate-900">{e(t['prod_h'])}</h2><p class="text-slate-600 mt-3 text-sm">{e(t['prod_card_note'])} · {e(t['prod_note'])}</p></div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">{prods}</div>
        <div class="text-center mt-10"><a href="{CAT}" download class="inline-flex items-center gap-2 bg-brand-agriGreen hover:bg-brand-darkGreen text-white font-semibold px-7 py-3.5 rounded-xl border border-brand-warmGold/40 shadow"><svg class="w-5 h-5 text-brand-goldLight" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16"/></svg>{e(t['cat_btn'])}</a></div>
      </div>
    </section>
    <section id="order" class="py-20 bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-3xl mx-auto mb-14">{kick(t['k_order'])}<h2 class="hfont text-3xl sm:text-4xl font-bold text-slate-900">{e(t['order_h'])}</h2></div>
        <div class="relative steps-line grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">{steps}</div>
      </div>
    </section>
    <section id="rfq" class="py-20 bg-brand-darkGreen text-white">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
        <div class="lg:col-span-2 space-y-4">{kick(t['k_rfq'],True)}<h2 class="hfont text-3xl sm:text-4xl font-bold">{e(t['form_h'])}</h2><p class="text-emerald-100 leading-relaxed">{e(t['form_sub'])}</p>
          <ul class="space-y-3 pt-4 text-sm text-emerald-100">{''.join(f'<li class="flex gap-3"><span class="text-brand-warmGold font-bold">✓</span>{e(a)}</li>' for a,_ in t['why'])}</ul></div>
        <form id="rfqForm" data-endpoint="{SHEETS_URL}" data-lang="{code}" data-tag="{t['tag']}" class="lg:col-span-3 glass-card rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <input type="checkbox" name="botcheck" class="hidden" tabindex="-1" autocomplete="off" />
          {rfqfields.render(code, groups, t['groups'], lab)}
        </form>
      </div>
    </section>
    <section id="contact" class="py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-3xl mx-auto mb-12">{kick(t['k_contact'])}<h2 class="hfont text-3xl sm:text-4xl font-bold text-slate-900">{e(t['contact_h'])}</h2></div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a href="mailto:info@bhumivarahiimpex.com" class="group p-7 rounded-2xl border border-gray-200 bg-slate-50 hover:border-brand-agriGreen hover:shadow-lg transition"><h3 class="hfont font-bold text-slate-900 text-xl">{e(t['email_l'])}</h3><p class="mt-2 text-brand-agriGreen font-semibold break-all" dir="ltr">info@bhumivarahiimpex.com</p></a>
          <a href="{wa}" target="_blank" rel="noopener" class="group p-7 rounded-2xl border border-gray-200 bg-slate-50 hover:border-brand-agriGreen hover:shadow-lg transition"><h3 class="hfont font-bold text-slate-900 text-xl">{e(t['wa_l'])}</h3><p class="mt-2 text-brand-agriGreen font-semibold" dir="ltr">+91 94929 92666</p><p class="text-xs text-slate-500 mt-1">{e(t['hours'])}</p></a>
          <div class="p-7 rounded-2xl border border-brand-warmGold/50 bg-brand-darkGreen text-white"><h3 class="hfont font-bold text-xl">{e(t['ports_l'])}</h3><p class="mt-2 text-emerald-100">{e(t['ports'])}</p></div>
        </div>
      </div>
    </section>
  </main>
  <footer class="bg-slate-950 text-slate-400 py-12 border-t-2 border-brand-agriGreen text-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
      <div class="bg-white rounded-xl px-4 py-2"><img src="/images/logo.png" alt="Bhumi Varahi Impex" width="560" height="160" class="h-10 w-auto"></div>
      <p class="text-center">{e(t['rights'])}</p>
      <p dir="ltr"><a href="/" lang="en" class="hover:text-white underline underline-offset-4">English</a> · <a href="/{other}/" lang="{other}" class="hover:text-white underline underline-offset-4">{'Français' if other=='fr' else 'عربي'}</a></p>
    </div>
    <a href="{wa}" class="wa-float" target="_blank" rel="noopener" aria-label="WhatsApp">{WAICON}</a>
  </footer>
  <script src="/js/dialcodes.js?v=6" defer></script>
  <script src="/js/rfqform.js?v=1" defer></script>
</body>
</html>
'''
