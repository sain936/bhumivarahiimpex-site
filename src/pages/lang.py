import os, sys, json, html, pathlib
from urllib.parse import quote
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from core import ROOT, SITE, WAICON, G_TAG
from data import BASMATI, AROMATIC, NONBAS, SPICES
SHEETS_URL='https://script.google.com/macros/s/AKfycbzRctdjTuNZ-1JklyRoU8ZaZFS-JMvhf1DloyTOI1TqP6ZvrMBixsIAYRm9NP97Xdk/exec'
CAT='/catalogue/Bhumi-Varahi-Impex-Catalogue-2026.pdf'
L={
'ar':dict(dir='rtl',hfont="'Amiri', 'Times New Roman', serif",
 badge='مصدّرون ومستوردون موثوقون',h1a='أرز وتوابل هندية',h1b='بجودة وثقة',
 stats=[('3','موانئ على الساحل الشرقي'),('FOB · CIF','شروط شحن مرنة'),('24','ساعة للرد على عرض السعر'),('MCA','شركة مسجّلة رسمياً')],
 k_about='تعرّفوا علينا',k_prod='ما نصدّره',k_order='خطوات بسيطة',k_rfq='طلب عرض سعر',k_contact='نحن في خدمتكم',
 card_h='مكتب التصدير',card_p='تحدّثوا مباشرة مع فريقنا أو حمّلوا الكتالوج الكامل.',cat_short='تحميل الكتالوج',
 prod_card_note='اضغط على المنتج لعرض المواصفات',font="'Cairo', 'Tahoma', sans-serif",fontlink='family=Amiri:wght@700&family=Cairo:wght@400;600;700;800',tag='AR',
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
'fr':dict(dir='ltr',hfont="'Playfair Display', Georgia, serif",
 badge='Exportateurs et importateurs de confiance',h1a='Riz et épices indiennes,',h1b='qualité et confiance',
 stats=[('3','Ports sur la côte est'),('FOB · CIF','Incoterms flexibles'),('24 h','Réponse au devis'),('MCA','Société enregistrée')],
 k_about='Notre société',k_prod='Ce que nous exportons',k_order='Simple et rapide',k_rfq='Demande de devis',k_contact='Parlons affaires',
 card_h='Service export',card_p='Parlez directement à notre équipe ou téléchargez le catalogue complet.',cat_short='Télécharger le catalogue',
 prod_card_note='Cliquez sur un produit pour voir la fiche technique',font="'Plus Jakarta Sans', system-ui, sans-serif",fontlink='family=Playfair+Display:wght@600;700&family=Montserrat:wght@700&family=Plus+Jakarta+Sans:wght@400;600;700;800',tag='FR',
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
from langtpl import page
for code,t in L.items():
    os.makedirs(f'{ROOT}/{code}',exist_ok=True)
    open(f'{ROOT}/{code}/index.html','w').write(page(code,t,L,groups,SHEETS_URL,CAT))
print('lang pages ok')
