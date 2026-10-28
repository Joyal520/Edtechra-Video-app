const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sfxDir = path.resolve('public/sfx');
if (!fs.existsSync(sfxDir)) fs.mkdirSync(sfxDir, { recursive: true });

const sfxList = [
  {
    name: 'hoia_baciu_sfx_1.mp3',
    dur: 12.0,
    desc: 'Aerial Forest Wind & Morning Mist Drone',
    cmd: `ffmpeg -y -f lavfi -i "anoisesrc=c=pink:r=44100:a=0.18,lowpass=f=420,tremolo=f=0.25:d=0.35,afade=t=in:st=0:d=1.5,afade=t=out:st=10.5:d=1.5" -t 12.0 -c:a libmp3lame -b:a 192k "${path.join(sfxDir, 'hoia_baciu_sfx_1.mp3')}"`
  },
  {
    name: 'hoia_baciu_sfx_2.mp3',
    dur: 13.0,
    desc: 'Isolated Trail Ambience & Suspense Pulse',
    cmd: `ffmpeg -y -f lavfi -i "anoisesrc=c=brown:r=44100:a=0.22,lowpass=f=320,flanger=delay=8:depth=4:regen=20:speed=0.2,afade=t=in:st=0:d=1.5,afade=t=out:st=11.5:d=1.5" -t 13.0 -c:a libmp3lame -b:a 192k "${path.join(sfxDir, 'hoia_baciu_sfx_2.mp3')}"`
  },
  {
    name: 'hoia_baciu_sfx_3.mp3',
    dur: 11.0,
    desc: 'Clearing Dead Zone Sub-Bass Resonance',
    cmd: `ffmpeg -y -f lavfi -i "sine=f=46:r=44100,volume=0.30,lowpass=f=120,tremolo=f=0.18:d=0.4,afade=t=in:st=0:d=2.0,afade=t=out:st=9.0:d=2.0" -t 11.0 -c:a libmp3lame -b:a 192k "${path.join(sfxDir, 'hoia_baciu_sfx_3.mp3')}"`
  },
  {
    name: 'hoia_baciu_sfx_4.mp3',
    dur: 12.0,
    desc: '1968 Vintage Tape Hiss & Atmospheric Hum',
    cmd: `ffmpeg -y -f lavfi -i "anoisesrc=c=brown:r=44100:a=0.12,bandpass=f=1800:w=1200,volume=0.45,afade=t=in:st=0:d=1.2,afade=t=out:st=10.5:d=1.5" -t 12.0 -c:a libmp3lame -b:a 192k "${path.join(sfxDir, 'hoia_baciu_sfx_4.mp3')}"`
  },
  {
    name: 'hoia_baciu_sfx_5.mp3',
    dur: 12.0,
    desc: 'Night Forest Whispering Mist & Sub-Rumble',
    cmd: `ffmpeg -y -f lavfi -i "sine=f=52:r=44100,volume=0.28,aecho=0.8:0.88:80:0.35,afade=t=in:st=0:d=1.5,afade=t=out:st=10.0:d=2.0" -t 12.0 -c:a libmp3lame -b:a 192k "${path.join(sfxDir, 'hoia_baciu_sfx_5.mp3')}"`
  }
];

for (const s of sfxList) {
  console.log(`Generating SFX: ${s.name} (${s.desc})...`);
  execSync(s.cmd, { stdio: 'pipe' });
  console.log(`Created ${s.name}`);
}
console.log('All SFX generated successfully!');
