//historyView.js
import { model } from './model.js';
import { llmView } from './llmView.js';

export const historyView = {
  list: null,

  init() {
    this.list = document.getElementById('actions-list');
    llmView.init();
  },

  updateClear() {
    this.list.innerHTML = `
      <div>
        <strong>CLEAR action:</strong>
      </div>
    `
  },

  update() {

    const actions = model.globalActions;
    if (!actions || actions.length === 0) {
      this.list.innerHTML = '<p>No action yet</p>';
      return;
    }

    this.list.innerHTML = actions.map((a, idx) => {
      console.log(a.type)
      if (a.type === 'load') {
        return `
          <div class="action-load">
            <strong>📂 ${a.testLabel}</strong> - loaded at ${a.timestamp}
          </div>
        `;
      }
      if (a.type === 'victory') {
        return `
          <div class="action-victory">
             <strong>Objective reached!</strong> at ${a.timestamp}
          </div>
        `;
      }
      if (a.type === 'validation-success') {
        return `
        <div class="action-validation-success">
          <strong>Validation passed!</strong> at ${a.timestamp}
        </div>
      `;
      }
      if (a.type === 'clear') {
        return `
          <div class="action-clear">
            <strong>Action ${idx + 1}:</strong>  CLEAR at ${a.timestamp}
          </div>
        `;
      }
      if (a.type === 'validation-question') {
          return `
      <div class="action-validation-question">
        <strong>Validation phase - Question ${a.questionIndex}</strong> :
        ${a.status} at ${a.timestamp}
      </div>
    `;
      }

        if (a.type === 'validation-failure') {
          return `
      <div class="action-validation-failure">
        <strong>Validation failed</strong> at ${a.timestamp}
      </div>
    `;
      }
      if (a.type === 'validation-abandon') {
        return `
        <div class="action-validation-abandon">
            <strong>Validation abandoned</strong> at ${a.timestamp}
        </div>
    `;
      }
      if (a.type === 'llm-description') {
        return `
      <div class="action-llm">
        <strong>LLM Description sent</strong> at ${a.timestamp}
      </div>
    `;
      }
      if (a.type === 'llm-etape') {
        const ref = a.actionRef ? ` (button ${a.actionRef})` : '';
        return `
      <div class="action-llm">
        <strong>LLM Step sent</strong>${ref} at ${a.timestamp}
      </div>
    `;
      }
          if (a.type === 'comment') {
            return `
        <div class="action-comment">
          <strong>Comment:</strong> ${a.text} at ${a.timestamp}
        </div>
      `;
      }
       if (a.type === 'auto-start') {
        return `
          <div class="action-auto-start">
            <strong>🤖 Automatic mode started</strong> at ${a.timestamp}
          </div>
        `;
      }
      if (a.type === 'auto-stop') {
        return `
          <div class="action-auto-stop">
            <strong>⏹ Auto mode stopped</strong> - ${a.reason} at ${a.timestamp}
          </div>
        `;
      }
      if (a.type === 'llm-auto-reply') {
        return `
          <div class="action-llm">
            <strong>🤖 LLM reply:</strong> ${a.reply} at ${a.timestamp}
          </div>
        `;
      }
      if (a.type === 'llm-auto-action') {
        return `
          <div class="action-llm-auto">
            <strong>🤖 LLM clicks button ${a.button}</strong> at ${a.timestamp}
          </div>
        `;
      }
      if (a.type === 'llm-abandon') {
        return `
          <div class="action-llm-abandon">
            <strong>🏳 LLM gives up:</strong> ${a.reason} at ${a.timestamp}
          </div>
        `;
            }

            // ── New entry: rule explanation ──────────────────────────
            if (a.type === 'llm-rule-explanation') {
                return `
          <div class="action-llm-rule">
            <strong>💡 Rule identified by the LLM</strong> at ${a.timestamp}<br>
            <em>${a.reply}</em>
          </div>
        `;
      }
      if (a.type === 'llm-validation-end') {

        const isSuccess = a.result === 'PASSED';
        const statusClass = isSuccess ? 'action-validation-success' : 'action-validation-failure';
        const borderColor = isSuccess ? '#28a745' : '#dc3545'; // Green or Red
        const textColor = isSuccess ? '#28a745' : '#dc3545';

        return `
          <div class="${statusClass}" style="border-left: 4px solid ${borderColor}; padding-left: 10px;">
            <strong style="color: ${textColor};">LLM validation finished</strong><br>
            <span style="color: ${textColor};">Score: ${a.score} (${a.result})</span> at ${a.timestamp}
          </div>
        `;
      }

      const stateStr = (a.stateAfter && Array.isArray(a.stateAfter))
          ? a.stateAfter.map(s => s ? '■' : '□').join(' ')
          : 'N/A';

      return `
        <div>
          <strong>Action ${idx + 1}:</strong> Button ${a.button} clicked at ${a.timestamp}<br>
          State after: ${stateStr}
        </div>
      `;
    }).join('');
  }

};
