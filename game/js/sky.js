// Golden-hour sky dome, sun, drifting clouds and dynamic lighting for Brasa Bay.
import * as THREE from 'three';
import { TUNING } from './config.js';

export class SkyDome {
  constructor(scene) {
    this.scene = scene;
    this.hour = TUNING.startHour;
    const geo = new THREE.SphereGeometry(1600, 24, 16);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color(0x2b4a7a) }, mid: { value: new THREE.Color(0xff9e5e) }, bot: { value: new THREE.Color(0xffd9a0) } },
      vertexShader: 'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying vec3 vP; void main(){ float h=normalize(vP).y; vec3 c=h>0.25?mix(mid,top,smoothstep(0.25,0.9,h)):mix(bot,mid,smoothstep(-0.05,0.25,h)); gl_FragColor=vec4(c,1.0); }',
    });
    this.dome = new THREE.Mesh(geo, mat); scene.add(this.dome);
    this.sun = new THREE.DirectionalLight(0xffb36b, 2.4);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.left = -260; this.sun.shadow.camera.right = 260;
    this.sun.shadow.camera.top = 260; this.sun.shadow.camera.bottom = -260;
    this.sun.shadow.camera.far = 900;
    scene.add(this.sun); scene.add(this.sun.target);
    this.hemi = new THREE.HemisphereLight(0xffd9a8, 0x33455e, 0.85); scene.add(this.hemi);
    this.amb = new THREE.AmbientLight(0xffe0b8, 0.35); scene.add(this.amb);
    const sunBall = new THREE.Mesh(new THREE.SphereGeometry(28, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffdf8a, fog: false }));
    this.sunBall = sunBall; scene.add(sunBall);
    this.clouds = new THREE.Group();
    const cm = new THREE.MeshLambertMaterial({ color: 0xfff2e0, transparent: true, opacity: 0.82 });
    for (let i = 0; i < 26; i++) {
      const c = new THREE.Mesh(new THREE.SphereGeometry(18 + (i % 5) * 7, 8, 6), cm);
      c.scale.y = 0.32;
      c.position.set(-900 + (i * 137) % 1800, 190 + (i % 4) * 26, -800 + (i * 211) % 1600);
      this.clouds.add(c);
    }
    scene.add(this.clouds);
    scene.fog = new THREE.Fog(0xf7b267, 320, 1250);
  }
  updateSky(dt, focus) {
    this.hour = (this.hour + dt * 24 / TUNING.dayLength) % 24;
    const t = (this.hour - 6) / 12;
    const elev = Math.max(0.06, Math.sin(Math.PI * Math.min(1, Math.max(0, t))));
    const az = Math.PI * (0.15 + t * 0.7);
    const dir = new THREE.Vector3(Math.cos(az), elev * 0.8 + 0.12, Math.sin(az) * 0.6 - 0.35).normalize();
    this.sun.position.copy(focus).addScaledVector(dir, 420);
    this.sun.target.position.copy(focus);
    this.sunBall.position.copy(focus).addScaledVector(dir, 1350);
    const dusk = 1 - Math.min(1, elev * 2.2);
    this.sun.intensity = 1.1 + elev * 1.6;
    this.sun.color.setHSL(0.08 + elev * 0.03, 0.85, 0.62);
    this.hemi.intensity = 0.45 + elev * 0.5;
    this.dome.material.uniforms.mid.value.setHSL(0.06 + elev * 0.02, 0.9, 0.55 + elev * 0.08);
    this.dome.material.uniforms.top.value.setHSL(0.6, 0.55, 0.22 + elev * 0.3);
    this.dome.position.copy(focus);
    for (const c of this.clouds.children) { c.position.x += dt * 2.2; if (c.position.x > 1000) c.position.x = -1000; }
    return dusk;
  }
}
