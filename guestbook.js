/* One existing GitHub discussion shared by both language versions. */
(() => {
  'use strict';
  const host = document.querySelector('[data-guestbook]');
  if (!host || host.dataset.enabled !== 'true') return;
  const root = document.documentElement;
  const theme = () => root.dataset.theme === 'cosmos' ? 'noborder_dark' : 'noborder_light';
  const script = document.createElement('script');
  script.src = 'https://giscus.app/client.js';
  script.async = true;
  script.crossOrigin = 'anonymous';
  const config = {
    repo: host.dataset.repo,
    'repo-id': host.dataset.repoId,
    mapping: 'number',
    term: host.dataset.discussion,
    strict: '0',
    'reactions-enabled': '0',
    'emit-metadata': '0',
    'input-position': 'top',
    theme: theme(),
    lang: root.lang.startsWith('zh') ? 'zh-CN' : 'en'
  };
  for (const [key, value] of Object.entries(config)) script.setAttribute('data-' + key, value);
  host.append(script);
  new MutationObserver(() => {
    const frame = host.querySelector('iframe.giscus-frame');
    frame?.contentWindow.postMessage({giscus: {setConfig: {theme: theme()}}}, 'https://giscus.app');
  }).observe(root, {attributes: true, attributeFilter: ['data-theme']});
})();
