/* Opt-in, streamed iTunes song preview. Never preload, loop, or retain audio. */
(() => {
  'use strict';
  const players = new Map();
  function turnOff(card, message = card.dataset.quiet) {
    const player = players.get(card);
    if (player) {
      players.delete(card); // Ignore events caused by releasing the media.
      clearTimeout(player.connectionTimeout);
      player.pause();
      player.removeAttribute('src');
      player.load();
      player.remove();
    }
    const button = card.querySelector('.music-toggle');
    button.setAttribute('aria-checked', 'false');
    button.removeAttribute('aria-busy');
    card.querySelector('.music-toggle-label').textContent = card.dataset.off;
    card.querySelector('.music-status').textContent = message;
  }
  function stopAll() {
    // Keep references until stopped, even if a dialog's content was removed.
    for (const card of [...players.keys()]) turnOff(card);
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('.music-toggle');
    if (!button) return;
    const card = button.closest('[data-music-card]');
    if (players.has(card)) return turnOff(card);
    stopAll();
    const player = document.createElement('audio');
    player.hidden = true;
    player.preload = 'none';
    player.loop = false;
    player.setAttribute('aria-hidden', 'true');
    // Official previewUrl from Apple's lookup API. No local audio copy.
    player.src = card.dataset.preview;
    players.set(card, player);
    card.append(player);
    button.setAttribute('aria-checked', 'true');
    button.setAttribute('aria-busy', 'true');
    card.querySelector('.music-toggle-label').textContent = card.dataset.on;
    card.querySelector('.music-status').textContent = card.dataset.loading;
    const current = () => players.get(card) === player;
    const failed = () => { if (current()) turnOff(card, card.dataset.failed); };
    player.connectionTimeout = setTimeout(failed, 20000);
    player.addEventListener('playing', () => {
      if (!current()) return;
      clearTimeout(player.connectionTimeout);
      button.removeAttribute('aria-busy');
      card.querySelector('.music-status').textContent = card.dataset.active;
    });
    const finished = () => { if (current()) turnOff(card, card.dataset.ended); };
    player.addEventListener('ended', finished);
    player.addEventListener('timeupdate', () => { if (player.currentTime >= 30) finished(); });
    player.addEventListener('error', failed);
    // Call synchronously in the user gesture, including in Safari/iOS.
    try { player.play().catch(failed); } catch (_) { failed(); }
  });
  // Capture before the note body is cleared. No background or cross-page play.
  document.addEventListener('close', stopAll, true);
  document.addEventListener('cancel', stopAll, true);
  window.addEventListener('pagehide', stopAll);
  window.addEventListener('pageshow', stopAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopAll(); });
})();
