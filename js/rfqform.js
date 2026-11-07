/* Bhumi Varahi Impex: RFQ form controller (shared by /, /ar/, /fr/).
 * 3 steps with progress bar, saved draft, client RFQ No., success panel with copy + WhatsApp.
 * Form attributes: data-endpoint (Apps Script URL), data-lang (en|ar|fr), data-tag ("" | "AR" | "FR").
 */
(function () {
  'use strict';
  var form = document.getElementById('rfqForm');
  if (!form) return;
  var i18nEl = document.getElementById('rfqI18n');
  var T = {};
  try { T = JSON.parse(i18nEl ? i18nEl.textContent : '{}'); } catch (e) {}
  var lang = form.getAttribute('data-lang') || 'en';
  var tag = form.getAttribute('data-tag') || '';
  var endpoint = form.getAttribute('data-endpoint') || '';
  var WA = '919492992666';
  var KEY = 'bvRfqDraft:' + lang, MAX_AGE = 14 * 864e5;

  var $ = function (s) { return form.querySelector(s); };
  var steps = [].slice.call(form.querySelectorAll('[data-rfq-step]'));
  var prog = $('[data-rfq-progress]'), bar = $('[data-rfq-bar]'), stepOf = $('[data-rfq-stepof]');
  var labels = [].slice.call(form.querySelectorAll('[data-rfq-steplabel]'));
  var back = $('[data-rfq-back]'), next = $('[data-rfq-next]'), submit = $('#rfqSubmit');
  var nav = $('[data-rfq-nav]'), err = $('[data-rfq-error]'), done = $('[data-rfq-done]');
  var restored = $('[data-rfq-restored]');
  var cur = 0, last = steps.length - 1, sending = false;

  form.noValidate = true;
  // Tailwind's display classes (flex, etc.) would otherwise beat the hidden attribute.
  var css = document.createElement('style'); css.textContent = '#rfqForm [hidden]{display:none!important}'; document.head.appendChild(css);
  if (prog) { prog.classList.remove('hidden'); prog.removeAttribute('aria-hidden'); }

  function show(i) {
    cur = Math.max(0, Math.min(last, i));
    steps.forEach(function (s, n) { s.hidden = n !== cur; });
    if (back) back.hidden = cur === 0;
    if (next) next.hidden = cur === last;
    if (submit) submit.hidden = cur !== last;
    if (bar) bar.style.width = Math.round((cur + 1) / steps.length * 100) + '%';
    labels.forEach(function (l, n) {
      l.style.color = n === cur ? '#fde68a' : (n < cur ? '#a7f3d0' : '');
      if (n === cur) l.setAttribute('aria-current', 'step'); else l.removeAttribute('aria-current');
    });
    if (stepOf) stepOf.textContent = String(T.step_of || '').replace('{n}', cur + 1).replace('{t}', steps.length) + (T.steps ? ': ' + T.steps[cur] : '');
  }

  // Validate one step; report the first problem.
  function fields(s) { return [].slice.call(s.querySelectorAll('input,select,textarea')).filter(function (el) { return el.willValidate && !el.hidden; }); }
  function validStep(i, report) {
    var bad = fields(steps[i]).filter(function (el) { return !el.checkValidity(); })[0];
    if (bad && report) { show(i); bad.reportValidity(); }
    return !bad;
  }
  function goNext() {
    if (!validStep(cur, true)) return;
    show(cur + 1); hideErr();
    var first = fields(steps[cur])[0];
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (first) setTimeout(function () { (first.classList.contains('dp-native') ? first.parentNode.querySelector('.dp-btn') || first : first).focus({ preventScroll: true }); }, 50);
  }
  if (next) next.addEventListener('click', goNext);
  if (back) back.addEventListener('click', function () { show(cur - 1); form.scrollIntoView({ behavior: 'smooth', block: 'start' }); });

  // Enter in a text field moves forward instead of submitting early.
  form.addEventListener('keydown', function (e) {
    var t = e.target;
    if (e.key !== 'Enter' || cur === last || t.tagName === 'TEXTAREA' || t.tagName === 'BUTTON' || t.type === 'search') return;
    if (t.tagName === 'INPUT') { e.preventDefault(); goNext(); }
  });

  function hideErr() { if (err) { err.hidden = true; err.textContent = ''; } }
  function showErr(msg) { if (err) { err.textContent = msg; err.hidden = false; } }

  // ---- Draft save / restore ----
  var dial = form.querySelector('select[data-dialcodes]');
  function store(fn) { try { return fn(window.localStorage); } catch (e) { return null; } }
  function snapshot() {
    var d = {};
    [].slice.call(form.elements).forEach(function (el) {
      if (!el.name || el.name === 'botcheck' || el.type === 'search' || el.type === 'checkbox' || el.type === 'radio' || el.type === 'button' || el.type === 'submit') return;
      if (el.value) d[el.name] = el.value;
    });
    if (dial) d._dial = dial.value;
    return d;
  }
  var saveT;
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(function () {
      var d = snapshot(), keys = Object.keys(d).filter(function (k) { return k !== '_dial'; });
      store(function (s) { if (keys.length) s.setItem(KEY, JSON.stringify({ t: Date.now(), d: d })); else s.removeItem(KEY); });
    }, 300);
  }
  function clearDraft() { clearTimeout(saveT); store(function (s) { s.removeItem(KEY); }); }
  function setVal(name, v) {
    var el = form.elements[name];
    if (!el || v == null) return;
    if (el.tagName === 'SELECT' && ![].some.call(el.options, function (o) { return o.value === v; })) return;
    el.value = v;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function restore() {
    var raw = store(function (s) { return s.getItem(KEY); });
    if (!raw) return false;
    var o; try { o = JSON.parse(raw); } catch (e) { return false; }
    if (!o || !o.d || Date.now() - (o.t || 0) > MAX_AGE) { clearDraft(); return false; }
    var d = o.d;
    // Order matters: country fills the port list, then the dial code follows the country.
    setVal('country', d.country); setVal('country_other', d.country_other);
    setVal('port', d.port); setVal('port_other', d.port_other);
    Object.keys(d).forEach(function (k) {
      if (k.charAt(0) === '_' || k === 'country' || k === 'port' || k === 'country_other' || k === 'port_other') return;
      setVal(k, d[k]);
    });
    if (dial && d._dial && [].some.call(dial.options, function (x) { return x.value === d._dial; })) { dial.value = d._dial; dial.dispatchEvent(new Event('change')); }
    return true;
  }
  form.addEventListener('input', save);
  form.addEventListener('change', save);
  if (restored) {
    var clr = restored.querySelector('[data-rfq-clear]');
    if (clr) clr.addEventListener('click', function () { clearDraft(); form.reset(); restored.hidden = true; hideErr(); show(0); setTimeout(clearDraft, 350); });
  }

  // ---- RFQ number (IST) ----
  function makeRef() {
    var d = new Date(Date.now() + 330 * 60000), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return 'BV-' + p(d.getUTCFullYear() % 100) + p(d.getUTCMonth() + 1) + p(d.getUTCDate()) + '-' + p(d.getUTCHours()) + p(d.getUTCMinutes()) + p(d.getUTCSeconds());
  }

  function waLink(ref, data) {
    var port = data.get('port'), country = data.get('country');
    var lines = [T.wa_msg || 'Hello Bhumi Varahi Impex, I have just sent an RFQ on your website.', '',
      'RFQ No.: ' + ref,
      'Product: ' + (data.get('commodity') || '-') + (data.get('grade') ? ' (' + data.get('grade') + ')' : ''),
      'Quantity: ' + (data.get('quantity') || '-'),
      'Destination: ' + (/\(transit\)$/.test(port || '') ? port + ' -> ' + [data.get('final_dest'), country].filter(Boolean).join(', ') : [port, country].filter(Boolean).join(', ')),
      'Incoterm: ' + (data.get('incoterm') || '-'),
      'Company: ' + (data.get('name') || '-')];
    return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(lines.join('\n'));
  }

  function setSending(on) {
    sending = on;
    if (!submit) return;
    submit.disabled = on;
    submit.textContent = on ? (T.sending || 'Sending…') : (T.submit || 'Submit');
  }

  function showDone(ref, data) {
    [prog, restored, nav, err].forEach(function (x) { if (x) x.hidden = true; });
    if (prog) prog.classList.add('hidden');
    steps.forEach(function (s) { s.hidden = true; });
    done.querySelector('[data-rfq-ref]').textContent = ref;
    var wa = done.querySelector('[data-rfq-wa]'); if (wa) wa.href = waLink(ref, data);
    done.hidden = false;
    done.scrollIntoView({ behavior: 'smooth', block: 'center' });
    done.focus({ preventScroll: true });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (sending) return;
    if (cur < last) { goNext(); return; }
    for (var i = 0; i <= last; i++) if (!validStep(i, true)) return;
    var data = new FormData(form);
    if (data.get('botcheck')) return;
    var ref = makeRef();
    data.set('ref', ref);
    if (tag) data.set('notes', '[' + tag + '] ' + (data.get('notes') || ''));
    hideErr();
    if (!endpoint) { showErr(T.err || 'Could not send.'); return; }
    setSending(true);
    fetch(endpoint, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(data) }).then(function () {
      if (window.gtag) window.gtag('event', 'generate_lead', { commodity: data.get('commodity'), method: lang === 'en' ? 'rfq_form' : 'rfq_form_' + lang });
      clearDraft();
      showDone(ref, data);
    }, function () {
      showErr(T.err || 'Could not send. Please email info@bhumivarahiimpex.com.');
    }).then(function () { setSending(false); });
  });

  // ---- Success panel actions ----
  if (done) {
    var copy = done.querySelector('[data-rfq-copy]');
    if (copy) copy.addEventListener('click', function () {
      var txt = done.querySelector('[data-rfq-ref]').textContent;
      function ok() { copy.textContent = T.copied || copy.getAttribute('data-copied') || 'Copied'; setTimeout(function () { copy.textContent = T.copy || 'Copy'; }, 2000); }
      function fallback() {
        var ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); ok(); } catch (e) {}
        ta.remove();
      }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, fallback); else fallback();
    });
    var again = done.querySelector('[data-rfq-another]');
    if (again) again.addEventListener('click', function () {
      form.reset(); clearDraft();
      done.hidden = true;
      if (nav) nav.hidden = false;
      if (prog) { prog.hidden = false; prog.classList.remove('hidden'); }
      show(0);
      setTimeout(clearDraft, 350);
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // ---- Init (after dialcodes.js has built the pickers; both are deferred, this one loads second) ----
  show(0);
  if (restore() && restored) restored.hidden = false;
  var c = new URLSearchParams(location.search).get('commodity');
  if (c) setVal('commodity', c);
})();
