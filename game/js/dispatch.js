// BBPD dispatch model: named units with callsigns, roles and live distances
// feeding the HUD dispatch panel; FALCON is the air unit, RB units roadblocks.
import { distance2D } from './config.js';

export const ROLE_COLORS = {
  PURSUIT: '#4cc9f0', RAMMING: '#ff5964', FLANKING: '#ffd166',
  SPOTLIGHT: '#ffe66d', ROADBLOCK: '#ff9f1c', PATROL: '#8ecae6',
};
export class DispatchModel {
  constructor() { this.units = []; this.note = 'All quiet on the bay.'; }
  refreshDispatch(police, air, roadblocks, player) {
    const p = player.focusPos();
    this.units = [];
    for (const u of police.units) {
      this.units.push({
        callsign: u.callsign, role: u.role,
        dist: Math.round(distance2D(u.v.pos.x, u.v.pos.z, p.x, p.z)),
      });
    }
    if (air.active) this.units.push({ callsign: 'FALCON', role: 'SPOTLIGHT', dist: Math.round(air.distance || 42) });
    roadblocks.blocks.forEach((b, i) => {
      this.units.push({ callsign: 'RB-' + (i + 1), role: 'ROADBLOCK', dist: Math.round(distance2D(b.x, b.z, p.x, p.z)) });
    });
    this.units.sort((a, b) => a.dist - b.dist);
    const rb = roadblocks.nearestDistance(player);
    if (police.wanted >= 4) this.note = 'FALCON overhead — stay under cover, Dario.';
    else if (rb < 90) this.note = 'Roadblock ahead ' + Math.round(rb) + 'm — cut through an alley block.';
    else if (police.wanted >= 2) this.note = 'Units converging on your last known position.';
    else if (police.wanted === 1) this.note = 'One unit sniffing around. Lay low.';
    else this.note = 'All quiet on the bay.';
    return this.units;
  }
}
