// BBPD response: 5-star wanted, patrol + pursuit AI (ram and flank roles),
// busted meter when boxed in, heat loss when out of sight.
import * as THREE from 'three';
import { TUNING, clampValue, distance2D } from './config.js';
import { Vehicle, CAR_TYPES } from './vehicles.js';
import { collideCity } from './city.js';

export function buildPoliceMesh() {
  const v = new Vehicle(CAR_TYPES[1], 0xf4f6f8, 0, 0, 0);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(4.42, 0.34, 1.94), new THREE.MeshBasicMaterial({ color: 0x14406e }));
  stripe.position.y = 0.95; v.mesh.add(stripe);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 1.3), new THREE.MeshBasicMaterial({ color: 0xff3355 }));
  bar.position.set(-0.2, 1.85, 0); bar.name = 'lightbar'; v.mesh.add(bar);
  const bar2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.6), new THREE.MeshBasicMaterial({ color: 0x3388ff }));
  bar2.position.set(-0.2, 1.85, 0.45); v.mesh.add(bar2);
  return v;
}
export class PoliceSystem {
  constructor(scene) {
    this.scene = scene;
    this.wanted = 0; this.heat = 0; this.units = [];
    this.bustedT = 0; this.hiddenT = 0; this.sirenPhase = 0;
    this.spawnT = 0; this.busted = false;
  }
  addHeat(amount) {
    this.heat = clampValue(this.heat + amount, 0, 5);
    this.wanted = Math.max(this.wanted, Math.ceil(this.heat - 0.001));
    this.hiddenT = 0;
  }
  setWanted(n) { this.wanted = clampValue(n, 0, 5); this.heat = Math.max(this.heat, n - 0.4); this.hiddenT = 0; }
  desiredUnits() { return [0, 1, 2, 3, 4, 6][this.wanted] || 0; }
  spawnUnit(playerPos, role) {
    const a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 40;
    const x = clampValue(playerPos.x + Math.cos(a) * d, -440, 330);
    const z = clampValue(playerPos.z + Math.sin(a) * d, -450, 450);
    const v = buildPoliceMesh(); v.pos.set(x, 0, z);
    this.scene.add(v.mesh);
    const unit = { v, role, callsign: 'BRASA-' + (10 + this.units.length * 3 + Math.floor(Math.random() * 3)), state: 'pursuit' };
    this.units.push(unit); return unit;
  }
  updatePolice(dt, player, effects, onBusted) {
    this.sirenPhase += dt * 9;
    const pPos = player.focusPos();
    const want = this.desiredUnits();
    this.spawnT -= dt;
    if (this.units.length < want && this.spawnT <= 0) {
      this.spawnT = 1.6;
      const roles = ['PURSUIT', 'PURSUIT', 'RAMMING', 'FLANKING', 'PURSUIT', 'FLANKING'];
      this.spawnUnit(pPos, roles[this.units.length % roles.length]);
    }
    if (this.units.length > want + 2) {
      const u = this.units.pop(); this.scene.remove(u.v.mesh);
    }
    let seen = false, boxed = 0;
    for (const u of this.units) {
      const v = u.v;
      const d = distance2D(v.pos.x, v.pos.z, pPos.x, pPos.z);
      if (d < TUNING.heatRadius) seen = true;
      let tx = pPos.x, tz = pPos.z;
      if (u.role === 'FLANKING') { tx += Math.cos(player.focusHeading()) * 14; tz -= Math.sin(player.focusHeading()) * 14; }
      if (u.role === 'RAMMING' && d < 26) { tx = pPos.x; tz = pPos.z; }
      const wantHeading = Math.atan2(tx - v.pos.x, tz - v.pos.z);
      let dh = wantHeading - v.heading;
      while (dh > Math.PI) dh -= Math.PI * 2; while (dh < -Math.PI) dh += Math.PI * 2;
      const topSpeed = u.role === 'RAMMING' ? 37 : 34;
      const throttle = d > 7 ? 1 : 0.25;
      v.updateDrive(dt, { throttle, steer: clampValue(-dh * 1.4, -1, 1), nitro: d > 60 }, effects);
      if (v.speed > topSpeed) v.speed = topSpeed;
      const bar = v.mesh.getObjectByName('lightbar');
      if (bar) bar.material.color.setHex(Math.sin(this.sirenPhase) > 0 ? 0xff3355 : 0x3388ff);
      // ram contact
      if (d < 3.4 && Math.abs(v.speed) > 6) {
        if (player.vehicle) { player.vehicle.damage(4); effects.sparks(pPos.x, 1, pPos.z); effects.shake(0.4); }
        else if (player.onFoot) { player.hurt(6); }
      }
      if (d < 8 && Math.abs(player.focusSpeed()) < 3) boxed++;
    }
    // busted logic: boxed in by 2+ units at low speed
    if (boxed >= 2 || (boxed >= 1 && player.onFoot)) {
      this.bustedT += dt;
      if (this.bustedT >= TUNING.bustedTime && !this.busted) { this.busted = true; onBusted(); }
    } else this.bustedT = Math.max(0, this.bustedT - dt * 1.6);
    // heat decay while unseen
    if (!seen && this.wanted > 0) {
      this.hiddenT += dt;
      this.heat -= dt * TUNING.wantedDecay * (this.hiddenT > 4 ? 3 : 1);
      const nw = Math.max(0, Math.ceil(this.heat - 0.001));
      if (nw < this.wanted) this.wanted = nw;
      if (this.wanted === 0) this.heat = 0;
    } else this.hiddenT = 0;
    // despawn far units when calm
    if (this.wanted === 0) {
      for (let i = this.units.length - 1; i >= 0; i--) {
        const u = this.units[i];
        if (distance2D(u.v.pos.x, u.v.pos.z, pPos.x, pPos.z) > 60) { this.scene.remove(u.v.mesh); this.units.splice(i, 1); }
        else u.v.updateDrive(dt, { throttle: 0.4, steer: 0, nitro: false }, effects);
      }
    }
  }
  clearAll() {
    for (const u of this.units) this.scene.remove(u.v.mesh);
    this.units = []; this.wanted = 0; this.heat = 0; this.busted = false; this.bustedT = 0;
  }
}
