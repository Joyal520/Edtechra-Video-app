const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const env = fs.readFileSync('.env', 'utf8');
const keyMatch = env.match(/OPENAI_API_KEY=(.*)/);
if (!keyMatch) {
  console.error('OPENAI_API_KEY missing in .env');
  process.exit(1);
}
const key = keyMatch[1].trim();

const scenes = [
  {
    id: 1,
    imgName: 'taured_scene_1.png',
    audioName: 'taured_voice_1.mp3',
    sfxName: 'taured_sfx_1.mp3',
    text: 'A man arrived at an airport carrying a passport from a country called Taured. The strange part? Nobody could find Taured on the map.',
    imgPrompt: 'Cinematic 9:16 vertical 1950s international airport terminal at night. A mysterious well-dressed traveler in a dark woolen trench coat and fedora holding a worn leather suitcase and a vintage passport in hand. Atmospheric overhead airport lighting casting long shadows across polished marble floors, cold retro color palette, dramatic film noir lighting, no monsters, highly detailed historical mystery documentary photography. 9:16 vertical composition, high resolution, cinematic framing.'
  },
  {
    id: 2,
    imgName: 'taured_scene_2.png',
    audioName: 'taured_voice_2.mp3',
    sfxName: 'taured_sfx_2.mp3',
    text: 'According to the famous story, he told officials that Taured was a real country somewhere between France and Spain. But the location he pointed to was actually Andorra.',
    imgPrompt: 'Cinematic 9:16 vertical macro close-up of an old vintage passport document open on an oak desk. In weathered gold stamped typography, the country name clearly reads TAURED. Perplexed vintage immigration officials in 1950s uniforms leaning in with magnifying glasses. In the shadowy background, the mysterious traveler stands calmly with consistent features. Analog scanlines, archival photographic grain, dark moody lighting. 9:16 vertical composition, high resolution, cinematic framing.'
  },
  {
    id: 3,
    imgName: 'taured_scene_3.png',
    audioName: 'taured_voice_3.mp3',
    sfxName: 'taured_sfx_3.mp3',
    text: 'The story says officials became confused and placed him in a guarded hotel room while they investigated. The next morning, according to the legend, the mysterious man was gone.',
    imgPrompt: 'Cinematic 9:16 vertical mysterious hotel room at 3 AM. An empty unmade bed with rumpled sheets, sheer window curtains billowing gently in the night breeze from an unlocked window. On the small wooden bedside table sits an abandoned leather passport and documents. Through the cracked open door, the silhouette of a guard stands in the dimly lit hallway. Eerie film noir mystery, unexplained disappearance, no fantasy magic. 9:16 vertical composition, high resolution, cinematic framing.'
  },
  {
    id: 4,
    imgName: 'taured_scene_4.png',
    audioName: 'taured_voice_4.mp3',
    sfxName: 'taured_sfx_4.mp3',
    text: 'No reliable evidence has confirmed the popular version of this story. Some researchers connect it to a real 1950s case involving a man named John Zegrus, whose unusual passport story was later greatly expanded online.',
    imgPrompt: 'Cinematic 9:16 vertical shot of a dark forensic investigation board in an archival room. Taut red string connects vintage black-and-white documents, a weathered map of Europe with Andorra pinned and circled, an old passport photocopy, and a high-contrast silhouette portrait of a man labeled John Zegrus. Atmospheric low key lighting, archival dust, gritty documentary texture. 9:16 vertical composition, high resolution, cinematic framing.'
  },
  {
    id: 5,
    imgName: 'taured_scene_5.png',
    audioName: 'taured_voice_5.mp3',
    sfxName: 'taured_sfx_5.mp3',
    text: 'So, did a man really come from a country called Taured? The evidence suggests the famous story is probably a mystery built around a real case. But the legend remains one of the internet\'s strangest stories.',
    imgPrompt: 'Cinematic 9:16 vertical shot of an empty, desolate 1950s airport concourse late at night. In the distance down the polished hallway, the shadowy silhouette of the mysterious man recedes into thick darkness and cold mist. A vintage flight departure board reflects dimly in wet glass with the word TAURED faintly glowing and glitching. Dramatic monochrome contrast, chilling atmospheric fog, noir mystery resolution. 9:16 vertical composition, high resolution, cinematic framing.'
  }
];

async function run() {
  const imgDir = path.resolve('public/generated/images');
  const audDir = path.resolve('public/generated/audio');
  const sfxDir = path.resolve('public/sfx');
  const docsImgDir = path.resolve('docs/generated/images');
  const docsAudDir = path.resolve('docs/generated/audio');
  const docsSfxDir = path.resolve('docs/sfx');

  [imgDir, audDir, sfxDir, docsImgDir, docsAudDir, docsSfxDir].forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });

  console.log('=== [TAURED PIPELINE] STARTING ASSET GENERATION ===\n');

  // 1. Generate 5 Images (Strictly 5, reusing if already cached)
  for (const s of scenes) {
    const outImg = path.join(imgDir, s.imgName);
    if (fs.existsSync(outImg) && fs.statSync(outImg).size > 50000) {
      console.log(`[Cache] Reusing existing Scene ${s.id} image: ${s.imgName}`);
      fs.copyFileSync(outImg, path.join(docsImgDir, s.imgName));
      continue;
    }

    console.log(`[OpenAI Image] Generating Scene ${s.id} (${s.imgName})...`);
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-image-1-mini',
        prompt: s.imgPrompt,
        size: '1024x1536',
        n: 1
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`Error generating image for Scene ${s.id}:`, err);
      process.exit(1);
    }

    const data = await res.json();
    const item = data.data?.[0];
    if (item?.b64_json) {
      const buf = Buffer.from(item.b64_json, 'base64');
      fs.writeFileSync(outImg, buf);
      fs.writeFileSync(path.join(docsImgDir, s.imgName), buf);
      console.log(`✓ Saved Scene ${s.id} image (${buf.length} bytes)`);
    } else if (item?.url) {
      const imgRes = await fetch(item.url);
      const buf = Buffer.from(await imgRes.arrayBuffer());
      fs.writeFileSync(outImg, buf);
      fs.writeFileSync(path.join(docsImgDir, s.imgName), buf);
      console.log(`✓ Downloaded Scene ${s.id} image (${buf.length} bytes)`);
    }
  }

  // 2. Generate 5 Voiceover Audio Stems
  const audioReports = [];
  for (const s of scenes) {
    const outAud = path.join(audDir, s.audioName);
    if (fs.existsSync(outAud) && fs.statSync(outAud).size > 10000) {
      console.log(`[Cache] Reusing existing Scene ${s.id} audio: ${s.audioName}`);
      fs.copyFileSync(outAud, path.join(docsAudDir, s.audioName));
      const dur = parseFloat(execSync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outAud}"`
      ).toString().trim());
      audioReports.push({ id: s.id, dur, file: s.audioName });
      continue;
    }

    console.log(`[OpenAI TTS] Generating Scene ${s.id} Voiceover (${s.audioName})...`);
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: s.text,
        voice: 'onyx',
        speed: 0.96, // Calm, deliberate documentary pacing
        response_format: 'mp3'
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`Error generating audio for Scene ${s.id}:`, err);
      process.exit(1);
    }

    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(outAud, buf);
    fs.writeFileSync(path.join(docsAudDir, s.audioName), buf);

    const dur = parseFloat(execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outAud}"`
    ).toString().trim());
    audioReports.push({ id: s.id, dur, file: s.audioName });
    console.log(`✓ Saved Scene ${s.id} audio (${dur.toFixed(2)}s, ${buf.length} bytes)`);
  }

  // 3. Generate Local Atmospheric SFX
  console.log('\n[Local SFX] Synthesizing atmospheric SFX layers...');
  const sfxConfigs = [
    { id: 1, freq: 52, dur: 11, desc: 'Midnight Airport Concourse Sub-Drone' },
    { id: 2, freq: 65, dur: 12, desc: 'Forensic Investigation Tape Hiss & Drone' },
    { id: 3, freq: 44, dur: 12, desc: 'Guarded Corridor Unsettling Sub-Bass' },
    { id: 4, freq: 72, dur: 13, desc: 'Archival Board Static & Resonance' },
    { id: 5, freq: 48, dur: 12, desc: 'Terminal Fog Deep Dissolve Rumble' },
  ];

  for (const c of sfxConfigs) {
    const sfxPath = path.join(sfxDir, `taured_sfx_${c.id}.mp3`);
    if (!fs.existsSync(sfxPath)) {
      execSync(
        `ffmpeg -y -f lavfi -i "sine=frequency=${c.freq}:duration=${c.dur}" -f lavfi -i "anoisesrc=d=${c.dur}:c=pink:r=44100:a=0.015" -filter_complex "[0:a]volume=0.35[s];[1:a]volume=0.08[n];[s][n]amix=inputs=2:duration=first,afade=t=in:st=0:d=1.5,afade=t=out:st=${c.dur - 1.5}:d=1.5" -b:a 128k "${sfxPath}" 2>nul`
      );
      fs.copyFileSync(sfxPath, path.join(docsSfxDir, `taured_sfx_${c.id}.mp3`));
      console.log(`✓ Created SFX ${c.id}: ${c.desc}`);
    }
  }

  console.log('\n=== [TAURED ASSETS READY] ===');
  let totalDur = 0;
  for (const r of audioReports) {
    console.log(`Scene ${r.id}: ${r.dur.toFixed(2)}s -> ${r.file}`);
    totalDur += r.dur;
  }
  console.log(`\nTotal Calibrated Narration Duration: ${totalDur.toFixed(2)}s (Target: 50–60s)`);
}

run().catch(console.error);
