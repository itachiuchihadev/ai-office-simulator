// js/ui/settings-modal.js — API Key & Settings Drawer with Dynamic Model Sync

import { fetchGeminiModels, fetchOpenAIModels, populateModelsInDropdown } from '../api/llm-client.js';
import { showToast } from '../utils.js';

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
    <div class="modal-card" style="max-width: 500px;">
      <div class="modal-header">
        <h3 class="modal-title">⚙️ API CONFIGURATION</h3>
        <button class="modal-close" id="settingsModalClose" aria-label="Close">✕</button>
      </div>
      <p class="modal-description">
        Enter your API keys below. Available models are fetched dynamically from the official APIs and populated directly into your model dropdown.
      </p>

      <div class="modal-form-group">
        <div class="modal-field">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <label class="modal-label">
              Google Gemini API Key (Recommended)
            </label>
            <button type="button" id="syncGeminiModelsBtn" class="btn-sync-models" title="Fetch latest Gemini models for this key">
              🔄 Sync Gemini
            </button>
          </div>
          <input type="password" id="inputKeyGemini" class="form-input pixel-input" placeholder="AIzaSy..." value="${keys.gemini}">
          <div id="geminiModelStatus" class="model-fetch-status"></div>
        </div>

        <div class="modal-field">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <label class="modal-label">
              OpenAI API Key
            </label>
            <button type="button" id="syncOpenAIModelsBtn" class="btn-sync-models" title="Fetch latest OpenAI models for this key">
              🔄 Sync OpenAI
            </button>
          </div>
          <input type="password" id="inputKeyOpenAI" class="form-input pixel-input" placeholder="sk-..." value="${keys.openai}">
          <div id="openaiModelStatus" class="model-fetch-status"></div>
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
  const syncGeminiBtn = modal.querySelector('#syncGeminiModelsBtn');
  const syncOpenAIBtn = modal.querySelector('#syncOpenAIModelsBtn');
  const geminiInput = modal.querySelector('#inputKeyGemini');
  const openAIInput = modal.querySelector('#inputKeyOpenAI');
  const geminiStatus = modal.querySelector('#geminiModelStatus');
  const openAIStatus = modal.querySelector('#openaiModelStatus');

  const updateStatusDisplay = () => {
    try {
      const cachedGemini = localStorage.getItem('cached_gemini_models');
      if (cachedGemini) {
        const parsed = JSON.parse(cachedGemini);
        if (Array.isArray(parsed) && parsed.length > 0) {
          geminiStatus.className = 'model-fetch-status success';
          geminiStatus.textContent = `✓ ${parsed.length} Gemini models in selector`;
        }
      }
    } catch (e) {}

    try {
      const cachedOpenAI = localStorage.getItem('cached_openai_models');
      if (cachedOpenAI) {
        const parsed = JSON.parse(cachedOpenAI);
        if (Array.isArray(parsed) && parsed.length > 0) {
          openAIStatus.className = 'model-fetch-status success';
          openAIStatus.textContent = `✓ ${parsed.length} OpenAI models in selector`;
        }
      }
    } catch (e) {}
  };

  const handleSyncGemini = async (quiet = false) => {
    const key = geminiInput.value.trim();
    if (!key) {
      if (!quiet) {
        geminiStatus.className = 'model-fetch-status error';
        geminiStatus.textContent = '⚠️ Enter a Gemini API key first.';
      }
      return false;
    }

    geminiStatus.className = 'model-fetch-status loading';
    geminiStatus.textContent = '🔄 Fetching Gemini models from Google API...';

    try {
      const models = await fetchGeminiModels(key);
      if (models.length > 0) {
        populateModelsInDropdown('gemini', models);
        geminiStatus.className = 'model-fetch-status success';
        geminiStatus.textContent = `✓ Loaded ${models.length} Gemini models!`;
        if (!quiet) showToast(`✅ Synced ${models.length} Gemini models!`);
        return true;
      } else {
        geminiStatus.className = 'model-fetch-status error';
        geminiStatus.textContent = '⚠️ No chat-compatible models found.';
        return false;
      }
    } catch (err) {
      geminiStatus.className = 'model-fetch-status error';
      geminiStatus.textContent = `⚠️ ${err.message}`;
      if (!quiet) showToast(`⚠️ Gemini fetch error: ${err.message}`);
      return false;
    }
  };

  const handleSyncOpenAI = async (quiet = false) => {
    const key = openAIInput.value.trim();
    if (!key) {
      if (!quiet) {
        openAIStatus.className = 'model-fetch-status error';
        openAIStatus.textContent = '⚠️ Enter an OpenAI API key first.';
      }
      return false;
    }

    openAIStatus.className = 'model-fetch-status loading';
    openAIStatus.textContent = '🔄 Fetching OpenAI models...';

    try {
      const models = await fetchOpenAIModels(key);
      if (models.length > 0) {
        populateModelsInDropdown('openai', models);
        openAIStatus.className = 'model-fetch-status success';
        openAIStatus.textContent = `✓ Loaded ${models.length} OpenAI models!`;
        if (!quiet) showToast(`✅ Synced ${models.length} OpenAI models!`);
        return true;
      } else {
        openAIStatus.className = 'model-fetch-status error';
        openAIStatus.textContent = '⚠️ No chat-compatible OpenAI models found.';
        return false;
      }
    } catch (err) {
      openAIStatus.className = 'model-fetch-status error';
      openAIStatus.textContent = `⚠️ ${err.message}`;
      if (!quiet) showToast(`⚠️ OpenAI fetch error: ${err.message}`);
      return false;
    }
  };

  btn.addEventListener('click', () => {
    modal.classList.add('open');
    updateStatusDisplay();
  });

  closeBtn.addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });

  if (syncGeminiBtn) syncGeminiBtn.addEventListener('click', () => handleSyncGemini(false));
  if (syncOpenAIBtn) syncOpenAIBtn.addEventListener('click', () => handleSyncOpenAI(false));

  saveBtn.addEventListener('click', async () => {
    const gKey = geminiInput.value.trim();
    const oKey = openAIInput.value.trim();
    saveApiKeys({ gemini: gKey, openai: oKey });

    const promises = [];
    if (gKey) promises.push(handleSyncGemini(true));
    if (oKey) promises.push(handleSyncOpenAI(true));

    await Promise.allSettled(promises);
    showToast('💾 Settings saved & models synced!');
    modal.classList.remove('open');
  });
}


