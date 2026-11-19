// Three synthesized WebAudio radio stations: Brasa FM synthwave, Radio
// Mango latin, Isla Talk. Changing station shows a toast with the track.
export const STATIONS = [
  { id: 'brasa', name: 'BRASA FM 98.1', style: 'Synthwave', tracks: ['Neon Boulevard — Vela Cruz', 'Golden Hour Drive — Palm Static', 'Chrome Palms — Dario Night'] },
  { id: 'mango', name: 'RADIO MANGO', style: 'Latin Heat', tracks: ['Baila en la Marina — Los Corales del Sol', 'Ron y Sal — Vera Quintana', 'Calle de Oro — DJ Brasa'] },
  { id: 'talk', name: 'ISLA TALK 104', style: 'Talk & Traffic', tracks: ['Bay Traffic Watch', 'The Quintana Hour', 'Night Fishing Report'] },
];
export class RadioSystem {
  constructor(audio) {
    this.audio = audio; this.stationIdx = 0; this.playing = false;
    this.noteIdx = 0; this.timer = null; this.trackIdx = 0;
  }
  get station() { return STATIONS[this.stationIdx]; }
  currentTrack() { return this.station.tracks[this.trackIdx % this.station.tracks.length]; }
  cycleStation(hud) {
    this.stationIdx = (this.stationIdx + 1) % STATIONS.length;
    this.trackIdx = Math.floor(Math.random() * 3);
    this.startPlayback();
    if (hud) hud.radioToast(this.station.name + ' · ' + this.station.style, this.currentTrack());
  }
  startPlayback() {
    this.stopPlayback();
    if (!this.audio.enabled) return;
    this.playing = true;
    const bass = this.stationIdx === 0 ? [110, 110, 165, 147] : this.stationIdx === 1 ? [98, 123, 147, 123] : [82, 98, 110, 98];
    const step = () => {
      if (!this.playing) return;
      const i = this.noteIdx++ % bass.length;
      this.audio.tone(bass[i], 0.32, 0.12, this.stationIdx === 2 ? 'sine' : 'triangle');
      if (this.stationIdx !== 2 && i % 2 === 0) this.audio.tone(bass[i] * 2, 0.2, 0.05, 'sine');
      if (this.stationIdx === 1) this.audio.noiseBurst(0.05, 5000, 0.05, 'highpass');
      this.timer = setTimeout(step, this.stationIdx === 1 ? 300 : 380);
    };
    step();
  }
  stopPlayback() { this.playing = false; if (this.timer) clearTimeout(this.timer); this.timer = null; }
}
