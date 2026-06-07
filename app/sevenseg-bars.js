// app/sevenseg-bars.js — experimental tab. Ports the *center segment* (the 'g'
// bar) and the emissive glow from the dexipurei seven-segment module
// (sevenseg-standalone.html): an elongated rounded-tip hex bar with a glow pass
// + white hot core. Ten bars laid in a row form a 0–100% meter:
//   bar off = 0% · bar dimly lit = 5% · bar fully lit = 10% · 10 bars = 100%.
// Drag across it (or arrow-key) to set the value in 5% steps.

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
  if (bright <= 0) { // off-segment ghost (faint full bar behind)
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

export function sevensegBars(view) {
  view.classList.add('seg-tab');
  view.innerHTML = '<canvas class="seg-canvas" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="100"></canvas>';
  const cv = view.querySelector('.seg-canvas');
  const ctx = cv.getContext('2d');

  let value = 40; // percent, 0..100 in 5% steps
  let dpr = 1;

  function draw() {
    const w = cv.width / dpr, h = cv.height / dpr;
    if (w <= 0 || h <= 0) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);

    const pad = Math.min(w * 0.04, 28);
    const gap = Math.max(8, w * 0.018);
    const bw = (w - pad * 2 - gap * (N - 1)) / N;
    const th = Math.min(h * 0.46, bw * 0.42, 24);
    const y = h / 2;

    const full = Math.floor(value / 10);
    const rem = value - full * 10;
    const dimIdx = rem >= 5 ? full : -1;

    for (let i = 0; i < N; i++) {
      const x = pad + i * (bw + gap);
      const bright = i < full ? 1 : i === dimIdx ? 0.42 : 0; // full / dim / off
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
  };
  let dragging = false;
  cv.addEventListener('pointerdown', (e) => { dragging = true; cv.setPointerCapture(e.pointerId); setFromX(e.clientX); });
  cv.addEventListener('pointermove', (e) => { if (dragging) setFromX(e.clientX); });
  cv.addEventListener('pointerup', () => { dragging = false; });
  cv.addEventListener('pointercancel', () => { dragging = false; });
  cv.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { value = Math.min(100, value + 5); draw(); e.preventDefault(); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { value = Math.max(0, value - 5); draw(); e.preventDefault(); }
    else if (e.key === 'Home') { value = 0; draw(); e.preventDefault(); }
    else if (e.key === 'End') { value = 100; draw(); e.preventDefault(); }
  });

  // redraw when the tab gains size (it boots hidden) or the window resizes
  new ResizeObserver(size).observe(cv);
  window.addEventListener('resize', size);
  size();
}

export default sevensegBars;
