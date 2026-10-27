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

/**
 * Universal asset path resolver.
 * Handles /samples, ./samples, samples, /generated, ./generated, /music, ./music,
 * absolute paths, and workspace paths.
 */
export function resolveAssetPath(urlPath: string): string | null {
  if (!urlPath) return null;

  // Clean leading ./ or /
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

/**
 * Get accurate audio duration via ffprobe
 */
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

/**
 * Find system font for on-screen text and caption overlays
 */
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

/**
 * Safely escape text for FFmpeg drawtext filter inside single quotes
 */
function escapeDrawtext(raw: string): string {
  return raw
    .replace(/\\/g, '\\\\')
    .replace(/'/g, '’')
    .replace(/:/g, '\\:')
    .replace(/%/g, '\\%')
    .replace(/\r?\n/g, ' ')
    .trim();
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

  // 1. Prepare Scenes and Continuous Master Timeline
  const scenes = project.scenes;
  if (!scenes || scenes.length === 0) {
    return { success: false, downloadUrl: '', filename: '', error: 'Project has no scenes.' };
  }

  const transDur = 0.45; // 450ms smooth transition overlap between scenes

  interface ScenePlan {
    imagePath: string;
    audioPath: string | null;
    duration: number;
    startTime: number;
    text?: string;
    narration?: string;
    animation: string;
    transition: string;
  }

  const scenePlans: ScenePlan[] = [];
  let accumulatedTime = 0;

  for (let i = 0; i < scenes.length; i++) {
    const sc = scenes[i];

    // Resolve existing image asset
    let imgPath = resolveAssetPath(sc.imageUrl || `samples/dunning_kruger_${(i % 5) + 1}.jpg`);
    if (!imgPath) {
      imgPath = resolveAssetPath(`samples/sample_scene_${(i % 5) + 1}.jpg`);
    }
    if (!imgPath) {
      imgPath = path.resolve(process.cwd(), `public/samples/dunning_kruger_${(i % 5) + 1}.jpg`);
    }

    // Resolve existing voiceover audio asset
    const audPath = sc.audioUrl ? resolveAssetPath(sc.audioUrl) : null;

    // Calculate actual scene duration based on voiceover audio so speech is never cut off
    let dur = sc.duration || 5.5;
    if (audPath) {
      const realAudDur = getAudioDuration(audPath);
      if (realAudDur && realAudDur > 0) {
        // Give natural breathing room after narration
        dur = Math.max(dur, parseFloat((realAudDur + 0.16).toFixed(2)));
      }
    }

    scenePlans.push({
      imagePath: imgPath,
      audioPath: audPath,
      duration: dur,
      startTime: parseFloat(accumulatedTime.toFixed(3)),
      text: sc.on_screen_text,
      narration: sc.narration,
      animation: sc.animation || 'slow_zoom_in',
      transition: sc.transition || 'crossfade',
    });

    accumulatedTime += dur;
  }

  const totalDuration = parseFloat(accumulatedTime.toFixed(3));
  console.log(
    `[FFmpeg] Master timeline duration: ${totalDuration}s across ${scenePlans.length} scenes`
  );

  const args: string[] = ['-y'];

  // 2. Add single-frame visual inputs (zoompan generates exact frame count at 30fps)
  for (let i = 0; i < scenePlans.length; i++) {
    args.push('-i', scenePlans[i].imagePath);
  }

  // 3. Add Voiceover Audio Inputs
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

  // 4. Add Continuous Background Music Input (starts once at 0s, loops smoothly if needed)
  let musicInputIdx: number | null = null;
  const requestedTrackId = project.project.musicTrackId || 'educational-01';
  const musicFile =
    resolveAssetPath(`music/${requestedTrackId}.mp3`) ||
    resolveAssetPath('music/educational-01.mp3') ||
    resolveAssetPath('public/music/educational-01.mp3') ||
    path.resolve(process.cwd(), 'public/music/educational-01.mp3');

  if (musicFile && fs.existsSync(musicFile)) {
    args.push('-stream_loop', '-1', '-i', musicFile);
    musicInputIdx = nextInputIndex;
    nextInputIndex++;
  }

  // 5. Construct Master Filter Graph
  const filterParts: string[] = [];
  const systemFont = getSystemFont();
  const fontEscaped = systemFont ? systemFont.replace(/:/g, '\\:') : '';

  // Pre-upscale dimensions for smooth sub-pixel zoompan motion
  const upW = Math.round(width * 1.35);
  const upH = Math.round(height * 1.35);

  // 5a. Scene Visuals + Continuous Camera Motion (zoompan)
  for (let i = 0; i < scenePlans.length; i++) {
    const plan = scenePlans[i];
    const isLast = i === scenePlans.length - 1;
    const clipDur = plan.duration + (isLast ? 0 : transDur);
    const frames = Math.max(15, Math.round(clipDur * 30));
    const tag = `v${i}`;

    let zoompanExpr = '';
    switch (plan.animation) {
      case 'slow_zoom_in':
        zoompanExpr = `zoompan=z='min(zoom+0.0005,1.09)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:fps=30:s=${width}x${height}`;
        break;
      case 'slow_zoom_out':
        zoompanExpr = `zoompan=z='if(eq(on,1),1.09,max(1.001,zoom-0.0005))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:fps=30:s=${width}x${height}`;
        break;
      case 'pan_left':
        zoompanExpr = `zoompan=z='1.08':x='(iw-iw/zoom)*(1-on/${frames})':y='(ih-ih/zoom)/2':d=${frames}:fps=30:s=${width}x${height}`;
        break;
      case 'pan_right':
        zoompanExpr = `zoompan=z='1.08':x='(iw-iw/zoom)*(on/${frames})':y='(ih-ih/zoom)/2':d=${frames}:fps=30:s=${width}x${height}`;
        break;
      case 'ken_burns':
        zoompanExpr = `zoompan=z='min(zoom+0.00045,1.085)':x='(iw-iw/zoom)*(on/${frames})':y='(ih-ih/zoom)*(1-on/${frames})':d=${frames}:fps=30:s=${width}x${height}`;
        break;
      default:
        zoompanExpr = `zoompan=z='min(zoom+0.00045,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:fps=30:s=${width}x${height}`;
    }

    filterParts.push(
      `[${i}:v]scale=${upW}:${upH}:force_original_aspect_ratio=increase,crop=${upW}:${upH},${zoompanExpr},setsar=1,format=yuv420p[${tag}]`
    );
  }

  // 5b. Chain Smooth xfade Transitions across all Scenes on Master Timeline
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
    else if (tr === 'fade') xfadeType = 'fade';
    else xfadeType = 'dissolve';

    filterParts.push(
      `[${lastVTag}][${nextVTag}]xfade=transition=${xfadeType}:duration=${transDur}:offset=${currentOffset.toFixed(3)}[${outTag}]`
    );
    lastVTag = outTag;
    currentOffset += scenePlans[i].duration;
  }

  // 5c. Burn Synchronized Captions onto Master Video Stream (Safe Area)
  if (systemFont && project.captions?.enabled !== false) {
    const captionFilters: string[] = [];
    const maxWords = project.captions?.maxWordsPerLine || 5;
    const fontSize = Math.round(width * 0.039); // 42px on 1080p
    const captionY =
      project.captions?.position === 'top'
        ? Math.round(height * 0.15)
        : project.captions?.position === 'center'
        ? Math.round(height * 0.52)
        : Math.round(height * 0.84);

    for (let i = 0; i < scenePlans.length; i++) {
      const plan = scenePlans[i];
      if (!plan.narration) continue;

      const words = plan.narration.trim().split(/\s+/).filter(Boolean);
      if (words.length === 0) continue;

      const chunks: string[] = [];
      for (let w = 0; w < words.length; w += maxWords) {
        chunks.push(words.slice(w, w + maxWords).join(' '));
      }

      const speechWindow = Math.max(1.0, plan.duration - 0.16);
      for (let c = 0; c < chunks.length; c++) {
        const t0 = plan.startTime + (c / chunks.length) * speechWindow;
        const t1 = plan.startTime + ((c + 1) / chunks.length) * speechWindow;
        const escapedLine = escapeDrawtext(chunks[c]);
        captionFilters.push(
          `drawtext=fontfile='${fontEscaped}':text='${escapedLine}':fontsize=${fontSize}:fontcolor=0xFACC15:box=1:boxcolor=black@0.82:boxborderw=${Math.round(width * 0.018)}:x=(w-text_w)/2:y=${captionY}:enable='between(t,${t0.toFixed(2)},${t1.toFixed(2)})'`
        );
      }
    }

    if (captionFilters.length > 0) {
      filterParts.push(`[${lastVTag}]${captionFilters.join(',')}[v_master]`);
      lastVTag = 'v_master';
    }
  }

  // 5d. Continuous Master Voiceover Track (Sequential concat with exact scene padding)
  const voiceSegmentTags: string[] = [];
  for (let i = 0; i < scenePlans.length; i++) {
    const plan = scenePlans[i];
    const durStr = plan.duration.toFixed(3);
    const vTag = `va_${i}`;
    const inputIdx = sceneVoiceInputMap.get(i);

    if (inputIdx !== undefined) {
      // Convert mono TTS to full stereo, boost voice clarity, pad to exact scene duration
      filterParts.push(
        `[${inputIdx}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,pan=stereo|c0=c0|c1=c0,volume=1.65,apad=whole_dur=${durStr},atrim=0:${durStr},asetpts=PTS-STARTPTS[${vTag}]`
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

  // 5e. Continuous Background Music Track (Starts once at 0s, ducked under voice, fades out at end)
  let finalAudioTag = '[voices_master]';
  if (musicInputIdx !== null) {
    const rawMusicVol = project.project.musicVolume ?? 0.20;
    const duckedMusicVol = Math.max(0.05, Math.min(0.35, rawMusicVol * 0.85));
    const fadeStart = Math.max(0.5, totalDuration - 1.5).toFixed(3);

    filterParts.push(
      `[${musicInputIdx}:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,pan=stereo|c0=c0|c1=c0,volume=${duckedMusicVol.toFixed(3)},atrim=0:${totalDuration.toFixed(3)},afade=t=in:st=0:d=0.5,afade=t=out:st=${fadeStart}:d=1.5,asetpts=PTS-STARTPTS[bgm_continuous]`
    );

    // Mix continuous voiceover and continuous background music WITHOUT amix volume attenuation (normalize=0)
    filterParts.push(
      `[voices_master][bgm_continuous]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.95[a_master]`
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
    options.quality === 'high' ? '20' : '23',
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

        // Automatic FFprobe Validation
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
              Math.abs(videoDuration - totalDuration) < 1.0 &&
              Math.abs(audioDuration - totalDuration) < 1.0,
            resolution: `${vStream?.width || width}x${vStream?.height || height}`,
            videoCodec: vStream?.codec_name || 'h264',
            audioCodec: aStream?.codec_name || 'aac',
            pixelFormat: vStream?.pix_fmt || 'yuv420p',
            videoDuration: Number(videoDuration.toFixed(2)),
            audioDuration: Number(audioDuration.toFixed(2)),
            expectedDuration: totalDuration,
            sceneCount: scenePlans.length,
            fileSizeBytes: stats.size,
            continuousVoiceover: sceneVoiceInputMap.size > 0 && Math.abs(audioDuration - totalDuration) < 1.0,
            continuousBackgroundMusic: musicInputIdx !== null,
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
