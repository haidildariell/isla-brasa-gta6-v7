// Shops: Harbor Arms (weapons + ammo) and Brasa Respray (paint + heat drop).
// Fixed storefront spots marked on the minimap; walk in and press F.
import { WEAPONS, WEAPON_PRICES, AMMO_PRICES } from './weapons.js';

export const SHOP_SPOTS = [
  { id: 'arms', name: 'Harbor Arms', x: -120, z: -118, kind: 'arms' },
  { id: 'arms2', name: 'Harbor Arms — Row', x: -238, z: 122, kind: 'arms' },
  { id: 'spray', name: 'Brasa Respray', x: 122, z: 58, kind: 'spray' },
  { id: 'spray2', name: 'Brasa Respray — Marina', x: 238, z: -298, kind: 'spray' },
];
export class ShopSystem {
  constructor() { this.openShop = null; }
  nearestShop(pos) {
    let best = null, bd = 7;
    for (const s of SHOP_SPOTS) {
      const d = Math.hypot(pos.x - s.x, pos.z - s.z);
      if (d < bd) { bd = d; best = s; }
    }
    return best;
  }
  armsCatalog(weapons, rank) {
    const rows = [];
    for (const w of WEAPONS) {
      if (w.id === 'fists') continue;
      rows.push({
        id: w.id, name: w.name,
        price: weapons.owned[w.id] ? null : WEAPON_PRICES[w.id],
        locked: rank < w.unlockRank, unlockRank: w.unlockRank,
        ammoType: w.ammoType, ammoPrice: w.ammoType ? AMMO_PRICES[w.ammoType] * 30 : null,
      });
    }
    return rows;
  }
  buyWeapon(id, world) {
    const w = WEAPONS.find(x => x.id === id);
    if (!w) return 'Unknown weapon.';
    if (world.ranks.rank < w.unlockRank) return w.name + ' unlocks at rank ' + w.unlockRank + '.';
    const price = WEAPON_PRICES[id];
    if (world.weapons.owned[id]) return 'Already owned.';
    if (world.cash < price) return 'Not enough cash for ' + w.name + '.';
    world.cash -= price; world.weapons.giveWeapon(id);
    if (w.ammoType) world.weapons.buyAmmo(w.ammoType, 60);
    world.saveGame();
    return w.name + ' purchased.';
  }
  buyAmmoFor(id, world) {
    const w = WEAPONS.find(x => x.id === id);
    if (!w || !w.ammoType) return 'No ammo for that.';
    const cost = AMMO_PRICES[w.ammoType] * 30;
    if (world.cash < cost) return 'Not enough cash for ammo.';
    world.cash -= cost; world.weapons.buyAmmo(w.ammoType, 30);
    return '+30 ' + w.ammoType + ' rounds.';
  }
  respray(world) {
    const cost = 200;
    if (world.cash < cost) return 'Respray costs $200.';
    world.cash -= cost;
    if (world.player.vehicle) {
      world.player.vehicle.colorHex = [0x06d6a0, 0xff8500, 0x3a86ff, 0xef476f][Math.floor(Math.random() * 4)];
      world.player.vehicle.mesh.children[0].material.color.setHex(world.player.vehicle.colorHex);
    }
    if (world.police.wanted > 0) world.police.setWanted(world.police.wanted - 1);
    world.saveGame();
    return 'Fresh paint. Heat -1 star.';
  }
}
