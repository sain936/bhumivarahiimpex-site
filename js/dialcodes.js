/* Flag pickers for the RFQ forms:
   - <select data-dialcodes>      phone country code (joined into the "phone" value on submit)
   - <select data-country-picker> destination country (value = English country name)
   - <select data-port-picker>    destination port, filtered by the chosen country
   The native <select> stays in the page (visually hidden) so browser "required" checks still work. */
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

  // Main seaports per country. Landlocked countries list the usual transit ports.
  var PORTS = {
    AE: ['Jebel Ali', 'Khalifa Port (Abu Dhabi)', 'Sharjah (Khalid Port)', 'Khor Fakkan', 'Fujairah'],
    SA: ['Jeddah', 'Dammam (King Abdulaziz Port)', 'King Abdullah Port', 'Jubail', 'Riyadh Dry Port'],
    OM: ['Sohar', 'Salalah', 'Muscat (Sultan Qaboos)', 'Duqm'], QA: ['Hamad Port'], KW: ['Shuwaikh', 'Shuaiba'],
    BH: ['Khalifa Bin Salman Port'], IN: ['Nhava Sheva (JNPT)', 'Mundra', 'Kakinada', 'Visakhapatnam', 'Chennai', 'Kolkata'],
    AF: ['Via Karachi', 'Via Bandar Abbas', 'Kabul ICD'], DZ: ['Algiers', 'Oran', 'Annaba', 'Béjaïa'], AO: ['Luanda', 'Lobito'],
    AU: ['Sydney', 'Melbourne', 'Brisbane', 'Fremantle', 'Adelaide'], AT: ['Via Hamburg', 'Via Koper'],
    BD: ['Chittagong', 'Mongla'], BE: ['Antwerp', 'Zeebrugge'], BJ: ['Cotonou'], BR: ['Santos', 'Paranaguá', 'Rio de Janeiro'],
    BF: ['Via Abidjan', 'Via Lomé', 'Via Tema', 'Ouagadougou ICD'], KH: ['Sihanoukville', 'Phnom Penh'], CM: ['Douala', 'Kribi'],
    CA: ['Vancouver', 'Montreal', 'Toronto', 'Halifax'], CN: ['Shanghai', 'Ningbo', 'Qingdao', 'Shenzhen', 'Tianjin', 'Guangzhou'],
    CG: ['Pointe-Noire'], CD: ['Matadi', 'Via Dar es Salaam', 'Via Mombasa'], CI: ['Abidjan', 'San-Pédro'], DJ: ['Djibouti'],
    EG: ['Alexandria', 'Port Said', 'Damietta', 'Sokhna'], ET: ['Via Djibouti', 'Modjo Dry Port'], FJ: ['Suva', 'Lautoka'],
    FR: ['Le Havre', 'Marseille-Fos'], GA: ['Libreville (Owendo)'], GM: ['Banjul'], DE: ['Hamburg', 'Bremerhaven'],
    GH: ['Tema', 'Takoradi'], GN: ['Conakry'], HK: ['Hong Kong'], ID: ['Jakarta (Tanjung Priok)', 'Surabaya', 'Belawan'],
    IR: ['Bandar Abbas', 'Bushehr', 'Chabahar'], IQ: ['Umm Qasr'], IE: ['Dublin', 'Cork'], IT: ['Genoa', 'La Spezia', 'Naples'],
    JP: ['Tokyo', 'Yokohama', 'Osaka', 'Kobe', 'Nagoya'], JO: ['Aqaba'], KE: ['Mombasa', 'Lamu'], LB: ['Beirut'], LR: ['Monrovia'],
    LY: ['Tripoli', 'Misrata', 'Benghazi'], MG: ['Toamasina'], MW: ['Via Beira', 'Via Nacala', 'Via Dar es Salaam'],
    MY: ['Port Klang', 'Penang', 'Pasir Gudang', 'Tanjung Pelepas'], MV: ['Malé'], ML: ['Via Dakar', 'Via Abidjan', 'Bamako ICD'],
    MR: ['Nouakchott', 'Nouadhibou'], MU: ['Port Louis'], MA: ['Casablanca', 'Tanger Med', 'Agadir'], MZ: ['Maputo', 'Beira', 'Nacala'],
    MM: ['Yangon'], NP: ['Via Kolkata', 'Birgunj ICD'], NL: ['Rotterdam', 'Amsterdam'], NZ: ['Auckland', 'Tauranga', 'Lyttelton'],
    NE: ['Via Cotonou', 'Via Lomé', 'Niamey ICD'], NG: ['Lagos (Apapa)', 'Lagos (Tin Can Island)', 'Onne', 'Lekki'],
    PK: ['Karachi', 'Port Qasim'], PH: ['Manila', 'Cebu', 'Davao'], PL: ['Gdańsk', 'Gdynia'], PT: ['Lisbon', 'Leixões', 'Sines'],
    RU: ['Novorossiysk', 'St Petersburg', 'Vladivostok'], RW: ['Via Mombasa', 'Via Dar es Salaam', 'Kigali ICD'], SN: ['Dakar'],
    SC: ['Port Victoria'], SL: ['Freetown'], SG: ['Singapore'], SO: ['Mogadishu', 'Berbera', 'Bosaso'],
    ZA: ['Durban', 'Cape Town', 'Gqeberha (Port Elizabeth)'], KR: ['Busan', 'Incheon'], ES: ['Valencia', 'Algeciras', 'Barcelona'],
    LK: ['Colombo'], SD: ['Port Sudan'], SE: ['Gothenburg'], CH: ['Via Rotterdam', 'Via Antwerp', 'Basel'], SY: ['Latakia', 'Tartus'],
    TW: ['Kaohsiung', 'Keelung'], TZ: ['Dar es Salaam', 'Zanzibar', 'Tanga'], TH: ['Laem Chabang', 'Bangkok'], TG: ['Lomé'],
    TN: ['Radès', 'Sfax', 'Sousse'], TR: ['Mersin', 'Istanbul (Ambarli)', 'Izmir'], UG: ['Via Mombasa', 'Via Dar es Salaam', 'Kampala ICD'],
    UA: ['Odesa', 'Chornomorsk'], GB: ['Felixstowe', 'Southampton', 'London Gateway', 'Liverpool'],
    US: ['New York / New Jersey', 'Houston', 'Savannah', 'Los Angeles / Long Beach', 'Oakland'], UZ: ['Via Bandar Abbas', 'Tashkent ICD'],
    VN: ['Ho Chi Minh City (Cat Lai)', 'Haiphong'], YE: ['Aden', 'Hodeidah', 'Mukalla'], ZM: ['Via Dar es Salaam', 'Via Durban', 'Lusaka ICD'],
    ZW: ['Via Beira', 'Via Durban', 'Harare ICD']
  };
  var OTHER = '__other';
  var byName = {}; C.forEach(function (c) { byName[c[1]] = c; });
  var SORTED = C.slice(7).sort(function (a, b) { return a[1].localeCompare(b[1]); });

  var CSS = '.dp{position:relative;flex-shrink:0}.dp.dp-full{width:100%}' +
    '.dp-btn{display:flex;align-items:center;gap:8px;width:100%;height:100%;min-height:46px;padding:0 10px 0 12px;border-radius:8px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#fff;font-size:14px;cursor:pointer;white-space:nowrap;text-align:start}' +
    '.dp-btn:hover{background:rgba(255,255,255,.15)}.dp-btn:focus-visible,.dp-btn[aria-expanded=true]{outline:none;border-color:#E5C158}' +
    '.dp-btn:disabled{opacity:.55;cursor:not-allowed}.dp-btn.dp-invalid{border-color:#f87171}' +
    '.dp-val{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}.dp-val.dp-ph{color:rgba(167,243,208,.8)}' +
    '.dp-flag{width:22px;height:16px;border-radius:3px;object-fit:cover;box-shadow:0 0 0 1px rgba(255,255,255,.25);flex-shrink:0;background:#2a4a40}' +
    '.dp-globe{width:20px;height:20px;flex-shrink:0;color:rgba(167,243,208,.7)}' +
    '.dp-chev{width:14px;height:14px;opacity:.7;transition:transform .15s;flex-shrink:0}.dp-btn[aria-expanded=true] .dp-chev{transform:rotate(180deg)}' +
    '.dp-pop{position:absolute;z-index:60;top:calc(100% + 6px);left:0;width:min(20rem,calc(100vw - 32px));background:#0E2820;border:1px solid rgba(229,193,88,.35);border-radius:12px;box-shadow:0 18px 40px rgba(0,0,0,.45);overflow:hidden}' +
    '.dp-full .dp-pop{width:100%;min-width:min(16rem,calc(100vw - 32px))}[dir=rtl] .dp-full .dp-pop{left:auto;right:0}' +
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
    '.dp-empty{padding:14px 10px;color:rgba(226,232,240,.6);font-size:13px}' +
    '.dp-native{position:absolute!important;left:0;bottom:0;width:1px!important;height:1px!important;opacity:0;pointer-events:none}';
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  var FLAG = function (iso) { return '/images/flags/' + iso.toLowerCase() + '.svg'; };
  var chev = '<svg class="dp-chev" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z"/></svg>';
  var globe = '<svg class="dp-globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9S14.5 18.3 12 21c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/></svg>';
  var uid = 0;
  function icon(iso, lazy) {
    return iso ? '<img class="dp-flag"' + (lazy ? ' loading="lazy"' : '') + ' alt="" width="22" height="16" src="' + FLAG(iso) + '">' : globe;
  }
  function attr(el, k, d) { return el.getAttribute(k) || d; }

  // Generic flag picker on top of a native <select>.
  // cfg.items() -> [{ v, iso, label, right, group }]; cfg.btn(item) -> button text; cfg.full -> full width.
  function makePicker(sel, cfg) {
    var id = 'dp' + (++uid);
    var wrap = document.createElement('div'); wrap.className = 'dp' + (cfg.full ? ' dp-full' : '');
    wrap.innerHTML = '<button type="button" class="dp-btn" aria-haspopup="listbox" aria-expanded="false" aria-controls="' + id + '-list"><span class="dp-ico"></span><span class="dp-val"></span>' + chev + '</button>' +
      '<div class="dp-pop" hidden><input type="search" class="dp-search" autocomplete="off" spellcheck="false" aria-controls="' + id + '-list"><ul class="dp-list" role="listbox" id="' + id + '-list"></ul></div>';
    sel.parentNode.insertBefore(wrap, sel);
    if (cfg.full) { sel.parentNode.style.position = 'relative'; sel.classList.add('dp-native'); }
    else { sel.style.display = 'none'; }
    sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true');
    var btn = wrap.querySelector('.dp-btn'), pop = wrap.querySelector('.dp-pop'), q = wrap.querySelector('.dp-search'), list = wrap.querySelector('.dp-list');
    q.placeholder = attr(sel, 'data-search', 'Search');
    var lab = sel.id && document.querySelector('label[for="' + sel.id + '"]');
    if (lab) { lab.htmlFor = id + '-btn'; btn.id = id + '-btn'; } else btn.setAttribute('aria-label', attr(sel, 'aria-label', ''));
    var active = -1, shown = [];
    function current() { var v = sel.value; var it = cfg.items().filter(function (x) { return x.v === v; })[0]; return v ? it : null; }
    function paint() {
      var it = current(), val = wrap.querySelector('.dp-val');
      wrap.querySelector('.dp-ico').innerHTML = it ? icon(it.iso) : (cfg.phIso && cfg.phIso() ? icon(cfg.phIso()) : (cfg.full ? globe : ''));
      val.textContent = it ? cfg.btn(it) : (cfg.ph ? cfg.ph() : '');
      val.classList.toggle('dp-ph', !it);
      btn.title = it ? it.label + (it.right ? ' (' + it.right + ')' : '') : '';
      btn.disabled = !!(cfg.disabled && cfg.disabled());
      if (it) btn.classList.remove('dp-invalid');
    }
    function render(term) {
      term = String(term || '').trim().toLowerCase().replace(/^\+/, '');
      list.innerHTML = ''; shown = []; active = -1;
      var items = cfg.items(), groups = [], gi = {};
      items.forEach(function (x) {
        if (term && !(x.label.toLowerCase().indexOf(term) !== -1 || (x.right && x.right.replace('+', '').indexOf(term) === 0) || (x.iso && x.iso.toLowerCase() === term) || x.v === OTHER)) return;
        var g = term ? '' : (x.group || '');
        if (!(g in gi)) { gi[g] = groups.length; groups.push([g, []]); }
        groups[gi[g]][1].push(x);
      });
      groups.forEach(function (g) {
        if (g[0]) { var h = document.createElement('li'); h.className = 'dp-head'; h.setAttribute('role', 'presentation'); h.textContent = g[0]; list.appendChild(h); }
        g[1].forEach(function (x, n) {
          var li = document.createElement('li');
          li.className = 'dp-opt'; li.setAttribute('role', 'option'); li.id = id + '-o' + shown.length;
          li.setAttribute('aria-selected', x.v === sel.value ? 'true' : 'false');
          li.innerHTML = icon(x.iso, true) + '<span class="dp-name"></span>' + (x.right ? '<span class="dp-code"></span>' : '');
          li.querySelector('.dp-name').textContent = x.label;
          if (x.right) li.querySelector('.dp-code').textContent = x.right;
          li.addEventListener('mousedown', function (e) { e.preventDefault(); });
          li.addEventListener('click', function () { choose(x.v); });
          list.appendChild(li); shown.push(li);
        });
      });
      if (!shown.length) { var n = document.createElement('li'); n.className = 'dp-empty'; n.textContent = attr(sel, 'data-none', 'No match'); list.appendChild(n); }
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
      if (!pop.hidden || btn.disabled) return;
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
    function choose(v) {
      sel.value = v; paint();
      sel.dispatchEvent(new Event('change', { bubbles: true })); close(true);
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
    sel.addEventListener('invalid', function () { btn.classList.add('dp-invalid'); setTimeout(function () { btn.focus(); }, 0); });
    sel.addEventListener('focus', function () { btn.focus(); });
    sel.addEventListener('change', paint);
    paint();
    return { paint: paint, close: close };
  }
  function opt(sel, v, text) { var o = document.createElement('option'); o.value = v; o.textContent = text; sel.appendChild(o); }
  function toggleOther(input, on) {
    if (!input) return;
    input.hidden = !on; input.required = on;
    if (!on) input.value = '';
  }

  // ---- Destination country ----
  var countryPickers = [];
  document.querySelectorAll('select[data-country-picker]').forEach(function (sel) {
    var top = attr(sel, 'data-top-label', 'Gulf & India'), all = attr(sel, 'data-all-label', 'All countries');
    var otherTxt = attr(sel, 'data-other', 'Other country');
    sel.innerHTML = '';
    opt(sel, '', attr(sel, 'data-ph', 'Select country…')); sel.options[0].disabled = true; sel.options[0].selected = true;
    C.slice(0, 7).concat(SORTED).forEach(function (c) { opt(sel, c[1], c[1]); });
    opt(sel, OTHER, otherTxt);
    var items = C.slice(0, 7).map(function (c) { return { v: c[1], iso: c[0], label: c[1], group: top }; })
      .concat(SORTED.map(function (c) { return { v: c[1], iso: c[0], label: c[1], group: all }; }))
      .concat([{ v: OTHER, iso: '', label: otherTxt, group: all }]);
    var other = sel.form && sel.form.querySelector('[name="country_other"]');
    var pk = makePicker(sel, { full: true, items: function () { return items; }, btn: function (x) { return x.label; },
      ph: function () { return attr(sel, 'data-ph', 'Select country…'); } });
    sel.addEventListener('change', function () { toggleOther(other, sel.value === OTHER); if (sel.value === OTHER) other.focus(); });
    countryPickers.push(pk);
  });

  // ---- Destination port (depends on country) ----
  document.querySelectorAll('select[data-port-picker]').forEach(function (sel) {
    var form = sel.form, country = form && form.querySelector('select[name="country"]');
    var other = form && form.querySelector('[name="port_other"]');
    var otherTxt = attr(sel, 'data-other', 'Other port');
    function iso() { var c = country && byName[country.value]; return c ? c[0] : ''; }
    function items() {
      var i = iso(), list = (PORTS[i] || []).map(function (pName) { return { v: pName, iso: i, label: pName }; });
      return list.concat([{ v: OTHER, iso: '', label: otherTxt }]);
    }
    function fill() {
      sel.innerHTML = ''; opt(sel, '', ''); sel.options[0].disabled = true; sel.options[0].selected = true;
      items().forEach(function (x) { opt(sel, x.v, x.label); });
    }
    fill();
    var pk = makePicker(sel, { full: true, items: items, btn: function (x) { return x.label; },
      disabled: function () { return !country || !country.value; }, phIso: iso,
      ph: function () { return country && country.value ? attr(sel, 'data-ph', 'Select port…') : attr(sel, 'data-first', 'Choose the country first'); } });
    if (country) country.addEventListener('change', function () {
      fill();
      var only = country.value === OTHER || !PORTS[iso()];
      if (only) sel.value = OTHER;
      toggleOther(other, sel.value === OTHER);
      pk.paint();
    });
    sel.addEventListener('change', function () { toggleOther(other, sel.value === OTHER); if (sel.value === OTHER) other.focus(); });
    if (form) form.addEventListener('reset', function () { setTimeout(function () { fill(); toggleOther(other, false); pk.paint(); }, 0); });
  });
  document.querySelectorAll('form').forEach(function (form) {
    form.addEventListener('reset', function () {
      setTimeout(function () { toggleOther(form.querySelector('[name="country_other"]'), false); countryPickers.forEach(function (p) { p.paint(); }); }, 0);
    });
    form.addEventListener('formdata', function (e) {
      [['country', 'country_other'], ['port', 'port_other']].forEach(function (k) {
        if (e.formData.get(k[0]) === OTHER) e.formData.set(k[0], String(e.formData.get(k[1]) || '').trim());
        e.formData.delete(k[1]);
      });
    });
  });

  // ---- Phone country code ----
  document.querySelectorAll('select[data-dialcodes]').forEach(function (sel) {
    var top = attr(sel, 'data-top-label', 'Gulf & India'), all = attr(sel, 'data-all-label', 'All countries');
    C.forEach(function (c) { opt(sel, c[0], '+' + c[2] + ' ' + c[1]); });
    sel.value = guess();
    var items = C.map(function (c, i) { return { v: c[0], iso: c[0], label: c[1], right: '+' + c[2], group: i < 7 ? top : all }; });
    var pk = makePicker(sel, { items: function () { return items; }, btn: function (x) { return x.right; } });

    var form = sel.form;
    if (!form) return;
    var userPicked = false;
    sel.addEventListener('change', function (e) { if (e.isTrusted !== false) userPicked = true; });
    var country = form.querySelector('[name="country"]');
    if (country) country.addEventListener('change', function () {
      var i = byName[country.value] ? byName[country.value][0] : findIso(country.value);
      if (i && !userPicked) { sel.value = i; pk.paint(); }
    });
    form.addEventListener('reset', function () { setTimeout(function () { userPicked = false; sel.value = guess(); pk.paint(); }, 0); });
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
