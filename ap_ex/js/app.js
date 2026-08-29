/* Assemblage de l'interface : formulaire, génération, sauvegarde, réglages. */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var state = {
    level: 'intermédiaire',
    results: [],      // { typeId, node, data, params }
    controller: null,
    recentTitles: []
  };

  /* ─────────── construction du formulaire ─────────── */

  /* Une notion a trois états : 'off' (indifférent), 'in' (à inclure), 'out' (à exclure). */
  var STATES = ['off', 'in', 'out'];

  var STATE_LABEL = {
    off: 'indifférente — cliquer pour inclure',
    in: 'à inclure — cliquer pour exclure',
    out: 'à exclure — cliquer pour rendre indifférente'
  };

  var MARKS = {
    off: '',
    in: '<svg class="mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5 9.5 18 20 6"/></svg>',
    out: '<svg class="mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M5 12h14"/></svg>'
  };

  function notionHTML(label, notionState) {
    return '<button type="button" class="notion" data-state="' + notionState + '"' +
      ' data-label="' + Render.escAttr(label) + '"' +
      ' title="' + Render.escAttr(label + ' : ' + STATE_LABEL[notionState]) + '">' +
      MARKS[notionState] +
      '<span>' + Render.esc(label) + '</span>' +
    '</button>';
  }

  function appendNotion(label, notionState) {
    var wrap = document.createElement('div');
    wrap.innerHTML = notionHTML(label, notionState);
    $('#notions').appendChild(wrap.firstElementChild);
  }

  function buildNotions() {
    $('#notions').innerHTML = Catalog.NOTIONS.map(function (n) {
      return notionHTML(n.label, n.default ? 'in' : 'off');
    }).join('');
  }

  function findNotion(label) {
    return $$('#notions .notion').filter(function (b) {
      return b.dataset.label.toLowerCase() === label.toLowerCase();
    })[0];
  }

  function setNotionState(btn, notionState) {
    btn.dataset.state = notionState;
    btn.innerHTML = MARKS[notionState] + '<span>' + Render.esc(btn.dataset.label) + '</span>';
    btn.title = btn.dataset.label + ' : ' + STATE_LABEL[notionState];
  }

  function cycleNotion(btn) {
    var next = STATES[(STATES.indexOf(btn.dataset.state) + 1) % STATES.length];
    setNotionState(btn, next);
    persistForm();
  }

  function addCustomNotion(label) {
    label = (label || '').trim();
    if (!label) return;
    var existing = findNotion(label);
    if (existing) setNotionState(existing, 'in');
    else appendNotion(label, 'in');
    $('#notion-input').value = '';
    persistForm();
  }

  function buildTypes() {
    $('#types').innerHTML = Catalog.TYPES.map(function (t, i) {
      return '<label class="type-card" data-accent="' + t.accent + '">' +
        '<input type="checkbox" value="' + t.id + '"' + (i === 0 ? ' checked' : '') + '>' +
        '<span class="type-icon">' +
          '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + t.icon + '</svg>' +
        '</span>' +
        '<span class="type-text"><span class="type-name">' + Render.esc(t.name) + '</span>' +
        '<span class="type-desc">' + Render.esc(t.desc) + '</span></span>' +
      '</label>';
    }).join('');
  }

  /* ─────────── lecture / persistance du formulaire ─────────── */

  function notionsInState(wanted) {
    return $$('#notions .notion')
      .filter(function (b) { return b.dataset.state === wanted; })
      .map(function (b) { return b.dataset.label; });
  }

  function readForm() {
    return {
      domain: $('#domain').value.trim(),
      notions: notionsInState('in'),
      exclusions: notionsInState('out'),
      types: $$('#types input:checked').map(function (i) { return i.value; }),
      level: state.level
    };
  }

  function persistForm() {
    var f = readForm();
    Store.saveForm({
      domain: f.domain,
      notions: f.notions,
      exclusions: f.exclusions,
      types: f.types,
      level: f.level,
      notionStates: $$('#notions .notion').map(function (b) {
        return { label: b.dataset.label, state: b.dataset.state };
      })
    });
  }

  function restoreForm() {
    var f = Store.getForm();
    if (!f) return;

    if (Array.isArray(f.notionStates)) {
      /* format courant : la liste complète, avec l'état de chaque notion */
      f.notionStates.forEach(function (n) {
        if (!n || !n.label) return;
        var st = STATES.indexOf(n.state) === -1 ? 'off' : n.state;
        var btn = findNotion(n.label);
        if (btn) setNotionState(btn, st);
        else appendNotion(n.label, st);
      });
    } else if (Array.isArray(f.notions)) {
      /* ancien format : seulement les notions cochées */
      (f.allNotions || []).forEach(function (label) {
        if (!findNotion(label)) appendNotion(label, 'off');
      });
      $$('#notions .notion').forEach(function (b) {
        setNotionState(b, f.notions.indexOf(b.dataset.label) !== -1 ? 'in' : 'off');
      });
    }

    $('#domain').value = f.domain || '';
    syncDomainChips();

    if (Array.isArray(f.types) && f.types.length) {
      $$('#types input').forEach(function (i) { i.checked = f.types.indexOf(i.value) !== -1; });
    }
    if (f.level) setLevel(f.level);
  }

  function setLevel(level) {
    state.level = level;
    $$('#level button').forEach(function (b) {
      var on = b.dataset.level === level;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  }

  function syncDomainChips() {
    var v = $('#domain').value.trim().toLowerCase();
    $$('#domain-chips .chip').forEach(function (c) {
      c.classList.toggle('is-on', c.dataset.domain.toLowerCase() === v);
    });
  }

  /* ─────────── génération ─────────── */

  function paramsFor(typeId, form) {
    return {
      type: typeId,
      domain: form.domain,
      notions: form.notions,
      exclusions: form.exclusions,
      level: form.level,
      avoid: state.recentTitles.slice(0, 10),
      seed: Math.random().toString(36).slice(2, 10)
    };
  }

  function rememberTitle(title) {
    if (!title) return;
    state.recentTitles.unshift(title);
    state.recentTitles = state.recentTitles.slice(0, 12);
  }

  function setBusy(busy) {
    $('#btn-generate').disabled = busy;
    $('#btn-generate').querySelector('span').textContent = busy ? 'Génération…' : 'Générer';
    $('#btn-cancel').hidden = !busy;
    $('#btn-regenerate').disabled = busy;
  }

  function generateAll() {
    var settings = Store.getSettings();
    if (!settings.apiKey) {
      toast("Ajoutez d'abord une clé OpenRouter dans les paramètres.");
      openSettings();
      return;
    }

    var form = readForm();
    if (!form.types.length) {
      toast("Choisissez au moins un type d'exercice.");
      return;
    }

    persistForm();

    if (state.controller) state.controller.abort();
    state.controller = new AbortController();
    var signal = state.controller.signal;

    $('#empty').hidden = true;
    $('#results-head').hidden = false;
    $('#results-title').textContent = form.types.length > 1 ? 'Exercices' : 'Exercice';
    $('#results-meta').textContent = metaLine(form);

    var cards = $('#cards');
    cards.innerHTML = '';
    state.results = [];

    setBusy(true);

    var jobs = form.types.map(function (typeId) {
      var node = Render.card(typeId);
      cards.appendChild(node);
      var entry = { typeId: typeId, node: node, data: null, params: null };
      state.results.push(entry);
      return runOne(entry, form, settings, signal);
    });

    Promise.all(jobs).then(function () {
      if (!signal.aborted) setBusy(false);
    });
  }

  function runOne(entry, form, settings, signal) {
    var params = paramsFor(entry.typeId, form);
    entry.params = params;
    Render.setLoading(entry.node);

    return OpenRouter.generate(settings, params, signal).then(function (data) {
      entry.data = data;
      rememberTitle(data.titre);
      Render.setData(entry.node, data);
    }).catch(function (err) {
      if (err.name === 'AbortError') return;
      entry.data = null;
      Render.setError(entry.node, err.message || String(err));
    });
  }

  function regenerateOne(entry) {
    var settings = Store.getSettings();
    if (!settings.apiKey) { openSettings(); return; }
    var controller = new AbortController();
    entry.node.querySelectorAll('.mini-btn').forEach(function (b) { b.disabled = true; });
    runOne(entry, readForm(), settings, controller.signal);
  }

  function shorten(list, max) {
    return list.length > max
      ? list.slice(0, max).join(', ') + ' +' + (list.length - max)
      : list.join(', ');
  }

  function metaLine(form) {
    var notions = form.notions || [];
    var exclusions = form.exclusions || [];
    var parts = [];
    parts.push(form.domain ? 'domaine : ' + form.domain : 'domaine abstrait');
    parts.push('niveau : ' + form.level);
    if (notions.length) parts.push(shorten(notions, 3));
    if (exclusions.length) parts.push('sans : ' + shorten(exclusions, 3));
    return parts.join('  ·  ');
  }

  /* ─────────── aperçu du prompt ─────────── */

  /* Le prompt dépend des réglages courants : on le reconstruit à chaque ouverture,
     avec la même fonction que la génération, pour qu'il ne puisse pas diverger. */
  function renderPrompts() {
    var form = readForm();
    var body = $('#prompt-body');

    if (!form.types.length) {
      body.innerHTML = '<p class="hint">Sélectionnez au moins un type d\'exercice pour voir le prompt correspondant.</p>';
      return;
    }

    var intro = '<p class="hint">Ce qui serait envoyé maintenant, avec les réglages du panneau. ' +
      'Chaque type a son propre prompt, en deux messages : les <strong>consignes générales</strong> ' +
      '(rôle système) puis l\'<strong>instruction</strong> (rôle utilisateur). Le bouton <em>Copier</em> ' +
      'reprend les deux à la suite, prêt à coller dans n\'importe quelle interface de chat. ' +
      'La graine de variation, en fin d\'instruction, change à chaque génération.</p>';

    body.innerHTML = intro + form.types.map(function (typeId) {
      var t = Catalog.typeById(typeId);
      var messages = Prompts.build(paramsFor(typeId, form));
      var full = messages.map(function (m) { return m.content; }).join('\n\n');

      return '<section class="prompt-block" data-accent="' + t.accent + '">' +
        '<header class="prompt-head">' +
          '<span class="card-tag">' + Render.esc(t.tag) + '</span>' +
          '<span class="prompt-name">' + Render.esc(t.name) + '</span>' +
          '<span class="spacer"></span>' +
          '<button type="button" class="btn-ghost small" data-copy-prompt>Copier</button>' +
        '</header>' +
        '<p class="block-label">Consignes générales — message système</p>' +
        '<pre class="prompt-text">' + Render.esc(messages[0].content) + '</pre>' +
        '<p class="block-label">Instruction — message utilisateur</p>' +
        '<pre class="prompt-text">' + Render.esc(messages[1].content) + '</pre>' +
        '<textarea class="prompt-full" hidden aria-hidden="true">' + Render.esc(full) + '</textarea>' +
      '</section>';
    }).join('');
  }

  /* ─────────── téléchargement ─────────── */

  /* Le fichier contient l'énoncé et les paramètres qui l'ont produit, pour
     qu'un exercice téléchargé soit réutilisable seul. */
  function entryToRecord(entry) {
    return {
      type: entry.typeId,
      titre: entry.data.titre || 'Exercice',
      data: entry.data,
      params: {
        domain: entry.params.domain,
        notions: entry.params.notions,
        exclusions: entry.params.exclusions,
        level: entry.params.level
      },
      generatedAt: new Date().toISOString()
    };
  }

  function slug(text) {
    return String(text || 'exercice')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // accents
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'exercice';
  }

  function downloadOne(entry) {
    if (!entry.data) return;
    var record = entryToRecord(entry);
    download(
      'exercice_' + entry.typeId + '_' + slug(record.titre) + '_' + stamp() + '.json',
      JSON.stringify(record, null, 2),
      'application/json'
    );
    toast('Fichier JSON téléchargé.');
  }

  function download(filename, text, mime) {
    var blob = new Blob([text], { type: (mime || 'text/plain') + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* Presse-papier : l'API moderne n'existe pas partout (ouverture en file:// notamment). */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text)
        .then(function () { return true; })
        .catch(function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }

  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function stamp() {
    var d = new Date();
    var p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + '_' + p(d.getHours()) + p(d.getMinutes());
  }

  /* ─────────── réglages ─────────── */

  function openSettings() {
    var s = Store.getSettings();
    $('#api-key').value = s.apiKey;
    $('#model').value = s.model;
    $('#temperature').value = s.temperature;
    $('#temp-val').textContent = Number(s.temperature).toFixed(1);
    $('#test-status').textContent = '';
    $('#test-status').className = 'test-status';
    $('#dlg-settings').showModal();
  }

  function saveSettings() {
    Store.saveSettings({
      apiKey: $('#api-key').value.trim(),
      model: $('#model').value.trim() || Store.DEFAULT_MODEL,
      temperature: parseFloat($('#temperature').value)
    });
    refreshModelNote();
    $('#dlg-settings').close();
    toast('Paramètres enregistrés.');
  }

  function refreshModelNote() {
    var s = Store.getSettings();
    var note = $('#model-note');
    if (!s.apiKey) {
      note.className = 'model-note warn';
      note.innerHTML = 'Aucune clé OpenRouter — <a data-open-settings>ouvrir les paramètres</a>';
    } else {
      note.className = 'model-note';
      note.innerHTML = 'Modèle : ' + Render.esc(s.model) + ' — <a data-open-settings>modifier</a>';
    }
  }

  /* ─────────── toast ─────────── */

  var toastTimer = null;
  function toast(message) {
    var t = $('#toast');
    t.textContent = message;
    t.hidden = false;
    requestAnimationFrame(function () { t.classList.add('is-on'); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      t.classList.remove('is-on');
      setTimeout(function () { t.hidden = true; }, 250);
    }, 3200);
  }

  /* ─────────── évènements ─────────── */

  function wire() {
    $('#gen-form').addEventListener('submit', function (e) {
      e.preventDefault();
      generateAll();
    });

    $('#btn-cancel').addEventListener('click', function () {
      if (state.controller) state.controller.abort();
      setBusy(false);
      state.results.forEach(function (entry) {
        if (!entry.data) Render.setError(entry.node, 'Génération annulée.');
      });
    });

    $('#btn-regenerate').addEventListener('click', generateAll);
    $('#btn-print').addEventListener('click', function () { window.print(); });

    $('#btn-prompt').addEventListener('click', function () {
      renderPrompts();
      $('#dlg-prompt').showModal();
    });

    $('#prompt-body').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-copy-prompt]');
      if (!btn) return;
      var full = btn.closest('.prompt-block').querySelector('.prompt-full');
      copyText(full.value).then(function (ok) {
        btn.textContent = ok ? 'Copié' : 'Échec';
        setTimeout(function () { btn.textContent = 'Copier'; }, 1600);
      });
    });

    $('#domain').addEventListener('input', function () { syncDomainChips(); persistForm(); });

    $('#domain-chips').addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      var value = chip.dataset.domain;
      $('#domain').value = ($('#domain').value.trim().toLowerCase() === value.toLowerCase()) ? '' : value;
      syncDomainChips();
      persistForm();
    });

    $('#notions').addEventListener('click', function (e) {
      var btn = e.target.closest('.notion');
      if (btn) cycleNotion(btn);
    });
    $('#types').addEventListener('change', persistForm);

    $('#notion-add').addEventListener('click', function () { addCustomNotion($('#notion-input').value); });
    $('#notion-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); addCustomNotion(this.value); }
    });

    $('#level').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      setLevel(b.dataset.level);
      persistForm();
    });

    /* actions sur les cartes */
    $('#cards').addEventListener('click', function (e) {
      var copyBtn = e.target.closest('[data-copy]');
      if (copyBtn) {
        var pre = copyBtn.parentElement.querySelector('pre');
        copyText(pre.textContent).then(function (ok) {
          copyBtn.textContent = ok ? 'Copié' : 'Échec';
          setTimeout(function () { copyBtn.textContent = 'Copier'; }, 1600);
        });
        return;
      }
      var btn = e.target.closest('.mini-btn');
      if (!btn) return;
      var node = btn.closest('.card');
      var entry = state.results.filter(function (x) { return x.node === node; })[0];
      if (!entry) return;
      if (btn.dataset.action === 'regen') regenerateOne(entry);
      if (btn.dataset.action === 'download') downloadOne(entry);
    });

    /* réglages */
    $('#btn-settings').addEventListener('click', openSettings);
    $('#settings-save').addEventListener('click', saveSettings);
    $('#temperature').addEventListener('input', function () {
      $('#temp-val').textContent = Number(this.value).toFixed(1);
    });
    $('#key-toggle').addEventListener('click', function () {
      var input = $('#api-key');
      var hidden = input.type === 'password';
      input.type = hidden ? 'text' : 'password';
      this.textContent = hidden ? 'Masquer' : 'Voir';
    });

    $('#btn-test').addEventListener('click', function () {
      var status = $('#test-status');
      var settings = {
        apiKey: $('#api-key').value.trim(),
        model: $('#model').value.trim(),
        temperature: 0
      };
      if (!settings.apiKey || !settings.model) {
        status.className = 'test-status err';
        status.textContent = 'Clé et modèle requis.';
        return;
      }
      status.className = 'test-status';
      status.textContent = 'Test en cours…';
      this.disabled = true;
      var btn = this;
      OpenRouter.test(settings).then(function () {
        status.className = 'test-status ok';
        status.textContent = 'Connexion réussie.';
      }).catch(function (err) {
        status.className = 'test-status err';
        status.textContent = err.message || String(err);
      }).then(function () { btn.disabled = false; });
    });

    /* fermeture des dialogues + liens vers les réglages */
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) {
        var dlg = e.target.closest('dialog');
        if (dlg) dlg.close();
      }
      if (e.target.closest('[data-open-settings]')) {
        e.preventDefault();
        openSettings();
      }
    });

    /* clic dans le vide = fermeture */
    $$('.dlg').forEach(function (dlg) {
      dlg.addEventListener('click', function (e) {
        if (e.target === dlg) dlg.close();
      });
    });
  }

  /* ─────────── démarrage ─────────── */

  buildNotions();
  buildTypes();
  restoreForm();
  wire();
  refreshModelNote();
})();
