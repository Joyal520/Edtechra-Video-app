import {
  ProductionPresetId,
  ProductionPresetConfig,
  VideoProject,
  AnimationEffect,
  TransitionEffect,
  GlitchEffect,
} from '../types/video';

export const PRODUCTION_PRESETS: Record<ProductionPresetId, ProductionPresetConfig> = {
  mystery_documentary: {
    id: 'mystery_documentary',
    name: 'Mystery Documentary',
    description:
      'Cinematic aerial pushes, subtle parallax, atmospheric fog, controlled ken burns, deep dark fade transitions, and continuous voiceover ducking.',
    animationPattern: ['slow_zoom_in', 'ken_burns', 'parallax', 'slow_zoom_out', 'slow_zoom_in'],
    transitions: ['crossfade', 'dissolve' as any, 'dark_fade', 'crossfade', 'dark_fade'],
    defaultGlitch: 'vhs_flicker',
    gradeProfile: 'creepy',
    captionStyle: 'POP',
    captionColor: '#FF3B3B',
    musicTrackId: 'track_beneath_the_heavy_soil',
    musicVolume: 0.16,
    voiceVolume: 1.0,
    duckingAmountDb: 12,
  },
  horror: {
    id: 'horror',
    name: 'Horror & Paranormal',
    description:
      'Heavier glitch bursts, frame distortion, digital static, camera shake, deep dark vignette, sudden cuts, and unsettling sub-bass.',
    animationPattern: ['shake', 'slow_zoom_in', 'parallax', 'pan_down', 'slow_zoom_in'],
    transitions: ['glitch', 'dark_fade', 'crossfade', 'glitch', 'dark_fade'],
    defaultGlitch: 'digital_static',
    gradeProfile: 'creepy',
    captionStyle: 'BOLD',
    captionColor: '#EF4444',
    musicTrackId: 'track_beneath_the_heavy_soil',
    musicVolume: 0.18,
    voiceVolume: 1.0,
    duckingAmountDb: 14,
  },
  historical_mystery: {
    id: 'historical_mystery',
    name: 'Historical Mystery & Archival',
    description:
      '1950s/1960s 35mm film grain, vintage exposure flicker, archival texture, restrained analog scanlines, pan tilts, and documentary typography.',
    animationPattern: ['pan_up', 'slow_zoom_in', 'pan_left', 'ken_burns', 'slow_zoom_in'],
    transitions: ['crossfade', 'film_dissolve', 'crossfade', 'crossfade', 'dark_fade'],
    defaultGlitch: 'vhs_flicker',
    gradeProfile: 'retro_vintage',
    captionStyle: 'POP',
    captionColor: '#FACC15',
    musicTrackId: 'track_beneath_the_heavy_soil',
    musicVolume: 0.15,
    voiceVolume: 1.0,
    duckingAmountDb: 12,
  },
  custom: {
    id: 'custom',
    name: 'Custom / Manual Mode',
    description: 'Manual customization of all animations, glitch effects, transitions, and audio levels.',
    animationPattern: ['slow_zoom_in', 'slow_zoom_out', 'ken_burns', 'pan_left', 'slow_zoom_in'],
    transitions: ['crossfade', 'crossfade', 'crossfade', 'crossfade', 'dark_fade'],
    defaultGlitch: 'none',
    gradeProfile: 'clean',
    captionStyle: 'POP',
    captionColor: '#FACC15',
    musicTrackId: 'track_beneath_the_heavy_soil',
    musicVolume: 0.16,
    voiceVolume: 1.0,
    duckingAmountDb: 12,
  },
};

/**
 * Apply a production preset cleanly across a VideoProject without overwriting custom prompt or narration content.
 */
export function applyPresetToProject(
  project: VideoProject,
  presetId: ProductionPresetId
): VideoProject {
  const preset = PRODUCTION_PRESETS[presetId] || PRODUCTION_PRESETS.mystery_documentary;
  const cloned = JSON.parse(JSON.stringify(project)) as VideoProject;

  cloned.project.presetId = preset.id;
  cloned.project.musicTrackId = preset.musicTrackId;
  cloned.project.musicVolume = preset.musicVolume;
  cloned.project.voiceVolume = preset.voiceVolume;

  if (cloned.captions) {
    cloned.captions.style = preset.captionStyle;
    cloned.captions.highlightColor = preset.captionColor;
  }

  cloned.scenes = cloned.scenes.map((scene, idx) => {
    const anim = preset.animationPattern[idx % preset.animationPattern.length];
    const trans = preset.transitions[idx % preset.transitions.length];
    return {
      ...scene,
      animation: anim as AnimationEffect,
      transition: trans as TransitionEffect,
      glitchEffect: scene.glitchEffect || preset.defaultGlitch,
    };
  });

  return cloned;
}
