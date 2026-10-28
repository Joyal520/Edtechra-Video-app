const fs = require('fs');
const path = require('path');

const env = fs.readFileSync('.env', 'utf8');
const key = env.match(/OPENAI_API_KEY=(.*)/)[1].trim();

const scenes = [
  {
    id: 1,
    name: 'hoia_baciu_scene_1.png',
    prompt: 'Cinematic 9:16 vertical wide aerial drone shot looking down upon the vast Hoia-Baciu Forest in Romania. Dense dark green pine canopy stretching into the distance, morning fog and low mist blanketing the treetops, cinematic aerial perspective, cold mysterious atmosphere, dark shadows between trees, no visible people, no monsters, highly detailed photorealistic mystery documentary photography.'
  },
  {
    id: 2,
    name: 'hoia_baciu_scene_2.png',
    prompt: 'Cinematic 9:16 vertical shot of a lone traveler walking along a secluded narrow dirt trail through dense crooked trees in Hoia-Baciu Forest. The lone person appears small compared to the immense forest and towering trees. Cold hanging fog between gnarled branches, isolated atmosphere, eerie composition communicating someone or something unseen watching from the shadowy tree line, no visible monsters, moody dark cinematic lighting.'
  },
  {
    id: 3,
    name: 'hoia_baciu_scene_3.png',
    prompt: 'Cinematic 9:16 vertical view of the famous unexplained circular clearing deep inside Hoia-Baciu Forest in Romania. A large barren circular meadow where no trees grow, framed around the perimeter by strangely curved, warped, and twisted trees. Ground with sparse dry grasses, atmospheric cold fog drifting low across the circle, dark cinematic dusk lighting, real mysterious forest location, documentary realism, no fantasy tropes.'
  },
  {
    id: 4,
    name: 'hoia_baciu_scene_4.png',
    prompt: 'Cinematic 1968 historical recreation inspired by the famous 1968 Hoia-Baciu UFO photograph. A Romanian man in authentic 1960s woolen trench coat standing near pine trees looking upward with intense curiosity and astonishment toward the overcast sky. Far above the misty forest canopy in the clouds, a strange, ambiguous, blurred oval object hovers silently in the gray sky, not a cartoon saucer. 1960s archival 35mm film grain, muted vintage color palette, subtle analog photographic texture.'
  },
  {
    id: 5,
    name: 'hoia_baciu_scene_5.png',
    prompt: 'Cinematic 9:16 vertical night-time scene deep inside Hoia-Baciu Forest. An empty dirt pathway vanishes into heavy, thick white fog between dark twisted silhouettes of ancient trees. In the extreme far distance down the foggy trail, a very distant, faint, ambiguous human-like silhouette is barely perceptible through the mist, unclear whether it is a figure or an optical illusion of fog and branches, no visible monster. Cold moonlight, chilling dark mystery atmosphere.'
  }
];

async function generate() {
  const dir = path.resolve('public/generated/images');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  for (const s of scenes) {
    const outPath = path.join(dir, s.name);
    if (fs.existsSync(outPath) && fs.statSync(outPath).size > 50000) {
      console.log(`Scene ${s.id} already exists (${s.name}), skipping.`);
      continue;
    }

    console.log(`Generating Scene ${s.id}: ${s.name}...`);
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-image-1-mini',
        prompt: s.prompt + ' 9:16 vertical composition, high resolution, cinematic framing.',
        size: '1024x1536',
        n: 1
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`Error for scene ${s.id}:`, err);
      continue;
    }

    const data = await res.json();
    const item = data.data?.[0];
    if (item?.b64_json) {
      fs.writeFileSync(outPath, Buffer.from(item.b64_json, 'base64'));
      console.log(`Saved Scene ${s.id} to ${outPath} (${fs.statSync(outPath).size} bytes)`);
    } else if (item?.url) {
      const imgRes = await fetch(item.url);
      const buf = Buffer.from(await imgRes.arrayBuffer());
      fs.writeFileSync(outPath, buf);
      console.log(`Downloaded Scene ${s.id} to ${outPath} (${fs.statSync(outPath).size} bytes)`);
    }
  }
  console.log('Image generation finished!');
}

generate().catch(console.error);
