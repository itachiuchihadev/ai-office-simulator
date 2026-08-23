import { state } from './config.js';
import { initCanvasSize, startRenderLoop, setZoom } from './office/renderer.js';
import { startIdleAnimations } from './office/characters.js';
import { applyActiveSubagentsToState } from './agents/subagent-manager.js';
import { setupChatInput } from './chat/chat-ui.js';
import { setupVoiceInput } from './chat/voice-input.js';
import { setupThemeToggle } from './ui/theme.js';
import { setupFullscreen } from './ui/fullscreen.js';
import { setupPanelResize } from './ui/panel-resize.js';
import { setupSettingsModal } from './ui/settings-modal.js';
import { setupTeamModal } from './ui/team-modal.js';

function setupZoomControls() {
  const zoomIn = document.getElementById('zoomInBtn');
  const zoomOut = document.getElementById('zoomOutBtn');
  const zoomReset = document.getElementById('zoomResetBtn');

  if (zoomIn) {
    zoomIn.addEventListener('click', () => {
      setZoom((state.zoom || 1.0) + 0.15);
    });
  }
  if (zoomOut) {
    zoomOut.addEventListener('click', () => {
      setZoom((state.zoom || 1.0) - 0.15);
    });
  }
  if (zoomReset) {
    zoomReset.addEventListener('click', () => {
      setZoom(1.0);
    });
  }
}

function init() {
  state.canvas = document.getElementById('officeCanvas');
  if (!state.canvas) return;
  state.ctx = state.canvas.getContext('2d');

  // Initialize active subagents and place on canvas
  applyActiveSubagentsToState();
  initCanvasSize();

  setupZoomControls();
  setupTeamModal();
  setupThemeToggle();
  setupFullscreen();
  setupPanelResize();
  setupSettingsModal();
  setupChatInput();
  setupVoiceInput();

  startRenderLoop();
  startIdleAnimations();

  window.addEventListener('resize', initCanvasSize);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
