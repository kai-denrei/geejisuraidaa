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
    name: 'scrub', title: 'Scrub',
    axes: { acquisition: 'gestural · relative', mapping: 'linear', commit: 'live' },
    earns: 'Drag the number; click to type.',
    opts: { min: 0, max: 100, step: 0.1, value: 42, default: 42, unit: '', label: 'scrub' },
  },
  {
    id: 'log', factory: logSlider, module: 'log-slider', export: 'logSlider',
    name: 'log-slider', title: 'Log slider',
    axes: { acquisition: 'positional · absolute', mapping: 'log / exponential', commit: 'live' },
    earns: 'Wide ranges without crushing the low end.',
    opts: { min: 1, max: 10000, step: 1, value: 100, default: 100, map: 'log', unit: '', label: 'iterations' },
  },
  {
    id: 'bipolar', factory: bipolar, module: 'bipolar', export: 'bipolar',
    name: 'bipolar', title: 'Bipolar',
    axes: { acquisition: 'positional · absolute', mapping: 'bipolar + detent', commit: 'live' },
    earns: 'Signed values; detent snaps to zero.',
    opts: { min: -1, max: 1, step: 0.01, value: 0, default: 0, map: 'bipolar', detent: 0.06, unit: '', label: 'pan' },
  },
  {
    id: 'xypad', factory: xypad, module: 'xypad', export: 'xypad',
    name: 'xypad', title: 'XY pad',
    axes: { acquisition: 'gestural · positional', mapping: 'linear ×2', commit: 'live' },
    earns: 'Two values, one gesture.',
    opts: { min: -1, max: 1, step: 0.01, value: [0.3, -0.2], default: [0, 0], dims: 2, label: 'xy' },
    vector: true,
  },
  {
    id: 'knob', factory: knob, module: 'knob', export: 'knob',
    name: 'knob', title: 'Knob',
    axes: { acquisition: 'gestural · relative (vertical drag)', mapping: 'linear', commit: 'live' },
    earns: 'Vertical drag; for dense panels.',
    opts: { min: 0, max: 11, step: 0.1, value: 5, default: 5, unit: '', label: 'gain' },
  },
  {
    id: 'arc', factory: arcGauge, module: 'arc', export: 'arcGauge',
    name: 'arc', title: 'Arc gauge',
    axes: { acquisition: 'positional · absolute (tap-to-jump)', mapping: 'linear', commit: 'live' },
    earns: 'Tap the arc; reads as a gauge.',
    opts: { min: 0, max: 100, step: 1, value: 64, default: 64, unit: '%', label: 'level' },
  },
  {
    id: 'ruler', factory: ruler, module: 'ruler', export: 'ruler',
    name: 'ruler', title: 'Ruler',
    axes: { acquisition: 'gestural · relative', mapping: 'linear', commit: 'live' },
    earns: 'Needle fixed; the scale slides.',
    opts: { min: 0, max: 200, step: 1, value: 120, default: 120, unit: '', label: 'height', ppu: 8, majorEvery: 10 },
  },
  {
    id: 'meter', factory: meter, module: 'meter', export: 'meter',
    name: 'meter', title: 'Meter',
    axes: { acquisition: 'positional · absolute', mapping: 'linear (quantized)', commit: 'live' },
    earns: 'Quantized fill; no handle to chase.',
    opts: { min: 0, max: 12, step: 1, value: 7, default: 7, segments: 12, unit: '', label: 'level' },
  },
];

export const byId = (id) => REGISTRY.find((r) => r.id === id);
