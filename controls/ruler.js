// controls/ruler.js — sliding ruler / scale picker (fixed needle)
//
// AXES (spec §1)
//   Acquisition: gestural, RELATIVE. Fixed needle at center; the scale strip
//                translates underneath. translateX = center − v*PPU; inverse
//                v = (center − tx)/PPU. PPU≈8px, major ticks every 10. (spec §5)
//   Mapping:     linear.
//   Commit:      per opts.commit.
//
// WHERE IT EARNS ITS PLACE: the mobile height/weight-picker metaphor — the
// needle stays put, the world moves; comfortable thumb-drag for bounded scalars.
//
// Conventions: shift/alt modifiers, dbl-click reset, keyboard, typeable readout
// (full-width digits), units, role=slider.

import { createModel, makeHandle, parseNumberLoose } from '../core/control.js';
import { mapper, clamp } from '../core/map.js';
import { resolveModifier, beginDrag } from '../core/gesture.js';
import { wireSlider, updateAria, keyStep } from '../core/a11y.js';

export function ruler(el, opts = {}) {
  const o0 = { min: 0, max: 200, step: 1, value: 100, ...opts };
  const model = createModel(o0);
  const o = model.opts;
  const m = mapper(o.map, o.min, o.max);
  const PPU = o.ppu || 8;
  const majorEvery = o.majorEvery || 10;

  el.classList.add('mp-ruler');
  el.innerHTML = `
    <div class="mp-ruler-view" tabindex="0">
      <div class="mp-ruler-strip"></div>
      <div class="mp-ruler-needle"></div>
    </div>
    <div class="mp-ruler-row">
      <span class="mp-ruler-readout"></span>
      <input class="mp-ruler-input" type="text" inputmode="decimal" hidden/>
    </div>`;
  const view = el.querySelector('.mp-ruler-view');
  const strip = el.querySelector('.mp-ruler-strip');
  const readout = el.querySelector('.mp-ruler-readout');
  const input = el.querySelector('.mp-ruler-input');

  wireSlider(view, { min: o.min, max: o.max, label: o.label });

  // build tick strip once (value units 0-origin at o.min)
  const ticks = document.createDocumentFragment();
  for (let val = o.min; val <= o.max + 1e-9; val += o.step) {
    const t = document.createElement('div');
    const isMajor = Math.round((val - o.min) / o.step) % majorEvery === 0;
    t.className = 'mp-ruler-tick' + (isMajor ? ' major' : '');
    t.style.left = `${(val - o.min) * PPU}px`;
    if (isMajor) {
      const lab = document.createElement('span');
      lab.className = 'mp-ruler-lab';
      lab.textContent = String(Number(val.toFixed(6)));
      t.appendChild(lab);
    }
    ticks.appendChild(t);
  }
  strip.appendChild(ticks);

  function center() { return view.getBoundingClientRect().width / 2; }
  function render() {
    const v = model.get();
    // translateX = center − (v−min)*PPU
    strip.style.transform = `translateX(${center() - (v - o.min) * PPU}px)`;
    readout.textContent = model.format(v);
    updateAria(view, { norm: clamp(m.toNorm(v), 0, 1), text: model.format(v) });
  }
  model.on(render);

  let startVal = 0;
  const unbind = beginDrag(view, {
    onStart: () => { startVal = model.get(); },
    onMove: ({ dx, ev, moved }) => {
      if (!moved) return;
      const mod = resolveModifier(ev);
      // dragging right reveals lower values (strip moves right) → v decreases
      model.apply(startVal - (dx / PPU) * mod);
    },
    onEnd: ({ moved }) => { if (moved) model.commit(); else enterEdit(); },
  });

  function enterEdit() {
    input.value = model.format(model.get()).replace(o.unit || '', '');
    readout.hidden = true; input.hidden = false; input.focus(); input.select();
  }
  function commitEdit(keep) {
    if (keep) {
      const v = parseNumberLoose(input.value);
      if (Number.isFinite(v)) { model.apply(v); model.commit(); }
    }
    input.hidden = true; readout.hidden = false;
  }
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') commitEdit(true); else if (e.key === 'Escape') commitEdit(false);
  });
  input.addEventListener('blur', () => commitEdit(true));
  view.addEventListener('dblclick', () => model.reset());

  function onKey(e) {
    const d = keyStep(e, { step: o.step });
    if (d == null) return;
    e.preventDefault();
    if (d === 'min') model.apply(o.min);
    else if (d === 'max') model.apply(o.max);
    else model.apply(model.get() + d);
    model.commit();
  }
  view.addEventListener('keydown', onKey);

  // re-center strip on resize so the needle stays accurate
  const ro = new ResizeObserver(() => render());
  ro.observe(view);

  render();
  return makeHandle(el, model, () => {
    unbind(); ro.disconnect();
    view.removeEventListener('keydown', onKey);
    el.classList.remove('mp-ruler');
  });
}

export default ruler;
