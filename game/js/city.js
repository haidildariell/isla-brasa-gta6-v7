// Procedural deterministic Brasa Bay: 4 districts, curved beach boulevard,
// beach + boardwalk, pastel towers with emissive windows, neon signs, palms,
// street lamps and street props. All geometry from a fixed seed.
import * as THREE from 'three';
import { CITY, COLORS, DISTRICTS, seededRandom } from './config.js';

const MAT = {
  road: new THREE.MeshLambertMaterial({ color: 0x2e2e38 }),
  roadLine: new THREE.MeshBasicMaterial({ color: 0xf6e8b1 }),
  walk: new THREE.MeshLambertMaterial({ color: 0x9a8f7d }),
  sand: new THREE.MeshLambertMaterial({ color: 0xf2d492 }),
  grass: new THREE.MeshLambertMaterial({ color: 0x5a9367 }),
  board: new THREE.MeshLambertMaterial({ color: 0xa9743f }),
  pier: new THREE.MeshLambertMaterial({ color: 0x7c5a36 }),
  trunk: new THREE.MeshLambertMaterial({ color: 0x7a5230 }),
  leaf: new THREE.MeshLambertMaterial({ color: 0x2e9e5b }),
  lamp: new THREE.MeshBasicMaterial({ color: 0xffe9a8 }),
  white: new THREE.MeshLambertMaterial({ color: 0xf5f0e6 }),
};
export const ROAD_LINES = []; // {axis:'x'|'z', at:number} drivable grid lines
export const COLLIDERS = []; // {x,z,hw,hd}

function box(w, h, d, mat, x, y, z, parent, ry = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = h > 2; m.receiveShadow = true;
  parent.add(m); return m;
}

export function boulevardX(z) { return CITY.beachX - 46 - Math.sin(z * 0.004) * 26; }

export class CityBuilder {
  constructor(scene) {
    this.group = new THREE.Group(); scene.add(this.group);
    this.rng = seededRandom(20261120);
    this.buildGround(); this.buildRoads(); this.buildBlocks(); this.buildBeach(); this.buildMarina(); this.buildProps();
  }
  buildGround() {
    const g = this.group;
    box(760, 1, 940, MAT.grass, -80, -0.5, 0, g);
    box(90, 1.1, 940, MAT.sand, CITY.beachX + 20, -0.45, 0, g);
    const bw = new THREE.Mesh(new THREE.BoxGeometry(10, 1.2, 940), MAT.board);
    bw.position.set(CITY.beachX - 28, 0.1, 0); bw.receiveShadow = true; g.add(bw);
  }
  buildRoads() {
    const g = this.group;
    for (let x = -420; x <= 240; x += CITY.block) { ROAD_LINES.push({ axis: 'z', at: x }); box(CITY.road, 0.12, 940, MAT.road, x, 0.02, 0, g); }
    for (let z = -420; z <= 420; z += CITY.block) { ROAD_LINES.push({ axis: 'x', at: z }); box(700, 0.12, CITY.road, MAT.road, -80, 0.02, z, g); }
    // curved beach boulevard: segmented ribbon following boulevardX(z)
    for (let z = -460; z < 460; z += 23) {
      const seg = new THREE.Mesh(new THREE.BoxGeometry(17, 0.14, 24.5), MAT.road);
      seg.position.set(boulevardX(z + 11), 0.03, z + 11);
      seg.rotation.y = Math.atan((boulevardX(z + 23) - boulevardX(z)) / 23);
      seg.receiveShadow = true; g.add(seg);
    }
    for (let x = -420; x <= 240; x += CITY.block) for (let z = -420; z <= 420; z += 12)
      box(0.5, 0.14, 5, MAT.roadLine, x, 0.04, z, g);
  }
  districtAt(x, z) {
    let best = DISTRICTS[0], bd = 1e9;
    for (const d of DISTRICTS) { const dd = (x - d.cx) ** 2 + (z - d.cz) ** 2; if (dd < bd) { bd = dd; best = d; } }
    return best;
  }
  buildBlocks() {
    const g = this.group, rng = this.rng;
    const winMat = new THREE.MeshBasicMaterial({ color: 0xffca7a });
    const winMat2 = new THREE.MeshBasicMaterial({ color: 0x9be7ff });
    for (let bx = -390; bx <= 210; bx += CITY.block) for (let bz = -390; bz <= 390; bz += CITY.block) {
      if (bx > 150 && bz > -320 && bz < -40) continue; // marina basin cut
      const cx = bx + 30, cz = bz + 30;
      if (Math.abs(cx - boulevardX(cz)) < 34) continue;
      const dist = this.districtAt(cx, cz);
      const tall = dist.id === 'finrow' ? 46 + rng() * 55 : dist.id === 'oldtown' ? 12 + rng() * 14 : 18 + rng() * 30;
      const w = 26 + rng() * 14, d = 26 + rng() * 14;
      const col = COLORS.pastel[Math.floor(rng() * COLORS.pastel.length)];
      const mat = new THREE.MeshLambertMaterial({ color: col });
      const b = box(w, tall, d, mat, cx, tall / 2, cz, g);
      b.castShadow = true;
      box(w + 2, 1.6, d + 2, MAT.white, cx, tall + 0.8, cz, g);
      COLLIDERS.push({ x: cx, z: cz, hw: w / 2 + 1, hd: d / 2 + 1 });
      // emissive window grid on two faces
      const rows = Math.floor(tall / 5), cols = Math.floor(w / 5);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (rng() < 0.45) continue;
        const wm = rng() < 0.7 ? winMat : winMat2;
        const p = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.6), wm);
        p.position.set(cx - w / 2 + 3 + c * 5, 4 + r * 5, cz + d / 2 + 0.06); g.add(p);
      }
      // rooftop props
      if (rng() < 0.6) box(5, 2.4, 5, MAT.walk, cx + rng() * 8 - 4, tall + 2.4, cz, g);
      // neon sign on some blocks
      if (rng() < 0.4) {
        const nm = new THREE.MeshBasicMaterial({ color: COLORS.neon[Math.floor(rng() * COLORS.neon.length)] });
        const s = new THREE.Mesh(new THREE.BoxGeometry(10 + rng() * 8, 2.2, 0.4), nm);
        s.position.set(cx, 6 + rng() * 8, cz + d / 2 + 0.5); g.add(s);
      }
      // sidewalk palms
      if (rng() < 0.75) this.palm(cx - w / 2 - 6, cz + d / 2 + 5);
    }
  }
  palm(x, z) {
    const g = this.group;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 8.5, 6), MAT.trunk);
    trunk.position.set(x, 4.2, z); trunk.rotation.z = 0.09; trunk.castShadow = true; g.add(trunk);
    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.18, 1.1), MAT.leaf);
      const a = (i / 6) * Math.PI * 2;
      leaf.position.set(x + Math.cos(a) * 2.6, 8.9 - Math.abs(Math.sin(a)) * 0.4, z + Math.sin(a) * 2.6);
      leaf.rotation.y = -a; leaf.rotation.z = -0.35; g.add(leaf);
    }
  }
  buildBeach() {
    const g = this.group, rng = this.rng;
    for (let z = -440; z <= 440; z += 44) this.palm(CITY.beachX - 34 + rng() * 6, z + rng() * 8);
    for (let i = 0; i < 22; i++) { // beach umbrellas + towels
      const ux = CITY.beachX + 8 + rng() * 44, uz = -430 + rng() * 860;
      const um = new THREE.Mesh(new THREE.ConeGeometry(3.2, 1.4, 8), new THREE.MeshLambertMaterial({ color: COLORS.neon[i % COLORS.neon.length] }));
      um.position.set(ux, 2.4, uz); g.add(um);
      box(3.4, 0.15, 1.6, MAT.white, ux, 0.15, uz + 3, g, rng());
    }
    // lifeguard tower
    box(5, 6, 5, MAT.white, CITY.beachX + 16, 3, -60, g);
    box(7, 1, 7, new THREE.MeshLambertMaterial({ color: 0xe63946 }), CITY.beachX + 16, 6.5, -60, g);
  }
  buildMarina() {
    const g = this.group;
    // marina basin boardwalks + piers on the water edge (x>360 handled by ocean shore)
    for (let i = 0; i < 4; i++) {
      const pz = -300 + i * 62;
      const pier = new THREE.Mesh(new THREE.BoxGeometry(86, 1.4, 9), MAT.pier);
      pier.position.set(392, 0.7, pz); pier.receiveShadow = true; g.add(pier);
      for (let p = 0; p < 5; p++) box(1.2, 3, 1.2, MAT.pier, 360 + p * 20, -0.6, pz + 4, g);
    }
    // safehouse: low marina building with teal awning
    box(22, 7, 14, new THREE.MeshLambertMaterial({ color: 0xffe8c9 }), 318, 3.5, -252, g);
    box(24, 1, 16, new THREE.MeshBasicMaterial({ color: 0x2ec4b6 }), 318, 7.4, -252, g);
    COLLIDERS.push({ x: 318, z: -252, hw: 12, hd: 8 });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(13, 2, 0.4), new THREE.MeshBasicMaterial({ color: 0x00f5d4 }));
    sign.position.set(318, 5.6, -244.6); g.add(sign);
  }
  buildProps() {
    const g = this.group, rng = this.rng;
    for (let x = -420; x <= 240; x += CITY.block) for (let z = -420; z <= 420; z += CITY.block) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 6.4, 5), MAT.walk);
      pole.position.set(x + 8, 3.2, z + 8); g.add(pole);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 5), MAT.lamp);
      bulb.position.set(x + 8, 6.6, z + 8); g.add(bulb);
    }
    for (let i = 0; i < 60; i++) { // crates, barriers, hydrants, bins
      const x = -420 + rng() * 660, z = -430 + rng() * 860;
      if (Math.abs(x - boulevardX(z)) < 12) continue;
      const kind = i % 3;
      if (kind === 0) box(1.6, 1.6, 1.6, MAT.board, x, 0.8, z, g, rng());
      else if (kind === 1) box(3.4, 1, 0.5, new THREE.MeshLambertMaterial({ color: 0xff6b35 }), x, 0.5, z, g, rng());
      else { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 1.1, 6), new THREE.MeshLambertMaterial({ color: 0xd62828 })); h.position.set(x, 0.55, z); g.add(h); }
    }
    // Brasa Bay Bank tower (Financial Row landmark)
    const bank = box(34, 88, 34, new THREE.MeshLambertMaterial({ color: 0x8ecae6 }), -180, 44, 180, g);
    bank.castShadow = true; COLLIDERS.push({ x: -180, z: 180, hw: 18, hd: 18 });
    const crown = new THREE.Mesh(new THREE.BoxGeometry(36, 3, 36), new THREE.MeshBasicMaterial({ color: 0xffd166 }));
    crown.position.set(-180, 89.5, 180); g.add(crown);
    // Regent Hotel on the boulevard
    box(30, 40, 24, new THREE.MeshLambertMaterial({ color: 0xffc6ff }), 196, 20, -96, g);
    COLLIDERS.push({ x: 196, z: -96, hw: 16, hd: 13 });
  }
}
export function collideCity(pos, radius) {
  for (const c of COLLIDERS) {
    const dx = pos.x - c.x, dz = pos.z - c.z;
    const px = c.hw + radius - Math.abs(dx), pz = c.hd + radius - Math.abs(dz);
    if (px > 0 && pz > 0) {
      if (px < pz) pos.x = c.x + Math.sign(dx || 1) * (c.hw + radius);
      else pos.z = c.z + Math.sign(dz || 1) * (c.hd + radius);
      return true;
    }
  }
  pos.x = Math.max(-455, Math.min(345, pos.x));
  pos.z = Math.max(-465, Math.min(465, pos.z));
  return false;
}
