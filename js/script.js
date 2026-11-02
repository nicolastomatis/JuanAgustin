(() => {
  const scene = document.getElementById('scene');
  const camera = document.getElementById('camera');
  const cloudsEl = document.getElementById('clouds');
  const starsEl = document.getElementById('stars');
  const startBtn = document.getElementById('start');
  const restartBtn = document.getElementById('restart');
  const dusk = scene.querySelector('.sky-dusk');
  const night = scene.querySelector('.sky-night');
  const day = scene.querySelector('.sky-day');
  const sun = scene.querySelector('.sunlight');

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const DURATION = 10000;
    const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const seg = (t, a, b) => clamp((t - a) / (b - a));

  let clouds = [], raf = 0, timers = [];

  function buildClouds() {
    cloudsEl.innerHTML = ''; clouds = [];
    const count = innerWidth < 600 ? 14 : 22;
    for (let i = 0; i < count; i++) {
      const depth = rnd(0.3, 1.6);                       // 0.3 lejos, 1.6 cerca
      const w = (innerWidth < 600 ? 130 : 180) * depth + rnd(0, 60);
      const el = document.createElement('div');
      el.className = 'cloud';
      el.style.width = w + 'px';
            el.style.setProperty('--dur', rnd(18, 40) / depth + 's');
      el.style.setProperty('--delay', -rnd(0, 20) + 's');
      el.style.opacity = clamp(.55 + depth * .3, 0, 1);
      el.style.zIndex = Math.round(depth * 10);
      el.innerHTML = `<div class="cloud-inner v${i % 3}"><img src="images/nube.png" alt="" draggable="false"></div>`;
      const x = rnd(-5, 95) / 100 * innerWidth, y = rnd(-5, 95) / 100 * innerHeight;
      el.style.transform = `translate3d(${x}px,${y}px,0)`;
      cloudsEl.appendChild(el);
      clouds.push({ el, x, y, depth, fadeAt: rnd(.6, 1) });
    }
  }

  function buildStars() {
    starsEl.innerHTML = '';
    const n = innerWidth < 600 ? 110 : 190;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.className = 'star';
      const size = rnd(1, 3);
      s.style.cssText = `left:${rnd(0, 100)}%;top:${rnd(0, 100)}%;width:${size}px;height:${size}px;--o:${rnd(.45, 1)};--tw:${rnd(2, 6)}s;--d:${rnd(0, 5)}s`;
      frag.appendChild(s);
    }
    for (let i = 0; i < 12; i++) {
      const s = document.createElement('img');
      s.className = 'star big'; s.src = 'images/estrella.png'; s.alt = ''; s.draggable = false;
      s.style.cssText = `left:${rnd(3, 97)}%;top:${rnd(3, 85)}%;width:${rnd(14, 30)}px;--o:${rnd(.7, 1)};--tw:${rnd(3, 7)}s;--d:${rnd(1, 6)}s`;
      frag.appendChild(s);
    }
    starsEl.appendChild(frag);
  }

  function frame(t) {
    // t: 0..1 progreso global
    const p = ease(t);
    // cielo: día → atardecer → noche
    dusk.style.opacity = seg(t, .1, .45) * (1 - seg(t, .6, .85) * .0);
    night.style.opacity = seg(t, .5, .95);
    day.style.opacity = 1 - seg(t, .15, .55);
    sun.style.opacity = 1 - seg(t, 0, .4);
    // cámara: leve zoom + movimiento vertical
    camera.style.transform = `translate3d(0,${p * 18}px,0) scale(${1 + p * .08})`;
    // nubes con parallax
    const travel = innerHeight * 3.2;
    for (const c of clouds) {
      const y = c.y + p * travel * c.depth;
      const fade = 1 - seg(t, c.fadeAt - .15, c.fadeAt + .15);
      const scale = 1 + p * .25 * c.depth - seg(t, c.fadeAt, 1) * .3;
      c.el.style.transform = `translate3d(${c.x}px,${y}px,0) scale(${scale})`;
      c.el.style.opacity = clamp((.55 + c.depth * .3) * fade, 0, 1);
    }
  }

  function setState(s) {
    ['day', 'rising', 'night'].forEach(n => scene.classList.remove('state-' + n));
    scene.classList.add('state-' + s);
  }
  const sparks = document.getElementById('sparks');
  function burst() {
    if (reduce.matches) return;
    for (let i = 0; i < 10; i++) {
      const im = document.createElement('img');
      im.src = 'images/estrella.png'; im.alt = ''; im.className = 'spark';
      const a = (i / 10) * Math.PI * 2 + rnd(-.2, .2), d = rnd(60, 130);
      im.style.setProperty('--dx', Math.cos(a) * d + 'px');
      im.style.setProperty('--dy', Math.sin(a) * d - 20 + 'px');
      sparks.appendChild(im);
    }
    later(() => { sparks.innerHTML = ''; }, 1800);
  }
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));

  function start() {
    if (scene.classList.contains('state-rising')) return;
    setState('rising');
    const dur = reduce.matches ? 1200 : DURATION;
    const t0 = performance.now();
    const loop = now => {
      const t = clamp((now - t0) / dur);
      frame(t);
      if (t < 1) { raf = requestAnimationFrame(loop); return; }
      arrive();
    };
    raf = requestAnimationFrame(loop);
    // las estrellas empiezan a aparecer hacia el final del ascenso
    later(() => starsEl.querySelectorAll('.star').forEach(s => s.classList.add('on')), dur * .6);
    later(() => scene.classList.add('moon-in'), dur * .62);
  }

  function arrive() {
    setState('night');
    cloudsEl.style.visibility = 'hidden';
    const fall = reduce.matches ? 300 : 4000;      // el Principito baja hasta la Luna
    later(() => { burst(); scene.classList.add('landed'); }, fall);
    later(() => restartBtn.classList.add('show'), fall + (reduce.matches ? 300 : 5000));
  }

  function reset() {
    cancelAnimationFrame(raf);
    timers.forEach(clearTimeout); timers = [];
    restartBtn.classList.remove('show');
    sparks.innerHTML = '';
    // volver suavemente: apagamos noche y reiniciamos
    scene.style.transition = 'opacity .8s ease';
    scene.style.opacity = 0;
    later(() => {
      scene.classList.remove('moon-in', 'landed');
      setState('day');
      cloudsEl.style.visibility = '';
      buildClouds(); buildStars();
      camera.style.transform = '';
      dusk.style.opacity = 0; night.style.opacity = 0; day.style.opacity = 1; sun.style.opacity = 1;
      scene.style.opacity = 1;
      startBtn.focus({ preventScroll: true });
    }, 850);
  }

  let rt;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { if (scene.classList.contains('state-day')) buildClouds(); }, 250);
  });
  startBtn.addEventListener('click', start);
  restartBtn.addEventListener('click', reset);

  buildClouds(); buildStars();
})();
