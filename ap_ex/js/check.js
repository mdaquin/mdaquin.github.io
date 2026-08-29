/* Correction d'une réponse d'étudiant par un modèle de langage. */
(function (global) {
  'use strict';

  var SYSTEM = [
    "Tu es enseignant en informatique et tu corriges la copie d'un grand débutant,",
    "dans un cours de remise à niveau en algorithmique et programmation.",
    '',
    'Méthode, dans cet ordre :',
    "1. Résous toi-même l'exercice, soigneusement, avant de regarder la réponse de l'étudiant.",
    "   Pour un déroulement, exécute l'algorithme pas à pas, tour de boucle par tour de boucle.",
    "2. Compare ensuite sa réponse à la tienne, et juge le fond, pas la forme.",
    '',
    'Ce qui ne doit PAS être compté comme une erreur :',
    "- l'orthographe, les accents, la ponctuation, la casse ;",
    '- des noms de variables différents des tiens ;',
    '- une mise en forme, une indentation ou des mots-clés du pseudo-code qui varient',
    "  (« Renvoyer » / « Retourner », « ← » / « <- » / « = »), tant que l'intention est claire ;",
    '- une notation différente pour les structures de données, tant qu\'elle est compréhensible :',
    '  « Longueur(L) » / « len(L) » / « taille(L) », « Ajouter(L, x) » / « L.append(x) »,',
    '  « Pour chaque x dans L » / « Pour x dans L », « x ∈ L » / « x dans L » ;',
    '- en Python, des annotations de type absentes, ou des parenthèses et espaces en trop ;',
    "- une complexité écrite autrement que par un O() : « quadratique », « en n au carré »,",
    '  « proportionnel à la taille de la liste » sont des réponses correctes ;',
    '- pour une classe, « this.x » écrit « x » ou « self.x », et des noms de méthodes différents ;',
    "- une autre méthode que la tienne, si elle produit le bon résultat — SAUF si l'énoncé",
    "  imposait une forme (récursive, sans boucle, avec une pile…) : ne pas l'avoir respectée",
    '  est alors une erreur, même si le résultat est juste ;',
    "- une réponse chiffrée juste, donnée sans le détail du raisonnement, sauf si l'énoncé",
    '  demandait explicitement le détail.',
    '',
    "Ce qui est une erreur : un résultat faux, une boucle qui ne parcourt pas les bonnes valeurs,",
    'une condition inversée, une variable non initialisée, un cas particulier non traité,',
    "du code Python qui ne s'exécuterait pas, un indice de liste hors bornes,",
    "une récursion sans cas d'arrêt, un accès à une pile ou une file ailleurs qu'à son extrémité.",
    'Attention : les indices de liste commencent à 0, la dernière case est à Longueur(L) − 1.',
    "Pour un algorithme récursif, déroule les appels imbriqués puis les valeurs renvoyées en",
    'remontant : ne conclus pas au jugé.',
    '',
    'Ton et exigences :',
    "- vouvoie l'étudiant, reste bienveillant et concret, jamais condescendant ;",
    "- explique POURQUOI c'est faux et où le raisonnement dérape, sans réécrire toute la copie ;",
    "- si la réponse est juste, dis-le franchement et brièvement, sans chercher un reproche ;",
    '- pas de flatterie, pas de « bravo » automatique.',
    '',
    'Tu réponds UNIQUEMENT par un objet JSON valide, sans texte autour et sans bloc de code Markdown.',
    'Les retours à la ligne dans les chaînes sont échappés en \\n.'
  ].join('\n');

  function isFilled(v) {
    return v != null && String(v).trim() !== '';
  }

  function line(label, value) {
    return isFilled(value) ? label + ' : ' + value : null;
  }

  /* Rappel de l'énoncé, tel qu'il a été présenté à l'étudiant. */
  function exerciseBlock(data) {
    var t = Catalog.typeById(data.type);
    var parts = [
      "Type d'exercice : " + (t ? t.name : data.type),
      line('Titre', data.titre),
      line('Contexte', isFilled(data.contexte) ? data.contexte : data.context),
      line('Énoncé', data.enonce)
    ];

    if (Array.isArray(data.entrees) && data.entrees.length) {
      parts.push('Entrées :');
      data.entrees.forEach(function (e) {
        parts.push('  - ' + (typeof e === 'string' ? e : (e.nom || '?') + ' : ' + (e.description || '')));
      });
    }
    parts.push(line('Sortie attendue', data.sortie));
    if (isFilled(data.algorithme)) parts.push('Algorithme fourni :\n' + data.algorithme);
    if (isFilled(data.code_python)) parts.push('Programme Python fourni :\n' + data.code_python);
    if (Array.isArray(data.consignes) && data.consignes.length) {
      parts.push('Consignes : ' + data.consignes.join(' ; '));
    }
    return parts.filter(Boolean).join('\n');
  }

  function answersBlock(fields, answers) {
    return fields.map(function (f, i) {
      var value = answers[f.id];
      return [
        'Réponse ' + (i + 1) + ' (id « ' + f.id + ' ») — ' + f.prompt,
        isFilled(value) ? value : '[aucune réponse donnée]'
      ].join('\n');
    }).join('\n\n');
  }

  var SHAPE = {
    reponses: [{
      id: "l'identifiant exact de la réponse corrigée, repris tel quel",
      statut: "« juste », « partiel », « faux » ou « vide »",
      attendu: "la réponse correcte, formulée brièvement ; null si l'exercice admet plusieurs réponses valables",
      commentaire: "2 à 4 phrases : ce qui va, ce qui ne va pas, et pourquoi"
    }],
    bilan: "2 à 4 phrases sur l'ensemble de la copie, et ce sur quoi revenir en priorité",
    solution: "pour un algorithme à écrire ou à traduire : une solution possible, rédigée proprement ; null sinon"
  };

  function build(data, fields, answers) {
    var user = [
      "Corrige la copie suivante.",
      '',
      "=== ÉNONCÉ DONNÉ À L'ÉTUDIANT ===",
      exerciseBlock(data),
      '',
      "=== RÉPONSES DE L'ÉTUDIANT ===",
      answersBlock(fields, answers),
      '',
      '=== CE QUE TU DOIS PRODUIRE ===',
      'Un objet JSON de cette forme (respecte exactement les noms de clés) :',
      JSON.stringify(SHAPE, null, 2),
      '',
      'Le tableau « reponses » comporte exactement ' + fields.length + ' élément(s), dans le même ordre',
      "que ci-dessus, et reprend les identifiants suivants : " + fields.map(function (f) { return f.id; }).join(', ') + '.',
      'Une réponse laissée vide reçoit le statut « vide » : donne quand même la réponse attendue',
      "et une indication de méthode, c'est ce qui aidera l'étudiant."
    ].join('\n');

    return [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: user }
    ];
  }

  var STATUTS = ['juste', 'partiel', 'faux', 'vide'];

  /* Le modèle peut renvoyer les réponses dans le désordre, en oublier, ou
     inventer un statut : on recale sur les champs réellement demandés. */
  function normalise(raw, fields, answers) {
    var list = Array.isArray(raw && raw.reponses) ? raw.reponses : [];

    var reponses = fields.map(function (f, i) {
      var found = list.filter(function (r) { return r && r.id === f.id; })[0] || list[i] || {};
      var statut = String(found.statut || '').toLowerCase().trim();
      if (STATUTS.indexOf(statut) === -1) statut = isFilled(answers[f.id]) ? 'partiel' : 'vide';
      if (!isFilled(answers[f.id])) statut = 'vide';
      return {
        id: f.id,
        label: f.label,
        statut: statut,
        attendu: isFilled(found.attendu) ? String(found.attendu) : null,
        commentaire: isFilled(found.commentaire) ? String(found.commentaire) : ''
      };
    });

    return {
      reponses: reponses,
      bilan: isFilled(raw && raw.bilan) ? String(raw.bilan) : '',
      solution: isFilled(raw && raw.solution) ? String(raw.solution) : null
    };
  }

  function check(settings, data, fields, answers, signal) {
    return OpenRouter
      .askJSON(settings, build(data, fields, answers), { maxTokens: 4000 }, signal)
      .then(function (raw) { return normalise(raw, fields, answers); });
  }

  global.Check = { check: check, build: build, normalise: normalise, SYSTEM: SYSTEM };
})(window);
