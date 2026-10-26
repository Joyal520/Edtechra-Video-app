import { MusicCategory, MusicTrack } from '../types/video';

export const MUSIC_CATEGORIES: MusicCategory[] = [
  'Motivational',
  'Educational',
  'Cinematic',
  'Emotional',
  'Mystery',
  'Funny',
  'Horror',
  'Calm',
  'Corporate',
];

export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'track_lofi_focus',
    title: 'Midnight Coffee Study',
    category: 'Educational',
    duration: 120,
    bpm: 82,
    energy: 'low',
    toneType: 'lofi_study',
    waveformPattern: [15, 30, 45, 60, 40, 50, 70, 85, 60, 45, 35, 55, 65, 80, 50, 30],
  },
  {
    id: 'track_motivational_rise',
    title: 'Neon Horizon Spark',
    category: 'Motivational',
    duration: 90,
    bpm: 124,
    energy: 'high',
    toneType: 'synth_chill',
    waveformPattern: [30, 60, 80, 95, 75, 85, 90, 100, 85, 70, 90, 85, 65, 50, 40, 30],
  },
  {
    id: 'track_calm_zen',
    title: 'Morning Dew Drops',
    category: 'Calm',
    duration: 150,
    bpm: 72,
    energy: 'low',
    toneType: 'calm_piano',
    waveformPattern: [10, 20, 25, 40, 35, 50, 45, 30, 25, 35, 45, 40, 30, 20, 15, 10],
  },
  {
    id: 'track_cinematic_deep',
    title: 'Aether Chronicles',
    category: 'Cinematic',
    duration: 180,
    bpm: 95,
    energy: 'medium',
    toneType: 'cinematic_strings',
    waveformPattern: [20, 40, 60, 75, 85, 95, 90, 80, 65, 85, 90, 95, 80, 60, 40, 20],
  },
  {
    id: 'track_corporate_future',
    title: 'Silicon Velocity',
    category: 'Corporate',
    duration: 110,
    bpm: 118,
    energy: 'medium',
    toneType: 'corporate_bright',
    waveformPattern: [25, 45, 65, 70, 60, 75, 80, 85, 70, 65, 80, 75, 55, 45, 35, 20],
  },
  {
    id: 'track_mystery_shadows',
    title: 'Curious Artifact',
    category: 'Mystery',
    duration: 135,
    bpm: 88,
    energy: 'low',
    toneType: 'mystery_ambient',
    waveformPattern: [15, 25, 35, 50, 45, 60, 55, 70, 65, 50, 45, 60, 40, 30, 20, 15],
  },
  {
    id: 'track_emotional_memories',
    title: 'Autumn Reverie',
    category: 'Emotional',
    duration: 140,
    bpm: 76,
    energy: 'low',
    toneType: 'calm_piano',
    waveformPattern: [20, 35, 45, 55, 50, 65, 60, 50, 45, 55, 65, 60, 45, 35, 25, 15],
  },
  {
    id: 'track_funny_bounce',
    title: 'Whimsical Mischief',
    category: 'Funny',
    duration: 95,
    bpm: 130,
    energy: 'high',
    toneType: 'synth_chill',
    waveformPattern: [40, 70, 50, 85, 60, 90, 65, 95, 70, 85, 60, 80, 55, 70, 45, 30],
  },
  {
    id: 'track_horror_dread',
    title: 'Subterranean Pulse',
    category: 'Horror',
    duration: 120,
    bpm: 65,
    energy: 'medium',
    toneType: 'mystery_ambient',
    waveformPattern: [10, 15, 30, 45, 70, 90, 60, 40, 80, 95, 70, 50, 35, 25, 15, 10],
  },
];

class SynthesizedAudioPlayer {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private currentTrackId: string | null = null;
  private intervalId: any = null;
  private activeNodes: AudioNode[] = [];
  private onStateChange?: (playing: boolean, trackId: string | null) => void;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setListener(cb: (playing: boolean, trackId: string | null) => void) {
    this.onStateChange = cb;
  }

  playTrack(track: MusicTrack, volume = 0.3) {
    this.stop();
    this.initCtx();
    if (!this.ctx) return;

    this.isPlaying = true;
    this.currentTrackId = track.id;
    this.onStateChange?.(true, track.id);

    // Procedural musical progression based on track style
    let step = 0;
    const chords: number[][] =
      track.toneType === 'lofi_study'
        ? [[261.63, 329.63, 392.0, 493.88], [220.0, 261.63, 329.63, 392.0], [174.61, 220.0, 261.63, 329.63], [196.0, 246.94, 293.66, 349.23]]
        : track.toneType === 'calm_piano'
        ? [[261.63, 329.63, 392.0], [293.66, 369.99, 440.0], [220.0, 261.63, 329.63], [174.61, 220.0, 261.63]]
        : track.toneType === 'synth_chill'
        ? [[130.81, 261.63, 392.0], [146.83, 293.66, 440.0], [110.0, 220.0, 329.63], [174.61, 349.23, 523.25]]
        : [[196.0, 246.94, 293.66], [164.81, 196.0, 246.94], [146.83, 174.61, 220.0], [130.81, 164.81, 196.0]];

    const beatInterval = (60 / track.bpm) * 1000;

    const playChord = () => {
      if (!this.isPlaying || !this.ctx) return;
      const currentChord = chords[step % chords.length];
      const now = this.ctx.currentTime;

      currentChord.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = track.toneType === 'lofi_study' ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq * (idx === 0 ? 0.5 : 1), now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume * 0.15, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + (beatInterval / 1000) * 1.8);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now);
        osc.stop(now + (beatInterval / 1000) * 2);
        this.activeNodes.push(osc, gain);
      });

      step++;
    };

    playChord();
    this.intervalId = setInterval(playChord, beatInterval);
  }

  stop() {
    this.isPlaying = false;
    this.currentTrackId = null;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.activeNodes.forEach((node) => {
      try {
        if ('stop' in node && typeof (node as any).stop === 'function') {
          (node as any).stop();
        }
      } catch {}
    });
    this.activeNodes = [];
    this.onStateChange?.(false, null);
  }

  getPlayingTrackId(): string | null {
    return this.currentTrackId;
  }
}

export const musicPlayer = new SynthesizedAudioPlayer();
