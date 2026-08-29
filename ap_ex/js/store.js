/* Stockage local : réglages du modèle, dernier formulaire, bibliothèque d'exercices. */
(function (global) {
  'use strict';

  var KEYS = {
    settings: 'apex.settings',
    check: 'apex.check',
    form: 'apex.form'
  };

  var DEFAULT_MODEL = 'google/gemma-4-26b-a4b-it:free';

  var DEFAULT_SETTINGS = {
    apiKey: '',
    model: DEFAULT_MODEL,
    temperature: 0.9
  };

  /* La correction gagne à être peu créative, d'où une température basse. */
  var DEFAULT_CHECK_TEMPERATURE = 0.2;

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  var Store = {
    DEFAULT_MODEL: DEFAULT_MODEL,

    getSettings: function () {
      var s = read(KEYS.settings, {}) || {};
      return {
        apiKey: typeof s.apiKey === 'string' ? s.apiKey : DEFAULT_SETTINGS.apiKey,
        model: s.model || DEFAULT_SETTINGS.model,
        temperature: typeof s.temperature === 'number' ? s.temperature : DEFAULT_SETTINGS.temperature
      };
    },

    saveSettings: function (settings) {
      return write(KEYS.settings, settings);
    },

    /* Réglages de la correction : indépendants de ceux de la génération, mais
       initialisés dessus tant que rien n'a été enregistré — la plupart du temps
       c'est la même clé. */
    getCheckSettings: function () {
      var s = read(KEYS.check, null);
      if (!s) {
        var gen = Store.getSettings();
        return {
          apiKey: gen.apiKey,
          model: gen.model,
          temperature: DEFAULT_CHECK_TEMPERATURE,
          inherited: true
        };
      }
      return {
        apiKey: typeof s.apiKey === 'string' ? s.apiKey : '',
        model: s.model || DEFAULT_MODEL,
        temperature: typeof s.temperature === 'number' ? s.temperature : DEFAULT_CHECK_TEMPERATURE,
        inherited: false
      };
    },

    saveCheckSettings: function (settings) {
      return write(KEYS.check, {
        apiKey: settings.apiKey,
        model: settings.model,
        temperature: settings.temperature
      });
    },

    getForm: function () {
      return read(KEYS.form, null);
    },

    saveForm: function (form) {
      return write(KEYS.form, form);
    }
  };

  global.Store = Store;
})(window);
