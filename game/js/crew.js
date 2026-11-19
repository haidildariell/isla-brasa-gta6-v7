// Crew abilities on HUD chips: Swap Plates, Quick Fix, Eyes Out — each with
// its own cooldown, fired with keys 1/2/3.
export class CrewAbilities {
  constructor() {
    this.abilities = [
      { id: 'plates', name: 'Swap Plates', key: '1', cd: 90, left: 0, desc: 'Lose 1 star' },
      { id: 'fix', name: 'Quick Fix', key: '2', cd: 60, left: 0, desc: 'Repair car 40%' },
      { id: 'eyes', name: 'Eyes Out', key: '3', cd: 75, left: 0, desc: 'Cops on map 30s' },
    ];
    this.eyesOutT = 0;
  }
  ready(id) { const a = this.abilities.find(x => x.id === id); return a && a.left <= 0; }
  useCrewAbility(id, world) {
    const a = this.abilities.find(x => x.id === id);
    if (!a || a.left > 0) return false;
    if (id === 'plates') {
      if (world.police.wanted <= 0) return false;
      world.police.setWanted(world.police.wanted - 1);
      world.police.heat = Math.min(world.police.heat, world.police.wanted);
      world.hud.toast('Plates swapped — heat drops.', '#2ec4b6');
    } else if (id === 'fix') {
      if (!world.player.vehicle) { world.hud.toast('Quick Fix needs a car.', '#ff5964'); return false; }
      world.player.vehicle.repair(40);
      world.hud.toast('Quick Fix — hull patched +40%.', '#2ec4b6');
    } else if (id === 'eyes') {
      this.eyesOutT = 30;
      world.hud.toast('Eyes Out — BBPD blips live for 30s.', '#2ec4b6');
    }
    a.left = a.cd;
    world.audio.uiBlip();
    return true;
  }
  updateCrew(dt) {
    for (const a of this.abilities) a.left = Math.max(0, a.left - dt);
    this.eyesOutT = Math.max(0, this.eyesOutT - dt);
  }
}
