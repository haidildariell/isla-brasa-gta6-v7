// Pedestrians in varied clothes walking in loose groups on sidewalks and the
// boardwalk; they scatter and flee when danger is near.
import * as THREE from 'three';
import { seededRandom, distance2D } from './config.js';
import { collideCity, boulevardX } from './city.js';

const SKIN = [0xf2c49b, 0xc68863, 0x8d5524, 0xffdbac];
const SHIRT = [0xe63946, 0x2ec4b6, 0xffd166, 0x4361ee, 0xffffff, 0x06d6a0, 0xef476f, 0xff8500];
export function buildPersonMesh(shirt, skin, pants) {
  const g = new THREE.Group();
  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.85, 0.3), new THREE.MeshLambertMaterial({ color: pants }));
  legs.position.y = 0.45; g.add(legs);
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.75, 0.34), new THREE.MeshLambertMaterial({ color: shirt }));
  torso.position.y = 1.25; torso.castShadow = true; g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 7), new THREE.MeshLambertMaterial({ color: skin }));
  head.position.y = 1.88; g.add(head);
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.7, 0.16), new THREE.MeshLambertMaterial({ color: shirt }));
    arm.position.set(0, 1.25, s * 0.42); arm.name = 'arm' + s; g.add(arm);
  }
  g.userData.legSwing = legs;
  return g;
}
export class PedestrianSystem {
  constructor(scene, count = 42) {
    this.peds = [];
    const rng = seededRandom(9911);
    for (let i = 0; i < count; i++) {
      const onBoard = i % 3 === 0;
      let x, z;
      if (onBoard) { x = boulevardX(0) - 24 + rng() * 6; z = -440 + rng() * 880; x = 322 - 46 + rng() * 8; }
      else { x = -420 + rng() * 640; z = -430 + rng() * 860; x += 10; z += 10; }
      const mesh = buildPersonMesh(SHIRT[i % SHIRT.length], SKIN[i % SKIN.length], 0x2b2d42);
      mesh.position.set(x, 0, z); scene.add(mesh);
      this.peds.push({ mesh, pos: mesh.position, heading: rng() * 6.28, speed: 1.6 + rng() * 1.4, wander: rng() * 10, flee: 0, phase: rng() * 6.28, board: onBoard });
    }
  }
  updatePedestrians(dt, dangerPos, dangerLevel) {
    for (const p of this.peds) {
      let sp = p.speed;
      if (dangerPos && dangerLevel > 0) {
        const d = distance2D(p.pos.x, p.pos.z, dangerPos.x, dangerPos.z);
        if (d < 16) {
          p.flee = 2.5;
          p.heading = Math.atan2(p.pos.x - dangerPos.x, p.pos.z - dangerPos.z);
        }
      }
      if (p.flee > 0) { p.flee -= dt; sp = 6.2; }
      else {
        p.wander -= dt;
        if (p.wander <= 0) { p.wander = 3 + Math.random() * 6; p.heading += (Math.random() - 0.5) * 1.6; }
      }
      p.pos.x += Math.sin(p.heading) * sp * dt;
      p.pos.z += Math.cos(p.heading) * sp * dt;
      if (!p.board) collideCity(p.pos, 0.5);
      else { p.pos.x = Math.max(300, Math.min(345, p.pos.x)); p.pos.z = Math.max(-460, Math.min(460, p.pos.z)); }
      p.mesh.rotation.y = p.heading;
      const sw = Math.sin(performance.now() * 0.012 + p.phase) * (sp > 3 ? 0.5 : 0.25);
      p.mesh.children[0].rotation.x = sw * 0.4;
      p.mesh.position.y = Math.abs(Math.sin(performance.now() * 0.012 + p.phase)) * 0.05;
    }
  }
}
