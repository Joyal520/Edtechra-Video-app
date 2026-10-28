export interface RenderOptions {
  resolution: '720p' | '1080p';
  quality: 'standard' | 'high';
  format: 'mp4';
  fastMode?: boolean; // Fast Generation mode: reuse asset cache, render changed scenes only
}

export type AspectRatio = '9:16' | '16:9' | '1:1' | '4:5';

export type VideoStyle =
  | 'creepy_legend'
  | 'stickman'
  | '3d_cartoon'
  | 'paper_cut'
  | 'cinematic'
  | 'minimal_illustration'
  | 'whiteboard'
  | 'anime'
  | 'flat_vector'
  | 'educational'
  | 'custom';

export type AnimationEffect =
  | 'none'
  | 'slow_zoom_in'
  | 'slow_zoom_out'
  | 'pan_left'
  | 'pan_right'
  | 'pan_up'
  | 'pan_down'
  | 'ken_burns'
  | 'floating'
  | 'parallax'
  | 'shake'
  | 'bounce';

export type TransitionEffect =
  | 'none'
  | 'fade'
  | 'crossfade'
  | 'dark_fade'
  | 'film_dissolve'
  | 'glitch'
  | 'slide_left'
  | 'slide_right'
  | 'zoom'
  | 'blur'
  | 'wipe'
  | 'push';

export type GlitchEffect =
  | 'none'
  | 'rgb_split'
  | 'vhs_flicker'
  | 'vhs_distortion'
  | 'scanline_static'
  | 'signal_distortion'
  | 'digital_static'
  | 'pixel_tearing'
  | 'film_scratches'
  | 'light_leak'
  | 'camera_shake'
  | 'crimson_shock';

export interface GlitchTrigger {
  id?: string;
  timeOffset: number; // Seconds from scene start
  duration: number; // Seconds of glitch burst (typically 0.25 - 0.45s)
  effect: GlitchEffect;
  intensity: number; // 0.0 to 1.0
  keywordTrigger?: string; // Narrative phrase cue (e.g., 'TAURED', 'HE WAS GONE')
}

export type CaptionStyle = 'NORMAL' | 'BOLD' | 'KARAOKE' | 'POP' | 'MINIMAL';
export type CaptionPosition = 'bottom' | 'center' | 'top';

export interface CaptionSettings {
  enabled: boolean;
  style: CaptionStyle;
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  position: CaptionPosition;
  textColor: string;
  highlightColor: string;
  backgroundColor: string;
  maxWordsPerLine: number;
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'Female' | 'Male';
  persona: 'Friendly' | 'Educational' | 'Storyteller';
  pitch: number;
  rate: number;
  previewSample: string;
}

export type MusicCategory =
  | 'Creepy / Horror / Mystery'
  | 'Mystery'
  | 'Calm'
  | 'Inspirational'
  | 'Positive'
  | 'Educational'
  | 'Cinematic'
  | 'Soft'
  | 'Motivational'
  | 'Emotional'
  | 'Funny'
  | 'Corporate';

export interface MusicTrack {
  id: string;
  title: string;
  category: MusicCategory;
  duration: number; // in seconds
  bpm: number;
  energy: 'low' | 'medium' | 'high';
  audioUrl?: string;
  license?: string;
  attribution?: string;
  creator?: string;
  waveformPattern?: number[];
  toneType?:
    | 'synth_chill'
    | 'lofi_study'
    | 'cinematic_strings'
    | 'mystery_ambient'
    | 'corporate_bright'
    | 'calm_piano';
}

export type ImageSourceType = 'ai' | 'upload' | 'sample';
export type ImageCropMode = 'cover' | 'contain' | 'fill';

export interface Scene {
  id: number;
  duration: number; // seconds
  narration: string;
  image_prompt: string;
  on_screen_text?: string;
  animation: AnimationEffect;
  transition: TransitionEffect;
  glitchEffect?: GlitchEffect;
  glitchTriggers?: GlitchTrigger[];
  parallaxIntensity?: number; // 0 to 1
  sfxUrl?: string;
  sfxLabel?: string;
  imageUrl?: string;
  audioUrl?: string;
  imageSourceType?: ImageSourceType;
  cropMode?: ImageCropMode;
  audioDuration?: number;
  sceneHash?: string;
  isGeneratingImage?: boolean;
  isGeneratingAudio?: boolean;
  error?: string;
}

export type ProductionPresetId = 'mystery_documentary' | 'horror' | 'historical_mystery' | 'custom';

export interface ProductionPresetConfig {
  id: ProductionPresetId;
  name: string;
  description: string;
  animationPattern: AnimationEffect[];
  transitions: TransitionEffect[];
  defaultGlitch: GlitchEffect;
  gradeProfile: 'creepy' | 'retro_vintage' | 'noir' | 'clean';
  captionStyle: CaptionStyle;
  captionColor: string;
  musicTrackId: string;
  musicVolume: number;
  voiceVolume: number;
  duckingAmountDb: number;
}

export interface ProductionChecklistItem {
  id: string;
  label: string;
  status: 'passed' | 'warning' | 'failed';
  details: string;
}

export interface ProductionChecklistReport {
  isReady: boolean;
  score: number; // 0 to 100
  items: ProductionChecklistItem[];
  cachedAssetsCount: number;
  missingAssetsCount: number;
  warnings: string[];
}

export interface ProjectSettings {
  title: string;
  description: string;
  aspect_ratio: AspectRatio;
  resolution: string;
  fps: number;
  style: VideoStyle;
  presetId?: ProductionPresetId;
  customStylePrompt?: string;
  language: string;
  total_duration: number;
  voiceId: string;
  musicTrackId?: string;
  musicVolume: number; // 0 to 1
  voiceVolume: number; // 0 to 1
  sfxVolume?: number; // 0 to 1
  fastMode?: boolean;
}

export interface VideoProject {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'ready' | 'rendering' | 'completed';
  originalTopic: string;
  project: ProjectSettings;
  scenes: Scene[];
  captions: CaptionSettings;
  exportedVideoUrl?: string;
  thumbnailUrl?: string;
}

export interface ValidationIssue {
  path: string;
  message: string;
  sceneIndex?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  summary?: {
    sceneCount: number;
    totalDuration: number;
    aspectRatio: AspectRatio;
    style: string;
  };
}
