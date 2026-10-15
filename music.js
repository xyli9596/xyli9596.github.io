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
    player.title = 'Apple Music · G.E.M. 邓紫棋 — 光年之外';
    // Official single-song embed, verified in Apple Music Marketing Tools.
    // Expanding the card does not start playback; use Apple's native play button.
    player.src = 'https://embed.music.apple.com/cn/album/%E5%85%89%E5%B9%B4%E4%B9%8B%E5%A4%96-%E7%94%B5%E5%BD%B1-%E5%A4%AA%E7%A9%BA%E6%97%85%E5%AE%A2-%E4%B8%BB%E9%A2%98%E6%9B%B2/1190070714?i=1190070744&itscg=30200&itsct=music_box_player&ls=1&app=music&mttnsubad=1190070744&theme=auto';
    player.allow = 'autoplay *; encrypted-media *; clipboard-write';
    player.setAttribute('sandbox', 'allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation');
    player.referrerPolicy = 'strict-origin-when-cross-origin';
    player.height = '175';
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
