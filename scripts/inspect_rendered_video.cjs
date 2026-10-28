const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const videoPath = 'public/generated/videos/hoia_baciu_forest_master_1080p.mp4';
const qcDir = 'public/generated/videos/qc_frames';
if (!fs.existsSync(qcDir)) fs.mkdirSync(qcDir, { recursive: true });

console.log('--- DETAILED FFPROBE STREAM INSPECTION ---');
const probeJson = execSync(
  `ffprobe -v error -show_format -show_streams -print_format json "${videoPath}"`
).toString();
const probe = JSON.parse(probeJson);

const vStream = probe.streams.find(s => s.codec_type === 'video');
const aStream = probe.streams.find(s => s.codec_type === 'audio');

console.log('Video stream:');
console.log('  Codec:', vStream.codec_name, `(${vStream.profile})`);
console.log('  Resolution:', `${vStream.width}x${vStream.height}`);
console.log('  Aspect Ratio DAR:', vStream.display_aspect_ratio, 'SAR:', vStream.sample_aspect_ratio);
console.log('  Framerate:', vStream.r_frame_rate, 'fps');
console.log('  Pixel format:', vStream.pix_fmt);
console.log('  Duration:', vStream.duration, 's');

console.log('\nAudio stream:');
console.log('  Codec:', aStream.codec_name);
console.log('  Sample rate:', aStream.sample_rate, 'Hz');
console.log('  Channels:', aStream.channels, `(${aStream.channel_layout})`);
console.log('  Bitrate:', Math.round(parseInt(aStream.bit_rate || '192000') / 1000), 'kbps');
console.log('  Duration:', aStream.duration, 's');

console.log('\n--- EXTRACTING SCENE FRAMES FOR VISUAL QC ---');
const sampleTimes = [
  { scene: 1, time: '00:00:05.000', name: 'scene1_forest_aerial.jpg' },
  { scene: 2, time: '00:00:18.000', name: 'scene2_watching_path.jpg' },
  { scene: 3, time: '00:00:29.000', name: 'scene3_clearing_anomaly.jpg' },
  { scene: 4, time: '00:00:41.000', name: 'scene4_1968_photograph.jpg' },
  { scene: 5, time: '00:00:52.000', name: 'scene5_night_mystery.jpg' }
];

for (const s of sampleTimes) {
  const outFrame = path.join(qcDir, s.name);
  execSync(`ffmpeg -y -ss ${s.time} -i "${videoPath}" -vframes 1 -q:v 2 "${outFrame}"`, { stdio: 'pipe' });
  const size = fs.statSync(outFrame).size;
  console.log(`✓ Scene ${s.scene} frame extracted at ${s.time}: ${s.name} (${size} bytes)`);
}

console.log('\nQC Extraction Complete!');
