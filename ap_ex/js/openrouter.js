/* Client OpenRouter : appel du modèle et extraction de l'objet JSON produit. */
(function (global) {
  'use strict';

  var ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

  function headers(settings) {
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + settings.apiKey
    };
  }

  function describeError(status, payload) {
    var msg = '';
    if (payload && payload.error) {
      msg = payload.error.message || payload.error.code || '';
    }
    if (!msg && payload && payload.message) msg = payload.message;

    if (status === 401) return "Clé API refusée (401). Vérifiez la clé dans les paramètres." + (msg ? ' — ' + msg : '');
    if (status === 402) return "Crédit OpenRouter insuffisant (402)." + (msg ? ' — ' + msg : '');
    if (status === 404) return "Modèle introuvable (404). Vérifiez son identifiant exact." + (msg ? ' — ' + msg : '');
    if (status === 429) return "Trop de requêtes (429). Patientez quelques instants." + (msg ? ' — ' + msg : '');
    return 'Erreur ' + status + (msg ? ' — ' + msg : '');
  }

  /* Le modèle peut envelopper le JSON dans du texte ou un bloc Markdown. */
  function extractJSON(text) {
    if (!text) throw new Error('Réponse vide du modèle.');
    var body = String(text).trim();

    var fence = body.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) body = fence[1].trim();

    try {
      return JSON.parse(body);
    } catch (e) { /* on tente une extraction plus tolérante */ }

    var start = body.indexOf('{');
    var end = body.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(body.slice(start, end + 1));
      } catch (e2) { /* échec définitif */ }
    }
    throw new Error("La réponse du modèle n'est pas un JSON exploitable.");
  }

  function post(settings, body, signal) {
    return fetch(ENDPOINT, {
      method: 'POST',
      headers: headers(settings),
      body: JSON.stringify(body),
      signal: signal
    }).then(function (res) {
      return res.text().then(function (raw) {
        var payload = null;
        try { payload = raw ? JSON.parse(raw) : null; } catch (e) { /* réponse non JSON */ }
        if (!res.ok) {
          var err = new Error(describeError(res.status, payload));
          err.status = res.status;
          err.payload = payload;
          throw err;
        }
        if (!payload) throw new Error('Réponse illisible du serveur.');
        return payload;
      });
    });
  }

  function completion(settings, messages, options, signal) {
    options = options || {};
    // Sur les modèles à raisonnement (beaucoup de gratuits en sont), les tokens de
    // réflexion sont décomptés de max_tokens : voir large, sinon le JSON est tronqué.
    var base = {
      model: settings.model,
      messages: messages,
      temperature: typeof settings.temperature === 'number' ? settings.temperature : 0.9,
      max_tokens: options.maxTokens || 4000
    };

    var withFormat = Object.assign({}, base, { response_format: { type: 'json_object' } });

    return post(settings, withFormat, signal).catch(function (err) {
      // Tous les modèles n'acceptent pas response_format : on retente sans.
      if (err.name === 'AbortError') throw err;
      if (err.status === 400 || err.status === 422) return post(settings, base, signal);
      throw err;
    });
  }

  function contentOf(payload) {
    var choice = payload && payload.choices && payload.choices[0];
    var message = choice && choice.message;
    if (!message) throw new Error('Le modèle n\'a rien renvoyé.');

    var text = '';
    if (typeof message.content === 'string') {
      text = message.content;
    } else if (Array.isArray(message.content)) {
      // certains modèles renvoient une liste de blocs
      text = message.content.map(function (b) { return b && b.text ? b.text : ''; }).join('');
    }

    if (!text.trim() && choice.finish_reason === 'length') {
      var cut = new Error("Réponse coupée avant la fin : ce modèle consomme tout le budget de " +
        "tokens en réflexion. Essayez un autre modèle (par ex. google/gemma-4-26b-a4b-it:free).");
      cut.truncated = true;
      throw cut;
    }
    if (!text.trim()) {
      throw new Error("Le modèle a renvoyé une réponse vide" +
        (choice.finish_reason ? ' (' + choice.finish_reason + ')' : '') + '.');
    }
    return text;
  }

  /* Envoie des messages et renvoie l'objet JSON produit par le modèle.
     Utilisé aussi bien pour générer un exercice que pour corriger une réponse. */
  function askJSON(settings, messages, options, signal) {
    if (!settings.apiKey) return Promise.reject(new Error('Aucune clé API enregistrée.'));
    if (!settings.model) return Promise.reject(new Error('Aucun modèle indiqué.'));

    return completion(settings, messages, options, signal).then(function (payload) {
      var choice = payload.choices && payload.choices[0];
      try {
        return extractJSON(contentOf(payload));
      } catch (err) {
        if (!err.truncated && choice && choice.finish_reason === 'length') {
          throw new Error("Réponse tronquée par la limite de tokens : le JSON est incomplet. " +
            'Réessayez, ou choisissez un modèle moins bavard.');
        }
        throw err;
      }
    });
  }

  /* Génère un exercice. params : { type, domain, notions, level, avoid, seed } */
  function generate(settings, params, signal) {
    return askJSON(settings, Prompts.build(params), {}, signal).then(function (data) {
      data.type = params.type;
      return data;
    });
  }

  /* Vérification rapide de la clé et du modèle. */
  function test(settings, signal) {
    return completion(
      settings,
      [{ role: 'user', content: 'Réponds exactement par le JSON {"ok": true} et rien d\'autre.' }],
      { maxTokens: 40 },
      signal
    ).then(function (payload) {
      contentOf(payload);
      return true;
    });
  }

  global.OpenRouter = {
    generate: generate,
    askJSON: askJSON,
    test: test,
    extractJSON: extractJSON
  };
})(window);
