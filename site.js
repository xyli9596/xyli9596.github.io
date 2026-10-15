/* Convex-hull normal fan. No analytics, external scripts, or stored visitor data. */
(() => {
  'use strict';
  document.documentElement.classList.add('js');
  // Preserve section links from the previous single-page homepage.
  function followLegacyAnchor() {
    if (!document.body.classList.contains('home')) return false;
    const link = [...document.querySelectorAll('.legacy-anchors a')].find(el => '#'+el.id === location.hash);
    if (!link) return false;
    location.replace(link.href);
    return true;
  }
  if (followLegacyAnchor()) return;
  window.addEventListener('hashchange', followLegacyAnchor);
  document.querySelectorAll('[data-language-switch]').forEach(link => {
    if (location.hash) link.href += location.hash;
  });
  const map = document.querySelector('.geometry');
  if (!map) return;
  const data = JSON.parse(document.getElementById('geometry-data').textContent);
  const svg = map.querySelector('svg');
  const slider = document.getElementById('direction');
  const controls = document.querySelector('.geometry-controls');
  const angle = document.getElementById('angle');
  const selected = document.getElementById('selected-link');
  const peer = document.createElement('a');
  peer.className = 'selection-peer';
  peer.hidden = true;
  selected.after(peer);
  const rotate = document.getElementById('rotate');
  const caption = document.getElementById('story-caption');
  const keywordDescription = document.getElementById('keyword-description');
  const steps = [...document.querySelectorAll('[data-step]')];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const viewport = matchMedia('(max-width: 620px)');
  let frame = null, previous = null, running = false, theta = 58.63, active = -1, activeView = '';
  const radians = degrees => degrees * Math.PI / 180;
  const degrees = radians => radians * 180 / Math.PI;
  const set = (node, attrs) => Object.entries(attrs).forEach(([k,v]) => node.setAttribute(k, v));
  const xy = ([x,y]) => [560+x*data.scale, 292-y*data.scale];

  function resize() {
    svg.setAttribute('viewBox', viewport.matches ? '300 48 520 500' : '0 0 1120 620');
  }
  viewport.addEventListener('change', resize);
  resize();

  function highlight(i, tied = []) {
    const visible = tied.length > 1 ? tied : [i];
    const view = visible.join(',');
    if (view !== activeView || i !== active) {
      active = i;
      activeView = view;
      map.dataset.active = String(i);
      map.dataset.atBoundary = String(tied.length > 1);
      selected.textContent = data.labels[i] + ' ↗';
      selected.href = data.links[i];
      const other = tied.find(j => j !== i);
      peer.hidden = other === undefined;
      if (other !== undefined) { peer.href = data.links[other]; peer.textContent = data.labels[other] + ' ↗'; }
      document.querySelectorAll('[data-sector]').forEach(el => {
        el.classList.toggle('is-active', visible.includes(+el.dataset.sector));
        el.classList.toggle('is-tied', tied.includes(+el.dataset.sector));
      });
      document.querySelectorAll('.mobile-region').forEach(el => el.classList.toggle('is-active', visible.includes(+el.dataset.category)));
      document.querySelectorAll('[data-keyword-group]').forEach(el => { el.hidden = !visible.includes(+el.dataset.keywordGroup); });
      map.querySelectorAll('.keyword-point,.keyword-connection').forEach(el => el.classList.toggle('is-category-active', visible.includes(+el.dataset.category)));
      clearKeyword();
    }
    map.querySelectorAll('[data-vertex]').forEach((el,j) => {
      el.classList.toggle('is-active', j === i);
      el.classList.toggle('is-tied', tied.includes(j));
    });
    map.querySelectorAll('[data-ray]').forEach((el,j) => el.classList.toggle('is-boundary', tied.includes(j) && tied.includes((j+1)%5)));
  }

  function render(value, snap = false) {
    theta = ((value % 360) + 360) % 360;
    // An exact normal can be reached with the slider, despite its 0.1° steps.
    if (snap) for (const normal of data.normals) {
      const difference = Math.abs(((theta-degrees(normal)+540)%360)-180);
      if (difference < .75) theta = degrees(normal);
    }
    const n = [Math.cos(radians(theta)), Math.sin(radians(theta))];
    const values = data.vertices.map(v => v[0]*n[0]+v[1]*n[1]);
    const h = Math.max(...values);
    const tied = values.flatMap((v,i) => Math.abs(v-h)<1e-7 ? [i] : []);
    // At a critical ray, either adjacent region is a valid maximizer.
    const index = tied.includes(active) ? active : tied[0];
    highlight(index, tied.length > 1 ? tied : []);
    const foot = [h*n[0], h*n[1]], tangent = [-n[1], n[0]];
    const p = xy([foot[0]-tangent[0]*2.1, foot[1]-tangent[1]*2.1]);
    const q = xy([foot[0]+tangent[0]*2.1, foot[1]+tangent[1]*2.1]);
    set(map.querySelector('.support-line'),{x1:p[0],y1:p[1],x2:q[0],y2:q[1]});
    const tip = xy([n[0]*(h+.6), n[1]*(h+.6)]);
    set(map.querySelector('.direction-vector'),{x2:tip[0],y2:tip[1]});
    set(map.querySelector('.direction-tip'),{cx:tip[0],cy:tip[1]});
    set(map.querySelector('.theta-label'),{x:tip[0]+9,y:tip[1]-9});
    angle.value = Math.round(theta) + '°';
    slider.value = snap ? value : theta;
    slider.setAttribute('aria-valuetext', Math.round(theta) + '°, ' + tied.map(i=>data.labels[i]).join(' / '));
    if (map.dataset.stage === '2') caption.textContent = tied.length > 1 ? data.boundary : data.captions[2];
  }

  function setStage(stage) {
    map.dataset.stage = String(stage);
    controls.dataset.stage = String(stage);
    caption.textContent = data.captions[stage];
    steps.forEach((el,i) => el.setAttribute('aria-pressed', String(i === stage)));
    slider.disabled = stage !== 2;
    rotate.disabled = stage !== 2;
    if (stage !== 2) stop();
  }
  function stop() {
    running = false;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    previous = null;
    rotate.textContent = data.play;
    rotate.setAttribute('aria-pressed','false');
  }
  function tick(now) {
    if (!running) return;
    if (previous !== null) render(theta + Math.min(now-previous,100)*.013);
    previous = now;
    frame = requestAnimationFrame(tick);
  }
  rotate.addEventListener('click', () => {
    if (running) return stop();
    running = true;
    rotate.textContent = data.pause;
    rotate.setAttribute('aria-pressed','true');
    frame = requestAnimationFrame(tick);
  });
  slider.addEventListener('input', () => { stop(); render(Number(slider.value),true); });
  steps.forEach((el,i) => el.addEventListener('click', () => setStage(i)));
  function selectRegion(index) {
    stop();
    let a = data.normals[(index+4)%5], b = data.normals[index];
    if (b<a) b += 2*Math.PI;
    render(degrees((a+b)/2));
  }
  document.querySelectorAll('[data-sector]').forEach(el => {
    el.addEventListener('pointerenter', () => {
      if (map.dataset.stage === '2') selectRegion(+el.dataset.sector);
    });
    el.addEventListener('focus', () => selectRegion(+el.dataset.sector));
  });
  map.querySelectorAll('[data-boundary]').forEach(el => {
    el.addEventListener('pointerenter', () => {
      if (map.dataset.stage !== '2') return;
      stop();
      render(degrees(data.normals[+el.dataset.boundary]));
    });
  });
  document.querySelectorAll('.mobile-region').forEach(el => {
    el.addEventListener('focus', () => selectRegion(+el.dataset.category));
  });
  function clearKeyword() {
    document.querySelectorAll('[data-keyword],[data-keyword-connection]').forEach(el=>el.classList.remove('is-keyword-active'));
    keywordDescription.textContent = data.keyword_default;
  }
  function showKeyword(id) {
    const topic = data.topics[id];
    selectRegion(topic.category);
    clearKeyword();
    document.querySelectorAll('[data-keyword],[data-keyword-connection]').forEach(el=> {
      el.classList.toggle('is-keyword-active', (el.dataset.keyword || el.dataset.keywordConnection) === id);
    });
    keywordDescription.textContent = topic.description;
  }
  document.querySelectorAll('[data-keyword]').forEach(el=> {
    el.addEventListener('pointerenter',()=>showKeyword(el.dataset.keyword));
    el.addEventListener('focus',()=>showKeyword(el.dataset.keyword));
    el.addEventListener('pointerleave',()=> { if (document.activeElement !== el) clearKeyword(); });
    el.addEventListener('blur',clearKeyword);
  });
  // The small rings in the margins open a short note without losing the map.
  const noteDialog = document.getElementById('note-dialog');
  const noteBody = noteDialog.querySelector('.note-body');
  // Note positions are compositional: they do not select neighboring topics.
  document.querySelectorAll('[data-note]').forEach(link => {
    link.addEventListener('pointerenter', stop);
    link.addEventListener('focus', stop);
    link.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || typeof noteDialog.showModal !== 'function') return;
      const template = document.getElementById('note-template-'+link.dataset.note);
      if (!template) return;
      event.preventDefault();
      stop();
      // In the star-atlas preview, approach the note from its position in space.
      const origin = link.getBoundingClientRect();
      const dx = Math.max(-160,Math.min(160,origin.left+origin.width/2-innerWidth/2));
      const dy = Math.max(-120,Math.min(120,origin.top+origin.height/2-innerHeight/2));
      noteDialog.style.setProperty('--note-origin-x',dx.toFixed(1)+'px');
      noteDialog.style.setProperty('--note-origin-y',dy.toFixed(1)+'px');
      noteBody.replaceChildren(template.content.cloneNode(true));
      noteDialog.setAttribute('aria-labelledby','note-title-'+link.dataset.note);
      noteDialog.showModal();
      noteDialog.scrollTop = 0;
    });
  });
  noteDialog.querySelector('.note-close').addEventListener('click', () => noteDialog.close());
  noteDialog.addEventListener('click', event => {
    if (event.target.closest?.('a')) noteDialog.close();
    if (event.target !== noteDialog) return;
    const box = noteDialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) noteDialog.close();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  motion.addEventListener('change', () => { if (motion.matches) stop(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) stop();
  }).observe(map);
  // Static by default, including for visitors who prefer reduced motion.
  render(theta);
  setStage(2);
})();
