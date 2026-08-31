// llmView.js
import { model } from './model.js';
import { historyView } from './historyView.js';
import { prompts } from './prompts.js';
import { callOpenRouter, fetchModels, DEFAULT_MODEL } from './openrouter.js';

export const llmView = {
    isOpen: false,
    conversationHistory: [],

    init() {
        const toggleBtn = document.getElementById('toggle-llm-btn');
        const btnDescription = document.getElementById('llm-btn-description');
        const btnEtape       = document.getElementById('llm-btn-etape');
        const modeSelect = document.getElementById('llm-mode');
        const valWrapper = document.getElementById('llm-btn-validation-wrapper');

        modeSelect?.addEventListener('change', () => this.updateModeUI());
        toggleBtn?.addEventListener('click', () => this.toggle());
        btnDescription?.addEventListener('click', () => this.sendDescription());
        btnEtape?.addEventListener('click',       () => this.sendEtape());
        valWrapper?.addEventListener('click', () => this.handleValidationCycle());

        this.updateModeUI();
        this.populateModels();

        // Le mode LLM n'est accessible que si l'URL se termine par #llm.
        const applyLlmVisibility = () => {
            const enabled = window.location.hash.toLowerCase() === '#llm';
            if (toggleBtn) toggleBtn.style.display = enabled ? '' : 'none';
            // Si on désactive alors que le panneau LLM est ouvert, on revient à l'historique.
            if (!enabled && this.isOpen) this.toggle();
        };
        applyLlmVisibility();
        window.addEventListener('hashchange', applyLlmVisibility);
    },

    // Remplit la liste d'autocomplétion avec les modèles GRATUITS d'OpenRouter.
    async populateModels() {
        const datalist = document.getElementById('llm-model-list');
        const input = document.getElementById('llm-model');
        if (!datalist) return;
        try {
            const models = await fetchModels();
            if (!models.length) return;

            // Modèle gratuit = prix prompt et complétion à 0.
            const isFree = m => {
                const p = m.pricing || {};
                return Number(p.prompt) === 0 && Number(p.completion) === 0;
            };
            const free = models
                .filter(isFree)
                .sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));
            const list = free.length ? free : models;

            datalist.innerHTML = '';
            for (const m of list) {
                const opt = document.createElement('option');
                opt.value = m.id;
                opt.textContent = m.name || m.id;
                datalist.appendChild(opt);
            }

            // Si le modèle par défaut n'est pas disponible, prendre le premier gratuit.
            if (input && input.value === DEFAULT_MODEL && !list.some(m => m.id === DEFAULT_MODEL)) {
                input.value = list[0].id;
            }
        } catch (e) {
            // On garde les options de repli définies dans le HTML.
            console.warn('Could not load OpenRouter model list:', e.message);
        }
    },

    toggle() {
        this.isOpen = !this.isOpen;
        const panelHistory = document.getElementById('panel-history');
        const panelLlm     = document.getElementById('panel-llm');
        const title        = document.getElementById('history-title');
        const icon         = document.getElementById('history-icon');
        const btn          = document.getElementById('toggle-llm-btn');

        if (this.isOpen) {
            panelHistory?.classList.add('hidden');
            panelLlm?.classList.remove('hidden');
            if (title) title.textContent = 'Assistant LLM';
            if (icon)  icon.textContent  = '';
            if (btn) {
                btn.classList.add('llm-active');
                btn.title       = "Back to history";
                btn.textContent = '📜 Switch to manual-mode';
            }
        } else {
            panelLlm?.classList.add('hidden');
            panelHistory?.classList.remove('hidden');
            if (title) title.textContent = 'Historique des actions';
            if (icon)  icon.textContent  = '📜';
            if (btn) {
                btn.classList.remove('llm-active');
                btn.title       = 'Test with the LLM';
                btn.textContent = '🤖 Switch to LLM-mode';
            }
        }
    },

    // ── Bouton 1 : Description ──────────────────────────────────────────────
    sendDescription() {
        // Réinitialise la conversation
        this.conversationHistory = [];
        const messagesContainer = document.getElementById('llm-messages');
        if (messagesContainer) messagesContainer.innerHTML = '';

        document.getElementById('reset')?.click();

        const target = model.rule?.targetState || Array(9).fill(0);
        const description = model.rule?.description || '';
        const initial = model.rule?.initialState || Array(9).fill(0);

        const text = prompts.initGame({ target, description, initial });


        // Enregistre dans l'historique du modèle
        model.globalActions.push({
            type: 'llm-description',
            timestamp: new Date().toLocaleTimeString(),
        });
        historyView.update();

        this._send(text);
    },

    async handleValidationCycle() {
        const questions = model.rule.validationQuestions;
        const btn = document.getElementById('llm-btn-validation-wrapper');

        if (this.validationStep === 0) {
            await this.startValidationFlow();
            this.validationStep = 1;
            this.correctAnswersCount = 0;
            btn.textContent = `Send Question 1 / ${questions.length}`;
            btn.style.backgroundColor = "#28a745";
            return;
        }

        if (btn.textContent.includes("Send")) {
            this.currentQuestion = questions[this.validationStep - 1];

            const qText = prompts.validationQuestion({
                index:        this.validationStep,
                initialState: this.currentQuestion.initialState,
                clickButton:  this.currentQuestion.clickButton,
            });

            await this._send(qText);

            btn.textContent = `Check Answer ${this.validationStep}`;
            btn.style.backgroundColor = "#ffc107"; // Orange while awaiting verification
            return;
        }

        if (btn.textContent.includes("Check")) {
            const lastReply = this.conversationHistory[this.conversationHistory.length - 1].content;


            const normalized = lastReply.replace(/■/g, '1').replace(/□/g, '0');
            // Dernier tableau trouvé : la réponse finale, pas un essai intermédiaire.
            const match = [...normalized.matchAll(/\[([01,\s,]+)\]/g)].at(-1);

            let isCorrect = false;
            if (match) {
                const llmAnswer = match[1].trim().split(/[\s,]+/).map(n => parseInt(n));
                // Comparaison à l'état obtenu en appliquant la règle (pas expectedState).
                const expected = model.rule.predict(
                    this.currentQuestion.initialState,
                    this.currentQuestion.clickButton,
                    this.currentQuestion.historique,
                );
                isCorrect = JSON.stringify(llmAnswer) === JSON.stringify(expected);
            }

            if (isCorrect) this.correctAnswersCount++;

            const feedback = isCorrect ? prompts.validationCorrect() : prompts.validationIncorrect();
            this.appendMessage('user', feedback);
            this.conversationHistory.push({ role: 'user', content: feedback });

            if (this.validationStep < questions.length) {

                this.validationStep++;
                btn.textContent = `Send Question ${this.validationStep} / ${questions.length}`;
                btn.style.backgroundColor = "#28a745";
            } else {
                const scoreMsg = prompts.validationFinalScore({
                    score: this.correctAnswersCount,
                    total: questions.length,
                });
                this.appendMessage('assistant', scoreMsg);

                model.globalActions.push({
                    type: 'llm-validation-end',
                    timestamp: new Date().toLocaleTimeString(),
                    score: `${this.correctAnswersCount}/${questions.length}`,
                    button: null,
                    stateBefore: [],
                    stateAfter: [],
                    result: this.correctAnswersCount === questions.length ? 'PASSED' : 'FAILED',
                });

                historyView.update();

                btn.style.display = 'none';
                btn.textContent = "";

                this.validationStep = 0;
                this.currentQuestion = null;
                this.correctAnswersCount = 0;
            }
        }
    },

    async sendEtape() {

        const btnValidation = document.getElementById('llm-btn-validation-wrapper');
        const lastReply = this.conversationHistory.length
            ? this.conversationHistory[this.conversationHistory.length - 1].content.trim().toLowerCase()
            : '';


        if (lastReply.includes('terminer')) {
            if (this.isTargetReached()) {
                await this._sendAndLogRule(prompts.askRuleManual());

                if (btnValidation) {
                    btnValidation.style.display = 'block';
                    btnValidation.textContent = "🏁 Start validation";
                    btnValidation.style.backgroundColor = "#28a745";

                    this.validationStep = 0;
                }
            } else {
                this._send(prompts.notYetReached());
            }
            return;
        }

        const lastAction = [...model.globalActions]
            .reverse()
            .find(a => a.button !== undefined || a.type === 'clear' || a.type === 'load');

        let promptText;

        if (!lastAction) {
            promptText = prompts.feedbackNoAction();
        } else if (lastAction.type === 'clear' || lastAction.type === 'load') {
            promptText = prompts.feedbackReset();
        } else {
            promptText = prompts.feedbackEtape({
                button:      lastAction.button,
                stateBefore: lastAction.stateBefore,
                stateAfter:  lastAction.stateAfter,
            });

            model.globalActions.push({
                type: 'llm-etape',
                timestamp: new Date().toLocaleTimeString(),
                actionRef: lastAction.button,
            });
            historyView.update();
        }

        this._send(promptText);
    },

    // ── Envoi avec log de la règle dans l'historique ─────────────────────────
    // Utilisé uniquement pour askRuleManual — attend la réponse et la logue.
    async _sendAndLogRule(text) {
        const apiKey  = document.getElementById('llm-api-key').value.trim();
        const modelId = document.getElementById('llm-model').value.trim() || DEFAULT_MODEL;

        if (!apiKey) {
            this.appendMessage('error', '⚠ Enter your OpenRouter API key to continue.');
            return;
        }

        this.appendMessage('user', text);
        this.conversationHistory.push({ role: 'user', content: text });

        const typingId = this.appendMessage('assistant', '…', true);

        try {
            const reply = await callOpenRouter({
                apiKey,
                model: modelId,
                messages: [
                    { role: 'system', content: this.buildSystemPrompt() },
                    ...this.conversationHistory,
                ],
                // No max_tokens cap: reasoning models need room to think before answering.
                temperature: 0.7,
            }) || '(no response)';

            this.removeMessage(typingId);
            this.appendMessage('assistant', reply);
            this.conversationHistory.push({ role: 'assistant', content: reply });

            // Logue la réponse dans l'historique global
            model.globalActions.push({
                type: 'llm-rule-explanation',
                reply,
                timestamp: new Date().toLocaleTimeString(),
            });
            historyView.update();

        } catch (e) {
            this.removeMessage(typingId);
            this.appendMessage('error', '⚠ Erreur : ' + e.message);
        }
    },

    // ── Envoi commun ─────────────────────────────────────────────────────────
    async _send(text) {
        const apiKey  = document.getElementById('llm-api-key').value.trim();
        const modelId = document.getElementById('llm-model').value.trim() || DEFAULT_MODEL;

        if (!apiKey) {
            this.appendMessage('error', '⚠ Enter your OpenRouter API key to continue.');
            return;
        }

        this.appendMessage('user', text);
        this.conversationHistory.push({ role: 'user', content: text });

        const typingId = this.appendMessage('assistant', '…', true);

        try {
            const reply = await callOpenRouter({
                apiKey,
                model: modelId,
                messages: [
                    { role: 'system', content: this.buildSystemPrompt() },
                    ...this.conversationHistory
                ],
                // No max_tokens cap: reasoning models need room to think before answering.
                temperature: 0.7,
            }) || '(no response)';

            this.removeMessage(typingId);
            this.appendMessage('assistant', reply);
            this.conversationHistory.push({ role: 'assistant', content: reply });

        } catch (e) {
            this.removeMessage(typingId);
            this.appendMessage('error', '⚠ Erreur : ' + e.message);
        }
    },

    buildSystemPrompt() {
        return prompts.systemManual();
    },

    appendMessage(role, text, isTyping = false) {
        const container = document.getElementById('llm-messages');
        const div = document.createElement('div');
        const id  = 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2);
        div.id    = id;
        div.classList.add('llm-msg', `llm-msg-${role}`);
        if (isTyping) div.classList.add('llm-typing');
        div.textContent = text;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
        return id;
    },

    removeMessage(id) {
        document.getElementById(id)?.remove();
    },
    isTargetReached() {
        const target = model.rule?.targetState || Array(9).fill(false);

        // Cherche la dernière action ayant un stateAfter
        for (let i = model.globalActions.length - 1; i >= 0; i--) {
            const action = model.globalActions[i];

            if (Array.isArray(action.stateAfter)) {
                return action.stateAfter.every((v, idx) => v === target[idx]);
            }

            // Si l'action est "victory", on considère que la cible est atteinte
            if (action.type === 'victory') {
                return true;
            }
        }

        return false; // aucun état correspondant trouvé
    },

    updateModeUI() {
        const mode = document.getElementById('llm-mode')?.value;

        const autoControls = document.getElementById('auto-mode-controls');
        const btnDesc = document.getElementById('llm-btn-description');
        const btnEtape = document.getElementById('llm-btn-etape');

        if (mode === 'auto') {
            if (autoControls) autoControls.style.display = 'flex';
            if (btnDesc) btnDesc.style.display = 'none';
            if (btnEtape) btnEtape.style.display = 'none';
        } else {
            if (autoControls) autoControls.style.display = 'none';
            if (btnDesc) btnDesc.style.display = 'block';
            if (btnEtape) btnEtape.style.display = 'block';
        }
    },

    async startValidationFlow() {
        // On rappelle explicitement que la règle est la MÊME
        const introVal = prompts.validationIntroManual();

        this.appendMessage('user', introVal);
        this.conversationHistory.push({ role: 'user', content: introVal });

        // Affichage de la modale de 3 secondes
        const modal = document.getElementById('auto-victory-modal');
        if (modal) {
            modal.innerHTML = `
            <div class="modal-content" style="border: 2px solid #28a745;">
                <h2>🎯 Rule Analysis</h2>
                <p>The objective is reached. The LLM will now prove that it understood the logic.</p>
            </div>
        `;
            modal.classList.remove('hidden');
            await new Promise(r => setTimeout(r, 3000));
            modal.classList.add('hidden');
        }

        await model.setValidation();
    }
};