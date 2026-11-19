// Six-weapon arsenal: Fists, Bat, P9 pistol, Mako SMG, 12G shotgun, AR rifle
// (rank-locked tiers), ammo pools, and the hold-Q weapon wheel data.
export const WEAPONS = [
  { id: 'fists', name: 'Fists', dmg: 9, rate: 0.34, range: 2.4, spread: 0, pellets: 1, ammoType: null, mag: Infinity, unlockRank: 1, auto: false, kick: 0.1 },
  { id: 'bat', name: 'Harbor Bat', dmg: 20, rate: 0.5, range: 2.8, spread: 0, pellets: 1, ammoType: null, mag: Infinity, unlockRank: 1, auto: false, kick: 0.2 },
  { id: 'p9', name: 'P9 Pistol', dmg: 16, rate: 0.26, range: 70, spread: 0.012, pellets: 1, ammoType: 'pistol', mag: 12, unlockRank: 1, auto: false, kick: 0.3 },
  { id: 'smg', name: 'Mako SMG', dmg: 11, rate: 0.085, range: 60, spread: 0.03, pellets: 1, ammoType: 'smg', mag: 32, unlockRank: 2, auto: true, kick: 0.18 },
  { id: 'shotgun', name: '12G Breaker', dmg: 9, rate: 0.85, range: 26, spread: 0.09, pellets: 7, ammoType: 'shell', mag: 6, unlockRank: 3, auto: false, kick: 0.8 },
  { id: 'ar', name: 'AR Carbine', dmg: 19, rate: 0.11, range: 95, spread: 0.016, pellets: 1, ammoType: 'rifle', mag: 30, unlockRank: 5, auto: true, kick: 0.35 },
];
export const AMMO_PRICES = { pistol: 4, smg: 3, shell: 8, rifle: 5 };
export const WEAPON_PRICES = { p9: 350, smg: 900, shotgun: 1400, ar: 2600, bat: 60 };
export class WeaponInventory {
  constructor() {
    this.owned = { fists: true, bat: false, p9: true, smg: false, shotgun: false, ar: false };
    this.ammo = { pistol: 48, smg: 0, shell: 0, rifle: 0 };
    this.inMag = { p9: 12, smg: 0, shotgun: 0, ar: 0 };
    this.current = 'p9'; this.cooldown = 0; this.wheelOpen = false;
  }
  weapon() { return WEAPONS.find(w => w.id === this.current); }
  isUnlocked(w, rank) { return rank >= w.unlockRank; }
  canUse(w, rank) { return this.owned[w.id] && this.isUnlocked(w, rank); }
  select(id, rank) {
    const w = WEAPONS.find(x => x.id === id);
    if (w && this.canUse(w, rank)) { this.current = id; return true; }
    return false;
  }
  cycle(dir, rank) {
    const usable = WEAPONS.filter(w => this.canUse(w, rank));
    let i = usable.findIndex(w => w.id === this.current);
    i = (i + dir + usable.length) % usable.length;
    this.current = usable[i].id;
  }
  reload() {
    const w = this.weapon();
    if (!w.ammoType) return;
    const need = w.mag - (this.inMag[w.id] || 0);
    const take = Math.min(need, this.ammo[w.ammoType]);
    this.inMag[w.id] = (this.inMag[w.id] || 0) + take;
    this.ammo[w.ammoType] -= take;
  }
  consumeShot() {
    const w = this.weapon();
    if (!w.ammoType) return true;
    if ((this.inMag[w.id] || 0) <= 0) { this.reload(); return (this.inMag[w.id] || 0) > 0; }
    this.inMag[w.id]--; return true;
  }
  ammoLabel() {
    const w = this.weapon();
    if (!w.ammoType) return '—';
    return (this.inMag[w.id] || 0) + ' / ' + this.ammo[w.ammoType];
  }
  buyAmmo(type, rounds) { this.ammo[type] = (this.ammo[type] || 0) + rounds; }
  giveWeapon(id) { this.owned[id] = true; const w = WEAPONS.find(x => x.id === id); if (w && w.ammoType && !this.inMag[id]) this.inMag[id] = w.mag; }
}
