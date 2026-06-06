// app/registry.js — the 8 V1 controls: factory + metadata + demo opts.
// Single source of truth for the shell and the landing page.

import { scrub } from '../controls/scrub.js';
import { logSlider } from '../controls/log-slider.js';
import { bipolar } from '../controls/bipolar.js';
import { xypad } from '../controls/xypad.js';
import { knob } from '../controls/knob.js';
import { arcGauge } from '../controls/arc.js';
import { ruler } from '../controls/ruler.js';
import { meter } from '../controls/meter.js';

export const REGISTRY = [
  {
    id: 'scrub', factory: scrub, module: 'scrub', export: 'scrub',
    name: 'scrub', title: 'Scrubbable number', jp: 'スクラブ数値',
    axes: { acquisition: 'gestural · relative', mapping: 'linear', commit: 'live' },
    earns: 'The highest-value upgrade to slider-heavy panels: compact, precise, click-to-type.',
    earnsJp: '値そのものが操作子。ドラッグで微調整、クリックで直接入力。',
    opts: { min: 0, max: 100, step: 0.1, value: 42, default: 42, unit: '', label: 'scrub' },
  },
  {
    id: 'log', factory: logSlider, module: 'log-slider', export: 'logSlider',
    name: 'log-slider', title: 'Log-mapped slider', jp: '対数スライダー',
    axes: { acquisition: 'positional · absolute', mapping: 'log / exponential', commit: 'live' },
    earns: 'Fixes wide-range params where a linear track crushes the useful low band.',
    earnsJp: '桁をまたぐ範囲を対数で。低域がつぶれない。',
    opts: { min: 1, max: 10000, step: 1, value: 100, default: 100, map: 'log', unit: '', label: 'iterations' },
  },
  {
    id: 'bipolar', factory: bipolar, module: 'bipolar', export: 'bipolar',
    name: 'bipolar', title: 'Bipolar slider', jp: '双極スライダー',
    axes: { acquisition: 'positional · absolute', mapping: 'bipolar + detent', commit: 'live' },
    earns: 'Signed params where 0 is home; the center detent makes true-zero easy to hit.',
    earnsJp: '符号付きの値。中央のデッドバンドで 0 にピタリと吸着。',
    opts: { min: -1, max: 1, step: 0.01, value: 0, default: 0, map: 'bipolar', detent: 0.06, unit: '', label: 'pan' },
  },
  {
    id: 'xypad', factory: xypad, module: 'xypad', export: 'xypad',
    name: 'xypad', title: 'XY pad', jp: 'XYパッド',
    axes: { acquisition: 'gestural · positional', mapping: 'linear ×2', commit: 'live' },
    earns: 'Two coupled params in one gesture: position, vector, pan/tilt.',
    earnsJp: '二値を一度に。位置・ベクトル・パン/チルト。',
    opts: { min: -1, max: 1, step: 0.01, value: [0.3, -0.2], default: [0, 0], dims: 2, label: 'xy' },
    vector: true,
  },
  {
    id: 'knob', factory: knob, module: 'knob', export: 'knob',
    name: 'knob', title: 'Rotary knob', jp: 'ロータリーノブ',
    axes: { acquisition: 'gestural · relative (vertical drag)', mapping: 'linear', commit: 'live' },
    earns: 'Dense panels: compact, precise fine-tuning where a track would not fit.',
    earnsJp: '高密度パネル向け。縦ドラッグで精密調整。',
    opts: { min: 0, max: 11, step: 0.1, value: 5, default: 5, unit: '', label: 'gain' },
  },
  {
    id: 'arc', factory: arcGauge, module: 'arc', export: 'arcGauge',
    name: 'arc', title: 'Arc gauge', jp: '円弧ゲージ',
    axes: { acquisition: 'positional · absolute (tap-to-jump)', mapping: 'linear', commit: 'live' },
    earns: 'Doubles as a readable gauge: fast to set roughly, at-a-glance state.',
    earnsJp: '設定とゲージを兼ねる。ひと目で現在値。',
    opts: { min: 0, max: 100, step: 1, value: 64, default: 64, unit: '%', label: 'level' },
  },
  {
    id: 'ruler', factory: ruler, module: 'ruler', export: 'ruler',
    name: 'ruler', title: 'Sliding ruler', jp: 'スライド定規',
    axes: { acquisition: 'gestural · relative', mapping: 'linear', commit: 'live' },
    earns: 'The mobile height-picker metaphor: the needle stays put, the scale moves.',
    earnsJp: 'モバイルの身長ピッカー方式。針は固定、目盛りが動く。',
    opts: { min: 0, max: 200, step: 1, value: 120, default: 120, unit: '', label: 'height', ppu: 8, majorEvery: 10 },
  },
  {
    id: 'meter', factory: meter, module: 'meter', export: 'meter',
    name: 'meter', title: 'Segmented meter', jp: 'セグメントメーター',
    axes: { acquisition: 'positional · absolute', mapping: 'linear (quantized)', commit: 'live' },
    earns: 'Quantized params and dot-matrix readouts: the fill edge is the value, no handle to chase.',
    earnsJp: '量子化された値向け。塗りの縁が値。',
    opts: { min: 0, max: 12, step: 1, value: 7, default: 7, segments: 12, unit: '', label: 'level' },
  },
];

export const byId = (id) => REGISTRY.find((r) => r.id === id);
