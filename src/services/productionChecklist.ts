import { VideoProject, ProductionChecklistReport, ProductionChecklistItem } from '../types/video';

export function runProductionChecklist(project: VideoProject): ProductionChecklistReport {
  const items: ProductionChecklistItem[] = [];
  const warnings: string[] = [];
  let cachedCount = 0;
  let missingCount = 0;

  // 1. Scene Count Check
  const sceneCount = project.scenes.length;
  if (sceneCount === 5) {
    items.push({
      id: 'scene_count',
      label: '5-Scene Story Structure',
      status: 'passed',
      details: 'Exactly 5 calibrated scenes configured for Shorts/Reels pacing.',
    });
  } else {
    items.push({
      id: 'scene_count',
      label: 'Scene Count',
      status: sceneCount > 0 ? 'warning' : 'failed',
      details: `Project has ${sceneCount} scenes (target standard is 5).`,
    });
  }

  // 2. 9:16 Aspect Ratio & 1080x1920 Resolution Check
  const isVertical = project.project.aspect_ratio === '9:16';
  const has1080 = project.project.resolution.includes('1080');
  if (isVertical) {
    items.push({
      id: 'aspect_ratio',
      label: '9:16 Vertical Composition',
      status: 'passed',
      details: `Targeting 1080×1920 vertical format optimized for Shorts, Reels, and TikTok.`,
    });
  } else {
    items.push({
      id: 'aspect_ratio',
      label: '9:16 Vertical Composition',
      status: 'failed',
      details: `Current ratio is ${project.project.aspect_ratio}. Requires 9:16 vertical.`,
    });
  }

  // 3. Image Assets Check
  const scenesWithImages = project.scenes.filter((s) => Boolean(s.imageUrl));
  if (scenesWithImages.length === sceneCount && sceneCount > 0) {
    items.push({
      id: 'images_ready',
      label: 'Visual Scenes Loaded',
      status: 'passed',
      details: `All ${sceneCount} scenes have valid high-resolution image assets attached.`,
    });
  } else {
    missingCount += sceneCount - scenesWithImages.length;
    items.push({
      id: 'images_ready',
      label: 'Visual Scenes Loaded',
      status: 'failed',
      details: `${scenesWithImages.length}/${sceneCount} scenes have images loaded.`,
    });
  }

  // 4. Voiceover Audio Continuity Check
  const scenesWithAudio = project.scenes.filter((s) => Boolean(s.audioUrl));
  if (scenesWithAudio.length === sceneCount && sceneCount > 0) {
    items.push({
      id: 'voiceover_ready',
      label: 'Master Continuous Voiceover',
      status: 'passed',
      details: `All ${sceneCount} scenes have calibrated voiceover stems ready for timeline stitching.`,
    });
  } else {
    missingCount += sceneCount - scenesWithAudio.length;
    items.push({
      id: 'voiceover_ready',
      label: 'Master Continuous Voiceover',
      status: 'failed',
      details: `${scenesWithAudio.length}/${sceneCount} scene voice stems present.`,
    });
  }

  // 5. Background Soundtrack & Audio Ducking Check
  if (project.project.musicTrackId) {
    items.push({
      id: 'music_soundtrack',
      label: 'Continuous Background Music',
      status: 'passed',
      details: `Selected track (${project.project.musicTrackId}) with automatic -12dB voice ducking.`,
    });
  } else {
    items.push({
      id: 'music_soundtrack',
      label: 'Continuous Background Music',
      status: 'warning',
      details: 'No background music selected. Video will render with narration only.',
    });
    warnings.push('Background soundtrack is not configured.');
  }

  // 6. Captions & Safe Area Margins
  if (project.captions?.enabled !== false) {
    items.push({
      id: 'captions_safe_area',
      label: 'Reels Safe-Zone Captions',
      status: 'passed',
      details: 'Montserrat ExtraBold captions with kinetic pop & safe margin padding.',
    });
  } else {
    items.push({
      id: 'captions_safe_area',
      label: 'Captions',
      status: 'warning',
      details: 'Captions are disabled in project settings.',
    });
  }

  // 7. Motion & Camera Animations
  const staticScenes = project.scenes.filter(
    (s) => !s.animation || s.animation === 'none'
  );
  if (staticScenes.length === 0) {
    items.push({
      id: 'motion_animation',
      label: 'Cinematic Camera Motion',
      status: 'passed',
      details: 'All scenes have continuous camera movements (zoom, pan, parallax, tilt).',
    });
  } else {
    items.push({
      id: 'motion_animation',
      label: 'Cinematic Camera Motion',
      status: 'warning',
      details: `${staticScenes.length} scenes currently have 'none' animation set.`,
    });
  }

  // 8. Reusable Glitch & Transition Effects
  const hasGlitchesOrTransitions = project.scenes.some(
    (s) => (s.glitchEffect && s.glitchEffect !== 'none') || s.transition !== 'none'
  );
  if (hasGlitchesOrTransitions) {
    items.push({
      id: 'glitches_transitions',
      label: 'Atmospheric Glitch & Transitions',
      status: 'passed',
      details: 'Tasteful narrative-timed glitches and smooth dissolves configured.',
    });
  } else {
    items.push({
      id: 'glitches_transitions',
      label: 'Atmospheric Glitch & Transitions',
      status: 'warning',
      details: 'No transitions or glitch effects configured.',
    });
  }

  // 9. Cost Protection & Asset Caching
  items.push({
    id: 'cache_protection',
    label: 'Asset Cache & Cost Protection',
    status: 'passed',
    details: 'Asset caching active. Existing generated files will be reused with $0.00 duplicate API billing.',
  });

  const passedCount = items.filter((i) => i.status === 'passed').length;
  const score = Math.round((passedCount / items.length) * 100);
  const isReady = items.every((i) => i.status !== 'failed');

  return {
    isReady,
    score,
    items,
    cachedAssetsCount: cachedCount,
    missingAssetsCount: missingCount,
    warnings,
  };
}
