// All-synthesized WebAudio: engine hum, sirens, heli rotor, gunshots,
// explosions, UI blips. No audio files, everything generated.
export class AudioEngine {
  constructor() {
    this.ctx = null; this.master = null; this.engineOsc = null; this.sirenOsc = null; this.rotorOsc = null;
    this.enabled = false;
  }
  initAudio() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      this.enabled = true;
      // engine: sawtooth through lowpass, pitch follows speed
      this.engineOsc = this.ctx.createOscillator(); this.engineOsc.type = 'sawtooth'; this.engineOsc.frequency.value = 55;
      this.engineFilter = this.ctx.createBiquadFilter(); this.engineFilter.type = 'lowpass'; this.engineFilter.frequency.value = 300;
      this.engineGain = this.ctx.createGain(); this.engineGain.gain.value = 0;
      this.engineOsc.connect(this.engineFilter).connect(this.engineGain).connect(this.master);
      this.engineOsc.start();
      // siren: triangle LFO sweep
      this.sirenOsc = this.ctx.createOscillator(); this.sirenOsc.type = 'triangle'; this.sirenOsc.frequency.value = 700;
      this.sirenGain = this.ctx.createGain(); this.sirenGain.gain.value = 0;
      this.sirenOsc.connect(this.sirenGain).connect(this.master); this.sirenOsc.start();
      // rotor: square pulse
      this.rotorOsc = this.ctx.createOscillator(); this.rotorOsc.type = 'square'; this.rotorOsc.frequency.value = 13;
      this.rotorGain = this.ctx.createGain(); this.rotorGain.gain.value = 0;
      this.rotorOsc.connect(this.rotorGain).connect(this.master); this.rotorOsc.start();
    } catch (e) { this.enabled = false; }
  }
  noiseBurst(dur, freq, gain, type = 'lowpass') {
    if (!this.enabled) return;
    const n = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = this.ctx.createGain(); g.gain.value = gain;
    src.connect(f).connect(g).connect(this.master); src.start();
  }
  tone(freq, dur, gain, type = 'sine', slide = 0) {
    if (!this.enabled) return;
    const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = freq;
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), this.ctx.currentTime + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g).connect(this.master); o.start(); o.stop(this.ctx.currentTime + dur);
  }
  gunshot(vol = 0.7) { this.noiseBurst(0.14, 1800, vol * 0.5); this.tone(120, 0.1, vol * 0.4, 'square', -70); }
  dryFire() { this.tone(900, 0.05, 0.15, 'square'); }
  explosion() { this.noiseBurst(0.9, 220, 0.9); this.tone(60, 0.8, 0.8, 'sine', -30); }
  uiBlip() { this.tone(660, 0.08, 0.2, 'sine', 220); }
  cashSound() { this.tone(880, 0.09, 0.2, 'sine'); setTimeout(() => this.tone(1320, 0.12, 0.2, 'sine'), 70); }
  horn() { this.tone(370, 0.25, 0.25, 'square'); this.tone(466, 0.25, 0.2, 'square'); }
  updateAudio(speed, wanted, heliActive, driving) {
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    this.engineGain.gain.setTargetAtTime(driving ? 0.05 + Math.abs(speed) * 0.004 : 0, t, 0.1);
    this.engineOsc.frequency.setTargetAtTime(55 + Math.abs(speed) * 4.2, t, 0.08);
    this.sirenGain.gain.setTargetAtTime(wanted > 0 ? 0.035 : 0, t, 0.2);
    if (wanted > 0) this.sirenOsc.frequency.setTargetAtTime(650 + Math.sin(t * 5.2) * 180, t, 0.05);
    this.rotorGain.gain.setTargetAtTime(heliActive ? 0.05 : 0, t, 0.3);
  }
}
