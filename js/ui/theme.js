// js/ui/theme.js — Theme Management (Dark Mode Default + Local Storage Persistence)

export function setupThemeToggle() {
  const html = document.documentElement;
  const saved = localStorage.getItem('office_theme') || 'dark';
  html.setAttribute('data-theme', saved);

  const btn = document.getElementById('themeToggle');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('office_theme', next);
  });
}
