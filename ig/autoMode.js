import { model } from './model.js';
import { view } from './view.js';
import { historyView } from './historyView.js';
import { prompts } from './prompts.js';
import { callOpenRouter, DEFAULT_MODEL } from './openrouter.js';

export const autoMode = {
    running: false,
    _timeoutId: null,
    conversationHistory: [],
    MAX_STEPS: 30, // sécurité anti-boucle infinie
    stepCount: 0,
    isValidationPhase: false,
    currentValidationIndex: 0,
    validationScore: 0,

    init() {
        this._injectUI();
        this._bindEvents();
    },

    _injectUI() {
        const actionsRow = document.getElementById('llm-actions-row');
        if (!actionsRow) return;

        const wrapper = document.createElement('div');
        wrapper.style.display = 'none';
        wrapper.id = 'auto-mode-controls';
        wrapper.innerHTML = `
            <div id="auto-mode-row">
                <button id="llm-btn-auto" title="Start automatic mode" aria-label="Start automatic mode">▶</button>
                <button id="llm-btn-stop" title="Stop automatic mode" aria-label="Stop automatic mode" disabled>■</button>
            </div>
            <div id="auto-delay-row" style="display: none;">
                <label for="auto-delay-slider">Delay between actions:</label>
                <input type="range" id="auto-delay-slider" min="1" max="10" value="1" step="1" />
                <span id="auto-delay-value">1s</span>
            </div>
            <div id="auto-status"></div>
        `;
        actionsRow.after(wrapper);

        // Injection de la modale spécifique au mode Auto
        const autoModal = document.createElement('div');
        autoModal.id = 'auto-victory-modal';
        autoModal.className = 'modal hidden'; // On réutilise la classe modal existante
        autoModal.innerHTML = `
        <div class="modal-content" style="border: 2px solid #007bff;">
            <h2>🎯 Objective Reached!</h2>
            <p id="auto-victory-text"></p>
            <div style="margin-top: 15px; font-style: italic; color: #666;">
                Starting validation in 3s...
            </div>
        </div>
    `;
        document.body.appendChild(autoModal);
    },

    _bindEvents() {
        document.getElementById('llm-btn-auto')?.addEventListener('click', () => this.start());
        document.getElementById('llm-btn-stop')?.addEventListener('click', () => this.stop('Stopped by the user.'));

        const slider = document.getElementById('auto-delay-slider');
        const label  = document.getElementById('auto-delay-value');
        slider?.addEventListener('input', () => {
            label.textContent = `${slider.value}s`;
        });
    },

    _getDelay() {
        // Delay is fixed at 1 second between turns (slider hidden).
        return 1000;
    },

    _setStatus(text, type = 'info') {
        const el = document.getElementById('auto-status');
        if (!el) return;
        // Only surface error messages; suppress transient progress updates
        // (e.g. "Next action in 1s", "analysing…", success/stopped notices).
        if (type === 'error') {
            el.textContent = text;
            el.className = `auto-status-${type}`;
        } else {
            el.textContent = '';
            el.className = '';
        }
    },

    _setRunning(running) {
        this.running = running;
        const btnAuto = document.getElementById('llm-btn-auto');
        const btnStop = document.getElementById('llm-btn-stop');
        const slider  = document.getElementById('auto-delay-slider');

        if (btnAuto)  btnAuto.disabled  = running;
        if (btnStop)  btnStop.disabled  = !running;
        if (slider)   slider.disabled   = running;
    },

    async start() {
        const mode = document.getElementById('llm-mode')?.value;
        if (mode !== 'auto') {
            this._setStatus('⚠️ Switch to automatic mode to start.', 'error');
            return;
        }

        const apiKey = document.getElementById('llm-api-key')?.value.trim();
        if (!apiKey) {
            this._setStatus('🔑 Enter your OpenRouter API key.', 'error');
            return;
        }

        const modelId = document.getElementById('llm-model')?.value.trim() || DEFAULT_MODEL;

        this.conversationHistory = [];
        this.stepCount = 0;
        this.isValidationPhase = false;
        this._setRunning(true);

        const messagesContainer = document.getElementById('llm-messages');
        if (messagesContainer) messagesContainer.innerHTML = '';
        document.getElementById('reset')?.click();

        model.globalActions.push({
            type: 'auto-start',
            model: modelId,
            timestamp: new Date().toLocaleTimeString(),
        });
        historyView.update();

        const target = model.rule?.targetState || Array(9).fill(0);
        const description = model.rule?.description || '';
        const initial = model.rule?.initialState || Array(9).fill(0);

        const initText = prompts.initGame({ target, description, initial });
        this._appendMessage('user', initText);
        this.conversationHistory.push({ role: 'user', content: initText });

        this._setStatus('🤖 The LLM is analysing the problem…', 'running');
        await this._step();
    },

    async _step() {
        if (!this.running) return;

        if (this.isValidationPhase) {
            await this._handleValidationStep();
            return;
        }

        if (this.stepCount >= this.MAX_STEPS) {
            //this.stop(`Limite de ${this.MAX_STEPS} actions atteinte.`);
                const reason = `Limit of ${this.MAX_STEPS} actions reached.`;
                model.globalActions.push({
                    type: 'llm-abandon',
                    reason,
                    timestamp: new Date().toLocaleTimeString(),
                });
                historyView.update();
                this.stop(reason);
            return;
        }

        this.stepCount++;
        const apiKey  = document.getElementById('llm-api-key')?.value.trim();
        const modelId = document.getElementById('llm-model')?.value.trim() || DEFAULT_MODEL;

        const typingId = this._appendMessage('assistant', '...', true);

        try {
            const reply = (await callOpenRouter({
                apiKey,
                model: modelId,
                messages: [
                    { role: 'system', content: this._buildSystemPrompt() },
                    ...this.conversationHistory,
                ],
                // No max_tokens cap: reasoning models need room to think before answering.
                temperature: 0.3,
            })).trim();

            this._removeMessage(typingId);
            this._appendMessage('assistant', reply);
            this.conversationHistory.push({ role: 'assistant', content: reply });

            model.globalActions.push({
                type: 'llm-auto-reply',
                reply,
                timestamp: new Date().toLocaleTimeString(),
            });
            historyView.update();

            const parsed = this._parseReply(reply);

            if (!parsed) {
                // Réponse incompréhensible → on redemande
                const clarif = prompts.clarificationRequest();
                this.conversationHistory.push({ role: 'user', content: clarif });
                this._appendMessage('user', clarif);
                this._scheduleNext();
                return;
            }

            if (parsed.type === 'abandon') {
                this.stop(`🏳️ LLM gives up: ${parsed.reason}`);
                model.globalActions.push({
                    type: 'llm-abandon',
                    reason: parsed.reason,
                    timestamp: new Date().toLocaleTimeString(),
                });
                historyView.update();
                return;
            }

            if (parsed.type === 'clear') {
                document.getElementById('reset')?.click();
                const feedback = prompts.feedbackClear();
                this.conversationHistory.push({ role: 'user', content: feedback });
                this._appendMessage('user', feedback);
                this._scheduleNext();
                return;
            }

            if (parsed.type === 'solution') {
                await this._playSolution(parsed.buttons);
                return;
            }

            if (parsed.type === 'action') {
                await this._clickButton(parsed.button);
                if (this._isVictory()) {

                    await this._askRuleExplanation();
                    this._setStatus('🎉 Objective reached! Moving to validation...', 'success');
                    model.addVictory();
                    historyView.update();

                    // On bloque la modale manuelle si le controller l'a ouverte
                    document.getElementById('victory-modal')?.classList.add('hidden');


                    await this._showAutoVictoryModal(prompts.autoVictoryModalStep());
                    await this._startValidationPhase();
                } else {
                    const state = model.getState();
                    const feedback = prompts.feedbackClick({ button: parsed.button, state });
                    this.conversationHistory.push({ role: 'user', content: feedback });
                    this._appendMessage('user', feedback);

                    this._scheduleNext();
                }
            }

        } catch (e) {
            this._removeMessage(typingId);
            this._appendMessage('error', '⚠ Error: ' + e.message);
            this.stop('Network or API error.');
        }
    },
    async _askRuleExplanation() {
        const prompt = prompts.askRuleAuto();
        this._appendMessage('user', prompt);
        this.conversationHistory.push({ role: 'user', content: prompt });

        const apiKey  = document.getElementById('llm-api-key')?.value.trim();
        const modelId = document.getElementById('llm-model')?.value.trim() || DEFAULT_MODEL;
        const typingId = this._appendMessage('assistant', '...', true);

        try {
            const reply = (await callOpenRouter({
                apiKey,
                model: modelId,
                messages: [
                    { role: 'system', content: this._buildSystemPrompt() },
                    ...this.conversationHistory,
                ],
                // No max_tokens cap: reasoning models need room to think before answering.
                temperature: 0.3,
            })).trim();
            this._removeMessage(typingId);
            this._appendMessage('assistant', reply);
            this.conversationHistory.push({ role: 'assistant', content: reply });

            // Logue la réponse dans l'historique global
            model.globalActions.push({
                type: 'llm-rule-explanation',
                reply,
                timestamp: new Date().toLocaleTimeString(),
            });
            historyView.update();

        } catch (e) {
            this._removeMessage(typingId);
            this._appendMessage('error', '⚠ Explanation error: ' + e.message);
        }
    },
    async _startValidationPhase() {
        this.isValidationPhase = true;
        this.currentValidationIndex = 0;
        this.validationScore = 0;

        await model.setValidation();

        const introVal = prompts.validationIntroAuto();
        this._appendMessage('user', introVal);
        this.conversationHistory.push({ role: 'user', content: introVal });

        this._scheduleNext();
    },

    async _handleValidationStep() {
        const questions = model.rule.validationQuestions;
        let finalFeedback = "";

        if (this.currentValidationIndex >= questions.length) {
            // Si le score est égal au nombre de questions, c'est un succès total
            const isAllCorrect = (this.validationScore === questions.length);

            const finalFeedback = isAllCorrect
                ? prompts.validationSuccess({ score: this.validationScore, total: questions.length })
                : prompts.validationFailure({ score: this.validationScore, total: questions.length });

            if (isAllCorrect) {
                this._setStatus('🎉 Validation passed!', 'success');
                model.globalActions.push({ type: 'validation-success', timestamp: new Date().toLocaleTimeString() });
            } else {
                this._setStatus('❌ Validation failed.', 'error');
                model.globalActions.push({ type: 'validation-failure', timestamp: new Date().toLocaleTimeString() });
            }

            this._appendMessage('user', finalFeedback);
            this.conversationHistory.push({ role: 'user', content: finalFeedback });

            historyView.update();

            this.stop(isAllCorrect ? 'Validation passed!' : 'Validation failed.');
            return;
        }

        const q = questions[this.currentValidationIndex];
        const questionText = prompts.validationQuestion({
            index:        this.currentValidationIndex + 1,
            initialState: q.initialState,
            clickButton:  q.clickButton,
        });

        this._appendMessage('user', questionText);
        this.conversationHistory.push({ role: 'user', content: questionText });

        const apiKey = document.getElementById('llm-api-key')?.value.trim();
        const modelId = document.getElementById('llm-model')?.value.trim();

        try {
            const reply = await callOpenRouter({
                apiKey,
                model: modelId,
                messages: [
                    { role: 'system', content: this._buildSystemPrompt() },
                    ...this.conversationHistory,
                ],
                temperature: 0.1,
            });

            this._appendMessage('assistant', reply);
            this.conversationHistory.push({ role: 'assistant', content: reply });

            const normalizedReply = reply.replace(/■/g, '1').replace(/□/g, '0');
            // Dernier tableau trouvé : la réponse finale, pas un essai intermédiaire.
            const match = [...normalizedReply.matchAll(/\[([01,\s,]+)\]/g)].at(-1);

            if (match) {
                const llmAnswer = match[1].trim().split(/[\s,]+/).map(n => parseInt(n));

                if (llmAnswer.length === 9) {
                    // Comparaison à l'état obtenu en appliquant la règle (pas expectedState).
                    const expected = model.rule.predict(q.initialState, q.clickButton, q.historique);
                    const isCorrect = JSON.stringify(llmAnswer) === JSON.stringify(expected);

                    if (isCorrect) {
                        this.validationScore++; // On incrémente notre compteur interne
                    }

                    model.addValidationQuestionResult(this.currentValidationIndex, isCorrect);

                    const feedback = isCorrect ? prompts.validationCorrect() : prompts.validationIncorrect();
                    this._appendMessage('user', feedback);
                    this.conversationHistory.push({ role: 'user', content: feedback });
                }
            } else {
                model.globalActions.push({
                    type: 'validation-question',
                    questionIndex: this.currentValidationIndex + 1,
                    status: '⚠️ INCORRECT FORMAT',
                    timestamp: new Date().toLocaleTimeString()
                });
                const errMsg = prompts.validationFormatError();
                this._appendMessage('user', errMsg);
                this.conversationHistory.push({ role: 'user', content: errMsg });
            }

            historyView.update();
            this.currentValidationIndex++;
            this._scheduleNext();

        } catch (e) {
            //console.error(e);
            //this.stop('Erreur phase validation');
            this._appendMessage('error', '⚠ Error: ' + e.message);
            this.stop('Validation phase error.');
        }
    },

    _sendFeedback(text) {
        this.conversationHistory.push({ role: 'user', content: text });
        this._appendMessage('user', text);
        this._scheduleNext();
    },

    _scheduleNext() {
        if (!this.running) return;
        this._setStatus(`⏳ Next action in ${document.getElementById('auto-delay-slider')?.value || 3}s…`, 'running');
        this._timeoutId = setTimeout(() => this._step(), this._getDelay());
    },

    async _clickButton(buttonNumber) {
        const index = buttonNumber - 1;
        model.toggle(index);
        view.render(model.getState());
        historyView.update();
        await this._wait(500);
    },

    async _playSolution(buttons) {
        this._setStatus(`🚀 Running the solution...`, 'running');

        for (const btn of buttons) {
            if (!this.running) return;
            if (btn < 1 || btn > 9) continue;

            await this._clickButton(btn);

            if (this._isVictory()) {
                model.addVictory();
                historyView.update();

                document.getElementById('victory-modal')?.classList.add('hidden');

                await this._askRuleExplanation();
                await this._showAutoVictoryModal(prompts.autoVictoryModal());
                await this._startValidationPhase();
                return;
            }
            await this._wait(this._getDelay());
        }
        this._sendFeedback(prompts.solutionFailed());
    },

    _isVictory() {
        const current = model.getState().map(b => b ? 1 : 0);
        const target  = model.rule?.targetState || Array(9).fill(0);
        return JSON.stringify(current) === JSON.stringify(target);
    },

    stop(reason = 'Stopped.') {
        this.running = false;
        if (this._timeoutId) clearTimeout(this._timeoutId);
        this._setRunning(false);
        this._setStatus(`🛑 ${reason}`, 'stopped');
    },

    _parseReply(text) {
        if (!text) return null;
        const upper = text.toUpperCase();
        if (/\bABANDON\b/i.test(text)) return { type: 'abandon', reason: text };
        if (/\bCLEAR\b/.test(upper)) return { type: 'clear' };
        // On prend la DERNIÈRE commande : la réponse finale vient après tout
        // raisonnement résiduel qui n'aurait pas été retiré en amont.
        const solMatches = [...text.matchAll(/SOLUTION\s*[:\-]\s*([\d\s]+)/gi)];
        if (solMatches.length) {
            const buttons = solMatches.at(-1)[1].trim().split(/\s+/).map(Number).filter(n => n >= 1 && n <= 9);
            return { type: 'solution', buttons };
        }
        const actionMatches = [...text.matchAll(/ACTION\s*[:\-]\s*(\d)/gi)];
        if (actionMatches.length) return { type: 'action', button: parseInt(actionMatches.at(-1)[1]) };
        return null;
    },

    _buildSystemPrompt() {
        return prompts.systemAuto({ maxSteps: this.MAX_STEPS });
    },

    _appendMessage(role, text, isTyping = false) {
        const container = document.getElementById('llm-messages');
        if (!container) return null;
        const div = document.createElement('div');
        const id = 'msg-' + Math.random().toString(36).slice(2);
        div.id = id;
        div.className = `llm-msg llm-msg-${role} ${isTyping ? 'llm-typing' : ''}`;
        div.textContent = text;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
        return id;
    },

    _removeMessage(id) {
        if (id) document.getElementById(id)?.remove();
    },

    _wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    async _showAutoVictoryModal(message) {
        const modal = document.getElementById('auto-victory-modal');
        const textEl = document.getElementById('auto-victory-text');
        if (modal && textEl) {
            textEl.textContent = message;
            modal.classList.remove('hidden');

            // Attente de 3 secondes
            await this._wait(3000);

            modal.classList.add('hidden');
        }
    },
};
export default autoMode