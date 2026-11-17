(function () {
  var CFG = window.SITE_CONFIG || {};
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nf = new Intl.NumberFormat('he-IL');
  var money = function (n) { return '₪' + nf.format(Math.round(n)); };

  /* reveal + count-up */
  function countUp(el) {
    var to = +el.dataset.count, t0 = null, dur = 1200;
    if (reduce) { el.textContent = to; return; }
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  document.querySelectorAll('.grid2,.steps,.deliv__list,.testis,.people').forEach(function (g) {
    g.querySelectorAll('.reveal').forEach(function (el, i) { el.style.setProperty('--d', (i * 0.08) + 's'); });
  });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      e.target.querySelectorAll('[data-count]').forEach(countUp);
      if (e.target.matches('[data-count]')) countUp(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* timeline line draw */
  var tl = document.querySelector('.tl');
  new IntersectionObserver(function (es, o) {
    if (es[0].isIntersecting) { tl.style.setProperty('--draw', 1); o.disconnect(); }
  }, { threshold: 0.2 }).observe(tl);

  /* parallax on decorative shapes */
  if (!reduce) {
    var shapes = document.querySelectorAll('.shape');
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        shapes.forEach(function (s) {
          var r = s.parentElement.getBoundingClientRect();
          var p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
          s.style.translate = '0 ' + Math.max(-40, Math.min(40, p * -40)) + 'px';
        });
        ticking = false;
      });
    }, { passive: true });
  }

  /* calculator */
  var C = CFG.CALC || { baseConversion: .02, conversionLift: .005, retentionLift: .005, retentionMultiplier: 12 };
  var rev = document.getElementById('rev'), mode = 'conv';
  function calc() {
    var r = +rev.value;
    var gain = mode === 'conv' ? r * (C.conversionLift / C.baseConversion) : r * C.retentionLift * C.retentionMultiplier;
    document.getElementById('revOut').textContent = money(r);
    document.getElementById('gainM').textContent = '+' + money(gain);
    document.getElementById('gainY').textContent = money(gain * 12);
    rev.style.setProperty('--p', ((r - rev.min) / (rev.max - rev.min) * 100) + '%');
  }
  rev.addEventListener('input', calc);
  document.querySelectorAll('.toggle button').forEach(function (b) {
    b.addEventListener('click', function () {
      mode = b.dataset.mode;
      document.querySelectorAll('.toggle button').forEach(function (x) {
        x.classList.toggle('is-on', x === b); x.setAttribute('aria-checked', x === b);
      });
      calc();
    });
  });
  calc();

  /* video */
  if (CFG.VIDEO_EMBED_URL) {
    var v = document.getElementById('video');
    v.querySelector('.video__play').addEventListener('click', function () {
      v.innerHTML = '<iframe src="' + CFG.VIDEO_EMBED_URL + '" allow="autoplay; fullscreen" allowfullscreen title="סרטון הסבר eCom Shift"></iframe>';
    });
  }

  /* gantt mockup */
  var rows = [['אתר', [[0, 3, '#E8722A'], [5, 4, '#F5A25D']]], ['שימור', [[1, 5, '#1E3A6E'], [8, 3, '#2F5BB7']]], ['קמפיינים', [[2, 4, '#F5A25D'], [7, 5, '#E8722A']]], ['דאטה', [[0, 2, '#2F5BB7'], [3, 6, '#D6E2F5']]], ['צוות', [[4, 3, '#1E3A6E'], [9, 3, '#F5A25D']]], ['ספקים', [[1, 3, '#D6E2F5'], [6, 4, '#2F5BB7']]], ['KPIs', [[3, 9, '#E8722A']]]];
  var g = document.getElementById('gantt'), h = '<span></span>';
  for (var w = 1; w <= 12; w++) h += '<span class="wk">W' + w + '</span>';
  rows.forEach(function (r) {
    h += '<span class="row">' + r[0] + '</span>';
    var cells = 0;
    r[1].forEach(function (b) {
      if (b[0] > cells) { h += '<span style="grid-column:span ' + (b[0] - cells) + '"></span>'; }
      h += '<span class="bar" style="grid-column:span ' + b[1] + ';background:' + b[2] + '"></span>';
      cells = b[0] + b[1];
    });
    if (cells < 12) h += '<span style="grid-column:span ' + (12 - cells) + '"></span>';
  });
  g.innerHTML = h;

  /* mobile sticky CTA */
  var hero = document.querySelector('.hero'), mcta = document.getElementById('mcta');
  new IntersectionObserver(function (es) { mcta.classList.toggle('show', !es[0].isIntersecting); }).observe(hero);

  /* multi-step form */
  var modal = document.getElementById('modal'), form = document.getElementById('qform');
  var stepEls = form.querySelectorAll('.step-f'), cur = 1, lastFocus = null;
  var data = { budget: '', pains: [] };
  var nextBtn = document.getElementById('nextBtn'), backBtn = document.getElementById('backBtn'), nav = document.getElementById('mnav');

  function show(n) {
    cur = n;
    stepEls.forEach(function (s) { s.classList.toggle('is-on', +s.dataset.step === n); });
    var done = n === 5;
    document.getElementById('progBar').style.width = (Math.min(n, 4) * 25) + '%';
    document.getElementById('progTxt').textContent = done ? 'סיימנו' : 'שלב ' + n + ' מתוך 4';
    backBtn.style.visibility = n > 1 && !done ? 'visible' : 'hidden';
    nav.style.display = done ? 'none' : 'flex';
    nextBtn.textContent = n === 4 ? 'שליחה' : 'המשך';
    document.getElementById('lowBudget').hidden = !(n === 4 && data.budget === 'up-to-100k');
    var first = form.querySelector('.step-f.is-on input, .step-f.is-on button');
    if (first) setTimeout(function () { first.focus(); }, 50);
  }
  function open() {
    lastFocus = document.activeElement;
    modal.hidden = false; document.body.style.overflow = 'hidden';
    if (cur === 5) { form.reset(); data = { budget: '', pains: [] }; form.querySelectorAll('.choices button').forEach(function (b) { b.classList.remove('is-on'); }); }
    show(cur === 5 ? 1 : cur);
  }
  function close() { modal.hidden = true; document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  document.querySelectorAll('[data-open-form]').forEach(function (b) { b.addEventListener('click', open); });
  modal.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', close); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) close(); });

  function err(k, on) { var e = form.querySelector('[data-err="' + k + '"]'); if (e) e.classList.toggle('show', on); return !on; }
  function validate(n) {
    var f = form.elements, ok = true;
    if (n === 1) ok = err('site', !/^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/\S*)?$/i.test(f.site.value.trim()));
    if (n === 2) ok = err('budget', !data.budget);
    if (n === 3) ok = err('pains', !data.pains.length);
    if (n === 4) {
      var phone = f.phone.value.replace(/[\s-]/g, '').replace(/^\+972/, '0');
      ok = err('name', !f.name.value.trim()) & err('phone', !/^05\d{8}$/.test(phone)) &
        err('email', f.email.value.trim() !== '' && !/^\S+@\S+\.\S+$/.test(f.email.value.trim())) &
        err('consent', !f.consent.checked);
    }
    return !!ok;
  }

  form.querySelector('[data-single]').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    data.budget = b.dataset.v;
    this.querySelectorAll('button').forEach(function (x) { x.classList.toggle('is-on', x === b); });
    err('budget', false);
    setTimeout(function () { show(3); }, 220);
  });
  form.querySelector('[data-multi]').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    b.classList.toggle('is-on');
    data.pains = Array.prototype.map.call(this.querySelectorAll('.is-on'), function (x) { return x.dataset.v; });
    if (data.pains.length) err('pains', false);
  });
  backBtn.addEventListener('click', function () { if (cur > 1) show(cur - 1); });
  nextBtn.addEventListener('click', function () {
    if (!validate(cur)) return;
    if (cur < 4) return show(cur + 1);
    submit();
  });
  form.addEventListener('submit', function (e) { e.preventDefault(); nextBtn.click(); });

  function submit() {
    var f = form.elements, q = new URLSearchParams(location.search), utm = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) { if (q.get(k)) utm[k] = q.get(k); });
    var payload = {
      site: f.site.value.trim(), budget: data.budget, qualified: data.budget !== 'up-to-100k',
      pains: data.pains, more: f.more.value.trim(), name: f.name.value.trim(),
      phone: f.phone.value.trim(), email: f.email.value.trim(), consent: true,
      utm: utm, page: location.href, submittedAt: new Date().toISOString()
    };
    nextBtn.disabled = true; nextBtn.textContent = 'שולחים…';
    var done = function () { nextBtn.disabled = false; show(5); };
    if (!CFG.LEAD_WEBHOOK_URL) { console.info('[eCom Shift] lead (no webhook set):', payload); return done(); }
    fetch(CFG.LEAD_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(done)
      .catch(function () { nextBtn.disabled = false; nextBtn.textContent = 'שליחה'; alert('משהו השתבש בשליחה. נסו שוב בעוד רגע.'); });
  }
})();
