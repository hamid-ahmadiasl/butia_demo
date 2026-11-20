/* Novin Profile demo — page logic: nav, hero scroll, profile explode, glazing compare, colour picker.
   prefers-reduced-motion: effects stay on but get lighter (no idle drift / pointer parallax, shorter travel). */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 760px)').matches;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const fa = v => String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]).replace('.', '٫');
document.documentElement.classList.toggle('reduce', reduce);
$('#year').textContent = fa(new Date().getFullYear());

/* ---------- nav ---------- */
const nav = $('#nav'), tg = $('#navToggle'), links = $('#navLinks');
const onS = () => nav.classList.toggle('is-scrolled', scrollY > 30);
onS(); addEventListener('scroll', onS, { passive: true });
tg.addEventListener('click', () => { const o = links.classList.toggle('is-open'); tg.setAttribute('aria-expanded', o); });
$$('a', links).forEach(a => a.addEventListener('click', () => { links.classList.remove('is-open'); tg.setAttribute('aria-expanded', 'false'); }));

/* ---------- contact form (demo) ---------- */
$('#form').addEventListener('submit', e => { e.preventDefault(); $('#formOk').hidden = false; });

/* ---------- static builders (SVG) ---------- */
function buildGlazingBits() {
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (n, a, p) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); p && p.appendChild(e); return e; };
  // snow
  const snow = $('#snow');
  for (let i = 0; i < (reduce ? 14 : 26); i++) {
    const c = mk('circle', { cx: 10 + Math.random() * 340, cy: 0, r: 1.5 + Math.random() * 2.2, fill: '#fff', opacity: .85 }, snow);
    c.style.animationDelay = (-Math.random() * 7) + 's'; c.style.animationDuration = (5 + Math.random() * 4) * (reduce ? 1.6 : 1) + 's';
  }
  // heat arrows (5 rows, drawn right→left across the pane)
  const heat = $('#heat');
  for (let i = 0; i < 5; i++) {
    const y = 110 + i * 82;
    const g = mk('g', { class: 'heat', 'data-i': i }, mk('g', { transform: `translate(0 ${y})` }, heat));
    const p = mk('path', { d: 'M700 0 C650 -16 600 16 550 0 S450 -16 340 0', fill: 'none', stroke: '#e5532d', 'stroke-width': 4, 'stroke-linecap': 'round', 'marker-end': 'url(#arr)' }, g);
    g.style.animationDelay = (-i * .45) + 's';
  }
  // sound waves emerging on the indoor side
  const w = $('#waves');
  for (let i = 0; i < 4; i++) {
    const r = 60 + i * 46;
    const p = mk('path', { class: 'wave', 'data-i': i, d: `M${450 + r * .1} ${280 - r * .9} A${r} ${r} 0 0 1 ${450 + r * .1} ${280 + r * .9}`, fill: 'none', stroke: '#31566f', 'stroke-width': 4, 'stroke-linecap': 'round' }, w);
    p.style.animationDelay = (-i * .35) + 's';
  }
}
buildGlazingBits();

/* ---------- glazing compare ---------- */
const MODES = [
  { u: 5.8, db: 26, loss: 100, panes: [396, 396, 396], on: [1, 0, 0], heat: 5, snd: 1,   argon: 0 },
  { u: 1.3, db: 32, loss: 22,  panes: [382, 410, 410], on: [1, 1, 0], heat: 2, snd: .5,  argon: 1 },
  { u: 0.8, db: 38, loss: 14,  panes: [368, 396, 424], on: [1, 1, 1], heat: 1, snd: .22, argon: 1 },
];
let gzI = -1;
function setMode(i) {
  if (i === gzI) return; const first = gzI < 0; gzI = i; const m = MODES[i];
  $$('#seg button').forEach(b => { const on = +b.dataset.i === i; b.classList.toggle('is-on', on); b.setAttribute('aria-checked', on); });
  $('#gzRange').value = i;
  const dur = first || !window.gsap ? 0 : .6;
  [0, 1, 2].forEach(k => {
    const el = $('#pn' + k);
    if (window.gsap) gsap.to(el, { attr: { x: m.panes[k] }, opacity: m.on[k], duration: dur, ease: 'power3.inOut' });
    else { el.setAttribute('x', m.panes[k]); el.style.opacity = m.on[k]; }
  });
  const ar = $('#argon'), spanW = i === 0 ? 0 : i === 1 ? 44 : 78;
  if (window.gsap) gsap.to(ar, { opacity: m.argon, duration: dur });
  ar.querySelector('rect').setAttribute('x', 400 - spanW / 2 + (i === 1 ? 7 : 0)); ar.querySelector('rect').setAttribute('width', spanW);
  $$('.heat').forEach(h => { h.style.display = +h.dataset.i < m.heat ? '' : 'none'; });
  $$('.wave').forEach(w => { w.style.setProperty('--lvl', m.snd); w.style.strokeWidth = 2 + 3 * m.snd; });
  $('#bU').style.width = (m.u / 5.8 * 100) + '%'; $('#bDb').style.width = ((m.db - 15) / 30 * 100) + '%'; $('#bLoss').style.width = m.loss + '%';
  const tw = (sel, to, dec) => { const el = $(sel); if (!window.gsap || first) { el.textContent = fa(dec ? to.toFixed(1) : to); return; }
    const o = { v: parseFloat(el.dataset.v || to) }; el.dataset.v = to; gsap.to(o, { v: to, duration: .6, onUpdate: () => el.textContent = fa(dec ? o.v.toFixed(1) : Math.round(o.v)) }); };
  tw('#mU', m.u, true); tw('#mDb', m.db); tw('#mLoss', m.loss);
  $('#mU').dataset.v = m.u; $('#mDb').dataset.v = m.db; $('#mLoss').dataset.v = m.loss;
}
$('#gzRange').addEventListener('input', e => setMode(+e.target.value));
$$('#seg button').forEach(b => b.addEventListener('click', () => setMode(+b.dataset.i)));
setMode(1);

/* ---------- profile explode (SVG) ---------- */
const PARTS = $$('#explodeSvg .part');
const BADGES = [ // [n, anchor x, anchor y (exploded, root coords), badge x, badge y]
  [1, -30, 195, -30, 262], [2, 15, -18, 15, -78], [3, 290, 248, 290, 305], [4, 290, 24, 290, -62],
  [5, 140, 166, 130, 245], [6, 560, 70, 620, 16], [7, 481, 141, 640, 141], [8, 415, 263, 480, 318],
];
(function buildBadges() {
  const NS = 'http://www.w3.org/2000/svg', lines = $('#exLines'), badges = $('#exBadges');
  BADGES.forEach(([n, ax, ay, bx, by]) => {
    const l = document.createElementNS(NS, 'line'); l.setAttribute('x1', ax); l.setAttribute('y1', ay); l.setAttribute('x2', bx); l.setAttribute('y2', by); l.setAttribute('class', 'ex-line'); l.dataset.n = n; lines.appendChild(l);
    const d = document.createElementNS(NS, 'circle'); d.setAttribute('cx', ax); d.setAttribute('cy', ay); d.setAttribute('r', 4); d.setAttribute('class', 'ex-dot'); d.dataset.n = n; lines.appendChild(d);
    const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'ex-badge'); g.dataset.n = n;
    g.innerHTML = `<circle cx="${bx}" cy="${by}" r="15"/><text x="${bx}" y="${by}" text-anchor="middle">${fa(n)}</text>`; badges.appendChild(g);
  });
})();

/* ---------- reveal + counters + explode timeline ---------- */
function initScroll(gsap, ST) {
  gsap.registerPlugin(ST);
  // reveal
  $$('.reveal').forEach(el => gsap.from(el, { opacity: 0, y: reduce ? 12 : 40, duration: reduce ? .5 : .9, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 88%', once: true } }));
  // counters
  $$('[data-count]').forEach(el => { const to = +el.dataset.count, o = { v: 0 };
    ST.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => gsap.to(o, { v: to, duration: 1.6, ease: 'power2.out', onUpdate: () => el.textContent = fa(Math.round(o.v)) }) }); });
  // explode: pinned, scrubbed
  const tl = gsap.timeline({ defaults: { ease: 'none' },
    scrollTrigger: { trigger: '#explodePin', start: 'top top', end: mobile ? '+=130%' : '+=170%', pin: true, scrub: reduce ? .3 : .8, anticipatePin: 1 } });
  PARTS.forEach(p => tl.to(p, { x: +p.dataset.dx, y: +p.dataset.dy, duration: 1, ease: 'power2.inOut' }, 0));
  $$('.ex-line, .ex-dot, .ex-badge').forEach(el => gsap.set(el, { opacity: 0 }));
  tl.to('.ex-line, .ex-dot', { opacity: 1, duration: .35 }, .75).to('.ex-badge', { opacity: 1, duration: .35, stagger: .03 }, .8);
  $$('#legend li').forEach(li => gsap.set(li, { opacity: .25 }));
  tl.to('#legend li', { opacity: 1, duration: .25, stagger: .05 }, .7);
  tl.to({}, { duration: .25 });   // hold at the end
}

/* ---------- hero ---------- */
const hudSteps = $$('.hud__steps li'), hudBar = $('#hudBar'), cue = $('#cue'), fb = $('#fallbackWin');
let lastMode = -1;
function onState(s, p) {
  if (s.mode !== lastMode) { lastMode = s.mode; hudSteps.forEach((li, i) => li.classList.toggle('is-on', i === s.mode)); }
  hudBar.style.transform = `scaleX(${p})`;
  cue.style.opacity = Math.max(0, 1 - p * 14);
}
async function boot() {
  const gsap = window.gsap, ST = window.ScrollTrigger;
  let hero = null;
  try {
    const m = await import('./window3d.js');
    hero = m.createHero($('#heroCanvas'), { mobile, reduce, onState });
    window.__m = m;
  } catch (err) {
    console.warn('WebGL hero unavailable, using CSS fallback', err);
    document.documentElement.classList.add('no-webgl');
  }
  if (gsap && ST) {
    gsap.registerPlugin(ST);
    ST.create({ trigger: '#hero', start: 'top top', end: mobile ? '+=260%' : '+=320%', pin: true, scrub: true, anticipatePin: 1,
      onUpdate: self => { hero ? hero.setProgress(self.progress) : (fb.style.setProperty('--p', self.progress), onState({ mode: self.progress < .06 ? 0 : self.progress < .74 ? 1 : 2 }, self.progress)); },
      onToggle: self => { hero && (self.isActive ? hero.start() : (hero.renderOnce(), hero.stop())); } });
    initScroll(gsap, ST);   // after the hero pin, so later pins measure the extra spacing correctly
    ST.addEventListener('refresh', () => hero && hero.layout());
    if (hero) hero.start();
  } else if (hero) { hero.start(); }
  onState({ mode: 0 }, 0);

  // picker: created lazily when near the viewport; rendering only while visible
  let picker = null;
  const pc = $('#pickCanvas');
  new IntersectionObserver(async (es, ob) => {
    const e = es[0];
    if (e.isIntersecting && !picker && !document.documentElement.classList.contains('no-webgl')) {
      try { const m = window.__m || await import('./window3d.js'); picker = m.createPicker(pc, { mobile, reduce });
        if (window.__pendingFinish) picker.setFinish(window.__pendingFinish);
      } catch (err) { console.warn(err); return; }
    }
    if (picker) e.isIntersecting ? picker.start() : picker.stop();
  }, { rootMargin: '300px 0px' }).observe(pc);
  window.__picker = () => picker;
  $$('#swatches .sw').forEach(b => b.addEventListener('click', () => {
    $$('#swatches .sw').forEach(x => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-checked', x === b); });
    $('#colorName').textContent = $('b', b).textContent;
    picker && picker.setFinish(b.dataset.k);
    pickedKey = b.dataset.k;
  }));
  let pickedKey = 'white';
  $('#openToggle').addEventListener('click', e => { if (!picker) return; const o = picker.toggleOpen(); e.currentTarget.textContent = o ? 'بستن بال پنجره' : 'باز کردن بال پنجره'; });
}
boot();
