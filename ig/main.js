//main.js
import { model } from './model.js';
import { view } from './view.js';
import { historyView } from './historyView.js';
import { autoMode } from './autoMode.js';
import { llmTrace } from './openrouter.js';

document.addEventListener("DOMContentLoaded", async () => {
  view.init();
  autoMode.init();       // inject auto-mode controls before llmView.updateModeUI() reads them
  historyView.init();    // calls llmView.init() → updateModeUI()

  const ruleSelect = document.getElementById('rule-select');
  const objectiveDesc = document.getElementById('objective-description');
  const objectiveTitle = document.getElementById('objective-title');
  const objectiveGrid = document.getElementById('objective-grid');
  const victoryModal = document.getElementById('victory-modal');


  const validationPanel = document.getElementById('validation-panel');
  const validationInitialGrid = document.getElementById('validation-initial-grid');
  const validationAnswerGrid = document.getElementById('validation-answer-grid');
  const validationClickInfo = document.getElementById('validation-click-info');
  const validationCheckBtn = document.getElementById('validation-check');
  const validationBackBtn = document.getElementById('validation-back');
  const validationCloseBtn = document.getElementById('validation-close');
  const validationFeedback = document.getElementById('validation-feedback');
  const validationSuccessModal = document.getElementById('validation-success-modal');
  const validationFailureModal = document.getElementById('validation-failure-modal');

  let validationIndex = 0;
  let validationUserAnswer = Array(9).fill(0);
  const SEND_EMAIL = "test@test.fr";

  // ───────────────────────────────────────────────
  // Fonctions utilitaires
  // ───────────────────────────────────────────────
  function renderObjective(description, targetState) {
    if (objectiveDesc) objectiveDesc.textContent = description || "";
    if (objectiveTitle) {
      const diffLabels = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
      const diff = diffLabels[model.currentDifficulty] || model.currentDifficulty;
      objectiveTitle.textContent = `Objective — Test ${model.currentTest} (${diff})`;
    }
    objectiveGrid.innerHTML = "";
    targetState.forEach((state, i) => {
      const btn = document.createElement("button");
      btn.textContent = i + 1;
      if (state === 1) btn.classList.add("on");
      objectiveGrid.appendChild(btn);
    });
  }

  function checkVictory() {
    const current = model.getState().map(b => b ? 1 : 0);
    const target = model.rule.targetState;
    if (JSON.stringify(current) === JSON.stringify(target)) {
      model.addVictory();
      historyView.update();
      // Afficher ou masquer le bouton de validation selon le JSON.
      // Quand une validation est requise, on cache "Continue" pour qu'elle
      // ne puisse pas être esquivée (la seule issue est de la lancer).
      const validationBtn = document.getElementById('start-validation');
      const continueBtn = document.getElementById('close-victory');
      if (model.rule.hasValidation && !model.isValidation) {
        validationBtn?.classList.remove('hidden');
        continueBtn?.classList.add('hidden');
      } else {
        validationBtn?.classList.add('hidden');
        continueBtn?.classList.remove('hidden');
      }
      victoryModal?.classList.remove('hidden');
    }
  }

  async function loadAndApplyRule(testNumber, difficulty = 'easy') {
    await model.setTest(testNumber, difficulty);           // attend le fetch
    view.render(model.getState());
    historyView.update();
    renderObjective(model.rule.description, model.rule.targetState);
    checkVictory();
  }

  function renderMiniGrid(container, state, clickable = false, onClick = null) {
    container.innerHTML = "";

    state.forEach((cell, i) => {
      const btn = document.createElement("button");
      btn.textContent = i + 1;

      if (cell) btn.classList.add("on");

      if (clickable && onClick) {
        btn.addEventListener("click", () => onClick(i));
      }

      container.appendChild(btn);
    });
  }
  function renderAnswerGrid() {
    renderMiniGrid(validationAnswerGrid, validationUserAnswer, true, (i) => {
      validationUserAnswer[i] = validationUserAnswer[i] ? 0 : 1;
      renderAnswerGrid();
    });
  }
  function openValidationQuestion() {
    const questions = model.rule.validationQuestions || [];
    const question = questions[validationIndex];
    if (!question) return;

    validationUserAnswer = Array(9).fill(0);
    validationFeedback.textContent = "";
    validationCheckBtn.classList.remove("hidden");
    validationBackBtn.classList.toggle("hidden", validationIndex === 0);

    validationCloseBtn.classList.add("hidden");

    validationClickInfo.textContent = `Click on button ${question.clickButton}`;

    renderMiniGrid(validationInitialGrid, question.initialState);
    renderAnswerGrid();

    validationPanel.classList.remove("hidden");
  }
  function arraysEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  function checkValidationAnswer() {
    const questions = model.rule.validationQuestions || [];
    const question = questions[validationIndex];
    if (!question) return;

    // On compare à l'état obtenu en appliquant la règle (pas à expectedState),
    // pour garantir que le test est valide.
    const expected = model.rule.predict(question.initialState, question.clickButton, question.historique);
    const isCorrect = arraysEqual(validationUserAnswer, expected);

    // Afficher le retour utilisateur
    validationFeedback.textContent = isCorrect
        ? "Correct answer."
        : "That's not the right answer.";
    validationFeedback.style.color = isCorrect ? "green" : "red";

    // Enregistrer dans l'historique
    model.addValidationQuestionResult(validationIndex, isCorrect);
    historyView.update();

    // Passer automatiquement à la suite après un court délai
    setTimeout(() => {
      if (validationIndex < questions.length - 1) {
        validationIndex++;
        openValidationQuestion();
      } else {
        validationPanel.classList.add('hidden');

        if (model.validationAllCorrect) {
          model.addValidationSuccess();
          historyView.update();
          validationSuccessModal?.classList.remove('hidden');
        } else {
          model.addValidationFailure();
          historyView.update();
          validationFailureModal?.classList.remove('hidden');
        }
      }
    }, 700);
  }
  function buildSendText() {
        // const now = new Date();
        // const contenu = document.getElementById('actions-list')?.innerText || '';
        const contenu = JSON.stringify(model.exportJSON());
        /*return `Bonjour,
    
    Veuillez trouver ci-dessous les résultats de la session.
    
    Date : ${now.toLocaleDateString('fr-FR')}
    Heure : ${now.toLocaleTimeString('fr-FR')}
    
    ${contenu}`; */
    return contenu
  }

  // ───────────────────────────────────────────────
  // Chargement liste des tests
  // ───────────────────────────────────────────────
  async function loadRules() {
    const difficultyFolders = ['easy', 'medium', 'hard'];
    const possibleTests = [];

    for (const diff of difficultyFolders) {
      let i = 1;

      while (true) {
        try {
          const response = await fetch(`ressources/rules/${diff}/test${i}.json`);
          if (!response.ok) break;
          possibleTests.push({num: i, difficulty: diff });
          i++;
        } catch {
          break;
        }
      }
    }
    const difficultyOrder = ['easy', 'medium', 'hard'];
    const difficultyLabels = {
      'easy': { label: '🟢 Easy', color: '#22c55e' },
      'medium': { label: '🟡 Medium', color: '#f59e0b' },
      'hard': { label: '🔴 Hard', color: '#ef4444' },
    };

    // Grouper par difficulté
    ruleSelect.innerHTML = '';

    for (const diff of difficultyOrder) {
      const group = possibleTests.filter(t => t.difficulty === diff);
      if (group.length === 0) continue;

      // En-tête de groupe (collapsible) — collapsed by default except "easy"
      const startCollapsed = diff !== 'easy';

      const header = document.createElement('li');
      header.classList.add('difficulty-header');
      if (startCollapsed) header.classList.add('collapsed');
      header.style.color = difficultyLabels[diff]?.color || 'white';

      const caret = document.createElement('span');
      caret.classList.add('difficulty-caret');
      caret.textContent = startCollapsed ? '▸' : '▾';

      const label = document.createElement('span');
      label.textContent = difficultyLabels[diff]?.label || diff;

      header.appendChild(caret);
      header.appendChild(label);

      header.addEventListener('click', () => {
        const collapsed = header.classList.toggle('collapsed');
        caret.textContent = collapsed ? '▸' : '▾';
        let next = header.nextElementSibling;
        while (next && !next.classList.contains('difficulty-header')) {
          next.style.display = collapsed ? 'none' : '';
          next = next.nextElementSibling;
        }
      });

      ruleSelect.appendChild(header);

      for (const test of group) {
        const li = document.createElement('li');
        li.textContent = `Test ${test.num}`;
        li.dataset.value = test.num;
        li.dataset.difficulty = test.difficulty; // ← ajouter cette ligne
        if (startCollapsed) li.style.display = 'none';
        li.addEventListener('click', async () => {
          document.querySelectorAll('#rule-select li:not(.difficulty-header)').forEach(el => el.classList.remove('active'));
          li.classList.add('active');
          await loadAndApplyRule(test.num, test.difficulty);
        });
        ruleSelect.appendChild(li);
      }
    }

    // Charger le premier test automatiquement
    const first = ruleSelect.querySelector('li:not(.difficulty-header)');
    if (first) {
      first.classList.add('active');
      await loadAndApplyRule(parseInt(first.dataset.value), first.dataset.difficulty);
    }
  }

  await loadRules();
  // Fermeture modales via croix
  document.querySelectorAll('.modal-close-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    closeValidation();
    btn.closest('.modal').classList.add('hidden');
  });
});

  // ───────────────────────────────────────────────
  // Événements grille
  // ───────────────────────────────────────────────
  document.querySelectorAll('.grid button').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id) - 1;
      model.toggle(id);
      view.render(model.getState());
      historyView.update();
      checkVictory();
    });
  });

  // ───────────────────────────────────────────────
  // Filtrage par difficulté
  // ───────────────────────────────────────────────
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // Mettre à jour le bouton actif
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      const items = document.querySelectorAll('#rule-select li:not(.difficulty-header)');
      const headers = document.querySelectorAll('#rule-select li.difficulty-header');

      items.forEach(li => {
        if (filter === 'all' || li.dataset.difficulty === filter) {
          li.style.display = '';
        } else {
          li.style.display = 'none';
        }
      });

      // Cacher les en-têtes de groupe si tous leurs tests sont cachés
      headers.forEach(header => {
        let next = header.nextElementSibling;
        let allHidden = true;
        while (next && !next.classList.contains('difficulty-header')) {
          if (next.style.display !== 'none') allHidden = false;
          next = next.nextElementSibling;
        }
        header.style.display = allHidden ? 'none' : '';
      });
    });
  });

  document.getElementById('reset')?.addEventListener('click', () => {
    model.reset();
    view.render(model.getState());
    historyView.update();
  });

  document.getElementById('clean')?.addEventListener('click', () => {
    model.actions = [];
    historyView.update();
  });

  document.getElementById('next')?.addEventListener('click', () => {
    const items = document.querySelectorAll('#rule-select li');
    const current = document.querySelector('#rule-select li.active');
    if (!items.length) return;
    let idx = Array.from(items).indexOf(current);
    if (idx === -1) idx = 0;
    const nextIdx = (idx + 1) % items.length;
    items[nextIdx].click();
  });

  document.getElementById('close-victory')?.addEventListener('click', () => {
    victoryModal?.classList.add('hidden');
  });

  // ───────────────────────────────────────────────
  // Téléchargement résultats JSON
  // ───────────────────────────────────────────────
  document.getElementById('export')?.addEventListener('click', () => {
    const modal = document.getElementById('send-modal');
    const preview = document.getElementById('send-preview');
    const feedback = document.getElementById('send-feedback');
    const emailLabel = document.getElementById('send-destination-email');

    const text = buildSendText();

    if (preview) preview.value = text;
    if (feedback) {
      feedback.textContent = '';
      feedback.style.color = '';
    }
    if (emailLabel) emailLabel.textContent = SEND_EMAIL;

    modal?.classList.remove('hidden');
  });
  document.getElementById('confirm-send')?.addEventListener('click', () => {
    const now = new Date();
    const sujet = encodeURIComponent(
        `Session results from ${now.toLocaleDateString('en-GB')} at ${now.toLocaleTimeString('en-GB')}`
    );

    const preview = document.getElementById('send-preview');
    const corps = encodeURIComponent(preview?.value || '');

    window.location.href = `mailto:${SEND_EMAIL}?subject=${sujet}&body=${corps}`;
  });
  document.getElementById('copy-send-text')?.addEventListener('click', async () => {
    const preview = document.getElementById('send-preview');
    const feedback = document.getElementById('send-feedback');

    try {
      await navigator.clipboard.writeText(preview?.value || '');
      if (feedback) {
        feedback.textContent = 'Text copied to clipboard.';
        feedback.style.color = 'green';
      }
    } catch (err) {
      if (feedback) {
        feedback.textContent = 'Could not copy automatically. You can select the text manually.';
        feedback.style.color = 'red';
      }
    }
  });
  document.getElementById('copy-send-email')?.addEventListener('click', async () => {
    const feedback = document.getElementById('send-feedback');

    try {
      await navigator.clipboard.writeText(SEND_EMAIL);
      if (feedback) {
        feedback.textContent = 'Email address copied.';
        feedback.style.color = 'green';
      }
    } catch (err) {
      if (feedback) {
        feedback.textContent = 'Could not copy the address automatically.';
        feedback.style.color = 'red';
      }
    }
  });
  document.getElementById('close-send-modal')?.addEventListener('click', () => {
    document.getElementById('send-modal')?.classList.add('hidden');
  });

  document.getElementById('send-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'send-modal') {
      e.currentTarget.classList.add('hidden');
    }
  });

  document.getElementById('download-json')?.addEventListener('click', () => {

    const reportText = buildSendText();

    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });

    const testName = document.querySelector('#rule-select li.active')?.textContent.trim() || "Session";
    const dateStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    const fileName = `Report_${testName}_${dateStr}.txt`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  document.getElementById('start-validation')?.addEventListener('click', async () => {
    victoryModal?.classList.add('hidden');
    validationIndex = 0;
    await model.setValidation();
    historyView.update();
    openValidationQuestion();
  });

  // Croix fermeture validation
document.querySelector('#validation-panel .modal-close-btn')?.addEventListener('click', () => {
  validationPanel.classList.add('hidden');
});

  validationCheckBtn?.addEventListener('click', () => {
    checkValidationAnswer();
  });




  validationCloseBtn?.addEventListener('click', () => {
    validationPanel.classList.add('hidden');
  });
  document.getElementById('close-validation-success')?.addEventListener('click', () => {
    validationSuccessModal?.classList.add('hidden');
  });
  document.getElementById('close-validation-failure')?.addEventListener('click', () => {
    validationFailureModal?.classList.add('hidden');
  });
  // ── Fonction commune : fermer la validation et enregistrer l'abandon ──
  function closeValidation() {
    validationPanel.classList.add('hidden');
    model.addValidationAbandon();
    historyView.update();
  }

// ── Bouton Retour ──
 /* document.getElementById('validation-back')?.addEventListener('click', () => {
    closeValidation();
  });*/

  validationBackBtn?.addEventListener('click', () => { 
  if (validationIndex > 0) {
    validationIndex--;
    openValidationQuestion();
  }
});
  const commentInput = document.getElementById('comment-input');

  function submitComment() {
    if (!commentInput) return;
    const text = commentInput.value.trim();
    if (!text) return;

    model.addComment(text);
    historyView.update();
    commentInput.value = '';
  }

  // Submit on Enter (Shift+Enter inserts a newline)
  commentInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitComment();
    }
  });

  // ── LLM interaction trace modal ──
  const traceModal = document.getElementById('trace-modal');

  function escapeHtml(s) {
    return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  }

  function renderTrace() {
    const container = document.getElementById('trace-content');
    if (!container) return;

    if (!llmTrace.length) {
      container.innerHTML = '<p>No LLM interaction in this session yet.</p>';
      return;
    }

    container.innerHTML = llmTrace.map((t, i) => `
      <div class="trace-turn">
        <div class="trace-turn-header">Turn ${i + 1} — ${escapeHtml(t.model)} — ${t.timestamp}</div>
        <div class="trace-block">
          <span class="trace-label">System prompt</span>
          <pre>${escapeHtml(t.system ?? '(none)')}</pre>
        </div>
        <div class="trace-block">
          <span class="trace-label">User prompt</span>
          <pre>${escapeHtml(t.userPrompt ?? '(none)')}</pre>
        </div>
        ${t.reasoning ? `
        <div class="trace-block">
          <span class="trace-label">Reasoning (chain of thought)</span>
          <pre class="trace-reasoning">${escapeHtml(t.reasoning)}</pre>
        </div>` : ''}
        <div class="trace-block">
          <span class="trace-label">LLM response (answer)</span>
          <pre>${escapeHtml(t.response ?? '')}</pre>
        </div>
      </div>
    `).join('');
  }

  document.getElementById('open-trace')?.addEventListener('click', () => {
    renderTrace();
    traceModal?.classList.remove('hidden');
  });
  document.getElementById('close-trace-modal')?.addEventListener('click', () => {
    traceModal?.classList.add('hidden');
  });
  traceModal?.addEventListener('click', (e) => {
    if (e.target === traceModal) traceModal.classList.add('hidden');
  });

// ── Clic en dehors du panel ──
  validationPanel?.addEventListener('click', (e) => {
    // Si le clic est sur le fond (pas sur le contenu), fermer
    if (e.target === validationPanel) {
      closeValidation();
    }
  });

// ── Remplacer l'ancien listener du bouton Fermer pour aussi enregistrer ──
  validationCloseBtn?.addEventListener('click', () => {
    closeValidation();
  });

});