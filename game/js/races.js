// Three street races: checkpoint circuits vs 3 AI rivals, live position
// x/4 and checkpoint counter, cash + RP for winning.
import { distance2D, clampValue } from './config.js';
import { Vehicle, CAR_TYPES } from './vehicles.js';

export const RACE_DEFS = [
  { name: 'Boulevard Burn', start: { x: 262, z: -330 }, checkpoints: [[262, -180], [268, 0], [262, 180], [180, 300], [0, 306], [-180, 300]], prize: 500, rp: 80 },
  { name: 'Old Town Circuit', start: { x: -360, z: -360 }, checkpoints: [[-180, -366], [0, -360], [6, -180], [-60, 0], [-240, 6], [-360, -120]], prize: 700, rp: 100 },
  { name: 'Row Rush', start: { x: -360, z: 366 }, checkpoints: [[-180, 360], [60, 366], [66, 180], [-120, 186], [-300, 60], [-360, 240]], prize: 900, rp: 120 },
];
export class RaceSystem {
  constructor(scene) {
    this.scene = scene; this.active = false; this.def = null;
    this.cpIndex = 0; this.rivals = []; this.rivalCp = []; this.position = 4;
    this.won = 0; this.finished = false; this.time = 0;
  }
  startRace(idx, world) {
    this.def = RACE_DEFS[idx]; this.active = true; this.finished = false;
    this.cpIndex = 0; this.time = 0; this.rivalCp = [0, 0, 0];
    this.rivals = [];
    for (let i = 0; i < 3; i++) {
      const v = new Vehicle(CAR_TYPES[2], [0xffd166, 0x8338ec, 0x06d6a0][i], this.def.start.x - 6 - i * 5, this.def.start.z + (i - 1) * 5, 0);
      this.scene.add(v.mesh); this.rivals.push(v);
    }
    world.hud.toast('RACE — ' + this.def.name + '! Follow the gold checkpoints.', '#ffd166');
    world.hud.showDialog('Vera Quintana', 'Handler — Marina Safehouse', 'Win it clean or win it dirty, Dario. Just win it.', '#2ec4b6');
  }
  currentCheckpoint() { return this.def ? this.def.checkpoints[this.cpIndex] : null; }
  updateRaces(dt, world) {
    if (!this.active) return;
    this.time += dt;
    const p = world.player.focusPos();
    // rivals: waypoint steering
    this.rivals.forEach((v, i) => {
      const cp = this.def.checkpoints[Math.min(this.rivalCp[i], this.def.checkpoints.length - 1)];
      const want = Math.atan2(cp[0] - v.pos.x, cp[1] - v.pos.z);
      let dh = want - v.heading;
      while (dh > Math.PI) dh -= Math.PI * 2; while (dh < -Math.PI) dh += Math.PI * 2;
      v.updateDrive(dt, { throttle: 0.92, steer: clampValue(-dh * 1.3, -1, 1), nitro: false }, world.effects);
      if (v.speed > 30) v.speed = 30;
      if (distance2D(v.pos.x, v.pos.z, cp[0], cp[1]) < 14 && this.rivalCp[i] < this.def.checkpoints.length) this.rivalCp[i]++;
    });
    const cp = this.currentCheckpoint();
    if (cp && distance2D(p.x, p.z, cp[0], cp[1]) < 15) {
      this.cpIndex++;
      world.audio.uiBlip();
      if (this.cpIndex >= this.def.checkpoints.length) { this.finishRace(world); return; }
    }
    const myScore = this.cpIndex * 1000 - (cp ? distance2D(p.x, p.z, cp[0], cp[1]) : 0);
    let pos = 1;
    this.rivals.forEach((v, i) => {
      const rcp = this.def.checkpoints[Math.min(this.rivalCp[i], this.def.checkpoints.length - 1)];
      const rs = this.rivalCp[i] * 1000 - distance2D(v.pos.x, v.pos.z, rcp[0], rcp[1]);
      if (rs > myScore) pos++;
    });
    this.position = pos;
  }
  finishRace(world) {
    this.active = false; this.finished = true;
    if (this.position === 1) {
      this.won++;
      world.cash += this.def.prize;
      world.ranks.addRP(this.def.rp, world.hud);
      world.hud.toast('RACE WON — +$' + this.def.prize + ' · ' + this.def.name, '#ffd166');
      world.audio.cashSound();
    } else {
      world.hud.toast('Race finished P' + this.position + ' — no prize. Run it again.', '#ff9f1c');
    }
    for (const v of this.rivals) this.scene.remove(v.mesh);
    this.rivals = [];
    world.saveGame();
  }
  cancelRace() {
    this.active = false;
    for (const v of this.rivals) this.scene.remove(v.mesh);
    this.rivals = [];
  }
}
