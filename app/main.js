// app/main.js — tabbed shell + landing page + per-control export wiring.
//
// Layout (brief §5): landing tab first (all 8 minimalist controls side-by-side,
// live but stripped), then one full tab per control with readout + event log +
// "Download parameters" and "Save snippet" buttons.

import { REGISTRY } from './registry.js';
import { buildSnippet, download } from './snippet.js';

const tabsEl = document.querySelector('nav.tabs');
const viewsEl = document.querySelector('#views');

const tabs = []; // {id, btn, view}

function makeTab(id, label, jp) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('role', 'tab');
  btn.dataset.id = id;
  btn.innerHTML = jp ? `${label} <span style="opacity:.6">${jp}</span>` : label;
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

// ---------- landing ----------
function fmtVal(reg, v) {
  if (reg.vector) return `x ${(+v[0]).toFixed(2)}, y ${(+v[1]).toFixed(2)}`;
  return reg.factoryFmt ? reg.factoryFmt(v) : (+v).toFixed(2);
}

function buildLanding() {
  const view = makeTab('landing', 'landing', '一覧');
  view.innerHTML = `
    <div class="tabpanel-head"><h2>Comparison bench <span class="jp">比較ベンチ</span></h2></div>
    <p class="landing-lede">All eight controls, live and stripped to the essentials, bound side-by-side.
      The same edit metaphor, eight acquisitions — eyeball them together. 同じ値編集を八つの取得方法で。</p>
    <div class="shared-param">shared parameter — each control drives its own demo value; drag any of them.</div>
    <div class="compare-grid"></div>
    <p class="landing-note">This is the comparison surface (spec §138). Open a control's tab for the full
      instance with readout, event log, and export. 各タブで詳細・イベントログ・エクスポート。</p>`;
  const grid = view.querySelector('.compare-grid');

  for (const reg of REGISTRY) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.innerHTML = `
      <div class="cell-head"><span class="cell-name">${reg.name}</span><span class="cell-jp">${reg.jp}</span></div>
      <div class="cell-mount"></div>
      <div class="cell-val">—</div>`;
    grid.appendChild(cell);
    const mount = cell.querySelector('.cell-mount');
    const valEl = cell.querySelector('.cell-val');
    const h = reg.factory(mount, { ...structuredOpts(reg.opts), commit: 'live' });
    valEl.textContent = fmtVal(reg, h.get());
    h.on((v) => { valEl.textContent = fmtVal(reg, v); });
    // jump to full tab on the control name
    cell.querySelector('.cell-name').style.cursor = 'pointer';
    cell.querySelector('.cell-name').addEventListener('click', () => select(reg.id));
  }
}

// clone opts so each instance is independent (deep enough for our shapes)
function structuredOpts(opts) {
  const c = { ...opts };
  if (Array.isArray(opts.value)) c.value = opts.value.slice();
  if (Array.isArray(opts.default)) c.default = opts.default.slice();
  return c;
}

// ---------- per-control tabs ----------
function buildControlTab(reg) {
  const view = makeTab(reg.id, reg.name, reg.jp);
  view.innerHTML = `
    <div class="tabpanel-head"><h2>${reg.title}<span class="jp">${reg.jp}</span></h2></div>
    <p class="earns">${reg.earns}<span class="jp-note">${reg.earnsJp}</span></p>
    <div class="axes">
      acquisition <b>${reg.axes.acquisition}</b> &nbsp;·&nbsp;
      mapping <b>${reg.axes.mapping}</b> &nbsp;·&nbsp;
      commit <b>${reg.axes.commit}</b>
    </div>
    <div class="stage"><div class="mount"></div></div>
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
        <p class="earns" style="margin-top:14px;font-size:12px">
          parameters → this instance's opts as JSON. &nbsp; snippet → one self-contained .js
          (core inlined). パラメータ JSON とコア同梱の単体モジュール。</p>
      </div>
    </div>`;

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

  // Download parameters — current opts incl. live value (brief §6)
  view.querySelector('.btn-params').addEventListener('click', () => {
    const snapshot = {
      control: reg.name,
      title: reg.title,
      ...stripFns(handle.opts),
      value: handle.get(),            // current live value
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
for (const reg of REGISTRY) buildControlTab(reg);

const initial = location.hash.replace('#', '') || 'landing';
select(tabs.some((t) => t.id === initial) ? initial : 'landing');
