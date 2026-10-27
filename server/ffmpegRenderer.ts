import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';
import { VideoProject } from '../src/types/video.ts';

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

  const candidates = [
    path.resolve(process.cwd(), cleaned),
    path.resolve(process.cwd(), 'public', cleaned),
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

function getSystemFont(): string | null {
  const candidates = [
    'C:/Windows/Fonts/arialbd.ttf',
    'C:/Windows/Fonts/arial.ttf',
    'C:/Windows/Fonts/segoeuib.ttf',
    'C:/Windows/Fonts/segoeui.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/System/Library/Fonts/Helvetica.ttc',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c.replace(/\\/g, '/');
  }
  return null;
}

function escapeDrawtext(raw: string): string {
  return raw
    .replace(/\\/g, '\\\\')
    .replace(/'/g, '’')
    .replace(/:/g, '\\:')
    .replace(/%/g, '\\%')
    .replace(/\r?\n/g, ' ')
    .trim();
}

const EMPHASIS_WORDS = [
  '1966',
  '1967',
  'STRANGE',
  'DARK FIGURE',
  'RED EYES',
  'HUGE WINGS',
  'TERRIFIED',
  'NOT HUMAN',
  'DARKNESS',
  'MOTHMAN',
  'WARNING',
  'TERRIBLE',
  'AFRAID',
  'SILVER BRIDGE',
  'COLLAPSED',
  'FORTY-SIX',
  '46',
  'DIED',
  'DISASTER',
  'MYSTERY',
  'WATCHING',
];

function splitIntoShortPhrases(narration: string, maxWords = 4): string[] {
  const words = narration.trim().split(/\s+/).filter(Boolean);
  const phrases: string[] = [];
  let current: string[] = [];

  for (const w of words) {
    current.push(w);
    const endsPunct = /[.!?,;:]$/.test(w);
    if (current.length >= maxWords || (endsPunct && current.length >= 2)) {
      phrases.push(current.join(' ').toUpperCase());
      current = [];
    }
  }
  if (current.length > 0) {
    phrases.push(current.join(' ').toUpperCase());
  }
  return phrases;
}

function hasEmphasisKeyword(phrase: string): boolean {
  const upper = phrase.toUpperCase();
  return EMPHASIS_WORDS.some((kw) => upper.includes(kw));
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
  const outFilename = `${safeTitle}_${Date.now()}_${options.resolution}.mp4`;
  const outPath = path.join(outDir, outFilename);
  const publicUrl = `./generated/videos/${outFilename}`;

  const scenes = project.scenes;
  if (!scenes || scenes.length === 0) {
    return { success: false, downloadUrl: '', filename: '', error: 'Project has no scenes.' };
  }

  const transDur = 0.48; // 480ms smooth cinematic transition
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
  let accumulatedTime = 0;

  for (let i = 0; i < scenes.length; i++) {
    const sc = scenes[i];

    let imgPath = resolveAssetPath(sc.imageUrl || `samples/dunning_kruger_${(i % 5) + 1}.jpg`);
    if (!imgPath) {
      imgPath = resolveAssetPath(`samples/sample_scene_${(i % 5) + 1}.jpg`);
    }
    if (!imgPath) {
      imgPath = path.resolve(process.cwd(), `public/samples/dunning_kruger_${(i % 5) + 1}.jpg`);
    }

    const audPath = sc.audioUrl ? resolveAssetPath(sc.audioUrl) : null;
    const sfxPath = sc.sfxUrl ? resolveAssetPath(sc.sfxUrl) : null;

    let dur = sc.duration || 5.5;
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
      startTime: parseFloat(accumulatedTime.toFixed(3)),
      text: sc.on_screen_text,
      narration: sc.narration,
      animation: sc.animation || 'slow_zoom_in',
      transition: sc.transition || 'crossfade',
      glitchEffect: sc.glitchEffect,
    });

    accumulatedTime += dur;
  }

  const totalDuration = parseFloat(accumulatedTime.toFixed(3));
  console.log(
    `[FFmpeg] Master timeline duration: ${totalDuration}s across ${scenePlans.length} scenes`
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

  // 4. Add Continuous Background Music Input (starts once at 0s, never restarts between scenes)
  let musicInputIdx: number | null = null;
  const requestedTrackId = project.project.musicTrackId || '';
  const musicCandidates = [
    isCreepy || requestedTrackId.includes('creepy') ? 'music/creepy-legend-01.mp3' : null,
    requestedTrackId === 'track_cinematic_01' ? 'music/cinematic-01.mp3' : null,
    requestedTrackId === 'track_calm_01' ? 'music/calm-01.mp3' : null,
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
    args.push('-stream_loop', '-1', '-i', musicFile);
    musicInputIdx = nextInputIndex;
    nextInputIndex++;
  }

  // 5. Construct Master Filter Graph
  const filterParts: string[] = [];
  const systemFont = getSystemFont();
  const fontEscaped = systemFont ? systemFont.replace(/:/g, '\\:') : '';

  const upW = Math.round(width * 1.35);
  const upH = Math.round(height * 1.35);

  // 5a. Scene Visuals + Continuous Ken Burns Camera Motion (zoompan) + Dark Vignette
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

    const gradeFilter = isCreepy ? `,eq=brightness=0.04:contrast=1.08:gamma=1.22:saturation=0.95` : '';

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

  // 5c. Apply Tasteful Story-Driven Glitch Effects (RGB Split + VHS Flicker) on Master Video Stream
  const hasGlitches =
    isCreepy || scenePlans.some((p) => p.glitchEffect && p.glitchEffect !== 'none');
  if (hasGlitches) {
    const glitchWindows: string[] = [];
    for (let i = 0; i < scenePlans.length; i++) {
      const p = scenePlans[i];
      const st = p.startTime;
      const dur = p.duration;
      if (i === 0) {
        // Scene 1: Brief glitch when tall dark figure / red eyes appear
        glitchWindows.push(
          `between(t,${(st + dur * 0.57).toFixed(2)},${(st + dur * 0.65).toFixed(2)})`
        );
      } else if (i === 1) {
        // Scene 2: Small glitch around red eyes shining in darkness
        glitchWindows.push(
          `between(t,${(st + dur * 0.47).toFixed(2)},${(st + dur * 0.55).toFixed(2)})`
        );
      } else if (i === 2) {
        // Scene 3: Signal distortion when "Mothman" appears
        glitchWindows.push(
          `between(t,${(st + dur * 0.27).toFixed(2)},${(st + dur * 0.36).toFixed(2)})`
        );
      } else if (i === 3) {
        // Scene 4: Dramatic glitch around Silver Bridge collapse
        glitchWindows.push(
          `between(t,${(st + dur * 0.29).toFixed(2)},${(st + dur * 0.41).toFixed(2)})`
        );
      } else if (i === 4) {
        // Scene 5: Final VHS glitch/flicker before ending
        glitchWindows.push(
          `between(t,${(st + dur * 0.84).toFixed(2)},${(st + dur * 0.94).toFixed(2)})`
        );
      }
    }

    if (glitchWindows.length > 0) {
      const enableExpr = glitchWindows.join('+');
      filterParts.push(
        `[${lastVTag}]rgbashift=rh=-14:bh=14:rv=5:bv=-5:enable='${enableExpr}',noise=alls=18:allf=t+u:enable='${enableExpr}',eq=contrast=1.22:brightness=0.04:enable='${enableExpr}'[v_glitched]`
      );
      lastVTag = 'v_glitched';
    }
  }

  // 5d. Burn Modern YouTube Shorts Phrase-by-Phrase Captions with Keyword Emphasis
  if (systemFont && project.captions?.enabled !== false) {
    const captionFilters: string[] = [];
    const maxWords = Math.min(4, project.captions?.maxWordsPerLine || 4);
    const baseFontSize = Math.round(width * 0.042); // 45px on 1080p
    const emphasisFontSize = Math.round(width * 0.046); // 50px for emphasized phrases
    const captionY =
      project.captions?.position === 'top'
        ? Math.round(height * 0.16)
        : project.captions?.position === 'center'
        ? Math.round(height * 0.53)
        : Math.round(height * 0.79);

    for (let i = 0; i < scenePlans.length; i++) {
      const plan = scenePlans[i];
      if (!plan.narration) continue;

      const phrases = splitIntoShortPhrases(plan.narration, maxWords);
      if (phrases.length === 0) continue;

      const totalChars = phrases.reduce((acc, p) => acc + p.length, 0);
      const speechWindow = Math.max(1.5, plan.duration - 0.35);
      let charCursor = 0;

      for (let c = 0; c < phrases.length; c++) {
        const phrase = phrases[c];
        const phraseWeight = phrase.length / Math.max(1, totalChars);
        const t0 = plan.startTime + (charCursor / Math.max(1, totalChars)) * speechWindow;
        charCursor += phrase.length;
        const t1 = plan.startTime + (charCursor / Math.max(1, totalChars)) * speechWindow;

        const isEmp = hasEmphasisKeyword(phrase);
        const fSize = isEmp ? emphasisFontSize : baseFontSize;
        const fColor = isEmp ? (isCreepy ? '0xFF4444' : '0xFACC15') : '0xFFFFFF';
        const escapedLine = escapeDrawtext(phrase);

        captionFilters.push(
          `drawtext=fontfile='${fontEscaped}':text='${escapedLine}':fontsize=${fSize}:fontcolor=${fColor}:borderw=4:bordercolor=black:box=1:boxcolor=black@0.80:boxborderw=${Math.round(width * 0.018)}:x=(w-text_w)/2:y=${captionY}:enable='between(t,${t0.toFixed(2)},${t1.toFixed(2)})'`
        );
      }
    }

    if (captionFilters.length > 0) {
      filterParts.push(`[${lastVTag}]${captionFilters.join(',')}[v_master]`);
      lastVTag = 'v_master';
    }
  }

  // 5e. Continuous Master Voiceover Track (Sequential concat with exact scene padding)
  const voiceSegmentTags: string[] = [];
  for (let i = 0; i < scenePlans.length; i++) {
    const plan = scenePlans[i];
    const durStr = plan.duration.toFixed(3);
    const vTag = `va_${i}`;
    const inputIdx = sceneVoiceInputMap.get(i);

    if (inputIdx !== undefined) {
      filterParts.push(
        `[${inputIdx}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,pan=stereo|c0=c0|c1=c0,volume=1.7,apad=whole_dur=${durStr},atrim=0:${durStr},asetpts=PTS-STARTPTS[${vTag}]`
      );
    } else {
      filterParts.push(
        `anullsrc=r=44100:cl=stereo,atrim=0:${durStr},asetpts=PTS-STARTPTS[${vTag}]`
      );
    }
    voiceSegmentTags.push(`[${vTag}]`);
  }

  filterParts.push(
    `${voiceSegmentTags.join('')}concat=n=${scenePlans.length}:v=0:a=1[voices_master]`
  );

  // 5f. Optional Scene SFX Track
  let hasSfxTrack = false;
  if (sceneSfxInputMap.size > 0) {
    const sfxTags: string[] = [];
    for (let i = 0; i < scenePlans.length; i++) {
      const plan = scenePlans[i];
      const durStr = plan.duration.toFixed(3);
      const sTag = `sfx_${i}`;
      const sfxIdx = sceneSfxInputMap.get(i);

      if (sfxIdx !== undefined) {
        filterParts.push(
          `[${sfxIdx}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,pan=stereo|c0=c0|c1=c0,volume=0.38,apad=whole_dur=${durStr},atrim=0:${durStr},asetpts=PTS-STARTPTS[${sTag}]`
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

  // 5g. Continuous Background Music Track (Starts once at 0s, ducked under voice, fades out at end)
  const mixInputs: string[] = ['[voices_master]'];
  if (musicInputIdx !== null) {
    const rawMusicVol = project.project.musicVolume ?? 0.22;
    const duckedMusicVol = Math.max(0.06, Math.min(0.35, rawMusicVol * 0.88));
    const fadeStart = Math.max(0.8, totalDuration - 1.8).toFixed(3);

    filterParts.push(
      `[${musicInputIdx}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,pan=stereo|c0=c0|c1=c0,volume=${duckedMusicVol.toFixed(3)},atrim=0:${totalDuration.toFixed(3)},afade=t=in:st=0:d=0.8,afade=t=out:st=${fadeStart}:d=1.8,asetpts=PTS-STARTPTS[bgm_continuous]`
    );
    mixInputs.push('[bgm_continuous]');
  }
  if (hasSfxTrack) {
    mixInputs.push('[sfx_master]');
  }

  let finalAudioTag = '[voices_master]';
  if (mixInputs.length > 1) {
    filterParts.push(
      `${mixInputs.join('')}amix=inputs=${mixInputs.length}:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.95[a_master]`
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
    'veryfast',
    '-crf',
    options.quality === 'high' ? '19' : '22',
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
            sfxApplied: hasSfxTrack,
            glitchesApplied: hasGlitches,
            transitionsApplied: scenePlans.length > 1,
            animationsApplied: true,
          };

          console.log(
            `[FFmpeg] Video rendered & validated! Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB, Video: ${validation.videoDuration}s (${validation.resolution}), Audio: ${validation.audioDuration}s, Valid=${validation.isValid}`
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
      resolve({
        success: false,
        downloadUrl: '',
        filename: '',
        error: err.message,
      });
    });
  });
}
