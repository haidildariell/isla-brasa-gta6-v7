// ISLA BRASA — central tuning for Brasa Bay: city layout, physics, economy.
export const CITY = {
  size: 900, block: 60, road: 14, beachX: 300, waterX: 360,
  boulevardZ: [-270, -90, 90, 270],
};
export const DISTRICTS = [
  { id: 'marina', name: 'Marina District', cx: 330, cz: -180, r: 170, tint: 0x2ec4b6 },
  { id: 'oldtown', name: 'Old Town', cx: -220, cz: -200, r: 190, tint: 0xf4a261 },
  { id: 'palmas', name: 'Las Palmas', cx: 180, cz: 60, r: 200, tint: 0xffd166 },
  { id: 'finrow', name: 'Financial Row', cx: -180, cz: 180, r: 190, tint: 0x8ecae6 },
];
export const SAFEHOUSE = { x: 318, z: -232 };
export const TUNING = {
  walkSpeed: 7, runSpeed: 12, gravity: 30,
  carAccel: 26, carBrake: 40, carDrag: 0.6, carGrip: 3.4,
  wantedDecay: 0.012, bustedTime: 3.0, heatRadius: 130,
  dayLength: 600, startHour: 17.6,
};
export const COLORS = {
  pastel: [0xffd6a5, 0xffadad, 0xcaffbf, 0x9bf6ff, 0xa0c4ff, 0xffc6ff, 0xfdffb6, 0xffb4a2, 0xe5989b, 0xb5838d],
  carPaint: [0xe63946, 0xf1fa8c, 0x2ec4b6, 0x4361ee, 0xff8500, 0xffffff, 0x22223b, 0x06d6a0, 0xef476f, 0xffd166, 0x8338ec, 0x3a86ff],
  neon: [0xff2e88, 0x00f5d4, 0xf9ed69, 0xff8500, 0x4cc9f0],
};
export function seededRandom(seed) {
  let s = seed >>> 0 || 1;
  return function nextRandom() {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}
export function clampValue(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
export function lerpValue(a, b, t) { return a + (b - a) * t; }
export function distance2D(ax, az, bx, bz) { const dx = ax - bx, dz = az - bz; return Math.sqrt(dx * dx + dz * dz); }
export function formatCash(n) { return '$' + Math.floor(n).toLocaleString('en-US'); }
export function formatClock(hours) {
  const h = Math.floor(hours) % 24, m = Math.floor((hours % 1) * 60);
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}
