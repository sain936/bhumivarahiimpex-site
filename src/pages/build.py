import sys, os, json, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from core import *
from data import *
for p in BASMATI+AROMATIC+NONBAS: product('rice',p)
for p in SPICES: product('spices',p)
hub('rice',[('Basmati rice',BASMATI),('Aromatic long-grain rice',AROMATIC),('Non-basmati rice',NONBAS)],
 'Indian Rice for Export','Basmati, aromatic and non-basmati rice from established Indian mills, checked against your specification and shipped FOB or CIF from Kakinada, Visakhapatnam and Chennai.',
 'Indian Rice Exporter: Basmati & Non-Basmati Varieties | Bhumi Varahi Impex',
 'Export every major Indian rice variety: 1121, 1509, 1718, Pusa and Traditional Basmati, Sugandha, Sharbati, 1010, IR 64, Sona Masoori, Swarna, Ponni and broken rice.',
 'We can source other Indian rice varieties and custom specifications on request. Tell us what you need and we will check availability and price.')
hub('spices',[('Indian spices',SPICES)],'Indian Spices for Export','Turmeric, chilli, cumin, coriander, pepper and cardamom from India’s leading spice origins, cleaned, tested and packed for export.',
 'Indian Spices Exporter: Turmeric, Chilli, Cumin & More | Bhumi Varahi Impex',
 'Export Indian spices: turmeric, Guntur red chilli, cumin, coriander, black pepper and green cardamom. Lab-tested, private label, FOB / CIF shipping.',
 'We can also source fennel, fenugreek, mustard seeds, dried ginger, cloves and other Indian spices on request.')
# commodity list for the form
json.dump({'Basmati rice':[p['name'] for p in BASMATI],'Aromatic rice':[p['name'] for p in AROMATIC],'Non-basmati rice':[p['name'] for p in NONBAS],'Spices':[p['name'] for p in SPICES]},
          open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'commodities.json'),'w'))
urls=['/rice/','/spices/']+[f"/rice/{p['slug']}/" for p in BASMATI+AROMATIC+NONBAS]+[f"/spices/{p['slug']}/" for p in SPICES]
sm='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join(f'  <url>\n    <loc>{SITE}{u}</loc>\n    <lastmod>2026-11-08</lastmod>\n  </url>\n' for u in ['/']+urls)+'</urlset>\n'
open(ROOT+'/sitemap.xml','w').write(sm)
print(len(urls),'pages')
