// Live top-down minimap on canvas: roads, beach, water, blips for police,
// mission objective, shops, safehouse, race checkpoints and the route line.
import { CITY, DISTRICTS } from './config.js';
import { boulevardX } from './city.js';
import { SHOP_SPOTS } from './shops.js';
import { SAFEHOUSE } from './config.js';

export class Minimap {
  constructor(canvas) {
    this.cv = canvas; this.ctx = canvas.getContext('2d');
    this.range = 240;
  }
  worldToMap(x, z, cx, cz, size) {
    const s = size / (this.range * 2);
    return [size / 2 + (x - cx) * s, size / 2 + (z - cz) * s];
  }
  drawMinimap(world) {
    const ctx = this.ctx, size = this.cv.width;
    const p = world.player.focusPos();
    ctx.fillStyle = '#20303c'; ctx.fillRect(0, 0, size, size);
    const plot = (x, z) => this.worldToMap(x, z, p.x, p.z, size);
    // water + beach
    ctx.fillStyle = '#118ab2';
    const [wx] = plot(CITY.waterX, 0); ctx.fillRect(wx, 0, size - wx, size);
    ctx.fillStyle = '#f2d492';
    const [bx] = plot(CITY.beachX - 10, 0); ctx.fillRect(bx, 0, Math.max(0, wx - bx), size);
    // roads
    ctx.strokeStyle = '#4a5568'; ctx.lineWidth = 3;
    for (let gx = -420; gx <= 240; gx += 60) {
      const [a] = plot(gx, 0); ctx.beginPath(); ctx.moveTo(a, 0); ctx.lineTo(a, size); ctx.stroke();
    }
    for (let gz = -420; gz <= 420; gz += 60) {
      const [, b] = plot(0, gz); ctx.beginPath(); ctx.moveTo(0, b); ctx.lineTo(size, b); ctx.stroke();
    }
    ctx.strokeStyle = '#6b7a8c'; ctx.lineWidth = 4; ctx.beginPath();
    for (let z = -460; z <= 460; z += 20) { const [mx, my] = plot(boulevardX(z), z); z === -460 ? ctx.moveTo(mx, my) : ctx.lineTo(mx, my); }
    ctx.stroke();
    const blip = (x, z, color, r = 3, square = false) => {
      const [mx, my] = plot(x, z);
      if (mx < -6 || my < -6 || mx > size + 6 || my > size + 6) return;
      ctx.fillStyle = color;
      if (square) ctx.fillRect(mx - r, my - r, r * 2, r * 2);
      else { ctx.beginPath(); ctx.arc(mx, my, r, 0, 6.29); ctx.fill(); }
    };
    // route to objective
    const obj = world.missions.active ? world.missions.objectivePos() : (world.races.active ? { x: world.races.currentCheckpoint()[0], z: world.races.currentCheckpoint()[1] } : null);
    if (obj) {
      const [ox, oy] = plot(obj.x, obj.z);
      ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(size / 2, size / 2); ctx.lineTo(ox, oy); ctx.stroke(); ctx.setLineDash([]);
      blip(obj.x, obj.z, '#ffd166', 5);
    }
    // safehouse + shops
    blip(SAFEHOUSE.x, SAFEHOUSE.z, '#2ec4b6', 4, true);
    for (const s of SHOP_SPOTS) blip(s.x, s.z, s.kind === 'arms' ? '#ff9f1c' : '#4cc9f0', 3, true);
    // traffic dots
    ctx.fillStyle = '#aab4be';
    for (const v of world.traffic.vehicles()) { const [mx, my] = plot(v.pos.x, v.pos.z); if (mx > 0 && my > 0 && mx < size && my < size) ctx.fillRect(mx - 1, my - 1, 2, 2); }
    // enemies
    for (const e of world.combat.enemies) if (!e.dead) blip(e.pos.x, e.pos.z, '#ff2e88', 3);
    // police (always in shot staging / when Eyes Out or wanted)
    if (world.police.wanted > 0 || world.crew.eyesOutT > 0 || world.staged) {
      for (const u of world.police.units) blip(u.v.pos.x, u.v.pos.z, '#3a86ff', 3.5);
      if (world.air.active) blip(world.air.group.position.x, world.air.group.position.z, '#ffffff', 3);
    }
    for (const b of world.roadblocks.blocks) blip(b.x, b.z, '#ff5964', 4, true);
    // player arrow
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate(-world.player.focusHeading() + Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5, 6); ctx.lineTo(0, 3); ctx.lineTo(-5, 6); ctx.closePath(); ctx.fill();
    ctx.restore();
    // district tint ring
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, size - 2, size - 2);
  }
}
export function districtOf(x, z) {
  let best = DISTRICTS[0], bd = 1e18;
  for (const d of DISTRICTS) { const dd = (x - d.cx) ** 2 + (z - d.cz) ** 2; if (dd < bd) { bd = dd; best = d; } }
  return best;
}
