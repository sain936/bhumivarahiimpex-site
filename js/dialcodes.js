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

  // Best guess at the visitor's country: time zone first (reliable), then browser language region.
  var TZ = { 'Asia/Dubai': 'AE', 'Asia/Riyadh': 'SA', 'Asia/Muscat': 'OM', 'Asia/Qatar': 'QA', 'Asia/Kuwait': 'KW',
    'Asia/Bahrain': 'BH', 'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN', 'Asia/Karachi': 'PK', 'Asia/Dhaka': 'BD',
    'Asia/Colombo': 'LK', 'Asia/Kathmandu': 'NP', 'Asia/Singapore': 'SG', 'Asia/Kuala_Lumpur': 'MY', 'Asia/Jakarta': 'ID',
    'Asia/Bangkok': 'TH', 'Asia/Manila': 'PH', 'Asia/Ho_Chi_Minh': 'VN', 'Asia/Hong_Kong': 'HK', 'Asia/Shanghai': 'CN',
    'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR', 'Asia/Baghdad': 'IQ', 'Asia/Amman': 'JO', 'Asia/Beirut': 'LB', 'Asia/Aden': 'YE',
    'Asia/Tehran': 'IR', 'Africa/Cairo': 'EG', 'Africa/Lagos': 'NG', 'Africa/Accra': 'GH', 'Africa/Nairobi': 'KE',
    'Africa/Dar_es_Salaam': 'TZ', 'Africa/Kampala': 'UG', 'Africa/Addis_Ababa': 'ET', 'Africa/Johannesburg': 'ZA',
    'Africa/Dakar': 'SN', 'Africa/Abidjan': 'CI', 'Africa/Casablanca': 'MA', 'Africa/Algiers': 'DZ', 'Africa/Tunis': 'TN',
    'Africa/Djibouti': 'DJ', 'Africa/Mogadishu': 'SO', 'Africa/Khartoum': 'SD', 'Africa/Conakry': 'GN', 'Africa/Bamako': 'ML',
    'Africa/Douala': 'CM', 'Africa/Maputo': 'MZ', 'Africa/Lusaka': 'ZM', 'Africa/Harare': 'ZW', 'Indian/Mauritius': 'MU',
    'Europe/London': 'GB', 'Europe/Paris': 'FR', 'Europe/Berlin': 'DE', 'Europe/Amsterdam': 'NL', 'Europe/Brussels': 'BE',
    'Europe/Madrid': 'ES', 'Europe/Rome': 'IT', 'Europe/Istanbul': 'TR', 'Europe/Moscow': 'RU', 'Australia/Sydney': 'AU',
    'Australia/Melbourne': 'AU', 'Pacific/Auckland': 'NZ', 'America/Toronto': 'CA', 'America/Sao_Paulo': 'BR' };
  function guess() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (TZ[tz]) return TZ[tz];
      if (/^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage)$/.test(tz)) return 'US';
    } catch (e) {}
    var langs = (navigator.languages || [navigator.language || '']);
    for (var i = 0; i < langs.length; i++) {
      var m = /-([A-Z]{2})$/i.exec(langs[i] || '');
      // "en-US" is just the default browser language for many people, so it is not used as a hint.
      if (m && byIso[m[1].toUpperCase()] && langs[i].toLowerCase() !== 'en-us') return m[1].toUpperCase();
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

  var CSS = '.dp{position:relative;flex-shrink:0}' +
    '.dp-btn{display:flex;align-items:center;gap:8px;height:100%;min-height:46px;padding:0 10px 0 12px;border-radius:8px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#fff;font-size:14px;cursor:pointer;white-space:nowrap}' +
    '.dp-btn:hover{background:rgba(255,255,255,.15)}.dp-btn:focus-visible,.dp-btn[aria-expanded=true]{outline:none;border-color:#E5C158}' +
    '.dp-flag{width:22px;height:16px;border-radius:3px;object-fit:cover;box-shadow:0 0 0 1px rgba(255,255,255,.25);flex-shrink:0;background:#2a4a40}' +
    '.dp-chev{width:14px;height:14px;opacity:.7;transition:transform .15s}.dp-btn[aria-expanded=true] .dp-chev{transform:rotate(180deg)}' +
    '.dp-pop{position:absolute;z-index:60;top:calc(100% + 6px);left:0;width:min(20rem,calc(100vw - 32px));background:#0E2820;border:1px solid rgba(229,193,88,.35);border-radius:12px;box-shadow:0 18px 40px rgba(0,0,0,.45);overflow:hidden}' +
    '.dp-pop[hidden]{display:none}' +
    '.dp-search{display:block;width:100%;padding:12px 14px;background:rgba(255,255,255,.06);border:0;border-bottom:1px solid rgba(255,255,255,.12);color:#fff;font-size:14px;outline:none}' +
    '.dp-search::placeholder{color:rgba(167,243,208,.5)}' +
    '.dp-list{max-height:280px;overflow-y:auto;margin:0;padding:6px;list-style:none;overscroll-behavior:contain}' +
    '.dp-head{padding:8px 10px 4px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#E5C158}' +
    '.dp-opt{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;color:#e2e8f0;font-size:14px;cursor:pointer}' +
    '.dp-opt .dp-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.dp-opt .dp-code{color:rgba(167,243,208,.75);font-variant-numeric:tabular-nums}' +
    '.dp-opt[aria-selected=true]{background:rgba(229,193,88,.16);color:#fff}.dp-opt[aria-selected=true] .dp-code{color:#E5C158}' +
    '.dp-opt.dp-active{background:rgba(255,255,255,.1)}' +
    '.dp-empty{padding:14px 10px;color:rgba(226,232,240,.6);font-size:13px}';
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  var FLAG = function (iso) { return '/images/flags/' + iso.toLowerCase() + '.svg'; };
  var chev = '<svg class="dp-chev" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z"/></svg>';
  var uid = 0;

  document.querySelectorAll('select[data-dialcodes]').forEach(function (sel) {
    var topLabel = sel.getAttribute('data-top-label') || 'Gulf & India';
    var allLabel = sel.getAttribute('data-all-label') || 'All countries';
    var searchPh = sel.getAttribute('data-search') || 'Search country or code';
    var noneTxt = sel.getAttribute('data-none') || 'No match';
    C.forEach(function (c) { var o = document.createElement('option'); o.value = c[0]; o.textContent = '+' + c[2] + ' ' + c[1]; sel.appendChild(o); });
    sel.value = guess();

    // Custom picker (the native select stays in the page, hidden, as the source of truth).
    var id = 'dp' + (++uid);
    var wrap = document.createElement('div'); wrap.className = 'dp';
    wrap.innerHTML = '<button type="button" class="dp-btn" aria-haspopup="listbox" aria-expanded="false" aria-controls="' + id + '-list"><img class="dp-flag" alt="" width="22" height="16"><span class="dp-val"></span>' + chev + '</button>' +
      '<div class="dp-pop" hidden><input type="search" class="dp-search" autocomplete="off" spellcheck="false" aria-controls="' + id + '-list" placeholder="' + searchPh.replace(/"/g, '&quot;') + '"><ul class="dp-list" role="listbox" id="' + id + '-list"></ul></div>';
    sel.parentNode.insertBefore(wrap, sel);
    sel.style.display = 'none'; sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true');
    var btn = wrap.querySelector('.dp-btn'), pop = wrap.querySelector('.dp-pop'), q = wrap.querySelector('.dp-search'), list = wrap.querySelector('.dp-list');
    btn.setAttribute('aria-label', (sel.getAttribute('aria-label') || 'Country calling code'));
    var active = -1, shown = [];

    function paint() {
      var c = byIso[sel.value]; if (!c) return;
      btn.querySelector('.dp-flag').src = FLAG(c[0]);
      btn.querySelector('.dp-val').textContent = '+' + c[2];
      btn.title = c[1] + ' (+' + c[2] + ')';
    }
    function render(term) {
      term = String(term || '').trim().toLowerCase().replace(/^\+/, '');
      list.innerHTML = ''; shown = []; active = -1;
      var groups = term ? [[null, C]] : [[topLabel, C.slice(0, 7)], [allLabel, C.slice(7)]];
      groups.forEach(function (g) {
        var items = g[1].filter(function (c) {
          return !term || c[1].toLowerCase().indexOf(term) !== -1 || c[2].indexOf(term) === 0 || c[0].toLowerCase() === term;
        });
        if (!items.length) return;
        if (g[0]) { var h = document.createElement('li'); h.className = 'dp-head'; h.setAttribute('role', 'presentation'); h.textContent = g[0]; list.appendChild(h); }
        items.forEach(function (c) {
          var li = document.createElement('li');
          li.className = 'dp-opt'; li.setAttribute('role', 'option'); li.id = id + '-' + c[0];
          li.setAttribute('aria-selected', c[0] === sel.value ? 'true' : 'false');
          li.innerHTML = '<img class="dp-flag" loading="lazy" alt="" width="22" height="16" src="' + FLAG(c[0]) + '"><span class="dp-name"></span><span class="dp-code">+' + c[2] + '</span>';
          li.querySelector('.dp-name').textContent = c[1];
          li.addEventListener('mousedown', function (e) { e.preventDefault(); });
          li.addEventListener('click', function () { choose(c[0], true); });
          list.appendChild(li); shown.push(li);
        });
      });
      if (!shown.length) { var n = document.createElement('li'); n.className = 'dp-empty'; n.textContent = noneTxt; list.appendChild(n); }
    }
    function setActive(i) {
      if (!shown.length) return;
      if (active >= 0 && shown[active]) shown[active].classList.remove('dp-active');
      active = (i + shown.length) % shown.length;
      shown[active].classList.add('dp-active');
      q.setAttribute('aria-activedescendant', shown[active].id);
      shown[active].scrollIntoView({ block: 'nearest' });
    }
    function open() {
      if (!pop.hidden) return;
      render(''); pop.hidden = false; btn.setAttribute('aria-expanded', 'true');
      q.value = ''; q.focus({ preventScroll: true });
      var cur = list.querySelector('[aria-selected="true"]');
      if (cur) { active = shown.indexOf(cur); cur.scrollIntoView({ block: 'center' }); }
    }
    function close(refocus) {
      if (pop.hidden) return;
      pop.hidden = true; btn.setAttribute('aria-expanded', 'false');
      if (refocus) btn.focus();
    }
    function choose(iso, byUser) {
      sel.value = iso; paint();
      if (byUser) { sel.dispatchEvent(new Event('change', { bubbles: true })); close(true); }
    }
    btn.addEventListener('click', function () { pop.hidden ? open() : close(true); });
    btn.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); open(); } });
    q.addEventListener('input', function () { render(q.value); if (q.value) setActive(0); });
    q.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
      else if (e.key === 'Enter') { e.preventDefault(); if (shown[active]) shown[active].click(); else if (shown.length === 1) shown[0].click(); }
      else if (e.key === 'Escape') { e.preventDefault(); close(true); }
      else if (e.key === 'Tab') close(false);
    });
    document.addEventListener('click', function (e) { if (!wrap.contains(e.target)) close(false); });
    sel.addEventListener('dialsync', paint);
    paint();

    var form = sel.form;
    if (!form) return;
    var userPicked = false;
    sel.addEventListener('change', function () { userPicked = true; });
    var country = form.querySelector('[name="country"]');
    if (country) country.addEventListener('change', function () {
      var iso = findIso(country.value);
      if (iso && !userPicked) { sel.value = iso; paint(); }
    });
    form.addEventListener('reset', function () { setTimeout(function () { userPicked = false; sel.value = guess(); paint(); }, 0); });
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
