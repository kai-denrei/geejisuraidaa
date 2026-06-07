// app/unicode-bars.js — minimalist Unicode progress bars.
//
// Black background, white glyphs only. No sliders: each bar IS the control —
// drag it left/right (or arrow-key it) to set the value. All bars share one
// fraction, so dragging any one moves them all.
//
// Each style is a symbol ramp (symbols[0] = empty … symbols[m] = full). The
// fractional-cell trick lets a single character show a partial fill, so the
// leading cell steps through the ramp's mid glyphs (⣇, ▒, ▆, …).

const WIDTH = 14; // cells per bar

const STYLES = [
  '⣀⣄⣆⣇⣧⣷⣿', // braille — dots fill in
  '▱▰',         // squares
  '░▒▓█',       // shades
  '▁▂▃▄▅▆▇█',   // vertical eighths
  '□▨',         // boxes
  '○◐',         // circles
];

const clamp01 = (p) => (p < 0 ? 0 : p > 1 ? 1 : p);

// Changaco's fractional-cell algorithm. Returns a WIDTH-cell string.
function renderBar(p, length, symbols) {
  const sy = Array.from(symbols);
  const m = sy.length - 1;
  const x = clamp01(p) * length;
  const full = Math.floor(x);
  const rest = x - full;
  let out = sy[m].repeat(full);
  let used = full;
  if (rest > 0 && full < length) {
    out += sy[Math.floor(rest * m)] || sy[0];
    used += 1;
  }
  out += sy[0].repeat(Math.max(0, length - used));
  return out;
}

export function unicodeBars(view) {
  view.classList.add('ub-tab');
  view.innerHTML = '<div class="ub-stack"></div>';
  const stack = view.querySelector('.ub-stack');

  let frac = 0.5;
  const bars = [];

  for (const symbols of STYLES) {
    const bar = document.createElement('div');
    bar.className = 'ub-bar';
    bar.tabIndex = 0;
    bar.setAttribute('role', 'slider');
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', '100');
    stack.appendChild(bar);

    let dragging = false;
    const fromX = (clientX) => {
      const r = bar.getBoundingClientRect();
      setFrac((clientX - r.left) / r.width);
    };
    bar.addEventListener('pointerdown', (e) => { dragging = true; bar.setPointerCapture(e.pointerId); fromX(e.clientX); });
    bar.addEventListener('pointermove', (e) => { if (dragging) fromX(e.clientX); });
    bar.addEventListener('pointerup', () => { dragging = false; });
    bar.addEventListener('pointercancel', () => { dragging = false; });
    bar.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { setFrac(frac + 1 / WIDTH); e.preventDefault(); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { setFrac(frac - 1 / WIDTH); e.preventDefault(); }
      else if (e.key === 'Home') { setFrac(0); e.preventDefault(); }
      else if (e.key === 'End') { setFrac(1); e.preventDefault(); }
    });

    bars.push({ bar, symbols });
  }

  function setFrac(p) {
    frac = clamp01(p);
    const now = String(Math.round(frac * 100));
    for (const b of bars) {
      b.bar.textContent = renderBar(frac, WIDTH, b.symbols);
      b.bar.setAttribute('aria-valuenow', now);
    }
  }

  setFrac(frac);
}

export default unicodeBars;
