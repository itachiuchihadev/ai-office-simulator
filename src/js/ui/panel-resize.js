import { initCanvasSize } from '../office/renderer.js';

export function setupPanelResize() {
  const divider = document.getElementById('panelDivider');
  const officePanel = document.getElementById('officePanel');
  const chatPanel = document.getElementById('chatPanel');
  if (!divider || !officePanel || !chatPanel) return;

  let dragging = false;

  divider.addEventListener('mousedown', (e) => {
    if (window.innerWidth <= 900) return;
    dragging = true;
    divider.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const container = document.getElementById('mainContent');
    const rect = container.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const clamped = Math.max(0.3, Math.min(0.7, ratio));
    officePanel.style.flex = `${clamped}`;
    chatPanel.style.flex = `${1 - clamped}`;
    initCanvasSize();
  });

  document.addEventListener('mouseup', () => {
    if (dragging) {
      dragging = false;
      divider.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      initCanvasSize();
    }
  });
}
