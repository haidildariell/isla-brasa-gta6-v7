// localStorage save: cash, mission progress, rank RP, garage, weapons.
const SAVE_KEY = 'isla-brasa-save-v1';
export class SaveSystem {
  static hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
  static saveGame(state) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        cash: state.cash, rp: state.ranks.rp, missionIdx: state.missions.index,
        owned: state.weapons.owned, ammo: state.weapons.ammo,
        stored: state.garage.stored, standing: state.districts.standing,
        racesWon: state.races.won,
      }));
    } catch (e) { /* storage unavailable */ }
  }
  static loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  static clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* noop */ } }
  applyTo(state, data) {
    if (!data) return;
    state.cash = data.cash ?? state.cash;
    state.ranks.rp = data.rp ?? 0;
    state.missions.index = Math.min(data.missionIdx ?? 0, 9);
    Object.assign(state.weapons.owned, data.owned || {});
    Object.assign(state.weapons.ammo, data.ammo || {});
    if (Array.isArray(data.stored)) state.garage.stored = data.stored;
    Object.assign(state.districts.standing, data.standing || {});
    state.races.won = data.racesWon || 0;
  }
}
