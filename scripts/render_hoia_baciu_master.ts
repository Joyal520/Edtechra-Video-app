import fs from 'fs';
import path from 'path';
import { HOIA_BACIU_FOREST_PROJECT } from '../src/services/storageService.ts';
import { renderVideoWithFfmpeg } from '../server/ffmpegRenderer.ts';

async function main() {
  console.log('====================================================');
  console.log('RENDERING HOIA-BACIU FOREST MASTER 1080p VIDEO (9:16)');
  console.log('====================================================');
  console.log('Project:', HOIA_BACIU_FOREST_PROJECT.project.title);
  console.log('Scenes count:', HOIA_BACIU_FOREST_PROJECT.scenes.length);
  console.log('Target Resolution: 1080x1920 (9:16 vertical)');

  for (const s of HOIA_BACIU_FOREST_PROJECT.scenes) {
    console.log(`\nScene ${s.id} (${s.on_screen_text}):`);
    console.log(`  Duration: ${s.duration}s (audio: ${s.audioDuration}s)`);
    console.log(`  Image: ${s.imageUrl}`);
    console.log(`  Audio: ${s.audioUrl}`);
    console.log(`  SFX: ${s.sfxUrl} (${s.sfxLabel})`);
    console.log(`  Animation: ${s.animation}`);
    console.log(`  Transition: ${s.transition}`);
    console.log(`  Glitch: ${s.glitchEffect || 'none'}`);
  }

  const result = await renderVideoWithFfmpeg(HOIA_BACIU_FOREST_PROJECT, {
    resolution: '1080p',
    quality: 'high',
    format: 'mp4',
  });

  console.log('\n--- RENDER RESULT ---');
  console.log('Success:', result.success);
  console.log('Download URL:', result.downloadUrl);
  console.log('Filename:', result.filename);
  console.log('Duration:', result.duration);
  if (result.validation) {
    console.log('\n--- FFPROBE VALIDATION REPORT ---');
    console.log('Is Valid:', result.validation.isValid);
    console.log('Resolution:', result.validation.resolution);
    console.log('Video Codec:', result.validation.videoCodec);
    console.log('Audio Codec:', result.validation.audioCodec);
    console.log('Pixel Format:', result.validation.pixelFormat);
    console.log('Video Duration:', result.validation.videoDuration, 's');
    console.log('Audio Duration:', result.validation.audioDuration, 's');
    console.log('Expected Duration:', result.validation.expectedDuration, 's');
    console.log('File Size:', (result.validation.fileSizeBytes / 1024 / 1024).toFixed(2), 'MB');
    console.log('Continuous Voiceover:', result.validation.continuousVoiceover);
    console.log('Continuous Music:', result.validation.continuousBackgroundMusic);
    console.log('Music Track:', result.validation.musicTrackUsed);
    console.log('SFX Applied:', result.validation.sfxApplied);
    console.log('Transitions Applied:', result.validation.transitionsApplied);
    console.log('Animations Applied:', result.validation.animationsApplied);
  }

  if (result.success && result.filename) {
    // Also save as canonical name hoia_baciu_forest_master_1080p.mp4 for permanent deployment
    const srcFile = path.resolve(process.cwd(), 'public/generated/videos', result.filename);
    const canonicalFile = path.resolve(process.cwd(), 'public/generated/videos/hoia_baciu_forest_master_1080p.mp4');
    fs.copyFileSync(srcFile, canonicalFile);
    console.log(`\n✓ Copied to canonical location: ${canonicalFile} (${fs.statSync(canonicalFile).size} bytes)`);
  }
}

main().catch(console.error);
