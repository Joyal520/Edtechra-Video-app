import { VoiceOption } from '../types/video';

export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: 'female_friendly',
    name: 'Sarah',
    gender: 'Female',
    persona: 'Friendly',
    pitch: 1.1,
    rate: 1.0,
    previewSample: 'Hey there! Ready to make your content go viral?',
  },
  {
    id: 'female_educational',
    name: 'Emma',
    gender: 'Female',
    persona: 'Educational',
    pitch: 1.0,
    rate: 0.95,
    previewSample: 'Welcome. In today’s breakdown, we explore how this works.',
  },
  {
    id: 'female_storyteller',
    name: 'Chloe',
    gender: 'Female',
    persona: 'Storyteller',
    pitch: 0.9,
    rate: 0.9,
    previewSample: 'Deep in the quiet forest, something extraordinary unfolded...',
  },
  {
    id: 'male_friendly',
    name: 'Marcus',
    gender: 'Male',
    persona: 'Friendly',
    pitch: 0.95,
    rate: 1.05,
    previewSample: 'What’s up everyone! Check out this mind-blowing fact.',
  },
  {
    id: 'male_educational',
    name: 'David',
    gender: 'Male',
    persona: 'Educational',
    pitch: 0.85,
    rate: 0.95,
    previewSample: 'According to scientific consensus, the results were definitive.',
  },
  {
    id: 'male_storyteller',
    name: 'Arthur',
    gender: 'Male',
    persona: 'Storyteller',
    pitch: 0.75,
    rate: 0.85,
    previewSample: 'Legend says the ancient secret was hidden for a thousand years...',
  },
];

export interface GenerateVoiceParams {
  text: string;
  voiceId: string;
  language?: string;
  sceneId?: number;
}

export interface GenerateVoiceParams {
  text: string;
  voiceId: string;
  language?: string;
  sceneId?: number;
  forceRegenerate?: boolean;
}

export interface GenerateVoiceResult {
  audioUrl: string;
  duration: number;
}

export interface VoiceGenerationService {
  generateVoice(params: GenerateVoiceParams, forceRegenerate?: boolean): Promise<string>;
  generateVoiceWithDuration(params: GenerateVoiceParams, forceRegenerate?: boolean): Promise<GenerateVoiceResult>;
  generateBatch(
    scenes: Array<{ id: number; narration: string }>,
    voiceId: string,
    language: string,
    onProgress?: (current: number, total: number, sceneId: number) => void
  ): Promise<Record<number, GenerateVoiceResult>>;
  speakPreview(text: string, voiceId: string): void;
  stopSpeech(): void;
  playAudio(audioUrl: string, volume?: number): HTMLAudioElement | null;
}

export class OpenAIVoiceGenerationService implements VoiceGenerationService {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;

  async generateVoiceWithDuration(params: GenerateVoiceParams, forceRegenerate = false): Promise<GenerateVoiceResult> {
    try {
      const res = await fetch('/api/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: params.text,
          voiceId: params.voiceId,
          language: params.language,
          forceRegenerate: forceRegenerate || params.forceRegenerate,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.audioUrl && data.duration) {
        return {
          audioUrl: data.audioUrl,
          duration: data.duration,
        };
      }

      if (data.error) {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.warn('OpenAI Voice generation notice:', err.message);
      if (err.message && (err.message.includes('quota') || err.message.includes('balance') || err.message.includes('missing') || err.message.includes('failed'))) {
        throw err;
      }
    }

    return this.generateFallbackAudio(params);
  }

  async generateVoice(params: GenerateVoiceParams, forceRegenerate = false): Promise<string> {
    const result = await this.generateVoiceWithDuration(params, forceRegenerate);
    return result.audioUrl;
  }

  private async generateFallbackAudio(params: GenerateVoiceParams): Promise<GenerateVoiceResult> {
    await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 150));

    try {
      if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const words = params.text.trim().split(/\s+/).length;
        const durationSec = Math.max(3, Math.min(15, Math.round(words * 0.38) + 1));
        const sampleRate = 22050;
        const frameCount = sampleRate * durationSec;
        const buffer = ctx.createBuffer(1, frameCount, sampleRate);
        const data = buffer.getChannelData(0);

        const voice = VOICE_OPTIONS.find((v) => v.id === params.voiceId) || VOICE_OPTIONS[0];
        const baseFreq = voice.gender === 'Female' ? 220 : 130;

        for (let i = 0; i < frameCount; i++) {
          const t = i / sampleRate;
          const syllMod = 0.5 + 0.5 * Math.sin(2 * Math.PI * 3.5 * t);
          const f0 = baseFreq * (1 + 0.05 * Math.sin(2 * Math.PI * 1.5 * t));
          const wave =
            0.6 * Math.sin(2 * Math.PI * f0 * t) +
            0.3 * Math.sin(2 * Math.PI * f0 * 2.1 * t) +
            0.1 * Math.sin(2 * Math.PI * f0 * 3.2 * t);
          const env = Math.min(1, t / 0.1) * Math.min(1, (durationSec - t) / 0.2);
          data[i] = wave * syllMod * env * 0.35;
        }

        const wavBlob = this.audioBufferToWav(buffer);
        const audioUrl = URL.createObjectURL(wavBlob);
        return { audioUrl, duration: durationSec };
      }
    } catch {
      // Ignore
    }

    return {
      audioUrl: '',
      duration: Math.max(3, Math.round(params.text.split(' ').length * 0.4)),
    };
  }

  async generateBatch(
    scenes: Array<{ id: number; narration: string }>,
    voiceId: string,
    language: string,
    onProgress?: (current: number, total: number, sceneId: number) => void
  ): Promise<Record<number, GenerateVoiceResult>> {
    const results: Record<number, GenerateVoiceResult> = {};
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      if (onProgress) {
        onProgress(i + 1, scenes.length, scene.id);
      }
      const voiceResult = await this.generateVoiceWithDuration({
        text: scene.narration,
        voiceId,
        language,
        sceneId: scene.id,
      });
      results[scene.id] = voiceResult;
    }
    return results;
  }

  playAudio(audioUrl: string, volume = 1.0): HTMLAudioElement | null {
    if (typeof window === 'undefined' || !audioUrl) return null;
    this.stopSpeech();
    try {
      const audio = new Audio(audioUrl);
      audio.volume = Math.max(0, Math.min(1, volume));
      audio.play().catch(() => {});
      this.currentAudioElement = audio;
      return audio;
    } catch {
      return null;
    }
  }

  speakPreview(text: string, voiceId: string): void {
    if (typeof window === 'undefined') return;
    this.stopSpeech();

    if (window.speechSynthesis) {
      const voice = VOICE_OPTIONS.find((v) => v.id === voiceId) || VOICE_OPTIONS[0];
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = voice.rate;
      utterance.pitch = voice.pitch;

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const match = voices.find((v) =>
          voice.gender === 'Female'
            ? /female|samantha|zira|victoria|karen|google.*female/i.test(v.name)
            : /male|david|alex|george|daniel|google.*male/i.test(v.name)
        );
        if (match) utterance.voice = match;
      }

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    }
  }

  stopSpeech(): void {
    if (typeof window !== 'undefined') {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (this.currentAudioElement) {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
        this.currentAudioElement = null;
      }
    }
  }

  /**
   * Converts an AudioBuffer into a WAV Blob
   */
  private audioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const dataLength = buffer.length * blockAlign;
    const bufferLength = 44 + dataLength;

    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    // RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    this.writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);

    // data sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    // write PCM audio samples
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      let sample = Math.max(-1, Math.min(1, channelData[i]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, sample, true);
      offset += 2;
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}

export const voiceGenerationService: VoiceGenerationService = new OpenAIVoiceGenerationService();
