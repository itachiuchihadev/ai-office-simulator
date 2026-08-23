// js/ui/team-modal.js — Interactive Subagent Management & Prompt Configuration Modal

import { loadSubagents, saveSubagents, DEFAULT_SUBAGENTS, AVAILABLE_SPRITES } from '../agents/subagent-manager.js';
import { escapeHtml } from '../utils.js';

export function setupTeamModal() {
  const toggleBtn = document.getElementById('teamSetupToggle');
  if (!toggleBtn) return;

  // Create Modal DOM if not existing
  let modal = document.getElementById('teamModal');
  if (!modal) {
    modal = createTeamModalDOM();
    document.body.appendChild(modal);
  }

  const closeBtn = modal.querySelector('#closeTeamModal');
  const cancelBtn = modal.querySelector('#cancelTeamBtn');
  const saveBtn = modal.querySelector('#saveTeamBtn');
  const resetBtn = modal.querySelector('#resetTeamBtn');

  const openModal = () => {
    populateTeamCards(modal);
    modal.classList.add('active');
  };

  const closeModal = () => {
    modal.classList.remove('active');
  };

  toggleBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const updated = extractFormData(modal);
      saveSubagents(updated);
      closeModal();
      showToast('✅ Subagent team updated! Active agents placed at desks.');
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset all subagents to standard defaults?')) {
        saveSubagents(DEFAULT_SUBAGENTS);
        populateTeamCards(modal);
        showToast('↺ Team reset to default agents.');
      }
    });
  }
}

function createTeamModalDOM() {
  const overlay = document.createElement('div');
  overlay.className = 'team-modal-overlay';
  overlay.id = 'teamModal';

  overlay.innerHTML = `
    <div class="team-modal-container">
      <div class="team-modal-header">
        <div class="modal-header-left">
          <span class="modal-icon">👥</span>
          <div>
            <h2 class="modal-title">Configure Subagents & Team Roles</h2>
            <p class="modal-subtitle">Set agent designations, custom system prompts, and sprites. Active agents will appear at their desks.</p>
          </div>
        </div>
        <button class="btn-icon btn-close-modal" id="closeTeamModal" aria-label="Close Modal">✕</button>
      </div>

      <div class="team-modal-body" id="teamModalCards">
        <!-- Dynamically rendered agent cards -->
      </div>

      <div class="team-modal-footer">
        <button class="btn-secondary" id="resetTeamBtn">↺ Reset Defaults</button>
        <div class="footer-actions">
          <button class="btn-secondary" id="cancelTeamBtn">Cancel</button>
          <button class="btn-primary" id="saveTeamBtn">💾 Save & Deploy Team</button>
        </div>
      </div>
    </div>
  `;

  return overlay;
}

function populateTeamCards(modal) {
  const container = modal.querySelector('#teamModalCards');
  if (!container) return;

  const agents = loadSubagents();
  container.innerHTML = '';

  agents.forEach((agent, index) => {
    const card = document.createElement('div');
    card.className = `agent-config-card ${agent.enabled !== false ? 'active' : 'disabled'}`;
    card.dataset.agentId = agent.id;

    const spriteOptions = AVAILABLE_SPRITES.map(s => `
      <option value="${s.id}" ${agent.spriteName === s.id ? 'selected' : ''}>${s.name}</option>
    `).join('');

    card.innerHTML = `
      <div class="agent-card-top">
        <div class="agent-card-header">
          <span class="agent-status-badge ${agent.isManager ? 'badge-manager' : 'badge-specialist'}">
            ${agent.isManager ? '🧑‍💼 Manager Station' : `🪑 Cubicle Desk ${index}`}
          </span>
          <label class="switch-toggle" title="Enable or Disable Subagent">
            <input type="checkbox" class="agent-enable-input" ${agent.enabled !== false ? 'checked' : ''} ${agent.isManager ? 'disabled' : ''}>
            <span class="slider"></span>
          </label>
        </div>

        <div class="agent-card-row">
          <div class="agent-sprite-preview-box">
            <img src="/assets/extracted_assets/all/${agent.spriteName || 'character_dark_hair_boy'}.png" alt="${agent.name}" class="sprite-preview-img" id="preview-${agent.id}">
          </div>
          <div class="agent-fields-group">
            <div class="field-row">
              <div class="field-item flex-1">
                <label class="field-label">Agent Name</label>
                <input type="text" class="form-input agent-name-input" value="${escapeHtml(agent.name)}" placeholder="e.g. Senior Researcher">
              </div>
              <div class="field-item" style="width: 70px;">
                <label class="field-label">Emoji</label>
                <input type="text" class="form-input agent-emoji-input" value="${escapeHtml(agent.emoji || '🤖')}" style="text-align: center;">
              </div>
            </div>

            <div class="field-row">
              <div class="field-item flex-1">
                <label class="field-label">Designation / Role</label>
                <input type="text" class="form-input agent-role-input" value="${escapeHtml(agent.role)}" placeholder="e.g. Data Analysis & Insights">
              </div>
              <div class="field-item" style="width: 140px;">
                <label class="field-label">Sprite Avatar</label>
                <select class="form-input agent-sprite-select" data-agent-id="${agent.id}">
                  ${spriteOptions}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="field-item field-prompt">
          <label class="field-label">Custom AI System Prompt / Instructions</label>
          <textarea class="form-input agent-prompt-input" rows="2" placeholder="Describe this agent's specialized knowledge, tone, and behavior...">${escapeHtml(agent.systemPrompt || '')}</textarea>
        </div>
      </div>
    `;

    // Dynamic sprite image preview update on change
    const select = card.querySelector('.agent-sprite-select');
    const preview = card.querySelector(`#preview-${agent.id}`);
    const toggle = card.querySelector('.agent-enable-input');

    select.addEventListener('change', () => {
      preview.src = `/assets/extracted_assets/all/${select.value}.png`;
    });

    toggle.addEventListener('change', () => {
      if (toggle.checked) {
        card.classList.remove('disabled');
        card.classList.add('active');
      } else {
        card.classList.remove('active');
        card.classList.add('disabled');
      }
    });

    container.appendChild(card);
  });
}

function extractFormData(modal) {
  const cards = modal.querySelectorAll('.agent-config-card');
  const existing = loadSubagents();

  const updated = [];
  cards.forEach(card => {
    const id = card.dataset.agentId;
    const prev = existing.find(a => a.id === id) || {};

    const enabled = card.querySelector('.agent-enable-input').checked;
    const name = card.querySelector('.agent-name-input').value.trim() || prev.name;
    const emoji = card.querySelector('.agent-emoji-input').value.trim() || prev.emoji || '🤖';
    const role = card.querySelector('.agent-role-input').value.trim() || prev.role;
    const spriteName = card.querySelector('.agent-sprite-select').value;
    const systemPrompt = card.querySelector('.agent-prompt-input').value.trim() || prev.systemPrompt;

    updated.push({
      ...prev,
      id,
      name,
      emoji,
      role,
      spriteName,
      systemPrompt,
      enabled,
    });
  });

  return updated;
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}

