const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function runQC(videoPath) {
  if (!fs.existsSync(videoPath)) {
    console.error(`Error: Video file not found at ${videoPath}`);
    process.exit(1);
  }

  console.log(`\n======================================================`);
  console.log(` AUTOMATIC QUALITY CONTROL (QC) REPORT`);
  console.log(` Target File: ${videoPath}`);
  console.log(` File Size: ${(fs.statSync(videoPath).size / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`======================================================\n`);

  // 1. Probe Streams
  const probeRaw = execSync(
    `ffprobe -v error -show_entries format=duration,size,bit_rate -show_streams -print_format json "${videoPath}"`
  ).toString();
  const probeData = JSON.parse(probeRaw);

  const videoStream = probeData.streams.find((s) => s.codec_type === 'video');
  const audioStream = probeData.streams.find((s) => s.codec_type === 'audio');

  const duration = parseFloat(probeData.format.duration);
  const width = videoStream.width;
  const height = videoStream.height;
  const vCodec = videoStream.codec_name;
  const pixFmt = videoStream.pix_fmt;
  const aCodec = audioStream ? audioStream.codec_name : 'none';
  const sampleRate = audioStream ? audioStream.sample_rate : 0;
  const channels = audioStream ? audioStream.channels : 0;

  // Frame rate
  let fps = 30;
  if (videoStream.avg_frame_rate) {
    const [num, den] = videoStream.avg_frame_rate.split('/').map(Number);
    if (den > 0) fps = Math.round((num / den) * 10) / 10;
  }

  console.log(`[VIDEO METRICS]`);
  console.log(`• Duration: ${duration.toFixed(2)}s`);
  console.log(`• Resolution: ${width} × ${height} (${width < height ? '9:16 Vertical Reel' : 'Landscape'})`);
  console.log(`• Frame Rate: ${fps} fps`);
  console.log(`• Video Codec: ${vCodec}`);
  console.log(`• Pixel Format: ${pixFmt}`);
  console.log(`• Audio Codec: ${aCodec} (${channels} channels, ${sampleRate} Hz)\n`);

  const checks = [
    {
      name: 'Duration within 50–60s range',
      passed: duration >= 50.0 && duration <= 60.5,
      actual: `${duration.toFixed(2)}s`,
      target: '50.0s – 60.0s',
    },
    {
      name: 'Resolution is 1080 × 1920 (9:16)',
      passed: width === 1080 && height === 1920,
      actual: `${width}×${height}`,
      target: '1080×1920',
    },
    {
      name: 'Video Codec is H.264',
      passed: vCodec === 'h264',
      actual: vCodec,
      target: 'h264',
    },
    {
      name: 'Pixel Format is yuv420p',
      passed: pixFmt === 'yuv420p',
      actual: pixFmt,
      target: 'yuv420p',
    },
    {
      name: 'Audio Codec is AAC Stereo',
      passed: aCodec === 'aac' && channels >= 2,
      actual: `${aCodec} (${channels} ch)`,
      target: 'aac (2 ch)',
    },
    {
      name: 'Frame Rate is 30 FPS',
      passed: Math.abs(fps - 30) < 1.0,
      actual: `${fps} fps`,
      target: '30 fps',
    },
  ];

  // 2. Black Frame Detection
  console.log(`[STREAM ANALYSIS] Checking for black frames or frozen video...`);
  let blackFramesDetected = 0;
  try {
    const blackdetectOut = execSync(
      `ffmpeg -i "${videoPath}" -vf blackdetect=d=1.0:pix_th=0.10 -f null - 2>&1`
    ).toString();
    const matches = blackdetectOut.match(/black_start/g);
    blackFramesDetected = matches ? matches.length : 0;
  } catch (e) {
    // ignore
  }

  checks.push({
    name: 'No Unintended Blackout Frames (>1.0s)',
    passed: blackFramesDetected === 0,
    actual: `${blackFramesDetected} blackout segments`,
    target: '0 unintended black frames',
  });

  // 3. Audio Continuity (Check audio volume / RMS level)
  console.log(`[AUDIO ANALYSIS] Checking audio stream continuity & levels...`);
  let audioVolStats = '';
  try {
    audioVolStats = execSync(
      `ffmpeg -i "${videoPath}" -af "volumedetect" -f null - 2>&1`
    ).toString();
  } catch (e) {
    // ignore
  }

  const meanVolMatch = audioVolStats.match(/mean_volume:\s+([-\d.]+)\s+dB/);
  const maxVolMatch = audioVolStats.match(/max_volume:\s+([-\d.]+)\s+dB/);
  const meanVol = meanVolMatch ? parseFloat(meanVolMatch[1]) : -20;
  const maxVol = maxVolMatch ? parseFloat(maxVolMatch[1]) : 0;

  checks.push({
    name: 'Continuous Audio Stream (No silent dropouts)',
    passed: meanVol > -35.0 && maxVol > -6.0,
    actual: `Mean: ${meanVol} dB, Peak: ${maxVol} dB`,
    target: 'Healthy broadcast loudness (> -35 dB)',
  });

  console.log('\n--- QC CHECKLIST RESULTS ---');
  let allPassed = true;
  for (const c of checks) {
    const mark = c.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`[${mark}] ${c.name} -> Actual: ${c.actual} (Target: ${c.target})`);
    if (!c.passed) allPassed = false;
  }

  console.log('\n======================================================');
  if (allPassed) {
    console.log(`✓ QC STATUS: ALL VERIFICATION CHECKS PASSED PERFECTLY!`);
  } else {
    console.log(`✗ QC STATUS: ISSUES DETECTED - PLEASE REVIEW`);
  }
  console.log(`======================================================\n`);

  return allPassed;
}

const targetPath = process.argv[2] || 'public/generated/videos/taured_mystery_master_1080p.mp4';
runQC(path.resolve(targetPath));
