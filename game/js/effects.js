// Particles (sparks, smoke, fire), skid marks and camera shake.
import * as THREE from 'three';

export class Effects {
  constructor(scene, camera) {
    this.scene = scene; this.camera = camera;
    this.pool = [];
    this.geo = new THREE.SphereGeometry(0.22, 5, 4);
    this.mats = {
      spark: new THREE.MeshBasicMaterial({ color: 0xffd166 }),
      smoke: new THREE.MeshBasicMaterial({ color: 0x555560, transparent: true, opacity: 0.6 }),
      fire: new THREE.MeshBasicMaterial({ color: 0xff6b35 }),
      splash: new THREE.MeshBasicMaterial({ color: 0x9be7ff }),
      blood: new THREE.MeshBasicMaterial({ color: 0xc1121f }),
    };
    for (let i = 0; i < 260; i++) {
      const m = new THREE.Mesh(this.geo, this.mats.spark);
      m.visible = false; scene.add(m);
      this.pool.push({ mesh: m, life: 0, max: 1, vx: 0, vy: 0, vz: 0, grav: 0 });
    }
    this.skidMat = new THREE.MeshBasicMaterial({ color: 0x111116, transparent: true, opacity: 0.55 });
    this.skids = [];
    this.shakeAmt = 0;
  }
  spawn(kind, x, y, z, count, spread = 3, up = 4) {
    let made = 0;
    for (const p of this.pool) {
      if (p.life > 0) continue;
      p.mesh.material = this.mats[kind]; p.mesh.visible = true;
      p.mesh.position.set(x, y, z);
      p.mesh.scale.setScalar(kind === 'smoke' ? 2.2 : 1);
      p.vx = (Math.random() - 0.5) * spread * 2; p.vz = (Math.random() - 0.5) * spread * 2;
      p.vy = Math.random() * up + 1; p.grav = kind === 'smoke' ? -1.5 : 6;
      p.max = p.life = 0.5 + Math.random() * 0.7;
      if (++made >= count) break;
    }
  }
  sparks(x, y, z) { this.spawn('spark', x, y, z, 6, 2.4, 3); }
  smoke(x, y, z, big = 1) { this.spawn('smoke', x, y, z, 2 * big, 0.8, 2.4); }
  fire(x, y, z) { this.spawn('fire', x, y, z, 5, 1.2, 4.5); this.spawn('smoke', x, y + 1, z, 2, 1, 3); }
  splash(x, y, z) { this.spawn('splash', x, y, z, 8, 2.6, 4); }
  hitPuff(x, y, z) { this.spawn('blood', x, y, z, 4, 1.6, 2.4); }
  explosion(x, y, z) { this.spawn('fire', x, y, z, 22, 5, 8); this.spawn('spark', x, y, z, 14, 6, 7); this.spawn('smoke', x, y + 1, z, 10, 3, 5); this.shake(0.9); }
  skid(x, z) {
    if (this.skids.length > 240) { const old = this.skids.shift(); this.scene.remove(old); }
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 1.6), this.skidMat);
    s.rotation.x = -Math.PI / 2; s.position.set(x, 0.06, z);
    this.scene.add(s); this.skids.push(s);
  }
  shake(amount) { this.shakeAmt = Math.max(this.shakeAmt, amount); }
  updateEffects(dt) {
    for (const p of this.pool) {
      if (p.life <= 0) continue;
      p.life -= dt;
      if (p.life <= 0) { p.mesh.visible = false; continue; }
      p.vy -= p.grav * dt;
      p.mesh.position.x += p.vx * dt; p.mesh.position.y += p.vy * dt; p.mesh.position.z += p.vz * dt;
      if (p.mesh.position.y < 0.1) p.mesh.position.y = 0.1;
      const s = p.life / p.max; p.mesh.scale.setScalar(Math.max(0.2, s * 2));
    }
    if (this.shakeAmt > 0.003) {
      this.camera.position.x += (Math.random() - 0.5) * this.shakeAmt * 0.5;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeAmt * 0.4;
      this.shakeAmt *= Math.max(0, 1 - dt * 5);
    }
  }
}
