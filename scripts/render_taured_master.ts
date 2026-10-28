import fs from 'fs';
import path from 'path';
import { TAURED_MYSTERY_PROJECT } from '../src/services/storageService.ts';
import { renderVideoWithFfmpeg } from '../server/ffmpegRenderer.ts';

async function main() {
  console.log('====================================================');
  console.log('RENDERING THE MAN WHO CAME FROM TAURED MASTER 1080p (9:16)');
  console.log('====================================================');
  console.log('Project:', TAURED_MYSTERY_PROJECT.project.title);
  console.log('Scenes count:', TAURED_MYSTERY_PROJECT.scenes.length);
  console.log('Target Resolution: 1080x1920 (9:16 vertical, 30 FPS)');
  console.log('Target Duration: 50–60 seconds');

  for (const s of TAURED_MYSTERY_PROJECT.scenes) {
    console.log(`\nScene ${s.id} (${s.on_screen_text}):`);
    console.log(`  Duration: ${s.duration}s (audio: ${s.audioDuration}s)`);
    console.log(`  Image: ${s.imageUrl}`);
    console.log(`  Audio: ${s.audioUrl}`);
    console.log(`  SFX: ${s.sfxUrl} (${s.sfxLabel})`);
    console.log(`  Animation: ${s.animation}`);
    console.log(`  Transition: ${s.transition}`);
    console.log(`  Glitch: ${s.glitchEffect || 'none'}`);
    if (s.glitchTriggers && s.glitchTriggers.length > 0) {
      console.log(`  Glitch Triggers: ${s.glitchTriggers.map(t => `${t.keywordTrigger} at ${t.timeOffset}s (${t.duration}s)`).join(', ')}`);
    }
  }

  const result = await renderVideoWithFfmpeg(TAURED_MYSTERY_PROJECT, {
    resolution: '1080p',
    quality: 'high',
    format: 'mp4',
    fastMode: true,
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
    const srcFile = path.resolve(process.cwd(), 'public/generated/videos', result.filename);
    const canonicalPublic = path.resolve(process.cwd(), 'public/generated/videos/taured_mystery_master_1080p.mp4');
    const canonicalDocs = path.resolve(process.cwd(), 'docs/generated/videos/taured_mystery_master_1080p.mp4');

    fs.copyFileSync(srcFile, canonicalPublic);
    console.log(`\n✓ Copied to public canonical location: ${canonicalPublic} (${fs.statSync(canonicalPublic).size} bytes)`);

    const docsDir = path.dirname(canonicalDocs);
    if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
    fs.copyFileSync(srcFile, canonicalDocs);
    console.log(`✓ Copied to docs canonical location: ${canonicalDocs} (${fs.statSync(canonicalDocs).size} bytes)`);
  }
}

main().catch(console.error);
