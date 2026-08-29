/* Champs de réponse attendus, selon le type d'exercice.

   Un champ : { id, label, hint, kind: 'court' | 'code' | 'pseudo', prompt }
   `prompt` est ce qui sera montré au correcteur pour situer la réponse
   (le jeu de valeurs, la question posée…). */
(function (global) {
  'use strict';

  function asList(value) {
    if (value == null) return [];
    return (Array.isArray(value) ? value : [value]).filter(function (v) {
      return v != null && String(v).trim() !== '';
    });
  }

  function fieldsFor(data) {
    var fields = [];
    var type = data.type;

    if (type === 'ecrire') {
      fields.push({
        id: 'algorithme',
        label: 'Votre algorithme',
        hint: 'En pseudo-code : Entrée / Sortie, Début … Fin, ← pour l\'affectation.',
        kind: 'pseudo',
        prompt: "L'algorithme rédigé par l'étudiant."
      });
      return fields;
    }

    if (type === 'traduire') {
      fields.push({
        id: 'python',
        label: 'Votre programme Python',
        hint: 'Respectez l\'indentation : elle fait partie du langage.',
        kind: 'code',
        prompt: "La traduction Python proposée par l'étudiant."
      });
      return fields;
    }

    if (type === 'derouler') {
      asList(data.cas).forEach(function (cas, i) {
        fields.push({
          id: 'cas-' + i,
          label: cas,
          hint: i === 0 ? "Ce que l'algorithme renvoie (ou affiche) pour ce jeu de valeurs." : '',
          kind: 'court',
          prompt: 'Résultat de l\'algorithme pour : ' + cas
        });
      });
    }

    asList(data.questions).forEach(function (question, i) {
      fields.push({
        id: 'q-' + i,
        label: question,
        kind: 'court',
        prompt: 'Question : ' + question
      });
    });

    /* Un exercice sans jeux de valeurs ni questions reste utilisable. */
    if (!fields.length) {
      fields.push({
        id: 'reponse',
        label: 'Votre réponse',
        kind: 'court',
        prompt: "La réponse de l'étudiant à l'exercice."
      });
    }
    return fields;
  }

  global.Answers = { fieldsFor: fieldsFor };
})(window);
