import { state } from '../config.js';

const AVATAR_OPTIONS = [
  { id: 'human', label: 'Human Crew', icon: '🧑‍💼', desc: 'Classic office professionals' },
  { id: 'pixel_gif', label: '8-Dir Animated GIF', icon: '👾', desc: 'Custom 8-direction animated character GIF' },
  { id: 'cat', label: 'Cat Office', icon: '🐱', desc: 'Cute cats with whiskers & ears' },
  { id: 'dog', label: 'Dog Squad', icon: '🐶', desc: 'Playful dogs with wagging tails' },
  { id: 'robot', label: 'Bot Corps', icon: '🤖', desc: 'Futuristic robots with visors' },
  { id: 'alien', label: 'Alien Team', icon: '👽', desc: '3-eyed green space visitors' },
];

export function setupAvatarModal() {
  const btn = document.getElementById('avatarModalToggle');
  if (!btn) return;

  // Create Modal Overlay DOM
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'avatarModal';

  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <h3 class="modal-title">🎭 Choose Avatar Theme</h3>
        <button class="modal-close" id="avatarModalClose">&times;</button>
      </div>
      <p style="font-size: 13px; color: var(--text-secondary); margin: 0;">
        Select an avatar species for all agents in the AI Office floor canvas!
      </p>
      <div class="avatar-grid" id="avatarGrid"></div>
    </div>
  `;

  document.body.appendChild(modal);

  const grid = modal.querySelector('#avatarGrid');
  const closeBtn = modal.querySelector('#avatarModalClose');

  // Render cards
  function renderCards() {
    grid.innerHTML = '';
    AVATAR_OPTIONS.forEach(opt => {
      const card = document.createElement('div');
      card.className = `avatar-card ${state.currentAvatarType === opt.id ? 'active' : ''}`;
      card.innerHTML = `
        <span class="avatar-icon">${opt.icon}</span>
        <span class="avatar-label">${opt.label}</span>
        <span class="avatar-desc">${opt.desc}</span>
      `;
      card.addEventListener('click', () => {
        state.currentAvatarType = opt.id;
        btn.querySelector('span').textContent = opt.icon;
        renderCards();
      });
      grid.appendChild(card);
    });
  }

  renderCards();

  // Toggle handlers
  btn.addEventListener('click', () => {
    modal.classList.add('open');
  });

  closeBtn.addEventListener('click', () => {
    modal.classList.remove('open');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('open');
    }
  });
}
