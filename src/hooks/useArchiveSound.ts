import { useCallback, useRef, useState } from 'react';

export type ArchiveSoundCue = 'open' | 'switch' | 'close';

const SOUND_PREFERENCE_KEY = 'portfolio.archive-sound';
const MIN_GAIN = 0.0001;

class ArchiveSoundEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private activeSources = new Set<AudioScheduledSourceNode>();

  private getAudioGraph() {
    if (this.context && this.masterGain && this.context.state !== 'closed') {
      return { context: this.context, output: this.masterGain };
    }

    const context = new AudioContext({ latencyHint: 'interactive' });
    const masterGain = context.createGain();
    const compressor = context.createDynamicsCompressor();

    masterGain.gain.value = 0.18;
    compressor.threshold.value = -18;
    compressor.knee.value = 6;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.08;
    masterGain.connect(compressor).connect(context.destination);

    this.context = context;
    this.masterGain = masterGain;
    this.noiseBuffer = null;

    return { context, output: masterGain };
  }

  private getNoiseBuffer(context: AudioContext) {
    if (this.noiseBuffer) return this.noiseBuffer;

    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.28), context.sampleRate);
    const channel = buffer.getChannelData(0);
    let previousSample = 0;

    for (let index = 0; index < channel.length; index += 1) {
      const whiteNoise = Math.random() * 2 - 1;
      previousSample = previousSample * 0.62 + whiteNoise * 0.38;
      channel[index] = previousSample;
    }

    this.noiseBuffer = buffer;
    return buffer;
  }

  private track(source: AudioScheduledSourceNode) {
    this.activeSources.add(source);
    source.addEventListener('ended', () => this.activeSources.delete(source), { once: true });
  }

  private stopActiveSources(at: number) {
    this.activeSources.forEach((source) => {
      try {
        source.stop(at);
      } catch {
        this.activeSources.delete(source);
      }
    });
  }

  private scheduleNoise(
    context: AudioContext,
    output: AudioNode,
    at: number,
    duration: number,
    gainValue: number,
    frequency: number,
    q = 0.8,
  ) {
    const source = context.createBufferSource();
    const bandpass = context.createBiquadFilter();
    const gain = context.createGain();

    source.buffer = this.getNoiseBuffer(context);
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(frequency, at);
    bandpass.Q.setValueAtTime(q, at);
    gain.gain.setValueAtTime(MIN_GAIN, at);
    gain.gain.exponentialRampToValueAtTime(gainValue, at + 0.003);
    gain.gain.exponentialRampToValueAtTime(MIN_GAIN, at + duration);

    source.connect(bandpass).connect(gain).connect(output);
    this.track(source);
    source.start(at);
    source.stop(at + duration + 0.012);
  }

  private scheduleKnock(
    context: AudioContext,
    output: AudioNode,
    at: number,
    duration: number,
    gainValue: number,
    startFrequency: number,
    endFrequency: number,
    type: OscillatorType = 'triangle',
  ) {
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(startFrequency, at);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, at + duration);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.max(900, startFrequency * 2.4), at);
    filter.frequency.exponentialRampToValueAtTime(420, at + duration);
    gain.gain.setValueAtTime(MIN_GAIN, at);
    gain.gain.exponentialRampToValueAtTime(gainValue, at + 0.002);
    gain.gain.exponentialRampToValueAtTime(MIN_GAIN, at + duration);

    oscillator.connect(filter).connect(gain).connect(output);
    this.track(oscillator);
    oscillator.start(at);
    oscillator.stop(at + duration + 0.008);
  }

  private scheduleCue(cue: ArchiveSoundCue) {
    if (!this.context || !this.masterGain) return;

    const context = this.context;
    const output = this.masterGain;
    const now = context.currentTime + 0.006;
    const pitchDrift = 0.96 + Math.random() * 0.08;

    this.stopActiveSources(now);

    if (cue === 'open') {
      this.scheduleKnock(context, output, now, 0.018, 0.2, 980 * pitchDrift, 230, 'square');
      this.scheduleNoise(context, output, now + 0.018, 0.12, 0.2, 980 * pitchDrift, 0.65);
      this.scheduleNoise(context, output, now + 0.14, 0.032, 0.38, 720 * pitchDrift, 0.9);
      this.scheduleKnock(context, output, now + 0.142, 0.065, 0.46, 190 * pitchDrift, 58);
      return;
    }

    if (cue === 'switch') {
      this.scheduleKnock(context, output, now, 0.014, 0.18, 840 * pitchDrift, 210, 'square');
      this.scheduleNoise(context, output, now + 0.006, 0.066, 0.18, 1380 * pitchDrift, 0.7);
      this.scheduleNoise(context, output, now + 0.072, 0.026, 0.3, 820 * pitchDrift, 0.95);
      this.scheduleKnock(context, output, now + 0.073, 0.047, 0.38, 215 * pitchDrift, 70);
      return;
    }

    this.scheduleNoise(context, output, now, 0.026, 0.3, 760 * pitchDrift, 0.9);
    this.scheduleKnock(context, output, now + 0.002, 0.046, 0.4, 235 * pitchDrift, 76);
    this.scheduleNoise(context, output, now + 0.03, 0.09, 0.14, 620 * pitchDrift, 0.55);
    this.scheduleKnock(context, output, now + 0.112, 0.058, 0.28, 128 * pitchDrift, 50);
  }

  play(cue: ArchiveSoundCue) {
    const { context } = this.getAudioGraph();

    if (context.state === 'suspended') {
      void context.resume().then(() => this.scheduleCue(cue));
      return;
    }

    this.scheduleCue(cue);
  }

  stop() {
    if (!this.context) return;
    this.stopActiveSources(this.context.currentTime + 0.006);
  }
}

const archiveSoundEngine = new ArchiveSoundEngine();

function getInitialPreference() {
  try {
    return window.localStorage.getItem(SOUND_PREFERENCE_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function useArchiveSound() {
  const [enabled, setEnabled] = useState(getInitialPreference);
  const enabledRef = useRef(enabled);

  const play = useCallback((cue: ArchiveSoundCue) => {
    if (enabledRef.current) archiveSoundEngine.play(cue);
  }, []);

  const toggle = useCallback(() => {
    const nextEnabled = !enabledRef.current;
    enabledRef.current = nextEnabled;
    setEnabled(nextEnabled);

    try {
      window.localStorage.setItem(SOUND_PREFERENCE_KEY, nextEnabled ? 'on' : 'off');
    } catch {
      // The preference remains available for the current session.
    }

    if (nextEnabled) {
      archiveSoundEngine.play('switch');
    } else {
      archiveSoundEngine.stop();
    }
  }, []);

  return { enabled, play, toggle };
}
