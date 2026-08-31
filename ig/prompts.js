/**
 * prompts.js — Textes centralisés envoyés au LLM via OpenRouter
 *
 * Modifier ici pour ajuster les instructions sans toucher à la logique.
 * Toutes les fonctions reçoivent un objet de paramètres pour l'interpolation.
 */

export const prompts = {

    // ─────────────────────────────────────────────────────────────────────────
    // SYSTEM PROMPTS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Prompt système commun (autoMode et llmView en mode manuel).
     * @param {{ maxSteps: number }} p
     */
    systemAuto: ({ maxSteps }) =>
        `You are a reasoning agent playing a game based on a set of 9 buttons (numbered from 1 to 9) organised in a 3x3 grid (1 2 3 / 4 5 6 / 7 8 9). 
         Each button can be either ON (■) or OFF (□). 
         For convenience, the state of the nine buttons will be represented as a list (from button 1 to button 9). For example, [□ □ □ □ □ □ □ □ □] is the state where all buttons are OFF, and [■ □ ■ □ ■ □ ■ □ ■] is the state where buttons 1, 3, 5, 7, and 9 are ON while the others are OFF.
         Pressing a button changes the state of certain buttons according to a fixed but unknown rule. 
         An additional CLEAR button resets all buttons back to the initial state of the game without counting as an action.

         At the beginning of the game, you are given an initial state (the current state of the buttons) and a target state (e.g. [■ □ ■ □ ■ □ ■ □ ■]) which corresponds to the objective.

         You therefore need to figure out the hidden rule that determines which buttons are affected by each button press, so you can reach the target state from the given initial state.
         
         You can press buttons one at a time (using the command "ACTION: <button number>"), and after each button press, you will receive feedback on the new state of the buttons.

         Once you reach the target state, you will be asked to explain the rule you have identified. After that, you will enter a validation phase where you will be given hypothetical situations and must predict the resulting state using the same rule.


        IMPORTANT: 
           - During the game, only respond with one of the following formats:
             - To press a button: ACTION: N  (e.g., ACTION: 5)
             - To reset all buttons: CLEAR
             - If you give up (too difficult or too long): ABANDON: reason
           - During the validation phase, only respond with a 9 button state array (e.g., [■ □ ■ □ ■ □ ■ □ ■]).
           - Only when asked to explain the rule, you can provide a one-sentence explanation of the rule you have identified.

        Unless explicitly asked, do not write anything else than those commands. No explanations, no extra text. If you don't know what to do, test a button with ACTION: N to gather more information. You can perform up to ${maxSteps} actions in total. 
    `,
    /**
     * Prompt système pour le mode manuel (llmView).
     * Pas utilisé comme mode manuel supprimé. 
     */
    systemManual: () =>
        `Tu es un assistant d'analyse logique spécialisé dans les puzzles de boutons.
- Il y a 9 boutons numérotés de 1 à 9 (3x3: 1 2 3 / 4 5 6 / 7 8 9), chacun allumé (■) ou éteint (□).
- Un bouton CLEAR remet tous les boutons à [□ □ □ □ □ □ □ □ □] instantanément sans compter comme action.

IMPORTANT :
- Tu ne dois répondre **que par le numéro du bouton à appuyer (1 à 9), RESET ou "Terminer" si l'objectif est atteint**.
- Ne jamais ajouter d'explications, commentaires ou phrases supplémentaires.
- **Exception :** uniquement si l'utilisateur te demande explicitement de lui donner la règle qui cachait les boutons, tu peux alors expliquer avec des phrases.
- Si l'utilisateur te corrige ou te remet sur la bonne voie, continue simplement à suivre ces instructions.
- Toujours répondre en français, de manière concise et directe, **une seule valeur par réponse**.`,


    // ─────────────────────────────────────────────────────────────────────────
    // MESSAGES UTILISATEUR — INITIALISATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Premier message envoyé au LLM pour démarrer une partie.
     * @param {{ target: number[], description: string }} p
     */
    initGame: ({ target, description, initial }) => {
        const targetStr = target.map(v => v ? '■' : '□').join(' ');
        const initialStr = (initial || Array(9).fill(0)).map(v => v ? '■' : '□').join(' ');
        return `You have 9 buttons arranged in a 3x3 grid (1 2 3 / 4 5 6 / 7 8 9). The initial state is: [${initialStr}].
        Your objective is to reach the target state: [${targetStr}], which corresponds to the following description: "${description}".
        Tell me which button you want to press ("ACTION: N", which N between 1 and 9) or if you want to use the CLEAR button. After each button press, I will tell you the new state of the buttons. You can also give up at any time by saying "ABANDON: reason".`
    },

    // ─────────────────────────────────────────────────────────────────────────
    // MESSAGES UTILISATEUR — FEEDBACK EN COURS DE PARTIE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Feedback après un clic sur un bouton.
     * @param {{ button: number, state: number[] }} p
     */
    feedbackClick: ({ button, state }) => {
        const stateStr = state.map(s => s ? '■' : '□').join(' ');
        return `You pressed the button number ${button}, which led to the state: [${stateStr}]. What do you do next? (again, respond only with ACTION: N, CLEAR, or ABANDON: reason)`;
    },

    /**
     * Feedback après un CLEAR.
     */
    feedbackClear: () =>
        `You cleared the state CLEAR, which is therefore [□ □ □ □ □ □ □ □ □]. What do you do next? (again, respond only with ACTION: N, CLEAR, or ABANDON: reason)`,

    /**
     * Message envoyé quand la réponse du LLM est incompréhensible.
     */
    clarificationRequest: () =>
        `I did not understand your response. Please respond only with ACTION: N (where N is a button number 1-9), CLEAR, or ABANDON: reason.`,

    /**
     * Message quand une séquence SOLUTION s'est terminée sans victoire.
     */
    solutionFailed: () =>
        `Solution tested but without success. What do you do now? (again, respond only with ACTION: N, CLEAR, or ABANDON: reason)`,

    /**
     * Feedback en mode manuel quand une action a été effectuée.
     * Plus utilisé.
     * @param {{ button: number, stateBefore: boolean[], stateAfter: boolean[] }} p
     */
    feedbackEtape: ({ button, stateBefore, stateAfter }) => {
        const avant = stateBefore.map(s => s ? '■' : '□').join(' ');
        const apres = stateAfter.map(s => s ? '■' : '□').join(' ');
        return `Bouton ${button} cliqué.
État avant : [${avant}]
État après : [${apres}]
Quelle est ta prochaine analyse ou action ?`;
    },

    /**
     * Message en mode manuel quand la grille a été réinitialisée.
     * Plus utilisé.
     */
    feedbackReset: () =>
        `L'état de la grille a été réinitialisé. Tous les boutons sont éteints : [□ □ □ □ □ □ □ □ □]. Quelle est ta prochaine action ?`,

    /**
     * Message en mode manuel quand aucune action n'a encore été effectuée.
     * Plus utilisé.
     */
    feedbackNoAction: () =>
        `Aucune action effectuée sur la grille. Quel bouton souhaites-tu tester en premier ? (Réponds uniquement par un numéro 1-9, RESET ou "Terminer")`,

    /**
     * Message en mode manuel quand l'objectif n'est pas encore atteint mais le LLM dit "Terminer".
     */
    notYetReached: () =>
        `⚠️ L'objectif n'est pas encore atteint. 
Regarde bien l'état cible. Continue à chercher ou utilise RESET si tu es bloqué.`,

    /**
     * Message en mode manuel quand l'objectif est atteint — demande d'explication de la règle.
     */
    askRuleManual: () =>
        `You have reached the target state! Now, explain in one sentence the rule you have identified.`,

    // ─────────────────────────────────────────────────────────────────────────
    // MESSAGES UTILISATEUR — EXPLICATION DE LA RÈGLE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Demande d'explication de la règle identifiée (mode auto).
     */
    askRuleAuto: () =>
        `You have reached the target state! Now, explain in one sentence the rule you have identified.`,

    // ─────────────────────────────────────────────────────────────────────────
    // MESSAGES UTILISATEUR — PHASE DE VALIDATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Introduction à la phase de validation (mode auto).
     */
    validationIntroAuto: () =>
        `OK, let's move to the validation phase to prove that you have understood the rule. I will give you hypothetical situations, and you must predict the resulting state using the SAME RULE you just identified. This is a test to verify your understanding of the rule.`,

    /**
     * Introduction à la phase de validation (mode manuel).
     */
    validationIntroManual: () =>
        `Bravo, tu as atteint l'objectif ! Tu as maintenant identifié la règle logique de ce test. ` +
        `Passons à la phase de VALIDATION : je vais te donner des situations hypothétiques ` +
        `et tu devras prédire le résultat en utilisant la MÊME RÈGLE que celle que tu viens de trouver. ` +
        `C'est un test pour vérifier que ta compréhension de la règle est parfaite.`,

    /**
     * Message affiché dans la modale de victoire du mode auto avant la validation.
     */
    autoVictoryModal: () =>
        `The objective has been reached. Moving to validation.`,

    /**
     * Message affiché dans la modale de victoire (mode auto, après _step).
     */
    autoVictoryModalStep: () =>
        `OK, let's move to the validation phase to prove that you have understood the rule. I will give you hypothetical situations, and you must predict the resulting state using the SAME RULE you just identified. This is a test to verify your understanding of the rule.`,

    /**
     * Une question de validation.
     * @param {{ index: number, initialState: number[], clickButton: number }} p
     */
    validationQuestion: ({ index, initialState, clickButton }) => {
        const initialStr = initialState.map(v => v ? '■' : '□').join(' ');
        return `QUESTION ${index}: 
If the initial state is [${initialStr}] and you press ${clickButton}, what will be the resulting state? Respond only with a 9 button state array: [□ ■ □ ...]`;
    },

    /**
     * Feedback après une réponse correcte à une question de validation.
     */
    validationCorrect: () => `✅ CORRECT!`,

    /**
     * Feedback après une réponse incorrecte à une question de validation.
     */
    validationIncorrect: () => `❌ INCORRECT.`,

    /**
     * Message quand le format de réponse de validation est non reconnu.
     */
    validationFormatError: () => `I did not understand your response. Please respond only with a 9 button state array: [□ ■ □ ...]`,

    /**
     * Message de fin de validation — succès.
     * @param {{ score: number, total: number }} p
     */
    validationSuccess: ({ score, total }) =>
        `Congratulations! You answered all questions correctly (${score}/${total}).`,

    /**
     * Message de fin de validation — échec.
     * @param {{ score: number, total: number }} p
     */
    validationFailure: ({ score, total }) =>
        `The validation test is over. You scored ${score}/${total}.`,

    /**
     * Score final affiché dans le chat (mode manuel).
     * @param {{ score: number, total: number }} p
     */
    validationFinalScore: ({ score, total }) =>
        `The validation test is over. You scored ${score}/${total}.`,
};