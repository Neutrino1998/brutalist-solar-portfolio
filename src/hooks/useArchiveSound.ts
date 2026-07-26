import { useCallback, useEffect, useRef, useState } from 'react';

export type ArchiveSoundCue = 'focus' | 'open' | 'switch' | 'close';

const SOUND_PREFERENCE_KEY = 'portfolio.archive-sound';

const CUE_SETTINGS: Record<ArchiveSoundCue, {
  source: string;
  volume: number;
  playbackRate: number;
}> = {
  focus: {
    source: '/audio/archive-focus.mp3',
    volume: 0.16,
    playbackRate: 1,
  },
  open: {
    source: '/audio/archive-open.mp3',
    volume: 0.3,
    playbackRate: 1,
  },
  switch: {
    source: '/audio/archive-switch.mp3',
    volume: 0.25,
    playbackRate: 1,
  },
  close: {
    source: '/audio/archive-switch.mp3',
    volume: 0.2,
    playbackRate: 0.82,
  },
};

class ArchiveSoundEngine {
  private players = new Map<string, HTMLAudioElement>();
  private activePlayer: HTMLAudioElement | null = null;

  private getPlayer(source: string) {
    const existingPlayer = this.players.get(source);
    if (existingPlayer) return existingPlayer;

    const player = new Audio(source);
    player.preload = 'auto';
    this.players.set(source, player);
    return player;
  }

  preload() {
    Object.values(CUE_SETTINGS).forEach(({ source }) => {
      this.getPlayer(source).load();
    });
  }

  play(cue: ArchiveSoundCue) {
    const settings = CUE_SETTINGS[cue];
    const player = this.getPlayer(settings.source);
    const pitchDrift = 0.99 + Math.random() * 0.02;

    this.stop();
    player.currentTime = 0;
    player.volume = settings.volume;
    player.playbackRate = settings.playbackRate * pitchDrift;
    player.onended = () => {
      if (this.activePlayer === player) this.activePlayer = null;
    };
    this.activePlayer = player;

    void player.play().catch(() => {
      if (this.activePlayer === player) this.activePlayer = null;
    });
  }

  stop() {
    if (!this.activePlayer) return;
    this.activePlayer.pause();
    this.activePlayer.currentTime = 0;
    this.activePlayer = null;
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

  useEffect(() => {
    if (enabledRef.current) archiveSoundEngine.preload();
  }, []);

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
