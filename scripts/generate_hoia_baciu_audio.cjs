const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const env = fs.readFileSync('.env', 'utf8');
const key = env.match(/OPENAI_API_KEY=(.*)/)[1].trim();

// Calibrated to produce a punchy, atmospheric documentary narration that sums to ~54 seconds (inside 50-60s)
const narrations = [
  {
    id: 1,
    name: 'hoia_baciu_voice_1.mp3',
    text: 'In the heart of Transylvania lies the Hoia-Baciu Forest, known as the Bermuda Triangle of Romania. Locals warn of morning fog, strange disorientation, and inexplicable phenomena.'
  },
  {
    id: 2,
    name: 'hoia_baciu_voice_2.mp3',
    text: 'Step into the dense trees, and an unsettling quiet takes over. Visitors describe an overwhelming sensation that someone is watching from the shadows, while isolated paths lead hikers astray.'
  },
  {
    id: 3,
    name: 'hoia_baciu_voice_3.mp3',
    text: 'At its center lies a mysterious dead zone: an almost perfect circular clearing where no trees or plants will grow, completely baffling scientists for decades.'
  },
  {
    id: 4,
    name: 'hoia_baciu_voice_4.mp3',
    text: 'In 1968, a military technician photographed an ambiguous hovering object above the clearing. Decades later, historians and skeptics still ask: what did he see?'
  },
  {
    id: 5,
    name: 'hoia_baciu_voice_5.mp3',
    text: 'At night, the forest vanishes into thick cold fog, where distant silhouettes appear and dissolve into the shadows. Science offers no answers, and the mystery continues.'
  }
];

async function generateCalibratedAudio() {
  const dir = path.resolve('public/generated/audio');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const results = [];

  for (const n of narrations) {
    const outPath = path.join(dir, n.name);
    console.log(`Generating Voiceover ${n.id}: ${n.name}...`);
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: n.text,
        voice: 'onyx',
        speed: 0.94, // Calm, deliberate documentary cadence
        response_format: 'mp3'
      })
    });

    if (!res.ok) {
      console.error(`Error for audio ${n.id}:`, await res.text());
      continue;
    }

    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(outPath, buf);

    const durRaw = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outPath}"`
    ).toString().trim();
    const dur = parseFloat(durRaw);

    results.push({ id: n.id, file: n.name, duration: dur, text: n.text });
    console.log(`Saved Voiceover ${n.id}: ${n.name} (${dur.toFixed(2)}s, ${buf.length} bytes)`);
  }

  console.log('\n--- CALIBRATED AUDIO REPORT ---');
  let totalDur = 0;
  for (const r of results) {
    console.log(`Scene ${r.id}: ${r.duration.toFixed(2)}s -> "${r.text}"`);
    totalDur += r.duration;
  }
  console.log(`Total voiceover duration: ${totalDur.toFixed(2)}s`);
}

generateCalibratedAudio().catch(console.error);
