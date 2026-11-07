/* Country dialling codes for the RFQ phone field.
   Fills every <select data-dialcodes>, guesses the visitor's country, follows the
   "Destination country" field, and joins code + number into the form's "phone" value. */
(function () {
  var C = [
    ['AE','United Arab Emirates','971'],['SA','Saudi Arabia','966'],['OM','Oman','968'],['QA','Qatar','974'],
    ['KW','Kuwait','965'],['BH','Bahrain','973'],['IN','India','91'],
    ['AF','Afghanistan','93'],['DZ','Algeria','213'],['AO','Angola','244'],['AU','Australia','61'],['AT','Austria','43'],
    ['BD','Bangladesh','880'],['BE','Belgium','32'],['BJ','Benin','229'],['BR','Brazil','55'],['BF','Burkina Faso','226'],
    ['KH','Cambodia','855'],['CM','Cameroon','237'],['CA','Canada','1'],['CN','China','86'],['CG','Congo','242'],
    ['CD','Congo (DRC)','243'],['CI',"Côte d'Ivoire",'225'],['DJ','Djibouti','253'],['EG','Egypt','20'],['ET','Ethiopia','251'],
    ['FJ','Fiji','679'],['FR','France','33'],['GA','Gabon','241'],['GM','Gambia','220'],['DE','Germany','49'],['GH','Ghana','233'],
    ['GN','Guinea','224'],['HK','Hong Kong','852'],['ID','Indonesia','62'],['IR','Iran','98'],['IQ','Iraq','964'],['IE','Ireland','353'],
    ['IT','Italy','39'],['JP','Japan','81'],['JO','Jordan','962'],['KE','Kenya','254'],['LB','Lebanon','961'],['LR','Liberia','231'],
    ['LY','Libya','218'],['MG','Madagascar','261'],['MW','Malawi','265'],['MY','Malaysia','60'],['MV','Maldives','960'],['ML','Mali','223'],
    ['MR','Mauritania','222'],['MU','Mauritius','230'],['MA','Morocco','212'],['MZ','Mozambique','258'],['MM','Myanmar','95'],
    ['NP','Nepal','977'],['NL','Netherlands','31'],['NZ','New Zealand','64'],['NE','Niger','227'],['NG','Nigeria','234'],
    ['PK','Pakistan','92'],['PH','Philippines','63'],['PL','Poland','48'],['PT','Portugal','351'],['RU','Russia','7'],['RW','Rwanda','250'],
    ['SN','Senegal','221'],['SC','Seychelles','248'],['SL','Sierra Leone','232'],['SG','Singapore','65'],['SO','Somalia','252'],
    ['ZA','South Africa','27'],['KR','South Korea','82'],['ES','Spain','34'],['LK','Sri Lanka','94'],['SD','Sudan','249'],
    ['SE','Sweden','46'],['CH','Switzerland','41'],['SY','Syria','963'],['TW','Taiwan','886'],['TZ','Tanzania','255'],['TH','Thailand','66'],
    ['TG','Togo','228'],['TN','Tunisia','216'],['TR','Türkiye','90'],['UG','Uganda','256'],['UA','Ukraine','380'],
    ['GB','United Kingdom','44'],['US','United States','1'],['UZ','Uzbekistan','998'],['VN','Vietnam','84'],['YE','Yemen','967'],
    ['ZM','Zambia','260'],['ZW','Zimbabwe','263']
  ];
  var ALIAS = { uae: 'AE', emirates: 'AE', dubai: 'AE', 'abu dhabi': 'AE', ksa: 'SA', saudi: 'SA', usa: 'US', us: 'US',
    america: 'US', uk: 'GB', england: 'GB', britain: 'GB', 'ivory coast': 'CI', drc: 'CD', turkey: 'TR', korea: 'KR',
    'émirats arabes unis': 'AE', 'arabie saoudite': 'SA', 'sénégal': 'SN', 'maroc': 'MA', 'algérie': 'DZ', 'tunisie': 'TN',
    'égypte': 'EG', 'cameroun': 'CM', 'guinée': 'GN', 'bénin': 'BJ', 'mauritanie': 'MR', 'koweït': 'KW', 'qatar': 'QA',
    'الإمارات': 'AE', 'الامارات': 'AE', 'السعودية': 'SA', 'عمان': 'OM', 'عُمان': 'OM', 'قطر': 'QA', 'الكويت': 'KW',
    'البحرين': 'BH', 'مصر': 'EG', 'العراق': 'IQ', 'الأردن': 'JO', 'اليمن': 'YE', 'المغرب': 'MA', 'الجزائر': 'DZ',
    'تونس': 'TN', 'ليبيا': 'LY', 'السودان': 'SD', 'لبنان': 'LB', 'سوريا': 'SY', 'الهند': 'IN' };
  var byIso = {}; C.forEach(function (c) { byIso[c[0]] = c; });

  function guess() {
    var langs = (navigator.languages || [navigator.language || '']);
    for (var i = 0; i < langs.length; i++) {
      var m = /-([A-Z]{2})$/i.exec(langs[i] || '');
      if (m && byIso[m[1].toUpperCase()]) return m[1].toUpperCase();
    }
    return 'AE';
  }
  function findIso(name) {
    var n = String(name || '').trim().toLowerCase().replace(/^the\s+/, '');
    if (!n) return '';
    if (ALIAS[n]) return ALIAS[n];
    for (var i = 0; i < C.length; i++) if (C[i][1].toLowerCase() === n) return C[i][0];
    for (var j = 0; j < C.length; j++) if (n.length >= 4 && C[j][1].toLowerCase().indexOf(n) === 0) return C[j][0];
    return '';
  }

  document.querySelectorAll('select[data-dialcodes]').forEach(function (sel) {
    var top = document.createElement('optgroup'); top.label = sel.getAttribute('data-top-label') || 'Gulf & India';
    var all = document.createElement('optgroup'); all.label = sel.getAttribute('data-all-label') || 'All countries';
    C.forEach(function (c, i) {
      var o = document.createElement('option');
      o.value = c[0];
      o.textContent = '+' + c[2] + '  ' + c[1];
      (i < 7 ? top : all).appendChild(o);
    });
    sel.appendChild(top); sel.appendChild(all);
    sel.value = guess();

    var form = sel.form;
    if (!form) return;
    var userPicked = false;
    sel.addEventListener('change', function () { userPicked = true; });
    var country = form.querySelector('[name="country"]');
    if (country) country.addEventListener('change', function () {
      var iso = findIso(country.value);
      if (iso && !userPicked) sel.value = iso;
    });
    form.addEventListener('reset', function () { setTimeout(function () { userPicked = false; sel.value = guess(); }, 0); });
    // Runs whenever the submit code calls new FormData(form).
    form.addEventListener('formdata', function (e) {
      var raw = String(e.formData.get('phone') || '').trim();
      if (!raw) return;
      if (/^(\+|00)/.test(raw)) { e.formData.set('phone', raw.replace(/^00/, '+')); return; }
      var c = byIso[sel.value];
      if (c) e.formData.set('phone', '+' + c[2] + ' ' + raw.replace(/^0+/, ''));
    });
  });
})();
