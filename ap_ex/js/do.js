/* Interface « faire un exercice » : choix, saisie des réponses, correction. */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var state = {
    index: null,        // contenu de exercices_bank/index.json
    filters: { type: '', domaine: '', niveau: '', notion: '', texte: '' },
    data: null,         // l'exercice ouvert (le champ « data » du fichier)
    record: null,       // le fichier complet, pour ses paramètres
    fields: [],
    controller: null,
    lastFile: null      // pour ne pas retirer deux fois de suite le même au hasard
  };

  var esc = function (s) { return Render.esc(s); };

  /* ─────────── banque ─────────── */

  function loadBank() {
    var box = $('#bank');
    box.innerHTML = '<p class="bank-note">Chargement de la banque…</p>';

    Bank.load().then(function (index) {
      state.index = index;
      $('#btn-random').disabled = !(index.exercices || []).length;
      renderFilters();
      renderList();
    }).catch(function (err) {
      box.innerHTML = '<div class="bank-error">' +
        '<p><strong>Banque indisponible.</strong> ' + esc(err.message) + '</p>' +
        '<p>Vous pouvez tout de même ouvrir un fichier d\'exercice depuis votre disque.</p>' +
        '</div>';
      $('#filters').innerHTML = '';
    });
  }

  function selectHTML(id, label, options, selected) {
    var opts = ['<option value="">' + esc(label) + '</option>'].concat(
      options.map(function (o) {
        var value = o.valeur;
        var text = (o.libelle || o.valeur) + ' (' + o.nombre + ')';
        return '<option value="' + Render.escAttr(value) + '"' +
          (value === selected ? ' selected' : '') + '>' + esc(text) + '</option>';
      })
    );
    return '<select id="' + id + '" class="filter-select">' + opts.join('') + '</select>';
  }

  function renderFilters() {
    var f = state.index.facettes || {};
    var types = (f.types || []).map(function (t) {
      var known = Catalog.typeById(t.valeur);
      return { valeur: t.valeur, libelle: known ? known.name : t.valeur, nombre: t.nombre };
    });

    $('#filters').innerHTML =
      selectHTML('f-type', 'Tous les types', types, state.filters.type) +
      selectHTML('f-domaine', 'Tous les domaines', f.domaines || [], state.filters.domaine) +
      selectHTML('f-niveau', 'Tous les niveaux', f.niveaux || [], state.filters.niveau) +
      selectHTML('f-notion', 'Toutes les notions', f.notions || [], state.filters.notion) +
      '<button type="button" class="btn-ghost small" id="f-reset" hidden>Tout afficher</button>';
  }

  function activeFilters() {
    return Object.keys(state.filters).filter(function (k) { return state.filters[k]; }).length;
  }

  function renderList() {
    var entries = Bank.filter(state.index.exercices || [], state.filters);
    var box = $('#bank');
    var reset = $('#f-reset');
    if (reset) reset.hidden = activeFilters() === 0;

    if (!entries.length) {
      box.innerHTML = '<p class="bank-note">' +
        (state.index.nombre ? 'Aucun exercice ne correspond à ces filtres.' : 'La banque est vide.') +
        '</p>';
      return;
    }

    box.innerHTML = '<p class="bank-count">' + entries.length +
      (entries.length > 1 ? ' exercices' : ' exercice') +
      (activeFilters() ? ' sur ' + state.index.nombre : '') + '</p>' +
      entries.map(function (e) {
        var t = Catalog.typeById(e.type);
        var meta = [e.domaine, e.niveau].filter(Boolean).join(' · ');
        var notions = (e.notions || []).map(function (n) {
          return '<span class="bank-notion">' + esc(n) + '</span>';
        }).join('');

        return '<button type="button" class="bank-item" data-file="' + Render.escAttr(e.fichier) + '">' +
          '<span class="bank-tag" data-accent="' + (t ? t.accent : '') + '">' + esc(t ? t.tag : e.type) + '</span>' +
          '<span class="bank-main">' +
            '<span class="bank-title">' + esc(e.titre) + '</span>' +
            (meta ? '<span class="bank-meta">' + esc(meta) + '</span>' : '') +
            (e.resume ? '<span class="bank-resume">' + esc(e.resume) + '</span>' : '') +
            (notions ? '<span class="bank-notions">' + notions + '</span>' : '') +
          '</span>' +
        '</button>';
      }).join('');
  }

  /* ─────────── ouverture d'un exercice ─────────── */

  function openEntry(entry, node) {
    if (node) node.classList.add('is-loading');
    return Bank.loadExercise(entry)
      .then(function (raw) {
        state.lastFile = entry.fichier;
        openExercise(raw, entry.fichier);
      })
      .catch(function (err) { toast(err.message); })
      .then(function () { if (node) node.classList.remove('is-loading'); });
  }

  /* Tire au sort parmi les exercices AFFICHÉS : les filtres restent actifs,
     ce qui permet « un exercice au hasard sur les boucles, en biologie ». */
  function openRandom() {
    if (!state.index) return;
    var entries = Bank.filter(state.index.exercices || [], state.filters);
    if (!entries.length) {
      toast('Aucun exercice ne correspond à ces filtres.');
      return;
    }

    var pool = entries.length > 1
      ? entries.filter(function (e) { return e.fichier !== state.lastFile; })
      : entries;

    openEntry(pool[Math.floor(Math.random() * pool.length)]);
  }

  /* Accepte le fichier complet ({type, data, params}) comme un énoncé seul. */
  function normalise(raw) {
    if (!raw || typeof raw !== 'object') throw new Error("Ce fichier ne contient pas d'exercice.");

    var record = raw;
    var data = (raw.data && typeof raw.data === 'object') ? raw.data : raw;
    if (!data.type && raw.type) data.type = raw.type;

    if (!data.type || !Catalog.typeById(data.type)) {
      throw new Error("Type d'exercice absent ou inconnu dans ce fichier.");
    }
    if (!data.enonce && !data.algorithme && !data.code_python) {
      throw new Error('Ce fichier ne contient pas ce qu\'il faut pour poser un exercice.');
    }
    return { record: record, data: data };
  }

  function openExercise(raw, source) {
    var ok;
    try {
      ok = normalise(raw);
    } catch (err) {
      toast(err.message);
      return;
    }

    state.record = ok.record;
    state.data = ok.data;
    state.fields = Answers.fieldsFor(ok.data);

    var t = Catalog.typeById(ok.data.type);
    $('#exercise-card').dataset.accent = t.accent;
    $('#do-tag').textContent = t.tag;
    $('#do-source').textContent = source || '';

    var params = ok.record.params || {};
    $('#do-meta').textContent = [params.domain, params.level].filter(Boolean).join(' · ');

    $('#exercise-body').innerHTML = Render.statement(ok.data, { interactive: true, answerSpace: false });
    renderFields();

    $('#feedback').innerHTML = '';
    $('#screen-pick').hidden = true;
    $('#screen-do').hidden = false;
    window.scrollTo(0, 0);
  }

  function renderFields() {
    $('#answer-fields').innerHTML = state.fields.map(function (f) {
      var isShort = f.kind === 'court';
      var input = isShort
        ? '<input type="text" class="answer-input" id="ans-' + Render.escAttr(f.id) + '" autocomplete="off">'
        : '<textarea class="answer-area ' + (f.kind === 'code' ? 'is-code' : 'is-pseudo') + '" rows="10" ' +
          'id="ans-' + Render.escAttr(f.id) + '" spellcheck="false"></textarea>';

      return '<div class="answer-field" data-id="' + Render.escAttr(f.id) + '">' +
        '<label class="answer-label" for="ans-' + Render.escAttr(f.id) + '">' + esc(f.label) + '</label>' +
        (f.hint ? '<p class="answer-hint">' + esc(f.hint) + '</p>' : '') +
        input +
      '</div>';
    }).join('');
  }

  function collectAnswers() {
    var answers = {};
    state.fields.forEach(function (f) {
      var el = $('#ans-' + CSS.escape(f.id));
      answers[f.id] = el ? el.value.trim() : '';
    });
    return answers;
  }

  /* ─────────── correction ─────────── */

  function setChecking(busy) {
    $('#btn-check').disabled = busy;
    $('#btn-check').querySelector('span').textContent = busy ? 'Correction…' : 'Vérifier';
    $('#btn-cancel-check').hidden = !busy;
  }

  function runCheck() {
    var settings = Store.getCheckSettings();
    if (!settings.apiKey) {
      toast('Ajoutez une clé OpenRouter pour que la correction soit possible.');
      openSettings();
      return;
    }

    var answers = collectAnswers();
    var written = state.fields.filter(function (f) { return answers[f.id]; }).length;
    if (!written) {
      toast('Écrivez au moins une réponse avant de vérifier.');
      return;
    }

    if (state.controller) state.controller.abort();
    state.controller = new AbortController();

    setChecking(true);
    $('#feedback').innerHTML =
      '<div class="feedback-wait"><span class="spinner" aria-hidden="true"></span>' +
      'Le correcteur refait l\'exercice de son côté, puis compare…</div>';

    Check.check(settings, state.data, state.fields, answers, state.controller.signal)
      .then(function (result) {
        renderFeedback(result);
      })
      .catch(function (err) {
        if (err.name === 'AbortError') { $('#feedback').innerHTML = ''; return; }
        $('#feedback').innerHTML = '<div class="card-error">' +
          '<div><strong>La correction a échoué.</strong><br>' + esc(err.message) + '</div></div>';
      })
      .then(function () { setChecking(false); });
  }

  var STATUT = {
    juste: { label: 'Juste', accent: 'ok' },
    partiel: { label: 'En partie', accent: 'half' },
    faux: { label: 'À revoir', accent: 'ko' },
    vide: { label: 'Sans réponse', accent: 'none' }
  };

  function renderFeedback(result) {
    var counts = { juste: 0, partiel: 0, faux: 0, vide: 0 };
    result.reponses.forEach(function (r) { counts[r.statut] = (counts[r.statut] || 0) + 1; });

    var summary = [];
    if (counts.juste) summary.push(counts.juste + ' juste' + (counts.juste > 1 ? 's' : ''));
    if (counts.partiel) summary.push(counts.partiel + ' en partie');
    if (counts.faux) summary.push(counts.faux + ' à revoir');
    if (counts.vide) summary.push(counts.vide + ' sans réponse');

    var html = '<div class="feedback">' +
      '<div class="feedback-head">' +
        '<h2 class="section-title">Correction</h2>' +
        '<span class="feedback-summary">' + esc(summary.join(' · ')) + '</span>' +
      '</div>';

    html += result.reponses.map(function (r) {
      var s = STATUT[r.statut] || STATUT.partiel;
      return '<div class="verdict" data-statut="' + s.accent + '">' +
        '<div class="verdict-head">' +
          '<span class="verdict-badge">' + esc(s.label) + '</span>' +
          '<span class="verdict-label">' + esc(r.label) + '</span>' +
        '</div>' +
        (r.commentaire ? '<p class="verdict-text">' + esc(r.commentaire) + '</p>' : '') +
        (r.attendu ? '<p class="verdict-expected"><strong>Réponse attendue :</strong> ' + esc(r.attendu) + '</p>' : '') +
      '</div>';
    }).join('');

    if (result.bilan) {
      html += '<div class="bilan"><p class="block-label">Bilan</p>' + esc(result.bilan) + '</div>';
    }

    if (result.solution) {
      var kind = state.data.type === 'traduire' ? 'python' : 'pseudo';
      html += '<details class="solution"><summary>Voir une solution possible</summary>' +
        Render.codeBlock('Solution', result.solution, kind) + '</details>';
    }

    html += '<p class="feedback-caveat">Correction produite par un modèle de langage : ' +
      'elle peut se tromper. En cas de doute, comparez avec le cours.</p>';
    html += '</div>';

    $('#feedback').innerHTML = html;
    $('#feedback').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ─────────── réglages ─────────── */

  function openSettings() {
    var s = Store.getCheckSettings();
    $('#api-key').value = s.apiKey;
    $('#model').value = s.model;
    $('#temperature').value = s.temperature;
    $('#temp-val').textContent = Number(s.temperature).toFixed(1);
    $('#inherited-note').hidden = !s.inherited;
    $('#test-status').textContent = '';
    $('#test-status').className = 'test-status';
    $('#dlg-settings').showModal();
  }

  function saveSettings() {
    Store.saveCheckSettings({
      apiKey: $('#api-key').value.trim(),
      model: $('#model').value.trim() || Store.DEFAULT_MODEL,
      temperature: parseFloat($('#temperature').value)
    });
    refreshCheckNote();
    $('#dlg-settings').close();
    toast('Paramètres enregistrés.');
  }

  function refreshCheckNote() {
    var s = Store.getCheckSettings();
    var note = $('#check-note');
    if (!s.apiKey) {
      note.className = 'check-note warn';
      note.innerHTML = 'Aucune clé OpenRouter — <a data-open-settings>régler la correction</a>';
    } else {
      note.className = 'check-note';
      note.innerHTML = 'Correction par ' + esc(s.model) + ' — <a data-open-settings>modifier</a>';
    }
  }

  /* ─────────── divers ─────────── */

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
    }, 3600);
  }

  function readFile(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var parsed;
      try {
        parsed = JSON.parse(String(reader.result));
      } catch (e) {
        toast('Ce fichier n\'est pas un JSON valide.');
        return;
      }
      openExercise(parsed, file.name);
    };
    reader.onerror = function () { toast('Lecture du fichier impossible.'); };
    reader.readAsText(file);
  }

  /* ─────────── évènements ─────────── */

  function wire() {
    $('#bank').addEventListener('click', function (e) {
      var item = e.target.closest('.bank-item');
      if (!item) return;
      var entry = (state.index.exercices || []).filter(function (x) {
        return x.fichier === item.dataset.file;
      })[0];
      if (entry) openEntry(entry, item);
    });

    $('#btn-random').addEventListener('click', openRandom);

    $('#filters').addEventListener('change', function (e) {
      var map = { 'f-type': 'type', 'f-domaine': 'domaine', 'f-niveau': 'niveau', 'f-notion': 'notion' };
      var key = map[e.target.id];
      if (!key) return;
      state.filters[key] = e.target.value;
      renderList();
    });

    $('#filters').addEventListener('click', function (e) {
      if (!e.target.closest('#f-reset')) return;
      state.filters = { type: '', domaine: '', niveau: '', notion: '', texte: '' };
      $('#f-texte').value = '';
      renderFilters();
      renderList();
    });

    $('#f-texte').addEventListener('input', function () {
      state.filters.texte = this.value;
      if (state.index) renderList();
    });

    $('#btn-open-file').addEventListener('click', function () { $('#file-input').click(); });
    $('#file-input').addEventListener('change', function () {
      readFile(this.files[0]);
      this.value = '';
    });

    /* glisser-déposer d'un fichier sur l'écran de choix */
    var pick = $('#screen-pick');
    ['dragenter', 'dragover'].forEach(function (evt) {
      pick.addEventListener(evt, function (e) {
        e.preventDefault();
        pick.classList.add('is-drop');
      });
    });
    ['dragleave', 'drop'].forEach(function (evt) {
      pick.addEventListener(evt, function (e) {
        e.preventDefault();
        if (evt === 'dragleave' && pick.contains(e.relatedTarget)) return;
        pick.classList.remove('is-drop');
        if (evt === 'drop') readFile(e.dataTransfer.files[0]);
      });
    });

    $('#btn-back').addEventListener('click', function () {
      if (state.controller) state.controller.abort();
      $('#screen-do').hidden = true;
      $('#screen-pick').hidden = false;
      window.scrollTo(0, 0);
    });

    $('#answer-form').addEventListener('submit', function (e) {
      e.preventDefault();
      runCheck();
    });

    $('#btn-cancel-check').addEventListener('click', function () {
      if (state.controller) state.controller.abort();
      setChecking(false);
    });

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
      var btn = this;
      btn.disabled = true;
      OpenRouter.test(settings).then(function () {
        status.className = 'test-status ok';
        status.textContent = 'Connexion réussie.';
      }).catch(function (err) {
        status.className = 'test-status err';
        status.textContent = err.message || String(err);
      }).then(function () { btn.disabled = false; });
    });

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

    $$('.dlg').forEach(function (dlg) {
      dlg.addEventListener('click', function (e) {
        if (e.target === dlg) dlg.close();
      });
    });
  }

  /* ─────────── démarrage ─────────── */

  wire();
  refreshCheckNote();
  loadBank();
})();
