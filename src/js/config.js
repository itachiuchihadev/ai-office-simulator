// js/config.js — Shared configuration and state

export const AGENTS = [
  { id: 'manager',    name: 'Manager',    role: 'Orchestrator',  color: '#4F6EF7', emoji: '🧑‍💼', deskRoom: 'manager-desk',  spriteName: 'character_dark_hair_boy' },
  { id: 'researcher', name: 'Researcher', role: 'Data & Search', color: '#7C5CFC', emoji: '🔬', deskRoom: 'researcher-desk', spriteName: 'character_glasses_boy' },
  { id: 'coder',      name: 'Coder',      role: 'Code & Build',  color: '#22C55E', emoji: '👨‍💻', deskRoom: 'coder-desk',      spriteName: 'character_dark_hair_girl' },
  { id: 'writer',     name: 'Writer',     role: 'Content & Docs',color: '#F59E0B', emoji: '✍️', deskRoom: 'writer-desk',     spriteName: 'character_red_hair_girl' },
  { id: 'analyst',    name: 'Analyst',    role: 'Analytics',     color: '#EF4444', emoji: '📊', deskRoom: 'analyst-desk',    spriteName: 'character_blue_shirt_girl' },
  { id: 'designer',   name: 'Designer',   role: 'UI & Design',   color: '#EC4899', emoji: '🎨', deskRoom: 'designer-desk',   spriteName: 'character_designer_girl' },
];

// Mutable shared state (Internal resolution: 256x224 pixel-art coordinate space)
export const state = {
  canvas: null,
  ctx: null,
  canvasW: 256,
  canvasH: 224,
  scale: 1,
  zoom: 1.0, // Default 100% full view of entire office
  frameCount: 0,
  animationId: null,
  characters: {},
  demoRunning: false,
  currentAvatarType: 'pixel_sprites',
};
