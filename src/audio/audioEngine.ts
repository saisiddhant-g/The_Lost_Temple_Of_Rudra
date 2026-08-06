/**
 * Web Audio API Synthesizer for atmospheric temple sounds
 * Modular, zero external mp3 file dependency, high quality ambient loops
 */

class TempleAudioEngine {
  private ctx: AudioContext | null = null;
  private isAmbienceOn: boolean = false;
  private gainMaster: GainNode | null = null;
  private gainAmbience: GainNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private dripInterval: number | null = null;
  private windNoise: AudioBufferSourceNode | null = null;

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.gainMaster = this.ctx.createGain();
      this.gainMaster.gain.setValueAtTime(0.6, this.ctx.currentTime);
      this.gainMaster.connect(this.ctx.destination);

      this.gainAmbience = this.ctx.createGain();
      this.gainAmbience.gain.setValueAtTime(0, this.ctx.currentTime); // default off
      this.gainAmbience.connect(this.gainMaster);
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  public toggleAmbience(): boolean {
    this.init();
    if (!this.ctx) return false;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isAmbienceOn = !this.isAmbienceOn;

    if (this.isAmbienceOn) {
      this.startAmbience();
    } else {
      this.stopAmbience();
    }

    return this.isAmbienceOn;
  }

  public isEnabled(): boolean {
    return this.isAmbienceOn;
  }

  private startAmbience() {
    if (!this.ctx || !this.gainAmbience) return;

    // Fade in ambience
    this.gainAmbience.gain.cancelScheduledValues(this.ctx.currentTime);
    this.gainAmbience.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + 1.5);

    // Deep Drone (55Hz / 82.4Hz - A1 / E2)
    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc1.type = 'sine';
    this.droneOsc1.frequency.setValueAtTime(55, this.ctx.currentTime);

    this.droneOsc2 = this.ctx.createOscillator();
    this.droneOsc2.type = 'triangle';
    this.droneOsc2.frequency.setValueAtTime(82.4, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, this.ctx.currentTime);

    this.droneOsc1.connect(filter);
    this.droneOsc2.connect(filter);
    filter.connect(this.gainAmbience);

    this.droneOsc1.start();
    this.droneOsc2.start();

    // Start occasional dripping water sound
    this.dripInterval = window.setInterval(() => {
      if (Math.random() < 0.6) {
        this.playWaterDrip();
      }
    }, 2800);
  }

  private stopAmbience() {
    if (!this.ctx || !this.gainAmbience) return;

    this.gainAmbience.gain.cancelScheduledValues(this.ctx.currentTime);
    this.gainAmbience.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.8);

    if (this.dripInterval) {
      clearInterval(this.dripInterval);
      this.dripInterval = null;
    }

    setTimeout(() => {
      try {
        this.droneOsc1?.stop();
        this.droneOsc2?.stop();
      } catch (e) {}
    }, 900);
  }

  public playWaterDrip() {
    if (!this.ctx || !this.isAmbienceOn) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const freq = 600 + Math.random() * 800;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.8, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.gainAmbience || this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.13);
    } catch (e) {}
  }

  public playStoneMovement() {
    this.init();
    if (!this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * 0.8;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(120, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.8);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.gainMaster || this.ctx.destination);

      noise.start();
    } catch (e) {}
  }

  public playClick() {
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.gainMaster || this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {}
  }

  public playResonanceBell() {
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(432, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 2.5);

      osc.connect(gain);
      gain.connect(this.gainMaster || this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 2.5);
    } catch (e) {}
  }
}

export const audioEngine = new TempleAudioEngine();
