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
  speechDuration: number;
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
  glitchIntensity: number; // 0.0 to 1.0 when a subtle story glitch is active
}

export interface CameraTransform {
  scale: number;
  txPercent: number;
  tyPercent: number;
  rotateDeg: number;
}

export interface CaptionWordToken {
  text: string; // Uppercase display word (with punctuation)
  cleanWord: string; // Stripped alphanumeric uppercase token
  isEmphasized: boolean; // True if important story word/phrase
  startTime: number; // Absolute master timeline start (s)
  endTime: number; // Absolute master timeline end (s)
}

export interface CaptionChunk {
  sceneIndex: number;
  chunkIndex: number;
  words: CaptionWordToken[];
  lines: CaptionWordToken[][]; // 1 or 2 balanced lines within mobile safe margins
  text: string;
  hasEmphasis: boolean;
  startTime: number;
  endTime: number;
}

// Known calibrated voiceover audio durations (in seconds) for existing assets
export const KNOWN_VOICE_DURATIONS: Record<string, number> = {
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
  'hoia_baciu_voice_1.mp3': 11.71,
  'hoia_baciu_voice_2.mp3': 12.74,
  'hoia_baciu_voice_3.mp3': 10.13,
  'hoia_baciu_voice_4.mp3': 11.30,
  'hoia_baciu_voice_5.mp3': 11.04,
  'taured_voice_1.mp3': 8.57,
  'taured_voice_2.mp3': 10.97,
  'taured_voice_3.mp3': 11.21,
  'taured_voice_4.mp3': 14.95,
  'taured_voice_5.mp3': 13.20,
};

// Multi-word important phrases that should stay together and receive visual emphasis
const EMPHASIS_PHRASES: string[][] = [
  ['A', 'PASSPORT', 'FROM', 'TAURED'],
  ['A', 'PASSPORT'],
  ['FROM', 'TAURED'],
  ['TAURED'],
  ['NOT', 'ON', 'THE', 'MAP'],
  ['NOT', 'ON', 'MAP'],
  ['HE', 'WAS', 'GONE'],
  ['WAS', 'GONE'],
  ['REAL', 'CASE', 'OR', 'LEGEND'],
  ['REAL', 'CASE'],
  ['OR', 'LEGEND'],
  ['THE', 'MYSTERY', 'REMAINS'],
  ['MYSTERY', 'REMAINS'],
  ['JOHN', 'ZEGRUS'],
  ['BETWEEN', 'FRANCE', 'AND', 'SPAIN'],
  ['A', 'STRANGE', 'FOREST'],
  ['STRANGE', 'FOREST'],
  ['SOMEONE', 'WAS', 'WATCHING'],
  ['SOMEONE', 'IS', 'WATCHING'],
  ['THE', 'EMPTY', 'CLEARING'],
  ['CIRCULAR', 'CLEARING'],
  ['1968'],
  ['WHAT', 'DID', 'HE', 'SEE'],
  ['THE', 'MYSTERY', 'CONTINUES'],
  ['HOIA-BACIU', 'FOREST'],
  ['HOIA-BACIU'],
  ['BERMUDA', 'TRIANGLE'],
  ['IN', 'TRANSYLVANIA'],
  ['OF', 'ROMANIA'],
  ['STRANGE', 'DISORIENTATION'],
  ['INEXPLICABLE', 'PHENOMENA'],
  ['UNSETTLING', 'QUIET'],
  ['UNSETTLING', 'SILENCE'],
  ['FROM', 'THE', 'SHADOWS'],
  ['LEAD', 'HIKERS', 'ASTRAY'],
  ['MYSTERIOUS', 'DEAD', 'ZONE'],
  ['DEAD', 'ZONE'],
  ['REFUSES', 'TO', 'GROW'],
  ['BAFFLING', 'SCIENTISTS'],
  ['MILITARY', 'TECHNICIAN'],
  ['HOVERING', 'OBJECT'],
  ['DISTANT', 'SILHOUETTES'],
  ['STRANGE', 'FIGURE'],
  ['DARK', 'FIGURE'],
  ['TALL', 'DARK', 'FIGURE'],
  ['RED', 'EYES'],
  ['HUGE', 'WINGS'],
  ['NOT', 'HUMAN'],
  ['STRANGE', 'CREATURE'],
  ['SOMETHING', 'TERRIBLE'],
  ['DECEMBER', '15', '1967'],
  ['SILVER', 'BRIDGE'],
  ['FORTY-SIX', 'PEOPLE'],
  ['46', 'PEOPLE'],
  ['PEOPLE', 'DIED'],
  ['NOBODY', 'KNOWS'],
  ['THE', 'MYSTERY', 'REMAINS'],
  ['MOTHMAN', 'MYSTERY'],
  ['STILL', 'WATCHING'],
];

// Multi-word collocations that should be kept on the same caption chunk (even if not highlighted)
const COHESIVE_COLLOCATIONS: string[][] = [
  ...EMPHASIS_PHRASES,
  ['IN', 'THE', 'HEART'],
  ['OF', 'TRANSYLVANIA'],
  ['HOIA-BACIU', 'FOREST'],
  ['BERMUDA', 'TRIANGLE'],
  ['OF', 'ROMANIA'],
  ['MORNING', 'FOG'],
  ['STRANGE', 'DISORIENTATION'],
  ['INEXPLICABLE', 'PHENOMENA'],
  ['INTO', 'THE', 'TREES'],
  ['FROM', 'THE', 'SHADOWS'],
  ['LEAD', 'HIKERS', 'ASTRAY'],
  ['CIRCULAR', 'CLEARING'],
  ['DEAD', 'ZONE'],
  ['FOR', 'DECADES'],
  ['IN', '1968'],
  ['MILITARY', 'TECHNICIAN'],
  ['HOVERING', 'OBJECT'],
  ['WHAT', 'DID', 'HE', 'SEE'],
  ['AT', 'NIGHT'],
  ['COLD', 'FOG'],
  ['DISTANT', 'SILHOUETTES'],
  ['THE', 'MYSTERY', 'CONTINUES'],
  ['IN', '1966'],
  ['POINT', 'PLEASANT'],
  ['WEST', 'VIRGINIA'],
  ['TWO', 'YOUNG', 'COUPLES'],
  ['OLD', 'FACTORY'],
  ['LATE', 'AT', 'NIGHT'],
  ['VERY', 'FAST'],
  ['IN', 'THE', 'DARKNESS'],
  ['STRANGE', 'ANIMAL'],
  ['CANNOT', 'EXPLAIN'],
  ['STILL', 'ALIVE'],
];

// Single-word important story keywords
const EMPHASIS_KEYWORDS = new Set([
  'TAURED',
  'ANDORRA',
  'PASSPORT',
  'AIRPORT',
  'ZEGRUS',
  'MAP',
  'LEGEND',
  'OFFICIALS',
  'GONE',
  'STRANGEST',
  'HOIA-BACIU',
  'TRANSYLVANIA',
  'ROMANIA',
  'BERMUDA',
  'TRIANGLE',
  'CLEARING',
  '1968',
  'DISORIENTATION',
  'PHENOMENA',
  'UNSETTLING',
  'HOVERING',
  'SILHOUETTES',
  'CONTINUES',
  '1966',
  '1967',
  'STRANGE',
  'TERRIFIED',
  'CREATURE',
  'DARKNESS',
  'MOTHMAN',
  'WARNING',
  'TERRIBLE',
  'AFRAID',
  'SILVER',
  'BRIDGE',
  'COLLAPSED',
  'FORTY-SIX',
  '46',
  'DIED',
  'DISASTER',
  'MYSTERY',
  'WATCHING',
  'OVERCONFIDENT',
  'IGNORANCE',
  'DESPAIR',
  'HUMBLE',
  'MASTERY',
]);

// Words that naturally start a new phrase if current chunk already has >= 2 words
const CLAUSE_STARTERS = new Set([
  'IN',
  'NEAR',
  'AT',
  'BY',
  'WHEN',
  'AS',
  'UNTIL',
  'BECAUSE',
  'THAT',
  'WHO',
  'WITH',
  'FROM',
  'OVER',
  'ABOVE',
  'INTO',
  'ACROSS',
  'AFTER',
  'BEFORE',
  'BUT',
  'AND',
  'OR',
  'TO',
]);

export function cleanWordToken(word: string): string {
  return word.toUpperCase().replace(/[^A-Z0-9-]/g, '');
}

export function getKnownSpeechDuration(scene: Scene): number {
  if (scene.audioDuration && scene.audioDuration > 0) {
    return scene.audioDuration;
  }
  if (scene.audioUrl) {
    for (const [filename, knownDur] of Object.entries(KNOWN_VOICE_DURATIONS)) {
      if (scene.audioUrl.includes(filename)) {
        return knownDur;
      }
    }
  }
  return Math.max(2.2, (scene.duration || 5.5) - 0.3);
}

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
 * Compute subtle, short story-driven glitch intensity (0.0 -> 0.55) at key narrative peaks.
 * Per Requirement 12: Glitches are kept subtle and brief (~0.28s–0.35s) and are NEVER placed on every scene change.
 */
export function computeStoryGlitchIntensity(
  sceneIndex: number,
  glitchEffect: GlitchEffect | undefined,
  progress: number,
  isTransitioning: boolean,
  transitionType: TransitionEffect,
  scene?: Scene
): number {
  if (isTransitioning && transitionType === 'glitch') {
    return 0.48;
  }
  if (!glitchEffect || glitchEffect === 'none') return 0;

  // 1. Explicit scene-level glitch triggers take highest priority
  if (scene?.glitchTriggers && scene.glitchTriggers.length > 0) {
    const sceneDur = scene.duration || 10;
    const currentSceneSec = progress * sceneDur;
    for (const trig of scene.glitchTriggers) {
      if (currentSceneSec >= trig.timeOffset && currentSceneSec <= trig.timeOffset + trig.duration) {
        const mid = trig.timeOffset + trig.duration / 2;
        const half = trig.duration / 2;
        const dist = Math.abs(currentSceneSec - mid) / Math.max(0.01, half);
        return Math.max(0, (1 - dist * dist) * (trig.intensity || 0.52));
      }
    }
  }

  // 2. Specialized VHS flicker / archival texture
  if (glitchEffect === 'vhs_flicker' || glitchEffect === 'vhs_distortion') {
    if (progress >= 0.38 && progress <= 0.74) {
      const mid = 0.56;
      const dist = Math.abs(progress - mid) / 0.18;
      return Math.max(0, (1 - dist * dist) * 0.42);
    }
    return 0;
  }

  // 3. Digital static burst
  if (glitchEffect === 'digital_static' || glitchEffect === 'pixel_tearing') {
    if ((progress >= 0.45 && progress <= 0.54) || (progress >= 0.88 && progress <= 0.94)) {
      return 0.50;
    }
    return 0;
  }

  const windows: Array<[number, number, number]> =
    sceneIndex === 0
      ? [[0.58, 0.608, 0.48]]
      : sceneIndex === 1
      ? [[0.48, 0.518, 0.46]]
      : sceneIndex === 2
      ? [[0.52, 0.552, 0.44]]
      : sceneIndex === 3
      ? [[0.31, 0.34, 0.52], [0.48, 0.68, 0.42]]
      : [[0.86, 0.90, 0.48]];

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
  const transitionDuration = 0.48; // 480ms smooth cinematic transition
  const segments: TimelineSegment[] = [];
  let accumulated = 0;

  for (let i = 0; i < project.scenes.length; i++) {
    const sc = project.scenes[i];
    const duration = getCalibratedSceneDuration(sc);
    const speechDuration = Math.min(duration - 0.15, getKnownSpeechDuration(sc));
    const start = Number(accumulated.toFixed(3));
    const end = Number((accumulated + duration).toFixed(3));

    segments.push({
      index: i,
      scene: sc,
      start,
      end,
      duration,
      speechDuration,
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
 * Check if a word is an important story keyword that should receive stronger visual emphasis.
 */
export function isEmphasizedWord(word: string): boolean {
  const cleaned = cleanWordToken(word);
  return EMPHASIS_KEYWORDS.has(cleaned);
}

/**
 * Identify which word indices in a word array belong to emphasized words or multi-word emphasis phrases.
 */
function markEmphasizedWords(rawWords: string[]): boolean[] {
  const cleanTokens = rawWords.map((w) => cleanWordToken(w));
  const flags = rawWords.map((w) => isEmphasizedWord(w));

  for (const phrase of EMPHASIS_PHRASES) {
    const pLen = phrase.length;
    for (let i = 0; i <= cleanTokens.length - pLen; i++) {
      let match = true;
      for (let j = 0; j < pLen; j++) {
        if (cleanTokens[i + j] !== phrase[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        for (let j = 0; j < pLen; j++) {
          flags[i + j] = true;
        }
      }
    }
  }
  return flags;
}

/**
 * Check if `cleanTokens[idx]` and `cleanTokens[idx + 1]` belong to a cohesive collocation
 * that should NOT be split across two different caption chunks.
 */
function isCohesivePair(cleanTokens: string[], idx: number): boolean {
  if (idx < 0 || idx + 1 >= cleanTokens.length) return false;
  const a = cleanTokens[idx];
  const b = cleanTokens[idx + 1];
  for (const coll of COHESIVE_COLLOCATIONS) {
    for (let k = 0; k < coll.length - 1; k++) {
      if (coll[k] === a && coll[k + 1] === b) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Intelligent YouTube Shorts / Documentary Caption Segmenter.
 * Breaks a narration sentence into short, punchy 2-3 word readable chunks (max 4 short words),
 * respecting natural punctuation, prepositional clause starts, and keeping key collocations together.
 */
export function splitNarrationIntoPhrases(narration: string, maxWords = 3): string[][] {
  const rawWords = narration.trim().split(/\s+/).filter(Boolean);
  if (rawWords.length === 0) return [];

  const cleanTokens = rawWords.map((w) => cleanWordToken(w));
  const targetMax = Math.max(2, Math.min(4, maxWords));
  const phrases: string[][] = [];
  let current: string[] = [];

  for (let i = 0; i < rawWords.length; i++) {
    const word = rawWords[i];
    const clean = cleanTokens[i];
    const nextClean = i + 1 < cleanTokens.length ? cleanTokens[i + 1] : '';

    // If current already has >= 2 words and this word starts a new clause (and wasn't glued to previous), flush first
    if (
      current.length >= 2 &&
      CLAUSE_STARTERS.has(clean) &&
      !isCohesivePair(cleanTokens, i - 1)
    ) {
      phrases.push(current);
      current = [];
    }

    current.push(word);

    const endsStrongPunct = /[.!?;:]$/.test(word);
    const endsComma = /,$/.test(word);
    const currentChars = current.join(' ').length;

    // Never split in the middle of a cohesive collocation (e.g. "DECEMBER 15, 1967" or "RED EYES")
    const gluedToNext = isCohesivePair(cleanTokens, i);

    if (endsStrongPunct && !gluedToNext) {
      phrases.push(current);
      current = [];
    } else if (endsComma && !gluedToNext && current.length >= 1) {
      phrases.push(current);
      current = [];
    } else if (!gluedToNext) {
      if (
        current.length >= targetMax ||
        (current.length >= 2 && currentChars >= 16) ||
        (current.length >= 2 && CLAUSE_STARTERS.has(nextClean))
      ) {
        phrases.push(current);
        current = [];
      }
    } else if (current.length >= 4) {
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
 * Split a chunk's word tokens into 1 or 2 balanced lines so captions never exceed mobile safe width.
 */
function splitChunkIntoBalancedLines(words: CaptionWordToken[]): CaptionWordToken[][] {
  const totalChars = words.reduce((acc, w) => acc + w.text.length, 0) + Math.max(0, words.length - 1);
  if (words.length <= 3 && totalChars <= 20) {
    return [words];
  }
  if (words.length <= 1) {
    return [words];
  }
  // Find split index that balances character length between line 1 and line 2
  let bestSplit = Math.ceil(words.length / 2);
  let bestDiff = Infinity;
  for (let s = 1; s < words.length; s++) {
    const leftLen = words.slice(0, s).reduce((a, w) => a + w.text.length, 0);
    const rightLen = words.slice(s).reduce((a, w) => a + w.text.length, 0);
    const diff = Math.abs(leftLen - rightLen);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestSplit = s;
    }
  }
  return [words.slice(0, bestSplit), words.slice(bestSplit)];
}

/**
 * Single Source of Truth for Synchronized Captions across BOTH Browser Preview and FFmpeg Export.
 * Uses exact scene narration timing + syllable/punctuation pause weighting.
 */
export function buildMasterCaptions(
  project: VideoProject,
  timeline: MasterTimeline
): CaptionChunk[] {
  if (project.captions?.enabled === false) return [];

  const maxWords = Math.min(4, Math.max(2, project.captions?.maxWordsPerLine || 3));
  const allChunks: CaptionChunk[] = [];

  for (const seg of timeline.segments) {
    const narration = seg.scene.narration?.trim();
    if (!narration) continue;

    const rawPhrases = splitNarrationIntoPhrases(narration, maxWords);
    if (rawPhrases.length === 0) continue;

    const flatWords = rawPhrases.flat();
    const emphasisFlags = markEmphasizedWords(flatWords);

    // Compute natural speech timing weight for each word (characters + punctuation pause weight)
    const wordWeights = flatWords.map((w) => {
      const baseLen = Math.max(2, cleanWordToken(w).length);
      const endsPeriod = /[.!?]$/.test(w);
      const endsComma = /[,;:]$/.test(w);
      return baseLen + (endsPeriod ? 5.5 : endsComma ? 3.0 : 0.8);
    });
    const totalWeight = wordWeights.reduce((a, b) => a + b, 0) || 1;

    // Speech starts at seg.start + 0.06s and runs for seg.speechDuration
    const speechStart = seg.start + 0.06;
    const speechWindow = Math.max(1.5, seg.speechDuration - 0.06);

    let weightCursor = 0;
    let globalWordIdx = 0;

    for (let cIdx = 0; cIdx < rawPhrases.length; cIdx++) {
      const phraseWords = rawPhrases[cIdx];
      const tokens: CaptionWordToken[] = [];

      for (const w of phraseWords) {
        const wWeight = wordWeights[globalWordIdx];
        const wStart = speechStart + (weightCursor / totalWeight) * speechWindow;
        weightCursor += wWeight;
        const wEnd = speechStart + (weightCursor / totalWeight) * speechWindow;

        tokens.push({
          text: w.toUpperCase(),
          cleanWord: cleanWordToken(w),
          isEmphasized: emphasisFlags[globalWordIdx],
          startTime: Number(wStart.toFixed(3)),
          endTime: Number(wEnd.toFixed(3)),
        });

        globalWordIdx++;
      }

      if (tokens.length > 0) {
        const chunkStart = tokens[0].startTime;
        const chunkEnd = tokens[tokens.length - 1].endTime;
        allChunks.push({
          sceneIndex: seg.index,
          chunkIndex: cIdx,
          words: tokens,
          lines: splitChunkIntoBalancedLines(tokens),
          text: tokens.map((t) => t.text).join(' '),
          hasEmphasis: tokens.some((t) => t.isEmphasized),
          startTime: chunkStart,
          endTime: chunkEnd,
        });
      }
    }
  }

  return allChunks;
}

/**
 * Find the active caption chunk and active word at any master timeline timestamp `currentTime`.
 */
export function getActiveCaptionAtTime(
  chunks: CaptionChunk[],
  currentTime: number
): {
  chunk: CaptionChunk;
  chunkProgress: number;
  elapsedInChunk: number;
  activeWordIndex: number;
} | null {
  if (chunks.length === 0) return null;

  for (const chunk of chunks) {
    if (currentTime >= chunk.startTime && currentTime <= chunk.endTime + 0.08) {
      const dur = Math.max(0.15, chunk.endTime - chunk.startTime);
      const elapsed = Math.max(0, currentTime - chunk.startTime);
      const progress = Math.min(1, elapsed / dur);

      let activeWordIndex = 0;
      for (let i = 0; i < chunk.words.length; i++) {
        if (currentTime >= chunk.words[i].startTime) {
          activeWordIndex = i;
        }
      }

      return {
        chunk,
        chunkProgress: progress,
        elapsedInChunk: elapsed,
        activeWordIndex,
      };
    }
  }

  return null;
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
    activeSegment.transitionType,
    activeSegment.scene
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
        scale: 1.12,
        txPercent: Math.sin(p * Math.PI * 3) * 0.22, // subtle organic handheld camera sway
        tyPercent: 3.5 - p * 7.0, // tilts smoothly from man looking up (+3.5%) to sky & object (-3.5%)
        rotateDeg: Math.sin(p * Math.PI) * 0.25,
      };
    case 'pan_down':
      return {
        scale: 1.12,
        txPercent: 0,
        tyPercent: -3.5 + p * 7.0,
        rotateDeg: 0,
      };
    case 'ken_burns':
      return {
        scale: 1.02 + p * 0.09,
        txPercent: -1.2 + p * 2.4,
        tyPercent: 1.0 - p * 2.0,
        rotateDeg: Math.sin(p * Math.PI) * 0.45, // subtle rotational drift
      };
    case 'parallax':
      return {
        scale: 1.03 + p * 0.08,
        txPercent: -2.0 + p * 4.0, // tracking across trees
        tyPercent: -p * 1.5,
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

    // Layer 3 (Foreground Parallax Atmosphere — subtle drifting mist & dust motes)
    if (isCreepyStyle || (scene.parallaxIntensity && scene.parallaxIntensity > 0)) {
      const fgTx = txPx * 1.65 + (animProgress - 0.5) * width * 0.05;
      const fgTy = tyPx * 1.35;

      ctx.save();
      const fogGrad1 = ctx.createRadialGradient(
        width * 0.35 + fgTx,
        height * 0.65 + fgTy,
        width * 0.05,
        width * 0.35 + fgTx,
        height * 0.65 + fgTy,
        width * 0.65
      );
      fogGrad1.addColorStop(0, 'rgba(148, 163, 184, 0.11)');
      fogGrad1.addColorStop(0.6, 'rgba(71, 85, 105, 0.05)');
      fogGrad1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = fogGrad1;
      ctx.fillRect(0, 0, width, height);

      // Subtle foreground dust motes drifting across lens
      for (let m = 0; m < 10; m++) {
        const seed = (scene.id * 37 + m * 73) % 100;
        const baseX = ((seed * 13) % 100) / 100;
        const baseY = ((seed * 29) % 100) / 100;
        const px =
          ((baseX * width + fgTx * (1.2 + (m % 3) * 0.4) + animProgress * 45) % width + width) %
          width;
        const py =
          ((baseY * height + fgTy - animProgress * (25 + (m % 4) * 10)) % height + height) %
          height;
        const radius = (1.3 + (m % 3) * 1.0) * (width / 1080);

        ctx.fillStyle =
          m % 5 === 0 ? 'rgba(248, 113, 113, 0.20)' : 'rgba(226, 232, 240, 0.14)';
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Scene 2 specific: Near the end of the scene, slightly darken the surrounding forest
      if (scene.on_screen_text?.includes('WATCHING') || scene.id === 2) {
        if (animProgress > 0.60) {
          const darkProgress = (animProgress - 0.60) / 0.40;
          const darkGrad = ctx.createRadialGradient(
            width * 0.5,
            height * 0.55,
            width * 0.2,
            width * 0.5,
            height * 0.55,
            width * 0.8
          );
          darkGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
          darkGrad.addColorStop(0.7, `rgba(4, 8, 12, ${(darkProgress * 0.48).toFixed(3)})`);
          darkGrad.addColorStop(1, `rgba(0, 0, 0, ${(darkProgress * 0.75).toFixed(3)})`);
          ctx.fillStyle = darkGrad;
          ctx.fillRect(0, 0, width, height);
        }
      }

      // Scene 3 specific: Move fog gently across the clearing
      if (scene.on_screen_text?.includes('CLEARING') || scene.id === 3) {
        const driftX = (animProgress - 0.5) * width * 0.22;
        const clearingFog = ctx.createRadialGradient(
          width * 0.5 + driftX,
          height * 0.58,
          width * 0.08,
          width * 0.5 + driftX,
          height * 0.58,
          width * 0.68
        );
        clearingFog.addColorStop(0, 'rgba(203, 213, 225, 0.14)');
        clearingFog.addColorStop(0.55, 'rgba(148, 163, 184, 0.07)');
        clearingFog.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = clearingFog;
        ctx.fillRect(0, 0, width, height);
      }

      // Scene 4 specific: 1968 archival photographic texture & vintage grain
      if (scene.on_screen_text?.includes('1968') || scene.id === 4) {
        ctx.fillStyle = 'rgba(235, 230, 215, 0.035)';
        ctx.fillRect(0, 0, width, height);
        const grainSeed = Math.sin(animProgress * 150);
        ctx.fillStyle = `rgba(0, 0, 0, ${(0.04 + Math.abs(grainSeed) * 0.04).toFixed(3)})`;
        ctx.fillRect(0, 0, width, height);
      }

      // Scene 5 specific: Increase fog depth gradually, darken frame at final moment, fade to black
      if (scene.on_screen_text?.includes('MYSTERY') || scene.id === 5) {
        const nightFogAlpha = 0.07 + animProgress * 0.16;
        const nightFog = ctx.createLinearGradient(0, height * 0.35, 0, height * 0.88);
        nightFog.addColorStop(0, `rgba(186, 210, 235, ${(nightFogAlpha * 0.6).toFixed(3)})`);
        nightFog.addColorStop(0.7, `rgba(148, 163, 184, ${nightFogAlpha.toFixed(3)})`);
        nightFog.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = nightFog;
        ctx.fillRect(0, 0, width, height);

        if (animProgress > 0.82) {
          const fadeToBlackAlpha = Math.min(1.0, (animProgress - 0.82) / 0.18);
          ctx.fillStyle = `rgba(0, 0, 0, ${fadeToBlackAlpha.toFixed(3)})`;
          ctx.fillRect(0, 0, width, height);
        }
      }

      ctx.restore();
    }
  } else {
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();
}

/**
 * Render subtle, restrained documentary glitch effects (RGB split, VHS scanlines, digital static, film scratches)
 * when `glitchIntensity > 0`.
 */
function renderGlitchEffects(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  intensity: number,
  currentTime: number,
  effectType: GlitchEffect = 'rgb_split'
) {
  if (intensity <= 0.02) return;

  ctx.save();
  const scaleFactor = width / 1080;
  const shiftPx = Math.round(intensity * 12 * scaleFactor * Math.sin(currentTime * 55));

  // 1. Digital Glitch / Pixel Tearing / Slicing
  if (effectType === 'pixel_tearing' || effectType === 'digital_static' || effectType === 'signal_distortion') {
    const sliceCount = Math.min(4, Math.ceil(intensity * 5));
    for (let s = 0; s < sliceCount; s++) {
      const sliceSeed = Math.sin(currentTime * 53 + s * 23);
      const sliceY = Math.max(
        0,
        Math.min(height - 40, Math.floor((sliceSeed + 1) * 0.5 * height))
      );
      const sliceH = Math.floor((12 + (s % 3) * 16) * scaleFactor);
      const offset = Math.round(sliceSeed * intensity * 24 * scaleFactor);
      try {
        ctx.drawImage(canvas, 0, sliceY, width, sliceH, offset, sliceY, width, sliceH);
      } catch {
        // ignore if tainted
      }
    }
  } else {
    // Subtle horizontal tracking displacement
    const sliceCount = Math.min(2, Math.ceil(intensity * 3));
    for (let s = 0; s < sliceCount; s++) {
      const sliceSeed = Math.sin(currentTime * 43 + s * 19);
      const sliceY = Math.max(
        0,
        Math.min(height - 30, Math.floor((sliceSeed + 1) * 0.5 * height))
      );
      const sliceH = Math.floor((10 + (s % 2) * 12) * scaleFactor);
      const offset = Math.round(sliceSeed * intensity * 14 * scaleFactor);
      try {
        ctx.drawImage(canvas, 0, sliceY, width, sliceH, offset, sliceY, width, sliceH);
      } catch {
        // ignore if tainted
      }
    }
  }

  // 2. RGB Chromatic Split
  if (effectType === 'rgb_split' || effectType === 'vhs_distortion' || effectType === 'signal_distortion') {
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = `rgba(239, 68, 68, ${(intensity * 0.16).toFixed(3)})`;
    ctx.fillRect(Math.max(0, shiftPx), 0, width, height);

    ctx.fillStyle = `rgba(6, 182, 212, ${(intensity * 0.12).toFixed(3)})`;
    ctx.fillRect(Math.max(0, -shiftPx), 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
  }

  // 3. Digital Static / Noise
  if (effectType === 'digital_static' || effectType === 'scanline_static') {
    ctx.fillStyle = `rgba(255, 255, 255, ${(intensity * 0.08).toFixed(3)})`;
    const dotCount = Math.floor(intensity * 120);
    for (let i = 0; i < dotCount; i++) {
      const rx = (Math.sin(currentTime * 101 + i) * 0.5 + 0.5) * width;
      const ry = (Math.cos(currentTime * 137 + i) * 0.5 + 0.5) * height;
      const rw = Math.max(2, Math.round(4 * scaleFactor));
      ctx.fillRect(rx, ry, rw, 2);
    }
  }

  // 4. VHS Tracking Scanlines
  if (effectType === 'vhs_flicker' || effectType === 'vhs_distortion' || effectType === 'scanline_static') {
    ctx.fillStyle = `rgba(0, 0, 0, ${(intensity * 0.22).toFixed(3)})`;
    const lineStep = Math.max(4, Math.round(6 * scaleFactor));
    for (let y = 0; y < height; y += lineStep) {
      ctx.fillRect(0, y, width, Math.max(1, Math.round(1.5 * scaleFactor)));
    }
  }

  // 5. Film Scratches & Archival Dust
  if (effectType === 'film_scratches') {
    ctx.strokeStyle = `rgba(255, 255, 255, ${(intensity * 0.35).toFixed(3)})`;
    ctx.lineWidth = Math.max(1, Math.round(1.2 * scaleFactor));
    const scratchX = ((Math.sin(currentTime * 33) * 0.5 + 0.5) * width);
    ctx.beginPath();
    ctx.moveTo(scratchX, 0);
    ctx.lineTo(scratchX + (Math.sin(currentTime * 91) * 8), height);
    ctx.stroke();
  }

  ctx.restore();
}

// Cache master captions per project signature so preview doesn't recompute on every 60fps frame
let cachedCaptionsSig = '';
let cachedCaptionsList: CaptionChunk[] = [];

function getCachedMasterCaptions(
  project: VideoProject,
  timeline: MasterTimeline
): CaptionChunk[] {
  const sig = `${project.id}_${project.captions.enabled}_${project.captions.maxWordsPerLine}_${timeline.segments
    .map((s) => `${s.scene.id}:${s.duration}:${s.scene.narration.length}`)
    .join('|')}`;
  if (sig !== cachedCaptionsSig) {
    cachedCaptionsSig = sig;
    cachedCaptionsList = buildMasterCaptions(project, timeline);
  }
  return cachedCaptionsList;
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

  // 3. Apply Subtle Story-Driven Glitch Effects
  if (glitchIntensity > 0.02 && ctx.canvas) {
    renderGlitchEffects(ctx, ctx.canvas, width, height, glitchIntensity, currentTime, activeSegment.glitchEffect);
  }

  // 4. Subtle Lower-Third Gradient for Mobile Caption Readability
  const bottomGrad = ctx.createLinearGradient(0, height * 0.64, 0, height);
  bottomGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  bottomGrad.addColorStop(0.55, 'rgba(0, 0, 0, 0.44)');
  bottomGrad.addColorStop(1, 'rgba(0, 0, 0, 0.80)');
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, height * 0.64, width, height * 0.36);

  // 5. High-Retention Documentary Captions (Montserrat ExtraBold, Safe Mobile Margins, Kinetic Pop & Word Emphasis)
  const { captions } = project;
  if (captions.enabled) {
    const masterChunks = getCachedMasterCaptions(project, timeline);
    const activeCap = getActiveCaptionAtTime(masterChunks, currentTime);

    if (activeCap) {
      const { chunk, elapsedInChunk } = activeCap;
      const scaleFactor = width / 1080;

      // Subtle kinetic pop-in & upward slide during first 130ms of chunk
      const popScale =
        elapsedInChunk < 0.08
          ? 0.92 + (elapsedInChunk / 0.08) * 0.11
          : elapsedInChunk < 0.15
          ? 1.03 - ((elapsedInChunk - 0.08) / 0.07) * 0.03
          : 1.0;

      const slideY =
        elapsedInChunk < 0.11 ? (1 - elapsedInChunk / 0.11) * 10 * scaleFactor : 0;

      const fadeAlpha =
        elapsedInChunk < 0.06 ? 0.35 + (elapsedInChunk / 0.06) * 0.65 : 1.0;

      const baseFontPx =
        captions.fontSize === 'xl'
          ? 64
          : captions.fontSize === 'lg'
          ? 56
          : captions.fontSize === 'sm'
          ? 42
          : 48;
      const fontPx = Math.round(baseFontPx * scaleFactor);
      const emphFontPx = Math.round(fontPx * 1.08);
      const lineHeight = Math.round(fontPx * 1.24);

      // Safe mobile positioning: 10% horizontal margins, 76% vertical lower-center safe zone
      const safeMarginX = width * 0.10;
      const maxAllowedWidth = width - safeMarginX * 2;
      const anchorY =
        captions.position === 'top'
          ? height * 0.18
          : captions.position === 'center'
          ? height * 0.52
          : height * 0.76;

      ctx.save();
      ctx.globalAlpha = fadeAlpha;
      ctx.translate(width / 2, anchorY + slideY);
      ctx.scale(popScale, popScale);
      ctx.translate(-width / 2, -anchorY);

      const fontFamily = `"Montserrat ExtraBold", "Montserrat", "Oswald", "Bebas Neue", "Impact", sans-serif`;
      ctx.textBaseline = 'middle';

      const lines = chunk.lines;
      const totalBlockHeight = lines.length * lineHeight;
      const startLineY = anchorY - totalBlockHeight / 2 + lineHeight / 2;

      // Measure lines to draw a clean, high-contrast translucent backdrop pill
      let maxMeasuredLineW = 0;
      const measuredLines: Array<{
        words: Array<{
          token: CaptionWordToken;
          width: number;
          fontSize: number;
          isActive: boolean;
        }>;
        totalWidth: number;
        spaceWidth: number;
      }> = [];

      for (const lineTokens of lines) {
        ctx.font = `900 ${fontPx}px ${fontFamily}`;
        const spaceWidth = ctx.measureText(' ').width * 1.28;
        const wordItems = lineTokens.map((token) => {
          const isActive =
            currentTime >= token.startTime - 0.02 && currentTime <= token.endTime + 0.06;
          const fSize = token.isEmphasized ? emphFontPx : fontPx;
          ctx.font = `900 ${fSize}px ${fontFamily}`;
          const wWidth = ctx.measureText(token.text).width;
          return { token, width: wWidth, fontSize: fSize, isActive };
        });

        const lineW =
          wordItems.reduce((a, b) => a + b.width, 0) +
          Math.max(0, wordItems.length - 1) * spaceWidth;
        if (lineW > maxMeasuredLineW) maxMeasuredLineW = lineW;
        measuredLines.push({ words: wordItems, totalWidth: lineW, spaceWidth });
      }

      // If any line exceeds the 80% safe width, scale down proportionally so it NEVER touches edges
      const safeFitScale =
        maxMeasuredLineW > maxAllowedWidth ? maxAllowedWidth / maxMeasuredLineW : 1.0;

      if (safeFitScale < 1.0) {
        ctx.translate(width / 2, anchorY);
        ctx.scale(safeFitScale, safeFitScale);
        ctx.translate(-width / 2, -anchorY);
      }

      // Draw subtle rounded backdrop box behind the caption block for contrast
      const padX = Math.round(32 * scaleFactor);
      const padY = Math.round(18 * scaleFactor);
      const boxW = Math.min(width * 0.86, maxMeasuredLineW + padX * 2);
      const boxH = totalBlockHeight + padY * 2;
      const boxX = (width - boxW) / 2;
      const boxY = anchorY - boxH / 2;

      ctx.fillStyle = 'rgba(6, 6, 12, 0.78)';
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, Math.round(22 * scaleFactor));
      ctx.fill();

      ctx.strokeStyle = chunk.hasEmphasis
        ? isCreepyStyle
          ? 'rgba(255, 59, 59, 0.45)'
          : 'rgba(250, 204, 21, 0.45)'
        : 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = Math.max(1.5, Math.round(2 * scaleFactor));
      ctx.stroke();

      // Render each line and word with deep black outline + keyword emphasis
      for (let lIdx = 0; lIdx < measuredLines.length; lIdx++) {
        const mLine = measuredLines[lIdx];
        const lineY = startLineY + lIdx * lineHeight;
        let cursorX = (width - mLine.totalWidth) / 2;

        for (const item of mLine.words) {
          const { token, width: wWidth, fontSize: fSize, isActive } = item;

          ctx.save();
          // Subtle active word pulse
          if (isActive) {
            const wordCenterX = cursorX + wWidth / 2;
            const wordPulse = token.isEmphasized ? 1.06 : 1.03;
            ctx.translate(wordCenterX, lineY);
            ctx.scale(wordPulse, wordPulse);
            ctx.translate(-wordCenterX, -lineY);
          }

          ctx.font = `900 ${fSize}px ${fontFamily}`;
          ctx.textAlign = 'left';
          ctx.lineJoin = 'round';
          ctx.miterLimit = 2;

          // Deep black stroke for mobile contrast
          ctx.lineWidth = Math.max(4, Math.round(9 * scaleFactor));
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.96)';
          ctx.strokeText(token.text, cursorX, lineY);

          // Word fill color: Important words get accent color (#FF3B3B or #FACC15), normal words stay crisp white
          if (token.isEmphasized) {
            ctx.fillStyle = isCreepyStyle
              ? captions.highlightColor || '#ff3b3b'
              : '#facc15';
            ctx.shadowColor = isCreepyStyle
              ? 'rgba(255, 59, 59, 0.75)'
              : 'rgba(250, 204, 21, 0.70)';
            ctx.shadowBlur = Math.round((isActive ? 18 : 10) * scaleFactor);
          } else if (isActive) {
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(255, 255, 255, 0.45)';
            ctx.shadowBlur = Math.round(10 * scaleFactor);
          } else {
            ctx.fillStyle = 'rgba(248, 250, 252, 0.94)';
          }

          ctx.fillText(token.text, cursorX, lineY);
          ctx.restore();

          cursorX += wWidth + mLine.spaceWidth;
        }
      }

      ctx.restore();
    }
  }
}

/**
 * Extract active voiceover time windows `[start, end]` across the master timeline
 * so both WebAudio and FFmpeg can apply smooth, synchronized music ducking.
 */
export function getVoiceActivityWindows(
  timeline: MasterTimeline
): Array<{ start: number; end: number }> {
  const windows: Array<{ start: number; end: number }> = [];
  for (const seg of timeline.segments) {
    if (seg.scene.audioUrl || seg.scene.narration) {
      windows.push({
        start: Number((seg.start + 0.05).toFixed(3)),
        end: Number(Math.min(seg.end - 0.05, seg.start + seg.speechDuration).toFixed(3)),
      });
    }
  }
  return windows;
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
  const baseName = clean.split('/').pop() || clean;
  const candidates = [
    url,
    `./${clean}`,
    `/${clean}`,
    `./music/${baseName}`,
    `/music/${baseName}`,
    `./${baseName}`,
    `/${baseName}`,
  ];

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
 * 2. BACKGROUND MUSIC TRACK (ONE continuous track from 0s to end — e.g. Beneath_the_Heavy_Soil.mp3 — smoothly ducked ~8 dB during speech, gently swelling in pauses, never restarting)
 * 3. SOUND EFFECTS (SFX) TRACK (Subtle atmospheric cues)
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
  const musicVol = project.project.musicVolume ?? 0.30;
  const sfxMasterVol = project.project.sfxVolume ?? 0.34;

  // Soft-knee Master Compressor/Limiter to prevent any clipping while keeping voice dominant
  const masterCompressor = offlineCtx.createDynamicsCompressor();
  masterCompressor.threshold.setValueAtTime(-3.0, 0);
  masterCompressor.knee.setValueAtTime(6.0, 0);
  masterCompressor.ratio.setValueAtTime(6.0, 0);
  masterCompressor.attack.setValueAtTime(0.005, 0);
  masterCompressor.release.setValueAtTime(0.08, 0);
  masterCompressor.connect(offlineCtx.destination);

  // 1. Schedule all Scene Voiceovers sequentially on the Master Timeline
  const voiceWindows: Array<{ start: number; end: number }> = [];

  for (const seg of timeline.segments) {
    if (seg.scene.audioUrl) {
      const voiceBuf = await fetchAndDecodeAudio(seg.scene.audioUrl, offlineCtx);
      if (voiceBuf) {
        const src = offlineCtx.createBufferSource();
        src.buffer = voiceBuf;

        const gainNode = offlineCtx.createGain();
        gainNode.gain.setValueAtTime(Math.min(1.65, voiceVol * 1.32), seg.start);

        src.connect(gainNode);
        gainNode.connect(masterCompressor);
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
        sfxGain.gain.setValueAtTime(sfxMasterVol * 0.75, seg.start);

        sfxSrc.connect(sfxGain);
        sfxGain.connect(masterCompressor);
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
      bgmSrc.loop = true; // Seamlessly loops ONLY if video is longer than track; for 56.9s Mothman vs 66.56s track, plays once continuously!

      const bgmGain = offlineCtx.createGain();
      // Un-ducked music level vs ~8 dB ducked level during active narration
      const fullBgmGain = Math.min(0.85, musicVol * 0.85);
      const duckedBgmGain = Math.max(0.06, fullBgmGain * 0.38); // ~8.4 dB quieter during narration

      // Smooth fade-in at 0.0s -> 0.6s
      bgmGain.gain.setValueAtTime(0.001, 0);
      bgmGain.gain.linearRampToValueAtTime(fullBgmGain * 0.85, 0.35);

      // Smooth volume automation across all voiceover windows (duck when speech starts, gently swell in pauses)
      for (let i = 0; i < voiceWindows.length; i++) {
        const win = voiceWindows[i];
        const nextWin = i + 1 < voiceWindows.length ? voiceWindows[i + 1] : null;

        const duckAttackStart = Math.max(0.35, win.start - 0.12);
        const duckAttackEnd = Math.min(win.end, win.start + 0.25);

        bgmGain.gain.setValueAtTime(
          i === 0 ? fullBgmGain * 0.85 : fullBgmGain * 0.72,
          duckAttackStart
        );
        bgmGain.gain.linearRampToValueAtTime(duckedBgmGain, duckAttackEnd);
        bgmGain.gain.setValueAtTime(duckedBgmGain, Math.max(duckAttackEnd, win.end - 0.08));

        // If there is a breathing gap before the next scene's narration, gently swell and then duck smoothly
        if (nextWin && nextWin.start - win.end >= 0.22 && win.end < totalDuration - 2.0) {
          const gapMid = (win.end + nextWin.start) / 2;
          bgmGain.gain.linearRampToValueAtTime(fullBgmGain * 0.72, gapMid);
          bgmGain.gain.linearRampToValueAtTime(duckedBgmGain, nextWin.start + 0.18);
        }
      }

      // Smooth fade-out at the end of the master timeline
      const fadeOutStart = Math.max(1.0, totalDuration - 1.8);
      bgmGain.gain.setValueAtTime(duckedBgmGain, fadeOutStart);
      bgmGain.gain.linearRampToValueAtTime(0.0001, totalDuration);

      bgmSrc.connect(bgmGain);
      bgmGain.connect(masterCompressor);
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
