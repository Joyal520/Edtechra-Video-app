import { VideoProject } from '../types/video';
import { createProceduralSvg, imageGenerationService } from './imageGenerationService';

const STORAGE_KEY = 'faceless_ai_video_projects';
const ACTIVE_PROJECT_ID_KEY = 'faceless_active_project_id';

const demoScenesData = [
  {
    id: 1,
    duration: 7,
    narration: 'Have you ever sat down to work, only to find yourself cleaning your room or scrolling memes?',
    image_prompt: 'A minimalist stickman staring at a glowing laptop screen with a giant question mark overhead, dark background.',
    on_screen_text: 'WHY DO WE DELAY?',
    animation: 'slow_zoom_in' as const,
    transition: 'crossfade' as const,
  },
  {
    id: 2,
    duration: 8,
    narration: 'Psychologists say procrastination isn’t laziness—it’s an emotional battle between two parts of your brain.',
    image_prompt: 'A stickman brain split in two: the emotional limbic system battling the calm rational prefrontal cortex.',
    on_screen_text: 'IT’S NOT LAZINESS',
    animation: 'pan_left' as const,
    transition: 'slide_left' as const,
  },
  {
    id: 3,
    duration: 8,
    narration: 'Your limbic system wants dopamine right now, while your prefrontal cortex plans for your future.',
    image_prompt: 'Stickman holding a stopwatch while an instant gratification monkey tempts him with delicious snacks.',
    on_screen_text: 'THE DOPAMINE TRAP',
    animation: 'ken_burns' as const,
    transition: 'zoom' as const,
  },
  {
    id: 4,
    duration: 8,
    narration: 'When a task feels overwhelming or boring, your brain treats it like an actual threat and runs away.',
    image_prompt: 'Stickman running away in comic terror from a giant terrifying folder labeled TAXES & DEADLINES.',
    on_screen_text: 'EMOTIONAL THREAT',
    animation: 'shake' as const,
    transition: 'wipe' as const,
  },
  {
    id: 5,
    duration: 7,
    narration: 'The fix? The 2-Minute Rule. Commit to just 120 seconds, and momentum will take care of the rest.',
    image_prompt: 'A confident stickman triumphant on a podium with a glowing trophy and checkmark.',
    on_screen_text: 'THE 2-MINUTE RULE',
    animation: 'bounce' as const,
    transition: 'fade' as const,
  },
];

const builtScenes = demoScenesData.map((s) => ({
  ...s,
  imageUrl: `/samples/sample_scene_${s.id}.jpg`,
  imageSourceType: 'sample' as const,
  cropMode: 'cover' as const,
}));

export const SEED_DEMO_PROJECT: VideoProject = {
  id: 'demo_procrastination_project',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: 'completed',
  originalTopic: 'Why Do People Procrastinate? The Science of Delaying Work',
  thumbnailUrl: '/samples/sample_scene_1.jpg',
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
    musicTrackId: 'track_lofi_focus',
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
  scenes: builtScenes,
};

class StorageService {
  private projects: VideoProject[] = [];

  constructor() {
    this.init();
  }

  private async init() {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.projects = JSON.parse(stored);
      }

      // If no projects exist or demo is missing, inject seed demo project
      const hasDemo = this.projects.some((p) => p.id === SEED_DEMO_PROJECT.id);
      if (!hasDemo) {
        // Pre-generate images for seed demo so thumbnail and scenes are immediately ready
        const demo = JSON.parse(JSON.stringify(SEED_DEMO_PROJECT));
        for (const scene of demo.scenes) {
          scene.imageUrl = await imageGenerationService.generateImage({
            prompt: scene.image_prompt,
            aspectRatio: demo.project.aspect_ratio,
            style: demo.project.style,
            sceneNumber: scene.id,
            onScreenText: scene.on_screen_text,
          });
        }
        demo.thumbnailUrl = demo.scenes[0].imageUrl;
        this.projects.unshift(demo);
        this.saveToStorage();
      }
    } catch (e) {
      console.warn('Could not load stored projects, initializing demo', e);
      this.projects = [SEED_DEMO_PROJECT];
    }
  }

  getProjects(): VideoProject[] {
    if (this.projects.length === 0) {
      return [SEED_DEMO_PROJECT];
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
    if (typeof window === 'undefined') return SEED_DEMO_PROJECT.id;
    return localStorage.getItem(ACTIVE_PROJECT_ID_KEY) || SEED_DEMO_PROJECT.id;
  }

  setActiveProjectId(id: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACTIVE_PROJECT_ID_KEY, id);
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
