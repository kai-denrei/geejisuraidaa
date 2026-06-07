// app/kanji-bars.js — experimental tab. A Japanese number slider: the kanji
// 一二三四五六七八九十 (1–10) sit greyed out; dragging across them lights them
// up left-to-right with an emissive glow. Each kanji = 10%; ten lit = 100%.
//
// The draggable range hugs the kanji block: 0% is just left of 一, 100% just
// right of 十. Live sliders tune colour, glow, and size. Selection is disabled
// so dragging never paints the jarring text-highlight.

const KANJI = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const clamp01 = (p) => (p < 0 ? 0 : p > 1 ? 1 : p);

export function kanjiBars(view) {
  view.classList.add('kanji-tab');
  view.innerHTML = `
    <div class="kanji-row" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="10" aria-label="一二三四五六七八九十"></div>
    <div class="kanji-ctrls">
      <label>color <input type="color" class="kc-color" value="#1bf0c8"></label>
      <label>glow <input type="range" class="kc-glow" min="0" max="40" step="1" value="16"></label>
      <label>size <input type="range" class="kc-size" min="20" max="84" step="1" value="44"></label>
      <label>off <input type="range" class="kc-off" min="4" max="45" step="1" value="14"></label>
    </div>`;
  const row = view.querySelector('.kanji-row');

  const cells = KANJI.map((k) => {
    const s = document.createElement('span');
    s.className = 'kanji';
    s.textContent = k;
    row.appendChild(s);
    return s;
  });

  let frac = 0.4;
  function set(p) {
    frac = clamp01(p);
    const lit = Math.round(frac * 10);
    cells.forEach((c, i) => c.classList.toggle('on', i < lit));
    row.setAttribute('aria-valuenow', String(lit));
  }

  // fraction over the kanji row's own box (which hugs the glyphs + small pad),
  // so 0 lands just left of 一 and 1 just right of 十.
  const fromX = (clientX) => {
    const r = row.getBoundingClientRect();
    set((clientX - r.left) / r.width);
  };
  let dragging = false;
  row.addEventListener('pointerdown', (e) => { dragging = true; row.setPointerCapture(e.pointerId); fromX(e.clientX); });
  row.addEventListener('pointermove', (e) => { if (dragging) fromX(e.clientX); });
  row.addEventListener('pointerup', () => { dragging = false; });
  row.addEventListener('pointercancel', () => { dragging = false; });
  row.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { set(frac + 0.1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { set(frac - 0.1); e.preventDefault(); }
    else if (e.key === 'Home') { set(0); e.preventDefault(); }
    else if (e.key === 'End') { set(1); e.preventDefault(); }
  });

  // --- style sliders -> CSS custom properties on the tab ---
  const color = view.querySelector('.kc-color');
  const glow = view.querySelector('.kc-glow');
  const size = view.querySelector('.kc-size');
  const off = view.querySelector('.kc-off');
  // smaller default size on narrow screens so all ten fit on one line
  if (window.innerWidth < 640) size.value = '26';
  const sync = () => {
    view.style.setProperty('--k-color', color.value);
    view.style.setProperty('--k-glow', glow.value + 'px');
    view.style.setProperty('--k-size', size.value + 'px');
    view.style.setProperty('--k-off', `hsl(0 0% ${off.value}%)`);
  };
  [color, glow, size, off].forEach((inp) => inp.addEventListener('input', sync));

  sync();
  set(frac);
}

export default kanjiBars;
