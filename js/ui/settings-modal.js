// js/ui/settings-modal.js — API Key & Settings Drawer

export function getStoredApiKeys() {
  return {
    gemini: localStorage.getItem('api_key_gemini') || '',
    openai: localStorage.getItem('api_key_openai') || '',
    anthropic: localStorage.getItem('api_key_anthropic') || ''
  };
}

export function saveApiKeys(keys) {
  if (keys.gemini !== undefined) localStorage.setItem('api_key_gemini', keys.gemini.trim());
  if (keys.openai !== undefined) localStorage.setItem('api_key_openai', keys.openai.trim());
  if (keys.anthropic !== undefined) localStorage.setItem('api_key_anthropic', keys.anthropic.trim());
}

export function setupSettingsModal() {
  const btn = document.getElementById('settingsToggle');
  if (!btn) return;

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'settingsModal';

  const keys = getStoredApiKeys();

  modal.innerHTML = `
    <div class="modal-card" style="max-width: 480px;">
      <div class="modal-header">
        <h3 class="modal-title">⚙️ API CONFIGURATION</h3>
        <button class="modal-close" id="settingsModalClose" aria-label="Close">✕</button>
      </div>
      <p class="modal-description">
        Enter your API keys below. Keys are stored locally in your browser and used directly for Manager and Agent orchestration.
      </p>

      <div class="modal-form-group">
        <div class="modal-field">
          <label class="modal-label">
            Google Gemini API Key (Recommended)
          </label>
          <input type="password" id="inputKeyGemini" class="form-input pixel-input" placeholder="AIzaSy..." value="${keys.gemini}">
        </div>

        <div class="modal-field">
          <label class="modal-label">
            OpenAI API Key
          </label>
          <input type="password" id="inputKeyOpenAI" class="form-input pixel-input" placeholder="sk-..." value="${keys.openai}">
        </div>
      </div>

      <div class="modal-actions">
        <button id="saveSettingsBtn" class="btn-primary pixel-btn">
          💾 SAVE CONFIG
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeBtn = modal.querySelector('#settingsModalClose');
  const saveBtn = modal.querySelector('#saveSettingsBtn');

  btn.addEventListener('click', () => modal.classList.add('open'));
  closeBtn.addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });

  saveBtn.addEventListener('click', () => {
    const gKey = modal.querySelector('#inputKeyGemini').value;
    const oKey = modal.querySelector('#inputKeyOpenAI').value;
    saveApiKeys({ gemini: gKey, openai: oKey });
    modal.classList.remove('open');
  });
}
