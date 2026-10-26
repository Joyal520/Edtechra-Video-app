import {
  AspectRatio,
  AnimationEffect,
  TransitionEffect,
  ValidationResult,
  ValidationIssue,
  VideoProject,
  VideoStyle,
  Scene,
} from '../types/video';

export const VALID_ASPECT_RATIOS: AspectRatio[] = ['9:16', '16:9', '1:1', '4:5'];

export const VALID_ANIMATIONS: AnimationEffect[] = [
  'none',
  'slow_zoom_in',
  'slow_zoom_out',
  'pan_left',
  'pan_right',
  'pan_up',
  'pan_down',
  'ken_burns',
  'floating',
  'parallax',
  'shake',
  'bounce',
];

export const VALID_TRANSITIONS: TransitionEffect[] = [
  'none',
  'fade',
  'crossfade',
  'slide_left',
  'slide_right',
  'zoom',
  'blur',
  'wipe',
  'push',
];

export const VALID_STYLES: VideoStyle[] = [
  'stickman',
  '3d_cartoon',
  'paper_cut',
  'cinematic',
  'minimal_illustration',
  'whiteboard',
  'anime',
  'flat_vector',
  'educational',
  'custom',
];

/**
 * Validates a parsed or raw JSON object against the Faceless AI Video schema.
 * Extensible: unknown properties are preserved and do not cause errors.
 */
export function validateVideoPlanJson(input: unknown): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  let data: any = input;

  if (typeof input === 'string') {
    try {
      // Clean possible accidental markdown backticks if external AI returned it
      let clean = input.trim();
      if (clean.startsWith('```json')) {
        clean = clean.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
      } else if (clean.startsWith('```')) {
        clean = clean.replace(/^```\s*/, '').replace(/```\s*$/, '');
      }
      data = JSON.parse(clean);
    } catch (err: any) {
      return {
        isValid: false,
        errors: [{ path: 'root', message: `Invalid JSON syntax: ${err.message}` }],
        warnings: [],
      };
    }
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {
      isValid: false,
      errors: [{ path: 'root', message: 'Input must be a JSON object containing project and scenes.' }],
      warnings: [],
    };
  }

  // Validate Scenes array
  if (!data.scenes || !Array.isArray(data.scenes)) {
    errors.push({ path: 'scenes', message: 'Missing "scenes" array in the video plan.' });
  } else if (data.scenes.length === 0) {
    errors.push({ path: 'scenes', message: '"scenes" array must contain at least 1 scene.' });
  } else {
    data.scenes.forEach((scene: any, index: number) => {
      const sceneNum = index + 1;

      if (!scene || typeof scene !== 'object') {
        errors.push({
          path: `scenes[${index}]`,
          sceneIndex: sceneNum,
          message: `Scene ${sceneNum} must be a valid object.`,
        });
        return;
      }

      // Check narration
      if (!scene.narration || typeof scene.narration !== 'string' || scene.narration.trim() === '') {
        errors.push({
          path: `scenes[${index}].narration`,
          sceneIndex: sceneNum,
          message: `Scene ${sceneNum} is missing narration script.`,
        });
      }

      // Check image prompt
      if (!scene.image_prompt || typeof scene.image_prompt !== 'string' || scene.image_prompt.trim() === '') {
        errors.push({
          path: `scenes[${index}].image_prompt`,
          sceneIndex: sceneNum,
          message: `Scene ${sceneNum} is missing image_prompt.`,
        });
      }

      // Check duration
      if (scene.duration !== undefined && scene.duration !== null) {
        const dur = Number(scene.duration);
        if (isNaN(dur) || dur <= 0) {
          warnings.push({
            path: `scenes[${index}].duration`,
            sceneIndex: sceneNum,
            message: `Scene ${sceneNum} has invalid duration (${scene.duration}); defaulting to 6 seconds.`,
          });
        }
      } else {
        warnings.push({
          path: `scenes[${index}].duration`,
          sceneIndex: sceneNum,
          message: `Scene ${sceneNum} is missing duration; defaulting to 6 seconds.`,
        });
      }

      // Check animation
      if (scene.animation && !VALID_ANIMATIONS.includes(scene.animation)) {
        warnings.push({
          path: `scenes[${index}].animation`,
          sceneIndex: sceneNum,
          message: `Scene ${sceneNum} uses unknown animation "${scene.animation}". Defaulting to "slow_zoom_in".`,
        });
      }

      // Check transition
      if (scene.transition && !VALID_TRANSITIONS.includes(scene.transition)) {
        warnings.push({
          path: `scenes[${index}].transition`,
          sceneIndex: sceneNum,
          message: `Scene ${sceneNum} uses unknown transition "${scene.transition}". Defaulting to "crossfade".`,
        });
      }
    });
  }

  // Check project metadata (optional but warned if missing key fields)
  let aspectRatio: AspectRatio = '9:16';
  if (data.project?.aspect_ratio) {
    if (VALID_ASPECT_RATIOS.includes(data.project.aspect_ratio)) {
      aspectRatio = data.project.aspect_ratio;
    } else {
      warnings.push({
        path: 'project.aspect_ratio',
        message: `Aspect ratio "${data.project.aspect_ratio}" is unsupported. Using 9:16.`,
      });
    }
  }

  const sceneCount = Array.isArray(data.scenes) ? data.scenes.length : 0;
  const totalDuration = Array.isArray(data.scenes)
    ? data.scenes.reduce((acc: number, s: any) => acc + (Number(s?.duration) > 0 ? Number(s.duration) : 6), 0)
    : 0;

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      sceneCount,
      totalDuration,
      aspectRatio,
      style: data.project?.style || 'stickman',
    },
  };
}

/**
 * Normalizes imported JSON into a full VideoProject structure
 */
export function normalizeImportedProject(rawJson: any, baseProject?: Partial<VideoProject>): VideoProject {
  let data = rawJson;
  if (typeof rawJson === 'string') {
    let clean = rawJson.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    data = JSON.parse(clean);
  }

  const projMeta = data.project || {};
  const aspectRatio: AspectRatio = VALID_ASPECT_RATIOS.includes(projMeta.aspect_ratio)
    ? projMeta.aspect_ratio
    : baseProject?.project?.aspect_ratio || '9:16';

  const style: VideoStyle = VALID_STYLES.includes(projMeta.style)
    ? projMeta.style
    : baseProject?.project?.style || 'stickman';

  const scenes: Scene[] = (data.scenes || []).map((s: any, idx: number) => {
    const dur = Number(s.duration) > 0 ? Number(s.duration) : 6;
    const anim: AnimationEffect = VALID_ANIMATIONS.includes(s.animation) ? s.animation : 'slow_zoom_in';
    const trans: TransitionEffect = VALID_TRANSITIONS.includes(s.transition) ? s.transition : 'crossfade';

    return {
      id: s.id || idx + 1,
      duration: dur,
      narration: String(s.narration || '').trim(),
      image_prompt: String(s.image_prompt || '').trim(),
      on_screen_text: s.on_screen_text ? String(s.on_screen_text).trim() : undefined,
      animation: anim,
      transition: trans,
      imageUrl: s.imageUrl,
      audioUrl: s.audioUrl,
    };
  });

  const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);

  const resolution =
    aspectRatio === '9:16'
      ? '1080x1920'
      : aspectRatio === '16:9'
      ? '1920x1080'
      : aspectRatio === '1:1'
      ? '1080x1080'
      : '1080x1350';

  const now = new Date().toISOString();

  return {
    id: baseProject?.id || `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: baseProject?.createdAt || now,
    updatedAt: now,
    status: 'ready',
    originalTopic: baseProject?.originalTopic || projMeta.title || 'Untitled Project',
    project: {
      title: projMeta.title || baseProject?.project?.title || 'Untitled Video',
      description: projMeta.description || '',
      aspect_ratio: aspectRatio,
      resolution,
      fps: projMeta.fps || 30,
      style,
      customStylePrompt: projMeta.customStylePrompt,
      language: projMeta.language || baseProject?.project?.language || 'English',
      total_duration: totalDuration,
      voiceId: baseProject?.project?.voiceId || 'female_educational',
      musicTrackId: baseProject?.project?.musicTrackId || 'track_lofi_focus',
      musicVolume: baseProject?.project?.musicVolume ?? 0.25,
      voiceVolume: baseProject?.project?.voiceVolume ?? 1.0,
    },
    scenes,
    captions: baseProject?.captions || {
      enabled: true,
      style: 'KARAOKE',
      fontSize: 'lg',
      position: 'bottom',
      textColor: '#ffffff',
      highlightColor: '#facc15', // Vibrant yellow highlight
      backgroundColor: 'rgba(0,0,0,0.7)',
      maxWordsPerLine: 5,
    },
  };
}
