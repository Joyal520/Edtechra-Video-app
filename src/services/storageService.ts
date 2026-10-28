import { VideoProject } from '../types/video';

const STORAGE_KEY = 'faceless_ai_video_projects';
const ACTIVE_PROJECT_ID_KEY = 'faceless_active_project_id';

// Mystery Documentary Video: The Man Who Came From Taured (5 Scenes, ~57.6s Master Timeline, 9:16 Vertical Reel)
export const TAURED_MYSTERY_PROJECT: VideoProject = {
  id: 'project_taured_mystery_legend',
  createdAt: '2026-10-28T08:00:00.000Z',
  updatedAt: new Date().toISOString(),
  status: 'ready',
  originalTopic:
    'The Man Who Came From Taured: The mysterious traveler at Tokyo airport, the impossible passport, the guarded hotel room, and the John Zegrus connection',
  thumbnailUrl: './generated/images/taured_scene_1.png',
  exportedVideoUrl: './generated/videos/taured_mystery_master_1080p.mp4',
  project: {
    title: 'The Man Who Came From Taured',
    description:
      'A cinematic faceless mystery documentary exploring the legend of a mysterious traveler with a passport from a nonexistent country called Taured, and the real 1950s case behind the story.',
    aspect_ratio: '9:16',
    resolution: '1080x1920',
    fps: 30,
    style: 'creepy_legend',
    presetId: 'historical_mystery',
    language: 'English',
    total_duration: 58.4,
    voiceId: 'male_educational',
    musicTrackId: 'track_beneath_the_heavy_soil',
    musicVolume: 0.28,
    voiceVolume: 1.0,
    sfxVolume: 0.32,
    fastMode: true,
  },
  captions: {
    enabled: true,
    style: 'POP',
    fontSize: 'lg',
    position: 'bottom',
    textColor: '#ffffff',
    highlightColor: '#ff3b3b',
    backgroundColor: 'rgba(6, 6, 10, 0.84)',
    maxWordsPerLine: 3,
  },
  scenes: [
    {
      id: 1,
      duration: 8.85,
      audioDuration: 8.57,
      narration:
        'A man arrived at an airport carrying a passport from a country called Taured. The strange part? Nobody could find Taured on the map.',
      image_prompt:
        'Cinematic 9:16 vertical 1950s international airport terminal at night. A mysterious well-dressed traveler in a dark woolen trench coat and fedora holding a worn leather suitcase and a vintage passport in hand. Atmospheric overhead airport lighting casting long shadows across polished marble floors, cold retro color palette, dramatic film noir lighting, no monsters, highly detailed historical mystery documentary photography.',
      on_screen_text: 'A PASSPORT FROM TAURED',
      animation: 'slow_zoom_in',
      transition: 'crossfade',
      glitchEffect: 'rgb_split',
      glitchTriggers: [
        { timeOffset: 4.2, duration: 0.38, effect: 'rgb_split', intensity: 0.60, keywordTrigger: 'TAURED' },
      ],
      imageUrl: './generated/images/taured_scene_1.png',
      audioUrl: './generated/audio/taured_voice_1.mp3',
      sfxUrl: './sfx/taured_sfx_1.mp3',
      sfxLabel: '1950s Airport Ambient Tannoy & Sub-Bass Drone',
      imageSourceType: 'ai',
      cropMode: 'cover',
    },
    {
      id: 2,
      duration: 11.25,
      audioDuration: 10.97,
      narration:
        'According to the famous story, he told officials that Taured was a real country somewhere between France and Spain. But the location he pointed to was actually Andorra.',
      image_prompt:
        'Cinematic 9:16 vertical macro close-up of an old vintage passport document open on an oak desk. In weathered gold stamped typography, the country name clearly reads TAURED. Perplexed vintage immigration officials in 1950s uniforms leaning in with magnifying glasses. In the shadowy background, the mysterious traveler stands calmly with consistent features. Analog scanlines, archival photographic grain, dark moody lighting.',
      on_screen_text: 'TAURED? NOT ON THE MAP',
      animation: 'slow_zoom_in',
      transition: 'film_dissolve',
      glitchEffect: 'vhs_flicker',
      glitchTriggers: [
        { timeOffset: 3.6, duration: 0.42, effect: 'vhs_flicker', intensity: 0.55, keywordTrigger: 'TAURED' },
        { timeOffset: 8.9, duration: 0.38, effect: 'rgb_split', intensity: 0.65, keywordTrigger: 'ANDORRA' },
      ],
      imageUrl: './generated/images/taured_scene_2.png',
      audioUrl: './generated/audio/taured_voice_2.mp3',
      sfxUrl: './sfx/taured_sfx_2.mp3',
      sfxLabel: 'Analog Tape Hiss & Forensic Paper Shuffle',
      imageSourceType: 'ai',
      cropMode: 'cover',
    },
    {
      id: 3,
      duration: 11.50,
      audioDuration: 11.21,
      narration:
        'The story says officials became confused and placed him in a guarded hotel room while they investigated. The next morning, according to the legend, the mysterious man was gone.',
      image_prompt:
        'Cinematic 9:16 vertical mysterious hotel room at 3 AM. An empty unmade bed with rumpled sheets, sheer window curtains billowing gently in the night breeze from an unlocked window. On the small wooden bedside table sits an abandoned leather passport and documents. Through the cracked open door, the silhouette of a guard stands in the dimly lit hallway. Eerie film noir mystery, unexplained disappearance, no fantasy magic.',
      on_screen_text: 'HE WAS GONE',
      animation: 'pan_left',
      transition: 'dark_fade',
      glitchEffect: 'signal_distortion',
      glitchTriggers: [
        { timeOffset: 8.2, duration: 0.45, effect: 'signal_distortion', intensity: 0.70, keywordTrigger: 'HE WAS GONE' },
      ],
      imageUrl: './generated/images/taured_scene_3.png',
      audioUrl: './generated/audio/taured_voice_3.mp3',
      sfxUrl: './sfx/taured_sfx_3.mp3',
      sfxLabel: 'Empty Corridor Room Hum & Distant Clock Chime',
      imageSourceType: 'ai',
      cropMode: 'cover',
    },
    {
      id: 4,
      duration: 15.25,
      audioDuration: 14.95,
      narration:
        'No reliable evidence has confirmed the popular version of this story. Some researchers connect it to a real 1950s case involving a man named John Zegrus, whose unusual passport story was later greatly expanded online.',
      image_prompt:
        'Cinematic 9:16 vertical shot of a dark forensic investigation board in an archival room. Taut red string connects vintage black-and-white documents, a weathered map of Europe with Andorra pinned and circled, an old passport photocopy, and a high-contrast silhouette portrait of a man labeled John Zegrus. Atmospheric low key lighting, archival dust, gritty documentary texture.',
      on_screen_text: 'REAL CASE OR LEGEND?',
      animation: 'ken_burns',
      transition: 'crossfade',
      glitchEffect: 'digital_static',
      glitchTriggers: [
        { timeOffset: 7.2, duration: 0.42, effect: 'digital_static', intensity: 0.75, keywordTrigger: 'JOHN ZEGRUS' },
      ],
      imageUrl: './generated/images/taured_scene_4.png',
      audioUrl: './generated/audio/taured_voice_4.mp3',
      sfxUrl: './sfx/taured_sfx_4.mp3',
      sfxLabel: 'Archival Static Burst & Sub-Bass Investigation Strike',
      imageSourceType: 'ai',
      cropMode: 'cover',
    },
    {
      id: 5,
      duration: 13.45,
      audioDuration: 13.20,
      narration:
        'So, did a man really come from a country called Taured? The evidence suggests the famous story is probably a mystery built around a real case. But the legend remains one of the internet\'s strangest stories.',
      image_prompt:
        'Cinematic 9:16 vertical shot of an empty, desolate 1950s airport concourse late at night. In the distance down the polished hallway, the shadowy silhouette of the mysterious man recedes into thick darkness and cold mist. A vintage flight departure board reflects dimly in wet glass with the word TAURED faintly glowing and glitching. Dramatic monochrome contrast, chilling atmospheric fog, noir mystery resolution.',
      on_screen_text: 'THE MYSTERY REMAINS.',
      animation: 'slow_zoom_in',
      transition: 'dark_fade',
      glitchEffect: 'rgb_split',
      glitchTriggers: [
        { timeOffset: 3.0, duration: 0.35, effect: 'rgb_split', intensity: 0.60, keywordTrigger: 'TAURED' },
        { timeOffset: 9.6, duration: 0.50, effect: 'vhs_distortion', intensity: 0.70, keywordTrigger: 'THE MYSTERY REMAINS' },
      ],
      imageUrl: './generated/images/taured_scene_5.png',
      audioUrl: './generated/audio/taured_voice_5.mp3',
      sfxUrl: './sfx/taured_sfx_5.mp3',
      sfxLabel: 'Midnight Airport Concourse Dissolve & Deep Ambient Fog',
      imageSourceType: 'ai',
      cropMode: 'cover',
    },
  ],
};

// Mystery Legend Video: Hoia-Baciu Forest (5 Scenes, ~57.8s Master Timeline, 9:16 Vertical Reel)
export const HOIA_BACIU_FOREST_PROJECT: VideoProject = {
  id: 'project_hoia_baciu_forest_mystery',
  createdAt: '2026-10-28T04:00:00.000Z',
  updatedAt: new Date().toISOString(),
  status: 'ready',
  originalTopic:
    'Hoia-Baciu Forest: The Bermuda Triangle of Romania, the circular dead-zone clearing, and the 1968 UFO photograph',
  thumbnailUrl: './generated/images/hoia_baciu_scene_1.png',
  exportedVideoUrl: './generated/videos/hoia_baciu_forest_master_1080p.mp4',
  project: {
    title: 'Hoia-Baciu: The Haunted Forest',
    description:
      'A cinematic faceless mystery Reel exploring Romania’s Hoia-Baciu Forest, the unexplained circular clearing, and the famous 1968 photograph.',
    aspect_ratio: '9:16',
    resolution: '1080x1920',
    fps: 30,
    style: 'creepy_legend',
    language: 'English',
    total_duration: 57.8,
    voiceId: 'male_educational',
    musicTrackId: 'track_beneath_the_heavy_soil',
    musicVolume: 0.28,
    voiceVolume: 1.0,
    sfxVolume: 0.32,
  },
  captions: {
    enabled: true,
    style: 'KARAOKE',
    fontSize: 'lg',
    position: 'bottom',
    textColor: '#ffffff',
    highlightColor: '#ff3b3b',
    backgroundColor: 'rgba(6, 6, 10, 0.84)',
    maxWordsPerLine: 3,
  },
  scenes: [
    {
      id: 1,
      duration: 11.9,
      audioDuration: 11.71,
      narration:
        'In the heart of Transylvania lies the Hoia-Baciu Forest, known as the Bermuda Triangle of Romania. Locals warn of morning fog, strange disorientation, and inexplicable phenomena.',
      image_prompt:
        'Cinematic 9:16 vertical wide aerial drone shot looking down upon the vast Hoia-Baciu Forest in Romania. Dense dark green pine canopy stretching into distance, morning fog and low mist blanketing treetops, cold mysterious atmosphere, no visible people, no monsters.',
      on_screen_text: 'A STRANGE FOREST, ROMANIA',
      animation: 'slow_zoom_in',
      transition: 'crossfade',
      glitchEffect: 'none',
      parallaxIntensity: 0.85,
      imageUrl: './generated/images/hoia_baciu_scene_1.png',
      audioUrl: './generated/audio/hoia_baciu_voice_1.mp3',
      sfxUrl: './sfx/hoia_baciu_sfx_1.mp3',
      sfxLabel: 'Aerial Forest Wind & Morning Mist Drone',
      imageSourceType: 'ai',
      cropMode: 'cover',
    },
    {
      id: 2,
      duration: 12.9,
      audioDuration: 12.74,
      narration:
        'Step into the dense trees, and an unsettling quiet takes over. Visitors describe an overwhelming sensation that someone is watching from the shadows, while isolated paths lead hikers astray.',
      image_prompt:
        'Cinematic 9:16 vertical shot of a lone traveler walking along a secluded narrow dirt trail through dense crooked trees in Hoia-Baciu Forest. The lone person appears small compared to the immense forest. Cold hanging fog between gnarled branches, eerie composition communicating someone unseen watching.',
      on_screen_text: 'SOMEONE WAS WATCHING',
      animation: 'parallax',
      transition: 'crossfade',
      glitchEffect: 'none',
      parallaxIntensity: 0.95,
      imageUrl: './generated/images/hoia_baciu_scene_2.png',
      audioUrl: './generated/audio/hoia_baciu_voice_2.mp3',
      sfxUrl: './sfx/hoia_baciu_sfx_2.mp3',
      sfxLabel: 'Isolated Trail Ambience & Suspense Pulse',
      imageSourceType: 'ai',
      cropMode: 'cover',
    },
    {
      id: 3,
      duration: 10.3,
      audioDuration: 10.13,
      narration:
        'At its center lies a mysterious dead zone: an almost perfect circular clearing where no trees or plants will grow, completely baffling scientists for decades.',
      image_prompt:
        'Cinematic 9:16 vertical view of the famous unexplained circular clearing deep inside Hoia-Baciu Forest in Romania. A large barren circular meadow where no trees grow, framed around the perimeter by strangely curved and twisted trees, atmospheric fog drifting low.',
      on_screen_text: 'THE EMPTY CLEARING',
      animation: 'ken_burns',
      transition: 'crossfade',
      glitchEffect: 'none',
      parallaxIntensity: 0.85,
      imageUrl: './generated/images/hoia_baciu_scene_3.png',
      audioUrl: './generated/audio/hoia_baciu_voice_3.mp3',
      sfxUrl: './sfx/hoia_baciu_sfx_3.mp3',
      sfxLabel: 'Clearing Dead Zone Sub-Bass Resonance',
      imageSourceType: 'ai',
      cropMode: 'cover',
    },
    {
      id: 4,
      duration: 11.5,
      audioDuration: 11.30,
      narration:
        'In 1968, a military technician photographed an ambiguous hovering object above the clearing. Decades later, historians and skeptics still ask: what did he see?',
      image_prompt:
        'Cinematic 1968 historical recreation inspired by the famous 1968 Hoia-Baciu photograph. A Romanian man in authentic 1960s woolen trench coat standing near pine trees looking upward with astonishment toward the overcast sky. Far above the misty forest canopy, a strange ambiguous blurred oval object hovers silently. Archival 35mm film grain, vintage color palette.',
      on_screen_text: '1968: WHAT DID HE SEE?',
      animation: 'pan_up',
      transition: 'crossfade',
      glitchEffect: 'vhs_flicker',
      parallaxIntensity: 0.80,
      imageUrl: './generated/images/hoia_baciu_scene_4.png',
      audioUrl: './generated/audio/hoia_baciu_voice_4.mp3',
      sfxUrl: './sfx/hoia_baciu_sfx_4.mp3',
      sfxLabel: '1968 Vintage Tape Hiss & Atmospheric Hum',
      imageSourceType: 'ai',
      cropMode: 'cover',
    },
    {
      id: 5,
      duration: 11.2,
      audioDuration: 11.04,
      narration:
        'At night, the forest vanishes into thick cold fog, where distant silhouettes appear and dissolve into the shadows. Science offers no answers, and the mystery continues.',
      image_prompt:
        'Cinematic 9:16 vertical night-time scene deep inside Hoia-Baciu Forest. An empty dirt pathway vanishes into heavy thick white fog between dark twisted silhouettes of ancient trees. In the extreme far distance, a very distant, faint, ambiguous silhouette is barely perceptible through the mist. Cold moonlight, chilling atmosphere.',
      on_screen_text: 'THE MYSTERY CONTINUES',
      animation: 'slow_zoom_in',
      transition: 'dark_fade',
      glitchEffect: 'none',
      parallaxIntensity: 0.90,
      imageUrl: './generated/images/hoia_baciu_scene_5.png',
      audioUrl: './generated/audio/hoia_baciu_voice_5.mp3',
      sfxUrl: './sfx/hoia_baciu_sfx_5.mp3',
      sfxLabel: 'Night Forest Whispering Mist & Sub-Rumble',
      imageSourceType: 'ai',
      cropMode: 'cover',
    },
  ],
};

// Creepy Legend Video: The Mothman Mystery (5 Scenes, ~56.9s Master Timeline)
export const MOTHMAN_MYSTERY_PROJECT: VideoProject = {
  id: 'project_mothman_mystery_legend',
  createdAt: '2026-10-27T04:00:00.000Z',
  updatedAt: new Date().toISOString(),
  status: 'ready',
  originalTopic:
    'The Mothman Mystery: The 1966–1967 Point Pleasant sightings and the tragic Silver Bridge collapse',
  thumbnailUrl: './generated/images/mothman_scene_2.png',
  project: {
    title: 'The Mothman Mystery',
    description:
      'A creepy legend YouTube Short exploring the 1966 Point Pleasant sightings, glowing red eyes, and the 1967 Silver Bridge disaster.',
    aspect_ratio: '9:16',
    resolution: '1080x1920',
    fps: 30,
    style: 'creepy_legend',
    language: 'English',
    total_duration: 56.9,
    voiceId: 'male_storyteller',
    musicTrackId: 'track_beneath_the_heavy_soil',
    musicVolume: 0.30,
    voiceVolume: 1.0,
    sfxVolume: 0.34,
  },
  captions: {
    enabled: true,
    style: 'KARAOKE',
    fontSize: 'lg',
    position: 'bottom',
    textColor: '#ffffff',
    highlightColor: '#ff3b3b',
    backgroundColor: 'rgba(6, 6, 10, 0.84)',
    maxWordsPerLine: 3,
  },
  scenes: [
    {
      id: 1,
      duration: 12.3,
      audioDuration: 12.0,
      narration:
        'In 1966, something strange was seen in Point Pleasant, West Virginia. Two young couples were driving near an old factory late at night. Suddenly, they saw a tall dark figure. It had large red eyes and huge wings. They were terrified.',
      image_prompt:
        'Cinematic night scene near an old abandoned factory in Point Pleasant, 1966. Two cars stopped near the road, two young couples looking toward a dark winged humanoid figure with two glowing red eyes in the fog.',
      on_screen_text: 'POINT PLEASANT, 1966',
      animation: 'slow_zoom_in',
      transition: 'crossfade',
      glitchEffect: 'rgb_split',
      parallaxIntensity: 0.85,
      imageUrl: './generated/images/mothman_scene_1.png',
      audioUrl: './generated/audio/mothman_voice_1.mp3',
      sfxUrl: './sfx/mothman_sfx_1.mp3',
      sfxLabel: 'Eerie Wind + Low Sighting Boom',
      imageSourceType: 'ai',
      cropMode: 'cover',
    },
    {
      id: 2,
      duration: 10.8,
      audioDuration: 10.51,
      narration:
        'The creature looked almost like a man, but it was not human. People said it could fly very fast. Its red eyes seemed to shine in the darkness. Soon, more people began to report seeing the same strange creature.',
      image_prompt:
        'Close cinematic view of the mysterious Mothman creature standing in darkness with large wings partially open, two bright red eyes visible through the darkness, and fog moving around the creature.',
      on_screen_text: 'THE CREATURE',
      animation: 'ken_burns',
      transition: 'dark_fade',
      glitchEffect: 'vhs_flicker',
      parallaxIntensity: 0.9,
      imageUrl: './generated/images/mothman_scene_2.png',
      audioUrl: './generated/audio/mothman_voice_2.mp3',
      sfxUrl: './sfx/mothman_sfx_2.mp3',
      sfxLabel: 'Dark Pulse + Red Eyes Static',
      imageSourceType: 'ai',
      cropMode: 'cover',
    },
    {
      id: 3,
      duration: 10.0,
      audioDuration: 9.7,
      narration:
        'The reports spread across the town. Some people called the creature Mothman. Others believed it was a warning of something terrible. People became afraid to drive near the old factory at night.',
      image_prompt:
        '1960s Point Pleasant at night. People looking nervously toward the dark sky where a distant Mothman silhouette appears above the town, street lights glowing through fog.',
      on_screen_text: 'THE TOWN BECOMES AFRAID',
      animation: 'pan_right',
      transition: 'crossfade',
      glitchEffect: 'none',
      parallaxIntensity: 0.85,
      imageUrl: './generated/images/mothman_scene_3.png',
      audioUrl: './generated/audio/mothman_voice_3.mp3',
      sfxUrl: './sfx/mothman_sfx_3.mp3',
      sfxLabel: 'Radio Static Interference + Fog Wind',
      imageSourceType: 'ai',
      cropMode: 'cover',
    },
    {
      id: 4,
      duration: 12.6,
      audioDuration: 12.34,
      narration:
        'Then, something terrible happened. On December 15, 1967, the Silver Bridge collapsed. Forty-six people died. After the disaster, many people remembered the strange creature. They wondered if the Mothman sightings had been a warning.',
      image_prompt:
        'Dramatic cinematic night view of the Silver Bridge before its collapse over a dark river with fog, illuminated by weak lights, with a mysterious winged silhouette far in the sky.',
      on_screen_text: 'DECEMBER 15, 1967',
      animation: 'slow_zoom_in',
      transition: 'dark_fade',
      glitchEffect: 'signal_distortion',
      parallaxIntensity: 0.9,
      imageUrl: './generated/images/mothman_scene_4.png',
      audioUrl: './generated/audio/mothman_voice_4.mp3',
      sfxUrl: './sfx/mothman_sfx_4.mp3',
      sfxLabel: 'Bridge Ambience + Deep Disaster Rumble',
      imageSourceType: 'ai',
      cropMode: 'cover',
    },
    {
      id: 5,
      duration: 11.2,
      audioDuration: 10.9,
      narration:
        'Even today, nobody knows what people really saw. Was it a strange animal? A legend? Or something we cannot explain? The Mothman mystery is still alive. And some people believe he may still be watching from the darkness.',
      image_prompt:
        'Final cinematic image of the Mothman standing far away in thick fog on a dark forest road with moonlight behind the silhouette and only the glowing red eyes clearly visible.',
      on_screen_text: 'THE MYSTERY REMAINS',
      animation: 'slow_zoom_in',
      transition: 'crossfade',
      glitchEffect: 'crimson_shock',
      parallaxIntensity: 0.95,
      imageUrl: './generated/images/mothman_scene_5.png',
      audioUrl: './generated/audio/mothman_voice_5.mp3',
      sfxUrl: './sfx/mothman_sfx_5.mp3',
      sfxLabel: 'Night Forest Wind + Final Glitch Impact',
      imageSourceType: 'ai',
      cropMode: 'cover',
    },
  ],
};

// 5-Stage Psychology Video: Dunning-Kruger Effect
// Calibrated with exact OpenAI TTS speech audio files & master timeline
export const DUNNING_KRUGER_PROJECT: VideoProject = {
  id: 'project_dunning_kruger_psychology',
  createdAt: '2026-10-26T10:00:00.000Z',
  updatedAt: new Date().toISOString(),
  status: 'ready',
  originalTopic: 'The Dunning–Kruger Effect: The 5 Stages of Real Learning & Confidence',
  thumbnailUrl: './samples/dunning_kruger_1.jpg',
  project: {
    title: 'The Dunning–Kruger Effect',
    description: 'A 5-stage psychological breakdown of why beginners feel overly confident and how true mastery evolves.',
    aspect_ratio: '9:16',
    resolution: '1080x1920',
    fps: 30,
    style: 'stickman',
    language: 'English',
    total_duration: 28.5,
    voiceId: 'female_educational',
    musicTrackId: 'track_educational_01',
    musicVolume: 0.20,
    voiceVolume: 1.0,
  },
  captions: {
    enabled: true,
    style: 'KARAOKE',
    fontSize: 'lg',
    position: 'bottom',
    textColor: '#ffffff',
    highlightColor: '#facc15',
    backgroundColor: 'rgba(0,0,0,0.75)',
    maxWordsPerLine: 5,
  },
  scenes: [
    {
      id: 1,
      duration: 6.6,
      narration: 'At first, beginners may feel very confident because they do not yet know how difficult the subject is.',
      image_prompt: 'Stage 1: Beginner feels very confident standing high on the Peak of Ignorance.',
      on_screen_text: 'STAGE 1: OVERCONFIDENCE',
      animation: 'slow_zoom_in',
      transition: 'crossfade',
      imageUrl: './samples/dunning_kruger_1.jpg',
      audioUrl: './generated/audio/voice_0e9dd556aaacb4468bc239e26660d8b0.mp3',
      imageSourceType: 'sample',
      cropMode: 'cover',
    },
    {
      id: 2,
      duration: 5.5,
      narration: 'But as they learn more, they discover many new things they still need to understand.',
      image_prompt: 'Stage 2: The beginner learns more and discovers the subject is difficult.',
      on_screen_text: 'STAGE 2: DISCOVERY',
      animation: 'pan_left',
      transition: 'slide_left',
      imageUrl: './samples/dunning_kruger_2.jpg',
      audioUrl: './generated/audio/voice_618d84f5e8be7b0436b8833f5de2bc47.mp3',
      imageSourceType: 'sample',
      cropMode: 'cover',
    },
    {
      id: 3,
      duration: 5.2,
      narration: 'Then their confidence drops because they finally see how much they do not know.',
      image_prompt: 'Stage 3: Confidence drops because they realize how much they do not know (Valley of Despair).',
      on_screen_text: 'STAGE 3: CONFIDENCE DROPS',
      animation: 'slow_zoom_out',
      transition: 'crossfade',
      imageUrl: './samples/dunning_kruger_3.jpg',
      audioUrl: './generated/audio/voice_400691df7b30d0d2d6ce723f525751a5.mp3',
      imageSourceType: 'sample',
      cropMode: 'cover',
    },
    {
      id: 4,
      duration: 6.0,
      narration: 'They become more humble and understand that real learning takes time, practice, and patience.',
      image_prompt: 'Stage 4: They become humble and continue learning (Slope of Enlightenment).',
      on_screen_text: 'STAGE 4: PATIENCE & HUMILITY',
      animation: 'pan_right',
      transition: 'slide_left',
      imageUrl: './samples/dunning_kruger_4.jpg',
      audioUrl: './generated/audio/voice_21252186ddb06b53da3c2a27120bd93c.mp3',
      imageSourceType: 'sample',
      cropMode: 'cover',
    },
    {
      id: 5,
      duration: 5.2,
      narration: 'With experience, their skill grows, and their confidence becomes more realistic.',
      image_prompt: 'Stage 5: Their real skill and confidence grow together (Plateau of Sustainable Mastery).',
      on_screen_text: 'STAGE 5: REAL MASTERY',
      animation: 'slow_zoom_in',
      transition: 'crossfade',
      imageUrl: './samples/dunning_kruger_5.jpg',
      audioUrl: './generated/audio/voice_41f08e91a9cfbbfd845870c4127563b7.mp3',
      imageSourceType: 'sample',
      cropMode: 'cover',
    },
  ],
};

// Seed Demo Project
export const SEED_DEMO_PROJECT: VideoProject = {
  id: 'project_seed_psychology_demo',
  createdAt: '2026-10-26T00:00:00.000Z',
  updatedAt: new Date().toISOString(),
  status: 'ready',
  originalTopic: 'Why Your Brain Tricks You: The Psychology of Overconfidence',
  thumbnailUrl: './samples/sample_scene_1.jpg',
  project: {
    title: 'Why Your Brain Tricks You',
    description: 'A 5-part psychological breakdown of how overconfidence traps work in decision-making.',
    aspect_ratio: '9:16',
    resolution: '1080x1920',
    fps: 30,
    style: 'stickman',
    language: 'English',
    total_duration: 35,
    voiceId: 'female_educational',
    musicTrackId: 'educational-01',
    musicVolume: 0.2,
    voiceVolume: 1.0,
  },
  captions: {
    enabled: true,
    style: 'KARAOKE',
    fontSize: 'lg',
    position: 'bottom',
    textColor: '#ffffff',
    highlightColor: '#facc15',
    backgroundColor: 'rgba(0,0,0,0.75)',
    maxWordsPerLine: 5,
  },
  scenes: [
    {
      id: 1,
      duration: 7,
      narration: 'Have you ever noticed how the least experienced people are often the loudest in the room?',
      image_prompt: 'Stickman on top of a tiny hill screaming with a megaphone, believing he conquered Everest, minimalist doodle style',
      on_screen_text: 'THE BEGINNER TRAP',
      animation: 'slow_zoom_in',
      transition: 'crossfade',
      imageUrl: './samples/sample_scene_1.jpg',
      imageSourceType: 'sample',
      cropMode: 'cover',
    },
    {
      id: 2,
      duration: 7,
      narration: 'Psychologists call this the Peak of Ignorance. When you know very little, your brain tricks you into feeling like an expert.',
      image_prompt: 'Stickman looking through a tiny telescope at a huge universe, minimalist clean line art, comic stick figure',
      on_screen_text: 'PEAK OF IGNORANCE',
      animation: 'pan_left',
      transition: 'slide_left',
      imageUrl: './samples/sample_scene_2.jpg',
      imageSourceType: 'sample',
      cropMode: 'cover',
    },
    {
      id: 3,
      duration: 7,
      narration: 'Then reality hits. The moment you start learning more, your confidence drops straight down into the valley of despair.',
      image_prompt: 'Stickman falling down into a deep canyon with question marks floating all around, stick figure comic style',
      on_screen_text: 'VALLEY OF DESPAIR',
      animation: 'slow_zoom_out',
      transition: 'crossfade',
      imageUrl: './samples/sample_scene_3.jpg',
      imageSourceType: 'sample',
      cropMode: 'cover',
    },
    {
      id: 4,
      duration: 7,
      narration: 'Most people quit right here. But the few who keep studying slowly climb the slope of real knowledge.',
      image_prompt: 'Stickman hiking up a steep mountain carrying a stack of books, determined expression, minimalist cartoon art',
      on_screen_text: 'SLOPE OF KNOWLEDGE',
      animation: 'pan_right',
      transition: 'slide_left',
      imageUrl: './samples/sample_scene_4.jpg',
      imageSourceType: 'sample',
      cropMode: 'cover',
    },
    {
      id: 5,
      duration: 7,
      narration: 'True mastery is quiet. The real experts know how much they still do not know. Follow for more mental models.',
      image_prompt: 'Stickman sitting serenely on top of a real mountain peak looking at stars, wise peaceful doodle style',
      on_screen_text: 'QUIET MASTERY',
      animation: 'slow_zoom_in',
      transition: 'crossfade',
      imageUrl: './samples/sample_scene_5.jpg',
      imageSourceType: 'sample',
      cropMode: 'cover',
    },
  ],
};

export const PROCRASTINATION_PROJECT: VideoProject = {
  id: 'demo_procrastination_project',
  createdAt: '2026-10-26T08:00:00.000Z',
  updatedAt: new Date().toISOString(),
  status: 'ready',
  originalTopic: 'The Neuroscience of Procrastination',
  thumbnailUrl: './samples/sample_scene_2.jpg',
  project: {
    title: 'The Neuroscience of Procrastination',
    description: 'Why you avoid the work you care most about and how your prefrontal cortex loses the battle.',
    aspect_ratio: '9:16',
    resolution: '1080x1920',
    fps: 30,
    style: 'stickman',
    language: 'English',
    total_duration: 21,
    voiceId: 'female_educational',
    musicTrackId: 'educational-01',
    musicVolume: 0.2,
    voiceVolume: 1.0,
  },
  captions: {
    enabled: true,
    style: 'BOLD',
    fontSize: 'lg',
    position: 'bottom',
    textColor: '#ffffff',
    highlightColor: '#facc15',
    backgroundColor: 'rgba(0,0,0,0.85)',
    maxWordsPerLine: 4,
  },
  scenes: [
    {
      id: 1,
      duration: 7,
      narration: 'Why do you scroll your phone when you have important work due tomorrow?',
      image_prompt: 'Stickman staring hypnotized at glowing smartphone screen while a massive clock ticks on wall',
      on_screen_text: 'THE PROCRASTINATION LOOP',
      animation: 'slow_zoom_in',
      transition: 'crossfade',
      imageUrl: './samples/sample_scene_2.jpg',
      imageSourceType: 'sample',
      cropMode: 'cover',
    },
    {
      id: 2,
      duration: 7,
      narration: 'Your amygdala perceives difficult tasks as emotional threats, triggering instant avoidance.',
      image_prompt: 'Two stickmen inside brain pulling levers in opposite directions, comic neuroscience doodle',
      on_screen_text: 'THE EMOTIONAL THREAT',
      animation: 'pan_left',
      transition: 'slide_left',
      imageUrl: './samples/sample_scene_3.jpg',
      imageSourceType: 'sample',
      cropMode: 'cover',
    },
    {
      id: 3,
      duration: 7,
      narration: 'To break free, shrink the barrier: commit to working for only two minutes. Action cures fear.',
      image_prompt: 'Stickman stepping over a tiny hurdle, smiling confidently, clean minimalist cartoon',
      on_screen_text: 'THE 2-MINUTE RULE',
      animation: 'slow_zoom_out',
      transition: 'crossfade',
      imageUrl: './samples/sample_scene_4.jpg',
      imageSourceType: 'sample',
      cropMode: 'cover',
    },
  ],
};

class StorageService {
  private projects: VideoProject[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') {
      this.projects = [TAURED_MYSTERY_PROJECT, HOIA_BACIU_FOREST_PROJECT, MOTHMAN_MYSTERY_PROJECT, DUNNING_KRUGER_PROJECT, PROCRASTINATION_PROJECT];
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.projects = JSON.parse(stored);
      } else {
        this.projects = [
          JSON.parse(JSON.stringify(TAURED_MYSTERY_PROJECT)),
          JSON.parse(JSON.stringify(HOIA_BACIU_FOREST_PROJECT)),
          JSON.parse(JSON.stringify(MOTHMAN_MYSTERY_PROJECT)),
          JSON.parse(JSON.stringify(DUNNING_KRUGER_PROJECT)),
          JSON.parse(JSON.stringify(PROCRASTINATION_PROJECT)),
        ];
      }

      // Always ensure Taured Mystery project is loaded first with calibrated master timeline & assets
      const tmIdx = this.projects.findIndex((p) => p.id === TAURED_MYSTERY_PROJECT.id);
      if (tmIdx === -1) {
        this.projects.unshift(JSON.parse(JSON.stringify(TAURED_MYSTERY_PROJECT)));
      } else {
        this.projects[tmIdx] = {
          ...JSON.parse(JSON.stringify(TAURED_MYSTERY_PROJECT)),
          scenes: TAURED_MYSTERY_PROJECT.scenes,
          project: {
            ...TAURED_MYSTERY_PROJECT.project,
            title: this.projects[tmIdx].project?.title || TAURED_MYSTERY_PROJECT.project.title,
          },
        };
      }

      // Always ensure Hoia-Baciu Forest project is present
      const hbIdx = this.projects.findIndex((p) => p.id === HOIA_BACIU_FOREST_PROJECT.id);
      if (hbIdx === -1) {
        this.projects.unshift(JSON.parse(JSON.stringify(HOIA_BACIU_FOREST_PROJECT)));
      } else {
        this.projects[hbIdx] = {
          ...JSON.parse(JSON.stringify(HOIA_BACIU_FOREST_PROJECT)),
          scenes: HOIA_BACIU_FOREST_PROJECT.scenes,
          project: {
            ...HOIA_BACIU_FOREST_PROJECT.project,
            title: this.projects[hbIdx].project?.title || HOIA_BACIU_FOREST_PROJECT.project.title,
          },
        };
      }

      // Always ensure Dunning-Kruger project has calibrated master timeline & assets
      const dkIdx = this.projects.findIndex((p) => p.id === DUNNING_KRUGER_PROJECT.id);
      if (dkIdx === -1) {
        this.projects.unshift(JSON.parse(JSON.stringify(DUNNING_KRUGER_PROJECT)));
      } else {
        this.projects[dkIdx] = {
          ...JSON.parse(JSON.stringify(DUNNING_KRUGER_PROJECT)),
          scenes: DUNNING_KRUGER_PROJECT.scenes,
          project: {
            ...DUNNING_KRUGER_PROJECT.project,
            title: this.projects[dkIdx].project?.title || DUNNING_KRUGER_PROJECT.project.title,
          },
        };
      }

      // Always ensure Mothman Mystery project has calibrated master timeline & assets
      const mmIdx = this.projects.findIndex((p) => p.id === MOTHMAN_MYSTERY_PROJECT.id);
      if (mmIdx === -1) {
        this.projects.unshift(JSON.parse(JSON.stringify(MOTHMAN_MYSTERY_PROJECT)));
      } else {
        this.projects[mmIdx] = {
          ...JSON.parse(JSON.stringify(MOTHMAN_MYSTERY_PROJECT)),
          scenes: MOTHMAN_MYSTERY_PROJECT.scenes,
          project: {
            ...MOTHMAN_MYSTERY_PROJECT.project,
            title: this.projects[mmIdx].project?.title || MOTHMAN_MYSTERY_PROJECT.project.title,
          },
        };
      }

      // Ensure Procrastination project is present
      const hasProcrastination = this.projects.some((p) => p.id === PROCRASTINATION_PROJECT.id);
      if (!hasProcrastination) {
        this.projects.push(JSON.parse(JSON.stringify(PROCRASTINATION_PROJECT)));
      }

      this.saveToStorage();
    } catch (e) {
      console.warn('Could not load stored projects, initializing demo', e);
      this.projects = [TAURED_MYSTERY_PROJECT, HOIA_BACIU_FOREST_PROJECT, MOTHMAN_MYSTERY_PROJECT, DUNNING_KRUGER_PROJECT, PROCRASTINATION_PROJECT];
    }
  }

  getProjects(): VideoProject[] {
    if (this.projects.length === 0) {
      return [TAURED_MYSTERY_PROJECT, HOIA_BACIU_FOREST_PROJECT, MOTHMAN_MYSTERY_PROJECT, DUNNING_KRUGER_PROJECT, PROCRASTINATION_PROJECT];
    }
    return [...this.projects];
  }

  getProjectById(id: string): VideoProject | undefined {
    return this.projects.find((p) => p.id === id);
  }

  saveProject(project: VideoProject): void {
    const idx = this.projects.findIndex((p) => p.id === project.id);
    const updated = {
      ...project,
      updatedAt: new Date().toISOString(),
      thumbnailUrl: project.scenes[0]?.imageUrl || project.thumbnailUrl,
    };

    if (idx >= 0) {
      this.projects[idx] = updated;
    } else {
      this.projects.unshift(updated);
    }

    this.saveToStorage();
  }

  deleteProject(id: string): void {
    this.projects = this.projects.filter((p) => p.id !== id);
    this.saveToStorage();
  }

  duplicateProject(id: string): VideoProject | undefined {
    const original = this.projects.find((p) => p.id === id);
    if (!original) return undefined;

    const copy: VideoProject = {
      ...JSON.parse(JSON.stringify(original)),
      id: `project_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      project: {
        ...original.project,
        title: `${original.project.title} (Copy)`,
      },
    };

    this.projects.unshift(copy);
    this.saveToStorage();
    return copy;
  }

  getActiveProjectId(): string | null {
    if (typeof window === 'undefined') return MOTHMAN_MYSTERY_PROJECT.id;
    return localStorage.getItem(ACTIVE_PROJECT_ID_KEY) || MOTHMAN_MYSTERY_PROJECT.id;
  }

  setActiveProjectId(id: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACTIVE_PROJECT_ID_KEY, id);
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.projects));
    } catch (e) {
      console.error('Failed to save projects to localStorage', e);
    }
  }
}

export const storageService = new StorageService();
