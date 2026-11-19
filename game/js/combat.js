// Los Corales gang combat: enemy AI with health bars, muzzle flash, tracers,
// hitscan shooting both ways, car explosions with fire, particles, radius damage.
import * as THREE from 'three';
import { distance2D, clampValue } from './config.js';
import { buildPersonMesh } from './pedestrians.js';

const tracerMat = new THREE.LineBasicMaterial({ color: 0xffe66d });
const flashMat = new THREE.MeshBasicMaterial({ color: 0xffc300 });
export class Enemy {
  constructor(scene, x, z, tough = 1) {
    this.mesh = buildPersonMesh(0x7209b7, 0x8d5524, 0x14141a);
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.16, 0.38), new THREE.MeshBasicMaterial({ color: 0xff2e88 }));
    band.position.y = 1.42; this.mesh.add(band);
    this.pos = this.mesh.position; this.pos.set(x, 0, z);
    this.hp = 60 * tough; this.maxHp = this.hp; this.heading = 0;
    this.state = 'guard'; this.fireT = Math.random(); this.dead = false;
    this.barBg = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.2), new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.DoubleSide }));
    this.barFg = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.13), new THREE.MeshBasicMaterial({ color: 0xff2e88, side: THREE.DoubleSide }));
    this.barBg.position.y = 2.35; this.barFg.position.y = 2.35;
    this.mesh.add(this.barBg); this.mesh.add(this.barFg);
    scene.add(this.mesh);
  }
  hurt(dmg, effects) {
    this.hp -= dmg; effects.hitPuff(this.pos.x, 1.3, this.pos.z);
    if (this.hp <= 0 && !this.dead) { this.dead = true; this.mesh.rotation.x = Math.PI / 2; this.mesh.position.y = 0.3; this.barBg.visible = this.barFg.visible = false; }
    this.barFg.scale.x = Math.max(0.01, this.hp / this.maxHp);
  }
}
export class CombatSystem {
  constructor(scene, effects, audio) {
    this.scene = scene; this.effects = effects; this.audio = audio;
    this.enemies = []; this.tracers = []; this.explosions = [];
    this.flash = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 5), flashMat);
    this.flash.visible = false; scene.add(this.flash);
    this.flashT = 0;
  }
  spawnEnemy(x, z, tough) { const e = new Enemy(this.scene, x, z, tough); this.enemies.push(e); return e; }
  clearEnemies() { for (const e of this.enemies) this.scene.remove(e.mesh); this.enemies = []; }
  aliveEnemies() { return this.enemies.filter(e => !e.dead); }
  tracer(from, to) {
    const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
    const line = new THREE.Line(geo, tracerMat);
    this.scene.add(line); this.tracers.push({ line, life: 0.07 });
  }
  shootAt(shooterPos, targetPos, weapon, onHit) {
    for (let p = 0; p < weapon.pellets; p++) {
      const end = targetPos.clone();
      end.x += (Math.random() - 0.5) * weapon.spread * 60;
      end.y += (Math.random() - 0.5) * weapon.spread * 30;
      end.z += (Math.random() - 0.5) * weapon.spread * 60;
      this.tracer(shooterPos.clone(), end);
      if (onHit) onHit(end);
    }
    this.flash.position.copy(shooterPos); this.flash.visible = true; this.flashT = 0.05;
    this.effects.sparks(shooterPos.x, shooterPos.y, shooterPos.z);
  }
  explodeCar(vehicle, player, police) {
    if (vehicle.exploded) return;
    vehicle.exploded = true; vehicle.dead = true; vehicle.health = 0;
    this.effects.explosion(vehicle.pos.x, 1.2, vehicle.pos.z);
    this.audio.explosion();
    const burn = new THREE.Mesh(new THREE.BoxGeometry(vehicle.type.len, 1, vehicle.type.wid), new THREE.MeshBasicMaterial({ color: 0x1a1a1a }));
    burn.position.copy(vehicle.pos); burn.position.y = 0.9; burn.rotation.y = vehicle.heading;
    this.scene.add(burn);
    this.explosions.push({ x: vehicle.pos.x, z: vehicle.pos.z, t: 3 });
    const hurtNear = (pos, maxD, dmg) => { if (distance2D(pos.x, pos.z, vehicle.pos.x, vehicle.pos.z) < maxD) return dmg; return 0; };
    if (player.onFoot) player.hurt(hurtNear(player.pos, 9, 45));
    else if (player.vehicle && player.vehicle !== vehicle) player.vehicle.damage(hurtNear(player.vehicle.pos, 9, 40));
    for (const e of this.enemies) if (!e.dead && distance2D(e.pos.x, e.pos.z, vehicle.pos.x, vehicle.pos.z) < 9) e.hurt(60, this.effects);
    if (police) police.addHeat(0.8);
  }
  updateCombat(dt, player, police, weapons) {
    if (this.flashT > 0) { this.flashT -= dt; if (this.flashT <= 0) this.flash.visible = false; }
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      this.tracers[i].life -= dt;
      if (this.tracers[i].life <= 0) { this.scene.remove(this.tracers[i].line); this.tracers.splice(i, 1); }
    }
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const ex = this.explosions[i]; ex.t -= dt;
      if (Math.random() < 0.5) this.effects.fire(ex.x, 1.4, ex.z);
      if (ex.t <= 0) this.explosions.splice(i, 1);
    }
    const pPos = player.focusPos();
    for (const e of this.enemies) {
      if (e.dead) continue;
      e.barBg.lookAt(e.pos.x + Math.sin(player.heading), 2.35, e.pos.z + Math.cos(player.heading));
      e.barFg.position.copy(e.barBg.position); e.barFg.quaternion.copy(e.barBg.quaternion);
      const d = distance2D(e.pos.x, e.pos.z, pPos.x, pPos.z);
      e.heading = Math.atan2(pPos.x - e.pos.x, pPos.z - e.pos.z);
      e.mesh.rotation.y = e.heading;
      if (d < 46) e.state = 'attack';
      if (e.state === 'attack') {
        if (d > 15) { e.pos.x += Math.sin(e.heading) * 3.6 * dt; e.pos.z += Math.cos(e.heading) * 3.6 * dt; }
        e.fireT -= dt;
        if (e.fireT <= 0 && d < 42) {
          e.fireT = 0.7 + Math.random() * 0.8;
          const from = new THREE.Vector3(e.pos.x, 1.45, e.pos.z);
          const to = new THREE.Vector3(pPos.x, 1.2, pPos.z);
          this.shootAt(from, to, { pellets: 1, spread: 0.05 }, null);
          this.audio.gunshot(0.4);
          if (Math.random() < clampValue(0.5 - d * 0.008, 0.08, 0.5)) {
            if (player.vehicle) player.vehicle.damage(3); else player.hurt(5);
            this.effects.shake(0.12);
          }
        }
      }
    }
  }
  playerShoot(player, weapons, camera, police) {
    const w = weapons.weapon();
    if (weapons.cooldown > 0) return false;
    if (!weapons.consumeShot()) { this.audio.dryFire(); weapons.cooldown = 0.25; return false; }
    weapons.cooldown = w.rate;
    this.audio.gunshot(w.id === 'shotgun' ? 1 : 0.7);
    this.effects.shake(w.kick * 0.14);
    const origin = new THREE.Vector3();
    if (player.vehicle) origin.set(player.vehicle.pos.x, 1.3, player.vehicle.pos.z);
    else origin.set(player.pos.x, 1.5, player.pos.z);
    const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
    if (w.range < 5) { // melee
      for (const e of this.enemies) {
        if (!e.dead && distance2D(e.pos.x, e.pos.z, origin.x, origin.z) < w.range + 0.6) { e.hurt(w.dmg, this.effects); }
      }
      player.swingT = 0.3;
      return true;
    }
    let best = null, bestScore = 0.94;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const to = new THREE.Vector3(e.pos.x - origin.x, 1.3 - origin.y, e.pos.z - origin.z);
      const dist = to.length(); if (dist > w.range) continue;
      to.normalize();
      const score = to.dot(dir);
      if (score > bestScore) { bestScore = score; best = e; }
    }
    const end = origin.clone().addScaledVector(dir, best ? distance2D(best.pos.x, best.pos.z, origin.x, origin.z) : w.range * 0.7);
    end.y = 1.3;
    this.shootAt(origin, end, w, null);
    if (best) { best.hurt(w.dmg, this.effects); if (best.dead) police.addHeat(0.35); }
    else if (police.wanted > 0 || Math.random() < 0.5) police.addHeat(0.12);
    return true;
  }
}
