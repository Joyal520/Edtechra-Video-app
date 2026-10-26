import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { VideoProject, RenderOptions } from '../src/types/video.ts';

export async function isFfmpegAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const p = spawn('ffmpeg', ['-version']);
    p.on('error', () => resolve(false));
    p.on('close', (code) => resolve(code === 0));
  });
}

function resolveAssetPath(urlPath: string): string | null {
  if (!urlPath) return null;
  // If local public path like /samples/dunning_kruger_1.jpg or /generated/audio/...
  if (urlPath.startsWith('/')) {
    const local = path.resolve(process.cwd(), 'public', urlPath.slice(1));
    if (fs.existsSync(local)) return local;
  }
  const direct = path.resolve(process.cwd(), urlPath);
  if (fs.existsSync(direct)) return direct;
  return null;
}

export async function renderVideoWithFfmpeg(
  project: VideoProject,
  options: { resolution: '720p' | '1080p'; quality: 'standard' | 'high'; format: 'mp4' }
): Promise<{ success: boolean; downloadUrl: string; filename: string; error?: string }> {
  const hasFfmpeg = await isFfmpegAvailable();
  if (!hasFfmpeg) {
    return {
      success: false,
      downloadUrl: '',
      filename: '',
      error: 'FFmpeg is not available on the server host.',
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

  // Build inputs & filter graph
  const scenes = project.scenes;
  const args: string[] = ['-y'];

  // Add inputs: scene images
  const sceneInputs: Array<{
    imagePath: string;
    duration: number;
    audioPath: string | null;
    startTime: number;
  }> = [];

  let accumulatedTime = 0;
  for (let i = 0; i < scenes.length; i++) {
    const sc = scenes[i];
    let imgPath = resolveAssetPath(sc.imageUrl || `/samples/dunning_kruger_${(i % 5) + 1}.jpg`);
    if (!imgPath) {
      imgPath = path.resolve(process.cwd(), `public/samples/dunning_kruger_${(i % 5) + 1}.jpg`);
    }

    let audPath = sc.audioUrl ? resolveAssetPath(sc.audioUrl) : null;
    const dur = Math.max(3, sc.duration || 5);

    sceneInputs.push({
      imagePath: imgPath,
      duration: dur,
      audioPath: audPath,
      startTime: accumulatedTime,
    });
    accumulatedTime += dur;
  }

  // Add video inputs
  for (const s of sceneInputs) {
    args.push('-loop', '1', '-t', s.duration.toString(), '-i', s.imagePath);
  }

  // Add voice audio inputs
  const voiceInputIndices: Array<{ inputIdx: number; startTimeMs: number }> = [];
  let currentInputIndex = sceneInputs.length;

  for (const s of sceneInputs) {
    if (s.audioPath && fs.existsSync(s.audioPath)) {
      args.push('-i', s.audioPath);
      voiceInputIndices.push({
        inputIdx: currentInputIndex,
        startTimeMs: Math.round(s.startTime * 1000),
      });
      currentInputIndex++;
    }
  }

  // Add background music input
  let musicInputIndex: number | null = null;
  const musicFile = path.resolve(process.cwd(), 'public/music/educational-01.mp3');
  if (fs.existsSync(musicFile)) {
    args.push('-stream_loop', '-1', '-i', musicFile);
    musicInputIndex = currentInputIndex;
    currentInputIndex++;
  }

  // Filter graph construction
  const filterGraphParts: string[] = [];

  // Scale and format each video input
  const videoConcatInputs: string[] = [];
  for (let i = 0; i < sceneInputs.length; i++) {
    const vTag = `v${i}`;
    filterGraphParts.push(
      `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps=30[${vTag}]`
    );
    videoConcatInputs.push(`[${vTag}]`);
  }

  // Concat all video segments
  filterGraphParts.push(
    `${videoConcatInputs.join('')}concat=n=${sceneInputs.length}:v=1:a=0[v_out]`
  );

  // Audio mix graph
  const audioMixInputs: string[] = [];

  // Delayed voice tracks
  for (let idx = 0; idx < voiceInputIndices.length; idx++) {
    const { inputIdx, startTimeMs } = voiceInputIndices[idx];
    const audTag = `v_aud_${idx}`;
    filterGraphParts.push(
      `[${inputIdx}:a]adelay=${startTimeMs}|${startTimeMs}[${audTag}]`
    );
    audioMixInputs.push(`[${audTag}]`);
  }

  // Ducked background music
  if (musicInputIndex !== null) {
    const musicVol = (project.project.musicVolume || 0.22) * 0.9;
    filterGraphParts.push(
      `[${musicInputIndex}:a]volume=${musicVol.toFixed(3)}[bg_ducked]`
    );
    audioMixInputs.push('[bg_ducked]');
  }

  let finalAudioTag = '[0:a]';
  if (audioMixInputs.length > 0) {
    filterGraphParts.push(
      `${audioMixInputs.join('')}amix=inputs=${audioMixInputs.length}:duration=first:dropout_transition=2[a_out]`
    );
    finalAudioTag = '[a_out]';
  }

  args.push('-filter_complex', filterGraphParts.join(';'));
  args.push('-map', '[v_out]');
  if (audioMixInputs.length > 0) {
    args.push('-map', finalAudioTag);
    args.push('-c:a', 'aac', '-b:a', '192k');
  }

  args.push('-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p');
  args.push('-t', accumulatedTime.toFixed(1));
  args.push(outPath);

  return new Promise((resolve) => {
    console.log(`Starting FFmpeg render to ${outFilename}...`);
    const proc = spawn('ffmpeg', args, { windowsHide: true });

    let stderr = '';
    proc.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    proc.on('close', (code) => {
      if (code === 0 && fs.existsSync(outPath)) {
        console.log(`FFmpeg render completed: ${outFilename} (${fs.statSync(outPath).size} bytes)`);
        resolve({
          success: true,
          downloadUrl: publicUrl,
          filename: outFilename,
        });
      } else {
        console.error('FFmpeg render failed:', stderr.slice(-400));
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
