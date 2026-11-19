// Drivable speedboat: throttle on open water, wake splashes, shore limits.
import * as THREE from 'three';
import { clampValue } from './config.js';
import { buildMooredBoat } from './ocean.js';

export class Speedboat {
  constructor(scene, x, z) {
    this.mesh = buildMooredBoat(0xe63946);
    this.mesh.scale.setScalar(1.25);
    this.pos = this.mesh.position; this.pos.set(x, 0.4, z);
    this.heading = Math.PI / 2; this.speed = 0; this.occupied = false;
    this.name = 'Brasa Skiff 220'; this.health = 100;
    scene.add(this.mesh);
  }
  updateBoat(dt, input) {
    const target = input.throttle * 26;
    this.speed += clampValue(target - this.speed, -18 * dt, 10 * dt);
    this.heading -= input.steer * dt * 0.9 * Math.sign(this.speed || 1);
    this.pos.x += Math.sin(this.heading) * this.speed * dt;
    this.pos.z += Math.cos(this.heading) * this.speed * dt;
    this.pos.x = Math.max(352, Math.min(1050, this.pos.x));
    this.pos.z = Math.max(-460, Math.min(460, this.pos.z));
    this.pos.y = 0.35 + Math.sin(performance.now() * 0.002) * 0.15;
    this.mesh.rotation.y = this.heading - Math.PI / 2;
    this.mesh.rotation.z = -input.steer * 0.08;
  }
}
export function createMarinaBoats(scene) {
  return [new Speedboat(scene, 398, -238), new Speedboat(scene, 430, -120)];
}
