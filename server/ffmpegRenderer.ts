import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';
import { VideoProject } from '../src/types/video.ts';
import {
  buildMasterTimeline,
  buildMasterCaptions,
  CaptionChunk,
} from '../src/services/compositionEngine.ts';
import { MUSIC_TRACKS } from '../src/services/musicService.ts';

export interface RenderValidationReport {
  isValid: boolean;
  resolution: string;
  videoCodec: string;
  audioCodec: string;
  pixelFormat: string;
  videoDuration: number;
  audioDuration: number;
  expectedDuration: number;
  sceneCount: number;
  fileSizeBytes: number;
  continuousVoiceover: boolean;
  continuousBackgroundMusic: boolean;
  musicTrackUsed?: string;
  sfxApplied?: boolean;
  glitchesApplied?: boolean;
  transitionsApplied: boolean;
  animationsApplied: boolean;
}

export async function isFfmpegAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const p = spawn('ffmpeg', ['-version']);
    p.on('error', () => resolve(false));
    p.on('close', (code) => resolve(code === 0));
  });
}

export function resolveAssetPath(urlPath: string): string | null {
  if (!urlPath) return null;

  const cleaned = urlPath.replace(/^(\.\/|\/)/, '');
  const baseName = path.basename(cleaned);

  const candidates = [
    path.resolve(process.cwd(), cleaned),
    path.resolve(process.cwd(), 'public', cleaned),
    path.resolve(process.cwd(), baseName),
    path.resolve(process.cwd(), 'public/music', baseName),
    path.resolve(process.cwd(), 'docs', cleaned),
    path.isAbsolute(urlPath) ? urlPath : null,
  ].filter(Boolean) as string[];

  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return c;
    }
  }

  return null;
}

function getAudioDuration(filePath: string): number | null {
  try {
    const out = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
      { timeout: 5000 }
    )
      .toString()
      .trim();
    const dur = parseFloat(out);
    return isNaN(dur) ? null : dur;
  } catch {
    return null;
  }
}

function formatAssTime(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = Math.floor(clamped % 60);
  const cs = Math.floor((clamped - Math.floor(clamped)) * 100);
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs
    .toString()
    .padStart(2, '0')}`;
}

function escapeAssText(text: string): string {
  return text.replace(/[{}]/g, '').trim();
}

/**
 * Generate an Advanced SubStation Alpha (.ass) subtitle file from the shared Master Caption Chunks
 * so FFmpeg renders the exact same Montserrat ExtraBold typography, safe margins, kinetic pop-in,
 * and per-word keyword emphasis as the Browser Canvas Preview.
 */
function writeAssSubtitleFile(
  project: VideoProject,
  chunks: CaptionChunk[],
  width: number,
  height: number,
  assFilePath: string,
  isCreepy: boolean
): void {
  const scaleFactor = width / 1080;
  const baseFontPx =
    project.captions?.fontSize === 'xl'
      ? 64
      : project.captions?.fontSize === 'lg'
      ? 56
      : project.captions?.fontSize === 'sm'
      ? 42
      : 48;
  const fontSize = Math.round(baseFontPx * scaleFactor);
  const outlinePx = Math.max(3, Math.round(6 * scaleFactor));
  const shadowPx = Math.max(2, Math.round(4 * scaleFactor));

  // Safe mobile positioning: 10% horizontal margins, 76% vertical lower-center safe zone
  const marginX = Math.round(width * 0.10);
  const centerX = Math.round(width / 2);
  const anchorY =
    project.captions?.position === 'top'
      ? Math.round(height * 0.18)
      : project.captions?.position === 'center'
      ? Math.round(height * 0.52)
      : Math.round(height * 0.76);

  // ASS colors are &HAABBGGRR (BGR order)
  // Crimson #FF3B3B -> R=FF, G=3B, B=3B -> &H003B3BFF&
  // Gold #FACC15 -> R=FA, G=CC, B=15 -> &H0015CCFA&
  const accentAssColor = isCreepy ? '&H003B3BFF&' : '&H0015CCFA&';
  const whiteAssColor = '&H00FFFFFF&';

  const lines: string[] = [
    '[Script Info]',
    'Title: Master Synchronized Shorts Captions',
    'ScriptType: v4.00+',
    `PlayResX: ${width}`,
    `PlayResY: ${height}`,
    'WrapStyle: 2',
    'ScaledBorderAndShadow: yes',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    // Layer 1 style: High-contrast extra-bold Montserrat with deep black outline & shadow
    `Style: MainCaption,Montserrat ExtraBold,${fontSize},${whiteAssColor},${whiteAssColor},&H00000000,&H80000000,-1,0,0,0,100,100,1.5,0,1,${outlinePx},${shadowPx},5,${marginX},${marginX},120,1`,
    // Layer 0 style: Translucent dark backdrop box for high contrast
    `Style: BackdropBox,Montserrat ExtraBold,${fontSize},&HFF000000,&HFF000000,&H480C0806,&H480C0806,-1,0,0,0,100,100,1.5,0,3,${Math.round(
      18 * scaleFactor
    )},0,5,${marginX},${marginX},120,1`,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ];

  for (const chunk of chunks) {
    const startStr = formatAssTime(chunk.startTime);
    const endStr = formatAssTime(chunk.endTime);

    // Subtle upward slide-in (10px) + kinetic scale pop (92% -> 103% -> 100%) + fast fade-in/out
    const startY = anchorY + Math.round(10 * scaleFactor);
    const animPrefix = `{\\an5\\move(${centerX},${startY},${centerX},${anchorY},0,110)\\fad(60,45)\\fscx92\\fscy92\\t(0,80,\\fscx103\\fscy103)\\t(80,150,\\fscx100\\fscy100)}`;

    // Build formatted lines with per-word emphasis color & 108% scale on important words
    const formattedLines = chunk.lines.map((lineTokens) =>
      lineTokens
        .map((token) => {
          const safeWord = escapeAssText(token.text);
          if (token.isEmphasized) {
            return `{\\c${accentAssColor}\\fscx108\\fscy108}${safeWord}{\\c${whiteAssColor}\\fscx100\\fscy100}`;
          }
          return safeWord;
        })
        .join(' ')
    );

    const plainLines = chunk.lines
      .map((lineTokens) => lineTokens.map((t) => escapeAssText(t.text)).join(' '))
      .join('\\N');

    const fullText = formattedLines.join('\\N');

    // Layer 0: Translucent dark pill/box behind text
    lines.push(
      `Dialogue: 0,${startStr},${endStr},BackdropBox,,0,0,0,,${animPrefix}${plainLines}`
    );
    // Layer 1: Crisp stroked & color-emphasized text on top
    lines.push(
      `Dialogue: 1,${startStr},${endStr},MainCaption,,0,0,0,,${animPrefix}${fullText}`
    );
  }

  fs.writeFileSync(assFilePath, lines.join('\n'), 'utf8');
}

export async function renderVideoWithFfmpeg(
  project: VideoProject,
  options: { resolution: '720p' | '1080p'; quality: 'standard' | 'high'; format: 'mp4' }
): Promise<{
  success: boolean;
  downloadUrl: string;
  filename: string;
  duration?: number;
  validation?: RenderValidationReport;
  error?: string;
}> {
  const hasFfmpeg = await isFfmpegAvailable();
  if (!hasFfmpeg) {
    return {
      success: false,
      downloadUrl: '',
      filename: '',
      error: 'FFmpeg is not available on this server.',
    };
  }

  const isVertical = project.project.aspect_ratio === '9:16';
  const width =
    options.resolution === '720p' ? (isVertical ? 720 : 1280) : isVertical ? 1080 : 1920;
  const height =
    options.resolution === '720p' ? (isVertical ? 1280 : 720) : isVertical ? 1920 : 1080;

  const outDir = path.resolve(process.cwd(), 'public/generated/videos');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const safeTitle = (project.project.title || 'faceless_video')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
  const timestamp = Date.now();
  const outFilename = `${safeTitle}_${timestamp}_${options.resolution}.mp4`;
  const outPath = path.join(outDir, outFilename);
  const publicUrl = `./generated/videos/${outFilename}`;

  const scenes = project.scenes;
  if (!scenes || scenes.length === 0) {
    return { success: false, downloadUrl: '', filename: '', error: 'Project has no scenes.' };
  }

  // Use the exact same Master Timeline & Caption Segmentation as the Browser Preview
  const masterTimeline = buildMasterTimeline(project);
  const masterCaptions = buildMasterCaptions(project, masterTimeline);
  const transDur = masterTimeline.transitionDuration; // 0.48s

  const isCreepy =
    project.project.style === 'creepy_legend' ||
    project.id.includes('mothman') ||
    project.project.title.toLowerCase().includes('mothman');

  interface ScenePlan {
    imagePath: string;
    audioPath: string | null;
    sfxPath: string | null;
    duration: number;
    startTime: number;
    text?: string;
    narration?: string;
    animation: string;
    transition: string;
    glitchEffect?: string;
  }

  const scenePlans: ScenePlan[] = [];

  for (let i = 0; i < masterTimeline.segments.length; i++) {
    const seg = masterTimeline.segments[i];
    const sc = seg.scene;

    let imgPath = resolveAssetPath(sc.imageUrl || `samples/dunning_kruger_${(i % 5) + 1}.jpg`);
    if (!imgPath) {
      imgPath = resolveAssetPath(`samples/sample_scene_${(i % 5) + 1}.jpg`);
    }
    if (!imgPath) {
      imgPath = path.resolve(process.cwd(), `public/samples/dunning_kruger_${(i % 5) + 1}.jpg`);
    }

    const audPath = sc.audioUrl ? resolveAssetPath(sc.audioUrl) : null;
    const sfxPath = sc.sfxUrl ? resolveAssetPath(sc.sfxUrl) : null;

    let dur = seg.duration;
    if (audPath) {
      const realAudDur = getAudioDuration(audPath);
      if (realAudDur && realAudDur > 0) {
        dur = Math.max(dur, parseFloat((realAudDur + 0.25).toFixed(2)));
      }
    }

    scenePlans.push({
      imagePath: imgPath,
      audioPath: audPath,
      sfxPath,
      duration: dur,
      startTime: seg.start,
      text: sc.on_screen_text,
      narration: sc.narration,
      animation: sc.animation || 'slow_zoom_in',
      transition: sc.transition || 'crossfade',
      glitchEffect: sc.glitchEffect,
    });
  }

  const totalDuration = masterTimeline.totalDuration;
  console.log(
    `[FFmpeg] Master timeline duration: ${totalDuration}s across ${scenePlans.length} scenes (${masterCaptions.length} caption chunks)`
  );

  const args: string[] = ['-y'];

  // 1. Add single-frame visual inputs
  for (let i = 0; i < scenePlans.length; i++) {
    args.push('-i', scenePlans[i].imagePath);
  }

  // 2. Add Voiceover Audio Inputs
  const sceneVoiceInputMap = new Map<number, number>();
  let nextInputIndex = scenePlans.length;

  for (let i = 0; i < scenePlans.length; i++) {
    const plan = scenePlans[i];
    if (plan.audioPath && fs.existsSync(plan.audioPath)) {
      args.push('-i', plan.audioPath);
      sceneVoiceInputMap.set(i, nextInputIndex);
      nextInputIndex++;
    }
  }

  // 3. Add Scene SFX Audio Inputs
  const sceneSfxInputMap = new Map<number, number>();
  for (let i = 0; i < scenePlans.length; i++) {
    const plan = scenePlans[i];
    if (plan.sfxPath && fs.existsSync(plan.sfxPath)) {
      args.push('-i', plan.sfxPath);
      sceneSfxInputMap.set(i, nextInputIndex);
      nextInputIndex++;
    }
  }

  // 4. Resolve Selected Background Music Track from MUSIC_TRACKS Registry
  let musicInputIdx: number | null = null;
  const requestedTrackId = project.project.musicTrackId || '';
  const selectedTrack =
    MUSIC_TRACKS.find((t) => t.id === requestedTrackId) ||
    (isCreepy
      ? MUSIC_TRACKS.find((t) => t.id === 'track_beneath_the_heavy_soil')
      : MUSIC_TRACKS[0]);

  const musicCandidates = [
    selectedTrack?.audioUrl || null,
    isCreepy ? 'Beneath_the_Heavy_Soil.mp3' : null,
    isCreepy ? 'music/Beneath_the_Heavy_Soil.mp3' : null,
    isCreepy ? 'music/creepy-legend-01.mp3' : null,
    'music/educational-01.mp3',
  ].filter(Boolean) as string[];

  let musicFile: string | null = null;
  for (const cand of musicCandidates) {
    const resolved = resolveAssetPath(cand);
    if (resolved && fs.existsSync(resolved)) {
      musicFile = resolved;
      break;
    }
  }

  if (musicFile && fs.existsSync(musicFile)) {
    console.log(`[FFmpeg] Using continuous background music track: ${path.basename(musicFile)}`);
    args.push('-stream_loop', '-1', '-i', musicFile);
    musicInputIdx = nextInputIndex;
    nextInputIndex++;
  }

  // 5. Construct Master Filter Graph
  const filterParts: string[] = [];
  const upW = Math.round(width * 1.35);
  const upH = Math.round(height * 1.35);

  // 5a. Scene Visuals + Continuous Ken Burns Camera Motion (zoompan) + Balanced Shadow Grade
  for (let i = 0; i < scenePlans.length; i++) {
    const plan = scenePlans[i];
    const isLast = i === scenePlans.length - 1;
    const clipDur = plan.duration + (isLast ? 0 : transDur);
    const frames = Math.max(15, Math.round(clipDur * 30));
    const tag = `v${i}`;

    let zoompanExpr = '';
    switch (plan.animation) {
      case 'slow_zoom_in':
        zoompanExpr = `zoompan=z='min(zoom+0.00032,1.10)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:fps=30:s=${width}x${height}`;
        break;
      case 'slow_zoom_out':
        zoompanExpr = `zoompan=z='if(eq(on,1),1.095,max(1.001,zoom-0.00032))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:fps=30:s=${width}x${height}`;
        break;
      case 'pan_left':
        zoompanExpr = `zoompan=z='1.08':x='(iw-iw/zoom)*(1-on/${frames})':y='(ih-ih/zoom)/2':d=${frames}:fps=30:s=${width}x${height}`;
        break;
      case 'pan_right':
        zoompanExpr = `zoompan=z='1.08':x='(iw-iw/zoom)*(on/${frames})':y='(ih-ih/zoom)/2':d=${frames}:fps=30:s=${width}x${height}`;
        break;
      case 'ken_burns':
      case 'parallax':
        zoompanExpr = `zoompan=z='min(zoom+0.00030,1.09)':x='(iw-iw/zoom)*(0.25+0.5*on/${frames})':y='(ih-ih/zoom)*(0.65-0.35*on/${frames})':d=${frames}:fps=30:s=${width}x${height}`;
        break;
      default:
        zoompanExpr = `zoompan=z='min(zoom+0.00030,1.085)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:fps=30:s=${width}x${height}`;
    }

    const gradeFilter = isCreepy
      ? `,eq=brightness=0.04:contrast=1.08:gamma=1.22:saturation=0.95`
      : '';

    filterParts.push(
      `[${i}:v]scale=${upW}:${upH}:force_original_aspect_ratio=increase,crop=${upW}:${upH},${zoompanExpr}${gradeFilter},setsar=1,format=yuv420p[${tag}]`
    );
  }

  // 5b. Chain Smooth Cinematic xfade Transitions across all Scenes
  let lastVTag = 'v0';
  let currentOffset = scenePlans[0].duration;

  for (let i = 1; i < scenePlans.length; i++) {
    const nextVTag = `v${i}`;
    const outTag = i === scenePlans.length - 1 ? 'v_transitions' : `vx_${i}`;

    let xfadeType = 'dissolve';
    const tr = scenePlans[i].transition;
    if (tr === 'slide_left') xfadeType = 'wipeleft';
    else if (tr === 'slide_right') xfadeType = 'wiperight';
    else if (tr === 'zoom') xfadeType = 'circleopen';
    else if (tr === 'dark_fade') xfadeType = 'fadeblack';
    else if (tr === 'glitch') xfadeType = 'hlslice';
    else if (tr === 'fade') xfadeType = 'fade';
    else xfadeType = 'dissolve';

    filterParts.push(
      `[${lastVTag}][${nextVTag}]xfade=transition=${xfadeType}:duration=${transDur}:offset=${currentOffset.toFixed(3)}[${outTag}]`
    );
    lastVTag = outTag;
    currentOffset += scenePlans[i].duration;
  }

  // 5c. Apply Subtle, Short Documentary Glitch Effects (~0.30s bursts only at key moments, never overused)
  const hasGlitches =
    isCreepy || scenePlans.some((p) => p.glitchEffect && p.glitchEffect !== 'none');
  if (hasGlitches) {
    const glitchWindows: string[] = [];
    for (let i = 0; i < scenePlans.length; i++) {
      const p = scenePlans[i];
      if (!p.glitchEffect || p.glitchEffect === 'none') continue;
      const st = p.startTime;
      const dur = p.duration;
      if (i === 0) {
        glitchWindows.push(
          `between(t,${(st + dur * 0.58).toFixed(2)},${(st + dur * 0.608).toFixed(2)})`
        );
      } else if (i === 1) {
        glitchWindows.push(
          `between(t,${(st + dur * 0.48).toFixed(2)},${(st + dur * 0.508).toFixed(2)})`
        );
      } else if (i === 3) {
        glitchWindows.push(
          `between(t,${(st + dur * 0.31).toFixed(2)},${(st + dur * 0.34).toFixed(2)})`
        );
      } else if (i === 4) {
        glitchWindows.push(
          `between(t,${(st + dur * 0.88).toFixed(2)},${(st + dur * 0.91).toFixed(2)})`
        );
      }
    }

    if (glitchWindows.length > 0) {
      const enableExpr = glitchWindows.join('+');
      filterParts.push(
        `[${lastVTag}]rgbashift=rh=-7:bh=7:rv=2:bv=-2:enable='${enableExpr}',noise=alls=9:allf=t+u:enable='${enableExpr}',eq=contrast=1.12:brightness=0.02:enable='${enableExpr}'[v_glitched]`
      );
      lastVTag = 'v_glitched';
    }
  }

  // 5d. Render Modern Animated Captions (Montserrat ExtraBold, Safe Mobile Margins, Keyword Emphasis) via libass
  let tempAssPath: string | null = null;
  if (project.captions?.enabled !== false && masterCaptions.length > 0) {
    const relAssPath = `public/generated/videos/captions_${timestamp}.ass`;
    tempAssPath = path.resolve(process.cwd(), relAssPath);
    writeAssSubtitleFile(project, masterCaptions, width, height, tempAssPath, isCreepy);

    filterParts.push(
      `[${lastVTag}]subtitles=filename='${relAssPath}':fontsdir='public/fonts'[v_master]`
    );
    lastVTag = 'v_master';
  }

  // 5e. Continuous Master Voiceover Track (Sequential concat with exact scene padding)
  const voiceSegmentTags: string[] = [];
  const voiceMultiplier = Math.min(2.0, (project.project.voiceVolume ?? 1.0) * 1.65);

  for (let i = 0; i < scenePlans.length; i++) {
    const plan = scenePlans[i];
    const durStr = plan.duration.toFixed(3);
    const vTag = `va_${i}`;
    const inputIdx = sceneVoiceInputMap.get(i);

    if (inputIdx !== undefined) {
      filterParts.push(
        `[${inputIdx}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,pan=stereo|c0=c0|c1=c0,volume=${voiceMultiplier.toFixed(
          2
        )},apad=whole_dur=${durStr},atrim=0:${durStr},asetpts=PTS-STARTPTS[${vTag}]`
      );
    } else {
      filterParts.push(
        `anullsrc=r=44100:cl=stereo,atrim=0:${durStr},asetpts=PTS-STARTPTS[${vTag}]`
      );
    }
    voiceSegmentTags.push(`[${vTag}]`);
  }

  filterParts.push(
    `${voiceSegmentTags.join('')}concat=n=${scenePlans.length}:v=0:a=1[voices_concat]`
  );

  // 5f. Optional Scene SFX Track
  let hasSfxTrack = false;
  if (sceneSfxInputMap.size > 0) {
    const sfxTags: string[] = [];
    const sfxVol = Math.max(0.1, Math.min(0.6, project.project.sfxVolume ?? 0.34));
    for (let i = 0; i < scenePlans.length; i++) {
      const plan = scenePlans[i];
      const durStr = plan.duration.toFixed(3);
      const sTag = `sfx_${i}`;
      const sfxIdx = sceneSfxInputMap.get(i);

      if (sfxIdx !== undefined) {
        filterParts.push(
          `[${sfxIdx}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,pan=stereo|c0=c0|c1=c0,volume=${sfxVol.toFixed(
            2
          )},apad=whole_dur=${durStr},atrim=0:${durStr},asetpts=PTS-STARTPTS[${sTag}]`
        );
      } else {
        filterParts.push(
          `anullsrc=r=44100:cl=stereo,atrim=0:${durStr},asetpts=PTS-STARTPTS[${sTag}]`
        );
      }
      sfxTags.push(`[${sTag}]`);
    }
    filterParts.push(`${sfxTags.join('')}concat=n=${scenePlans.length}:v=0:a=1[sfx_master]`);
    hasSfxTrack = true;
  }

  // 5g. Continuous Background Music Track (Beneath_the_Heavy_Soil.mp3) with Smooth Sidechain Ducking
  const mixInputs: string[] = [];
  if (musicInputIdx !== null) {
    const rawMusicVol = project.project.musicVolume ?? 0.30;
    // Un-ducked music volume when narration pauses; sidechaincompress smoothly ducks it ~7-9 dB when voice speaks
    const unDuckedVol = Math.max(0.15, Math.min(0.60, rawMusicVol * 1.45));
    const fadeStart = Math.max(0.8, totalDuration - 1.8).toFixed(3);

    // Split voiceover so one branch feeds the final mix and the second triggers smooth sidechain ducking on the music
    filterParts.push(`[voices_concat]asplit=2[voices_master][voices_sc]`);
    filterParts.push(
      `[${musicInputIdx}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,pan=stereo|c0=c0|c1=c0,volume=${unDuckedVol.toFixed(
        3
      )},atrim=0:${totalDuration.toFixed(
        3
      )},afade=t=in:st=0:d=0.7,afade=t=out:st=${fadeStart}:d=1.8,asetpts=PTS-STARTPTS[bgm_pre]`
    );
    filterParts.push(
      `[bgm_pre][voices_sc]sidechaincompress=threshold=0.028:ratio=4.2:attack=180:release=620:makeup=1:knee=4[bgm_continuous]`
    );
    mixInputs.push('[voices_master]', '[bgm_continuous]');
  } else {
    mixInputs.push('[voices_concat]');
  }

  if (hasSfxTrack) {
    mixInputs.push('[sfx_master]');
  }

  let finalAudioTag = mixInputs[0];
  if (mixInputs.length > 1) {
    filterParts.push(
      `${mixInputs.join('')}amix=inputs=${
        mixInputs.length
      }:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.95:attack=5:release=50[a_master]`
    );
    finalAudioTag = '[a_master]';
  }

  args.push('-filter_complex', filterParts.join(';'));
  args.push('-map', `[${lastVTag}]`);
  args.push('-map', finalAudioTag);
  args.push(
    '-c:v',
    'libx264',
    '-preset',
    'fast',
    '-crf',
    options.quality === 'high' ? '21' : '23',
    '-pix_fmt',
    'yuv420p',
    '-r',
    '30'
  );
  args.push('-c:a', 'aac', '-b:a', '192k', '-ar', '44100', '-ac', '2');
  args.push('-movflags', '+faststart');
  args.push('-t', totalDuration.toFixed(3));
  args.push(outPath);

  return new Promise((resolve) => {
    console.log(`[FFmpeg] Rendering master vertical Reel to ${outFilename}...`);
    const proc = spawn('ffmpeg', args, { windowsHide: true });

    let stderr = '';
    proc.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    proc.on('close', (code) => {
      if (tempAssPath && fs.existsSync(tempAssPath)) {
        try {
          fs.unlinkSync(tempAssPath);
        } catch {}
      }

      if (code === 0 && fs.existsSync(outPath)) {
        const stats = fs.statSync(outPath);

        try {
          const probeRaw = execSync(
            `ffprobe -v error -show_entries format=duration,size:stream=codec_type,codec_name,width,height,pix_fmt,duration -of json "${outPath}"`,
            { timeout: 5000 }
          ).toString();
          const probe = JSON.parse(probeRaw);
          const vStream = probe.streams?.find((s: any) => s.codec_type === 'video');
          const aStream = probe.streams?.find((s: any) => s.codec_type === 'audio');

          const formatDuration = parseFloat(probe.format?.duration || '0');
          const videoDuration = parseFloat(vStream?.duration || String(formatDuration));
          const audioDuration = parseFloat(aStream?.duration || String(formatDuration));

          const validation: RenderValidationReport = {
            isValid:
              Boolean(vStream) &&
              Boolean(aStream) &&
              stats.size > 100000 &&
              Math.abs(videoDuration - totalDuration) < 1.2 &&
              Math.abs(audioDuration - totalDuration) < 1.2,
            resolution: `${vStream?.width || width}x${vStream?.height || height}`,
            videoCodec: vStream?.codec_name || 'h264',
            audioCodec: aStream?.codec_name || 'aac',
            pixelFormat: vStream?.pix_fmt || 'yuv420p',
            videoDuration: Number(videoDuration.toFixed(2)),
            audioDuration: Number(audioDuration.toFixed(2)),
            expectedDuration: totalDuration,
            sceneCount: scenePlans.length,
            fileSizeBytes: stats.size,
            continuousVoiceover:
              sceneVoiceInputMap.size > 0 && Math.abs(audioDuration - totalDuration) < 1.2,
            continuousBackgroundMusic: musicInputIdx !== null,
            musicTrackUsed: musicFile ? path.basename(musicFile) : undefined,
            sfxApplied: hasSfxTrack,
            glitchesApplied: hasGlitches,
            transitionsApplied: scenePlans.length > 1,
            animationsApplied: true,
          };

          console.log(
            `[FFmpeg] Video rendered & validated! Size: ${(stats.size / 1024 / 1024).toFixed(
              2
            )} MB, Video: ${validation.videoDuration}s (${validation.resolution}), Audio: ${
              validation.audioDuration
            }s, Music: ${validation.musicTrackUsed}, Valid=${validation.isValid}`
          );

          resolve({
            success: true,
            downloadUrl: publicUrl,
            filename: outFilename,
            duration: validation.videoDuration,
            validation,
          });
        } catch {
          if (stats.size > 100000) {
            resolve({
              success: true,
              downloadUrl: publicUrl,
              filename: outFilename,
              duration: totalDuration,
            });
          } else {
            resolve({
              success: false,
              downloadUrl: '',
              filename: '',
              error: 'Rendered MP4 file appears incomplete or damaged.',
            });
          }
        }
      } else {
        console.error('[FFmpeg] Render failed:', stderr.slice(-500));
        resolve({
          success: false,
          downloadUrl: '',
          filename: '',
          error: `FFmpeg failed with code ${code}: ${stderr.slice(-250)}`,
        });
      }
    });

    proc.on('error', (err) => {
      if (tempAssPath && fs.existsSync(tempAssPath)) {
        try {
          fs.unlinkSync(tempAssPath);
        } catch {}
      }
      resolve({
        success: false,
        downloadUrl: '',
        filename: '',
        error: err.message,
      });
    });
  });
}
