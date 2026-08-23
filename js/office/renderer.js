// js/office/renderer.js — Canvas rendering engine with responsive spread-out layout & zoom controls

import { state } from '../config.js';
import { renderPixelOffice } from './pixel-renderer.js';
import { getOfficeLocations } from './rooms.js';

// ── Canvas Setup with Dynamic Full-Width Scaling ─────────

export function initCanvasSize() {
  const wrapper = document.getElementById('canvasWrapper');
  if (!wrapper || !state.canvas || !state.ctx) return;

  const rect = wrapper.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const { canvas, ctx } = state;

  // Zoom factor: default 1.0 (zoomed out to show spacious spread-out floor)
  const zoomFactor = state.zoom !== undefined ? state.zoom : 1.0;
  
  // Set scale so objects are small and compact, with room for expansive tiles
  const pixelScale = Math.max(1, 2.2 * zoomFactor);
  state.scale = pixelScale;

  state.canvasW = Math.round(rect.width / pixelScale);
  state.canvasH = Math.round(rect.height / pixelScale);

  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr * pixelScale, dpr * pixelScale);

  // Sync character homes if idle
  const locs = getOfficeLocations();
  Object.keys(locs.CHARACTER_HOMES).forEach(id => {
    const char = state.characters[id];
    if (char && char.state === 'idle' && char.path.length === 0) {
      char.x = locs.CHARACTER_HOMES[id].x;
      char.y = locs.CHARACTER_HOMES[id].y;
    }
  });
}

export function setZoom(newZoom) {
  state.zoom = Math.min(2.5, Math.max(0.5, newZoom));
  initCanvasSize();
  const zoomText = document.getElementById('zoomLevelText');
  if (zoomText) {
    zoomText.textContent = `${Math.round(state.zoom * 100)}%`;
  }
}

// ── Main Render Loop ─────────────────────────────────────

function render() {
  const { ctx, canvasW, canvasH } = state;
  if (ctx) {
    ctx.save();
    ctx.clearRect(0, 0, canvasW + 50, canvasH + 50);

    renderPixelOffice();

    ctx.restore();
  }

  state.frameCount++;
  state.animationId = requestAnimationFrame(render);
}

export function startRenderLoop() {
  if (state.animationId) {
    cancelAnimationFrame(state.animationId);
  }
  render();
}
