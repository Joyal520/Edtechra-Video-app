import { MusicCategory, MusicTrack } from '../types/video';

export const MUSIC_CATEGORIES: MusicCategory[] = [
  'Mystery',
  'Cinematic',
  'Educational',
  'Calm',
  'Inspirational',
  'Positive',
  'Soft',
  'Motivational',
  'Emotional',
];

export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'track_creepy_legend_01',
    title: 'Point Pleasant Nightfall (Dark Mystery Drone)',
    category: 'Mystery',
    duration: 65,
    bpm: 64,
    energy: 'low',
    audioUrl: './music/creepy-legend-01.mp3',
    creator: 'Faceless Studio Dark Folklore Unit',
    license: 'Creative Commons 0 (CC0 Public Domain)',
    attribution: 'None required (100% Free for Commercial & YouTube Shorts use)',
    toneType: 'mystery_ambient',
    waveformPattern: [20, 35, 50, 45, 65, 80, 55, 70, 85, 60, 50, 75, 90, 65, 45, 25],
  },
  {
    id: 'track_educational_01',
    title: 'Focus Horizon (Study & Learn)',
    category: 'Educational',
    duration: 45,
    bpm: 86,
    energy: 'low',
    audioUrl: './music/educational-01.mp3',
    creator: 'Faceless Studio Free Library',
    license: 'Creative Commons 0 (CC0 Public Domain)',
    attribution: 'None required (100% Free for Commercial & Educational use)',
    toneType: 'lofi_study',
    waveformPattern: [15, 30, 45, 60, 40, 50, 70, 85, 60, 45, 35, 55, 65, 80, 50, 30],
  },
  {
    id: 'track_calm_01',
    title: 'Peaceful Reflections',
    category: 'Calm',
    duration: 45,
    bpm: 72,
    energy: 'low',
    audioUrl: './music/calm-01.mp3',
    creator: 'Faceless Studio Free Library',
    license: 'Creative Commons 0 (CC0 Public Domain)',
    attribution: 'None required (100% Free for Commercial & Educational use)',
    toneType: 'calm_piano',
    waveformPattern: [10, 20, 25, 40, 35, 50, 45, 30, 25, 35, 45, 40, 30, 20, 15, 10],
  },
  {
    id: 'track_positive_01',
    title: 'Morning Clarity & Growth',
    category: 'Positive',
    duration: 45,
    bpm: 110,
    energy: 'medium',
    audioUrl: './music/positive-01.mp3',
    creator: 'Faceless Studio Free Library',
    license: 'Creative Commons 0 (CC0 Public Domain)',
    attribution: 'None required (100% Free for Commercial & Educational use)',
    toneType: 'synth_chill',
    waveformPattern: [25, 45, 65, 75, 60, 70, 85, 90, 70, 60, 80, 75, 55, 45, 35, 20],
  },
  {
    id: 'track_inspirational_01',
    title: 'Rising Potential',
    category: 'Inspirational',
    duration: 45,
    bpm: 96,
    energy: 'medium',
    audioUrl: './music/inspirational-01.mp3',
    creator: 'Faceless Studio Free Library',
    license: 'Creative Commons 0 (CC0 Public Domain)',
    attribution: 'None required (100% Free for Commercial & Educational use)',
    toneType: 'cinematic_strings',
    waveformPattern: [20, 40, 60, 75, 85, 95, 90, 80, 65, 85, 90, 95, 80, 60, 40, 20],
  },
  {
    id: 'track_cinematic_01',
    title: 'Mind Symphony & Mystery',
    category: 'Cinematic',
    duration: 45,
    bpm: 90,
    energy: 'medium',
    audioUrl: './music/cinematic-01.mp3',
    creator: 'Faceless Studio Free Library',
    license: 'Creative Commons 0 (CC0 Public Domain)',
    attribution: 'None required (100% Free for Commercial & Educational use)',
    toneType: 'mystery_ambient',
    waveformPattern: [15, 25, 35, 50, 45, 60, 55, 70, 65, 50, 45, 60, 40, 30, 20, 15],
  },
  {
    id: 'track_soft_01',
    title: 'Gentle Thought (Soft Acoustic)',
    category: 'Soft',
    duration: 45,
    bpm: 78,
    energy: 'low',
    audioUrl: './music/soft-01.mp3',
    creator: 'Faceless Studio Free Library',
    license: 'Creative Commons 0 (CC0 Public Domain)',
    attribution: 'None required (100% Free for Commercial & Educational use)',
    toneType: 'calm_piano',
    waveformPattern: [20, 35, 45, 55, 50, 65, 60, 50, 45, 55, 65, 60, 45, 35, 25, 15],
  },
  {
    id: 'track_lofi_focus',
    title: 'Midnight Coffee Study',
    category: 'Educational',
    duration: 120,
    bpm: 82,
    energy: 'low',
    creator: 'Faceless Studio Lo-Fi Unit',
    license: 'Royalty-Free / CC-BY',
    attribution: 'Faceless AI Video Creator',
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
    creator: 'Faceless Studio Electro Lab',
    license: 'Royalty-Free / CC-BY',
    attribution: 'Faceless AI Video Creator',
    toneType: 'synth_chill',
    waveformPattern: [30, 60, 80, 95, 75, 85, 90, 100, 85, 70, 90, 85, 65, 50, 40, 30],
  },
];

class AudioMusicPlayer {
  private audioElement: HTMLAudioElement | null = null;
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
    this.isPlaying = true;
    this.currentTrackId = track.id;
    this.onStateChange?.(true, track.id);

    // If real audio file is available, play via HTML5 Audio
    if (typeof window !== 'undefined' && track.audioUrl) {
      try {
        const audio = new Audio(track.audioUrl);
        audio.volume = Math.max(0, Math.min(1, volume));
        audio.loop = true;
        audio.onended = () => {
          if (!audio.loop) {
            this.stop();
          }
        };
        audio.onerror = () => {
          console.warn('Real audio file playback failed, falling back to synthesis');
          this.playSynthesizedFallback(track, volume);
        };
        audio.play().catch(() => {
          this.playSynthesizedFallback(track, volume);
        });
        this.audioElement = audio;
        return;
      } catch {
        // Fallback to synthesis
      }
    }

    this.playSynthesizedFallback(track, volume);
  }

  setVolume(volume: number) {
    const clamped = Math.max(0, Math.min(1, volume));
    if (this.audioElement) {
      this.audioElement.volume = clamped;
    }
  }

  private playSynthesizedFallback(track: MusicTrack, volume: number) {
    this.initCtx();
    if (!this.ctx) return;

    let step = 0;
    const chords: number[][] =
      track.toneType === 'lofi_study'
        ? [[261.63, 329.63, 392.0, 493.88], [220.0, 261.63, 329.63, 392.0], [174.61, 220.0, 261.63, 329.63], [196.0, 246.94, 293.66, 349.23]]
        : track.toneType === 'calm_piano'
        ? [[261.63, 329.63, 392.0], [293.66, 369.99, 440.0], [220.0, 261.63, 329.63], [174.61, 220.0, 261.63]]
        : track.toneType === 'synth_chill'
        ? [[130.81, 261.63, 392.0], [146.83, 293.66, 440.0], [110.0, 220.0, 329.63], [174.61, 349.23, 523.25]]
        : [[196.0, 246.94, 293.66], [164.81, 196.0, 246.94], [146.83, 174.61, 220.0], [130.81, 164.81, 196.0]];

    const beatInterval = (60 / (track.bpm || 80)) * 1000;

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

    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch {}
      this.audioElement = null;
    }

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

export const musicPlayer = new AudioMusicPlayer();
