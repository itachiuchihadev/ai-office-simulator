// js/office/renderer.js — Canvas rendering engine with responsive spread-out layout & zoom controls

import { state } from '../config.js';
import { renderPixelOffice } from './pixel-renderer.js';
import { getOfficeLocations } from './rooms.js';

// ── Device-Adaptive Scaling Calculation ──────────────────

export function getDeviceBaseScale(width, height) {
  // Target virtual bounds for office elements (desks, rooms, lounge, fixtures)
  const targetW = 330;
  const targetH = 235;

  const scaleX = width / targetW;
  const scaleY = height / targetH;

  // Fit scale ensuring the entire office is comfortably framed
  const fitScale = Math.min(scaleX, scaleY);

  // Device-specific scaling boundaries
  if (width <= 480 || height <= 260) {
    // Compact mobile phones / narrow screens
    return Math.max(0.85, Math.min(1.3, fitScale));
  } else if (width <= 768 || height <= 450) {
    // Tablets / landscape mobile phones
    return Math.max(1.1, Math.min(1.8, fitScale));
  } else if (width <= 1200) {
    // Small laptops / portrait monitors
    return Math.max(1.5, Math.min(2.4, fitScale));
  } else {
    // Large desktop monitors
    return Math.max(2.0, Math.min(3.0, fitScale));
  }
}

// ── Canvas Setup with Device-Aware Dynamic Scaling ─────────

export function initCanvasSize() {
  const wrapper = document.getElementById('canvasWrapper');
  if (!wrapper || !state.canvas || !state.ctx) return;

  const rect = wrapper.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;
  const dpr = window.devicePixelRatio || 1;
  const { canvas, ctx } = state;

  // Zoom factor: default 1.0 (device-adaptive 100% framing)
  const zoomFactor = state.zoom !== undefined ? state.zoom : 1.0;

  // Base scale automatically computed according to current device dimensions
  const baseDeviceScale = getDeviceBaseScale(rect.width, rect.height);
  const pixelScale = Math.max(0.7, +(baseDeviceScale * zoomFactor).toFixed(3));
  state.scale = pixelScale;
  state.baseScale = baseDeviceScale;

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
  state.zoom = Math.min(2.5, Math.max(0.5, Number(newZoom.toFixed(2))));
  initCanvasSize();
  const zoomText = document.getElementById('zoomDisplay') || document.getElementById('zoomLevelText');
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
