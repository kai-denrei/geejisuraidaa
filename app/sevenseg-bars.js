// app/sevenseg-bars.js — experimental tab + reusable strip. Ports the dexipurei
// Vacuum-Fluorescent (VFD) seven-segment renderer (vfd-standalone.html) with its
// exact params (vfd-params.json): cyan-green phosphor, multi-pass glow, blue-white
// hot core, off-segment ghost, faint heater-filament wires, gate-grid, vignette.
//
// Ten full digits sit in a row. Every digit shows the whole "8" as a faint ghost;
// only the CENTER segment (g) lights, driven by the value:
//   center off = 0% · center dim = 5% · center full = 10% · 10 digits = 100%.

// exact VFD params (vfd-params.json)
const VFD = {
  color: '#7dffd0', bg: '#020a10',
  glow: 18, core: 46, filament: 45, grid: 30, ghost: 9, age: 22, vignette: 40,
};
const N = 10;

// --- ported helpers (color, hash, geometry, tube fx) ---------------------
function hex2rgb(h) {
  h = String(h).replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
function hash(x, y) { // stable per-element [0,1), seed 1
  let n = (Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ 2147483647) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

const SEG_ALL = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
function segEnds(seg, w, h, t) {
  const ht = t / 2, hh = h / 2;
  switch (seg) {
    case 'a': return [t, ht, w - t, ht];
    case 'b': return [w - ht, t, w - ht, hh - ht];
    case 'c': return [w - ht, hh + ht, w - ht, h - t];
    case 'd': return [t, h - ht, w - t, h - ht];
    case 'e': return [ht, hh + ht, ht, h - t];
    case 'f': return [ht, t, ht, hh - ht];
    case 'g': return [t, hh, w - t, hh];
  }
  return [0, 0, 0, 0];
}
function vhex(ctx, x1, y1, x2, y2, th) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
  if (len < 0.001) return;
  const ux = dx / len, uy = dy / len, px = -uy, py = ux, h = th / 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 + ux * h - px * h, y1 + uy * h - py * h);
  ctx.lineTo(x2 - ux * h - px * h, y2 - uy * h - py * h);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x2 - ux * h + px * h, y2 - uy * h + py * h);
  ctx.lineTo(x1 + ux * h + px * h, y1 + uy * h + py * h);
  ctx.closePath();
}
function drawFilaments(ctx, w, h, vis, phosC) {
  if (vis <= 0) return;
  const n = Math.max(3, Math.round(h / 56));
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const fy = h * (i + 0.5) / n + (hash(i, 91) - 0.5) * 6;
    const a = vis * 0.05 * (0.7 + 0.3 * Math.sin(i * 1.7 + hash(i, 7) * 6.28));
    const g = ctx.createLinearGradient(0, fy, w, fy);
    g.addColorStop(0, rgba(phosC, 0)); g.addColorStop(0.5, rgba(phosC, a)); g.addColorStop(1, rgba(phosC, a * 0.3));
    ctx.strokeStyle = g; ctx.lineWidth = 1; ctx.shadowColor = rgba(phosC, a); ctx.shadowBlur = 4;
    ctx.beginPath(); ctx.moveTo(0, fy); ctx.lineTo(w, fy); ctx.stroke();
  }
  ctx.shadowBlur = 0; ctx.restore();
}
function drawGrid(ctx, w, h, amt, phosC) {
  if (amt <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const gap = Math.max(10, w / 48);
  ctx.strokeStyle = rgba(phosC, amt * 0.01); ctx.lineWidth = 1;
  for (let x = 0; x < w; x += gap) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  ctx.restore();
}
function vignette(ctx, w, h, amount) {
  if (amount <= 0) return;
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.62);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${amount * 0.85})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}

// Reusable canvas strip. Returns { el, setNorm(n), onInput(fn) }.
export function segStrip(mount, opts = {}) {
  const cv = document.createElement('canvas');
  cv.className = opts.className || 'seg-canvas';
  cv.tabIndex = 0;
  cv.setAttribute('role', 'slider');
  cv.setAttribute('aria-valuemin', '0');
  cv.setAttribute('aria-valuemax', '100');
  mount.appendChild(cv);
  const ctx = cv.getContext('2d');

  let value = Math.round(((opts.value ?? 0.4) * 100) / 5) * 5; // percent, 5% steps
  let dpr = 1;
  let cb = null;

  const phosC = hex2rgb(VFD.color), bgC = hex2rgb(VFD.bg);
  const coreC = mix(phosC, [190, 220, 255], VFD.core / 100);
  const ghostA = VFD.ghost / 100, coreA = VFD.core / 100, ageA = VFD.age / 100, ageMul = 1 - ageA * 0.5;

  function draw() {
    const w = cv.width / dpr, h = cv.height / dpr;
    if (w <= 0 || h <= 0) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = rgba(bgC, 1); ctx.fillRect(0, 0, w, h);
    // ambient phosphor wash
    const wash = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.6);
    wash.addColorStop(0, rgba(phosC, 0.05)); wash.addColorStop(1, rgba(phosC, 0));
    ctx.fillStyle = wash; ctx.fillRect(0, 0, w, h);
    drawFilaments(ctx, w, h, VFD.filament / 100, phosC);

    const pad = Math.min(w, h) * 0.1;
    const availW = w - pad * 2;
    const dh = h - pad * 2;
    const slot = availW / N;
    const dw = Math.max(3, Math.min(slot * 0.74, dh / 1.5));
    const th = Math.max(1.5, Math.min(dw, dh) * 0.17);
    const y = (h - dh) / 2;
    const full = Math.floor(value / 10);
    const rem = value - full * 10;
    const dimIdx = rem >= 5 ? full : -1;

    const drawSeg = (x1, y1, x2, y2, bright, on) => {
      if (!on) { // off-segment ghost
        if (ghostA <= 0) return;
        ctx.shadowBlur = 0; ctx.globalAlpha = ghostA; ctx.fillStyle = rgba(phosC, 1);
        vhex(ctx, x1, y1, x2, y2, th * 0.9); ctx.fill(); ctx.globalAlpha = 1;
        return;
      }
      ctx.fillStyle = rgba(phosC, 1); ctx.shadowColor = rgba(phosC, 1);
      vhex(ctx, x1, y1, x2, y2, th);
      ctx.globalAlpha = 0.5 * bright; ctx.shadowBlur = VFD.glow; ctx.fill();   // glow
      ctx.globalAlpha = Math.min(1, bright); ctx.shadowBlur = 0; ctx.fill();   // solid
      if (coreA > 0) {                                                          // blue-white core
        ctx.globalAlpha = Math.min(1, coreA * bright); ctx.fillStyle = rgba(coreC, 1);
        vhex(ctx, x1, y1, x2, y2, th * 0.5); ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    };

    for (let i = 0; i < N; i++) {
      const cx = pad + slot * i + slot / 2;
      ctx.save(); ctx.translate(cx - dw / 2, y);
      let cBright = i < full ? 1 : i === dimIdx ? 0.42 : 0; // center brightness
      if (cBright > 0) cBright = Math.max(0.14, cBright * (1 - ageA * 0.5 * hash(i * 7 + 6, 3)) * ageMul);
      for (const seg of SEG_ALL) {
        const [x1, y1, x2, y2] = segEnds(seg, dw, dh, th);
        if (seg === 'g') drawSeg(x1, y1, x2, y2, cBright || 1, cBright > 0); // center: lit or ghost
        else drawSeg(x1, y1, x2, y2, 1, false);                              // a–f: always ghost
      }
      ctx.restore();
    }

    drawGrid(ctx, w, h, VFD.grid / 100, phosC);
    vignette(ctx, w, h, VFD.vignette / 100);
    cv.setAttribute('aria-valuenow', String(value));
  }

  function size() {
    const r = cv.getBoundingClientRect();
    if (r.width <= 0) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    cv.width = Math.round(r.width * dpr);
    cv.height = Math.round(r.height * dpr);
    draw();
  }

  const setFromX = (clientX) => {
    const r = cv.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    value = Math.round((p * 100) / 5) * 5;
    draw();
    if (cb) cb(value / 100);
  };
  let dragging = false;
  cv.addEventListener('pointerdown', (e) => { dragging = true; cv.setPointerCapture(e.pointerId); setFromX(e.clientX); });
  cv.addEventListener('pointermove', (e) => { if (dragging) setFromX(e.clientX); });
  cv.addEventListener('pointerup', () => { dragging = false; });
  cv.addEventListener('pointercancel', () => { dragging = false; });
  cv.addEventListener('keydown', (e) => {
    let v = value;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') v = Math.min(100, value + 5);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') v = Math.max(0, value - 5);
    else if (e.key === 'Home') v = 0;
    else if (e.key === 'End') v = 100;
    else return;
    e.preventDefault();
    value = v; draw(); if (cb) cb(value / 100);
  });

  new ResizeObserver(size).observe(cv);
  window.addEventListener('resize', size);
  size();

  return {
    el: cv,
    setNorm(n) { value = Math.round((Math.max(0, Math.min(1, n)) * 100) / 5) * 5; draw(); },
    onInput(fn) { cb = fn; },
  };
}

export function sevensegBars(view) {
  view.classList.add('seg-tab');
  view.innerHTML = '';
  segStrip(view, { className: 'seg-canvas' });
}

export default sevensegBars;
