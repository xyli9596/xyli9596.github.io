/* Appearance is kept within this tab's visit; a new visit starts on warm paper. */
(() => {
  'use strict';
  const root = document.documentElement;
  const key = 'xingyu-academic-appearance-session';
  const zh = root.lang.startsWith('zh');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let changing = false;
  function savedTheme() {
    try { return sessionStorage.getItem(key) === 'cosmos' ? 'cosmos' : 'paper'; }
    catch { return 'paper'; }
  }
  function apply(theme) {
    const dark = theme === 'cosmos';
    root.dataset.theme = dark ? 'cosmos' : 'paper';
    root.style.colorScheme = dark ? 'dark' : 'light';
    document.body?.classList.toggle('theme-cosmos', dark);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = dark ? '#050b16' : '#faf9f4';
    const button = document.querySelector('[data-theme-toggle]');
    if (!button) return;
    const action = zh ? (dark ? '切换至浅色模式' : '切换至深色模式') : (dark ? 'Switch to light mode' : 'Switch to dark mode');
    button.setAttribute('aria-label', action);
    button.title = action;
    button.querySelector('.theme-label').textContent = zh ? (dark ? '浅色' : '深色') : (dark ? 'Light' : 'Dark');
  }
  root.classList.add('appearance-enabled');
  apply(savedTheme());
  document.addEventListener('DOMContentLoaded', () => {
    apply(root.dataset.theme);
    document.querySelector('[data-theme-toggle]')?.addEventListener('click', async event => {
      if (changing) return;
      const theme = root.dataset.theme === 'cosmos' ? 'paper' : 'cosmos';
      const update = () => {
        apply(theme);
        try { sessionStorage.setItem(key, theme); } catch { /* Theme still works without storage. */ }
      };
      if (!document.startViewTransition || reduced.matches) return update();
      changing = true;
      const box = event.currentTarget.getBoundingClientRect();
      const x = box.left+box.width/2, y = box.top+box.height/2;
      root.style.setProperty('--theme-x', `${x}px`);
      root.style.setProperty('--theme-y', `${y}px`);
      root.style.setProperty('--theme-radius', `${Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y))}px`);
      root.classList.add('theme-revealing');
      try {
        const reveal = document.startViewTransition(update);
        await reveal.finished;
      } catch { update(); }
      finally { root.classList.remove('theme-revealing'); changing = false; }
    });
  }, {once:true});
  window.addEventListener('pageshow', () => apply(savedTheme()));
})();
