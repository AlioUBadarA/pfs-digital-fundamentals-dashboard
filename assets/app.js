/* PFS RIZAO Digital Fundamentals dashboard.
 * The page holds no personal data: it asks the Apps Script web app for aggregated figures (by country).
 * Without API_URL (or with ?demo=1) it shows FICTITIOUS demonstration data computed in the browser.
 * Shareable links: ?phase=both&country=Senegal&lang=fr */
(function () {
  'use strict';

  var COLORS = { blue: '#2A6AA3', green: '#5DB246', yellow: '#E3B23C', red: '#C22A3A', oo2Blue: '#3A6AB2',
    text: '#1F2A37', soft: '#5B6775', grid: '#E5EAF0' };
  var PHASES = [
    { id: 'both', en: 'Before vs after (comparison)', fr: 'Questionnaire AVANT / APRES (comparaison)' },
    { id: 'pre', en: 'Before only', fr: 'Questionnaire AVANT seulement' },
    { id: 'post', en: 'After only', fr: 'Questionnaire APRES seulement' }
  ];
  var ALL_COUNTRIES = 'All countries';
  var CACHE_MS = 5 * 60 * 1000;

  var API_URL = (window.PFS_CONFIG && window.PFS_CONFIG.API_URL) || '';
  var DEMO = new URLSearchParams(window.location.search).get('demo') === '1' || !API_URL || API_URL.indexOf('PASTE_') === 0;
  var app = document.getElementById('app');
  var els = {
    phase: document.getElementById('f-phase'), country: document.getElementById('f-country'), scope: document.getElementById('scope'),
    updated: document.getElementById('updated'), langEn: document.getElementById('lang-en'), langFr: document.getElementById('lang-fr'),
    demo: document.getElementById('demo')
  };
  var LANG = initLang();

  function tr(en, fr) { return LANG === 'fr' ? fr : en; }
  function dom(id) { var d = DF.DOMAINS.filter(function (x) { return x.id === id; })[0]; return LANG === 'fr' ? d.fr : d.en; }
  function initLang() {
    var q = new URLSearchParams(window.location.search).get('lang');
    if (q === 'fr' || q === 'en') return q;
    try { var s = localStorage.getItem('pfs_lang'); if (s === 'fr' || s === 'en') return s; } catch (e) { /* ignore */ }
    return 'en';
  }

  var state = readUrl(), cache = {}, charts = [], pending = [], requestId = 0, data = null;

  if (window.Chart) {
    Chart.defaults.font.family = "'Poppins', 'Segoe UI', Arial, sans-serif";
    Chart.defaults.color = COLORS.text;
  }

  /* ---------------- helpers ---------------- */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') node.textContent = attrs[k];
      else if (k === 'class') node.className = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }
  function isNum(v) { return typeof v === 'number' && !isNaN(v); }
  function pct(v) { return isNum(v) ? Math.round(v * 100) + '%' : '-'; }
  function num(v) { return isNum(v) ? String(v) : '-'; }
  function dec(v) { return isNum(v) ? (LANG === 'fr' ? v.toFixed(1).replace('.', ',') : v.toFixed(1)) : '-'; }
  function signed(n) { return (n > 0 ? '+' : '') + n; }
  function change(a, b) {
    if (!isNum(a) || !isNum(b)) return { t: '', cls: 'flat' };
    var d = Math.round((b - a) * 100);
    return { t: signed(d) + (Math.abs(d) === 1 ? ' pt' : ' pts'), cls: d > 0 ? 'up' : (d < 0 ? 'down' : 'flat') };
  }
  function countryName(c) { return LANG === 'fr' && DF.COUNTRIES_FR[c] ? DF.COUNTRIES_FR[c] : c; }
  function readUrl() {
    var p = new URLSearchParams(window.location.search), phase = p.get('phase');
    return { phase: PHASES.some(function (x) { return x.id === phase; }) ? phase : 'both', country: p.get('country') || ALL_COUNTRIES };
  }
  function writeUrl() {
    var p = new URLSearchParams();
    if (state.phase !== 'both') p.set('phase', state.phase);
    if (state.country !== ALL_COUNTRIES) p.set('country', state.country);
    if (LANG === 'fr') p.set('lang', 'fr');
    if (DEMO && new URLSearchParams(window.location.search).get('demo') === '1') p.set('demo', '1');
    var q = p.toString();
    try { history.replaceState(null, '', window.location.pathname + (q ? '?' + q : '')); } catch (e) { /* ignore */ }
  }
  function showBefore() { return state.phase !== 'post'; }
  function showAfter() { return state.phase !== 'pre'; }

  /* ---------------- data ---------------- */
  function load() {
    var key = state.country;
    var hit = cache[key];
    if (hit && Date.now() - hit.at < CACHE_MS) return Promise.resolve(hit.data);
    if (DEMO) {
      var d = DF.aggregate(DF_DEMO.pre, DF_DEMO.post, DF_DEMO.pract, state.country);
      cache[key] = { at: Date.now(), data: d };
      return Promise.resolve(d);
    }
    var url = API_URL + (API_URL.indexOf('?') > -1 ? '&' : '?') + 'country=' + encodeURIComponent(state.country);
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(tr('The data source answered with an error (', 'La source de données a répondu par une erreur (') + r.status + ').');
      return r.json();
    }).then(function (d) {
      if (!d || !d.ok) throw new Error((d && d.error) || tr('The data source returned no figures.', 'La source de données n\'a renvoyé aucun chiffre.'));
      cache[key] = { at: Date.now(), data: d };
      return d;
    });
  }

  function refresh() {
    var id = ++requestId;
    writeUrl(); syncSelects();
    if (!data) app.replaceChildren(el('p', { class: 'status', text: tr('Loading the figures… The first load can take a few seconds.', 'Chargement des chiffres… Le premier chargement peut prendre quelques secondes.') }));
    load().then(function (d) {
      if (id !== requestId) return;
      data = d; buildFilterOptions(d); render();
    }).catch(function (err) {
      if (id !== requestId) return;
      destroyCharts();
      app.replaceChildren(el('div', { class: 'error' }, [
        el('strong', { text: tr('The figures could not be loaded. ', 'Les chiffres n\'ont pas pu être chargés. ') }), el('span', { text: err.message })]));
      els.updated.textContent = ''; els.scope.textContent = '';
    });
  }

  /* ---------------- filters ---------------- */
  function fillSelect(select, options, value) {
    select.replaceChildren();
    options.forEach(function (o) {
      var opt = el('option', { value: o.value, text: o.label });
      if (o.value === value) opt.selected = true;
      select.appendChild(opt);
    });
  }
  function buildFilterOptions(d) {
    fillSelect(els.phase, PHASES.map(function (p) { return { value: p.id, label: tr(p.en, p.fr) }; }), state.phase);
    fillSelect(els.country, [{ value: ALL_COUNTRIES, label: tr('All countries', 'Tous les pays') }].concat(
      d.filter.countries.map(function (c) { return { value: c, label: countryName(c) }; })), state.country);
  }
  function syncSelects() {
    if (els.phase.options.length) els.phase.value = state.phase;
    if (els.country.options.length) els.country.value = state.country;
  }
  els.phase.addEventListener('change', function () { state.phase = els.phase.value; writeUrl(); if (data) render(); });
  els.country.addEventListener('change', function () { state.country = els.country.value; refresh(); });
  fillSelect(els.phase, PHASES.map(function (p) { return { value: p.id, label: tr(p.en, p.fr) }; }), state.phase);
  applyStaticTexts();

  function applyStaticTexts() {
    document.documentElement.lang = LANG;
    document.title = tr('PFS RIZAO Digital Fundamentals Dashboard', 'PFS RIZAO Digital Fundamentals : tableau de bord');
    document.getElementById('ttl').textContent = tr('RIZAO Digital Fundamentals · Impact Dashboard', 'RIZAO Digital Fundamentals · Tableau de bord d\'impact');
    document.getElementById('l-phase').firstChild.textContent = 'Phase ';
    document.getElementById('l-country').firstChild.textContent = tr('Country ', 'Pays ');
    document.getElementById('filters').setAttribute('aria-label', tr('Filters', 'Filtres'));
    els.langEn.setAttribute('aria-pressed', LANG === 'en');
    els.langFr.setAttribute('aria-pressed', LANG === 'fr');
    if (DEMO) {
      els.demo.hidden = false;
      els.demo.textContent = tr('DEMONSTRATION: the figures below are fictitious and only show what this dashboard will display once participants have answered. No real person or company.',
        'DÉMONSTRATION : les chiffres ci-dessous sont fictifs et montrent seulement ce que ce tableau de bord affichera quand les participants auront répondu. Aucune personne ni entreprise réelle.');
    }
    if (!data) els.updated.textContent = tr('Loading…', 'Chargement…');
  }
  function setLang(l) {
    if (l === LANG) return;
    LANG = l;
    try { localStorage.setItem('pfs_lang', l); } catch (e) { /* ignore */ }
    applyStaticTexts(); writeUrl();
    if (data) { buildFilterOptions(data); render(); }
    else fillSelect(els.phase, PHASES.map(function (p) { return { value: p.id, label: tr(p.en, p.fr) }; }), state.phase);
  }
  els.langEn.addEventListener('click', function () { setLang('en'); });
  els.langFr.addEventListener('click', function () { setLang('fr'); });

  /* ---------------- building blocks ---------------- */
  function destroyCharts() { charts.forEach(function (c) { c.destroy(); }); charts = []; pending = []; }

  function card(title, value, detail, accent) {
    var node = el('div', { class: 'card' }, [el('h2', { text: title }), el('div', { class: 'v', text: value }), el('div', { class: 'd', text: detail })]);
    node.style.borderTopColor = accent;
    return node;
  }
  function section(title, intro, featured) {
    var node = el('section', { class: 'section' + (featured ? ' featured' : '') }, [el('h2', { text: title })]);
    if (intro) node.appendChild(el('p', { class: 'intro', text: 'ⓘ  ' + intro }));
    return node;
  }
  function table(label, cols, rows) {
    var thead = el('thead', {}, [el('tr', {}, cols.map(function (c) { return el('th', { scope: 'col', text: c }); }))]);
    var tbody = el('tbody', {}, rows.map(function (r) {
      var trw = el('tr', r.style ? { class: r.style } : {});
      r.cells.forEach(function (c, i) {
        var cell = typeof c === 'object' ? c : { t: c };
        var cls = cell.cls || (i > 0 && /^-$|^$/.test(cell.t) ? 'muted' : '');
        trw.appendChild(el('td', cls ? { class: cls, text: cell.t } : { text: cell.t }));
      });
      return trw;
    }));
    return el('div', { class: 'tablewrap' }, [el('table', { 'aria-label': label }, [thead, tbody])]);
  }
  function block(heading, tableNode, spec, note) {
    var left = el('div', {}, [heading ? el('h3', { text: heading }) : null, tableNode, note ? el('p', { class: 'note', text: note }) : null]);
    var children = [left];
    if (spec) {
      var canvas = el('canvas', { role: 'img', 'aria-label': spec.title });
      var box = el('div', { class: 'chartbox' }, [canvas]);
      if (spec.height) box.style.height = spec.height + 'px';
      children.push(box);
      pending.push({ canvas: canvas, spec: spec });
    }
    return el('div', { class: spec ? 'block' : 'block single' }, children);
  }

  /* ---------------- charts ---------------- */
  function formatValue(v, format) {
    if (!isNum(v)) return '';
    return format === 'pct' ? Math.round(v * 100) + '%' : String(Math.round(v));
  }
  var valueLabels = {
    id: 'valueLabels',
    afterDatasetsDraw: function (chart, args, opts) {
      if (!opts || !opts.enabled) return;
      var ctx = chart.ctx;
      chart.data.datasets.forEach(function (ds, i) {
        var meta = chart.getDatasetMeta(i);
        if (meta.hidden) return;
        meta.data.forEach(function (bar, j) {
          var v = ds.data[j];
          if (!isNum(v)) return;
          ctx.save(); ctx.fillStyle = COLORS.text; ctx.font = 'bold 11px Arial, Helvetica, sans-serif';
          if (opts.horizontal) { ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(formatValue(v, opts.format), bar.x + 4, bar.y); }
          else { ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(formatValue(v, opts.format), bar.x, bar.y - 3); }
          ctx.restore();
        });
      });
    }
  };
  /* Horizontal target line (e.g. 70 %) drawn on a vertical percentage chart. */
  var targetLine = {
    id: 'targetLine',
    afterDatasetsDraw: function (chart, args, opts) {
      if (!opts || !isNum(opts.value)) return;
      var y = chart.scales.y; if (!y) return;
      var py = y.getPixelForValue(opts.value), area = chart.chartArea, ctx = chart.ctx;
      ctx.save(); ctx.strokeStyle = COLORS.red; ctx.setLineDash([6, 4]); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(area.left, py); ctx.lineTo(area.right, py); ctx.stroke();
      ctx.setLineDash([]); ctx.fillStyle = COLORS.red; ctx.font = 'bold 11px Arial, Helvetica, sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(opts.label, area.right, py - 4); ctx.restore();
    }
  };

  function drawChart(canvas, spec) {
    if (!window.Chart) return;
    var pctAxis = spec.format === 'pct';
    var valueAxis = { min: 0, max: pctAxis ? 1 : undefined, stacked: !!spec.stacked, grid: { color: COLORS.grid },
      ticks: { color: COLORS.soft, font: { size: 10 }, maxTicksLimit: 6, precision: 0, callback: function (v) { return pctAxis ? Math.round(v * 100) + '%' : v; } } };
    var labelAxis = { stacked: !!spec.stacked, grid: { display: false }, ticks: { color: COLORS.text, font: { size: 10 } } };
    var chart = new Chart(canvas, {
      type: 'bar',
      data: { labels: spec.labels, datasets: spec.datasets.map(function (d) {
        return { label: d.label, data: d.data, backgroundColor: d.color, borderWidth: 0, barPercentage: spec.stacked ? 0.45 : 0.8, categoryPercentage: 0.8 };
      }) },
      options: {
        indexAxis: spec.horizontal ? 'y' : 'x', responsive: true, maintainAspectRatio: false, animation: { duration: 250 },
        layout: { padding: { top: spec.horizontal ? 4 : 18, right: spec.horizontal ? 36 : 4 } },
        scales: spec.horizontal ? { x: valueAxis, y: labelAxis } : { x: labelAxis, y: valueAxis },
        plugins: {
          title: { display: true, text: spec.title, color: COLORS.blue, font: { size: 14, weight: 'bold' } },
          legend: { display: spec.datasets.length > 1, position: 'bottom', labels: { color: COLORS.soft, boxWidth: 12, font: { size: 10 } } },
          tooltip: { callbacks: { label: function (c) { return (c.dataset.label ? c.dataset.label + ': ' : '') + formatValue(c.raw, spec.format); } } },
          valueLabels: { enabled: !spec.stacked, horizontal: !!spec.horizontal, format: spec.format },
          targetLine: spec.target ? { value: spec.target, label: tr('Target ', 'Cible ') + Math.round(spec.target * 100) + '%' } : false
        }
      },
      plugins: [valueLabels, targetLine]
    });
    charts.push(chart);
  }
  function B() { return tr('Before', 'AVANT'); }
  function A() { return tr('After', 'APRES'); }
  function phaseDatasets(before, after) {
    var out = [];
    if (showBefore()) out.push({ label: B(), data: before, color: COLORS.blue });
    if (showAfter()) out.push({ label: A(), data: after, color: COLORS.green });
    return out;
  }
  function phaseCols(first, withChange, withN) {
    var cols = [first];
    if (showBefore()) cols.push(B());
    if (showAfter()) cols.push(A());
    if (withChange && state.phase === 'both') cols.push(tr('Change', 'Évolution'));
    if (withN && showBefore()) cols.push(tr('n before', 'n AVANT'));
    if (withN && showAfter()) cols.push(tr('n after', 'n APRES'));
    return cols;
  }
  function phaseRow(label, b, a, nb, na, fmt) {
    fmt = fmt || pct;
    var cells = [label];
    if (showBefore()) cells.push(fmt(b));
    if (showAfter()) cells.push(fmt(a));
    if (state.phase === 'both') cells.push(change(b, a));
    if (nb !== undefined && showBefore()) cells.push(num(nb));
    if (na !== undefined && showAfter()) cells.push(num(na));
    return { cells: cells };
  }

  /* ---------------- page ---------------- */
  function render() {
    destroyCharts();
    var d = data, frag = document.createDocumentFragment();
    els.updated.textContent = d.updated ? tr('Updated: ', 'Mis à jour : ') + formatDate(d.updated) : '';
    els.scope.textContent = tr('Showing: ', 'Affichage : ') + phaseLabel() + ' · ' +
      (state.country === ALL_COUNTRIES ? tr('All countries', 'Tous les pays') : countryName(state.country)) + ' · ' +
      d.people + tr(' people, ', ' personnes, ') + d.before.n + tr(' tests before, ', ' Questionnaires AVANT, ') + d.after.n +
      tr(' forms after (latest answer per person)', ' Questionnaires APRES (dernière réponse par personne)');

    frag.appendChild(cards(d));
    frag.appendChild(guide());
    var empty = (showBefore() && d.before.n === 0 && (!showAfter() || d.after.n === 0)) || (!showBefore() && d.after.n === 0);
    if (empty) frag.appendChild(el('div', { class: 'notice', text: tr(
      'No answers yet for this selection. Change a filter or come back after participants have answered.',
      'Aucune réponse pour cette sélection. Changez un filtre ou revenez après les réponses des participants.') }));

    var n = 1;
    frag.appendChild(readinessSection(d, n++));
    frag.appendChild(levelsSection(d, n++));
    frag.appendChild(skillsSection(d, n++));
    if (showAfter()) frag.appendChild(evaluationSection(d, n++));
    frag.appendChild(countrySection(d, n++));
    frag.appendChild(questionSection(d, n++));
    frag.appendChild(el('footer', { class: 'src', text: tr(
      'Source: the before and after questionnaires of the RIZAO Digital Fundamentals half-day training held in each company (PFS, Pillar 3). Generated automatically from the response sheet. ' +
      'Only aggregated figures are published: no participant name, phone number or free-text answer.',
      'Source : Questionnaire AVANT et Questionnaire APRES de la demi-journée RIZAO Digital Fundamentals en entreprise (PFS, Pilier 3). Généré automatiquement à partir de la feuille de réponses. ' +
      'Seuls des chiffres agrégés sont publiés : aucun nom, numéro de téléphone ni réponse libre.') }));
    app.replaceChildren(frag);
    pending.forEach(function (p) { drawChart(p.canvas, p.spec); });
    pending = [];
  }

  function guide() {
    var items = [
      [tr('Before', 'Questionnaire AVANT'), tr('Starting-point questions and a 17-question test, taken once, at the start of the half-day in the company.', 'Questions de départ et test de 17 questions, remplis une fois, au début de la demi-journée en entreprise.')],
      [tr('After', 'Questionnaire APRES'), tr('The same 17 questions plus the evaluation, taken once at the end of the half-day.', 'Les mêmes 17 questions plus l\'évaluation, remplis une fois, à la fin de la demi-journée.')],
      [tr('Sales Cockpit', 'Sales Cockpit'), tr('Share of participants who say they can record a sale alone, without help: the key result of the half-day.', 'Part des participants qui déclarent saisir une vente seuls, sans aide : le résultat clé de la demi-journée.')],
      [tr('Digital-ready company', 'Entreprise prête numériquement'), tr('Owns a computer AND has a permanent staff member who uses e-mail and scores 60% or more on the test. PFS target: 70% of companies by 31 December 2026.', 'Possède un ordinateur ET a un membre permanent du personnel qui utilise l\'e-mail et obtient 60 % ou plus au test. Cible PFS : 70 % des entreprises au 31 décembre 2026.')],
      [tr('Levels', 'Niveaux'), tr('From the test score: below 40% = level 1, 40 to 69% = level 2, 70% or more = level 3. Shows how many participants moved up.', 'D\'après le score au test : moins de 40 % = niveau 1, 40 à 69 % = niveau 2, 70 % ou plus = niveau 3. Montre combien de participants progressent.')],
      [tr('Same people', 'Mêmes personnes'), tr('People who answered both before and after: the most reliable comparison.', 'Personnes ayant rempli le Questionnaire AVANT et le Questionnaire APRES : la comparaison la plus fiable.')],
      [tr('Colours', 'Couleurs'), tr('Green = improvement, red = decline. Use the two filters above: the whole page recalculates.', 'Vert = progression, rouge = recul. Utilisez les deux filtres ci-dessus : toute la page se recalcule.')]
    ];
    return el('div', { class: 'guide' }, [
      el('h2', { text: tr('HOW TO READ THIS DASHBOARD', 'COMMENT LIRE CE TABLEAU DE BORD') }),
      el('ul', {}, items.map(function (it) { return el('li', {}, [el('strong', { text: it[0] + tr(': ', ' : ') }), el('span', { text: it[1] })]); }))
    ]);
  }
  function phaseLabel() { var p = PHASES.filter(function (x) { return x.id === state.phase; })[0]; return tr(p.en, p.fr); }
  function formatDate(iso) {
    var t = new Date(iso);
    if (isNaN(t.getTime())) return iso;
    return t.toLocaleString(LANG === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function cards(d) {
    var list = [], ev = d.evaluation;
    if (state.phase === 'both') list.push(card(tr('Participants reached', 'Participants touchés'), num(d.people),
      d.before.n + tr(' answered before · ', ' Questionnaires AVANT · ') + d.after.n + tr(' after', ' APRES'), COLORS.blue));
    else if (state.phase === 'pre') list.push(card(tr('Participants (before)', 'Participants (AVANT)'), num(d.before.n), tr('tests taken', 'questionnaires remplis'), COLORS.blue));
    else list.push(card(tr('Participants (after)', 'Participants (APRES)'), num(d.after.n), tr('forms answered', 'questionnaires remplis'), COLORS.blue));

    if (state.phase === 'both') list.push(card(tr('After questionnaire completed', 'Questionnaire APRES rempli'), pct(d.before.n ? d.same.n / d.before.n : null),
      d.same.n + tr(' of ', ' sur ') + d.before.n + tr(' participants · target 100%', ' participants · cible 100 %'), COLORS.blue));
    if (showBefore()) list.push(card(tr('Average score before', 'Score moyen AVANT'), pct(d.before.avg), d.before.n + tr(' tests', ' questionnaires'), COLORS.blue));
    if (showAfter()) {
      var c = change(d.same.before, d.same.after);
      list.push(card(tr('Average score after', 'Score moyen APRES'), pct(d.after.avg),
        state.phase === 'both' && d.same.n > 0 ? c.t + tr(' vs before (same ', ' vs AVANT (mêmes ') + d.same.n + tr(' people)', ' personnes)') : d.after.n + tr(' forms', ' questionnaires'), COLORS.green));
      var conf = ev.confidence, confN = conf.reduce(function (s, x) { return s + x.count; }, 0);
      list.push(card(tr('Records a sale alone (Sales Cockpit)', 'Saisit une vente seul (Sales Cockpit)'), pct(conf[0].rate),
        tr('"Yes, without help" · ', '« Oui, sans aide » · ') + confN + tr(' people', ' personnes'), COLORS.yellow));
      list.push(card(tr('Satisfaction (4 or 5 out of 5)', 'Satisfaction (4 ou 5 sur 5)'), pct(ev.satisfiedRate),
        ev.ratingAverage === null ? tr('no rating yet', 'aucune note pour l\'instant') : tr('average ', 'moyenne ') + dec(ev.ratingAverage) + ' / 5', COLORS.oo2Blue));
    }
    return el('div', { class: 'cards' }, list);
  }

  /* 1. Digital readiness (featured) */
  function readinessSection(d, n) {
    var rd = d.readiness, sec = section(n + tr('. Digital readiness of the companies', '. Préparation numérique des entreprises'),
      tr('The PFS priority: a computer owned by the company and a permanent staff member able to enter data, answer e-mails and use basic office tools. Counted per company.',
         'La priorité PFS : un ordinateur appartenant à l\'entreprise et un membre permanent du personnel capable de saisir des données, répondre aux e-mails et utiliser les outils bureautiques de base. Compté par entreprise.'), true);
    var crit = [
      [tr('Company owns a computer', 'L\'entreprise possède un ordinateur'), 'computer'],
      [tr('Permanent staff member who uses e-mail', 'Membre permanent qui utilise l\'e-mail'), 'person'],
      [tr('Permanent staff member with 60% or more on the test', 'Membre permanent avec 60 % ou plus au test'), 'skills'],
      [tr('DIGITAL-READY COMPANY (all criteria)', 'ENTREPRISE PRÊTE (tous les critères)'), 'ready']
    ];
    var rows = crit.map(function (c) { return phaseRow(c[0], rd.before[c[1]], rd.after[c[1]], rd.before.n, rd.after.n); });
    if (state.phase === 'both') rows.push({ cells: [tr('Digital-ready, same companies before and after', 'Prêtes, mêmes entreprises AVANT et APRES'), pct(rd.sameBefore), pct(rd.sameAfter), change(rd.sameBefore, rd.sameAfter), num(rd.sameN), num(rd.sameN)] });
    var cols = phaseCols(tr('Criterion', 'Critère'), true, true);
    sec.appendChild(block(null, table(tr('Digital readiness', 'Préparation numérique'), cols, rows), {
      title: tr('Companies meeting each criterion', 'Entreprises remplissant chaque critère'),
      labels: crit.map(function (c, i) { return i === 3 ? tr('Digital-ready', 'Prête') : [tr('Computer', 'Ordinateur'), tr('E-mail user', 'Utilise l\'e-mail'), tr('Skills 60%+', 'Compétences 60 %+')][i]; }),
      format: 'pct', target: rd.target,
      datasets: phaseDatasets(crit.map(function (c) { return rd.before[c[1]]; }), crit.map(function (c) { return rd.after[c[1]]; }))
    }, tr('A company is counted once, from the answers of its participants. The dashed line is the PFS target for 31 December 2026.',
          'Une entreprise est comptée une fois, d\'après les réponses de ses participants. La ligne en pointillés est la cible PFS au 31 décembre 2026.')));

    var pb = d.before.profile, pa = d.after.profile;
    var prow = [
      [tr('Company computer', 'Ordinateur de l\'entreprise'), pb.computer, pa.computer],
      [tr('E-mail used for work', 'E-mail utilisé pour le travail'), pb.email, pa.email],
      [tr('Permanent staff members', 'Membres permanents du personnel'), pb.permanent, pa.permanent]
    ].map(function (r) { return phaseRow(r[0], r[1], r[2]); });
    var extra = [
      [tr('Stable internet connection (before only)', 'Connexion internet stable (AVANT seulement)'), pb.internetStable],
      [tr('Uses a computer every week or day (before only)', 'Utilise un ordinateur chaque semaine ou jour (AVANT seulement)'), pb.dailyUse],
      [tr('Computer available for the training (before only)', 'Ordinateur disponible pour la formation (AVANT seulement)'), pb.ownPc]
    ];
    extra.forEach(function (r) { var cells = [r[0]]; if (showBefore()) cells.push(pct(r[1])); if (showAfter()) cells.push('-'); if (state.phase === 'both') cells.push({ t: '', cls: 'flat' }); prow.push({ cells: cells }); });
    sec.appendChild(block(tr('Starting point and equipment', 'Point de départ et équipement'), table(tr('Starting point', 'Point de départ'), phaseCols(tr('Indicator', 'Indicateur'), true, false), prow), null));

    if (showBefore()) {
      var names = [tr('Handwritten notebook', 'Cahier manuscrit'), 'WhatsApp', tr('Excel or online file', 'Excel ou fichier en ligne'), 'Sales Cockpit', tr('No regular tracking', 'Aucun suivi régulier')];
      sec.appendChild(block(tr('How sales are tracked today (before)', 'Comment les ventes sont suivies aujourd\'hui (AVANT)'),
        table(tr('Sales tracking today', 'Suivi des ventes aujourd\'hui'), [tr('Method', 'Méthode'), tr('Share of people', 'Part des personnes')],
          names.map(function (nm, i) { return { cells: [nm, pct(pb.tracking[i])] }; })),
        { title: tr('Sales tracking methods used today', 'Méthodes de suivi des ventes utilisées'), labels: names, horizontal: true, format: 'pct',
          datasets: [{ label: B(), data: pb.tracking, color: COLORS.blue }] }));
    }
    return sec;
  }

  /* 2. Levels and groups */
  function levelsSection(d, n) {
    var sec = section(n + tr('. Levels', '. Niveaux'),
      tr('Participants are placed in a level from their score on the before questionnaire. The after questionnaire uses the same scale and shows how many moved up.',
         'Les participants sont placés dans un niveau d\'après leur score au Questionnaire AVANT. Le Questionnaire APRES utilise la même échelle et montre combien ont progressé.'));
    var names = DF.LEVELS.map(function (l) { return LANG === 'fr' ? l.fr : l.en; });
    var rows = DF.LEVELS.map(function (l, i) {
      var row = phaseRow(names[i], d.before.n ? d.before.levels[l.id] / d.before.n : null, d.after.n ? d.after.levels[l.id] / d.after.n : null, d.before.levels[l.id], d.after.levels[l.id]);
      if (state.phase === 'both' && i < 2) {   // fewer beginners is an improvement: invert the colour
        var c = row.cells[3]; if (c.cls === 'up') c.cls = 'down'; else if (c.cls === 'down') c.cls = 'up';
      }
      return row;
    });
    sec.appendChild(block(null, table(tr('Levels', 'Niveaux'), phaseCols(tr('Level', 'Niveau'), true, true), rows), {
      title: tr('Share of people by level', 'Part des personnes par niveau'), labels: names, format: 'pct',
      datasets: phaseDatasets(DF.LEVELS.map(function (l) { return d.before.n ? d.before.levels[l.id] / d.before.n : null; }), DF.LEVELS.map(function (l) { return d.after.n ? d.after.levels[l.id] / d.after.n : null; }))
    }, tr('Fewer level 1 and more level 3 participants after the half-day means progress.', 'Moins de participants au niveau 1 et plus au niveau 3 après la demi-journée : c\'est une progression.')));
    if (state.phase === 'both' && d.same.n > 0) {
      sec.appendChild(block(tr('Same people: progress', 'Mêmes personnes : progression'), table(tr('Progress of the same people', 'Progression des mêmes personnes'),
        [tr('Indicator', 'Indicateur'), tr('People', 'Personnes'), tr('Share', 'Part')], [
        { cells: [tr('Improved their score', 'Ont amélioré leur score'), num(d.same.improved), pct(d.same.improved / d.same.n)] },
        { cells: [tr('Same score', 'Score identique'), num(d.same.unchanged), pct(d.same.unchanged / d.same.n)] },
        { cells: [tr('Lower score', 'Score en baisse'), num(d.same.declined), pct(d.same.declined / d.same.n)] }]), null));
    }
    return sec;
  }

  /* 3. Skills by domain */
  function skillsSection(d, n) {
    var sec = section(n + tr('. Results by skill', '. Résultats par compétence'),
      tr('Success rate on the 17 questions, grouped by skill area.', 'Taux de réussite aux 17 questions, regroupées par domaine de compétence.'));
    var rows = [phaseRow(tr('Overall score (all answers)', 'Score global (toutes les réponses)'), d.before.avg, d.after.avg, d.before.n, d.after.n)];
    if (state.phase === 'both') rows.push(phaseRow(tr('Overall score (same people)', 'Score global (mêmes personnes)'), d.same.before, d.same.after, d.same.n, d.same.n));
    d.before.domains.forEach(function (x, i) { rows.push(phaseRow(dom(x.id), x.rate, d.after.domains[i].rate)); });
    sec.appendChild(block(null, table(tr('Results by skill', 'Résultats par compétence'), phaseCols(tr('Skill', 'Compétence'), true, true), rows), {
      title: tr('Success rate by skill', 'Taux de réussite par compétence') + (state.phase === 'both' ? tr(': before vs after', ' : AVANT et APRES') : ''),
      labels: d.before.domains.map(function (x) { return dom(x.id); }), horizontal: true, format: 'pct', height: showBefore() && showAfter() ? 470 : 320,
      datasets: phaseDatasets(d.before.domains.map(function (x) { return x.rate; }), d.after.domains.map(function (x) { return x.rate; }))
    }, tr('Same people = answered both before and after: the most reliable measure of progress. PowerPoint and online sharing are not taught in the half-day: they stay in the questionnaire to keep the before/after comparison.',
          'Mêmes personnes = ont rempli le Questionnaire AVANT et le Questionnaire APRES : la mesure de progression la plus fiable. PowerPoint et le partage en ligne ne sont pas traités dans la demi-journée : ils restent dans le questionnaire pour garder la comparaison.')));

    var lv = DF.SELF_LEVELS;
    var srows = d.before.self.map(function (x, i) { return phaseRow(dom(x.id), isNum(x.avg) ? x.avg / 3 : null, isNum(d.after.self[i].avg) ? d.after.self[i].avg / 3 : null); });
    sec.appendChild(block(tr('Self-assessment (0% = "' + lv[0] + '", 100% = "' + lv[3] + '")', 'Auto-évaluation (0 % = « ' + lv[0] + ' », 100 % = « ' + lv[3] + ' »)'),
      table(tr('Self-assessment', 'Auto-évaluation'), phaseCols(tr('Skill', 'Compétence'), true, false), srows), null,
      tr('How participants rate themselves, compared with the test result above.', 'Comment les participants se jugent eux-mêmes, à comparer avec le résultat du test ci-dessus.')));
    return sec;
  }

  /* 4. Training evaluation */
  function distBlock(title, items, labels) {
    var t = table(title, [tr('Answer', 'Réponse'), A(), tr('Count', 'Effectif')], items.map(function (x, i) { return { cells: [labels[i], pct(x.rate), num(x.count)] }; }));
    return block(title, t, { title: title, labels: labels, horizontal: true, format: 'pct', datasets: [{ label: A(), data: items.map(function (x) { return x.rate; }), color: COLORS.green }] });
  }
  function evaluationSection(d, n) {
    var ev = d.evaluation, sec = section(n + tr('. Training evaluation', '. Évaluation de la demi-journée'),
      tr('What participants said in the after questionnaire: expectations, learning, confidence on the Sales Cockpit and difficulties met. One answer per person (the latest).',
         'Ce que les participants ont dit dans le Questionnaire APRES : attentes, apprentissages, confiance sur le Sales Cockpit et difficultés rencontrées. Une réponse par personne (la dernière).'), true);
    sec.appendChild(distBlock(tr('Did the training meet expectations?', 'La formation a-t-elle répondu aux attentes ?'), ev.expectations,
      [tr('Not at all', 'Pas du tout'), tr('In part', 'En partie'), tr('Largely', 'Largement'), tr('Fully', 'Totalement')]));
    sec.appendChild(distBlock(tr('Self-reported knowledge improvement', 'Amélioration des connaissances déclarée'), ev.knowledge,
      [tr('Not at all', 'Pas du tout'), tr('Slightly', 'Légèrement'), tr('Clearly', 'Nettement'), tr('Very strongly', 'Très fortement')]));
    sec.appendChild(distBlock(tr('Can record a sale alone in the Sales Cockpit?', 'Peut saisir une vente seul(e) dans le Sales Cockpit ?'), ev.confidence,
      [tr('Yes, without help', 'Oui, sans aide'), tr('Yes, with the memo sheet', 'Oui, avec la fiche mémo'), tr('Not yet', 'Pas encore')]));
    var dn = [tr('Equipment (computer)', 'Équipement (ordinateur)'), tr('Internet connection', 'Connexion internet'), tr('Availability (time)', 'Disponibilité (temps)'), tr('Level too difficult', 'Niveau trop difficile'),
      tr('Pace too fast', 'Rythme trop rapide'), tr('Language', 'Langue'), tr('No difficulty', 'Aucune difficulté')];
    sec.appendChild(block(tr('Difficulties met (several answers possible)', 'Difficultés rencontrées (plusieurs réponses possibles)'),
      table(tr('Difficulties', 'Difficultés'), [tr('Difficulty', 'Difficulté'), tr('Share of people', 'Part des personnes'), tr('Count', 'Effectif')], ev.difficulties.map(function (x, i) { return { cells: [dn[i], pct(x.rate), num(x.count)] }; })),
      { title: tr('Difficulties met', 'Difficultés rencontrées'), labels: dn, horizontal: true, format: 'pct', datasets: [{ label: A(), data: ev.difficulties.map(function (x) { return x.rate; }), color: COLORS.yellow }] },
      tr('Equipment, connection and availability are the three obstacles named in the PFS terms of reference.', 'Équipement, connexion et disponibilité sont les trois obstacles cités dans les termes de référence PFS.')));
    var un = DF.DOMAINS.map(function (x) { return dom(x.id); });
    sec.appendChild(block(tr('Most useful topics (several answers possible)', 'Sujets les plus utiles (plusieurs réponses possibles)'),
      table(tr('Useful topics', 'Sujets utiles'), [tr('Topic', 'Sujet'), tr('Share of people', 'Part des personnes')], ev.useful.map(function (x, i) { return { cells: [un[i], pct(x.rate)] }; })),
      { title: tr('Most useful topics', 'Sujets les plus utiles'), labels: un, horizontal: true, format: 'pct', height: 320, datasets: [{ label: A(), data: ev.useful.map(function (x) { return x.rate; }), color: COLORS.green }] }));
    sec.appendChild(block(tr('Satisfaction', 'Satisfaction'), table(tr('Satisfaction', 'Satisfaction'), [tr('Indicator', 'Indicateur'), A()], [
      { cells: [tr('Average rating out of 5', 'Note moyenne sur 5'), dec(ev.ratingAverage)] },
      { cells: [tr('Share of ratings 4 or 5', 'Part des notes 4 ou 5'), pct(ev.satisfiedRate)] },
      { cells: [tr('NPS style index', 'Indice de type NPS'), { t: ev.nps === null ? '-' : signed(ev.nps), cls: ev.nps === null || ev.nps === 0 ? 'flat' : (ev.nps > 0 ? 'up' : 'down') }] }]), null,
      tr('NPS index = % of ratings 5 minus % of ratings 1 to 3, from -100 to +100.', 'Indice NPS = % de notes 5 moins % de notes 1 à 3, de -100 à +100.')));
    return sec;
  }

  /* 6. Country representation */
  function countrySection(d, n) {
    var sec = section(n + tr('. Country comparison', '. Comparaison par pays'),
      tr('Calculated across all countries, whatever the country filter.', 'Calculé tous pays confondus, quel que soit le filtre pays.'));
    var cols = [tr('Country', 'Pays'), tr('Companies', 'Entreprises')];
    if (showBefore()) cols.push(tr('Tests before', 'Questionnaires AVANT'));
    if (showAfter()) cols.push(tr('Forms after', 'Questionnaires APRES'));
    if (showBefore()) cols.push(tr('Score before', 'Score AVANT'));
    if (showAfter()) cols.push(tr('Score after', 'Score APRES'));
    if (showBefore()) cols.push(tr('Ready before', 'Prêtes AVANT'));
    if (showAfter()) cols.push(tr('Ready after', 'Prêtes APRES'));
    var tot = { c: 0, b: 0, a: 0 };
    var rows = d.byCountry.map(function (c) {
      tot.c += c.companies; tot.b += c.before.n; tot.a += c.after.n;
      var cells = [countryName(c.country), num(c.companies)];
      if (showBefore()) cells.push(num(c.before.n));
      if (showAfter()) cells.push(num(c.after.n));
      if (showBefore()) cells.push(pct(c.before.avg));
      if (showAfter()) cells.push(pct(c.after.avg));
      if (showBefore()) cells.push(pct(c.readyBefore));
      if (showAfter()) cells.push(pct(c.readyAfter));
      return { cells: cells, style: c.country === state.country ? 'selection' : '' };
    });
    var tc = ['Total', num(tot.c)]; if (showBefore()) tc.push(num(tot.b)); if (showAfter()) tc.push(num(tot.a));
    var extraCols = (showBefore() ? 2 : 0) + (showAfter() ? 2 : 0) - (showBefore() ? 1 : 0) - (showAfter() ? 1 : 0);
    for (var i = 0; i < cols.length - tc.length; i++) tc.push('');
    rows.push({ cells: tc, style: 'total' });
    sec.appendChild(block(null, table(tr('Country comparison', 'Comparaison par pays'), cols, rows), {
      title: tr('Digital-ready companies by country', 'Entreprises prêtes par pays'), labels: d.byCountry.map(function (c) { return countryName(c.country); }), format: 'pct', target: d.readiness.target,
      datasets: [].concat(showBefore() ? [{ label: B(), data: d.byCountry.map(function (c) { return c.readyBefore; }), color: COLORS.blue }] : [],
        showAfter() ? [{ label: A(), data: d.byCountry.map(function (c) { return c.readyAfter; }), color: COLORS.green }] : [])
    }, tr('A company typed with different spellings can be counted twice.', 'Une entreprise saisie avec des orthographes différentes peut être comptée deux fois.')));
    return sec;
  }

  /* 7. Success by question */
  function questionSection(d, n) {
    var sec = section(n + tr('. Success by question', '. Réussite par question'),
      tr('Share of people who chose the correct answer, question by question.', 'Part des personnes qui ont choisi la bonne réponse, question par question.'));
    var rows = DF.QUESTIONS.map(function (q) {
      var b = d.before.questions[q.id], a = d.after.questions[q.id];
      return phaseRow(q.id + ' · ' + (LANG === 'fr' ? q.fr : q.en), b.rate, a.rate, b.n, a.n);
    });
    sec.appendChild(block(null, table(tr('Success by question', 'Réussite par question'), phaseCols(tr('Question', 'Question'), true, true), rows), {
      title: tr('Success by question', 'Réussite par question') + (state.phase === 'both' ? tr(': before vs after', ' : AVANT et APRES') : ''),
      labels: DF.QUESTIONS.map(function (q) { return q.id; }), horizontal: true, format: 'pct',
      height: Math.max(300, DF.QUESTIONS.length * (showBefore() && showAfter() ? 44 : 28) + 90),
      datasets: phaseDatasets(DF.QUESTIONS.map(function (q) { return d.before.questions[q.id].rate; }), DF.QUESTIONS.map(function (q) { return d.after.questions[q.id].rate; }))
    }));
    return sec;
  }

  refresh();
})();
