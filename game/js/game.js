// ISLA BRASA — main binder: builds the world, wires every system, runs the
// loop, input, camera, interactions and the ?shot= staging modes.
import * as THREE from 'three';
import { SAFEHOUSE, clampValue, distance2D } from './config.js';
import { CityBuilder, boulevardX } from './city.js';
import { SkyDome } from './sky.js';
import { Ocean } from './ocean.js';
import { Effects } from './effects.js';
import { Vehicle, CAR_TYPES, spawnParkedCars } from './vehicles.js';
import { TrafficSystem } from './traffic.js';
import { PedestrianSystem } from './pedestrians.js';
import { Player } from './player.js';
import { createMarinaBoats } from './boat.js';
import { PoliceSystem } from './police.js';
import { AirUnit } from './airunit.js';
import { RoadblockSystem } from './roadblocks.js';
import { DispatchModel } from './dispatch.js';
import { WeaponInventory, WEAPONS } from './weapons.js';
import { CombatSystem } from './combat.js';
import { MissionSystem } from './missions.js';
import { RaceSystem } from './races.js';
import { Garage, UPGRADE_DEFS } from './garage.js';
import { ShopSystem, SHOP_SPOTS } from './shops.js';
import { RankSystem } from './ranks.js';
import { CrewAbilities } from './crew.js';
import { DistrictStanding } from './districts.js';
import { RadioSystem } from './radio.js';
import { AudioEngine } from './audio.js';
import { Hud } from './hud.js';
import { Minimap } from './minimap.js';
import { SaveSystem } from './save.js';
import { ActivitySystem } from './activities.js';

const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(66, innerWidth / innerHeight, 0.1, 2600);

const world = {
  scene, camera, cash: 350, staged: !!shotName, promptText: '',
  time: 0, started: false, paused: false,
};
world.sky = new SkyDome(scene);
world.city = new CityBuilder(scene);
world.ocean = new Ocean(scene);
world.effects = new Effects(scene, camera);
world.audio = new AudioEngine();
world.radio = new RadioSystem(world.audio);
world.hud = new Hud();
world.minimap = new Minimap(document.getElementById('minimap'));
world.weapons = new WeaponInventory();
world.ranks = new RankSystem();
world.crew = new CrewAbilities();
world.districts = new DistrictStanding();
world.garage = new Garage();
world.shops = new ShopSystem();
world.police = new PoliceSystem(scene);
world.air = new AirUnit(scene);
world.roadblocks = new RoadblockSystem(scene);
world.dispatch = new DispatchModel();
world.combat = new CombatSystem(scene, world.effects, world.audio);
world.missions = new MissionSystem();
world.activities = new ActivitySystem();
world.races = new RaceSystem(scene);
world.traffic = new TrafficSystem(scene, 26);
world.peds = new PedestrianSystem(scene, 42);
world.player = new Player(scene);
world.boats = createMarinaBoats(scene);
world.parked = spawnParkedCars(scene, 16, 5150);
world.onSteal = (v, hotwired) => {
  world.police.addHeat(hotwired ? 1.2 : 0.5);
  world.ranks.addRP(6, world.hud);
  world.hud.toast(hotwired ? 'Hotwired! BBPD noticed.' : 'Car taken — ' + v.type.name, '#ff9f1c');
};
world.saveGame = () => SaveSystem.saveGame(world);
world.spawnChaseTarget = (at) => {
  const v = new Vehicle(CAR_TYPES[2], 0xffd166, at.x, at.z, 0);
  scene.add(v.mesh);
  world.missions.chaseCar = v;
  world.chaseAI = { v, t: 0 };
};
// objective marker beam
const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 60, 10, 1, true),
  new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
beam.visible = false; scene.add(beam);
const raceBeam = beam.clone(); raceBeam.material = beam.material.clone(); raceBeam.material.color.setHex(0x2ec4b6); scene.add(raceBeam);

// ---------- input ----------
const keys = {};
let mouseDX = 0, mouseDY = 0, mouseDown = false, pointerLocked = false;
let camYaw = Math.PI, camPitch = 0.32;
addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (!world.started || world.paused) return;
  world.audio.initAudio();
  if (e.code === 'KeyE') {
    const r = world.player.tryEnter(allVehicles(), world.boats, world.onSteal);
    if (r === 'car' || r === 'boat') world.audio.uiBlip();
  }
  if (e.code === 'KeyF') interactF();
  if (e.code === 'KeyR' && !world.races.active && !world.missions.active) world.races.startRace(Math.floor(Math.random() * 3), world);
  if (e.code === 'KeyT' && !world.activities.active) {
    const a = world.activities.nearestActivity(world.player.focusPos());
    if (a) world.activities.startActivity(a, world);
  }
  if (e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'Digit3') {
    if (world.garage.open) buyGarageUpgrade(Number(e.code.slice(-1)));
    else world.crew.useCrewAbility(['plates', 'fix', 'eyes'][Number(e.code.slice(-1)) - 1], world);
  }
  if (e.code === 'Digit4' || e.code === 'Digit5' || e.code === 'Digit6') {
    if (world.garage.open) buyGarageUpgrade(Number(e.code.slice(-1)));
  }
  if (e.code === 'KeyQ') { world.weapons.wheelOpen = true; }
  if (e.code === 'Tab') { e.preventDefault(); world.radio.cycleStation(world.hud); }
  if (e.code === 'KeyV') world.radio.cycleStation(world.hud);
  if (e.code === 'KeyG') world.audio.horn();
});
addEventListener('keyup', (e) => {
  keys[e.code] = false;
  if (e.code === 'KeyQ') { world.weapons.wheelOpen = false; world.hud.hideWheel(); }
  if (e.code === 'Escape' && world.started) togglePause();
});
canvas.addEventListener('click', () => {
  world.audio.initAudio();
  if (world.started && !world.paused && !pointerLocked && !shotName) canvas.requestPointerLock();
});
addEventListener('mousemove', (e) => {
  if (pointerLocked) { mouseDX += e.movementX; mouseDY += e.movementY; }
});
addEventListener('mousedown', (e) => { if (e.button === 0) mouseDown = true; });
addEventListener('mouseup', (e) => { if (e.button === 0) mouseDown = false; });
addEventListener('wheel', (e) => { if (world.started) world.weapons.cycle(e.deltaY > 0 ? 1 : -1, world.ranks.rank); });
document.addEventListener('pointerlockchange', () => { pointerLocked = document.pointerLockElement === canvas; });
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
function allVehicles() {
  return [...world.parked, ...world.traffic.vehicles(), ...(world.missions.chaseCar ? [world.missions.chaseCar] : [])];
}
function buyGarageUpgrade(n) {
  const def = UPGRADE_DEFS[n - 1]; if (!def) return;
  world.hud.toast(world.garage.buyUpgrade(def.id, world, world.player.vehicle), '#2ec4b6');
}
function togglePause() {
  world.paused = !world.paused;
  document.getElementById('pause-screen').classList.toggle('hidden', !world.paused);
  if (document.pointerLockElement) document.exitPointerLock();
}
function interactF() {
  const p = world.player;
  if (p.onFoot && distance2D(p.pos.x, p.pos.z, SAFEHOUSE.x, SAFEHOUSE.z) < 9) {
    if (world.garage.open) { world.garage.open = false; world.hud.hideGarage(); }
    else if (!world.missions.active) { world.missions.startJob(world); }
    else { world.garage.open = true; }
    return;
  }
  if (p.vehicle && distance2D(p.vehicle.pos.x, p.vehicle.pos.z, SAFEHOUSE.x, SAFEHOUSE.z) < 12) {
    world.garage.storeCurrent(p.vehicle);
    world.hud.toast('Stored in garage: ' + p.vehicle.type.name + ' (cond ' + Math.round(p.vehicle.health) + '%)', '#2ec4b6');
    world.saveGame();
    return;
  }
  const shop = world.shops.nearestShop(p.focusPos());
  if (shop) {
    if (shop.kind === 'arms') {
      const w = WEAPONS.find(x => x.id === 'smg' && !world.weapons.owned.smg) || WEAPONS[3];
      world.hud.toast(world.shops.buyWeapon(world.weapons.owned.smg ? 'shotgun' : 'smg', world) + ' · ' + world.shops.buyAmmoFor('p9', world), '#ff9f1c');
    } else {
      world.hud.toast(world.shops.respray(world), '#4cc9f0');
    }
    return;
  }
  if (world.garage.open) { world.garage.open = false; world.hud.hideGarage(); }
}

// ---------- camera ----------
function updateCamera(dt) {
  if (pointerLocked) {
    camYaw -= mouseDX * 0.0026; camPitch = clampValue(camPitch + mouseDY * 0.0022, -0.05, 1.1);
    mouseDX = 0; mouseDY = 0;
  }
  const p = world.player;
  const fp = p.focusPos();
  let dist = 9.5, height = 4.2;
  if (p.vehicle) { dist = 12; height = 4.6; }
  if (p.onFoot) { dist = 7; height = 3.1; }
  if (p.boat) { dist = 13; height = 5.5; }
  if (world.staged && world.shotDist) dist = world.shotDist; // shot-only framing
  if (!pointerLocked && !shotName) {
    // gentle follow behind motion when pointer is free
    const targetYaw = p.focusHeading() + Math.PI;
    let dy = targetYaw - camYaw;
    while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
    camYaw += dy * Math.min(1, dt * 2.2);
    camPitch += (0.34 - camPitch) * Math.min(1, dt * 2);
  }
  const cx = fp.x - Math.sin(camYaw) * Math.cos(camPitch) * dist;
  const cz = fp.z - Math.cos(camYaw) * Math.cos(camPitch) * dist;
  const cy = Math.max(1.6, fp.y + Math.sin(camPitch) * dist + height * 0.4);
  camera.position.set(cx, cy, cz);
  camera.lookAt(fp.x, fp.y + 1.7, fp.z);
}

// ---------- staging for screenshots ----------
function stageShot(name) {
  world.started = true; world.frozen = true;
  document.getElementById('title-screen').classList.add('hidden');
  const P = world.player, PL = world.police;
  // shot-only staging helpers: fat glowing tracer beams, muzzle-flash orbs
  // and street lamps that read clearly in a single frozen frame.
  const beamBetween = (from, to, radius, color, opacity = 0.9) => {
    const dir = to.clone().sub(from); const len = dir.length();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, 6, 1, true),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false }));
    m.position.copy(from).addScaledVector(dir, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    scene.add(m); return m;
  };
  const flashOrb = (x, y, z, s, color = 0xffc300) => {
    const outer = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 6),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, depthWrite: false }));
    outer.position.set(x, y, z); outer.scale.setScalar(s); scene.add(outer);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xfffbe8 }));
    core.position.set(x, y, z); core.scale.setScalar(s); scene.add(core);
    return outer;
  };
  const stageLamp = (x, z) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 6.2, 5),
      new THREE.MeshLambertMaterial({ color: 0x8a8578 }));
    pole.position.set(x, 3.1, z); scene.add(pole);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
    bulb.position.set(x, 6.5, z); scene.add(bulb);
    const glow = new THREE.PointLight(0xffd9a0, 30, 16); glow.position.set(x, 6.2, z); scene.add(glow);
  };
  if (name === 'cover') {
    world.missions.index = 5; world.missions.active = true; world.missions.stage = 0;
    const bx = boulevardX(-40);
    const car = new Vehicle(CAR_TYPES[2], 0xe63946, bx - 3, -40, 0);
    car.speed = 21; car.health = 68; scene.add(car.mesh);
    world.stagedCar = car; P.enterVehicle(car);
    PL.setWanted(4);
    const roles = ['PURSUIT', 'RAMMING', 'FLANKING'];
    const spots = [[-4.8, -8.5], [7.5, 3.5], [6.5, 19]];
    for (let i = 0; i < 3; i++) {
      const u = PL.spawnUnit({ x: car.pos.x, z: car.pos.z - 16 }, roles[i]);
      u.v.pos.set(car.pos.x + spots[i][0], 0, car.pos.z + spots[i][1]);
      u.v.heading = 0; u.v.speed = 20;
    }
    // extra traffic car in the mid-frame, same direction as the chase
    const trafficCar = new Vehicle(CAR_TYPES[1], 0x4361ee, bx + 6, car.pos.z + 30, 0);
    trafficCar.speed = 17; scene.add(trafficCar.mesh);
    // chase target ahead (the Regent courier)
    const courier = new Vehicle(CAR_TYPES[2], 0xffd166, bx + 2, car.pos.z + 40, 0);
    courier.speed = 19; scene.add(courier.mesh);
    world.air.alt = 11; world.air.orbit = 1.15;
    world.air.setVisible(true);
    world.air.group.position.set(car.pos.x + Math.cos(1.15) * 27, 11, car.pos.z + Math.sin(1.15) * 27);
    world.air.updateAirUnit(0.016, car.pos, 1.2);
    // re-aim the FALCON cone by hand: a pale white-yellow translucent shaft
    // from the heli belly straight onto the player car (the unit's own
    // lookAt math lays the cone sideways in a frozen frame)
    {
      const air = world.air;
      const from = air.group.position.clone();
      const to = new THREE.Vector3(car.pos.x, 0.4, car.pos.z);
      const axis = from.clone().sub(to); const len = axis.length();
      air.cone.position.copy(to).addScaledVector(axis, 0.5);
      air.cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis.normalize());
      air.cone.scale.set(0.8, len / 46, 0.8);
      air.cone.material.color.setHex(0xfff6c8);
      air.cone.material.opacity = 0.15;
      air.pool.material.color.setHex(0xfff6c8);
      air.pool.material.opacity = 0.2;
    }
    world.roadblocks.maybeDeploy(4, P);
    world.weapons.giveWeapon('smg'); world.weapons.giveWeapon('shotgun');
    world.weapons.current = 'smg'; world.weapons.inMag.smg = 24; world.weapons.ammo.smg = 96;
    world.ranks.rp = 700; world.cash = 4820;
    world.hud.showDialog('Vera Quintana', 'Handler — Marina Safehouse', 'Regent courier is running for the pier, Dario — ram it off the boulevard!', '#2ec4b6');
    world.hud.radioToast('BRASA FM 98.1 · Synthwave', 'Neon Boulevard — Vela Cruz');
    camYaw = -0.14; camPitch = 0.24;
  } else if (name === 'mission') {
    // Old Town plaza shootout: an open square ringed by pastel blocks on
    // every side (building columns/rows at -240/-180), staged asphalt,
    // palms + lamps, close-range firefight so it reads in one second.
    world.sky.hour = 16.1; // brighter golden hour for this shot
    world.missions.index = 3; world.missions.active = true; world.missions.stage = 0;
    P.pos.set(-217, 0, -217); P.heading = Math.PI / 4; P.mesh.rotation.y = Math.PI / 4;
    world.air.setVisible(false);
    // staged street surface + centre dashes running NE through the plaza
    const slab = new THREE.Mesh(new THREE.BoxGeometry(38, 0.08, 38),
      new THREE.MeshLambertMaterial({ color: 0x2e2e38 }));
    slab.position.set(-210, 0.03, -210); slab.receiveShadow = true; scene.add(slab);
    for (let i = -2; i <= 2; i++) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 2.8),
        new THREE.MeshBasicMaterial({ color: 0xf6e8b1 }));
      dash.position.set(-210 + i * 3.4, 0.09, -210 + i * 3.4); dash.rotation.y = Math.PI / 4; scene.add(dash);
    }
    world.city.palm(-228, -199); world.city.palm(-193, -226); world.city.palm(-227, -226);
    stageLamp(-226, -207); stageLamp(-203, -194);
    // Los Corales — close, big in frame, facing the player
    const e1 = world.combat.spawnEnemy(-210.5, -210.5, 1);
    const e2 = world.combat.spawnEnemy(-207, -212, 1);
    const e3 = world.combat.spawnEnemy(-212, -206, 1.1);
    const e4 = world.combat.spawnEnemy(-203, -206.5, 1.2);
    for (const e of world.combat.enemies) e.mesh.rotation.y = Math.atan2(P.pos.x - e.pos.x, P.pos.z - e.pos.z);
    // gang car parked beside the crew, angled across the street
    const gangCar = new Vehicle(CAR_TYPES[1], 0xff2e88, -200, -212, 0);
    gangCar.mesh.rotation.y = 0.85; scene.add(gangCar.mesh);
    world.weapons.giveWeapon('smg'); world.weapons.current = 'smg';
    world.weapons.inMag.smg = 27; world.weapons.ammo.smg = 64;
    P.health = 78; P.armour = 35; world.cash = 2130; world.ranks.rp = 380;
    // fat glowing tracers both ways + clear muzzle flashes
    const pMuzzle = new THREE.Vector3(P.pos.x + 0.75, 1.5, P.pos.z + 0.75);
    const e1Muzzle = new THREE.Vector3(e1.pos.x - 0.35, 1.45, e1.pos.z - 0.35);
    const e2Muzzle = new THREE.Vector3(e2.pos.x - 0.35, 1.45, e2.pos.z - 0.3);
    const e4Muzzle = new THREE.Vector3(e4.pos.x - 0.3, 1.45, e4.pos.z - 0.4);
    beamBetween(pMuzzle, new THREE.Vector3(e1.pos.x, 1.3, e1.pos.z), 0.09, 0xffe66d, 0.95);
    beamBetween(e2Muzzle, new THREE.Vector3(P.pos.x + 0.4, 1.25, P.pos.z + 0.2), 0.075, 0xffb35c, 0.9);
    beamBetween(e4Muzzle, new THREE.Vector3(P.pos.x + 2.2, 1.1, P.pos.z + 0.6), 0.075, 0xffb35c, 0.85);
    flashOrb(pMuzzle.x, pMuzzle.y, pMuzzle.z, 1.15);
    flashOrb(e1Muzzle.x, e1Muzzle.y, e1Muzzle.z, 1.6);
    flashOrb(e4Muzzle.x, e4Muzzle.y, e4Muzzle.z, 1.5, 0xff9f1c);
    world.combat.flash.position.copy(e2Muzzle); world.combat.flash.visible = true;
    world.combat.flash.scale.setScalar(1.3);
    const muzzleGlow = new THREE.PointLight(0xffb36b, 60, 22);
    muzzleGlow.position.set(pMuzzle.x, 1.8, pMuzzle.z); scene.add(muzzleGlow);
    world.effects.sparks(e1.pos.x, 1.3, e1.pos.z);
    world.hud.showDialog('Los Corales', 'Rival Crew', 'Wrong street, wheelman. Old Town is ours!', '#ff2e88');
    camYaw = Math.PI / 4; camPitch = 0.17;
  } else if (name === 'race') {
    // Staged on the boulevard bend at z=146: camera sits midway between
    // beach palms (no trunk fills the frame), all 4 cars bunched within
    // ~25 m, and checkpoint 3's beam stands ahead on the course.
    world.sky.hour = 16.9;
    const bx = boulevardX(146);
    const car = new Vehicle(CAR_TYPES[2], 0xe63946, bx - 3, 146, 0);
    car.speed = 19; scene.add(car.mesh); P.enterVehicle(car);
    world.races.startRace(0, world);
    world.races.cpIndex = 2; world.races.position = 2;
    const spots = [[bx - 7, 158], [bx + 6, 161], [bx + 0.5, 172]];
    world.races.rivals.forEach((v, i) => { v.pos.set(spots[i][0], 0, spots[i][1]); v.heading = 0; v.mesh.rotation.y = 0; v.speed = 18; });
    const cp = world.races.currentCheckpoint();
    if (cp) { raceBeam.position.set(cp[0], 30, cp[1]); raceBeam.visible = true; }
    world.cash = 3150; world.ranks.rp = 500;
    camYaw = 0.14; camPitch = 0.2;
  } else if (name === 'marina') {
    // On the Pier 3 boardwalk itself (pier deck y=1.4, z=-238), staged at
    // the pier's east end with a pulled-back shot camera: open water
    // (x>365) is immediately beside the deck, the speedboat floats in it
    // alongside the pier, both stored cars sit full-frame on the deck,
    // safehouse + city skyline behind them.
    world.sky.hour = 17.25;
    world.shotDist = 13;
    P.pos.set(400, 1.4, -238); P.heading = -Math.PI / 2; P.mesh.rotation.y = -Math.PI / 2;
    const gt = new Vehicle(CAR_TYPES[2], 0xe63946, 380, -240.3, 0);
    gt.pos.y = 1.4; gt.mesh.rotation.y = 0.1; scene.add(gt.mesh);
    const sedan = new Vehicle(CAR_TYPES[1], 0x4361ee, 366, -235.8, 0);
    sedan.pos.y = 1.4; sedan.mesh.rotation.y = -0.06; scene.add(sedan.mesh);
    world.boats[0].pos.set(382, 0.4, -223.5); world.boats[0].mesh.rotation.y = -0.2;
    // shift the moored boat that sits across the pier line off the cars
    for (const b of world.ocean.boats) if (Math.abs(b.position.z + 243) < 8 && b.position.x < 400) b.position.z = -262;
    world.boats[1].pos.set(430, 0.4, -120); world.boats[1].mesh.rotation.y = 0;
    world.garage.open = true;
    world.districts.current = world.districts.districtAt(400, -238);
    world.districts.bannerT = 99;
    world.cash = 5210; world.ranks.rp = 940;
    world.missions.index = 4;
    world.hud.showDialog('Vera Quintana', 'Handler — Marina Safehouse', 'Garage is yours, Dario. Keep the GT polished — Brasa Crown is coming.', '#2ec4b6');
    camYaw = -Math.PI / 2 - 0.08; camPitch = 0.19;
  }
  // settle systems once so panels are populated
  world.dispatch.refreshDispatch(PL, world.air, world.roadblocks, P);
  world.hud.updateHud(0.016, world);
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

// ---------- main loop ----------
const clock = new THREE.Clock();
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, clock.getDelta());
  if (world.paused) return;
  world.time += dt;
  const P = world.player;
  if (world.started && world.frozen) {
    // staged screenshot: world is frozen exactly as stageShot composed it
    world.sky.updateSky(dt, new THREE.Vector3(P.focusPos().x, 0, P.focusPos().z));
    world.ocean.updateOcean(world.time);
    updateCamera(dt);
    world.hud.updateHud(0, world);
    world.minimap.drawMinimap(world);
    renderer.render(scene, camera);
    return;
  }
  if (world.started) {
    const drive = {
      throttle: (keys.KeyW || keys.ArrowUp ? 1 : 0) + (keys.KeyS || keys.ArrowDown ? -0.55 : 0),
      steer: (keys.KeyA || keys.ArrowLeft ? 1 : 0) + (keys.KeyD || keys.ArrowRight ? -1 : 0),
      nitro: !!keys.ShiftLeft,
    };
    const move = {
      moveX: (keys.KeyD ? 1 : 0) + (keys.KeyA ? -1 : 0),
      moveZ: (keys.KeyW ? 1 : 0) + (keys.KeyS ? -1 : 0),
      sprint: !!keys.ShiftLeft,
    };
    P.updatePlayer(dt, { drive, moveX: move.moveX, moveZ: move.moveZ, sprint: move.sprint }, camYaw, world);
    if (world.chaseAI) {
      const c = world.chaseAI; c.t += dt;
      c.v.updateDrive(dt, { throttle: 0.95, steer: Math.sin(c.t * 0.7) * 0.3, nitro: false }, world.effects);
      if (c.v.speed > 26) c.v.speed = 26;
      if (distance2D(c.v.pos.x, c.v.pos.z, 392, -300) < 14) c.v.heading += dt * 2;
    }
    world.traffic.updateTraffic(dt, P.focusPos(), allVehicles());
    world.peds.updatePedestrians(dt, P.focusPos(), (mouseDown || world.police.wanted > 1) ? 1 : 0);
    world.police.updatePolice(dt, P, world.effects, () => {
      world.cash = Math.max(0, world.cash - 300);
      P.heal(60); P.armour = 25;
      P.pos.set(SAFEHOUSE.x, 0, SAFEHOUSE.z - 10);
      world.police.clearAll();
      world.hud.toast('BUSTED — $300 fine. Released at the marina.', '#ff5964');
      if (world.missions.active) world.missions.failJob(world, 'Busted by BBPD.');
    });
    world.air.deployIfNeeded(world.police.wanted, world.missions.active);
    world.air.updateAirUnit(dt, P.focusPos(), world.time);
    world.roadblocks.updateRoadblocks(dt, world.police.wanted, P, world.effects);
    world.dispatch.refreshDispatch(world.police, world.air, world.roadblocks, P);
    world.combat.updateCombat(dt, P, world.police, world.weapons);
    if (P.dead) {
      P.heal(70); P.armour = 20; P.pos.set(SAFEHOUSE.x, 0, SAFEHOUSE.z - 10);
      world.police.clearAll();
      world.hud.toast('WASTED — patched up at the marina clinic.', '#ff5964');
      if (world.missions.active) world.missions.failJob(world, 'You got wasted.');
    }
    world.weapons.cooldown = Math.max(0, world.weapons.cooldown - dt);
    if (mouseDown && !P.vehicle && !P.boat) world.combat.playerShoot(P, world.weapons, camera, world.police);
    else if (mouseDown && P.vehicle && world.weapons.current !== 'fists') world.combat.playerShoot(P, world.weapons, camera, world.police);
    world.missions.updateMissions(dt, world);
    world.activities.updateActivities(dt, world);
    world.races.updateRaces(dt, world);
    world.crew.updateCrew(dt);
    world.districts.updateDistricts(P.focusPos(), dt);
    // prompts
    world.promptText = '';
    if (P.hotwireT > 0) world.promptText = 'HOTWIRING…';
    else if (P.onFoot) {
      const near = P.nearestVehicle(allVehicles());
      const shop = world.shops.nearestShop(P.pos);
      if (distance2D(P.pos.x, P.pos.z, SAFEHOUSE.x, SAFEHOUSE.z) < 9) world.promptText = world.missions.active ? '[F] Garage' : '[F] Start job: ' + (world.missions.job ? world.missions.job.name : '');
      else if (shop) world.promptText = '[F] ' + shop.name;
      else if (near) world.promptText = '[E] Enter ' + near.type.name + (near.locked ? ' (locked — hotwire)' : '');
      else if (world.boats.some(b => distance2D(P.pos.x, P.pos.z, b.pos.x, b.pos.z) < 6)) world.promptText = '[E] Board speedboat';
    } else if (P.vehicle && distance2D(P.vehicle.pos.x, P.vehicle.pos.z, SAFEHOUSE.x, SAFEHOUSE.z) < 12) world.promptText = '[F] Store car in garage';
    // objective beams
    const obj = world.missions.active ? world.missions.objectivePos() : null;
    beam.visible = !!obj;
    if (obj) beam.position.set(obj.x, 30, obj.z);
    const rcp = world.races.active ? world.races.currentCheckpoint() : null;
    raceBeam.visible = !!rcp;
    if (rcp) raceBeam.position.set(rcp[0], 30, rcp[1]);
    world.audio.updateAudio(P.focusSpeed(), world.police.wanted, world.air.active, !!P.vehicle);
  }
  const focus = world.player.focusPos();
  world.sky.updateSky(dt, new THREE.Vector3(focus.x, 0, focus.z));
  world.ocean.updateOcean(world.time);
  world.effects.updateEffects(dt);
  updateCamera(dt);
  if (world.started) {
    world.hud.updateHud(dt, world);
    world.minimap.drawMinimap(world);
  }
  renderer.render(scene, camera);
}

// ---------- menus ----------
document.getElementById('btn-start').addEventListener('click', () => {
  SaveSystem.clearSave();
  world.started = true;
  document.getElementById('title-screen').classList.add('hidden');
  world.audio.initAudio(); world.radio.startPlayback();
  world.hud.showDialog('Vera Quintana', 'Handler — Marina Safehouse', 'Welcome back to Brasa Bay, Dario. First job is simple: get me wheels.', '#2ec4b6');
});
document.getElementById('btn-continue').addEventListener('click', () => {
  const data = SaveSystem.loadGame();
  if (data) new SaveSystem().applyTo(world, data);
  world.started = true;
  document.getElementById('title-screen').classList.add('hidden');
  world.audio.initAudio(); world.radio.startPlayback();
  world.hud.toast(data ? 'Save loaded — welcome back.' : 'No save found — fresh start.', '#2ec4b6');
});
document.getElementById('btn-resume').addEventListener('click', togglePause);
document.getElementById('btn-restart').addEventListener('click', () => {
  world.paused = false;
  document.getElementById('pause-screen').classList.add('hidden');
  document.getElementById('title-screen').classList.remove('hidden');
  world.started = false;
});
if (!SaveSystem.hasSave()) document.getElementById('btn-continue').style.opacity = '0.5';

if (shotName) stageShot(shotName);
frame();
