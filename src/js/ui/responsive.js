// js/ui/responsive.js — Responsive & Mobile View Controller

import { initCanvasSize } from '../office/renderer.js';

let currentMode = 'split';

export function setupResponsiveControls() {
  const mainContent = document.getElementById('mainContent');
  const viewBar = document.getElementById('mobileViewBar');
  const officePanel = document.getElementById('officePanel');
  const chatPanel = document.getElementById('chatPanel');

  if (!mainContent || !viewBar) return;

  const tabButtons = viewBar.querySelectorAll('.mobile-tab-btn');

  function setViewMode(mode) {
    currentMode = mode;

    tabButtons.forEach(btn => {
      const isSelected = btn.dataset.mode === mode;
      btn.classList.toggle('active', isSelected);
      btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });

    mainContent.classList.remove('view-mode-split', 'view-mode-office', 'view-mode-chat');
    mainContent.classList.add(`view-mode-${mode}`);

    // If on mobile/tablet, clear desktop inline flex styles so CSS rules take precedence
    if (window.innerWidth <= 900) {
      if (officePanel) officePanel.style.flex = '';
      if (chatPanel) chatPanel.style.flex = '';
    }

    // Recalculate canvas size on next frame after CSS layout applied
    requestAnimationFrame(() => {
      initCanvasSize();
    });
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      if (mode) {
        setViewMode(mode);
      }
    });
  });

  // Handle window resizing and orientation changes smoothly
  let resizeTimer = null;
  const handleResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth > 900) {
        // In desktop mode, layout is handled by flex side-by-side
      } else {
        // In mobile mode, clear inline flex from desktop divider drags
        if (officePanel) officePanel.style.flex = '';
        if (chatPanel) chatPanel.style.flex = '';
      }
      initCanvasSize();
    }, 50);
  };

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', () => {
    setTimeout(handleResize, 100);
  });
}

export function getCurrentViewMode() {
  return currentMode;
}
