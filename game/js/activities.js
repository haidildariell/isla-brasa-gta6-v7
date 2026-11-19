// Side activities scattered over Brasa Bay: timed courier sprints, a drift
// challenge on the boulevard and a pier rampage. Started with T near a
// marker; each pays cash + RP and nudges district standing.
import { distance2D } from './config.js';

export const ACTIVITY_SPOTS = [
  { id: 'courier', name: 'Courier Sprint', x: 240, z: -120, target: { x: -240, z: 120 }, time: 75, pay: 300, rp: 35, blurb: 'Beat the clock across the bay.' },
  { id: 'drift', name: 'Boulevard Drift', x: 262, z: 240, target: { x: 268, z: -240 }, time: 60, pay: 350, rp: 40, blurb: 'Chain drifts down the whole boulevard.' },
  { id: 'rampage', name: 'Pier Rampage', x: 392, z: -300, target: null, time: 45, pay: 450, rp: 55, count: 5, blurb: 'Drop 5 Corales before the timer dies.' },
];
export class ActivitySystem {
  constructor() { this.active = null; this.timer = 0; this.killsAtStart = 0; }
  nearestActivity(pos) {
    let best = null, bd = 8;
    for (const a of ACTIVITY_SPOTS) {
      const d = distance2D(pos.x, pos.z, a.x, a.z);
      if (d < bd) { bd = d; best = a; }
    }
    return best;
  }
  startActivity(a, world) {
    this.active = a; this.timer = a.time;
    this.killsAtStart = world.combat.enemies.filter(e => e.dead).length;
    if (a.id === 'rampage') {
      for (let i = 0; i < a.count; i++) world.combat.spawnEnemy(a.x - 8 + i * 4, a.z + (i % 2) * 7 - 3, 1);
      world.police.addHeat(0.6);
    }
    world.hud.toast('ACTIVITY — ' + a.name + ': ' + a.blurb, '#2ec4b6');
    world.hud.showDialog('Vera Quintana', 'Handler — Marina Safehouse', a.name + '. ' + a.blurb + ' Cash and respect if you pull it off.', '#2ec4b6');
  }
  finishActivity(world, won) {
    const a = this.active; this.active = null;
    if (won) {
      world.cash += a.pay; world.ranks.addRP(a.rp, world.hud);
      world.districts.shiftStanding(world.districts.current ? world.districts.current.id : 'marina', 3);
      world.hud.toast('ACTIVITY COMPLETE — ' + a.name + ' · +$' + a.pay, '#ffd166');
      world.audio.cashSound();
      world.saveGame();
    } else {
      world.hud.toast('ACTIVITY FAILED — ' + a.name + ' (out of time)', '#ff5964');
    }
  }
  updateActivities(dt, world) {
    if (!this.active) return;
    this.timer -= dt;
    if (this.timer <= 0) { this.finishActivity(world, false); return; }
    const a = this.active, p = world.player.focusPos();
    if (a.target && distance2D(p.x, p.z, a.target.x, a.target.z) < 10) this.finishActivity(world, true);
    else if (a.id === 'rampage' && world.combat.aliveEnemies().length === 0) this.finishActivity(world, true);
  }
  objectivePos() {
    if (!this.active) return null;
    return this.active.target || { x: this.active.x, z: this.active.z };
  }
}
