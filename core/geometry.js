// core/geometry.js — polar + arc path helpers (spec §5, verbatim math)
//
// Angles in degrees, y-down clockwise (SVG convention). Shared by knob + arc.

export const polar = (cx, cy, r, deg) => {
  const a = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
};

export const arc = (cx, cy, r, a0, a1) => {
  const p0 = polar(cx, cy, r, a0);
  const p1 = polar(cx, cy, r, a1);
  const lg = a1 - a0 > 180 ? 1 : 0;
  return `M${p0.x} ${p0.y} A${r} ${r} 0 ${lg} 1 ${p1.x} ${p1.y}`;
};
