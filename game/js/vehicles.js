// Detailed vehicle models (body, glass cabin, 4 wheels, lights, spoiler
// variants) and arcade driving physics with visual damage + smoke.
import * as THREE from 'three';
import { COLORS, TUNING, clampValue, seededRandom } from './config.js';
import { collideCity } from './city.js';

export const CAR_TYPES = [
  { kind: 'compact', name: 'Pico Hatch', len: 3.6, wid: 1.8, top: 24, accel: 0.85 },
  { kind: 'sedan', name: 'Meridian Sedan', len: 4.4, wid: 1.9, top: 29, accel: 1 },
  { kind: 'sports', name: 'Vandal GT', len: 4.3, wid: 2.0, top: 38, accel: 1.35 },
  { kind: 'convertible', name: 'Solana Cabrio', len: 4.2, wid: 1.95, top: 33, accel: 1.15 },
  { kind: 'pickup', name: 'Brasa Bruiser', len: 4.9, wid: 2.1, top: 27, accel: 0.95 },
  { kind: 'van', name: 'Cargo Mule Van', len: 5.0, wid: 2.1, top: 25, accel: 0.8 },
  { kind: 'bike', name: 'Zipper 250', len: 2.2, wid: 0.8, top: 34, accel: 1.3 },
];
const glassMat = new THREE.MeshPhongMaterial({ color: 0x18324a, shininess: 120, specular: 0xbfe8ff });
const tyreMat = new THREE.MeshLambertMaterial({ color: 0x14141a });
const lightMat = new THREE.MeshBasicMaterial({ color: 0xfff6c9 });
const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2244 });

export function buildCarMesh(type, colorHex) {
  const g = new THREE.Group();
  const paint = new THREE.MeshPhongMaterial({ color: colorHex, shininess: 90, specular: 0x888888 });
  const L = type.len, W = type.wid;
  if (type.kind === 'bike') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.5, 0.5), paint); body.position.y = 0.75; g.add(body);
    for (const sx of [-0.85, 0.85]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.16, 10), tyreMat);
      w.rotation.x = Math.PI / 2; w.position.set(sx, 0.42, 0); g.add(w);
    }
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.7), tyreMat); bar.position.set(0.95, 1.15, 0); g.add(bar);
    g.userData.wheels = [];
    return g;
  }
  const bodyH = type.kind === 'van' ? 1.7 : type.kind === 'pickup' ? 1.1 : 0.72;
  const body = new THREE.Mesh(new THREE.BoxGeometry(L, bodyH, W), paint);
  body.position.y = 0.45 + bodyH / 2; body.castShadow = true; g.add(body);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(L * 0.3, bodyH * 0.55, W * 0.94), paint);
  hood.position.set(L * 0.36, 0.45 + bodyH * 0.72, 0); g.add(hood);
  if (type.kind !== 'van' && type.kind !== 'convertible') {
    const cab = new THREE.Mesh(new THREE.BoxGeometry(L * 0.46, 0.62, W * 0.86), glassMat);
    cab.position.set(-L * 0.04, 0.45 + bodyH + 0.3, 0); cab.castShadow = true; g.add(cab);
  }
  if (type.kind === 'convertible') {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(L * 0.4, 0.3, W * 0.8), new THREE.MeshLambertMaterial({ color: 0x8a2f2f }));
    seat.position.set(-L * 0.05, 0.45 + bodyH + 0.12, 0); g.add(seat);
  }
  if (type.kind === 'pickup') {
    const bed = new THREE.Mesh(new THREE.BoxGeometry(L * 0.36, 0.5, W * 0.9), new THREE.MeshLambertMaterial({ color: 0x333340 }));
    bed.position.set(-L * 0.3, 0.45 + bodyH + 0.2, 0); g.add(bed);
  }
  if (type.kind === 'sports') {
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, W * 0.92), paint);
    spoiler.position.set(-L * 0.48, 1.62, 0); g.add(spoiler);
    for (const sz of [-W * 0.36, W * 0.36]) {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.42, 0.12), tyreMat);
      strut.position.set(-L * 0.48, 1.36, sz); g.add(strut);
    }
  }
  const wheels = [];
  const wg = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 12);
  for (const sx of [-L * 0.34, L * 0.34]) for (const sz of [-W / 2, W / 2]) {
    const w = new THREE.Mesh(wg, tyreMat);
    w.rotation.x = Math.PI / 2; w.position.set(sx, 0.42, sz); g.add(w); wheels.push(w);
  }
  for (const sz of [-W * 0.3, W * 0.3]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, 0.42), lightMat); hl.position.set(L / 2 + 0.02, 0.95, sz); g.add(hl);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.42), tailMat); tl.position.set(-L / 2 - 0.02, 0.98, sz); g.add(tl);
  }
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  plate.position.set(-L / 2 - 0.04, 0.62, 0); g.add(plate);
  g.userData.wheels = wheels;
  return g;
}

export class Vehicle {
  constructor(type, colorHex, x, z, heading) {
    this.type = type; this.colorHex = colorHex;
    this.mesh = buildCarMesh(type, colorHex);
    this.mesh.position.set(x, 0, z);
    this.pos = this.mesh.position;
    this.heading = heading; this.speed = 0;
    this.health = 100; this.steer = 0; this.throttle = 0;
    this.nitro = 100; this.armorLv = 0; this.nitroLv = 0;
    this.occupied = false; this.dead = false; this.smokeT = 0;
    this.id = Math.floor(Math.random() * 1e9);
  }
  get name() { return this.type.name; }
  damage(amount) {
    const eff = amount * (1 - this.armorLv * 0.18);
    this.health = Math.max(0, this.health - eff);
    if (this.health <= 0) this.dead = true;
  }
  repair(amount) { this.health = Math.min(100, this.health + amount); if (this.health > 0) this.dead = false; }
  updateDrive(dt, input, effects) {
    if (this.dead) { this.speed *= Math.max(0, 1 - dt * 2); }
    const top = this.type.top * (this.health < 30 ? 0.55 : 1);
    const boost = input.nitro && this.nitro > 0 ? 1.45 : 1;
    if (!this.dead && input.nitro && this.nitro > 0) this.nitro = Math.max(0, this.nitro - dt * 30);
    else this.nitro = Math.min(100, this.nitro + dt * 4);
    const target = input.throttle * top * boost;
    const rate = input.throttle > 0 ? TUNING.carAccel : TUNING.carBrake;
    // smooth arcade approach to target speed
    const diff = target - this.speed;
    this.speed += clampValue(diff, -rate * dt * 2.2, TUNING.carAccel * dt * (input.throttle ? 1 : 0.4));
    this.speed *= Math.max(0, 1 - TUNING.carDrag * dt * 0.12);
    const steerTarget = input.steer * (this.type.kind === 'bike' ? 0.62 : 0.5);
    this.steer += (steerTarget - this.steer) * Math.min(1, dt * 7);
    if (Math.abs(this.speed) > 0.4) {
      const turn = this.steer * TUNING.carGrip * 0.42 * Math.sign(this.speed) * Math.min(1, Math.abs(this.speed) / 9);
      this.heading -= turn * dt * 2.2;
    }
    const nx = this.pos.x + Math.sin(this.heading) * this.speed * dt;
    const nz = this.pos.z + Math.cos(this.heading) * this.speed * dt;
    const before = { x: this.pos.x, z: this.pos.z };
    this.pos.x = nx; this.pos.z = nz;
    if (collideCity(this.pos, 1.6)) {
      const impact = Math.abs(this.speed);
      if (impact > 9) { this.damage((impact - 8) * 1.6); if (effects) effects.shake(0.35); }
      this.speed *= -0.25;
      if (Math.abs(this.pos.x - before.x) < 0.001 && Math.abs(this.pos.z - before.z) < 0.001) { this.pos.x = before.x; this.pos.z = before.z; }
    }
    this.mesh.rotation.y = this.heading;
    this.mesh.position.y = Math.abs(this.speed) > 1 ? Math.sin(performance.now() * 0.05) * 0.012 : 0;
    for (const w of this.mesh.userData.wheels) w.rotation.z -= this.speed * dt * 2.2;
    if (effects && Math.abs(this.steer) > 0.3 && Math.abs(this.speed) > 12) effects.skid(this.pos.x, this.pos.z);
    if (this.health < 35 && !this.dead) {
      this.smokeT -= dt;
      if (this.smokeT <= 0 && effects) { this.smokeT = 0.09; effects.smoke(this.pos.x, 1.4, this.pos.z, this.health < 15 ? 2 : 1); }
    }
  }
}
export function randomCarType(rng) { return CAR_TYPES[Math.floor(rng() * 6)]; }
export function randomPaint(rng) { return COLORS.carPaint[Math.floor(rng() * COLORS.carPaint.length)]; }
export function spawnParkedCars(scene, count, rngSeed) {
  const rng = seededRandom(rngSeed); const out = [];
  const spots = [];
  for (let x = -390; x <= 210; x += 60) for (let z = -390; z <= 390; z += 60) spots.push([x + 16, z + 14]);
  for (let i = 0; i < count && i < spots.length; i++) {
    const s = spots[Math.floor(rng() * spots.length)];
    const v = new Vehicle(randomCarType(rng), randomPaint(rng), s[0] + rng() * 6, s[1] + rng() * 6, Math.floor(rng() * 4) * Math.PI / 2);
    scene.add(v.mesh); out.push(v);
  }
  return out;
}
