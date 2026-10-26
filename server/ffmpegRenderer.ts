import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';
import { VideoProject, RenderOptions } from '../src/types/video.ts';

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
    // 1. Direct path in cwd
    path.resolve(process.cwd(), cleaned),
    // 2. Path in public directory
    path.resolve(process.cwd(), 'public', cleaned),
    // 3. Path in docs directory
    path.resolve(process.cwd(), 'docs', cleaned),
    // 4. Exact original string if absolute
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
 * Find system font for on-screen text overlays
 */
function getSystemFont(): string | null {
  const candidates = [
    'C:/Windows/Fonts/arial.ttf',
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

export async function renderVideoWithFfmpeg(
  project: VideoProject,
  options: { resolution: '720p' | '1080p'; quality: 'standard' | 'high'; format: 'mp4' }
): Promise<{ success: boolean; downloadUrl: string; filename: string; duration?: number; error?: string }> {
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
  const width = options.resolution === '720p' ? (isVertical ? 720 : 1280) : isVertical ? 1080 : 1920;
  const height = options.resolution === '720p' ? (isVertical ? 1280 : 720) : isVertical ? 1920 : 1080;

  const outDir = path.resolve(process.cwd(), 'public/generated/videos');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const safeTitle = (project.project.title || 'faceless_video')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .slice(0, 40);
  const outFilename = `${safeTitle}_${Date.now()}_${options.resolution}.mp4`;
  const outPath = path.join(outDir, outFilename);
  const publicUrl = `/generated/videos/${outFilename}`;

  // 1. Prepare Scenes and Master Timeline
  const scenes = project.scenes;
  if (!scenes || scenes.length === 0) {
    return { success: false, downloadUrl: '', filename: '', error: 'Project has no scenes.' };
  }

  const transDur = 0.45; // 450ms smooth transition between scenes

  interface ScenePlan {
    imagePath: string;
    audioPath: string | null;
    duration: number;
    startTime: number;
    text?: string;
    animation: string;
    transition: string;
  }

  const scenePlans: ScenePlan[] = [];
  let accumulatedTime = 0;

  for (let i = 0; i < scenes.length; i++) {
    const sc = scenes[i];

    // Image resolution
    let imgPath = resolveAssetPath(sc.imageUrl || `samples/dunning_kruger_${(i % 5) + 1}.jpg`);
    if (!imgPath) {
      imgPath = resolveAssetPath(`samples/sample_scene_${(i % 5) + 1}.jpg`);
    }
    if (!imgPath) {
      imgPath = path.resolve(process.cwd(), `public/samples/dunning_kruger_${(i % 5) + 1}.jpg`);
    }

    // Audio resolution
    let audPath = sc.audioUrl ? resolveAssetPath(sc.audioUrl) : null;

    // Calculate actual scene duration based on voiceover audio
    let dur = sc.duration || 5.0;
    if (audPath) {
      const realAudDur = getAudioDuration(audPath);
      if (realAudDur && realAudDur > 0) {
        // Give 0.15s natural breathing room after narration
        dur = Math.max(dur, parseFloat((realAudDur + 0.15).toFixed(2)));
      }
    }

    scenePlans.push({
      imagePath: imgPath,
      audioPath: audPath,
      duration: dur,
      startTime: parseFloat(accumulatedTime.toFixed(3)),
      text: sc.on_screen_text,
      animation: sc.animation || 'slow_zoom_in',
      transition: sc.transition || 'fade',
    });

    accumulatedTime += dur;
  }

  const totalDuration = parseFloat(accumulatedTime.toFixed(3));
  console.log(`[FFmpeg] Master timeline duration: ${totalDuration}s across ${scenePlans.length} scenes`);

  const args: string[] = ['-y'];

  // 2. Add visual inputs with extra duration handle for transitions
  for (let i = 0; i < scenePlans.length; i++) {
    const plan = scenePlans[i];
    const isLast = i === scenePlans.length - 1;
    // Add transition duration handle to all non-last clips
    const clipDur = plan.duration + (isLast ? 0 : transDur);
    args.push('-loop', '1', '-t', clipDur.toFixed(3), '-i', plan.imagePath);
  }

  // 3. Add Voice Audio Inputs
  const voiceInputs: Array<{ inputIdx: number; startMs: number }> = [];
  let nextInputIndex = scenePlans.length;

  for (let i = 0; i < scenePlans.length; i++) {
    const plan = scenePlans[i];
    if (plan.audioPath && fs.existsSync(plan.audioPath)) {
      args.push('-i', plan.audioPath);
      voiceInputs.push({
        inputIdx: nextInputIndex,
        startMs: Math.round(plan.startTime * 1000),
      });
      nextInputIndex++;
    }
  }

  // 4. Add Background Music Input
  let musicInputIdx: number | null = null;
  const musicFile =
    resolveAssetPath('music/educational-01.mp3') ||
    resolveAssetPath('public/music/educational-01.mp3') ||
    path.resolve(process.cwd(), 'public/music/educational-01.mp3');

  if (musicFile && fs.existsSync(musicFile)) {
    args.push('-stream_loop', '-1', '-i', musicFile);
    musicInputIdx = nextInputIndex;
    nextInputIndex++;
  }

  // 5. Construct Filter Graph
  const filterParts: string[] = [];
  const systemFont = getSystemFont();

  // Visual animation & scaling for each scene
  for (let i = 0; i < scenePlans.length; i++) {
    const plan = scenePlans[i];
    const isLast = i === scenePlans.length - 1;
    const D = plan.duration + (isLast ? 0 : transDur);
    const tag = `v${i}`;

    let animFilter = '';
    switch (plan.animation) {
      case 'slow_zoom_in':
        animFilter = `scale=w='${width}*(1+0.07*t/${D})':h='${height}*(1+0.07*t/${D})':eval=frame,crop=${width}:${height}:(in_w-${width})/2:(in_h-${height})/2`;
        break;
      case 'slow_zoom_out':
        animFilter = `scale=w='${width}*(1.08-0.07*t/${D})':h='${height}*(1.08-0.07*t/${D})':eval=frame,crop=${width}:${height}:(in_w-${width})/2:(in_h-${height})/2`;
        break;
      case 'pan_left':
        animFilter = `scale=1200:2133:force_original_aspect_ratio=increase,crop=${width}:${height}:x='(in_w-out_w)*(1-t/${D})':y='(in_h-out_h)/2'`;
        break;
      case 'pan_right':
        animFilter = `scale=1200:2133:force_original_aspect_ratio=increase,crop=${width}:${height}:x='(in_w-out_w)*(t/${D})':y='(in_h-out_h)/2'`;
        break;
      case 'ken_burns':
        animFilter = `scale=w='${width}*(1.03+0.06*t/${D})':h='${height}*(1.03+0.06*t/${D})':eval=frame,crop=${width}:${height}:x='(in_w-${width})*(t/${D})':y='(in_h-${height})*(1-t/${D})'`;
        break;
      default:
        animFilter = `scale=w='${width}*(1+0.05*t/${D})':h='${height}*(1+0.05*t/${D})':eval=frame,crop=${width}:${height}:(in_w-${width})/2:(in_h-${height})/2`;
    }

    // Optional on-screen text badge
    let textFilter = '';
    if (plan.text && systemFont) {
      const escapedText = plan.text.replace(/[:'\\]/g, '\\$&');
      const fontEscaped = systemFont.replace(':', '\\:');
      textFilter = `,drawtext=fontfile='${fontEscaped}':text='${escapedText}':fontsize=38:fontcolor=white:box=1:boxcolor=black@0.75:boxborderw=14:x=(w-text_w)/2:y=180`;
    }

    filterParts.push(`[${i}:v]${animFilter}${textFilter},fps=30,setsar=1[${tag}]`);
  }

  // Chain xfade transitions between scenes
  let lastVTag = 'v0';
  let currentOffset = scenePlans[0].duration;

  for (let i = 1; i < scenePlans.length; i++) {
    const nextVTag = `v${i}`;
    const outTag = i === scenePlans.length - 1 ? 'v_transitions' : `vx_${i}`;

    let xfadeType = 'fade';
    if (scenePlans[i].transition === 'slide_left') xfadeType = 'wipeleft';
    else if (scenePlans[i].transition === 'slide_right') xfadeType = 'wiperight';
    else if (scenePlans[i].transition === 'zoom') xfadeType = 'circleopen';
    else if (scenePlans[i].transition === 'crossfade' || scenePlans[i].transition === 'dissolve') xfadeType = 'dissolve';

    filterParts.push(
      `[${lastVTag}][${nextVTag}]xfade=transition=${xfadeType}:duration=${transDur}:offset=${currentOffset.toFixed(3)}[${outTag}]`
    );
    lastVTag = outTag;
    currentOffset += scenePlans[i].duration;
  }

  // Continuous Master Audio Assembly
  const voiceTags: string[] = [];
  for (let i = 0; i < voiceInputs.length; i++) {
    const vi = voiceInputs[i];
    const tag = `va_${i}`;
    filterParts.push(`[${vi.inputIdx}:a]adelay=${vi.startMs}|${vi.startMs}[${tag}]`);
    voiceTags.push(`[${tag}]`);
  }

  // Mix all voiceovers together across the master timeline
  if (voiceTags.length > 0) {
    filterParts.push(
      `${voiceTags.join('')}amix=inputs=${voiceTags.length}:duration=longest:dropout_transition=0[voices_mixed]`
    );
  }

  // Background Music (ducked + continuous across whole timeline + fade out at end)
  if (musicInputIdx !== null) {
    const musicVol = (project.project.musicVolume ?? 0.22) * 0.95;
    const fadeStart = Math.max(0, totalDuration - 1.5).toFixed(3);
    filterParts.push(
      `[${musicInputIdx}:a]volume=${musicVol.toFixed(3)},atrim=0:${totalDuration.toFixed(3)},afade=t=out:st=${fadeStart}:d=1.5[bgm_continuous]`
    );
  }

  // Combine voices and continuous background music
  let finalAudioTag = '[voices_mixed]';
  if (voiceTags.length > 0 && musicInputIdx !== null) {
    filterParts.push(
      `[voices_mixed][bgm_continuous]amix=inputs=2:duration=longest:dropout_transition=0[a_master]`
    );
    finalAudioTag = '[a_master]';
  } else if (musicInputIdx !== null) {
    finalAudioTag = '[bgm_continuous]';
  }

  args.push('-filter_complex', filterParts.join(';'));
  args.push('-map', `[${lastVTag}]`);
  args.push('-map', finalAudioTag);
  args.push('-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p');
  args.push('-c:a', 'aac', '-b:a', '192k');
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

        // Validation with ffprobe
        try {
          const probeRaw = execSync(
            `ffprobe -v error -show_entries format=duration,size:stream=codec_type,duration -of json "${outPath}"`,
            { timeout: 5000 }
          ).toString();
          const probe = JSON.parse(probeRaw);
          const actualDuration = parseFloat(probe.format?.duration || '0');
          const hasVideo = probe.streams?.some((s: any) => s.codec_type === 'video');
          const hasAudio = probe.streams?.some((s: any) => s.codec_type === 'audio');

          console.log(
            `[FFmpeg] Video rendered successfully! Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB, Duration: ${actualDuration.toFixed(2)}s, Streams: Video=${hasVideo}, Audio=${hasAudio}`
          );

          resolve({
            success: true,
            downloadUrl: publicUrl,
            filename: outFilename,
            duration: actualDuration,
          });
        } catch {
          // If ffprobe inspection fails but file exists and size > 100KB
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
        console.error('[FFmpeg] Render failed:', stderr.slice(-400));
        resolve({
          success: false,
          downloadUrl: '',
          filename: '',
          error: `FFmpeg failed with code ${code}: ${stderr.slice(-200)}`,
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
