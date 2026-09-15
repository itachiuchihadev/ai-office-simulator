import { state } from './config.js';
import { initCanvasSize, startRenderLoop, setZoom } from './office/renderer.js';
import { startIdleAnimations } from './office/characters.js';
import { applyActiveSubagentsToState } from './agents/subagent-manager.js';
import { setupChatInput } from './chat/chat-ui.js';
import { setupVoiceInput } from './chat/voice-input.js';
import { setupThemeToggle } from './ui/theme.js';
import { setupFullscreen } from './ui/fullscreen.js';
import { setupPanelResize } from './ui/panel-resize.js';
import { setupResponsiveControls } from './ui/responsive.js';
import { setupSettingsModal } from './ui/settings-modal.js';
import { setupTeamModal } from './ui/team-modal.js';
import { initModelSelector } from './api/llm-client.js';
import { trackMetric } from './telemetry.js';


function setupZoomControls() {
  const zoomIn = document.getElementById('zoomInBtn');
  const zoomOut = document.getElementById('zoomOutBtn');
  const zoomReset = document.getElementById('zoomResetBtn');
  const wrapper = document.getElementById('canvasWrapper');

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

  // Touch pinch-to-zoom support for mobile devices
  if (wrapper) {
    let initialTouchDist = null;
    let initialZoom = 1.0;

    wrapper.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        initialTouchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialZoom = state.zoom || 1.0;
      }
    }, { passive: true });

    wrapper.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && initialTouchDist) {
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const scaleFactor = currentDist / initialTouchDist;
        setZoom(initialZoom * scaleFactor);
      }
    }, { passive: true });

    wrapper.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) {
        initialTouchDist = null;
      }
    }, { passive: true });

    // Mouse wheel zoom (Ctrl + Wheel)
    wrapper.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.1 : -0.1;
        setZoom((state.zoom || 1.0) + delta);
      }
    }, { passive: false });
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
  setupResponsiveControls();
  setupSettingsModal();
  initModelSelector();
  setupChatInput();

  setupVoiceInput();

  startRenderLoop();
  startIdleAnimations();

  // Track initial page visit anonymously
  trackMetric('page_visit');

  window.addEventListener('resize', initCanvasSize);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
