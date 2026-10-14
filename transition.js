/* Directional transitions. No analytics; fallback state is consumed on arrival. */
(() => {
  'use strict';
  const root = document.documentElement;
  const data = JSON.parse(document.getElementById('geometry-data').textContent);
  const keys = ['about', 'activities', 'publications', 'research', 'formalization'];
  function section(url) {
    const name = new URL(url).pathname.split('/').pop();
    if (!name || name === 'index.html' || name === 'zh.html') return -1;
    const index = keys.indexOf(name.replace(/-zh(?=\.html$)/, '').replace(/\.html$/, ''));
    return index < 0 ? -2 : index;
  }
  function direction(fromUrl, toUrl) {
    if (fromUrl.origin !== toUrl.origin) return null;
    const from = section(fromUrl), to = section(toUrl);
    let index, sign;
    if (from === -1 && to >= 0) { index = to; sign = 1; }
    else if (to === -1 && from >= 0) { index = from; sign = -1; }
    else return null;
    const [x,y] = data.vertices[index];
    const factor = sign*Math.min(180, innerWidth*.17)/Math.hypot(x,y);
    return { x:x*factor, y:-y*factor, mode:sign === 1 ? 'outward' : 'return' };
  }
  function apply(motion) {
    root.style.setProperty('--ray-x', `${motion.x.toFixed(2)}px`);
    root.style.setProperty('--ray-y', `${motion.y.toFixed(2)}px`);
    root.dataset.rayNavigation = motion.mode;
  }
  window.addEventListener('pagereveal', event => {
    delete root.dataset.rayNavigation;
    const transition = event.viewTransition;
    if (!transition) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      transition.skipTransition();
      return;
    }
    const activation = window.navigation?.activation;
    if (!activation?.from) return;
    const fromUrl = new URL(activation.from.url);
    const toUrl = new URL(activation.entry.url);
    const motion = direction(fromUrl, toUrl);
    if (motion) apply(motion);
  });
  if ('onpagereveal' in window && 'navigation' in window) return;
  // The short exit runs before normal navigation; a fresh page consumes entry state.
  const storageKey = 'atlas-pending-transition';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let departing = false;
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
    sessionStorage.removeItem(storageKey);
    if (saved && saved.to === location.href && Date.now()-saved.at < 10000 && !reduced.matches) {
      const motion = direction(new URL(saved.from), new URL(saved.to));
      if (motion) {
        apply(motion);
        root.classList.add('ray-entering');
        document.addEventListener('DOMContentLoaded', () => {
          document.querySelector('main')?.addEventListener('animationend', () => root.classList.remove('ray-entering'), {once:true});
          setTimeout(() => root.classList.remove('ray-entering'), 1000);
        }, {once:true});
      }
    }
  } catch { /* Navigation still works when browser storage is unavailable. */ }
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || reduced.matches) return;
    const link = event.target.closest?.('a[href]');
    if (!link || link.hasAttribute('download') || (link.getAttribute('target') && link.getAttribute('target') !== '_self')) return;
    const to = new URL(link.getAttribute('href'), location.href);
    const motion = direction(new URL(location.href), to);
    if (!motion) return;
    event.preventDefault();
    if (departing) return;
    departing = true;
    try { sessionStorage.setItem(storageKey, JSON.stringify({from:location.href, to:to.href, at:Date.now()})); } catch {}
    apply(motion);
    root.classList.remove('ray-entering');
    root.classList.add('ray-leaving');
    setTimeout(() => location.assign(to.href), 260);
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted) {
      departing = false;
      root.classList.remove('ray-leaving', 'ray-entering');
    }
  });
})();
