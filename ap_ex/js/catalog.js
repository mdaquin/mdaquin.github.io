/* Catalogue : notions d'algorithmique et types d'exercice. */
(function (global) {
  'use strict';

  /* Notions dans l'ordre de progression du cours.
     Les libellés servent de clé (formulaire enregistré, index de la banque) :
     en ajouter est sans conséquence, en renommer un casserait l'existant. */
  var NOTIONS = [
    // séance 1
    { id: 'variables',    label: 'variables et affectation', default: true },
    { id: 'arithmetique', label: 'opérations arithmétiques' },
    { id: 'conditionnelle', label: 'conditionnelle (Si / Sinon)', default: true },
    { id: 'boucle-bornee', label: 'boucle bornée (Pour)', default: true },
    { id: 'boucle-non-bornee', label: 'boucle non bornée (Tant que)' },
    { id: 'logique',      label: 'opérateurs logiques (ET, OU, NON)' },
    { id: 'boucles-imbriquees', label: 'boucles imbriquées' },
    // séance 2
    { id: 'entrees-sorties', label: 'entrées / sorties' },
    { id: 'types',        label: 'types de valeurs et conversions' },
    { id: 'listes',       label: 'listes / tableaux' },
    { id: 'parcours-liste', label: 'parcours d\'une liste' },
    { id: 'matrices',     label: 'listes de listes (matrices)' },
    { id: 'chaines',      label: 'chaînes de caractères' },
    { id: 'dictionnaires', label: 'dictionnaires' },
    { id: 'fonctions',    label: 'fonctions' },
    // séance 3
    { id: 'recursivite',  label: 'récursivité' },
    { id: 'recherche',    label: 'recherche dans une liste' },
    { id: 'tri',          label: 'tri d\'une liste' },
    { id: 'files',        label: 'files (FIFO)' },
    { id: 'piles',        label: 'piles (LIFO)' },
    { id: 'arbres',       label: 'arbres' },
    { id: 'graphes',      label: 'graphes' },
    { id: 'parcours',     label: 'parcours en largeur / en profondeur' },
    // séance 4
    { id: 'classes',      label: 'classes et objets' },
    { id: 'heritage',     label: 'héritage entre classes' },
    { id: 'modules',      label: 'modules et bibliothèques' },
    { id: 'complexite',   label: 'complexité algorithmique' }
  ];

  /* Types d'exercice. `accent` pilote la couleur de la carte. */
  var TYPES = [
    {
      id: 'ecrire',
      name: "Écrire l'algorithme",
      desc: "Un problème est posé, l'étudiant rédige l'algorithme en pseudo-code.",
      tag: 'Écrire',
      accent: 'mint',
      icon: '<path d="M4 19.5 5 16l9.5-9.5a2 2 0 0 1 2.8 0l.2.2a2 2 0 0 1 0 2.8L8 19l-4 .5z"/><path d="M13 7.5 16.5 11"/>'
    },
    {
      id: 'derouler',
      name: "Dérouler l'algorithme",
      desc: "Un algorithme est fourni, l'étudiant donne le résultat pour des valeurs d'entrée.",
      tag: 'Dérouler',
      accent: 'apricot',
      icon: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h5M8 13h8M8 17h3"/>'
    },
    {
      id: 'traduire',
      name: "Traduire en Python",
      desc: "Un algorithme est fourni, l'étudiant écrit le programme Python correspondant.",
      tag: 'Traduire',
      accent: 'lilac',
      icon: '<path d="M9 6 4.5 12 9 18"/><path d="M15 6l4.5 6L15 18"/>'
    },
    {
      id: 'lire',
      name: "Lire un programme Python",
      desc: "Un programme est fourni, l'étudiant en donne le résultat ou l'affichage.",
      tag: 'Lire',
      accent: 'sky',
      icon: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.6"/>'
    }
  ];

  function typeById(id) {
    for (var i = 0; i < TYPES.length; i++) if (TYPES[i].id === id) return TYPES[i];
    return null;
  }

  global.Catalog = { NOTIONS: NOTIONS, TYPES: TYPES, typeById: typeById };
})(window);
