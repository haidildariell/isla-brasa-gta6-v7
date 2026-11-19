// District standing: each Brasa Bay district tracks how it feels about
// Dario; jobs and mayhem shift it, HUD shows a meter on district entry.
import { DISTRICTS, distance2D } from './config.js';

export class DistrictStanding {
  constructor() {
    this.standing = { marina: 55, oldtown: 35, laspalmas: 45, finrow: 25 };
    this.current = null; this.bannerT = 0;
  }
  districtAt(x, z) {
    let best = DISTRICTS[0], bd = 1e18;
    for (const d of DISTRICTS) { const dd = distance2D(x, z, d.cx, d.cz); if (dd < bd) { bd = dd; best = d; } }
    return best;
  }
  updateDistricts(playerPos, dt) {
    const d = this.districtAt(playerPos.x, playerPos.z);
    this.bannerT = Math.max(0, this.bannerT - dt);
    if (!this.current || this.current.id !== d.id) { this.current = d; this.bannerT = 4; }
    return d;
  }
  shiftStanding(districtId, amount) {
    this.standing[districtId] = Math.max(0, Math.min(100, (this.standing[districtId] ?? 50) + amount));
  }
  label(id) {
    const s = this.standing[id] ?? 50;
    return s >= 75 ? 'BELOVED' : s >= 55 ? 'RESPECTED' : s >= 35 ? 'KNOWN' : s >= 18 ? 'WATCHED' : 'HUNTED';
  }
}
