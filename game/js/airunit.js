// BBPD air unit FALCON: police helicopter that deploys at high wanted,
// tracks the player and paints them with a spotlight cone.
import * as THREE from 'three';
import { distance2D } from './config.js';

export class AirUnit {
  constructor(scene) {
    this.group = new THREE.Group();
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xf4f6f8 });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x14406e });
    const body = new THREE.Mesh(new THREE.BoxGeometry(5.4, 2.2, 2.4), bodyMat); this.group.add(body);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.7, 0.7), darkMat); tail.position.set(-5.2, 0.4, 0); this.group.add(tail);
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.8, 0.3), darkMat); fin.position.set(-7.8, 0.9, 0); this.group.add(fin);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.3, 2.1), new THREE.MeshPhongMaterial({ color: 0x18324a, shininess: 120 }));
    glass.position.set(2.6, 0.2, 0); this.group.add(glass);
    this.rotor = new THREE.Mesh(new THREE.BoxGeometry(13, 0.08, 0.7), darkMat);
    this.rotor.position.y = 1.5; this.group.add(this.rotor);
    const skidL = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.16, 0.16), darkMat); skidL.position.set(0, -1.5, 1.1); this.group.add(skidL);
    const skidR = skidL.clone(); skidR.position.z = -1.1; this.group.add(skidR);
    // spotlight cone + pool
    const coneMat = new THREE.MeshBasicMaterial({ color: 0xfff3b0, transparent: true, opacity: 0.30, depthWrite: false, side: THREE.DoubleSide });
    this.cone = new THREE.Mesh(new THREE.ConeGeometry(11, 46, 18, 1, true), coneMat);
    this.spot = new THREE.SpotLight(0xfff3b0, 900, 160, 0.32, 0.5, 1.2);
    this.pool = new THREE.Mesh(new THREE.CircleGeometry(9, 20), new THREE.MeshBasicMaterial({ color: 0xfff3b0, transparent: true, opacity: 0.3, depthWrite: false }));
    this.pool.rotation.x = -Math.PI / 2;
    scene.add(this.group); scene.add(this.cone); scene.add(this.spot); scene.add(this.spot.target); scene.add(this.pool);
    this.active = false; this.alt = 44; this.orbit = 0;
    this.setVisible(false);
  }
  setVisible(v) {
    this.group.visible = v; this.cone.visible = v; this.pool.visible = v;
    this.spot.visible = v; this.active = v;
  }
  deployIfNeeded(wanted, inMission) {
    const should = wanted >= 4 || (inMission && wanted >= 3);
    if (should !== this.active) this.setVisible(should);
    return this.active;
  }
  updateAirUnit(dt, playerPos, t) {
    if (!this.active) return;
    this.orbit += dt * 0.35;
    const gx = playerPos.x + Math.cos(this.orbit) * 27;
    const gz = playerPos.z + Math.sin(this.orbit) * 27;
    this.group.position.x += (gx - this.group.position.x) * Math.min(1, dt * 1.6);
    this.group.position.z += (gz - this.group.position.z) * Math.min(1, dt * 1.6);
    this.group.position.y = this.alt + Math.sin(t * 1.7) * 1.4;
    this.group.rotation.y = Math.atan2(playerPos.x - this.group.position.x, playerPos.z - this.group.position.z) - Math.PI / 2;
    this.rotor.rotation.y += dt * 28;
    // cone from heli belly down to the player
    const from = this.group.position, to = new THREE.Vector3(playerPos.x, 0.4, playerPos.z);
    const mid = from.clone().add(to).multiplyScalar(0.5);
    this.cone.position.copy(mid);
    this.cone.lookAt(to); this.cone.rotateX(-Math.PI / 2);
    this.cone.scale.y = from.distanceTo(to) / 46;
    this.spot.position.copy(from); this.spot.target.position.copy(to);
    this.pool.position.set(playerPos.x, 0.25, playerPos.z);
    this.distance = distance2D(from.x, from.z, playerPos.x, playerPos.z);
  }
}
