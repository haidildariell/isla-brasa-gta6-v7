// Ten sequential STORY JOBS for Dario Venn, given by Vera Quintana of the
// marina safehouse. Each job: stages, objectives, optional timer, dialogue.
import { SAFEHOUSE, distance2D } from './config.js';

export const JOBS = [
  { name: 'First Wheels', giver: 'Vera Quintana', pay: 250, rp: 40, stages: [
    { text: 'Steal a car near the marina', kind: 'steal' },
    { text: 'Bring it to the safehouse garage', kind: 'goto', at: SAFEHOUSE },
  ], intro: 'Dario — wheels first, questions later. Lift something clean and bring it home.' },
  { name: 'Marina Run', giver: 'Vera Quintana', pay: 400, rp: 60, timer: 150, stages: [
    { text: 'Pick up the package at Pier 3', kind: 'goto', at: { x: 392, z: -300 } },
    { text: 'Drop at Las Palmas boardwalk', kind: 'goto', at: { x: 300, z: 60 } },
    { text: 'Drop at Old Town market', kind: 'goto', at: { x: -180, z: -240 } },
    { text: 'Return to the safehouse', kind: 'goto', at: SAFEHOUSE },
  ], intro: 'Three drops, one clock. The bay does not wait, and neither do I.' },
  { name: 'Heat Check', giver: 'Vera Quintana', pay: 350, rp: 70, stages: [
    { text: 'Raise your wanted level to 3 stars', kind: 'heat', level: 3 },
    { text: 'Lose the BBPD completely', kind: 'escape' },
  ], intro: 'I need to know you can cook heat and shake it. Make noise, then vanish.' },
  { name: 'Coral Kings', giver: 'Vera Quintana', pay: 650, rp: 110, stages: [
    { text: 'Clear Los Corales off Pier 3', kind: 'combat', at: { x: 392, z: -300 }, count: 4 },
  ], intro: 'Los Corales think my pier is theirs. Correct them. Permanently.' },
  { name: 'Night Deposit', giver: 'Vera Quintana', pay: 800, rp: 120, stages: [
    { text: 'Rob the Old Town corner store', kind: 'goto', at: { x: -120, z: -118 } },
    { text: 'Escape the roadblocks — lose the heat', kind: 'escape' },
  ], intro: 'A store on Calle Vieja keeps our money in its till. Go collect.' },
  { name: 'Regent Run', giver: 'Vera Quintana', pay: 900, rp: 130, stages: [
    { text: 'Ram the Regent courier before it reaches the pier', kind: 'chase', at: { x: 180, z: -60 } },
  ], intro: 'A Regent courier carries the Coral ledger. Stop that car before the pier.' },
  { name: 'Air Mail', giver: 'Vera Quintana', pay: 1000, rp: 150, stages: [
    { text: 'Grab the cargo under the FALCON spotlight', kind: 'goto', at: { x: -60, z: 240 }, heat: 3 },
    { text: 'Deliver it to the safehouse', kind: 'goto', at: SAFEHOUSE },
  ], intro: 'Cargo dropped in Financial Row. FALCON will be watching. Take it anyway.' },
  { name: 'Turf War', giver: 'Vera Quintana', pay: 1200, rp: 170, stages: [
    { text: 'Take the Old Town corner', kind: 'turf', at: { x: -240, z: -180 }, count: 2 },
    { text: 'Take the Las Palmas boardwalk', kind: 'turf', at: { x: 290, z: 120 }, count: 2 },
    { text: 'Take the Financial Row plaza', kind: 'turf', at: { x: -120, z: 240 }, count: 3 },
  ], intro: 'Three corners, one night. Brasa Bay changes owners tonight.' },
  { name: 'The Long Fare', giver: 'Vera Quintana', pay: 1500, rp: 200, stages: [
    { text: 'Pick up Vera at the safehouse', kind: 'goto', at: SAFEHOUSE },
    { text: 'Drive Vera to Financial Row — wanted 4 escort', kind: 'goto', at: { x: -180, z: 180 }, heat: 4 },
  ], intro: 'Drive me across my own city, Dario. Every badge in Brasa will try to stop us.' },
  { name: 'Brasa Crown', giver: 'Vera Quintana', pay: 3000, rp: 320, stages: [
    { text: 'Rob the Brasa Bay Bank', kind: 'goto', at: { x: -180, z: 180 } },
    { text: 'Escape at wanted 5 to the marina', kind: 'goto', at: { x: 392, z: -238 }, heat: 5 },
    { text: 'Escape by speedboat — get out on the water', kind: 'boat' },
  ], intro: 'The crown itself: Brasa Bay Bank. Take it, outrun five stars, and sail out rich.' },
];
export class MissionSystem {
  constructor() {
    this.index = 0; this.stage = 0; this.active = false;
    this.timer = 0; this.kills = 0; this.done = false; this.chaseCar = null;
  }
  get job() { return JOBS[this.index] || null; }
  get stageDef() { return this.job ? this.job.stages[this.stage] : null; }
  startJob(world) {
    const j = this.job; if (!j) return;
    this.active = true; this.stage = 0; this.kills = 0;
    this.timer = j.timer || 0;
    world.hud.showDialog('Vera Quintana', 'Handler — Marina Safehouse', j.intro, '#2ec4b6');
    this.setupStage(world);
  }
  setupStage(world) {
    const s = this.stageDef; if (!s) return;
    this.kills = 0;
    if (s.kind === 'combat' || s.kind === 'turf') {
      for (let i = 0; i < (s.count || 3); i++) {
        world.combat.spawnEnemy(s.at.x + (i - 1) * 7, s.at.z + (i % 2) * 6 - 3, 1 + this.index * 0.12);
      }
      world.hud.showDialog('Los Corales', 'Rival Crew', 'This turf is ours, wheelman!', '#ff2e88');
    }
    if (s.heat) world.police.setWanted(Math.max(world.police.wanted, s.heat));
    if (s.kind === 'chase' && world.spawnChaseTarget) world.spawnChaseTarget(s.at);
  }
  objectivePos() { const s = this.stageDef; return s && s.at ? s.at : null; }
  completeStage(world) {
    const j = this.job;
    this.stage++;
    world.audio.cashSound();
    if (this.stage >= j.stages.length) { this.completeJob(world); return; }
    world.hud.toast('Objective complete — next stage.', '#ffd166');
    this.setupStage(world);
  }
  completeJob(world) {
    const j = this.job;
    this.active = false;
    world.cash += j.pay;
    world.ranks.addRP(j.rp, world.hud);
    world.districts.shiftStanding('marina', 4);
    world.hud.showDialog('Vera Quintana', 'Handler — Marina Safehouse', 'Clean work, Dario. $' + j.pay + ' wired. The bay is learning your name.', '#2ec4b6');
    world.hud.toast('JOB COMPLETE — ' + j.name + ' · +$' + j.pay, '#ffd166');
    this.index = Math.min(this.index + 1, JOBS.length - 1);
    if (this.index === JOBS.length - 1 && j.name === 'Brasa Crown') this.done = true;
    world.saveGame();
  }
  failJob(world, why) {
    this.active = false;
    world.hud.toast('JOB FAILED — ' + why, '#ff5964');
    world.hud.showDialog('Vera Quintana', 'Handler — Marina Safehouse', 'Shake it off. Come back to the marina and we run it again.', '#2ec4b6');
  }
  updateMissions(dt, world) {
    if (!this.active) return;
    const s = this.stageDef; if (!s) return;
    if (this.timer > 0) {
      this.timer -= dt;
      if (this.timer <= 0) { this.failJob(world, 'Out of time.'); return; }
    }
    const p = world.player;
    const pPos = p.focusPos();
    if (s.kind === 'goto' || s.kind === 'combat' || s.kind === 'turf') {
      if (s.at && distance2D(pPos.x, pPos.z, s.at.x, s.at.z) < 9) {
        if (s.kind === 'goto') {
          if (this.job.name === 'Night Deposit' || this.job.name === 'Brasa Crown') {
            if (this.stage === 0) world.police.setWanted(Math.max(world.police.wanted, this.job.name === 'Brasa Crown' ? 5 : 3));
          }
          this.completeStage(world);
        }
      }
      if ((s.kind === 'combat' || s.kind === 'turf') && world.combat.aliveEnemies().length === 0 && this.stage === this.stage) {
        // cleared only counts after player reached the turf zone once
        if (s.at && distance2D(pPos.x, pPos.z, s.at.x, s.at.z) < 60) this.completeStage(world);
      }
    } else if (s.kind === 'steal') {
      if (p.vehicle) this.completeStage(world);
    } else if (s.kind === 'heat') {
      if (world.police.wanted >= s.level) this.completeStage(world);
    } else if (s.kind === 'escape') {
      if (world.police.wanted === 0) this.completeStage(world);
    } else if (s.kind === 'chase') {
      const t = this.chaseCar;
      if (t && t.dead) this.completeStage(world);
      else if (t && s.at && distance2D(t.pos.x, t.pos.z, 392, -300) < 12) this.failJob(world, 'The courier reached the pier.');
    } else if (s.kind === 'boat') {
      if (p.boat && p.boat.pos.x > 480) this.completeStage(world);
    }
  }
  nextHint() {
    if (!this.active || !this.job) return 'Head to the marina safehouse — press F to start the next job.';
    const rest = this.job.stages.slice(this.stage + 1);
    return rest.length ? 'NEXT: ' + rest[0].text : 'NEXT: Finish and collect $' + this.job.pay;
  }
}
