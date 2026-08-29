/* Accès à la banque d'exercices : index, filtres, chargement d'un exercice. */
(function (global) {
  'use strict';

  var DIR = 'exercices_bank/';

  function load() {
    return fetch(DIR + 'index.json', { cache: 'no-store' })
      .then(function (res) {
        if (res.status === 404) {
          throw new Error("index.json est introuvable dans " + DIR +
            ' — lancez « python3 build_index.py » pour le construire.');
        }
        if (!res.ok) throw new Error('index.json illisible (' + res.status + ').');
        return res.json();
      })
      .catch(function (err) {
        // Sur file://, fetch échoue avant d'atteindre le serveur : le rejet est un
        // TypeError au message opaque (« Failed to fetch »), qu'on traduit ici.
        if (err && (err.name === 'TypeError' || /fetch|network|réseau/i.test(err.message || ''))) {
          throw new Error("La banque n'est pas accessible en ouvrant le fichier directement " +
            'depuis le disque. Lancez « python3 -m http.server 8000 » dans le dossier du projet, ' +
            'puis ouvrez http://localhost:8000.');
        }
        throw err;
      });
  }

  function loadExercise(entry) {
    return fetch(DIR + entry.fichier, { cache: 'no-store' }).then(function (res) {
      if (!res.ok) throw new Error('Fichier introuvable : ' + entry.fichier);
      return res.json();
    });
  }

  function norm(text) {
    return String(text == null ? '' : text)
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  /* filters : { type, domaine, niveau, notion, texte } — champs vides ignorés. */
  function filter(entries, filters) {
    var q = norm(filters.texte || '').trim();
    return entries.filter(function (e) {
      if (filters.type && e.type !== filters.type) return false;
      if (filters.domaine && e.domaine !== filters.domaine) return false;
      if (filters.niveau && e.niveau !== filters.niveau) return false;
      if (filters.notion && (e.notions || []).indexOf(filters.notion) === -1) return false;
      if (q) {
        var haystack = norm([e.titre, e.resume, e.domaine, (e.notions || []).join(' ')].join(' '));
        if (haystack.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  global.Bank = { load: load, loadExercise: loadExercise, filter: filter, DIR: DIR };
})(window);
