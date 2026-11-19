// Lane-following city traffic: varied cars, braking, obstacle avoidance,
// densest on the beach boulevard. Cars loop the grid and the boulevard curve.
import * as THREE from 'three';
import { CITY, seededRandom, clampValue, distance2D } from './config.js';
import { Vehicle, CAR_TYPES, randomPaint } from './vehicles.js';
import { boulevardX } from './city.js';

class TrafficCar {
  constructor(vehicle, route) {
    this.v = vehicle; this.route = route; this.t = 0; this.speed = 0;
    this.cruise = 11 + Math.random() * 7;
  }
}
export class TrafficSystem {
  constructor(scene, count = 26) {
    this.cars = [];
    const rng = seededRandom(4242);
    for (let i = 0; i < count; i++) {
      const type = CAR_TYPES[Math.floor(rng() * 6)];
      const onBlvd = i < 10;
      let route, x, z, h;
      if (onBlvd) {
        z = -440 + rng() * 880; x = boulevardX(z) + (i % 2 ? 4 : -4); h = i % 2 ? Math.PI : 0;
        route = { kind: 'blvd', dir: i % 2 ? -1 : 1, lane: i % 2 ? 4 : -4 };
      } else {
        const horiz = rng() < 0.5;
        const line = Math.round((rng() * 14 - 7)) * 60;
        if (horiz) { x = -420 + rng() * 640; z = line + (i % 2 ? 3.4 : -3.4); h = i % 2 ? -Math.PI / 2 : Math.PI / 2; route = { kind: 'grid', axis: 'x', at: line, dir: i % 2 ? -1 : 1, lane: i % 2 ? 3.4 : -3.4 }; }
        else { z = -420 + rng() * 840; x = line + (i % 2 ? 3.4 : -3.4); h = i % 2 ? Math.PI : 0; route = { kind: 'grid', axis: 'z', at: line > 240 ? 240 : line, dir: i % 2 ? -1 : 1, lane: i % 2 ? 3.4 : -3.4 }; }
      }
      const veh = new Vehicle(type, randomPaint(rng), x, z, h);
      scene.add(veh.mesh);
      this.cars.push(new TrafficCar(veh, route));
    }
  }
  updateTraffic(dt, playerPos, allVehicles) {
    for (const c of this.cars) {
      const v = c.v;
      if (v.occupied || v.dead) continue;
      let target = c.cruise;
      // brake for the player and other cars ahead
      for (const o of allVehicles) {
        if (o === v) continue;
        const d = distance2D(v.pos.x, v.pos.z, o.pos.x, o.pos.z);
        if (d < 11) {
          const ahead = (o.pos.x - v.pos.x) * Math.sin(v.heading) + (o.pos.z - v.pos.z) * Math.cos(v.heading);
          if (ahead > 0) target = Math.min(target, d < 6 ? 0 : c.cruise * 0.4);
        }
      }
      if (playerPos && distance2D(v.pos.x, v.pos.z, playerPos.x, playerPos.z) < 9) target = Math.min(target, 2);
      c.speed += clampValue(target - c.speed, -22 * dt, 9 * dt);
      const r = c.route;
      if (r.kind === 'blvd') {
        v.pos.z += Math.cos(0) * 0; // boulevard runs along z
        v.pos.z += r.dir * c.speed * dt;
        const wantX = boulevardX(v.pos.z) + r.lane;
        v.pos.x += clampValue(wantX - v.pos.x, -6 * dt, 6 * dt);
        v.heading = r.dir > 0 ? 0 : Math.PI;
        if (v.pos.z > 460) v.pos.z = -460; if (v.pos.z < -460) v.pos.z = 460;
      } else if (r.axis === 'x') {
        v.pos.x += r.dir * c.speed * dt;
        v.heading = r.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        if (v.pos.x > 250) v.pos.x = -430; if (v.pos.x < -440) v.pos.x = 240;
      } else {
        v.pos.z += r.dir * c.speed * dt;
        v.heading = r.dir > 0 ? 0 : Math.PI;
        if (v.pos.z > 460) v.pos.z = -460; if (v.pos.z < -460) v.pos.z = 460;
      }
      v.mesh.position.y = 0;
      v.mesh.rotation.y = v.heading;
      v.speed = c.speed;
      for (const w of v.mesh.userData.wheels) w.rotation.z -= c.speed * dt * 2.2;
    }
  }
  vehicles() { return this.cars.map(c => c.v); }
}
