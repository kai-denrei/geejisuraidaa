// app/unicode-bars.js — minimalist Unicode progress bars.
//
// Black background, white glyphs only. No sliders, no labels: each bar IS the
// control — drag it left/right (or arrow-key it) to set the value. All bars
// share one fraction, so dragging any one moves them all.
//
// Each style is a 2-symbol ramp [empty, full]; the filled run grows from the
// left. Filled and empty are different *shapes*, so no color is needed.

const WIDTH = 14; // cells per bar

const STYLES = [
  ['□', '▨'],
  ['○', '◐'],
  ['▯', '▮'],
  ['▁', '▄'],
];

const clamp01 = (p) => (p < 0 ? 0 : p > 1 ? 1 : p);

export function unicodeBars(view) {
  view.classList.add('ub-tab');
  view.innerHTML = '<div class="ub-stack"></div>';
  const stack = view.querySelector('.ub-stack');

  let frac = 0.5;
  const bars = [];

  for (const [empty, full] of STYLES) {
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

    bars.push({ bar, empty, full });
  }

  function setFrac(p) {
    frac = clamp01(p);
    const n = Math.round(frac * WIDTH);
    const now = String(Math.round(frac * 100));
    for (const b of bars) {
      b.bar.textContent = b.full.repeat(n) + b.empty.repeat(WIDTH - n);
      b.bar.setAttribute('aria-valuenow', now);
    }
  }

  setFrac(frac);
}

export default unicodeBars;
