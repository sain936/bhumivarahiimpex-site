import sys,html,base64,os
P='/tmp/claude-0/-home-user/081bca73-6ac6-5471-baa6-9a920852c4ef/scratchpad/pages'; sys.path.insert(0,P)
os.environ['SITE_ROOT']='/tmp/x'
from data import *
F='/tmp/claude-0/-home-user/081bca73-6ac6-5471-baa6-9a920852c4ef/scratchpad/tw/node_modules/@fontsource/'
def ff(fam,file,w): return f"@font-face{{font-family:'{fam}';font-weight:{w};src:url(data:font/woff2;base64,{base64.b64encode(open(F+file,'rb').read()).decode()}) format('woff2')}}"
fonts=''.join([ff('Playfair','playfair-display/files/playfair-display-latin-700-normal.woff2',700),ff('Playfair','playfair-display/files/playfair-display-latin-600-normal.woff2',600)]+
  [ff('Jakarta',f'plus-jakarta-sans/files/plus-jakarta-sans-latin-{w}-normal.woff2',w) for w in (400,500,600,700)]+[ff('Mont','montserrat/files/montserrat-latin-700-normal.woff2',700)])
logo=base64.b64encode(open('/home/user/bhumivarahiimpex-site/images/logo.png','rb').read()).decode()
e=html.escape
def rows(r): return ''.join(f'<tr><th>{e(k)}</th><td>{e(v)}</td></tr>' for k,v in r)
def prod(p):
    ship=[x for x in p['ship'] if x[0] in ('20 ft container','Shipment size')]
    pack=[x for x in p['packing'] if x[0] in ('Bag sizes','Pack sizes','Bag types','Pack types')]
    types=''.join(f'<li><b>{e(t)}</b> – {e(d)}</li>' for t,d in p['types'])
    return f'''<section class="prod"><div class="ph"><h3>{e(p['name'])}</h3><span>HS {e(dict(p['specs']).get('HS code','').split(' (')[0])}</span></div>
<p class="tag">{e(p['tagline'])}</p>
<div class="cols"><div><h4>Available types</h4><ul>{types}</ul><h4>Packing &amp; shipping</h4><table>{rows(pack+ship)}</table></div>
<div><h4>Typical specifications</h4><table>{rows([x for x in p['specs'] if x[0]!='HS code'])}</table></div></div></section>'''
def opener(n,t,s,items):
    li=''.join(f'<li>{e(p["name"])}</li>' for p in items)
    return f'<section class="opener"><span class="kick">Section {n}</span><h2>{t}</h2><p>{s}</p><ul class="toc">{li}</ul></section>'
rice=BASMATI+AROMATIC+NONBAS
body=f'''
<section class="cover"><div class="lc"><img src="data:image/png;base64,{logo}"></div>
<div class="ct"><span class="kick">Product Catalogue 2026</span><h1>Indian Rice<br>&amp; Spices</h1>
<p>Basmati, aromatic and non-basmati rice and India’s leading export spices, sourced from established origins and shipped FOB or CIF worldwide.</p></div>
<div class="cf"><div><b>info@bhumivarahiimpex.com</b><br>WhatsApp +91 94929 92666</div><div><b>www.bhumivarahiimpex.com</b><br>Kakinada · Visakhapatnam · Chennai</div></div></section>
<section class="about"><span class="kick">About us</span><h2>Your trade partner in India</h2>
<p>Bhumi Varahi Impex Private Limited is a merchant exporter registered with the Ministry of Corporate Affairs, India. We connect international buyers with established Indian mills and spice processors, and we manage quality checks, packing, documentation and shipping from India’s east-coast ports.</p>
<div class="grid3"><div><h4>Origin sourcing</h4><p>Direct relationships with mills and processors in India’s main growing regions.</p></div>
<div><h4>Quality checked</h4><p>Every lot checked against the contract specification, with third-party inspection on request.</p></div>
<div><h4>Your brand</h4><p>Private-label packing in retail and bulk sizes, with your artwork.</p></div></div>
<h3 class="sub">How to order</h3><ol class="steps">
<li><b>Send your requirement</b> – product, quantity, destination port and packing, by email, WhatsApp or the website form.</li>
<li><b>Receive a quotation</b> – FOB, CFR or CIF price, usually within 24 business hours.</li>
<li><b>Approve a sample</b> – we courier a sample of the lot on request.</li>
<li><b>Confirm the contract</b> – proforma invoice and agreed payment terms (LC or TT).</li>
<li><b>Shipment</b> – loading, inspection and full export documents.</li></ol>
<h3 class="sub">Contents</h3><table class="ct2"><tr><th>1</th><td>Rice: basmati, aromatic and non-basmati ({len(rice)} varieties)</td></tr><tr><th>2</th><td>Spices ({len(SPICES)} products)</td></tr></table></section>
{opener(1,'Rice','Basmati, aromatic long-grain and non-basmati rice from India, in Steam, Sella, Raw and Parboiled forms.',rice)}
{''.join(prod(p) for p in rice)}
{opener(2,'Spices','Lab-tested whole and ground spices from India’s leading origins.',SPICES)}
{''.join(prod(p) for p in SPICES)}
<section class="back"><img src="data:image/png;base64,{logo}"><h2>Request a quotation</h2>
<p>Tell us the product, quantity, destination port and packing. Our export desk replies within 24 business hours.</p>
<table class="contact"><tr><th>Email</th><td>info@bhumivarahiimpex.com</td></tr><tr><th>Phone / WhatsApp</th><td>+91 94929 92666</td></tr>
<tr><th>Website</th><td>www.bhumivarahiimpex.com</td></tr><tr><th>Desk hours</th><td>10 AM – 4 PM IST</td></tr><tr><th>Ports of loading</th><td>Kakinada, Visakhapatnam, Chennai (other Indian ports on request)</td></tr></table>
<p class="fine">Specifications in this catalogue are typical export values for reference. Final specifications, inspection, tolerances, prices and terms are agreed in each contract. © 2026 Bhumi Varahi Impex Private Limited.</p></section>'''
css='''@page{size:A4;margin:16mm 15mm 18mm}
*{box-sizing:border-box}body{margin:0;font-family:Jakarta,sans-serif;color:#1e293b;font-size:9.5pt;line-height:1.45}
h1,h2,h3{font-family:Playfair,serif;margin:0}.kick{font-family:Mont,sans-serif;font-size:8pt;letter-spacing:2.5px;text-transform:uppercase;color:#8A6508;font-weight:700}
.cover{height:263mm;background:#0E2820;color:#fff;border-radius:6mm;padding:16mm;display:flex;flex-direction:column;justify-content:space-between;page-break-after:always;border-bottom:3mm solid #D4AF37}
.cover .lc{background:#fff;border-radius:3mm;padding:5mm 7mm;align-self:flex-start}.cover .lc img{height:20mm}
.cover .kick{color:#E5C158}.cover h1{font-size:46pt;line-height:1.05;margin:4mm 0 6mm}.cover p{font-size:12pt;color:#d1fae5;max-width:130mm}
.cf{display:flex;justify-content:space-between;font-size:9.5pt;color:#E5C158;border-top:1px solid rgba(229,193,88,.4);padding-top:5mm}.cf b{color:#fff}
.about{page-break-after:always}.about h2{font-size:24pt;margin:2mm 0 4mm;color:#0E2820}.about>p{font-size:10.5pt}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5mm;margin:6mm 0}.grid3>div{background:#F8F5EC;border-left:1mm solid #D4AF37;padding:4mm;border-radius:2mm}.grid3 h4{margin:0 0 1mm;color:#1B4D3E}.grid3 p{margin:0;font-size:8.5pt}
.sub{font-size:14pt;color:#0E2820;margin:6mm 0 3mm}.steps{padding-left:5mm;margin:0}.steps li{margin-bottom:2mm}
.ct2 th{width:10mm;color:#8A6508;font-family:Playfair,serif;font-size:13pt;text-align:left}.ct2 td{font-size:10.5pt;padding:1.5mm 0}
.opener{page-break-before:always;page-break-after:always;height:255mm;background:#1B4D3E;color:#fff;border-radius:6mm;padding:20mm 16mm;border-bottom:3mm solid #D4AF37}
.opener .kick{color:#E5C158}.opener h2{font-size:48pt;margin:4mm 0}.opener p{font-size:12pt;color:#d1fae5;max-width:140mm}
.toc{columns:2;margin-top:12mm;padding-left:5mm;font-size:11pt}.toc li{margin-bottom:2mm}
.prod{break-inside:avoid;border:1px solid #e2e8f0;border-radius:3mm;padding:5mm 6mm;margin-bottom:6mm}
.ph{display:flex;justify-content:space-between;align-items:baseline;border-bottom:.6mm solid #D4AF37;padding-bottom:2mm}
.ph h3{font-size:16pt;color:#0E2820}.ph span{font-size:8pt;color:#5A6A72;font-weight:600}
.tag{color:#1B4D3E;font-weight:600;margin:2mm 0 3mm}.cols{display:grid;grid-template-columns:1fr 1fr;gap:6mm}
h4{font-family:Mont,sans-serif;font-size:7.5pt;letter-spacing:1.5px;text-transform:uppercase;color:#8A6508;margin:0 0 1.5mm}
ul{margin:0 0 3mm;padding-left:4mm}.prod li{margin-bottom:1mm;font-size:8.5pt}
table{width:100%;border-collapse:collapse}.prod th,.prod td{font-size:8.3pt;padding:1.2mm 1.5mm;border-bottom:1px solid #eef2f7;text-align:left;vertical-align:top}
.prod th{color:#475569;font-weight:600;width:48%}.prod tr:nth-child(odd){background:#f8fafc}
.back{page-break-before:always;text-align:center;padding-top:30mm}.back img{height:24mm}.back h2{font-size:28pt;color:#0E2820;margin:10mm 0 3mm}.back>p{font-size:11pt;max-width:140mm;margin:0 auto}
.contact{max-width:140mm;margin:10mm auto;text-align:left}.contact th,.contact td{padding:2.5mm 3mm;border-bottom:1px solid #e2e8f0;font-size:10.5pt}.contact th{color:#8A6508;width:45mm}
.fine{font-size:8pt!important;color:#64748b;margin-top:20mm!important}'''
open('catalogue.html','w').write(f'<!doctype html><html><head><meta charset="utf-8"><title>Bhumi Varahi Impex – Product Catalogue 2026</title><style>{fonts}{css}</style></head><body>{body}</body></html>')
print('ok')
