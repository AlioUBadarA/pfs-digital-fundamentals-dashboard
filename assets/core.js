/* PFS RIZAO - Digital Fundamentals : banque de questions et calculs partages.
 * Ce meme fichier sert au site (assets/core.js) et a Apps Script (Core.gs). Ne pas modifier les titres. */
var DF = (function () {
  'use strict';

  var COUNTRIES = ['Senegal', "Cote d'Ivoire", 'Benin', 'Togo'];
  var COUNTRIES_FR = { 'Senegal': 'Sénégal', "Cote d'Ivoire": "Côte d'Ivoire", 'Benin': 'Bénin', 'Togo': 'Togo' };

  var DOMAINS = [
    { id: 'D1', en: 'Computer and files', fr: 'Ordinateur et fichiers' },
    { id: 'D2', en: 'E-mail', fr: 'Messagerie' },
    { id: 'D3', en: 'Word', fr: 'Word' },
    { id: 'D4', en: 'Excel', fr: 'Excel' },
    { id: 'D5', en: 'PowerPoint', fr: 'PowerPoint' },
    { id: 'D6', en: 'Online and shared files', fr: 'Fichiers en ligne et partage' },
    { id: 'D7', en: 'Digital security', fr: 'Sécurité numérique' },
    { id: 'D8', en: 'Sales tracking tools', fr: 'Outils de suivi des ventes' }
  ];

  /* 17 questions de connaissances, identiques avant et apres. correct = index de la bonne option. */
  var QUESTIONS = [
    { id: 'Q01', d: 'D1', text: 'Vous voulez retrouver facilement vos fichiers de ventes. Quel nom de fichier est le plus clair ?',
      options: ['nouveau document final 2', '2026-12_Ventes_Rizerie.xlsx', 'ventes', 'essai !!!'], correct: 1,
      en: 'Clear file name', fr: 'Nom de fichier clair', why: 'Un bon nom contient la date, le contenu et l\'extension.' },
    { id: 'Q02', d: 'D1', text: 'Comment éviter de perdre un fichier important si l\'ordinateur tombe en panne ?',
      options: ['Le laisser sur le Bureau', 'En garder une copie sur une clé USB ou en ligne (Drive, OneDrive)', 'Le fermer sans l\'enregistrer', 'L\'imprimer seulement'], correct: 1,
      en: 'Back up a file', fr: 'Sauvegarder un fichier', why: 'Une copie hors de l\'ordinateur protège contre la panne et le vol.' },
    { id: 'Q03', d: 'D2', text: 'Que doit contenir l\'objet d\'un e-mail professionnel ?',
      options: ['Rien, on écrit tout dans le message', 'Le mot « Bonjour »', 'Le texte complet du message', 'Un résumé clair du sujet, par exemple « Facture décembre - Ets Diop »'], correct: 3,
      en: 'E-mail subject line', fr: 'Objet d\'un e-mail', why: 'L\'objet permet au destinataire de comprendre et de retrouver le message.' },
    { id: 'Q04', d: 'D2', text: 'Vous envoyez le même message à plusieurs clients sans qu\'ils voient les adresses des autres. Quel champ utiliser ?',
      options: ['À', 'Cc', 'Cci', 'Objet'], correct: 2,
      en: 'Hidden copy (Bcc)', fr: 'Copie cachée (Cci)', why: 'Cci veut dire copie conforme invisible.' },
    { id: 'Q05', d: 'D2', text: 'Vous devez envoyer une facture avec votre e-mail. Que faites-vous ?',
      options: ['Je clique sur « Répondre à tous »', 'J\'archive le message', 'J\'ajoute la facture en pièce jointe (trombone)', 'Je marque le message comme spam'], correct: 2,
      en: 'Attach a file', fr: 'Joindre un fichier', why: 'La pièce jointe se joint avec le symbole du trombone.' },
    { id: 'Q06', d: 'D3', text: 'Quel raccourci clavier annule la dernière action dans Word ?',
      options: ['Ctrl + S', 'Ctrl + P', 'Ctrl + C', 'Ctrl + Z'], correct: 3,
      en: 'Undo shortcut', fr: 'Raccourci Annuler', why: 'Ctrl + Z annule, Ctrl + Y rétablit.' },
    { id: 'Q07', d: 'D3', text: 'Vous envoyez une facture et vous voulez que la mise en page reste la même sur tous les appareils. Quel format choisir ?',
      options: ['Word (.docx)', 'PDF (.pdf)', 'Texte (.txt)', 'Je ne sais pas'], correct: 1,
      en: 'Export to PDF', fr: 'Exporter en PDF', why: 'Le PDF garde la mise en page sur tous les appareils.' },
    { id: 'Q08', d: 'D4', text: 'Dans Excel, quelle formule calcule le total des cellules de B2 à B10 ?',
      options: ['=B2+B10', '=TOTAL(B2-B10)', '=SOMME(B2:B10)', '=B2:B10'], correct: 2,
      en: 'SUM formula', fr: 'Formule SOMME', why: 'Une formule commence par = et SOMME additionne une plage.' },
    { id: 'Q09', d: 'D4', text: 'La quantité est en B2 et le prix unitaire en C2. Quelle formule donne le montant en D2 ?',
      options: ['=B2+C2', 'B2xC2', '=B2*C2', 'B2*C2'], correct: 2,
      en: 'Amount = quantity x price', fr: 'Montant = quantité x prix', why: 'Le signe = au début est obligatoire, la multiplication s\'écrit *.' },
    { id: 'Q10', d: 'D4', text: 'À quoi sert un filtre dans un tableau Excel ?',
      options: ['À supprimer les lignes inutiles', 'À afficher seulement les lignes qui correspondent à un critère, par exemple un client', 'À additionner les colonnes', 'À changer les couleurs'], correct: 1,
      en: 'Use of a filter', fr: 'Rôle d\'un filtre', why: 'Le filtre masque les lignes qui ne correspondent pas, sans les supprimer.' },
    { id: 'Q11', d: 'D5', text: 'Quelle diapositive est la plus lisible ?',
      options: ['Beaucoup de texte en petits caractères', 'Plusieurs polices et couleurs différentes', 'Une idée principale, peu de texte, gros caractères', 'Texte clair sur fond clair'], correct: 2,
      en: 'Readable slide', fr: 'Diapositive lisible', why: 'Une idée par diapositive, peu de texte, bon contraste.' },
    { id: 'Q12', d: 'D6', text: 'Deux collègues doivent modifier le même fichier de suivi en même temps. Que choisir ?',
      options: ['Envoyer le fichier par e-mail à chacun', 'L\'imprimer', 'Le copier sur une clé USB', 'Le partager en ligne (Drive ou OneDrive) avec le droit de modification'], correct: 3,
      en: 'Work together on one file', fr: 'Travailler à plusieurs sur un fichier', why: 'Un fichier partagé en ligne évite les versions multiples.' },
    { id: 'Q13', d: 'D6', text: 'Vous partagez un fichier avec un partenaire qui doit seulement le lire. Quel droit lui donner ?',
      options: ['Lecteur (lecture seule)', 'Éditeur', 'Propriétaire', 'Aucun, je lui envoie mon mot de passe'], correct: 0,
      en: 'Read-only sharing right', fr: 'Droit de lecture seule', why: 'Donner le droit minimum nécessaire protège le fichier.' },
    { id: 'Q14', d: 'D7', text: 'Quel mot de passe est le plus sûr ?',
      options: ['rizerie123', '12345678', 'Mon prénom et ma date de naissance', 'Une phrase longue avec majuscules, chiffres et symboles'], correct: 3,
      en: 'Strong password', fr: 'Mot de passe sûr', why: 'Un mot de passe long et varié est difficile à deviner.' },
    { id: 'Q15', d: 'D7', text: 'Vous recevez un message : « Votre compte est bloqué, cliquez ici et donnez votre code secret ». Que faites-vous ?',
      options: ['Je clique vite pour débloquer mon compte', 'Je réponds avec mon code', 'Je ne clique pas, je ne donne rien et je supprime ou signale le message', 'Je transfère le message à tous mes contacts'], correct: 2,
      en: 'Phishing message', fr: 'Message frauduleux', why: 'Une banque ne demande jamais un code secret par message.' },
    { id: 'Q16', d: 'D8', text: 'Un client prend 100 kg de riz à 450 F le kg et paie 30 000 F. Quel montant reste à payer ?',
      options: ['30 000 F', '45 000 F', '15 000 F', '75 000 F'], correct: 2,
      en: 'Amount still due', fr: 'Reste à payer', why: '100 x 450 = 45 000 F, moins 30 000 F payés = 15 000 F.' },
    { id: 'Q17', d: 'D8', text: 'Quand faut-il enregistrer une vente dans l\'outil de suivi ?',
      options: ['À la fin du mois', 'Le jour même, dès que la vente est faite', 'Seulement quand le client a tout payé', 'Une fois par an'], correct: 1,
      en: 'When to record a sale', fr: 'Quand enregistrer une vente', why: 'Une saisie immédiate évite les oublis et les erreurs.' }
  ];

  var SELF_LEVELS = ['Aucun', 'Débutant', 'Intermédiaire', 'Avancé'];
  var SELF_ROWS = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'];

  /* Questions de preparation numerique (R) et d'evaluation (E). Les index servent a l'API. */
  var R = {
    R1: { title: 'R1. Avez-vous un ordinateur qui appartient à l\'entreprise ?',
      options: ['Oui, un ordinateur de l\'entreprise', 'Non, j\'utilise mon ordinateur personnel', 'Non, je n\'ai pas d\'ordinateur (téléphone seulement)'] },
    R2: { title: 'R2. Quelle connexion internet avez-vous à la rizerie ou au bureau ?',
      options: ['Aucune', 'Données mobiles du téléphone seulement', 'Wifi ou box fixe, souvent instable', 'Wifi ou box fixe, stable'] },
    R3: { title: 'R3. Utilisez-vous une adresse e-mail pour votre travail ?',
      options: ['Oui, chaque semaine', 'Oui, mais rarement', 'Non, je n\'en ai pas'] },
    R4: { title: 'R4. Quel est votre statut dans l\'entreprise ?',
      options: ['Membre permanent du personnel (employé ou dirigeant)', 'Occasionnel ou prestataire'] },
    R5: { title: 'R5. À quelle fréquence utilisez-vous un ordinateur ?',
      options: ['Jamais', 'Rarement', 'Chaque semaine', 'Chaque jour'] },
    R6: { title: 'R6. Comment suivez-vous vos ventes aujourd\'hui ? (plusieurs réponses possibles)',
      options: ['Cahier manuscrit', 'Messages WhatsApp', 'Fichier Excel ou fichier en ligne', 'Outil en ligne (Sales Cockpit)', 'Aucun suivi régulier'] },
    R7: { title: 'R7. Pourrez-vous venir à la formation avec un ordinateur ?',
      options: ['Oui, avec l\'ordinateur de l\'entreprise', 'Oui, avec mon ordinateur personnel', 'Non, je n\'ai pas d\'ordinateur à apporter'] }
  };
  var E = {
    E1: { title: 'E1. La formation a-t-elle répondu à vos attentes ?',
      options: ['Pas du tout', 'En partie', 'Largement', 'Totalement'] },
    E2: { title: 'E2. Qu\'avez-vous trouvé le plus utile ? (plusieurs réponses possibles)',
      options: DOMAINS.map(function (d) { return d.fr; }) },
    E3: { title: 'E3. Le contenu était-il nouveau pour vous ?',
      options: ['Déjà connu', 'En partie nouveau', 'Presque tout était nouveau'] },
    E4: { title: 'E4. Vos connaissances numériques se sont-elles améliorées ?',
      options: ['Pas du tout', 'Légèrement', 'Nettement', 'Très fortement'] },
    E5: { title: 'E5. Quelle note globale donnez-vous à la formation ? (1 à 5)', options: ['1', '2', '3', '4', '5'] },
    E6: { title: 'E6. Quelles difficultés avez-vous rencontrées ? (plusieurs réponses possibles)',
      options: ['Équipement (ordinateur)', 'Connexion internet', 'Disponibilité (temps)', 'Niveau trop difficile', 'Rythme trop rapide', 'Langue', 'Aucune difficulté'] },
    E7: { title: 'E7. Pouvez-vous saisir une vente seul(e) dans le Sales Cockpit ?',
      options: ['Oui, sans aide', 'Oui, avec la fiche mémo', 'Non, pas encore'] },
    E8: { title: 'E8. Que faudrait-il améliorer dans la formation ? (réponse libre, non publiée)' }
  };

  var PRACTICAL = [
    { id: 'T1', en: 'Name, save and export a file to PDF', fr: 'Nommer, enregistrer et exporter un fichier en PDF' },
    { id: 'T2', en: 'Send an e-mail with an attachment', fr: 'Envoyer un e-mail avec pièce jointe' },
    { id: 'T3', en: 'Calculate a total and a percentage in Excel', fr: 'Calculer un total et un pourcentage dans Excel' },
    { id: 'T4', en: 'Share an online file with the right permission', fr: 'Partager un fichier en ligne avec le bon droit' },
    { id: 'T5', en: 'Record a sale in the Sales Cockpit', fr: 'Saisir une vente dans le Sales Cockpit' }
  ];

  var LEVELS = [
    { id: 'N1', en: 'Level 1 - Beginner', fr: 'Niveau 1 - Débutant', max: 0.40 },
    { id: 'N2', en: 'Level 2 - Intermediate', fr: 'Niveau 2 - Intermédiaire', max: 0.70 },
    { id: 'N3', en: 'Level 3 - Advanced', fr: 'Niveau 3 - Avancé', max: 1.01 }
  ];
  var SKILL_MIN = 0.60;     // seuil de competence pour la preparation numerique
  var PRACTICAL_MIN = 4;    // taches reussies sur 5
  var TARGET_READY = 0.70;  // cible PFS : 70 % des rizeries pretes au 31 decembre 2026

  /* ---------- utilitaires ---------- */
  function isNum(v) { return typeof v === 'number' && !isNaN(v); }
  function rate(a, b) { return b > 0 ? a / b : null; }
  function mean(arr) { var v = arr.filter(isNum); return v.length ? v.reduce(function (s, x) { return s + x; }, 0) / v.length : null; }
  function norm(s) {
    s = String(s || '').toLowerCase();
    if (s.normalize) s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return s.replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function phone8(s) { var d = String(s || '').replace(/\D/g, ''); return d.length >= 8 ? d.slice(-8) : ''; }
  function companyKey(country, company) { return country + '|' + norm(company); }

  function score(rec) {
    var ok = 0, n = 0;
    QUESTIONS.forEach(function (q) {
      var a = rec.a && rec.a[q.id];
      if (a === undefined || a === null || a < 0) return;
      n++; if (a === q.correct) ok++;
    });
    return n ? ok / n : null;
  }
  function domainScore(rec, d) {
    var ok = 0, n = 0;
    QUESTIONS.forEach(function (q) {
      if (q.d !== d) return;
      var a = rec.a && rec.a[q.id];
      if (a === undefined || a === null || a < 0) return;
      n++; if (a === q.correct) ok++;
    });
    return n ? ok / n : null;
  }
  function levelOf(s) {
    if (!isNum(s)) return null;
    for (var i = 0; i < LEVELS.length; i++) if (s < LEVELS[i].max) return LEVELS[i].id;
    return 'N3';
  }

  /** Derniere reponse par personne (cle = 8 derniers chiffres du telephone). */
  function latest(recs) {
    var m = {};
    recs.forEach(function (r) {
      if (!r.key) return;
      if (!m[r.key] || r.ts >= m[r.key].ts) m[r.key] = r;
    });
    return Object.keys(m).map(function (k) { return m[k]; });
  }

  function statsOf(recs) {
    var n = recs.length;
    var scores = recs.map(score);
    var levels = { N1: 0, N2: 0, N3: 0 };
    scores.forEach(function (s) { var l = levelOf(s); if (l) levels[l]++; });
    var domains = DOMAINS.map(function (d) { return { id: d.id, rate: mean(recs.map(function (r) { return domainScore(r, d.id); })) }; });
    var questions = {};
    QUESTIONS.forEach(function (q) {
      var ok = 0, k = 0;
      recs.forEach(function (r) { var a = r.a && r.a[q.id]; if (a === undefined || a === null || a < 0) return; k++; if (a === q.correct) ok++; });
      questions[q.id] = { rate: rate(ok, k), n: k };
    });
    var self = SELF_ROWS.map(function (d) { return { id: d, avg: mean(recs.map(function (r) { return r.self ? r.self[d] : null; })) }; });
    return { n: n, avg: mean(scores), levels: levels, domains: domains, questions: questions, self: self };
  }

  function companiesReadiness(recs) {
    var by = {};
    recs.forEach(function (r) {
      var k = companyKey(r.country, r.company);
      if (!by[k]) by[k] = { country: r.country, computer: false, person: false, skills: false, ready: false };
      var c = by[k];
      var s = score(r);
      var perm = r.r1 !== undefined && r.r4 === 0;
      if (r.r1 === 0) c.computer = true;
      if (perm && r.r3 !== undefined && r.r3 <= 1) c.person = true;
      if (perm && isNum(s) && s >= SKILL_MIN) c.skills = true;
      if (perm && r.r3 !== undefined && r.r3 <= 1 && isNum(s) && s >= SKILL_MIN) c.capable = true;
    });
    Object.keys(by).forEach(function (k) { by[k].ready = by[k].computer && !!by[k].capable; });
    return by;
  }
  function readinessSummary(map) {
    var keys = Object.keys(map), n = keys.length;
    function share(f) { return rate(keys.filter(function (k) { return map[k][f]; }).length, n); }
    return { n: n, computer: share('computer'), person: share('person'), skills: share('skills'), ready: share('ready') };
  }

  function evalSummary(post) {
    var n = post.length;
    function dist(field, size) {
      var c = []; for (var i = 0; i < size; i++) c.push(0);
      var k = 0;
      post.forEach(function (r) { var v = r.eval && r.eval[field]; if (isNum(v) && v >= 0 && v < size) { c[v]++; k++; } });
      return c.map(function (x) { return { count: x, rate: rate(x, k) }; });
    }
    function multi(field, size) {
      var c = []; for (var i = 0; i < size; i++) c.push(0);
      var k = 0;
      post.forEach(function (r) { var v = r.eval && r.eval[field]; if (v && v.length) { k++; v.forEach(function (i) { if (i >= 0 && i < size) c[i]++; }); } });
      return c.map(function (x) { return { count: x, rate: rate(x, k) }; });
    }
    var ratings = post.map(function (r) { return r.eval && r.eval.e5; }).filter(isNum);
    var sat = ratings.filter(function (v) { return v >= 4; }).length;
    var prom = ratings.filter(function (v) { return v === 5; }).length;
    var detr = ratings.filter(function (v) { return v <= 3; }).length;
    return {
      n: n, ratingsN: ratings.length, ratingAverage: mean(ratings), satisfiedRate: rate(sat, ratings.length),
      nps: ratings.length ? Math.round((prom - detr) / ratings.length * 100) : null,
      expectations: dist('e1', 4), novelty: dist('e3', 3), knowledge: dist('e4', 4), confidence: dist('e7', 3),
      difficulties: multi('e6', 7), useful: multi('e2', DOMAINS.length)
    };
  }

  function profileSummary(recs) {
    var n = recs.length;
    function share(f) { return rate(recs.filter(f).length, n); }
    var track = [0, 0, 0, 0, 0];
    recs.forEach(function (r) { (r.r6 || []).forEach(function (i) { if (i >= 0 && i < 5) track[i]++; }); });
    return {
      n: n,
      computer: share(function (r) { return r.r1 === 0; }),
      internetStable: share(function (r) { return r.r2 >= 2; }),
      internetNone: share(function (r) { return r.r2 <= 1; }),
      email: share(function (r) { return r.r3 <= 1; }),
      permanent: share(function (r) { return r.r4 === 0; }),
      dailyUse: share(function (r) { return r.r5 >= 2; }),
      ownPc: share(function (r) { return r.r7 <= 1; }),
      tracking: track.map(function (x) { return rate(x, n); })
    };
  }

  /** pre, post : enregistrements normalises ; pract : [{key, company, country, t:[0|1 x5], ts}]. country : 'All countries' ou un pays. */
  function aggregate(preAll, postAll, practAll, country) {
    var ALL = 'All countries';
    function inScope(r) { return country === ALL || !country || r.country === country; }
    var preL = latest(preAll), postL = latest(postAll), practL = latest(practAll);
    var pre = preL.filter(inScope), post = postL.filter(inScope), pract = practL.filter(inScope);

    var before = statsOf(pre), after = statsOf(post);
    var postByKey = {}; post.forEach(function (r) { postByKey[r.key] = r; });
    var pairs = pre.filter(function (r) { return postByKey[r.key]; }).map(function (r) { return { b: r, a: postByKey[r.key] }; });
    var sb = statsOf(pairs.map(function (p) { return p.b; })), sa = statsOf(pairs.map(function (p) { return p.a; }));
    var improved = 0, same = 0, declined = 0;
    pairs.forEach(function (p) {
      var d = score(p.a) - score(p.b);
      if (d > 0.0001) improved++; else if (d < -0.0001) declined++; else same++;
    });

    var cb = companiesReadiness(pre), ca = companiesReadiness(post);
    var both = Object.keys(cb).filter(function (k) { return ca[k]; });
    function shareReady(map, keys) { return rate(keys.filter(function (k) { return map[k].ready; }).length, keys.length); }

    var byCountry = COUNTRIES.map(function (c) {
      var p1 = preL.filter(function (r) { return r.country === c; }), p2 = postL.filter(function (r) { return r.country === c; });
      var r1 = readinessSummary(companiesReadiness(p1)), r2 = readinessSummary(companiesReadiness(p2));
      var comp = {}; p1.concat(p2).forEach(function (r) { comp[companyKey(r.country, r.company)] = 1; });
      var ratings = p2.map(function (r) { return r.eval && r.eval.e5; }).filter(isNum);
      return {
        country: c, companies: Object.keys(comp).length, before: { n: p1.length, avg: mean(p1.map(score)) }, after: { n: p2.length, avg: mean(p2.map(score)) },
        readyBefore: r1.ready, readyAfter: r2.ready, satisfaction: rate(ratings.filter(function (v) { return v >= 4; }).length, ratings.length)
      };
    });

    var everyone = {}; pre.concat(post).forEach(function (r) { everyone[r.key] = 1; });
    var tasks = PRACTICAL.map(function (t, i) { return { id: t.id, rate: rate(pract.filter(function (r) { return r.t && r.t[i] === 1; }).length, pract.length) }; });
    var passed = pract.filter(function (r) { return (r.t || []).reduce(function (s, x) { return s + (x === 1 ? 1 : 0); }, 0) >= PRACTICAL_MIN; }).length;

    return {
      ok: true, updated: new Date().toISOString(), filter: { countries: COUNTRIES.slice() },
      people: Object.keys(everyone).length,
      before: { n: before.n, avg: before.avg, levels: before.levels, domains: before.domains, questions: before.questions, self: before.self, profile: profileSummary(pre) },
      after: { n: after.n, avg: after.avg, levels: after.levels, domains: after.domains, questions: after.questions, self: after.self, profile: profileSummary(post) },
      same: { n: pairs.length, before: sb.avg, after: sa.avg, improved: improved, unchanged: same, declined: declined,
        levelsBefore: sb.levels, levelsAfter: sa.levels, domainsBefore: sb.domains, domainsAfter: sa.domains,
        questionsBefore: sb.questions, questionsAfter: sa.questions },
      readiness: { target: TARGET_READY, before: readinessSummary(cb), after: readinessSummary(ca),
        sameN: both.length, sameBefore: shareReady(cb, both), sameAfter: shareReady(ca, both) },
      byCountry: byCountry,
      practical: { n: pract.length, passRate: rate(passed, pract.length), tasks: tasks },
      evaluation: evalSummary(post)
    };
  }

  return { COUNTRIES: COUNTRIES, COUNTRIES_FR: COUNTRIES_FR, DOMAINS: DOMAINS, QUESTIONS: QUESTIONS, SELF_LEVELS: SELF_LEVELS, SELF_ROWS: SELF_ROWS,
    R: R, E: E, PRACTICAL: PRACTICAL, LEVELS: LEVELS, SKILL_MIN: SKILL_MIN, PRACTICAL_MIN: PRACTICAL_MIN, TARGET_READY: TARGET_READY,
    aggregate: aggregate, score: score, levelOf: levelOf, phone8: phone8, norm: norm, latest: latest };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = DF;
