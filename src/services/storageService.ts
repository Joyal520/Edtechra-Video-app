import { VideoProject } from '../types/video';

const STORAGE_KEY = 'faceless_ai_video_projects';
const ACTIVE_PROJECT_ID_KEY = 'faceless_active_project_id';

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
    musicTrackId: 'track_creepy_legend_01',
    musicVolume: 0.24,
    voiceVolume: 1.0,
    sfxVolume: 0.38,
  },
  captions: {
    enabled: true,
    style: 'KARAOKE',
    fontSize: 'lg',
    position: 'bottom',
    textColor: '#ffffff',
    highlightColor: '#ef4444',
    backgroundColor: 'rgba(6, 6, 10, 0.84)',
    maxWordsPerLine: 4,
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
      transition: 'glitch',
      glitchEffect: 'scanline_static',
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
      this.projects = [MOTHMAN_MYSTERY_PROJECT, DUNNING_KRUGER_PROJECT, PROCRASTINATION_PROJECT];
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.projects = JSON.parse(stored);
      } else {
        this.projects = [
          JSON.parse(JSON.stringify(MOTHMAN_MYSTERY_PROJECT)),
          JSON.parse(JSON.stringify(DUNNING_KRUGER_PROJECT)),
          JSON.parse(JSON.stringify(PROCRASTINATION_PROJECT)),
        ];
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
      this.projects = [MOTHMAN_MYSTERY_PROJECT, DUNNING_KRUGER_PROJECT, PROCRASTINATION_PROJECT];
    }
  }

  getProjects(): VideoProject[] {
    if (this.projects.length === 0) {
      return [MOTHMAN_MYSTERY_PROJECT, DUNNING_KRUGER_PROJECT, PROCRASTINATION_PROJECT];
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
