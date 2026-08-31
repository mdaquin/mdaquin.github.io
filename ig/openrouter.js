// openrouter.js — Appel centralisé à l'API OpenRouter
//
// Un seul endroit qui construit la requête, gère les erreurs HTTP et
// extrait la réponse. Tous les modules (llmView, autoMode) passent par ici.

export const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Modèle gratuit utilisé par défaut (corrigé au besoin par populateModels
// si cet identifiant n'est pas présent dans la liste renvoyée par OpenRouter).
export const DEFAULT_MODEL = 'meta-llama/llama-3.3-70b-instruct:free';

// Trace complète des échanges LLM de la session (system / user / réponse brute).
// Alimentée à chaque appel réussi de callOpenRouter, lue par la modale de trace.
export const llmTrace = [];

/**
 * Envoie une conversation à OpenRouter et renvoie le texte de la réponse.
 *
 * @param {Object} p
 * @param {string} p.apiKey       Clé API OpenRouter.
 * @param {string} p.model        Identifiant du modèle (ex: openai/gpt-4o-mini).
 * @param {Array}  p.messages     Messages au format Chat Completions.
 * @param {number} [p.maxTokens]  Limite de tokens (omise si non fournie).
 * @param {number} [p.temperature]
 * @returns {Promise<string>}     Contenu de la réponse (chaîne, éventuellement vide).
 * @throws {Error}                Si la requête échoue (message d'erreur de l'API si disponible).
 */
export async function callOpenRouter({ apiKey, model, messages, maxTokens, temperature }) {
    const body = { model, messages };
    if (maxTokens != null)    body.max_tokens  = maxTokens;
    if (temperature != null)  body.temperature = temperature;

    const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer':  window.location.href,
            'X-Title':       'Reasoning Experiment',
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Erreur ${res.status}`);
    }

    const data = await res.json();
    const msg = data.choices?.[0]?.message ?? {};
    const rawContent = msg.content ?? '';

    // Certains modèles renvoient le raisonnement séparément (champ `reasoning`),
    // d'autres l'intègrent dans le contenu via des balises <think>…</think>.
    // On isole le raisonnement et on ne renvoie que la réponse finale, pour
    // que le parsing des actions ne s'appuie jamais sur la chaîne de pensée.
    const reasoning = msg.reasoning ?? extractInlineReasoning(rawContent);
    const answer = stripReasoning(rawContent);

    llmTrace.push({
        timestamp:  new Date().toLocaleTimeString(),
        model,
        system:     messages.find(m => m.role === 'system')?.content ?? null,
        userPrompt: [...messages].reverse().find(m => m.role === 'user')?.content ?? null,
        reasoning:  reasoning || null,
        rawResponse: rawContent,
        response:   answer,
    });

    return answer;
}

// Retire les blocs de raisonnement (<think>/<thinking>/<reasoning>) du texte,
// y compris un bloc ouvert mais jamais refermé.
function stripReasoning(text) {
    if (!text) return '';
    let out = String(text).replace(/<(think|thinking|reasoning)>[\s\S]*?<\/\1>/gi, '');
    out = out.replace(/<(think|thinking|reasoning)>[\s\S]*$/i, '');
    return out.trim();
}

// Extrait le contenu des blocs de raisonnement fermés, pour l'affichage dans la trace.
function extractInlineReasoning(text) {
    if (!text) return null;
    const parts = [];
    const re = /<(think|thinking|reasoning)>([\s\S]*?)<\/\1>/gi;
    let m;
    while ((m = re.exec(text)) !== null) parts.push(m[2].trim());
    return parts.length ? parts.join('\n\n') : null;
}

/**
 * Récupère la liste publique des modèles disponibles sur OpenRouter.
 * Ne nécessite pas de clé API.
 *
 * @returns {Promise<Array<{id: string, name?: string}>>}
 * @throws {Error} Si la requête échoue.
 */
export async function fetchModels() {
    const res = await fetch('https://openrouter.ai/api/v1/models');
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    const data = await res.json();
    return Array.isArray(data.data) ? data.data : [];
}
