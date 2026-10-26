import { VideoProject, VideoStyle, AspectRatio } from '../types/video';
import { normalizeImportedProject } from './schema';

export interface GeneratePlanOptions {
  topic: string;
  style: VideoStyle;
  customStylePrompt?: string;
  sceneCount: number;
  aspectRatio: AspectRatio;
  targetDuration: number;
  language: string;
  voicePersona?: string;
}

export interface AIPlannerService {
  generatePlan(options: GeneratePlanOptions): Promise<VideoProject>;
}

export class OpenAIPlannerService implements AIPlannerService {
  async generatePlan(options: GeneratePlanOptions): Promise<VideoProject> {
    const res = await fetch('/api/generate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: options.topic,
        style: options.style,
        sceneCount: options.sceneCount,
        aspectRatio: options.aspectRatio,
        targetDuration: options.targetDuration,
        language: options.language,
        voicePersona: options.voicePersona,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Plan generation failed with status ${res.status}`);
    }

    const data = await res.json();
    if (!data.plan) {
      throw new Error('Server returned an empty video plan');
    }

    return normalizeImportedProject(data.plan);
  }
}

export const aiPlannerService: AIPlannerService = new OpenAIPlannerService();
