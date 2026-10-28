const fs = require('fs');

// 1. Task-57: 5 requests to gpt-4o-mini (detail: low)
const task57Prompt = 'Which Hoia-Baciu scene does this image match? Options: [SCENE 1: Wide aerial view of Hoia-Baciu forest with morning fog], [SCENE 2: Lone person walking through dense trees, someone watching], [SCENE 3: The famous circular clearing inside the forest with twisted trees], [SCENE 4: 1968 photograph recreation with Romanian man looking at sky / strange object], [SCENE 5: Night-time forest empty path into fog with distant ambiguous silhouette]. Reply with just the matched scene option and a 5-word description.';

const task57Outputs = [
  'None of the provided scenes match.',
  'None of the scenes match.',
  'None of the provided scenes match.',
  'None of the scenes match.',
  'None of the scenes match.'
];

// 2. Task-65: 3 requests before cancellation to gpt-4o-mini (detail: low)
const task65Prompt = 'Describe in 1 sentence what is in this image.';
const task65Outputs = [
  'The image features a cute, illustrated girl holding a guitar, surrounded by floral designs, with the text "1. This is easy!" above her.',
  'The image depicts a young girl sitting at a desk with books and sheets of music, surrounded by musical notes and flowers, emphasizing the theme of learning.',
  'The image depicts a girl sitting with a guitar, surrounded by a mountain of music sheets labeled with various music theory topics, conveying a humorous insight about the complexity of musical knowledge.'
];

// 3. Step 108: 1 request to dall-e-3 (HTTP 400 invalid model - not billed)
const step108Prompt = 'A wide aerial view of the enormous Hoia-Baciu Forest in Romania with morning fog covering the dark green treetops, cinematic aerial perspective, cold mysterious atmosphere, vertical 9:16 aspect ratio';

// 4. Task-113: 1 test request to gpt-image-1-mini
// Actual usage logged: input_tokens: 47, output_tokens: 1584, total_tokens: 1631

// 5. Step 119: 1 test request to tts-1
const step119Text = 'In the heart of Transylvania lies the Hoia-Baciu Forest, known as the Bermuda Triangle of Romania.';

// 6. Task-140: 2 test requests to tts-1 (onyx & fable)
const task140Text = 'In the heart of Transylvania lies the Hoia-Baciu Forest, known worldwide as the Bermuda Triangle of Romania. For generations, locals have warned of dense fog, sudden disorientation, and unexplained phenomena.';

// 7. Task-149: 5 PRODUCTION image requests to gpt-image-1-mini (1024x1536)
const task149Prompts = [
  'Cinematic 9:16 vertical wide aerial drone shot looking down upon the vast Hoia-Baciu Forest in Romania. Dense dark green pine canopy stretching into the distance, morning fog and low mist blanketing the treetops, cinematic aerial perspective, cold mysterious atmosphere, dark shadows between trees, no visible people, no monsters, highly detailed photorealistic mystery documentary photography. 9:16 vertical composition, high resolution, cinematic framing.',
  'Cinematic 9:16 vertical shot of a lone traveler walking along a secluded narrow dirt trail through dense crooked trees in Hoia-Baciu Forest. The lone person appears small compared to the immense forest and towering trees. Cold hanging fog between gnarled branches, isolated atmosphere, eerie composition communicating someone or something unseen watching from the shadowy tree line, no visible monsters, moody dark cinematic lighting. 9:16 vertical composition, high resolution, cinematic framing.',
  'Cinematic 9:16 vertical view of the famous unexplained circular clearing deep inside Hoia-Baciu Forest in Romania. A large barren circular meadow where no trees grow, framed around the perimeter by strangely curved, warped, and twisted trees. Ground with sparse dry grasses, atmospheric cold fog drifting low across the circle, dark cinematic dusk lighting, real mysterious forest location, documentary realism, no fantasy tropes. 9:16 vertical composition, high resolution, cinematic framing.',
  'Cinematic 1968 historical recreation inspired by the famous 1968 Hoia-Baciu UFO photograph. A Romanian man in authentic 1960s woolen trench coat standing near pine trees looking upward with intense curiosity and astonishment toward the overcast sky. Far above the misty forest canopy in the clouds, a strange, ambiguous, blurred oval object hovers silently in the gray sky, not a cartoon saucer. 1960s archival 35mm film grain, muted vintage color palette, subtle analog photographic texture. 9:16 vertical composition, high resolution, cinematic framing.',
  'Cinematic 9:16 vertical night-time scene deep inside Hoia-Baciu Forest. An empty dirt pathway vanishes into heavy, thick white fog between dark twisted silhouettes of ancient trees. In the extreme far distance down the foggy trail, a very distant, faint, ambiguous human-like silhouette is barely perceptible through the mist, unclear whether it is a figure or an optical illusion of fog and branches, no visible monster. Cold moonlight, chilling dark mystery atmosphere. 9:16 vertical composition, high resolution, cinematic framing.'
];

// 8. Task-159: 5 DRAFT voiceover requests to tts-1 (74.66s draft)
const task159Texts = [
  'In the heart of Transylvania lies the Hoia-Baciu Forest, known worldwide as the Bermuda Triangle of Romania. For generations, travelers have warned of dense morning fog, sudden disorientation, and inexplicable phenomena.',
  'Step into the trees, and an unsettling quiet takes over. Visitors describe an overwhelming sensation that someone is watching from the shadows, while isolated paths seem to shift and lead hikers astray.',
  'Deep inside the forest lies an unexplained anomaly: an almost perfect circular clearing where vegetation refuses to grow. Scientists have tested the soil for decades, yet found no reason why this circle remains barren.',
  'In 1968, a military technician photographed an ambiguous metallic object hovering silently above the clearing. The image became one of the most debated photographs in history, leaving the world asking: what did he see?',
  'As night falls, the forest path disappears into an impenetrable wall of mist. Travelers still report distant silhouettes vanishing before their eyes. Science offers no answers, and the mystery of Hoia-Baciu continues.'
];

// 9. Task-178: 5 PRODUCTION voiceover requests to tts-1 (56.93s calibrated final)
const task178Texts = [
  'In the heart of Transylvania lies the Hoia-Baciu Forest, known as the Bermuda Triangle of Romania. Locals warn of morning fog, strange disorientation, and inexplicable phenomena.',
  'Step into the dense trees, and an unsettling quiet takes over. Visitors describe an overwhelming sensation that someone is watching from the shadows, while isolated paths lead hikers astray.',
  'At its center lies a mysterious dead zone: an almost perfect circular clearing where no trees or plants will grow, completely baffling scientists for decades.',
  'In 1968, a military technician photographed an ambiguous hovering object above the clearing. Decades later, historians and skeptics still ask: what did he see?',
  'At night, the forest vanishes into thick cold fog, where distant silhouettes appear and dissolve into the shadows. Science offers no answers, and the mystery continues.'
];

// 10. Task-362: 5 Vision QC requests to gpt-4o-mini (detail: low)
const task362Prompt = 'Analyze this rendered 9:16 video frame. 1) What is visible in the scene? 2) Is the caption clearly visible, formatted in bold modern uppercase with contrast box, and properly inside the vertical safe zone? 3) Does it look like a high quality cinematic mystery Reel?';
const task362Log = fs.readFileSync('C:/Users/hecsb/.gemini/antigravity/brain/7c5d1a9c-a4b4-4d23-a297-cc2d6e328e76/.system_generated/tasks/task-362.log', 'utf8');

console.log('=== DATA REPORT ===');
console.log('Task 119 TTS characters:', step119Text.length);
console.log('Task 140 TTS characters:', task140Text.length * 2, `(${task140Text.length} x 2)`);
console.log('Task 159 Draft TTS total characters:', task159Texts.reduce((acc, t) => acc + t.length, 0));
task159Texts.forEach((t, i) => console.log(`  Draft Scene ${i+1}: ${t.length} chars`));

console.log('Task 178 Production TTS total characters:', task178Texts.reduce((acc, t) => acc + t.length, 0));
task178Texts.forEach((t, i) => console.log(`  Prod Scene ${i+1}: ${t.length} chars`));

console.log('\nTask 149 Production Images Prompts:');
task149Prompts.forEach((p, i) => console.log(`  Prod Scene ${i+1}: ${p.length} chars, ~${Math.round(p.length / 4)} tokens`));
