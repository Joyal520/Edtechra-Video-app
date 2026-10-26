import { VideoProject } from '../types/video';

const STORAGE_KEY = 'faceless_ai_video_projects';
const ACTIVE_PROJECT_ID_KEY = 'faceless_active_project_id';

// 5-Stage Psychology Video: Dunning-Kruger Effect
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
    total_duration: 28,
    voiceId: 'female_educational',
    musicTrackId: 'track_educational_01',
    musicVolume: 0.2,
    voiceVolume: 0.95,
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
      duration: 6.5,
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
      duration: 5.5,
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
      animation: 'ken_burns',
      transition: 'zoom',
      imageUrl: './samples/dunning_kruger_4.jpg',
      audioUrl: './generated/audio/voice_21252186ddb06b53da3c2a27120bd93c.mp3',
      imageSourceType: 'sample',
      cropMode: 'cover',
    },
    {
      id: 5,
      duration: 5.0,
      narration: 'With experience, their skill grows, and their confidence becomes more realistic.',
      image_prompt: 'Stage 5: Their real skill and confidence grow together (Plateau of Sustainable Mastery).',
      on_screen_text: 'STAGE 5: REAL MASTERY',
      animation: 'floating',
      transition: 'fade',
      imageUrl: './samples/dunning_kruger_5.jpg',
      audioUrl: './generated/audio/voice_41f08e91a9cfbbfd845870c4127563b7.mp3',
      imageSourceType: 'sample',
      cropMode: 'cover',
    },
  ],
};

export const PROCRASTINATION_PROJECT: VideoProject = {
  id: 'demo_procrastination_project',
  createdAt: '2026-10-26T08:00:00.000Z',
  updatedAt: new Date().toISOString(),
  status: 'completed',
  originalTopic: 'Why Do People Procrastinate? The Science of Delaying Work',
  thumbnailUrl: './samples/sample_scene_1.jpg',
  project: {
    title: 'Why Do People Procrastinate?',
    description: 'The psychological battle between your instant gratification monkey and your rational brain.',
    aspect_ratio: '9:16',
    resolution: '1080x1920',
    fps: 30,
    style: 'stickman',
    language: 'English',
    total_duration: 38,
    voiceId: 'female_educational',
    musicTrackId: 'track_educational_01',
    musicVolume: 0.2,
    voiceVolume: 0.95,
  },
  captions: {
    enabled: true,
    style: 'KARAOKE',
    fontSize: 'lg',
    position: 'bottom',
    textColor: '#ffffff',
    highlightColor: '#facc15',
    backgroundColor: 'rgba(0,0,0,0.7)',
    maxWordsPerLine: 5,
  },
  scenes: [
    {
      id: 1,
      duration: 7,
      narration: 'Have you ever sat down to work, only to find yourself cleaning your room or scrolling memes?',
      image_prompt: 'A minimalist stickman staring at a glowing laptop screen with a giant question mark overhead, dark background.',
      on_screen_text: 'WHY DO WE DELAY?',
      animation: 'slow_zoom_in',
      transition: 'crossfade',
      imageUrl: './samples/sample_scene_1.jpg',
      imageSourceType: 'sample',
      cropMode: 'cover',
    },
    {
      id: 2,
      duration: 8,
      narration: 'Psychologists say procrastination isn’t laziness—it’s an emotional battle between two parts of your brain.',
      image_prompt: 'A stickman brain split in two: the emotional limbic system battling the calm rational prefrontal cortex.',
      on_screen_text: 'IT’S NOT LAZINESS',
      animation: 'pan_left',
      transition: 'slide_left',
      imageUrl: './samples/sample_scene_2.jpg',
      imageSourceType: 'sample',
      cropMode: 'cover',
    },
    {
      id: 3,
      duration: 8,
      narration: 'Your limbic system wants dopamine right now, while your prefrontal cortex plans for your future.',
      image_prompt: 'Stickman holding a stopwatch while an instant gratification monkey tempts him with delicious snacks.',
      on_screen_text: 'THE DOPAMINE TRAP',
      animation: 'ken_burns',
      transition: 'zoom',
      imageUrl: './samples/sample_scene_3.jpg',
      imageSourceType: 'sample',
      cropMode: 'cover',
    },
    {
      id: 4,
      duration: 8,
      narration: 'When a task feels overwhelming or boring, your brain treats it like an actual threat and runs away.',
      image_prompt: 'Stickman running away in comic terror from a giant terrifying folder labeled TAXES & DEADLINES.',
      on_screen_text: 'EMOTIONAL THREAT',
      animation: 'shake',
      transition: 'wipe',
      imageUrl: './samples/sample_scene_4.jpg',
      imageSourceType: 'sample',
      cropMode: 'cover',
    },
    {
      id: 5,
      duration: 7,
      narration: 'The fix? The 2-Minute Rule. Commit to just 120 seconds, and momentum will take care of the rest.',
      image_prompt: 'A confident stickman triumphant on a podium with a glowing trophy and checkmark.',
      on_screen_text: 'THE 2-MINUTE RULE',
      animation: 'bounce',
      transition: 'fade',
      imageUrl: './samples/sample_scene_5.jpg',
      imageSourceType: 'sample',
      cropMode: 'cover',
    },
  ],
};

export const SEED_DEMO_PROJECT: VideoProject = DUNNING_KRUGER_PROJECT;

class StorageService {
  private projects: VideoProject[] = [];

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.projects = JSON.parse(stored);
      }

      // Ensure Dunning-Kruger project is present
      const dkIdx = this.projects.findIndex((p) => p.id === DUNNING_KRUGER_PROJECT.id);
      if (dkIdx === -1) {
        this.projects.unshift(JSON.parse(JSON.stringify(DUNNING_KRUGER_PROJECT)));
      } else {
        // Upgrade existing Dunning-Kruger entry with latest sample assets & voiceovers
        this.projects[dkIdx] = {
          ...JSON.parse(JSON.stringify(DUNNING_KRUGER_PROJECT)),
          ...this.projects[dkIdx],
          scenes: DUNNING_KRUGER_PROJECT.scenes,
          project: {
            ...DUNNING_KRUGER_PROJECT.project,
            ...this.projects[dkIdx].project,
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
      this.projects = [DUNNING_KRUGER_PROJECT, PROCRASTINATION_PROJECT];
    }
  }

  getProjects(): VideoProject[] {
    if (this.projects.length === 0) {
      return [DUNNING_KRUGER_PROJECT, PROCRASTINATION_PROJECT];
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

  duplicateProject(id: string): VideoProject | null {
    const original = this.getProjectById(id);
    if (!original) return null;

    const copy: VideoProject = {
      ...JSON.parse(JSON.stringify(original)),
      id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
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

  getActiveProjectId(): string {
    if (typeof window === 'undefined') return DUNNING_KRUGER_PROJECT.id;
    return localStorage.getItem(ACTIVE_PROJECT_ID_KEY) || DUNNING_KRUGER_PROJECT.id;
  }

  setActiveProjectId(id: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACTIVE_PROJECT_ID_KEY, id);
  }

  createFreshDunningKrugerProject(): VideoProject {
    const fresh: VideoProject = {
      ...JSON.parse(JSON.stringify(DUNNING_KRUGER_PROJECT)),
      id: `dk_proj_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.saveProject(fresh);
    this.setActiveProjectId(fresh.id);
    return fresh;
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.projects));
    } catch (e) {
      console.warn('Storage quota exceeded, storing trimmed set', e);
    }
  }
}

export const storageService = new StorageService();
