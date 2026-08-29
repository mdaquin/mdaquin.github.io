/* Rendu des cartes d'exercice. */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /* pour une valeur d'attribut HTML */
  function escAttr(s) {
    return esc(s).replace(/"/g, '&quot;');
  }

  function isFilled(v) {
    if (v == null) return false;
    if (Array.isArray(v)) return v.length > 0;
    return String(v).trim() !== '' && String(v).trim().toLowerCase() !== 'null';
  }

  function asList(v) {
    if (!isFilled(v)) return [];
    return Array.isArray(v) ? v.filter(isFilled) : [v];
  }

  /* ── coloration douce du pseudo-code ── */
  var PSEUDO_KW = [
    'Début', 'Debut', 'Fin', 'Pour toujours', 'Pour chaque', 'Pour', 'faire', 'dans', 'Tant que',
    'Répéter', 'Repeter', 'Jusqu\'à',
    'Si', 'alors', 'Sinon si', 'SinonSi', 'Sinon', 'Renvoyer', 'Retourner',
    'Afficher', 'Lire', 'Fonction', 'Données',
    'Classe', 'Attributs', 'Constructeur', 'Méthode', 'Methode', 'nouveau', 'super', 'this',
    'est vide', 'Vrai', 'Faux',
    'ET', 'OU', 'NON'
  ];

  /* Opérations nommées du cours : mises en valeur, mais autrement que les mots-clés. */
  var PSEUDO_OPS = [
    'Longueur', 'Ajouter', 'Supprimer', 'Valeurs',
    'empiler', 'dépiler', 'depiler', 'ajouter', 'retirer', 'successeurs'
  ];

  function highlightPseudo(code) {
    var out = esc(code);
    out = out.replace(/^(\s*)(Entrées|Entrees|Entrée|Entree|Sortie)\s*:/gm, function (_, sp, w) {
      return sp + '<span class="io">' + w + ' :</span>';
    });
    var kw = PSEUDO_KW
      .map(function (k) { return k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); })
      .sort(function (a, b) { return b.length - a.length; })
      .join('|');
    // le point est admis après le mot-clé, pour « super.Constructeur » et « this.valeur »
    var re = new RegExp('(^|[\\s(])(' + kw + ')(?=$|[\\s(,:.])', 'gm');
    out = out.replace(re, function (_, pre, word) {
      return pre + '<span class="kw">' + word + '</span>';
    });

    // opérations nommées : reconnues à leur parenthèse ouvrante
    var ops = PSEUDO_OPS.sort(function (a, b) { return b.length - a.length; }).join('|');
    return out.replace(new RegExp('(^|[^\\w<])(' + ops + ')(?=\\s*\\()', 'gm'), function (_, pre, word) {
      return pre + '<span class="fn">' + word + '</span>';
    });
  }

  /* ── coloration douce de Python ── */
  var PY_KW = ['def', 'return', 'if', 'elif', 'else', 'for', 'while', 'in', 'is', 'range', 'len',
    'and', 'or', 'not', 'True', 'False', 'None', 'break', 'continue', 'print', 'input', 'del',
    'import', 'int', 'float', 'str', 'bool', 'list', 'dict', 'sum', 'min', 'max', 'abs', 'sorted',
    'append', 'pop', 'items', 'values', 'keys', 'class', 'self', 'pass'];

  function highlightPythonSegment(seg) {
    var out = seg.replace(new RegExp('\\b(' + PY_KW.join('|') + ')\\b', 'g'), '<span class="kw">$1</span>');
    out = out.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="num">$1</span>');
    return out;
  }

  function highlightPython(code) {
    // esc() ne touche pas aux guillemets : les littéraux restent reconnaissables tels quels.
    var src = esc(code);
    var re = /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')/g;
    var out = '';
    var last = 0;
    var m;
    while ((m = re.exec(src)) !== null) {
      out += highlightPythonSegment(src.slice(last, m.index));
      out += m[1]
        ? '<span class="com">' + m[1] + '</span>'
        : '<span class="str">' + m[2] + '</span>';
      last = m.index + m[0].length;
    }
    out += highlightPythonSegment(src.slice(last));
    return out;
  }

  function el(html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function codeBlock(label, code, kind) {
    var html = kind === 'python' ? highlightPython(code) : highlightPseudo(code);
    return '<div class="block">' +
      '<p class="block-label">' + esc(label) + '</p>' +
      '<div class="codewrap">' +
        '<pre class="' + kind + '">' + html + '</pre>' +
        '<button type="button" class="copy-btn" data-copy>Copier</button>' +
      '</div>' +
    '</div>';
  }

  function ioBlock(entrees, sortie) {
    var items = [];
    asList(entrees).forEach(function (e) {
      if (typeof e === 'string') {
        items.push('<div class="io-item"><span>' + esc(e) + '</span></div>');
      } else {
        items.push('<div class="io-item"><span class="io-key">' + esc(e.nom || e.name || '?') + '</span>' +
          '<span>' + esc(e.description || e.desc || '') + '</span></div>');
      }
    });
    var html = '';
    if (items.length) {
      html += '<div class="block"><p class="block-label">Entrées</p><div class="io-list">' + items.join('') + '</div></div>';
    }
    if (isFilled(sortie)) {
      html += '<div class="block"><p class="block-label">Sortie</p><div class="io-list">' +
        '<div class="io-item"><span>' + esc(sortie) + '</span></div></div></div>';
    }
    return html;
  }

  function casBlock(cas) {
    var list = asList(cas).map(function (c) { return '<span class="case">' + esc(c) + '</span>'; });
    if (!list.length) return '';
    return '<div class="block"><p class="block-label">Jeux de valeurs à dérouler</p>' +
      '<div class="cases">' + list.join('') + '</div></div>';
  }

  function questionsBlock(questions) {
    var list = asList(questions).map(function (q) { return '<div class="question">' + esc(q) + '</div>'; });
    if (!list.length) return '';
    return '<div class="block"><p class="block-label">Questions</p><div class="questions">' + list.join('') + '</div></div>';
  }

  function consignesBlock(consignes) {
    var list = asList(consignes).map(function (c) { return '<li>' + esc(c) + '</li>'; });
    if (!list.length) return '';
    return '<div class="block"><p class="block-label">Consignes</p><ul class="plain">' + list.join('') + '</ul></div>';
  }

  /* Corps de l'énoncé, selon le type.
     opts.interactive : les jeux de valeurs et les questions deviennent des champs
     de réponse ailleurs dans la page, on ne les répète donc pas ici.
     opts.answerSpace : réserve un espace de réponse (visible à l'impression). */
  function bodyHTML(data, opts) {
    opts = opts || {};
    var interactive = !!opts.interactive;
    var html = '';

    if (isFilled(data.titre)) html += '<h3 class="card-title">' + esc(data.titre) + '</h3>';
    // les modèles écrivent parfois « context » au lieu de « contexte »
    var contexte = isFilled(data.contexte) ? data.contexte : data.context;
    if (isFilled(contexte)) html += '<p class="context">' + esc(contexte) + '</p>';
    if (isFilled(data.enonce)) html += '<p class="statement">' + esc(data.enonce) + '</p>';

    if (data.type === 'ecrire') {
      html += ioBlock(data.entrees, data.sortie);
      html += consignesBlock(data.consignes);
    } else if (data.type === 'derouler') {
      if (isFilled(data.algorithme)) html += codeBlock('Algorithme', data.algorithme, 'pseudo');
      if (!interactive) {
        html += casBlock(data.cas);
        html += questionsBlock(data.questions);
      }
      html += consignesBlock(data.consignes);
    } else if (data.type === 'traduire') {
      if (isFilled(data.algorithme)) html += codeBlock('Algorithme à traduire', data.algorithme, 'pseudo');
      html += consignesBlock(data.consignes);
    } else if (data.type === 'lire') {
      if (isFilled(data.code_python)) html += codeBlock('Programme Python', data.code_python, 'python');
      if (!interactive) html += questionsBlock(data.questions);
      html += consignesBlock(data.consignes);
    }

    if (isFilled(data.aide)) {
      html += '<div class="note-tip"><strong>Piste :</strong> ' + esc(data.aide) + '</div>';
    }
    if (opts.answerSpace !== false) {
      html += '<div class="answer-space" aria-hidden="true"></div>';
    }
    return html;
  }

  function iconSvg(path, size) {
    return '<svg viewBox="0 0 24 24" width="' + (size || 18) + '" height="' + (size || 18) + '" fill="none" ' +
      'stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + path + '</svg>';
  }

  /* Carte complète (état chargement / résultat / erreur). */
  function card(typeId) {
    var t = Catalog.typeById(typeId);
    var node = el(
      '<article class="card is-loading" data-accent="' + t.accent + '" data-type="' + t.id + '">' +
        '<header class="card-head">' +
          '<span class="card-tag">' + iconSvg(t.icon, 14) + t.tag + '</span>' +
          '<span class="spacer"></span>' +
          '<button type="button" class="mini-btn" data-action="regen" title="Regénérer cet exercice" aria-label="Regénérer cet exercice">' +
            iconSvg('<path d="M20 11a8 8 0 1 0-.8 4.5"/><path d="M20 5v6h-6"/>') +
          '</button>' +
          '<button type="button" class="mini-btn" data-action="download" title="Télécharger le JSON de cet exercice" aria-label="Télécharger le JSON de cet exercice">' +
            iconSvg('<path d="M12 4v11"/><path d="M8 11.5l4 4 4-4"/><path d="M5 19.5h14"/>') +
          '</button>' +
        '</header>' +
        '<div class="card-body"></div>' +
      '</article>'
    );
    setLoading(node);
    return node;
  }

  function setLoading(node) {
    node.classList.add('is-loading');
    node.querySelectorAll('.mini-btn').forEach(function (b) { b.disabled = true; });
    node.querySelector('.card-body').innerHTML =
      '<div class="skeleton">' +
        '<div class="sk-line w45" style="height:18px"></div>' +
        '<div class="sk-line w90"></div>' +
        '<div class="sk-line w70"></div>' +
        '<div class="sk-line tall"></div>' +
        '<div class="sk-line w45"></div>' +
      '</div>';
  }

  function setData(node, data) {
    node.classList.remove('is-loading');
    node.querySelectorAll('.mini-btn').forEach(function (b) { b.disabled = false; });
    node.querySelector('.card-body').innerHTML = bodyHTML(data);
  }

  function setError(node, message) {
    node.classList.remove('is-loading');
    node.querySelector('[data-action="regen"]').disabled = false;
    node.querySelector('[data-action="download"]').disabled = true;
    node.querySelector('.card-body').innerHTML =
      '<div class="card-error">' +
        iconSvg('<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5M12 16h.01"/>', 20) +
        '<div><strong>La génération a échoué.</strong><br>' + esc(message) + '</div>' +
      '</div>';
  }

  global.Render = {
    statement: bodyHTML,
    codeBlock: codeBlock,
    card: card,
    setLoading: setLoading,
    setData: setData,
    setError: setError,
    esc: esc,
    escAttr: escAttr
  };
})(window);
