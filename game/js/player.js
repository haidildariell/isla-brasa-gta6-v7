// Dario Venn on foot: walk, sprint, enter/exit vehicles with E, hotwire delay
// when stealing a locked car, swimming at the shore, health and armour.
import * as THREE from 'three';
import { TUNING, clampValue, distance2D } from './config.js';
import { collideCity } from './city.js';
import { buildPersonMesh } from './pedestrians.js';

export class Player {
  constructor(scene) {
    this.mesh = buildPersonMesh(0xff6b35, 0xc68863, 0x1d3557);
    // hero marker: teal cap so Dario reads at a glance
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 5, 0, Math.PI * 2, 0, 1.4), new THREE.MeshLambertMaterial({ color: 0x2ec4b6 }));
    cap.position.y = 1.98; this.mesh.add(cap);
    this.pos = this.mesh.position;
    this.pos.set(300, 0, -210);
    this.heading = -Math.PI / 2;
    this.health = 100; this.armour = 50;
    this.vehicle = null; this.boat = null;
    this.hotwireT = 0; this.hotwireTarget = null;
    this.dead = false; this.swingT = 0;
    scene.add(this.mesh);
  }
  get onFoot() { return !this.vehicle && !this.boat; }
  focusPos() { return this.vehicle ? this.vehicle.pos : this.boat ? this.boat.pos : this.pos; }
  focusHeading() { return this.vehicle ? this.vehicle.heading : this.boat ? this.boat.heading : this.heading; }
  focusSpeed() { return this.vehicle ? this.vehicle.speed : this.boat ? this.boat.speed : 0; }
  hurt(amount) {
    if (this.dead) return;
    const absorbed = Math.min(this.armour, amount * 0.6);
    this.armour -= absorbed; this.health -= (amount - absorbed);
    if (this.health <= 0) { this.health = 0; this.dead = true; }
  }
  heal(amount) { this.health = Math.min(100, this.health + amount); if (this.health > 0) this.dead = false; }
  nearestVehicle(vehicles, maxD = 4.5) {
    let best = null, bd = maxD;
    for (const v of vehicles) {
      if (v.dead) continue;
      const d = distance2D(this.pos.x, this.pos.z, v.pos.x, v.pos.z);
      if (d < bd) { bd = d; best = v; }
    }
    return best;
  }
  tryEnter(vehicles, boats, onSteal) {
    if (this.boat) { this.exitBoat(); return 'exit'; }
    if (this.vehicle) { this.exitVehicle(); return 'exit'; }
    for (const b of boats) {
      if (distance2D(this.pos.x, this.pos.z, b.pos.x, b.pos.z) < 6) { this.enterBoat(b); return 'boat'; }
    }
    const v = this.nearestVehicle(vehicles);
    if (!v) return null;
    if (v.locked) { this.hotwireTarget = v; this.hotwireT = 1.4; return 'hotwire'; }
    this.enterVehicle(v); if (onSteal) onSteal(v, false);
    return 'car';
  }
  enterVehicle(v) { this.vehicle = v; v.occupied = true; this.mesh.visible = false; }
  exitVehicle() {
    const v = this.vehicle; if (!v) return;
    v.occupied = false; this.vehicle = null;
    this.pos.set(v.pos.x + Math.cos(v.heading) * 2.4, 0, v.pos.z - Math.sin(v.heading) * 2.4);
    this.mesh.visible = true;
  }
  enterBoat(b) { this.boat = b; b.occupied = true; this.mesh.visible = false; }
  exitBoat() {
    const b = this.boat; if (!b) return;
    b.occupied = false; this.boat = null;
    this.pos.set(Math.min(345, b.pos.x - 4), 0, b.pos.z);
    this.mesh.visible = true;
  }
  updatePlayer(dt, input, camHeading, world) {
    if (this.hotwireT > 0 && this.hotwireTarget) {
      this.hotwireT -= dt;
      if (this.hotwireT <= 0) {
        const v = this.hotwireTarget; v.locked = false; this.hotwireTarget = null;
        this.enterVehicle(v); if (world.onSteal) world.onSteal(v, true);
      }
      return;
    }
    if (this.vehicle) {
      this.vehicle.updateDrive(dt, input.drive, world.effects);
      this.pos.copy(this.vehicle.pos);
      return;
    }
    if (this.boat) { this.boat.updateBoat(dt, input.drive); this.pos.copy(this.boat.pos); return; }
    const sp = input.sprint ? TUNING.runSpeed : TUNING.walkSpeed;
    const mx = input.moveX, mz = input.moveZ;
    if (mx || mz) {
      const len = Math.hypot(mx, mz) || 1;
      const sin = Math.sin(camHeading), cos = Math.cos(camHeading);
      const wx = (mx * cos - mz * sin) / len, wz = (-mz * cos - mx * sin) / len;
      this.heading = Math.atan2(wx, wz);
      this.pos.x += wx * sp * dt; this.pos.z += wz * sp * dt;
      collideCity(this.pos, 0.55);
      this.mesh.position.y = Math.abs(Math.sin(performance.now() * 0.014)) * 0.06;
    }
    this.mesh.rotation.y = this.heading;
    if (this.swingT > 0) this.swingT -= dt;
  }
}
