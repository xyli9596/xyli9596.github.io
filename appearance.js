/* One local appearance preference; no network requests or visitor tracking. */
(() => {
  'use strict';
  const root = document.documentElement;
  const key = 'xingyu-academic-appearance';
  const zh = root.lang.startsWith('zh');
  function savedTheme() {
    try { return localStorage.getItem(key) === 'cosmos' ? 'cosmos' : 'paper'; }
    catch { return 'paper'; }
  }
  function apply(theme) {
    const dark = theme === 'cosmos';
    root.dataset.theme = dark ? 'cosmos' : 'paper';
    root.style.colorScheme = dark ? 'dark' : 'light';
    document.body?.classList.toggle('theme-cosmos', dark);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = dark ? '#080f1c' : '#faf9f4';
    const button = document.querySelector('[data-theme-toggle]');
    if (!button) return;
    const action = zh ? (dark ? '切换至浅色模式' : '切换至深色模式') : (dark ? 'Switch to light mode' : 'Switch to dark mode');
    button.setAttribute('aria-label', action);
    button.title = action;
    button.querySelector('.theme-label').textContent = zh ? (dark ? '浅色' : '深色') : (dark ? 'Light' : 'Dark');
  }
  root.classList.add('appearance-enabled');
  // A first visit always starts on warm paper, regardless of the OS theme.
  apply(savedTheme());
  document.addEventListener('DOMContentLoaded', () => {
    apply(root.dataset.theme);
    document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
      const theme = root.dataset.theme === 'cosmos' ? 'paper' : 'cosmos';
      apply(theme);
      try { localStorage.setItem(key, theme); } catch { /* Navigation remains usable without storage. */ }
    });
  }, {once:true});
  window.addEventListener('pageshow', () => apply(savedTheme()));
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) apply(savedTheme());
  });
})();
