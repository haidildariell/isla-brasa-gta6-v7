// The full ISLA BRASA HUD: mission panel, BBPD dispatch panel, weapon bar,
// rank bar, crew chips, dialog box with portrait, radio toast, speedo,
// health/armour, district banner, weapon wheel, menus and garage panel.
import { WEAPONS } from './weapons.js';
import { ROLE_COLORS } from './dispatch.js';
import { formatCash, formatClock } from './config.js';
import { UPGRADE_DEFS } from './garage.js';

function el(id) { return document.getElementById(id); }
export class Hud {
  constructor() {
    this.dialogT = 0; this.toastT = 0; this.radioT = 0;
  }
  showDialog(name, role, line, color) {
    el('dlg-name').textContent = name;
    el('dlg-role').textContent = role;
    el('dlg-line').textContent = line;
    const av = el('dlg-avatar');
    av.textContent = name.split(' ').map(w => w[0]).join('').slice(0, 2);
    av.style.background = color || '#2ec4b6';
    el('dialog').classList.add('show');
    this.dialogT = 6;
  }
  toast(msg, color) {
    const t = el('toast'); t.textContent = msg; t.style.borderColor = color || '#ffd166';
    t.classList.add('show'); this.toastT = 3.4;
  }
  radioToast(station, track) {
    el('radio-station').textContent = station;
    el('radio-track').textContent = '♪ ' + track;
    el('radio-toast').classList.add('show'); this.radioT = 3.6;
  }
  updateHud(dt, world) {
    this.dialogT -= dt; this.toastT -= dt; this.radioT -= dt;
    if (this.dialogT <= 0) el('dialog').classList.remove('show');
    if (this.toastT <= 0) el('toast').classList.remove('show');
    if (this.radioT <= 0) el('radio-toast').classList.remove('show');
    const M = world.missions, P = world.police;
    // mission panel
    if (M.active && M.job) {
      el('mission-panel').style.display = 'block';
      el('job-kicker').textContent = 'JOB ' + (M.index + 1) + '/10 — ' + M.job.giver.toUpperCase();
      el('job-name').textContent = M.job.name;
      el('job-obj').textContent = M.stageDef ? M.stageDef.text : '';
      el('job-next').textContent = M.nextHint();
      el('job-pips').innerHTML = M.job.stages.map((s, i) =>
        '<span class="pip' + (i < M.stage ? ' done' : i === M.stage ? ' now' : '') + '"></span>').join('');
      el('job-timer').textContent = M.timer > 0 ? '⏱ ' + Math.ceil(M.timer) + 's' : '';
    } else {
      el('mission-panel').style.display = 'block';
      el('job-kicker').textContent = 'FREE ROAM — MARINA SAFEHOUSE';
      el('job-name').textContent = M.done ? 'Brasa Crown Claimed' : 'Next: ' + (M.job ? M.job.name : '—');
      el('job-obj').textContent = 'Press F at the safehouse to start a job · R for a street race · explore Brasa Bay';
      el('job-next').textContent = M.job ? 'NEXT JOB PAYS $' + M.job.pay + ' · +' + M.job.rp + ' RP' : '';
      el('job-pips').innerHTML = ''; el('job-timer').textContent = '';
    }
    // race banner
    if (world.races.active) {
      el('race-banner').style.display = 'block';
      el('race-pos').textContent = 'P' + world.races.position + '/4';
      el('race-cp').textContent = 'CHECKPOINT ' + Math.min(world.races.cpIndex + 1, world.races.def.checkpoints.length) + '/' + world.races.def.checkpoints.length + ' — ' + world.races.def.name.toUpperCase();
    } else el('race-banner').style.display = 'none';
    // dispatch panel
    const units = world.dispatch.units;
    el('dispatch-panel').style.display = 'block';
    el('dispatch-title').textContent = 'BBPD DISPATCH — ' + units.length + ' UNIT' + (units.length === 1 ? '' : 'S');
    el('dispatch-list').innerHTML = units.slice(0, 6).map(u =>
      '<div class="drow"><span class="dcall">' + u.callsign + '</span><span class="drole" style="color:' + (ROLE_COLORS[u.role] || '#fff') + '">' + u.role + '</span><span class="ddist">' + u.dist + 'm</span></div>').join('')
      || '<div class="drow"><span class="dcall">—</span><span class="drole">NO ACTIVE UNITS</span><span class="ddist"></span></div>';
    el('dispatch-note').textContent = world.dispatch.note;
    // top right: cash, stars, clock
    el('cash').textContent = formatCash(world.cash);
    el('clock').textContent = formatClock(world.sky.hour);
    let stars = '';
    for (let i = 0; i < 5; i++) stars += i < P.wanted ? '★' : '☆';
    el('stars').textContent = stars;
    el('stars').classList.toggle('hot', P.wanted >= 3);
    el('airtag').style.display = world.air.active ? 'inline-block' : 'none';
    el('busted-wrap').style.display = P.bustedT > 0.15 ? 'block' : 'none';
    el('busted-fill').style.width = Math.min(100, P.bustedT / 3 * 100) + '%';
    // weapon bar
    const rank = world.ranks.rank;
    el('weapon-bar').innerHTML = WEAPONS.map(w => {
      const locked = rank < w.unlockRank;
      const unowned = !world.weapons.owned[w.id];
      const cls = 'wslot' + (world.weapons.current === w.id ? ' sel' : '') + (locked || unowned ? ' locked' : '');
      const ammo = w.ammoType ? (world.weapons.inMag[w.id] || 0) + '/' + world.weapons.ammo[w.ammoType] : '∞';
      const sub = locked ? 'RANK ' + w.unlockRank : unowned ? 'BUY' : ammo;
      return '<div class="' + cls + '"><div class="wname">' + w.name + '</div><div class="wammo">' + sub + '</div></div>';
    }).join('');
    el('ammo-big').textContent = world.weapons.ammoLabel();
    // rank bar
    const rp = world.ranks.progress();
    el('rank-label').textContent = 'RANK ' + rank + ' — ' + world.ranks.title.toUpperCase();
    el('rank-fill').style.width = (rp.frac * 100) + '%';
    el('rank-rp').textContent = world.ranks.rp + ' RP';
    // crew chips
    el('crew-chips').innerHTML = world.crew.abilities.map(a =>
      '<div class="chip' + (a.left > 0 ? ' cd' : '') + '"><b>' + a.key + '</b> ' + a.name + (a.left > 0 ? ' · ' + Math.ceil(a.left) + 's' : '') + '</div>').join('');
    // health / armour
    el('hp-fill').style.width = world.player.health + '%';
    el('ar-fill').style.width = world.player.armour + '%';
    // speedo
    const inVeh = world.player.vehicle, inBoat = world.player.boat;
    if (inVeh || inBoat) {
      el('speedo').style.display = 'block';
      const ent = inVeh || inBoat;
      el('speed-num').textContent = Math.round(Math.abs(ent.speed) * 3.6);
      el('speed-name').textContent = (inVeh ? inVeh.type.name : inBoat.name) + (inVeh && inVeh.locked ? ' · LOCKED' : '');
      el('speed-cond').textContent = 'CONDITION ' + Math.round(inVeh ? inVeh.health : inBoat.health) + '%' + (inVeh ? ' · NITRO ' + Math.round(inVeh.nitro) + '%' : '');
      el('hotwire').style.display = world.player.hotwireT > 0 ? 'block' : 'none';
    } else {
      el('speedo').style.display = 'none';
      el('hotwire').style.display = world.player.hotwireT > 0 ? 'block' : 'none';
    }
    // district banner
    const D = world.districts;
    if (D.current && D.bannerT > 0) {
      el('district-banner').style.display = 'block';
      el('district-name').textContent = D.current.name.toUpperCase();
      el('district-standing').textContent = 'STANDING: ' + D.label(D.current.id) + ' — ' + Math.round(D.standing[D.current.id]) + '/100';
      el('district-fill').style.width = D.standing[D.current.id] + '%';
    } else el('district-banner').style.display = 'none';
    // prompt
    el('prompt').style.display = world.promptText ? 'block' : 'none';
    el('prompt').textContent = world.promptText || '';
    // garage panel
    if (world.garage.open) this.renderGarage(world);
    // weapon wheel
    if (world.weapons.wheelOpen) this.renderWheel(world);
  }
  renderGarage(world) {
    el('garage-panel').style.display = 'block';
    const cur = world.player.vehicle;
    el('garage-list').innerHTML = world.garage.stored.map((c, i) =>
      '<div class="grow"><span>' + (i + 1) + '. ' + c.name + '</span><span>COND ' + c.condition + '% · ARMOR ' + c.armor + ' · NITRO ' + c.nitro + '</span></div>').join('')
      + (cur ? '<div class="grow cur"><span>OUT: ' + cur.type.name + '</span><span>COND ' + Math.round(cur.health) + '%</span></div>' : '');
    el('garage-upgrades').innerHTML = UPGRADE_DEFS.map((u, i) =>
      '<div class="grow"><span>' + (i + 1) + ' · ' + u.name + '</span><span>$' + u.cost + ' · RANK ' + u.needRank + '</span></div>').join('');
  }
  hideGarage() { el('garage-panel').style.display = 'none'; }
  renderWheel(world) {
    el('wheel').style.display = 'flex';
    const rank = world.ranks.rank;
    el('wheel').innerHTML = WEAPONS.map(w => {
      const locked = rank < w.unlockRank || !world.weapons.owned[w.id];
      return '<div class="wcell' + (world.weapons.current === w.id ? ' sel' : '') + (locked ? ' locked' : '') + '"><b>' + w.name + '</b><span>' +
        (rank < w.unlockRank ? 'LOCKED · RANK ' + w.unlockRank : !world.weapons.owned[w.id] ? 'NOT OWNED' : w.ammoType ? (world.weapons.inMag[w.id] || 0) + '/' + world.weapons.ammo[w.ammoType] : 'MELEE') + '</span></div>';
    }).join('');
  }
  hideWheel() { el('wheel').style.display = 'none'; }
}
