(() => {
  const layer = document.createElement('div');
  layer.className = 'cursor-particles';
  layer.setAttribute('aria-hidden', 'true');
  document.body.append(layer);
  const sources = [1, 2, 3, 4].map(n => `assets/particles/petal-${n}.png`);
  sources.forEach(src => { const image = new Image(); image.src = src; });
  const active = new Set();
  let lastSpawn = 0;
  let holding = false;
  let holdTimer = null;
  let pointer = { x: 0, y: 0 };
  const normalInterval = 85 / 0.6;
  function spawn() {
    if (document.hidden || active.size >= (holding ? 135 : 27)) return;
    const time = performance.now();
    if (time - lastSpawn < normalInterval / (holding ? 5 : 1)) return;
    lastSpawn = time;
    const image = document.createElement('img');
    image.src = sources[Math.floor(Math.random() * sources.length)];
    image.alt = '';
    image.draggable = false;
    const size = (22 + Math.random() * 20) * 0.8;
    Object.assign(image.style, { width: `${size}px`, height: `${size}px`, left: `${pointer.x - size / 2}px`, top: `${pointer.y - size / 2}px` });
    layer.append(image);
    active.add(image);
    const drift = (Math.random() - .5) * 140;
    const fall = 200 + Math.random() * 220;
    const angle = (Math.random() - .5) * 100;
    const animation = image.animate([
      { transform: `translate(0,0) rotate(${angle}deg) scale(.6)`, opacity: 0, offset: 0 },
      { transform: `translate(${drift * .05}px,3px) rotate(${angle + 8}deg) scale(1)`, opacity: .95, offset: .08 },
      { transform: `translate(${drift * .45}px,${fall * .3}px) rotate(${angle + 65}deg) scale(.95)`, opacity: .75, offset: .5 },
      { transform: `translate(${drift}px,${fall}px) rotate(${angle + 130}deg) scale(.65)`, opacity: 0, offset: 1 }
    ], { duration: 3000, easing: 'linear', fill: 'forwards' });
    const remove = () => { image.remove(); active.delete(image); };
    animation.onfinish = remove;
    animation.oncancel = remove;
  }
  function stopHolding() {
    holding = false;
    clearInterval(holdTimer);
    holdTimer = null;
  }
  window.addEventListener('pointermove', event => {
    if (!['mouse', 'pen'].includes(event.pointerType)) return;
    pointer = { x: event.clientX, y: event.clientY };
    if (holding && !(event.buttons & 1)) stopHolding();
    if (!holding) spawn();
  }, { passive: true });
  window.addEventListener('pointerdown', event => {
    if (!['mouse', 'pen'].includes(event.pointerType) || event.button !== 0) return;
    stopHolding();
    pointer = { x: event.clientX, y: event.clientY };
    holding = true;
    lastSpawn = 0;
    spawn();
    holdTimer = setInterval(spawn, Math.ceil(normalInterval / 5));
  }, { passive: true });
  window.addEventListener('pointerup', event => { if (event.button === 0) stopHolding(); });
  window.addEventListener('pointercancel', stopHolding);
  window.addEventListener('blur', stopHolding);
  document.addEventListener('pointerleave', stopHolding);
  function clear() {
    stopHolding();
    active.forEach(image => { image.getAnimations().forEach(animation => animation.cancel()); image.remove(); });
    active.clear();
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
})();
