import { useCallback, useEffect, useRef, useState } from 'react';

export type ArchiveSoundCue = 'focus' | 'open' | 'switch' | 'close';

const SOUND_PREFERENCE_KEY = 'portfolio.archive-sound';

const CUE_SOURCES: Record<ArchiveSoundCue, string> = {
  focus: '/audio/radio-focus.wav',
  open: '/audio/radio-open.wav',
  switch: '/audio/radio-switch.wav',
  close: '/audio/radio-close.wav',
};

class ArchiveSoundEngine {
  private context: AudioContext | null = null;
  private clips = new Map<string, AudioBuffer | Promise<AudioBuffer | null>>();
  private active: AudioBufferSourceNode | null = null;
  private request = 0;

  private getContext() {
    if (!this.context && typeof AudioContext !== 'undefined') {
      this.context = new AudioContext({ latencyHint: 'interactive' });
    }
    return this.context;
  }

  private load(context: AudioContext, url: string) {
    const cached = this.clips.get(url);
    if (cached) return cached;

    const loading = fetch(url)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.arrayBuffer();
      })
      .then(bytes => context.decodeAudioData(bytes))
      .then(buffer => {
        this.clips.set(url, buffer);
        return buffer;
      })
      .catch((error: unknown) => {
        this.clips.delete(url);
        if (context.state !== 'closed') console.warn('Could not load interface sound', url, error);
        return null;
      });
    this.clips.set(url, loading);
    return loading;
  }

  preload() {
    const context = this.getContext();
    if (context) Object.values(CUE_SOURCES).forEach(url => this.load(context, url));
  }

  unlock() {
    const context = this.getContext();
    if (context && context.state !== 'running') void context.resume().catch(() => {});
  }

  private start(context: AudioContext, buffer: AudioBuffer) {
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.onended = () => {
      source.disconnect();
      if (this.active === source) this.active = null;
    };
    this.active = source;
    source.start();
  }

  play(cue: ArchiveSoundCue) {
    this.stop();
    const context = this.getContext();
    if (!context) return;

    const clip = this.load(context, CUE_SOURCES[cue]);
    if (context.state === 'running' && clip instanceof AudioBuffer) {
      this.start(context, clip);
      return;
    }

    // A delayed hover would describe an option the pointer may already have left.
    if (cue === 'focus') return;
    const request = this.request;
    void Promise.all([clip, context.resume()]).then(([buffer]) => {
      if (buffer && request === this.request && context.state === 'running') {
        this.start(context, buffer);
      }
    }, () => {});
  }

  stop() {
    this.request++;
    this.active?.stop();
    this.active = null;
  }

  dispose() {
    this.stop();
    if (this.context) void this.context.close().catch(() => {});
  }
}

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
  const engineRef = useRef<ArchiveSoundEngine | null>(null);

  useEffect(() => {
    const engine = new ArchiveSoundEngine();
    engineRef.current = engine;
    if (enabledRef.current) engine.preload();
    const unlock = () => {
      if (enabledRef.current) engine.unlock();
    };
    window.addEventListener('pointerup', unlock, true);
    window.addEventListener('keydown', unlock, true);
    return () => {
      window.removeEventListener('pointerup', unlock, true);
      window.removeEventListener('keydown', unlock, true);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const play = useCallback((cue: ArchiveSoundCue) => {
    if (enabledRef.current) engineRef.current?.play(cue);
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
      engineRef.current?.preload();
      engineRef.current?.play('switch');
    } else {
      engineRef.current?.stop();
    }
  }, []);

  return { enabled, play, toggle };
}
