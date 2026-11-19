// BBPD roadblocks at wanted >= 3: transverse police car formations plus a
// spike strip placed on the player's likely route.
import * as THREE from 'three';
import { distance2D } from './config.js';
import { buildPoliceMesh } from './police.js';

export class RoadblockSystem {
  constructor(scene) {
    this.scene = scene; this.blocks = []; this.checkT = 0;
  }
  maybeDeploy(wanted, player) {
    if (wanted < 3) { if (this.blocks.length) this.clearBlocks(); return; }
    if (this.blocks.length >= 2) return;
    const p = player.focusPos(), h = player.focusHeading();
    const ahead = 78;
    const bx = p.x + Math.sin(h) * ahead, bz = p.z + Math.cos(h) * ahead;
    // snap to nearest grid road
    const sx = Math.round(bx / 60) * 60, sz = Math.round(bz / 60) * 60;
    const onXRoad = Math.abs(bz - sz) < Math.abs(bx - sx);
    const group = new THREE.Group(); this.scene.add(group);
    const cars = [];
    for (let i = -1; i <= 1; i++) {
      const v = buildPoliceMesh();
      if (onXRoad) { v.pos.set(sx + (Math.random() - 0.5) * 8, 0, sz + i * 4.4); v.heading = Math.PI / 2; }
      else { v.pos.set(sx + i * 4.4, 0, sz + (Math.random() - 0.5) * 8); v.heading = 0; }
      v.mesh.rotation.y = v.heading;
      group.add(v.mesh); cars.push(v);
    }
    // spike strip across the lane
    const spikes = new THREE.Mesh(new THREE.BoxGeometry(onXRoad ? 1.2 : 13, 0.16, onXRoad ? 13 : 1.2),
      new THREE.MeshBasicMaterial({ color: 0xd9d9d9 }));
    spikes.position.set(sx, 0.1, sz + (onXRoad ? 0 : 6));
    if (onXRoad) spikes.position.set(sx + 6, 0.1, sz);
    group.add(spikes);
    const coneMat = new THREE.MeshLambertMaterial({ color: 0xff6b35 });
    for (let i = 0; i < 5; i++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1, 6), coneMat);
      cone.position.set(sx + (onXRoad ? -8 : -8 + i * 4), 0.5, sz + (onXRoad ? -8 + i * 4 : -8));
      group.add(cone);
    }
    this.blocks.push({ group, cars, x: sx, z: sz, spikes, hit: false });
  }
  updateRoadblocks(dt, wanted, player, effects) {
    this.checkT -= dt;
    if (this.checkT <= 0) { this.checkT = 4; this.maybeDeploy(wanted, player); }
    const p = player.focusPos();
    for (let i = this.blocks.length - 1; i >= 0; i--) {
      const b = this.blocks[i];
      const d = distance2D(b.x, b.z, p.x, p.z);
      if (d > 190 || wanted === 0) { this.scene.remove(b.group); this.blocks.splice(i, 1); continue; }
      if (!b.hit && player.vehicle && d < 8 && Math.abs(player.vehicle.speed) > 4) {
        b.hit = true;
        player.vehicle.damage(9); player.vehicle.speed *= 0.45;
        effects.sparks(p.x, 0.6, p.z); effects.shake(0.5);
      }
    }
  }
  clearBlocks() { for (const b of this.blocks) this.scene.remove(b.group); this.blocks = []; }
  nearestDistance(player) {
    const p = player.focusPos(); let best = Infinity;
    for (const b of this.blocks) best = Math.min(best, distance2D(b.x, b.z, p.x, p.z));
    return best;
  }
}
