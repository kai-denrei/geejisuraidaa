// app/main.js — tabbed shell + bound comparison bench + per-control export.
//
// Layout: bench tab first (all 8 controls, live, stripped, BOUND to one shared
// normalized value — drag any, they all move), then one full tab per control
// with readout + event log + "Download parameters" and "Save snippet".

import { REGISTRY } from './registry.js';
import { buildSnippet, download } from './snippet.js';
import { mapper, clamp } from '../core/map.js';
import { unicodeBars } from './unicode-bars.js';
import { sevensegBars } from './sevenseg-bars.js';
import { kanjiBars } from './kanji-bars.js';

const tabsEl = document.querySelector('nav.tabs');
const viewsEl = document.querySelector('#views');

const tabs = []; // {id, btn, view}

function makeTab(id, label) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('role', 'tab');
  btn.dataset.id = id;
  btn.textContent = label;
  tabsEl.appendChild(btn);
  const view = document.createElement('section');
  view.className = 'view';
  view.dataset.id = id;
  viewsEl.appendChild(view);
  btn.addEventListener('click', () => select(id));
  tabs.push({ id, btn, view });
  return view;
}

function select(id) {
  for (const t of tabs) {
    const on = t.id === id;
    t.btn.setAttribute('aria-selected', on ? 'true' : 'false');
    t.view.classList.toggle('active', on);
  }
  location.hash = id;
}

function fmtVal(reg, v) {
  if (reg.vector) return `x ${(+v[0]).toFixed(2)}, y ${(+v[1]).toFixed(2)}`;
  return (+v).toFixed(2);
}

// clone opts so each instance is independent
function structuredOpts(opts) {
  const c = { ...opts };
  if (Array.isArray(opts.value)) c.value = opts.value.slice();
  if (Array.isArray(opts.default)) c.default = opts.default.slice();
  return c;
}

// ---------- bench (bound) ----------
function buildLanding() {
  const view = makeTab('bench', 'bench');
  view.innerHTML = `
    <div class="tabpanel-head"><h2>Bench</h2></div>
    <p class="landing-lede">Eight controls, one value. Drag any — they all move.</p>
    <div class="compare-grid"></div>
    <p class="landing-note">Open a tab for the full control, readout, and export.</p>`;
  const grid = view.querySelector('.compare-grid');

  const cells = [];
  for (const reg of REGISTRY) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.innerHTML = `
      <div class="cell-head"><span class="cell-name">${reg.name}</span></div>
      <div class="cell-mount"></div>
      <div class="cell-val">—</div>`;
    grid.appendChild(cell);
    const mount = cell.querySelector('.cell-mount');
    const valEl = cell.querySelector('.cell-val');
    const h = reg.factory(mount, { ...structuredOpts(reg.opts), commit: 'live' });
    const o = h.opts;
    const rec = {
      reg, h, valEl,
      m: mapper(o.map, o.min, o.max),
      min: o.min, span: o.max - o.min,
      vector: !!reg.vector,
      show: () => { valEl.textContent = fmtVal(reg, h.get()); },
    };
    rec.show();
    cells.push(rec);
    const nameEl = cell.querySelector('.cell-name');
    nameEl.style.cursor = 'pointer';
    nameEl.addEventListener('click', () => select(reg.id));
  }

  // Bind: one normalized position [0,1] drives all. Endpoints align (min↔min,
  // max↔max); each control maps the shared norm through its own taper. xypad is
  // the exception — only its horizontal axis links; the vertical does nothing.
  let syncing = false;
  const normOf = (rec) =>
    rec.vector
      ? clamp((rec.h.get()[0] - rec.min) / rec.span, 0, 1)
      : clamp(rec.m.toNorm(rec.h.get()), 0, 1);
  const applyNorm = (rec, n) => {
    if (rec.vector) {
      const cur = rec.h.get();
      rec.h.set([rec.min + n * rec.span, cur[1]]); // x linked, y inert
    } else {
      rec.h.set(rec.m.toValue(n));
    }
    rec.show();
  };
  const broadcast = (n, srcId) => {
    syncing = true;
    for (const rec of cells) if (rec.reg.id !== srcId) applyNorm(rec, n);
    syncing = false;
  };
  for (const rec of cells) {
    rec.h.on((v, kind) => {
      rec.show();
      if (syncing || kind === 'set') return;
      broadcast(normOf(rec), rec.reg.id);
    });
  }
  broadcast(0.5, null); // aligned start
  for (const rec of cells) rec.show();
}

// ---------- per-control tabs ----------
function buildControlTab(reg) {
  const view = makeTab(reg.id, reg.name);
  view.innerHTML = `
    <div class="tabpanel-head"><h2>${reg.title}</h2></div>
    <p class="earns">${reg.earns}</p>
    <div class="axes">
      acquisition <b>${reg.axes.acquisition}</b> &nbsp;·&nbsp;
      mapping <b>${reg.axes.mapping}</b> &nbsp;·&nbsp;
      commit <b>${reg.axes.commit}</b>
    </div>
    <div class="stage"><div class="mount"></div></div>
    <div class="fine" data-on="1">
      <button class="fine-tog" type="button" aria-pressed="true" title="toggle the +/- buttons">± fine</button>
      <div class="stepper"></div>
    </div>
    <div class="panel-row">
      <div class="panel">
        <h3>event log</h3>
        <div class="log" aria-live="polite"></div>
      </div>
      <div class="panel">
        <h3>export</h3>
        <div class="exports">
          <button class="btn btn-params" type="button">Download parameters</button>
          <button class="btn btn-snippet" type="button">Save snippet</button>
        </div>
        <p class="earns" style="margin-top:14px;font-size:12px">JSON params · self-contained .js module.</p>
      </div>
    </div>
    <div class="variations"></div>`;

  const mount = view.querySelector('.mount');
  const log = view.querySelector('.log');
  const opts = structuredOpts(reg.opts);

  const handle = reg.factory(mount, opts);

  // event log
  let n = 0;
  handle.on((v, kind) => {
    if (kind === 'set') return;
    const line = document.createElement('div');
    line.className = kind === 'change' ? 'ev-change' : 'ev-input';
    const val = reg.vector ? `[${(+v[0]).toFixed(3)}, ${(+v[1]).toFixed(3)}]` : (+v).toFixed(4);
    line.textContent = `${String(++n).padStart(3, '0')}  ${kind.padEnd(6)} ${val}`;
    log.prepend(line);
    while (log.children.length > 80) log.lastChild.remove();
  });

  // Download parameters — current opts incl. live value
  view.querySelector('.btn-params').addEventListener('click', () => {
    const snapshot = {
      control: reg.name,
      title: reg.title,
      ...stripFns(handle.opts),
      value: handle.get(),
    };
    download(`${reg.module}.params.json`, JSON.stringify(snapshot, null, 2), 'application/json');
  });

  // Save snippet — self-contained module
  view.querySelector('.btn-snippet').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const prev = btn.textContent;
    btn.textContent = 'building…';
    try {
      const { filename, code } = await buildSnippet(reg);
      download(filename, code, 'text/javascript');
      btn.textContent = 'saved ✓';
    } catch (err) {
      console.error(err);
      btn.textContent = 'failed';
    }
    setTimeout(() => { btn.textContent = prev; }, 1400);
  });

  // ---- secondary control: toggleable +/- fine-tune (acts on the handle) ----
  const stepper = view.querySelector('.stepper');
  const step = reg.opts.step ?? 1;
  const nudge = (sign, axis, big) => {
    const d = step * (big ? 10 : 1) * sign;
    if (reg.vector) { const p = handle.get(); p[axis] += d; handle.set(p); }
    else handle.set(handle.get() + d);
  };
  const mkBtn = (txt, sign, axis, aria) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = txt; b.setAttribute('aria-label', aria);
    b.title = 'shift = ×10';
    b.addEventListener('click', (e) => nudge(sign, axis, e.shiftKey));
    return b;
  };
  if (reg.vector) {
    for (const [axis, lbl] of [[0, 'x'], [1, 'y']]) {
      const g = document.createElement('span'); g.className = 'step-grp';
      g.append(`${lbl}`, mkBtn('−', -1, axis, `decrease ${lbl}`), mkBtn('+', +1, axis, `increase ${lbl}`));
      stepper.appendChild(g);
    }
  } else {
    const lbl = document.createElement('span');
    lbl.className = 'step-lbl'; lbl.textContent = `±${step}`;
    stepper.append(mkBtn('−', -1, 0, 'decrease'), lbl, mkBtn('+', +1, 0, 'increase'));
  }
  const fine = view.querySelector('.fine');
  const tog = view.querySelector('.fine-tog');
  tog.addEventListener('click', () => {
    const on = fine.dataset.on === '1' ? '0' : '1';
    fine.dataset.on = on;
    tog.setAttribute('aria-pressed', on === '1' ? 'true' : 'false');
  });

  // ---- variations: extra instances of this control on its own tab ----
  if (reg.variants?.length) {
    const variations = view.querySelector('.variations');
    variations.innerHTML = '<h3>variations</h3>';
    const grid = document.createElement('div'); grid.className = 'var-grid';
    variations.appendChild(grid);
    for (const vr of reg.variants) {
      const cell = document.createElement('div'); cell.className = 'var';
      cell.innerHTML = `<span class="var-label">${vr.label}</span><div class="var-mount"></div>`;
      grid.appendChild(cell);
      reg.factory(cell.querySelector('.var-mount'), { ...structuredOpts(reg.opts), ...vr.opts, commit: 'live' });
    }
  }
}

// drop function-valued opts (onInput/onChange/format) from the JSON snapshot
function stripFns(opts) {
  const out = {};
  for (const [k, v] of Object.entries(opts)) {
    if (typeof v === 'function') continue;
    out[k] = v;
  }
  return out;
}

// ---------- boot ----------
buildLanding();
unicodeBars(makeTab('unicode', 'unicode bars')); // separate tab, its own bound state
sevensegBars(makeTab('sevenseg', 'segments')); // experimental: seven-seg center bars
kanjiBars(makeTab('kanji', 'kanji'));          // experimental: 一〜十 number slider
for (const reg of REGISTRY) buildControlTab(reg);

const initial = location.hash.replace('#', '') || 'bench';
select(tabs.some((t) => t.id === initial) ? initial : 'bench');
