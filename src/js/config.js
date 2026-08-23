// js/config.js — Shared application state and canvas parameters

export const state = {
  canvas: null,
  ctx: null,
  canvasW: 256,
  canvasH: 224,
  scale: 1,
  zoom: 1.0,
  frameCount: 0,
  animationId: null,
  characters: {},
  demoRunning: false,
  currentAvatarType: 'pixel_sprites',
};
