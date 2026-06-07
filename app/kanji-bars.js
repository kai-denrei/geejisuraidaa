// app/kanji-bars.js — experimental tab + reusable strip. A Japanese number
// slider: 一二三四五六七八九十 (1–10) sit greyed out; dragging across them lights
// them up left-to-right with an emissive glow. Each kanji = 10%; ten = 100%.
// 0% is just left of 一, 100% just right of 十. Optional live colour/glow/size
// sliders. Selection disabled so dragging never paints the text-highlight.

const KANJI = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const clamp01 = (p) => (p < 0 ? 0 : p > 1 ? 1 : p);

// Reusable. Returns { setNorm(n), onInput(fn), row }. onInput fires on user
// drag/keys with the new fraction; setNorm renders silently.
export function kanjiStrip(host, opts = {}) {
  const row = document.createElement('div');
  row.className = 'kanji-row';
  row.tabIndex = 0;
  row.setAttribute('role', 'slider');
  row.setAttribute('aria-valuemin', '0');
  row.setAttribute('aria-valuemax', '10');
  row.setAttribute('aria-label', '一二三四五六七八九十');
  host.appendChild(row);

  const cells = KANJI.map((k) => {
    const s = document.createElement('span');
    s.className = 'kanji';
    s.textContent = k;
    row.appendChild(s);
    return s;
  });

  let frac = opts.value ?? 0.4;
  let cb = null;
  function set(p, fire) {
    frac = clamp01(p);
    const lit = Math.round(frac * 10);
    cells.forEach((c, i) => c.classList.toggle('on', i < lit));
    row.setAttribute('aria-valuenow', String(lit));
    if (fire && cb) cb(frac);
  }

  const fromX = (clientX) => {
    const r = row.getBoundingClientRect();
    set((clientX - r.left) / r.width, true);
  };
  let dragging = false;
  row.addEventListener('pointerdown', (e) => { dragging = true; row.setPointerCapture(e.pointerId); fromX(e.clientX); });
  row.addEventListener('pointermove', (e) => { if (dragging) fromX(e.clientX); });
  row.addEventListener('pointerup', () => { dragging = false; });
  row.addEventListener('pointercancel', () => { dragging = false; });
  row.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { set(frac + 0.1, true); e.preventDefault(); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { set(frac - 0.1, true); e.preventDefault(); }
    else if (e.key === 'Home') { set(0, true); e.preventDefault(); }
    else if (e.key === 'End') { set(1, true); e.preventDefault(); }
  });

  // initial style vars on the host (inherited by row + glyphs + any controls)
  host.style.setProperty('--k-size', (opts.size ?? 44) + 'px');
  host.style.setProperty('--k-glow', (opts.glow ?? 16) + 'px');
  host.style.setProperty('--k-color', opts.color ?? '#1bf0c8');
  host.style.setProperty('--k-off', opts.off ?? 'hsl(0 0% 14%)');

  if (opts.controls) {
    const ctrls = document.createElement('div');
    ctrls.className = 'kanji-ctrls';
    ctrls.innerHTML = `
      <label>color <input type="color" class="kc-color" value="#1bf0c8"></label>
      <label>glow <input type="range" class="kc-glow" min="0" max="40" step="1" value="16"></label>
      <label>size <input type="range" class="kc-size" min="20" max="84" step="1" value="44"></label>
      <label>off <input type="range" class="kc-off" min="4" max="45" step="1" value="14"></label>`;
    host.appendChild(ctrls);
    const color = ctrls.querySelector('.kc-color');
    const glow = ctrls.querySelector('.kc-glow');
    const size = ctrls.querySelector('.kc-size');
    const off = ctrls.querySelector('.kc-off');
    if (window.innerWidth < 640) size.value = '26';
    const sync = () => {
      host.style.setProperty('--k-color', color.value);
      host.style.setProperty('--k-glow', glow.value + 'px');
      host.style.setProperty('--k-size', size.value + 'px');
      host.style.setProperty('--k-off', `hsl(0 0% ${off.value}%)`);
    };
    [color, glow, size, off].forEach((inp) => inp.addEventListener('input', sync));
    sync();
  }

  set(frac, false);
  return { setNorm(n) { set(n, false); }, onInput(fn) { cb = fn; }, row };
}

export function kanjiBars(view) {
  view.classList.add('kanji-tab');
  view.innerHTML = '';
  kanjiStrip(view, { controls: true, value: 0.4 });
}

export default kanjiBars;
