// js/office/characters.js — Character sprite drawing, strictly orthogonal movement, A* pathfinding & speech bubbles

import { state, AGENTS } from '../config.js';
import { getOfficeLocations } from './rooms.js';
import { findPathAStar } from './navigation-grid.js';

// ── Character Initialization ─────────────────────────────

export function initCharacters() {
  const locs = getOfficeLocations();
  AGENTS.forEach(agent => {
    const existing = state.characters[agent.id];
    const home = locs.CHARACTER_HOMES[agent.id] || { x: 128, y: 114 };
    state.characters[agent.id] = {
      ...agent,
      ...(existing || {}),
      x: home.x,
      y: home.y,
      targetX: home.x,
      targetY: home.y,
      state: 'idle',
      bobOffset: existing?.bobOffset || Math.random() * Math.PI * 2,
      path: [],
      pathIndex: 0,
      speed: 1.0,
      facing: 'down',
    };
  });
}

// ── Movement & A* Navigation Algorithm ───────────────────

export function moveCharacterTo(charId, destX, destY, onArriveState = 'idle', onArrive = null) {
  const char = state.characters[charId];
  if (!char) return;

  // Use strictly orthogonal A* pathfinding on blue floor tiles
  char.path = findPathAStar(char.x, char.y, destX, destY);
  char.pathIndex = 0;
  char.speed = 1.0;
  char.state = 'walking';
  char.onArriveState = onArriveState;
  char.onArrive = onArrive;
}

export function moveCharacterHome(charId, onArrive = null) {
  const locs = getOfficeLocations();
  const home = locs.CHARACTER_HOMES[charId];
  if (home) {
    moveCharacterTo(charId, home.x, home.y, 'idle', onArrive);
  }
}

/**
 * Updates character position strictly in horizontal or vertical directions.
 * Fully resolves horizontal offset first, then vertical — no zig-zag.
 */
export function updateCharacterPosition(char) {
  if (char.path && char.path.length > 0 && char.pathIndex < char.path.length) {
    const target = char.path[char.pathIndex];
    const dx = target.x - char.x;
    const dy = target.y - char.y;

    // If arrived at waypoint (sub-pixel tolerance), snap and advance
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
      char.x = target.x;
      char.y = target.y;
      char.pathIndex++;

      if (char.pathIndex >= char.path.length) {
        char.state = char.onArriveState || 'idle';
        if (char.onArrive) {
          const callback = char.onArrive;
          char.onArrive = null;
          callback();
        }
      }
      return;
    }

    char.state = 'walking';

    // Strictly orthogonal: fully complete horizontal movement, then vertical
    if (Math.abs(dx) >= 0.5) {
      char.x += Math.sign(dx) * Math.min(char.speed, Math.abs(dx));
      char.facing = dx > 0 ? 'right' : 'left';
    } else if (Math.abs(dy) >= 0.5) {
      char.y += Math.sign(dy) * Math.min(char.speed, Math.abs(dy));
      char.facing = dy > 0 ? 'down' : 'up';
    }
  } else if (!char.facing) {
    char.facing = 'down';
  }
}

// ── Speech Bubbles ────────────────────────────────────────

export function showSpeechBubble(charId, text, duration = 3000) {
  const layer = document.getElementById('speechBubbleLayer');
  const char = state.characters[charId];
  if (!char || !layer) return;

  const bubble = document.createElement('div');
  bubble.className = 'speech-bubble';
  bubble.textContent = text;

  const updatePos = () => {
    const scale = state.scale || 1;
    const bx = char.x * scale;
    const by = (char.y - 24) * scale;

    bubble.style.left = `${bx}px`;
    bubble.style.top = `${by}px`;
    bubble.style.transform = 'translate(-50%, -100%)';
  };

  updatePos();
  layer.appendChild(bubble);

  const posInterval = setInterval(updatePos, 30);

  setTimeout(() => {
    clearInterval(posInterval);
    bubble.style.opacity = '0';
    bubble.style.transition = 'opacity 0.25s ease';
    setTimeout(() => bubble.remove(), 250);
  }, duration);
}

// ── Idle Activity Routines ────────────────────────────────

export function startIdleAnimations() {
  setInterval(() => {
    if (state.demoRunning) return;

    const idleAgents = Object.values(state.characters).filter(
      c => c.state === 'idle' && c.path.length === 0
    );

    if (idleAgents.length > 0 && Math.random() < 0.25) {
      const locs = getOfficeLocations();
      const activities = [
        { dest: locs.COFFEE_BAR, msg: '☕ Grabbing coffee...', state: 'idle', stayMs: 3500 },
        { dest: locs.VENDING_MACHINE, msg: '🍫 Getting a snack...', state: 'idle', stayMs: 3000 },
        { dest: locs.LOUNGE_SOFA, msg: '🛋️ Taking 5 on the sofa...', state: 'idle', stayMs: 4500 },
        { dest: locs.FILE_CABINET, msg: '📂 Checking archive files...', state: 'working', stayMs: 4000 },
        { dest: locs.PRINTER_STATION, msg: '🖨️ Printing document...', state: 'working', stayMs: 3500 },
        { dest: locs.PET_AREA, msg: '🐶 Petting the corgi & cat...', state: 'talking', stayMs: 4000 },
      ];

      const agent = idleAgents[Math.floor(Math.random() * idleAgents.length)];
      const activity = activities[Math.floor(Math.random() * activities.length)];

      moveCharacterTo(agent.id, activity.dest.x, activity.dest.y, activity.state, () => {
        showSpeechBubble(agent.id, activity.msg, Math.min(2500, activity.stayMs));
        setTimeout(() => {
          if (!state.demoRunning && agent.state !== 'walking') {
            moveCharacterHome(agent.id);
          }
        }, activity.stayMs);
      });
    }
  }, 6000);
}
