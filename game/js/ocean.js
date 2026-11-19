// Animated sea east of Brasa Bay plus bobbing moored boats in the marina.
import * as THREE from 'three';
import { seededRandom } from './config.js';

export class Ocean {
  constructor(scene) {
    const geo = new THREE.PlaneGeometry(760, 980, 28, 36);
    this.mat = new THREE.MeshPhongMaterial({ color: 0x118ab2, shininess: 140, specular: 0xffd9a0, transparent: true, opacity: 0.94 });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.set(745, 0, 0);
    scene.add(this.mesh);
    this.base = geo.attributes.position.array.slice();
    this.boats = [];
    const rng = seededRandom(777);
    const hullCols = [0xffffff, 0xe63946, 0x2ec4b6, 0xffd166, 0x4361ee];
    for (let i = 0; i < 9; i++) {
      const b = buildMooredBoat(hullCols[i % hullCols.length]);
      b.position.set(385 + (i % 3) * 26 + rng() * 6, 0.4, -305 + Math.floor(i / 3) * 62 + rng() * 10);
      b.rotation.y = Math.PI / 2 + (rng() - 0.5) * 0.3;
      b.userData.phase = rng() * 6.28;
      scene.add(b); this.boats.push(b);
    }
    // distant sailboats
    for (let i = 0; i < 5; i++) {
      const s = buildMooredBoat(0xffffff, true);
      s.position.set(560 + i * 70, 0.4, -320 + i * 130);
      s.userData.phase = i * 1.3; scene.add(s); this.boats.push(s);
    }
  }
  updateOcean(t) {
    const pos = this.mesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = this.base[i * 3], y = this.base[i * 3 + 1];
      pos.setZ(i, Math.sin(x * 0.03 + t * 1.4) * 0.55 + Math.cos(y * 0.045 + t * 1.1) * 0.45);
    }
    pos.needsUpdate = true;
    for (const b of this.boats) {
      b.position.y = 0.35 + Math.sin(t * 1.3 + b.userData.phase) * 0.22;
      b.rotation.z = Math.sin(t * 0.9 + b.userData.phase) * 0.045;
      b.rotation.x = Math.cos(t * 0.7 + b.userData.phase) * 0.03;
    }
  }
}
export function buildMooredBoat(color, sail = false) {
  const g = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(9, 1.6, 3.2), new THREE.MeshLambertMaterial({ color }));
  hull.position.y = 0.6; g.add(hull);
  const bow = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.4, 4), new THREE.MeshLambertMaterial({ color }));
  bow.rotation.z = -Math.PI / 2; bow.rotation.y = Math.PI / 4; bow.position.set(6, 0.6, 0); bow.scale.y = 1; g.add(bow);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.5, 2.4), new THREE.MeshLambertMaterial({ color: 0xf5f0e6 }));
  cab.position.set(-0.6, 1.9, 0); g.add(cab);
  if (sail) {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 9, 5), new THREE.MeshLambertMaterial({ color: 0x8a6d3b }));
    mast.position.set(0.6, 5.4, 0); g.add(mast);
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 6.4), new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    cloth.position.set(-1.4, 5, 0); g.add(cloth);
  }
  return g;
}
