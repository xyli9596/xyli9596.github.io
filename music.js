/* Music is opt-in, per opening. No player request or saved listening state. */
(() => {
  'use strict';
  function turnOff(card) {
    card.querySelector('.music-player').replaceChildren();
    card.querySelector('.music-player').hidden = true;
    card.querySelector('.music-toggle').setAttribute('aria-checked', 'false');
    card.querySelector('.music-toggle-label').textContent = card.dataset.off;
    card.querySelector('.music-status').textContent = card.dataset.quiet;
  }
  function stopAll() {
    document.querySelectorAll('[data-music-card]').forEach(turnOff);
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('.music-toggle');
    if (!button) return;
    const card = button.closest('[data-music-card]');
    if (button.getAttribute('aria-checked') === 'true') return turnOff(card);
    stopAll();
    const host = card.querySelector('.music-player');
    const player = document.createElement('iframe');
    player.title = '网易云音乐 · G.E.M. 邓紫棋 — 光年之外';
    // NetEase's official audio widget. Load only after the visitor opts in.
    player.src = 'https://music.163.com/outchain/player?type=2&id=449818741&auto=1&height=66';
    player.allow = 'autoplay';
    player.referrerPolicy = 'strict-origin-when-cross-origin';
    host.replaceChildren(player);
    host.hidden = false;
    button.setAttribute('aria-checked', 'true');
    card.querySelector('.music-toggle-label').textContent = card.dataset.on;
    card.querySelector('.music-status').textContent = card.dataset.active;
  });
  // Native dialog close is non-bubbling, so listen in capture phase.
  document.addEventListener('close', stopAll, true);
  window.addEventListener('pagehide', stopAll);
  window.addEventListener('pageshow', stopAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopAll(); });
})();
