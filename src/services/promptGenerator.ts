import { AspectRatio, VideoStyle } from '../types/video';

export interface PromptGenerationOptions {
  topicOrContent: string;
  style: VideoStyle;
  customStylePrompt?: string;
  sceneCount: number;
  aspectRatio: AspectRatio;
  targetDurationSeconds: number;
  language: string;
  voicePersona?: string;
}

export function generateAIVideoPrompt(options: PromptGenerationOptions): string {
  const {
    topicOrContent,
    style,
    customStylePrompt,
    sceneCount,
    aspectRatio,
    targetDurationSeconds,
    language,
    voicePersona,
  } = options;

  const avgSceneDuration = Math.round(targetDurationSeconds / sceneCount) || 8;

  let styleGuidance = '';
  switch (style) {
    case 'stickman':
      styleGuidance =
        'Minimalist, expressive black-and-white or high-contrast stickman characters with clever visual humor, dynamic line work, clear comedic/thoughtful gestures, clean white/dark backgrounds.';
      break;
    case '3d_cartoon':
      styleGuidance =
        'Pixar/Dreamworks inspired 3D animated figures, soft rim lighting, vibrant rich colors, expressive stylized facial expressions, shallow depth of field, high-fidelity render.';
    case 'paper_cut':
      styleGuidance =
        'Stop-motion layered craft paper collage, tactile drop shadows, layered textured craft paper shapes, artistic warm lighting, handcrafted geometric figures.';
      break;
    case 'cinematic':
      styleGuidance =
        'Atmospheric 35mm film photography aesthetic, dramatic volumetric lighting, cinematic color grading (teal & orange or moody monochrome), realistic textures, cinematic composition.';
      break;
    case 'whiteboard':
      styleGuidance =
        'Hand-drawn whiteboard animation doodle style, continuous marker strokes, clean line art, educational diagram icons, high contrast.';
      break;
    case 'anime':
      styleGuidance =
        'Modern Makoto Shinkai / Studio Ghibli inspired anime aesthetic, expressive characters, painted background scenery, glowing light rays, emotive framing.';
      break;
    case 'flat_vector':
      styleGuidance =
        'Modern tech editorial vector illustration, crisp geometric forms, sophisticated color palette, flat shadows, corporate storytelling aesthetic.';
      break;
    case 'educational':
      styleGuidance =
        'Infographic-rich educational visuals, clean data callouts, diagrams, labeled concepts, approachable colors, scientific clarity.';
      break;
    case 'custom':
      styleGuidance = customStylePrompt || 'Custom creative visual aesthetic.';
      break;
    default:
      styleGuidance = 'Clean, modern visual illustration tailored for engaging social video.';
  }

  return `You are an expert viral faceless video producer and educational scriptwriter.
Create a complete, high-retention video production plan based on the following content and requirements:

CONTENT / TOPIC:
"""
${topicOrContent}
"""

PRODUCTION REQUIREMENTS:
- Target Platform / Aspect Ratio: ${aspectRatio} (${aspectRatio === '9:16' ? 'Vertical Short/Reel/TikTok' : aspectRatio === '16:9' ? 'Horizontal YouTube' : 'Square/Social Post'})
- Total Duration: approximately ${targetDurationSeconds} seconds
- Scene Count: exactly ${sceneCount} scenes (roughly ${avgSceneDuration} seconds per scene)
- Visual Art Style: "${style}" (${styleGuidance})
- Language: ${language}
- Voice Persona / Tone: ${voicePersona || 'Engaging, clear, informative'}

RULES FOR SCENES:
1. Every scene must have a punchy, conversational "narration" that flows smoothly into the next scene. Keep hooks strong.
2. "image_prompt" must be descriptive and specific to the "${style}" visual style (mentioning subjects, background, lighting, and action without any watermarks or UI elements).
3. "on_screen_text" should be a short, bold headline or hook (1-5 words) suitable for short-form video captions.
4. "animation" must be one of: ["slow_zoom_in", "slow_zoom_out", "pan_left", "pan_right", "pan_up", "pan_down", "ken_burns", "floating", "parallax", "shake", "bounce"].
5. "transition" must be one of: ["fade", "crossfade", "slide_left", "slide_right", "zoom", "blur", "wipe", "push"].

STRICT OUTPUT FORMAT:
Return ONLY valid JSON.
Do not include Markdown.
Do not include \`\`\`json.
Do not include explanations, preface, or notes.
Follow the provided schema exactly.

SCHEMA EXAMPLE:
{
  "project": {
    "title": "Short punchy title for the video",
    "description": "1-sentence summary",
    "aspect_ratio": "${aspectRatio}",
    "resolution": "${aspectRatio === '9:16' ? '1080x1920' : aspectRatio === '16:9' ? '1920x1080' : '1080x1080'}",
    "fps": 30,
    "style": "${style}",
    "language": "${language}",
    "total_duration": ${targetDurationSeconds}
  },
  "scenes": [
    {
      "id": 1,
      "duration": ${avgSceneDuration},
      "narration": "First hook sentence here...",
      "image_prompt": "Specific visual description adhering to ${style}...",
      "on_screen_text": "HOOK PHRASE",
      "animation": "slow_zoom_in",
      "transition": "crossfade"
    }
  ]
}`;
}
