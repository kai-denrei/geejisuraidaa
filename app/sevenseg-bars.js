// app/sevenseg-bars.js — experimental tab + reusable strip. Ports the *center
// segment* (the 'g' bar) and the emissive glow from the dexipurei seven-segment
// module (sevenseg-standalone.html): an elongated rounded-tip hex bar with a
// glow pass + white hot core. Ten bars in a row form a 0–100% meter:
//   bar off = 0% · bar dimly lit = 5% · bar fully lit = 10% · 10 bars = 100%.

const COLOR = '#1bf0c8';   // VFD teal (sevenseg default)
const BG = '#05100e';
const GLOW = 14;
const N = 10;

// elongated hex (rounded-tip bar) between two points — verbatim from sevenseg.js
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

// one center segment, with the sevenseg glow passes. bright: 0..1; 0 = off ghost.
function drawBar(ctx, x1, y1, x2, y2, th, bright) {
  if (bright <= 0) {
    ctx.shadowBlur = 0; ctx.globalAlpha = 0.05; ctx.fillStyle = COLOR;
    vhex(ctx, x1, y1, x2, y2, th * 0.9); ctx.fill(); ctx.globalAlpha = 1;
    return;
  }
  ctx.fillStyle = COLOR; ctx.shadowColor = COLOR;
  vhex(ctx, x1, y1, x2, y2, th);
  ctx.globalAlpha = 0.55 * bright; ctx.shadowBlur = GLOW; ctx.fill();        // glow
  ctx.globalAlpha = Math.min(1, bright); ctx.shadowBlur = 0; ctx.fill();     // solid
  ctx.globalAlpha = Math.min(1, 0.88 * bright); ctx.fillStyle = '#fff';      // hot core
  vhex(ctx, x1, y1, x2, y2, th * 0.5); ctx.fill();
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;
}

// Reusable canvas strip. Returns { el, setNorm(n), onInput(fn) }. onInput fires
// on user drag/keys with the new fraction [0,1]; setNorm renders silently.
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

  function draw() {
    const w = cv.width / dpr, h = cv.height / dpr;
    if (w <= 0 || h <= 0) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    const pad = Math.min(w * 0.04, 28);
    const gap = Math.max(6, w * 0.018);
    const bw = (w - pad * 2 - gap * (N - 1)) / N;
    const th = Math.min(h * 0.5, bw * 0.42, 24);
    const y = h / 2;
    const full = Math.floor(value / 10);
    const rem = value - full * 10;
    const dimIdx = rem >= 5 ? full : -1;
    for (let i = 0; i < N; i++) {
      const x = pad + i * (bw + gap);
      const bright = i < full ? 1 : i === dimIdx ? 0.42 : 0;
      drawBar(ctx, x, y, x + bw, y, th, bright);
    }
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
