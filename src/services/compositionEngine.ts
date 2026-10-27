import {
  VideoProject,
  Scene,
  AnimationEffect,
  TransitionEffect,
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
};

export function getCalibratedSceneDuration(scene: Scene): number {
  let dur = scene.duration || 5.5;
  if (scene.audioDuration && scene.audioDuration > 0) {
    dur = Math.max(dur, Number((scene.audioDuration + 0.15).toFixed(2)));
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
 * Single Source of Truth: Build the continuous Master Timeline for a project.
 */
export function buildMasterTimeline(project: VideoProject): MasterTimeline {
  const transitionDuration = 0.45; // 450ms professional transition overlap
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

  let activeSegment =
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
    // Smooth cubic ease-in-out for transitions
    transitionProgress = rawT < 0.5 ? 4 * rawT * rawT * rawT : 1 - Math.pow(-2 * rawT + 2, 3) / 2;
    // Outgoing scene continues its motion slightly past 1.0 during the overlap
    prevProgress = 1.0 + (timeInScene / prevSegment.duration) * 0.8;
  }

  return {
    activeSegment,
    prevSegment,
    activeProgress,
    prevProgress,
    isTransitioning,
    transitionProgress,
  };
}

/**
 * Compute subtle, cinematic camera movement for a given scene progress (0.0 -> 1.0).
 * Safe-area bounded so important characters and text in 9:16 illustrations are never cut off.
 */
export function computeCameraTransform(
  anim: AnimationEffect,
  progress: number
): CameraTransform {
  // Smooth ease-out curve for natural cinematic feel
  const p = Math.max(0, Math.min(1.15, progress));

  switch (anim) {
    case 'slow_zoom_in':
      return {
        scale: 1.0 + p * 0.085,
        txPercent: 0,
        tyPercent: -p * 1.2,
        rotateDeg: 0,
      };
    case 'slow_zoom_out':
      return {
        scale: 1.09 - Math.min(1, p) * 0.085,
        txPercent: 0,
        tyPercent: (1 - Math.min(1, p)) * -1.2,
        rotateDeg: 0,
      };
    case 'pan_left':
      return {
        scale: 1.07,
        txPercent: 2.5 - p * 5.0,
        tyPercent: 0,
        rotateDeg: 0,
      };
    case 'pan_right':
      return {
        scale: 1.07,
        txPercent: -2.5 + p * 5.0,
        tyPercent: 0,
        rotateDeg: 0,
      };
    case 'pan_up':
      return {
        scale: 1.07,
        txPercent: 0,
        tyPercent: 2.5 - p * 5.0,
        rotateDeg: 0,
      };
    case 'pan_down':
      return {
        scale: 1.07,
        txPercent: 0,
        tyPercent: -2.5 + p * 5.0,
        rotateDeg: 0,
      };
    case 'ken_burns':
      return {
        scale: 1.02 + p * 0.08,
        txPercent: -1.5 + p * 3.0,
        tyPercent: 1.0 - p * 2.0,
        rotateDeg: 0,
      };
    case 'floating':
      return {
        scale: 1.04 + Math.sin(p * Math.PI) * 0.02,
        txPercent: Math.cos(p * Math.PI * 2) * 0.8,
        tyPercent: Math.sin(p * Math.PI * 2) * 1.5,
        rotateDeg: 0,
      };
    case 'parallax':
      return {
        scale: 1.03 + p * 0.05,
        txPercent: -1.0 + p * 2.0,
        tyPercent: -p * 1.5,
        rotateDeg: Math.sin(p * Math.PI) * 0.6,
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
 * Draw a single scene image with its camera transform and optional transition transform onto a 2D Canvas.
 */
function drawSceneVisualLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: Scene,
  img: HTMLImageElement | undefined,
  animProgress: number,
  alpha: number,
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

    ctx.translate(width / 2 + txPx, height / 2 + tyPx);
    if (cam.rotateDeg !== 0) {
      ctx.rotate((cam.rotateDeg * Math.PI) / 180);
    }
    ctx.scale(totalScale, totalScale);
    ctx.translate(-width / 2, -height / 2);

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
      // Cover (preserves 9:16 vertical composition)
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

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  } else {
    // Fallback dark card
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();
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
  } = state;

  // 1. Clear Studio Canvas
  ctx.fillStyle = '#09090b';
  ctx.fillRect(0, 0, width, height);

  const activeImg = imageMap.get(activeSegment.scene.id);
  const prevImg = prevSegment ? imageMap.get(prevSegment.scene.id) : undefined;

  // 2. Render Visual Scene(s) with Camera Animations & Transitions
  if (isTransitioning && prevSegment) {
    const t = transitionProgress;
    const trans = activeSegment.transitionType;

    if (trans === 'slide_left') {
      // Outgoing scene slides slightly left & dims; incoming slides in from right
      drawSceneVisualLayer(
        ctx,
        width,
        height,
        prevSegment.scene,
        prevImg,
        prevProgress,
        1 - t * 0.4,
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
        -(1 - t) * width,
        0,
        1.0
      );
    } else if (trans === 'zoom') {
      // Soft zoom transition
      drawSceneVisualLayer(
        ctx,
        width,
        height,
        prevSegment.scene,
        prevImg,
        prevProgress,
        1 - t,
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
        0,
        0,
        0.92 + t * 0.08
      );
    } else {
      // Default: Crossfade / Smooth Dissolve
      drawSceneVisualLayer(
        ctx,
        width,
        height,
        prevSegment.scene,
        prevImg,
        prevProgress,
        1.0,
        0,
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
        t,
        0,
        0,
        1.0
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
      0,
      0,
      1.0
    );
  }

  // 3. Subtle Bottom Gradient for Mobile Caption Legibility (Safe Area)
  const bottomGrad = ctx.createLinearGradient(0, height * 0.68, 0, height);
  bottomGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  bottomGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.38)');
  bottomGrad.addColorStop(1, 'rgba(0, 0, 0, 0.72)');
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, height * 0.68, width, height * 0.32);

  // 4. Synchronized Captions inside Mobile Safe Area
  const { captions } = project;
  const activeScene = activeSegment.scene;
  if (captions.enabled && activeScene.narration) {
    const words = activeScene.narration.trim().split(/\s+/);
    if (words.length > 0) {
      // Synchronize word index with narration duration (leaving 0.15s tail pause)
      const speechRatio = Math.min(1, activeProgress / 0.96);
      const activeWordIndex = Math.min(
        words.length - 1,
        Math.floor(speechRatio * words.length)
      );

      const maxWords = captions.maxWordsPerLine || 5;
      const currentLineStart = Math.floor(activeWordIndex / maxWords) * maxWords;
      const visibleWords = words.slice(currentLineStart, currentLineStart + maxWords);

      const scaleFactor = width / 1080;
      const baseFontPx =
        captions.fontSize === 'xl'
          ? 56
          : captions.fontSize === 'lg'
          ? 46
          : captions.fontSize === 'sm'
          ? 34
          : 40;
      const fontPx = Math.round(baseFontPx * scaleFactor);

      ctx.save();
      ctx.font = `800 ${fontPx}px "Inter", "Segoe UI", Arial, sans-serif`;
      ctx.textBaseline = 'middle';

      const spaceWidth = ctx.measureText(' ').width * 1.15;
      const wordMetrics = visibleWords.map((w) => ctx.measureText(w).width);
      const totalLineWidth =
        wordMetrics.reduce((a, b) => a + b, 0) +
        Math.max(0, visibleWords.length - 1) * spaceWidth;

      const captionY =
        captions.position === 'top'
          ? height * 0.16
          : captions.position === 'center'
          ? height * 0.52
          : height * 0.84;

      const padX = Math.round(32 * scaleFactor);
      const padY = Math.round(22 * scaleFactor);
      const pillW = Math.min(width * 0.9, totalLineWidth + padX * 2);
      const pillH = fontPx + padY * 2;
      const pillX = (width - pillW) / 2;
      const pillY = captionY - pillH / 2;

      // Backdrop Pill
      ctx.fillStyle = 'rgba(10, 10, 14, 0.82)';
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, Math.round(22 * scaleFactor));
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = Math.max(1, Math.round(2 * scaleFactor));
      ctx.stroke();

      // Draw each word with Karaoke / Active Highlight
      let cursorX = (width - totalLineWidth) / 2;
      for (let i = 0; i < visibleWords.length; i++) {
        const word = visibleWords[i];
        const wWidth = wordMetrics[i];
        const globalIdx = currentLineStart + i;
        const isCurrent = globalIdx === activeWordIndex;
        const isPassed = globalIdx < activeWordIndex;

        ctx.save();
        if (captions.style === 'KARAOKE') {
          if (isCurrent) {
            ctx.fillStyle = captions.highlightColor || '#facc15';
            ctx.shadowColor = 'rgba(250, 204, 21, 0.6)';
            ctx.shadowBlur = Math.round(14 * scaleFactor);
          } else if (isPassed) {
            ctx.fillStyle = '#ffffff';
          } else {
            ctx.fillStyle = 'rgba(203, 213, 225, 0.85)';
          }
        } else {
          ctx.fillStyle = '#ffffff';
        }

        ctx.textAlign = 'left';
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

  // RIFF identifier
  setUint32(0x46464952);
  setUint32(length - 8);
  setUint32(0x45564157);
  // fmt chunk
  setUint32(0x20746d66);
  setUint32(16);
  setUint16(1);
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);
  // data chunk
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

// Cache decoded audio buffers by URL so re-renders are instant
const decodedBufferCache = new Map<string, AudioBuffer>();

async function fetchAndDecodeAudio(
  url: string,
  decodeCtx: BaseAudioContext
): Promise<AudioBuffer | null> {
  if (!url) return null;
  if (decodedBufferCache.has(url)) {
    return decodedBufferCache.get(url)!;
  }

  // Try exact URL, then fallback with/without leading ./ or /
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
 * Build ONE Continuous Master Audio Track (Voiceover across all scenes + Continuous Ducked Background Music)
 * using WebAudio OfflineAudioContext.
 *
 * Guarantees:
 * 1. Voiceover continues sequentially across all scenes from 0s to end.
 * 2. Background music starts ONCE at 0s and plays continuously across all transitions without restarting.
 * 3. Music is smoothly ducked underneath voiceover.
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
  const musicVol = project.project.musicVolume ?? 0.20;

  // 1. Schedule all Scene Voiceovers sequentially on the Master Timeline
  const voiceWindows: Array<{ start: number; end: number }> = [];

  for (const seg of timeline.segments) {
    if (seg.scene.audioUrl) {
      const voiceBuf = await fetchAndDecodeAudio(seg.scene.audioUrl, offlineCtx);
      if (voiceBuf) {
        const src = offlineCtx.createBufferSource();
        src.buffer = voiceBuf;

        const gainNode = offlineCtx.createGain();
        // Boost voice clarity slightly so narration stands out clearly above music
        gainNode.gain.setValueAtTime(Math.min(1.5, voiceVol * 1.15), seg.start);

        src.connect(gainNode);
        gainNode.connect(offlineCtx.destination);
        src.start(seg.start);

        voiceWindows.push({
          start: seg.start,
          end: Math.min(seg.end, seg.start + voiceBuf.duration),
        });
      }
    }
  }

  // 2. Schedule ONE Continuous Background Music Track from 0.0s to totalDuration
  const selectedTrack =
    MUSIC_TRACKS.find((t) => t.id === project.project.musicTrackId) ||
    MUSIC_TRACKS[0];

  if (selectedTrack?.audioUrl && musicVol > 0) {
    const bgmBuf = await fetchAndDecodeAudio(selectedTrack.audioUrl, offlineCtx);
    if (bgmBuf) {
      const bgmSrc = offlineCtx.createBufferSource();
      bgmSrc.buffer = bgmBuf;
      bgmSrc.loop = true; // Loop seamlessly if track is shorter than video

      const bgmGain = offlineCtx.createGain();
      const baseBgmGain = musicVol * 0.85;
      const duckedBgmGain = musicVol * 0.32; // Ducked under voiceover

      // Smooth fade-in at 0s
      bgmGain.gain.setValueAtTime(0.001, 0);
      bgmGain.gain.linearRampToValueAtTime(
        voiceWindows.length > 0 ? duckedBgmGain : baseBgmGain,
        Math.min(0.4, totalDuration * 0.1)
      );

      // Automate subtle ducking during voiceover windows and gentle swell during pauses
      for (const win of voiceWindows) {
        const duckStart = Math.max(0.4, win.start);
        bgmGain.gain.setValueAtTime(duckedBgmGain, duckStart);
        if (win.end < totalDuration - 1.6) {
          bgmGain.gain.setValueAtTime(duckedBgmGain, win.end);
          bgmGain.gain.linearRampToValueAtTime(
            baseBgmGain * 0.65,
            Math.min(totalDuration - 1.6, win.end + 0.12)
          );
        }
      }

      // Smooth fade-out at end of master timeline
      const fadeOutStart = Math.max(0.5, totalDuration - 1.5);
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
