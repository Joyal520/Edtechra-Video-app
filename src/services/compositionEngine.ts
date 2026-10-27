import {
  VideoProject,
  Scene,
  AnimationEffect,
  TransitionEffect,
  GlitchEffect,
} from '../types/video';
import { MUSIC_TRACKS } from './musicService';

export interface TimelineSegment {
  index: number;
  scene: Scene;
  start: number;
  end: number;
  duration: number;
  transitionType: TransitionEffect;
  transitionDuration: number;
  animationType: AnimationEffect;
  glitchEffect: GlitchEffect;
}

export interface MasterTimeline {
  totalDuration: number;
  transitionDuration: number;
  segments: TimelineSegment[];
}

export interface FrameState {
  activeSegment: TimelineSegment;
  prevSegment: TimelineSegment | null;
  activeProgress: number;
  prevProgress: number;
  isTransitioning: boolean;
  transitionProgress: number;
  glitchIntensity: number; // 0.0 to 1.0 when an intentional story glitch is active
}

export interface CameraTransform {
  scale: number;
  txPercent: number;
  tyPercent: number;
  rotateDeg: number;
}

// Known calibrated voiceover audio durations (in seconds) for existing assets
const KNOWN_VOICE_DURATIONS: Record<string, number> = {
  'voice_0e9dd556aaacb4468bc239e26660d8b0.mp3': 6.46,
  'voice_618d84f5e8be7b0436b8833f5de2bc47.mp3': 5.30,
  'voice_400691df7b30d0d2d6ce723f525751a5.mp3': 5.06,
  'voice_21252186ddb06b53da3c2a27120bd93c.mp3': 5.78,
  'voice_41f08e91a9cfbbfd845870c4127563b7.mp3': 4.99,
  'mothman_voice_1.mp3': 12.00,
  'mothman_voice_2.mp3': 10.51,
  'mothman_voice_3.mp3': 9.70,
  'mothman_voice_4.mp3': 12.34,
  'mothman_voice_5.mp3': 10.90,
};

// High-impact keywords that receive visual emphasis in creepy/story captions
const EMPHASIS_KEYWORDS = new Set([
  '1966',
  '1967',
  'STRANGE',
  'DARK',
  'FIGURE',
  'RED',
  'EYES',
  'WINGS',
  'TERRIFIED',
  'CREATURE',
  'HUMAN',
  'DARKNESS',
  'MOTHMAN',
  'WARNING',
  'TERRIBLE',
  'AFRAID',
  'DECEMBER',
  'SILVER',
  'BRIDGE',
  'COLLAPSED',
  'FORTY-SIX',
  '46',
  'DIED',
  'DISASTER',
  'MYSTERY',
  'WATCHING',
]);

export function getCalibratedSceneDuration(scene: Scene): number {
  let dur = scene.duration || 5.5;
  if (scene.audioDuration && scene.audioDuration > 0) {
    dur = Math.max(dur, Number((scene.audioDuration + 0.25).toFixed(2)));
  }
  if (scene.audioUrl) {
    for (const [filename, knownDur] of Object.entries(KNOWN_VOICE_DURATIONS)) {
      if (scene.audioUrl.includes(filename)) {
        dur = Math.max(dur, Number((knownDur + 0.18).toFixed(1)));
        break;
      }
    }
  }
  return Math.max(2.5, dur);
}

/**
 * Compute intentional story-driven glitch intensity (0.0 -> 1.0) at a given scene progress.
 * Glitches only fire briefly at key narrative moments — never continuously.
 */
export function computeStoryGlitchIntensity(
  sceneIndex: number,
  glitchEffect: GlitchEffect | undefined,
  progress: number,
  isTransitioning: boolean,
  transitionType: TransitionEffect
): number {
  if (isTransitioning && transitionType === 'glitch') {
    return 0.85;
  }
  if (!glitchEffect || glitchEffect === 'none') return 0;

  // Story-calibrated glitch windows per scene:
  // Scene 1: Brief glitch when the tall dark figure / red eyes appear (~0.56 - 0.67)
  // Scene 2: Small glitch around "red eyes seemed to shine in the darkness" (~0.46 - 0.57)
  // Scene 3: Signal distortion when the name "Mothman" appears (~0.25 - 0.37)
  // Scene 4: Dramatic glitch around Silver Bridge collapse / 46 people (~0.28 - 0.44)
  // Scene 5: Final glitch/flicker before the ending (~0.83 - 0.96)
  const windows: Array<[number, number, number]> =
    sceneIndex === 0
      ? [[0.56, 0.67, 0.75]]
      : sceneIndex === 1
      ? [[0.46, 0.57, 0.65]]
      : sceneIndex === 2
      ? [[0.25, 0.37, 0.8]]
      : sceneIndex === 3
      ? [
          [0.28, 0.43, 0.95],
          [0.82, 0.90, 0.6],
        ]
      : [
          [0.35, 0.43, 0.55],
          [0.83, 0.96, 0.9],
        ];

  for (const [startP, endP, peak] of windows) {
    if (progress >= startP && progress <= endP) {
      const mid = (startP + endP) / 2;
      const half = (endP - startP) / 2;
      const dist = Math.abs(progress - mid) / half;
      return Math.max(0, (1 - dist * dist) * peak);
    }
  }
  return 0;
}

/**
 * Single Source of Truth: Build the continuous Master Timeline for a project.
 */
export function buildMasterTimeline(project: VideoProject): MasterTimeline {
  const transitionDuration = 0.48; // 480ms cinematic transition overlap
  const segments: TimelineSegment[] = [];
  let accumulated = 0;

  for (let i = 0; i < project.scenes.length; i++) {
    const sc = project.scenes[i];
    const duration = getCalibratedSceneDuration(sc);
    const start = Number(accumulated.toFixed(3));
    const end = Number((accumulated + duration).toFixed(3));

    segments.push({
      index: i,
      scene: sc,
      start,
      end,
      duration,
      transitionType: sc.transition || 'crossfade',
      transitionDuration: i === 0 ? 0 : Math.min(transitionDuration, duration * 0.25),
      animationType: sc.animation || 'slow_zoom_in',
      glitchEffect: sc.glitchEffect || 'none',
    });

    accumulated += duration;
  }

  const totalDuration = Number(accumulated.toFixed(3));
  return {
    totalDuration,
    transitionDuration,
    segments,
  };
}

/**
 * Evaluate exact visual state at any timestamp `t` on the Master Timeline.
 */
export function getFrameStateAtTime(timeline: MasterTimeline, currentTime: number): FrameState {
  const clampedTime = Math.max(0, Math.min(timeline.totalDuration, currentTime));
  const segments = timeline.segments;

  if (segments.length === 0) {
    throw new Error('Timeline has no segments');
  }

  const activeSegment =
    segments.find((s) => clampedTime >= s.start && clampedTime < s.end) ||
    segments[segments.length - 1];

  const timeInScene = Math.max(0, clampedTime - activeSegment.start);
  const activeProgress = Math.min(1, Math.max(0, timeInScene / activeSegment.duration));

  const transDur = activeSegment.transitionDuration;
  const isTransitioning = activeSegment.index > 0 && transDur > 0 && timeInScene < transDur;

  let prevSegment: TimelineSegment | null = null;
  let transitionProgress = 1;
  let prevProgress = 1;

  if (isTransitioning) {
    prevSegment = segments[activeSegment.index - 1];
    const rawT = Math.min(1, Math.max(0, timeInScene / transDur));
    transitionProgress = rawT < 0.5 ? 4 * rawT * rawT * rawT : 1 - Math.pow(-2 * rawT + 2, 3) / 2;
    prevProgress = 1.0 + (timeInScene / prevSegment.duration) * 0.8;
  }

  const glitchIntensity = computeStoryGlitchIntensity(
    activeSegment.index,
    activeSegment.glitchEffect,
    activeProgress,
    isTransitioning,
    activeSegment.transitionType
  );

  return {
    activeSegment,
    prevSegment,
    activeProgress,
    prevProgress,
    isTransitioning,
    transitionProgress,
    glitchIntensity,
  };
}

/**
 * Compute subtle, cinematic camera movement for a given scene progress (0.0 -> 1.0).
 */
export function computeCameraTransform(
  anim: AnimationEffect,
  progress: number
): CameraTransform {
  const p = Math.max(0, Math.min(1.15, progress));

  switch (anim) {
    case 'slow_zoom_in':
      return {
        scale: 1.0 + p * 0.095,
        txPercent: 0,
        tyPercent: -p * 1.4,
        rotateDeg: 0,
      };
    case 'slow_zoom_out':
      return {
        scale: 1.095 - Math.min(1, p) * 0.085,
        txPercent: 0,
        tyPercent: (1 - Math.min(1, p)) * -1.2,
        rotateDeg: 0,
      };
    case 'pan_left':
      return {
        scale: 1.08,
        txPercent: 2.6 - p * 5.2,
        tyPercent: 0,
        rotateDeg: 0,
      };
    case 'pan_right':
      return {
        scale: 1.08,
        txPercent: -2.6 + p * 5.2,
        tyPercent: 0,
        rotateDeg: 0,
      };
    case 'pan_up':
      return {
        scale: 1.08,
        txPercent: 0,
        tyPercent: 2.5 - p * 5.0,
        rotateDeg: 0,
      };
    case 'pan_down':
      return {
        scale: 1.08,
        txPercent: 0,
        tyPercent: -2.5 + p * 5.0,
        rotateDeg: 0,
      };
    case 'ken_burns':
      return {
        scale: 1.02 + p * 0.09,
        txPercent: -1.4 + p * 2.8,
        tyPercent: 1.2 - p * 2.4,
        rotateDeg: 0,
      };
    case 'parallax':
      return {
        scale: 1.03 + p * 0.08,
        txPercent: -1.5 + p * 3.0,
        tyPercent: -p * 1.8,
        rotateDeg: 0,
      };
    case 'floating':
      return {
        scale: 1.04 + Math.sin(p * Math.PI) * 0.025,
        txPercent: Math.cos(p * Math.PI * 2) * 0.9,
        tyPercent: Math.sin(p * Math.PI * 2) * 1.4,
        rotateDeg: 0,
      };
    case 'bounce':
      return {
        scale: 1.02 + Math.abs(Math.sin(p * Math.PI * 2)) * 0.04,
        txPercent: 0,
        tyPercent: 0,
        rotateDeg: 0,
      };
    case 'shake':
      return {
        scale: 1.04,
        txPercent: Math.sin(p * Math.PI * 6) * 0.8,
        tyPercent: Math.cos(p * Math.PI * 6) * 0.6,
        rotateDeg: 0,
      };
    case 'none':
    default:
      return {
        scale: 1.0,
        txPercent: 0,
        tyPercent: 0,
        rotateDeg: 0,
      };
  }
}

/**
 * Draw a single scene image with 3-layer subtle parallax depth (Background, Midground Subject, Foreground Fog/Dust).
 */
function drawSceneVisualLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: Scene,
  img: HTMLImageElement | undefined,
  animProgress: number,
  alpha: number,
  isCreepyStyle: boolean,
  offsetX: number = 0,
  offsetY: number = 0,
  extraScale: number = 1.0
) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

  if (offsetX !== 0 || offsetY !== 0) {
    ctx.translate(offsetX, offsetY);
  }

  if (img && img.complete && img.naturalWidth > 0) {
    const cam = computeCameraTransform(scene.animation || 'slow_zoom_in', animProgress);
    const totalScale = cam.scale * extraScale;
    const txPx = (cam.txPercent / 100) * width;
    const tyPx = (cam.tyPercent / 100) * height;

    const imgAspect = img.naturalWidth / img.naturalHeight;
    const canvasAspect = width / height;
    let drawW = width;
    let drawH = height;
    let drawX = 0;
    let drawY = 0;

    if (scene.cropMode === 'contain') {
      if (imgAspect > canvasAspect) {
        drawW = width;
        drawH = width / imgAspect;
        drawY = (height - drawH) / 2;
      } else {
        drawH = height;
        drawW = height * imgAspect;
        drawX = (width - drawW) / 2;
      }
    } else {
      if (imgAspect > canvasAspect) {
        drawH = height;
        drawW = height * imgAspect;
        drawX = (width - drawW) / 2;
      } else {
        drawW = width;
        drawH = width / imgAspect;
        drawY = (height - drawH) / 2;
      }
    }

    // Layer 1 (Background Depth Layer — slower movement)
    ctx.save();
    ctx.translate(width / 2 + txPx * 0.45, height / 2 + tyPx * 0.45);
    ctx.scale(totalScale * 1.04, totalScale * 1.04);
    ctx.translate(-width / 2, -height / 2);
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();

    // Layer 2 (Midground Subject Layer — main camera speed)
    ctx.save();
    ctx.translate(width / 2 + txPx, height / 2 + tyPx);
    if (cam.rotateDeg !== 0) {
      ctx.rotate((cam.rotateDeg * Math.PI) / 180);
    }
    ctx.scale(totalScale, totalScale);
    ctx.translate(-width / 2, -height / 2);
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();

    // Layer 3 (Foreground Parallax Atmosphere — faster movement for depth)
    if (isCreepyStyle || (scene.parallaxIntensity && scene.parallaxIntensity > 0)) {
      const fgTx = txPx * 1.75 + (animProgress - 0.5) * width * 0.06;
      const fgTy = tyPx * 1.45;

      ctx.save();
      // Drifting volumetric fog bands in foreground
      const fogGrad1 = ctx.createRadialGradient(
        width * 0.35 + fgTx,
        height * 0.65 + fgTy,
        width * 0.05,
        width * 0.35 + fgTx,
        height * 0.65 + fgTy,
        width * 0.65
      );
      fogGrad1.addColorStop(0, 'rgba(148, 163, 184, 0.14)');
      fogGrad1.addColorStop(0.6, 'rgba(71, 85, 105, 0.06)');
      fogGrad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = fogGrad1;
      ctx.fillRect(0, 0, width, height);

      const fogGrad2 = ctx.createRadialGradient(
        width * 0.7 - fgTx * 1.1,
        height * 0.38 - fgTy,
        width * 0.04,
        width * 0.7 - fgTx * 1.1,
        height * 0.38 - fgTy,
        width * 0.55
      );
      fogGrad2.addColorStop(0, 'rgba(220, 38, 38, 0.07)'); // subtle eerie crimson mist
      fogGrad2.addColorStop(0.5, 'rgba(30, 41, 59, 0.08)');
      fogGrad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = fogGrad2;
      ctx.fillRect(0, 0, width, height);

      // Subtle foreground dust motes drifting across lens
      for (let m = 0; m < 14; m++) {
        const seed = (scene.id * 37 + m * 73) % 100;
        const baseX = ((seed * 13) % 100) / 100;
        const baseY = ((seed * 29) % 100) / 100;
        const px =
          ((baseX * width + fgTx * (1.2 + (m % 3) * 0.4) + animProgress * 55) % width + width) %
          width;
        const py =
          ((baseY * height + fgTy - animProgress * (30 + (m % 4) * 12)) % height + height) %
          height;
        const radius = (1.5 + (m % 3) * 1.2) * (width / 1080);

        ctx.fillStyle =
          m % 5 === 0 ? 'rgba(248, 113, 113, 0.25)' : 'rgba(226, 232, 240, 0.18)';
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cinematic dark vignette around edges
      const vig = ctx.createRadialGradient(
        width / 2,
        height * 0.45,
        width * 0.28,
        width / 2,
        height * 0.5,
        height * 0.68
      );
      vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vig.addColorStop(0.75, 'rgba(2, 6, 23, 0.28)');
      vig.addColorStop(1, 'rgba(0, 0, 0, 0.72)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  } else {
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();
}

/**
 * Render tasteful creepy glitch effects (RGB split, VHS scanlines, horizontal slice displacement, static flicker)
 * when `glitchIntensity > 0`.
 */
function renderGlitchEffects(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  intensity: number,
  currentTime: number
) {
  if (intensity <= 0.02) return;

  ctx.save();
  const scaleFactor = width / 1080;
  const shiftPx = Math.round(intensity * 18 * scaleFactor * Math.sin(currentTime * 65));

  // 1. Horizontal slice displacement (VHS tracking tear)
  const sliceCount = Math.ceil(intensity * 5);
  for (let s = 0; s < sliceCount; s++) {
    const sliceSeed = Math.sin(currentTime * 43 + s * 19);
    const sliceY = Math.max(0, Math.min(height - 40, Math.floor(((sliceSeed + 1) * 0.5) * height)));
    const sliceH = Math.floor((14 + (s % 3) * 18) * scaleFactor);
    const offset = Math.round(sliceSeed * intensity * 28 * scaleFactor);
    try {
      ctx.drawImage(canvas, 0, sliceY, width, sliceH, offset, sliceY, width, sliceH);
    } catch {
      // ignore if tainted
    }
  }

  // 2. RGB Chromatic Tint Split bars
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = `rgba(239, 68, 68, ${(intensity * 0.22).toFixed(3)})`;
  ctx.fillRect(Math.max(0, shiftPx), 0, width, height);

  ctx.fillStyle = `rgba(6, 182, 212, ${(intensity * 0.16).toFixed(3)})`;
  ctx.fillRect(Math.max(0, -shiftPx), 0, width, height);
  ctx.globalCompositeOperation = 'source-over';

  // 3. CRT / VHS Scanlines
  ctx.fillStyle = `rgba(0, 0, 0, ${(intensity * 0.32).toFixed(3)})`;
  const lineStep = Math.max(4, Math.round(6 * scaleFactor));
  for (let y = 0; y < height; y += lineStep) {
    ctx.fillRect(0, y, width, Math.max(1, Math.round(2 * scaleFactor)));
  }

  // 4. Brief static interference lines
  ctx.fillStyle = `rgba(255, 255, 255, ${(intensity * 0.25).toFixed(3)})`;
  for (let b = 0; b < 3; b++) {
    const barY = ((currentTime * 900 + b * 410) % height);
    ctx.fillRect(0, barY, width, Math.round(3 * scaleFactor));
  }

  ctx.restore();
}

/**
 * Split a scene's narration into punchy 2-4 word YouTube Shorts phrases.
 */
export function splitNarrationIntoPhrases(narration: string, maxWords = 4): string[][] {
  const rawWords = narration.trim().split(/\s+/).filter(Boolean);
  if (rawWords.length === 0) return [];

  const phrases: string[][] = [];
  let current: string[] = [];

  for (const word of rawWords) {
    current.push(word);
    const endsSentence = /[.!?,;:]$/.test(word);
    if (current.length >= maxWords || (endsSentence && current.length >= 2)) {
      phrases.push(current);
      current = [];
    }
  }
  if (current.length > 0) {
    phrases.push(current);
  }
  return phrases;
}

/**
 * Check if a word is an important story keyword that should receive stronger visual emphasis.
 */
export function isEmphasizedWord(word: string): boolean {
  const cleaned = word.toUpperCase().replace(/[^A-Z0-9-]/g, '');
  return EMPHASIS_KEYWORDS.has(cleaned);
}

/**
 * Render the exact Master Composition Frame at `currentTime` onto a 2D Canvas.
 * Shared by both the Browser Preview Player and the Video Renderer.
 */
export function renderMasterFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  currentTime: number,
  timeline: MasterTimeline,
  imageMap: Map<number, HTMLImageElement>,
  project: VideoProject
) {
  const state = getFrameStateAtTime(timeline, currentTime);
  const {
    activeSegment,
    prevSegment,
    activeProgress,
    prevProgress,
    isTransitioning,
    transitionProgress,
    glitchIntensity,
  } = state;

  const isCreepyStyle =
    project.project.style === 'creepy_legend' ||
    project.project.style === 'cinematic' ||
    project.id.includes('mothman');

  // 1. Clear Studio Canvas
  ctx.fillStyle = '#050508';
  ctx.fillRect(0, 0, width, height);

  const activeImg = imageMap.get(activeSegment.scene.id);
  const prevImg = prevSegment ? imageMap.get(prevSegment.scene.id) : undefined;

  // 2. Render Visual Scene(s) with 3-Layer Parallax, Camera Animations & Smooth Transitions
  if (isTransitioning && prevSegment) {
    const t = transitionProgress;
    const trans = activeSegment.transitionType;

    if (trans === 'slide_left') {
      drawSceneVisualLayer(
        ctx,
        width,
        height,
        prevSegment.scene,
        prevImg,
        prevProgress,
        1 - t * 0.4,
        isCreepyStyle,
        -t * width * 0.35,
        0,
        1.0
      );
      drawSceneVisualLayer(
        ctx,
        width,
        height,
        activeSegment.scene,
        activeImg,
        activeProgress,
        1.0,
        isCreepyStyle,
        (1 - t) * width,
        0,
        1.0
      );
    } else if (trans === 'slide_right') {
      drawSceneVisualLayer(
        ctx,
        width,
        height,
        prevSegment.scene,
        prevImg,
        prevProgress,
        1 - t * 0.4,
        isCreepyStyle,
        t * width * 0.35,
        0,
        1.0
      );
      drawSceneVisualLayer(
        ctx,
        width,
        height,
        activeSegment.scene,
        activeImg,
        activeProgress,
        1.0,
        isCreepyStyle,
        -(1 - t) * width,
        0,
        1.0
      );
    } else if (trans === 'dark_fade') {
      // Smooth dip through deep shadow
      if (t < 0.5) {
        drawSceneVisualLayer(
          ctx,
          width,
          height,
          prevSegment.scene,
          prevImg,
          prevProgress,
          1 - t * 2,
          isCreepyStyle
        );
      } else {
        drawSceneVisualLayer(
          ctx,
          width,
          height,
          activeSegment.scene,
          activeImg,
          activeProgress,
          (t - 0.5) * 2,
          isCreepyStyle
        );
      }
    } else if (trans === 'zoom') {
      drawSceneVisualLayer(
        ctx,
        width,
        height,
        prevSegment.scene,
        prevImg,
        prevProgress,
        1 - t,
        isCreepyStyle,
        0,
        0,
        1.0 + t * 0.12
      );
      drawSceneVisualLayer(
        ctx,
        width,
        height,
        activeSegment.scene,
        activeImg,
        activeProgress,
        t,
        isCreepyStyle,
        0,
        0,
        0.92 + t * 0.08
      );
    } else {
      // Crossfade / Film Dissolve / Glitch Dissolve
      drawSceneVisualLayer(
        ctx,
        width,
        height,
        prevSegment.scene,
        prevImg,
        prevProgress,
        1.0,
        isCreepyStyle
      );
      drawSceneVisualLayer(
        ctx,
        width,
        height,
        activeSegment.scene,
        activeImg,
        activeProgress,
        t,
        isCreepyStyle
      );
    }
  } else {
    drawSceneVisualLayer(
      ctx,
      width,
      height,
      activeSegment.scene,
      activeImg,
      activeProgress,
      1.0,
      isCreepyStyle
    );
  }

  // 3. Apply Intentional Story-Driven Glitch Effects
  if (glitchIntensity > 0.02 && ctx.canvas) {
    renderGlitchEffects(ctx, ctx.canvas, width, height, glitchIntensity, currentTime);
  }

  // 4. Subtle Bottom Gradient for Mobile Caption Legibility (Safe Area)
  const bottomGrad = ctx.createLinearGradient(0, height * 0.65, 0, height);
  bottomGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  bottomGrad.addColorStop(0.55, 'rgba(0, 0, 0, 0.42)');
  bottomGrad.addColorStop(1, 'rgba(0, 0, 0, 0.78)');
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, height * 0.65, width, height * 0.35);

  // 5. Modern YouTube Shorts Phrase-by-Phrase Animated Captions inside Mobile Safe Area
  const { captions } = project;
  const activeScene = activeSegment.scene;
  if (captions.enabled && activeScene.narration) {
    const maxWords = Math.min(4, captions.maxWordsPerLine || 4);
    const phrases = splitNarrationIntoPhrases(activeScene.narration, maxWords);

    if (phrases.length > 0) {
      const totalWords = phrases.reduce((acc, p) => acc + p.length, 0);
      const speechRatio = Math.min(0.999, Math.max(0, activeProgress / 0.94));
      const globalWordFloat = speechRatio * totalWords;
      const activeGlobalWordIdx = Math.min(totalWords - 1, Math.floor(globalWordFloat));

      // Locate active phrase and word within phrase
      let wordAccum = 0;
      let activePhrase = phrases[0];
      let phraseStartWordIdx = 0;
      for (const p of phrases) {
        if (activeGlobalWordIdx < wordAccum + p.length) {
          activePhrase = p;
          phraseStartWordIdx = wordAccum;
          break;
        }
        wordAccum += p.length;
      }

      // Phrase entrance pop/scale animation
      const phraseProgress =
        (globalWordFloat - phraseStartWordIdx) / Math.max(1, activePhrase.length);
      const popScale =
        phraseProgress < 0.12
          ? 0.9 + (phraseProgress / 0.12) * 0.14
          : phraseProgress < 0.24
          ? 1.04 - ((phraseProgress - 0.12) / 0.12) * 0.04
          : 1.0;

      const scaleFactor = width / 1080;
      const baseFontPx =
        captions.fontSize === 'xl'
          ? 60
          : captions.fontSize === 'lg'
          ? 52
          : captions.fontSize === 'sm'
          ? 38
          : 44;
      const fontPx = Math.round(baseFontPx * scaleFactor);

      const captionY =
        captions.position === 'top'
          ? height * 0.18
          : captions.position === 'center'
          ? height * 0.54
          : height * 0.79; // Safe area: above YouTube Shorts UI & below creature's face

      ctx.save();
      // Slight caption glitch jitter if story glitch is active
      const jitterX =
        glitchIntensity > 0.2 ? Math.sin(currentTime * 90) * 6 * scaleFactor : 0;
      const jitterY =
        glitchIntensity > 0.2 ? Math.cos(currentTime * 75) * 3 * scaleFactor : 0;

      ctx.translate(width / 2 + jitterX, captionY + jitterY);
      ctx.scale(popScale, popScale);
      ctx.translate(-width / 2, -captionY);

      ctx.font = `900 ${fontPx}px "Inter", "Impact", "Segoe UI", Arial, sans-serif`;
      ctx.textBaseline = 'middle';

      const displayWords = activePhrase.map((w) => w.toUpperCase());
      const spaceWidth = ctx.measureText(' ').width * 1.25;
      const wordMetrics = displayWords.map((w) => ctx.measureText(w).width);
      const totalLineWidth =
        wordMetrics.reduce((a, b) => a + b, 0) +
        Math.max(0, displayWords.length - 1) * spaceWidth;

      const padX = Math.round(34 * scaleFactor);
      const padY = Math.round(22 * scaleFactor);
      const pillW = Math.min(width * 0.92, totalLineWidth + padX * 2);
      const pillH = fontPx + padY * 2;
      const pillX = (width - pillW) / 2;
      const pillY = captionY - pillH / 2;

      // Dark High-Contrast Pill Background
      ctx.fillStyle = 'rgba(6, 6, 10, 0.84)';
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, Math.round(20 * scaleFactor));
      ctx.fill();

      ctx.strokeStyle =
        glitchIntensity > 0.2
          ? 'rgba(239, 68, 68, 0.65)'
          : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = Math.max(1.5, Math.round(2.5 * scaleFactor));
      ctx.stroke();

      // Draw each word with Karaoke + Keyword Emphasis
      let cursorX = (width - totalLineWidth) / 2;
      for (let i = 0; i < displayWords.length; i++) {
        const word = displayWords[i];
        const wWidth = wordMetrics[i];
        const globalIdx = phraseStartWordIdx + i;
        const isCurrent = globalIdx === activeGlobalWordIdx;
        const isPassed = globalIdx < activeGlobalWordIdx;
        const isKeyword = isEmphasizedWord(word);

        ctx.save();
        ctx.textAlign = 'left';

        // Heavy black outline for YouTube Shorts readability
        ctx.lineJoin = 'round';
        ctx.lineWidth = Math.max(4, Math.round(8 * scaleFactor));
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.strokeText(word, cursorX, captionY);

        if (isCurrent) {
          ctx.fillStyle =
            isKeyword && isCreepyStyle
              ? '#ef4444'
              : captions.highlightColor || '#facc15';
          ctx.shadowColor =
            isKeyword && isCreepyStyle
              ? 'rgba(239, 68, 68, 0.85)'
              : 'rgba(250, 204, 21, 0.75)';
          ctx.shadowBlur = Math.round(16 * scaleFactor);
        } else if (isKeyword && isPassed) {
          ctx.fillStyle = isCreepyStyle ? '#fca5a5' : '#fde047';
        } else if (isPassed) {
          ctx.fillStyle = '#ffffff';
        } else {
          ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
        }

        ctx.fillText(word, cursorX, captionY);
        ctx.restore();

        cursorX += wWidth + spaceWidth;
      }

      ctx.restore();
    }
  }
}

/**
 * Convert an AudioBuffer to an in-memory 16-bit PCM WAV Blob.
 */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new ArrayBuffer(length);
  const view = new DataView(out);
  const channels: Float32Array[] = [];
  let sample = 0;
  let offset = 0;
  let pos = 0;

  const setUint16 = (data: number) => {
    view.setUint16(pos, data, true);
    pos += 2;
  };
  const setUint32 = (data: number) => {
    view.setUint32(pos, data, true);
    pos += 4;
  };

  setUint32(0x46464952);
  setUint32(length - 8);
  setUint32(0x45564157);
  setUint32(0x20746d66);
  setUint32(16);
  setUint16(1);
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);
  setUint32(0x61746164);
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out], { type: 'audio/wav' });
}

const decodedBufferCache = new Map<string, AudioBuffer>();

async function fetchAndDecodeAudio(
  url: string,
  decodeCtx: BaseAudioContext
): Promise<AudioBuffer | null> {
  if (!url) return null;
  if (decodedBufferCache.has(url)) {
    return decodedBufferCache.get(url)!;
  }

  const clean = url.replace(/^(\.\/|\/)/, '');
  const candidates = [url, `./${clean}`, `/${clean}`];

  for (const candidate of candidates) {
    try {
      const res = await fetch(candidate);
      if (!res.ok) continue;
      const arrayBuf = await res.arrayBuffer();
      const decoded = await decodeCtx.decodeAudioData(arrayBuf.slice(0));
      decodedBufferCache.set(url, decoded);
      return decoded;
    } catch {
      // try next candidate
    }
  }
  return null;
}

/**
 * Build ONE Continuous Master Audio Track combining 3 Professional Audio Stems:
 * 1. VOICEOVER TRACK (Dominant, continuous across all 5 scenes)
 * 2. BACKGROUND MUSIC TRACK (ONE continuous track from 0s to end, ducked under voice, never restarting)
 * 3. SOUND EFFECTS (SFX) TRACK (Subtle atmospheric booms, wind, static, and bridge rumble at scene cues)
 */
export async function buildMasterAudioTrack(
  project: VideoProject,
  timeline: MasterTimeline
): Promise<{ audioBuffer: AudioBuffer; wavBlobUrl: string; duration: number } | null> {
  if (typeof window === 'undefined') return null;

  const OfflineCtx =
    window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
  if (!OfflineCtx) return null;

  const sampleRate = 44100;
  const totalDuration = Math.max(1, timeline.totalDuration);
  const totalFrames = Math.ceil(totalDuration * sampleRate);
  const offlineCtx: OfflineAudioContext = new OfflineCtx(2, totalFrames, sampleRate);

  const voiceVol = project.project.voiceVolume ?? 1.0;
  const musicVol = project.project.musicVolume ?? 0.22;
  const sfxMasterVol = project.project.sfxVolume ?? 0.38;

  // 1. Schedule all Scene Voiceovers sequentially on the Master Timeline
  const voiceWindows: Array<{ start: number; end: number }> = [];

  for (const seg of timeline.segments) {
    if (seg.scene.audioUrl) {
      const voiceBuf = await fetchAndDecodeAudio(seg.scene.audioUrl, offlineCtx);
      if (voiceBuf) {
        const src = offlineCtx.createBufferSource();
        src.buffer = voiceBuf;

        const gainNode = offlineCtx.createGain();
        gainNode.gain.setValueAtTime(Math.min(1.6, voiceVol * 1.25), seg.start);

        src.connect(gainNode);
        gainNode.connect(offlineCtx.destination);
        src.start(seg.start);

        voiceWindows.push({
          start: seg.start,
          end: Math.min(seg.end, seg.start + voiceBuf.duration),
        });
      }
    }

    // 2. Schedule Scene SFX Stem if configured
    if (seg.scene.sfxUrl && sfxMasterVol > 0) {
      const sfxBuf = await fetchAndDecodeAudio(seg.scene.sfxUrl, offlineCtx);
      if (sfxBuf) {
        const sfxSrc = offlineCtx.createBufferSource();
        sfxSrc.buffer = sfxBuf;

        const sfxGain = offlineCtx.createGain();
        sfxGain.gain.setValueAtTime(sfxMasterVol * 0.85, seg.start);

        sfxSrc.connect(sfxGain);
        sfxGain.connect(offlineCtx.destination);
        sfxSrc.start(seg.start);
      }
    }
  }

  // 3. Schedule ONE Continuous Background Music Track from 0.0s to totalDuration
  const selectedTrack =
    MUSIC_TRACKS.find((t) => t.id === project.project.musicTrackId) ||
    MUSIC_TRACKS[0];

  if (selectedTrack?.audioUrl && musicVol > 0) {
    const bgmBuf = await fetchAndDecodeAudio(selectedTrack.audioUrl, offlineCtx);
    if (bgmBuf) {
      const bgmSrc = offlineCtx.createBufferSource();
      bgmSrc.buffer = bgmBuf;
      bgmSrc.loop = true;

      const bgmGain = offlineCtx.createGain();
      const baseBgmGain = musicVol * 0.9;
      const duckedBgmGain = musicVol * 0.36;

      // Smooth fade-in at 0s
      bgmGain.gain.setValueAtTime(0.001, 0);
      bgmGain.gain.linearRampToValueAtTime(
        voiceWindows.length > 0 ? duckedBgmGain : baseBgmGain,
        Math.min(0.8, totalDuration * 0.1)
      );

      // Duck during voiceover and swell gently in dramatic pauses between scenes
      for (const win of voiceWindows) {
        const duckStart = Math.max(0.8, win.start);
        bgmGain.gain.setValueAtTime(duckedBgmGain, duckStart);
        if (win.end < totalDuration - 2.0) {
          bgmGain.gain.setValueAtTime(duckedBgmGain, win.end);
          bgmGain.gain.linearRampToValueAtTime(
            baseBgmGain * 0.72,
            Math.min(totalDuration - 2.0, win.end + 0.25)
          );
        }
      }

      // Smooth fade-out at end of master timeline
      const fadeOutStart = Math.max(1.0, totalDuration - 1.8);
      bgmGain.gain.setValueAtTime(duckedBgmGain, fadeOutStart);
      bgmGain.gain.linearRampToValueAtTime(0.0001, totalDuration);

      bgmSrc.connect(bgmGain);
      bgmGain.connect(offlineCtx.destination);
      bgmSrc.start(0);
      bgmSrc.stop(totalDuration);
    }
  }

  const renderedBuffer = await offlineCtx.startRendering();
  const wavBlob = audioBufferToWavBlob(renderedBuffer);
  const wavBlobUrl = URL.createObjectURL(wavBlob);

  return {
    audioBuffer: renderedBuffer,
    wavBlobUrl,
    duration: totalDuration,
  };
}
