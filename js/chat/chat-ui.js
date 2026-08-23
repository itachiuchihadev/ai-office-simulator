import { runWorkflow } from '../agents/workflow.js';

const CHARACTER_SPRITES = {
  'manager': '/assets/extracted_assets/all/character_dark_hair_boy.png',
  'researcher': '/assets/extracted_assets/all/character_glasses_boy.png',
  'coder': '/assets/extracted_assets/all/character_dark_hair_girl.png',
  'writer': '/assets/extracted_assets/all/character_red_hair_girl.png',
  'analyst': '/assets/extracted_assets/all/character_blue_shirt_girl.png',
  'designer': '/assets/extracted_assets/all/character_designer_girl.png',
  'character_dark_hair_boy': '/assets/extracted_assets/all/character_dark_hair_boy.png',
  'character_glasses_boy': '/assets/extracted_assets/all/character_glasses_boy.png',
  'character_dark_hair_girl': '/assets/extracted_assets/all/character_dark_hair_girl.png',
  'character_red_hair_girl': '/assets/extracted_assets/all/character_red_hair_girl.png',
  'character_blue_shirt_girl': '/assets/extracted_assets/all/character_blue_shirt_girl.png',
  'character_designer_girl': '/assets/extracted_assets/all/character_designer_girl.png',
  'character_blond_boy': '/assets/extracted_assets/all/character_blond_boy.png',
  '🧑‍💼': '/assets/extracted_assets/all/character_dark_hair_boy.png',
  '🔬': '/assets/extracted_assets/all/character_glasses_boy.png',
  '👨‍💻': '/assets/extracted_assets/all/character_dark_hair_girl.png',
  '✍️': '/assets/extracted_assets/all/character_red_hair_girl.png',
  '📊': '/assets/extracted_assets/all/character_blue_shirt_girl.png',
  '🎨': '/assets/extracted_assets/all/character_designer_girl.png',
  'user': '/assets/extracted_assets/all/user_avatar.png',
  '👤': '/assets/extracted_assets/all/user_avatar.png',
};

export function getAvatarSpriteUrl(identifier, type = 'ai') {
  if (type === 'user') {
    return '/assets/extracted_assets/all/user_avatar.png';
  }
  if (!identifier) {
    return '/assets/extracted_assets/all/character_dark_hair_boy.png';
  }
  if (typeof identifier === 'object' && identifier.spriteName) {
    identifier = identifier.spriteName;
  }
  if (identifier.startsWith('/') || identifier.startsWith('http') || identifier.startsWith('data:')) {
    return identifier;
  }
  if (CHARACTER_SPRITES[identifier]) {
    return CHARACTER_SPRITES[identifier];
  }
  return `/assets/extracted_assets/all/${identifier}.png`;
}

function createAvatarElement(identifier, type) {
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  const imgUrl = getAvatarSpriteUrl(identifier, type);

  const img = document.createElement('img');
  img.src = imgUrl;
  img.alt = type === 'user' ? 'User' : (identifier || 'Agent');
  img.onerror = () => {
    img.remove();
    avatar.textContent = type === 'user' ? '👤' : (identifier && identifier.length <= 4 ? identifier : '🧑‍💼');
  };
  avatar.appendChild(img);
  return avatar;
}

export function addChatMessage(sender, text, type = 'ai', avatarParam = null) {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  const welcome = container.querySelector('.welcome-message');
  if (welcome) welcome.remove();

  const msg = document.createElement('div');
  msg.className = `message ${type}`;

  const avatar = createAvatarElement(avatarParam || (type === 'user' ? 'user' : 'manager'), type);

  const content = document.createElement('div');
  content.className = 'message-body-wrap';

  let senderDisplayName = '';
  if (type === 'user') {
    senderDisplayName = 'USER';
  } else if (sender && sender !== 'ai') {
    senderDisplayName = sender.toUpperCase();
  } else {
    senderDisplayName = 'AI AGENT';
  }

  const senderTag = document.createElement('div');
  senderTag.className = 'message-sender-tag';
  senderTag.textContent = `[${senderDisplayName}]`;

  const bubble = document.createElement('div');
  bubble.className = 'message-content';
  bubble.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');

  const meta = document.createElement('div');
  meta.className = 'message-meta';
  meta.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  content.appendChild(senderTag);
  content.appendChild(bubble);
  content.appendChild(meta);
  msg.appendChild(avatar);
  msg.appendChild(content);
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

export function addTypingIndicator(agentIdentifier = 'manager') {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  const msg = document.createElement('div');
  msg.className = 'message ai';
  msg.id = 'typingMsg';

  const avatar = createAvatarElement(agentIdentifier, 'ai');

  const content = document.createElement('div');
  content.className = 'message-content';
  content.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';

  msg.appendChild(avatar);
  msg.appendChild(content);
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

export function removeTypingIndicator() {
  const el = document.getElementById('typingMsg');
  if (el) el.remove();
}

export function setupChatInput() {
  const input = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');

  if (!input || !sendBtn) return;

  input.addEventListener('input', () => {
    sendBtn.disabled = !input.value.trim();
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  sendBtn.addEventListener('click', handleSend);
}

function handleSend() {
  const input = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const text = input.value.trim();
  if (!text) return;

  addChatMessage('user', text, 'user');
  input.value = '';
  input.style.height = 'auto';
  sendBtn.disabled = true;

  addTypingIndicator();

  setTimeout(() => {
    removeTypingIndicator();
    runWorkflow(text);
  }, 1000);
}
