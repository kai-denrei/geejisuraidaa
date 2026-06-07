// app/kanji-bars.js — experimental tab. A Japanese number slider: the kanji
// 一二三四五六七八九十 (1–10) sit greyed out; dragging the bar lights them up
// left-to-right with an emissive teal glow. Each kanji = 10%; ten lit = 100%.

const KANJI = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const clamp01 = (p) => (p < 0 ? 0 : p > 1 ? 1 : p);

export function kanjiBars(view) {
  view.classList.add('kanji-tab');
  view.innerHTML = '<div class="kanji-row" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="10" aria-label="一二三四五六七八九十"></div>';
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

  set(frac);
}

export default kanjiBars;
