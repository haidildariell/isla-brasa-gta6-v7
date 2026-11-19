// Respect ranks 1-8: Dock Hand to Brasa Kingpin. RP from jobs, races and
// crime; ranks unlock weapon tiers and garage upgrades.
export const RANK_TITLES = ['Dock Hand', 'Runner', 'Wheelman', 'Hustler', 'Shot Caller', 'Bay Operator', 'Harbor Baron', 'Brasa Kingpin'];
export const RANK_THRESHOLDS = [0, 120, 300, 560, 900, 1350, 1950, 2700];
export class RankSystem {
  constructor() { this.rp = 0; }
  get rank() {
    let r = 1;
    for (let i = 0; i < RANK_THRESHOLDS.length; i++) if (this.rp >= RANK_THRESHOLDS[i]) r = i + 1;
    return r;
  }
  get title() { return RANK_TITLES[this.rank - 1]; }
  progress() {
    const cur = RANK_THRESHOLDS[this.rank - 1];
    const next = RANK_THRESHOLDS[this.rank] ?? cur + 800;
    return { cur, next, frac: Math.min(1, (this.rp - cur) / (next - cur)) };
  }
  addRP(amount, hud) {
    const before = this.rank;
    this.rp += amount;
    if (this.rank > before && hud) hud.toast('RANK UP — ' + this.title + '! New gear unlocked.', '#ffd166');
    return this.rank > before;
  }
}
