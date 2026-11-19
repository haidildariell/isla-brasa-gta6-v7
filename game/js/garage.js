// Safehouse garage: store cars, repair them, buy upgrades (armor, nitro,
// paint) — every stored car keeps its own condition %.
import { CAR_TYPES } from './vehicles.js';

export const UPGRADE_DEFS = [
  { id: 'armor1', name: 'Armor Plating I', cost: 500, needRank: 2 },
  { id: 'armor2', name: 'Armor Plating II', cost: 1200, needRank: 4 },
  { id: 'nitro1', name: 'Nitro Kit I', cost: 450, needRank: 2 },
  { id: 'nitro2', name: 'Nitro Kit II', cost: 1100, needRank: 5 },
  { id: 'paint', name: 'Respray — any color', cost: 150, needRank: 1 },
  { id: 'repair', name: 'Full Repair', cost: 220, needRank: 1 },
];
export class Garage {
  constructor() {
    this.stored = [
      { name: 'Vandal GT', typeIdx: 2, color: 0xe63946, condition: 92, armor: 1, nitro: 1 },
      { name: 'Meridian Sedan', typeIdx: 1, color: 0x4361ee, condition: 74, armor: 0, nitro: 0 },
    ];
    this.open = false;
  }
  storeCurrent(vehicle) {
    if (this.stored.length >= 4) return false;
    const idx = CAR_TYPES.indexOf(vehicle.type);
    this.stored.push({ name: vehicle.type.name, typeIdx: idx < 0 ? 1 : idx, color: vehicle.colorHex, condition: Math.round(vehicle.health), armor: vehicle.armorLv, nitro: vehicle.nitroLv });
    return true;
  }
  buyUpgrade(id, world, vehicle) {
    const def = UPGRADE_DEFS.find(u => u.id === id);
    if (!def) return 'No such upgrade.';
    if (world.ranks.rank < def.needRank) return 'Needs rank ' + def.needRank + '.';
    if (world.cash < def.cost) return 'Not enough cash.';
    world.cash -= def.cost;
    if (id === 'armor1' && vehicle) vehicle.armorLv = Math.max(vehicle.armorLv, 1);
    if (id === 'armor2' && vehicle) vehicle.armorLv = 2;
    if (id === 'nitro1' && vehicle) vehicle.nitroLv = Math.max(vehicle.nitroLv, 1);
    if (id === 'nitro2' && vehicle) vehicle.nitroLv = 2;
    if (id === 'repair' && vehicle) vehicle.repair(100);
    if (id === 'paint' && vehicle) {
      vehicle.colorHex = [0xff2e88, 0x00f5d4, 0xffd166, 0x8338ec][Math.floor(Math.random() * 4)];
      vehicle.mesh.children[0].material.color.setHex(vehicle.colorHex);
    }
    world.saveGame();
    return def.name + ' fitted.';
  }
}
