// app/unicode-bars.js — Unicode text progress bars, after Changaco's
// "unicode-progress-bars" (https://changaco.oy.lc/unicode-progress-bars/).
//
// Bare-bones: each bar is plain text assembled from a symbol ramp
// (symbols[0] = empty … symbols[m] = full), using the fractional-cell trick so a
// single character can show a partial fill. Interactive + BOUND: every row has
// its own slider, and the bar itself is draggable; moving any one drives a
// single shared fraction so all bars and all sliders move together.

const WIDTH = 28; // cells per bar

const SETS = [
  { name: 'eighths',  symbols: ' ▏▎▍▌▋▊▉█' },
  { name: 'shades',   symbols: '░▒▓█' },
  { name: 'vertical', symbols: ' ▁▂▃▄▅▆▇█' },
  { name: 'braille',  symbols: ' ⡀⡄⡆⡇⣇⣧⣷⣿' },
  { name: 'circles',  symbols: '○◔◑◕●' },
  { name: 'blocks',   symbols: '▱▰' },
  { name: 'ascii',    symbols: ' .:=+#' },
  { name: 'hash',     symbols: '·#' },
];

const clamp01 = (p) => (p < 0 ? 0 : p > 1 ? 1 : p);

// Changaco's algorithm. Returns the filled run (full cells + one partial cell)
// and the empty run, split so each can be colored independently.
function renderBar(p, length, symbols) {
  const sy = Array.from(symbols);
  const m = sy.length - 1;
  const x = clamp01(p) * length;
  const full = Math.floor(x);
  const rest = x - full;
  let filled = sy[m].repeat(full);
  let used = full;
  if (rest > 0 && full < length) {
    filled += sy[Math.floor(rest * m)] || sy[0];
    used += 1;
  }
  const empty = sy[0].repeat(Math.max(0, length - used));
  return { filled, empty };
}

export function unicodeBars(view) {
  view.innerHTML = `
    <div class="tabpanel-head"><h2>Unicode bars</h2></div>
    <p class="earns">Progress bars built from nothing but text. Drag any slider — or any bar —
      and they all move. <a href="https://changaco.oy.lc/unicode-progress-bars/" target="_blank" rel="noopener">after Changaco</a>.</p>
    <div class="ub-readout"><span class="ub-val">0.50</span> · <span class="ub-pctbig">50%</span></div>
    <div class="ub-list"></div>`;
  const valEl = view.querySelector('.ub-val');
  const pctBig = view.querySelector('.ub-pctbig');
  const list = view.querySelector('.ub-list');

  let frac = 0.5;
  const rows = [];

  for (const set of SETS) {
    const row = document.createElement('div');
    row.className = 'ub-row';
    row.innerHTML = `
      <span class="ub-name">${set.name}</span>
      <div class="ub-mid">
        <div class="ub-bar"><span class="ub-filled"></span><span class="ub-empty"></span></div>
        <input class="ub-range" type="range" min="0" max="1000" step="1" aria-label="${set.name} progress">
      </div>
      <span class="ub-pct"></span>`;
    list.appendChild(row);

    const filledEl = row.querySelector('.ub-filled');
    const emptyEl = row.querySelector('.ub-empty');
    const range = row.querySelector('.ub-range');
    const pct = row.querySelector('.ub-pct');
    const bar = row.querySelector('.ub-bar');

    range.addEventListener('input', () => setFrac(range.value / 1000, range));

    // the bar is also a draggable absolute slider
    let dragging = false;
    const fromX = (clientX) => {
      const r = bar.getBoundingClientRect();
      setFrac((clientX - r.left) / r.width);
    };
    bar.addEventListener('pointerdown', (e) => { dragging = true; bar.setPointerCapture(e.pointerId); fromX(e.clientX); });
    bar.addEventListener('pointermove', (e) => { if (dragging) fromX(e.clientX); });
    bar.addEventListener('pointerup', () => { dragging = false; });
    bar.addEventListener('pointercancel', () => { dragging = false; });

    rows.push({ set, filledEl, emptyEl, range, pct });
  }

  function setFrac(p, except) {
    frac = clamp01(p);
    const pctTxt = Math.round(frac * 100) + '%';
    for (const r of rows) {
      const { filled, empty } = renderBar(frac, WIDTH, r.set.symbols);
      r.filledEl.textContent = filled;
      r.emptyEl.textContent = empty;
      r.pct.textContent = pctTxt;
      if (r.range !== except) r.range.value = Math.round(frac * 1000);
    }
    valEl.textContent = frac.toFixed(2);
    pctBig.textContent = pctTxt;
  }

  setFrac(frac);
}

export default unicodeBars;
