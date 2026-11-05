/* Donnees FICTIVES de demonstration (aucune personne reelle). Servent uniquement a montrer le tableau de bord avant la collecte. */
var DF_DEMO = (function () {
  'use strict';
  var seed = 20261207;
  function rnd() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
  function pick(w) { var r = rnd(), s = 0; for (var i = 0; i < w.length; i++) { s += w[i]; if (r < s) return i; } return w.length - 1; }

  var NAMES = {
    'Senegal': ['Teranga Riz', 'Delta du Fleuve', 'Saloum Riz', 'Casamance Terroir', 'Ndiaye et Fils', 'Baol Céréales', 'Mame Awa Riz'],
    "Cote d'Ivoire": ['Bouaké Riz', 'Yamoussoukro Agro', 'Korhogo Céréales', 'Man Riz Local', 'Gagnoa Rizerie', 'Daloa Agro'],
    'Benin': ['Malanville Riz', 'Glazoué Agro', 'Bohicon Riz', 'Natitingou Céréales', 'Parakou Rizerie'],
    'Togo': ['Kara Riz', 'Sokodé Agro', 'Lomé Céréales', 'Atakpamé Riz', 'Dapaong Rizerie']
  };
  var pre = [], post = [], pract = [];
  var phone = 10000000;
  var t0 = Date.UTC(2026, 11, 7, 8, 0), t1 = Date.UTC(2026, 11, 18, 15, 0);

  DF.COUNTRIES.forEach(function (country, ci) {
    NAMES[country].forEach(function (company, k) {
      var computerBefore = rnd() < 0.5, computerAfter = computerBefore || rnd() < 0.55;
      var nPeople = rnd() < 0.35 ? 2 : 1;
      for (var p = 0; p < nPeople; p++) {
        phone += 1 + Math.floor(rnd() * 90000);
        var key = String(phone);
        var ability = Math.min(0.95, Math.max(0.12, 0.47 + (rnd() - 0.5) * 0.45 + (ci === 1 ? 0.04 : 0)));
        var perm = rnd() < 0.88;
        var email = pick([0.35, 0.35, 0.30]);
        var recBefore = { key: key, company: company, country: country, ts: t0 + Math.floor(rnd() * 3600000 * 20), a: {}, self: {}, r1: computerBefore ? 0 : pick([0, 0.6, 0.4]) , r2: pick([0.1, 0.35, 0.35, 0.2]), r3: email, r4: perm ? 0 : 1, r5: pick([0.1, 0.3, 0.3, 0.3]), r6: [], r7: computerBefore ? 0 : pick([0, 0.55, 0.45]) };
        if (computerBefore) recBefore.r1 = 0; else if (recBefore.r1 === 0) recBefore.r1 = 1;
        [0, 1, 2, 3, 4].forEach(function (i) { if (rnd() < [0.65, 0.75, 0.30, 0.10, 0.20][i]) recBefore.r6.push(i); });
        if (!recBefore.r6.length) recBefore.r6.push(0);
        function answers(ab) {
          var out = {};
          DF.QUESTIONS.forEach(function (q) {
            var base = { D1: 0.1, D2: 0.0, D3: 0.05, D4: -0.12, D5: 0.05, D6: -0.10, D7: -0.05, D8: -0.05 }[q.d];
            var ok = rnd() < Math.min(0.97, Math.max(0.05, ab + base));
            out[q.id] = ok ? q.correct : (q.correct + 1 + Math.floor(rnd() * (q.options.length - 1))) % q.options.length;
          });
          return out;
        }
        function selfEval(ab) { var o = {}; DF.SELF_ROWS.forEach(function (d) { o[d] = Math.max(0, Math.min(3, Math.round(ab * 3 + (rnd() - 0.5) * 1.4))); }); return o; }
        recBefore.a = answers(ability); recBefore.self = selfEval(ability);
        pre.push(recBefore);
        if (rnd() < 0.88) {
          var gain = 0.18 + rnd() * 0.27;
          var ab2 = Math.min(0.97, ability + gain);
          var rating = pick([0.01, 0.02, 0.10, 0.37, 0.50]) + 1;
          var rec = { key: key, company: company, country: country, ts: t1 + Math.floor(rnd() * 3600000 * 3), a: answers(ab2), self: selfEval(Math.min(0.9, ab2 + 0.05)),
            r1: computerAfter ? 0 : recBefore.r1, r3: rnd() < 0.8 ? 0 : (email < 2 ? email : 1), r4: recBefore.r4,
            eval: { e1: pick([0.02, 0.18, 0.5, 0.3]), e2: [], e3: pick([0.12, 0.5, 0.38]), e4: pick([0.02, 0.15, 0.5, 0.33]), e5: rating, e6: [], e7: pick([0.4, 0.4, 0.2]) } };
          [0, 1, 2, 3, 4, 5, 6, 7].forEach(function (i) { if (rnd() < [0.45, 0.4, 0.3, 0.35, 0.2, 0.4, 0.45, 0.6][i]) rec.eval.e2.push(i); });
          if (!rec.eval.e2.length) rec.eval.e2.push(3);
          [0, 1, 2, 3, 4, 5].forEach(function (i) { if (rnd() < [0.28, 0.40, 0.32, 0.18, 0.22, 0.05][i]) rec.eval.e6.push(i); });
          if (!rec.eval.e6.length) rec.eval.e6.push(6);
          post.push(rec);
          if (rnd() < 0.85) {
            var t = [0, 1, 2, 3, 4].map(function (i) { return rnd() < Math.min(0.97, ab2 + [0.30, 0.25, 0.05, 0.0, -0.05][i]) ? 1 : 0; });
            pract.push({ key: key, company: company, country: country, ts: t1, t: t });
          }
        }
      }
    });
  });
  return { pre: pre, post: post, pract: pract };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = DF_DEMO;
