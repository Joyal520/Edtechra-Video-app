import { AspectRatio, VideoStyle } from '../types/video';

export interface GenerateImageParams {
  prompt: string;
  aspectRatio: AspectRatio;
  style: VideoStyle;
  sceneNumber?: number;
  onScreenText?: string;
  title?: string;
  forceRegenerate?: boolean;
}

export interface ImageGenerationService {
  generateImage(params: GenerateImageParams, forceRegenerate?: boolean): Promise<string>;
  generateBatch(
    items: GenerateImageParams[],
    onProgress?: (current: number, total: number) => void
  ): Promise<string[]>;
}

export function createProceduralSvg(params: GenerateImageParams): string {
  const width =
    params.aspectRatio === '9:16'
      ? 540
      : params.aspectRatio === '16:9'
      ? 960
      : params.aspectRatio === '4:5'
      ? 576
      : 720;
  const height =
    params.aspectRatio === '9:16'
      ? 960
      : params.aspectRatio === '16:9'
      ? 540
      : 720;
  const sceneNum = params.sceneNumber || 1;
  const style = params.style || 'stickman';
  const headline = (params.onScreenText || `Scene ${sceneNum}`).toUpperCase();
  const cleanPrompt = params.prompt.replace(/["<>]/g, '').slice(0, 95);

  let bgGradient = '';
  let accentColor = '#6366f1';
  let illustrationSvg = '';

  switch (style) {
    case 'stickman': {
      bgGradient = `
        <radialGradient id="bg" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="#1e1e24" />
          <stop offset="100%" stop-color="#0d0d11" />
        </radialGradient>
      `;
      accentColor = '#38bdf8';
      illustrationSvg = `
        <!-- Stickman character -->
        <circle cx="${width / 2}" cy="${height / 2 - 60}" r="38" stroke="#ffffff" stroke-width="6" fill="#18181b" />
        <line x1="${width / 2}" y1="${height / 2 - 22}" x2="${width / 2}" y2="${height / 2 + 70}" stroke="#ffffff" stroke-width="6" stroke-linecap="round" />
        <line x1="${width / 2}" y1="${height / 2 + 10}" x2="${width / 2 - 65}" y2="${height / 2 - 20}" stroke="#38bdf8" stroke-width="6" stroke-linecap="round" />
        <line x1="${width / 2}" y1="${height / 2 + 10}" x2="${width / 2 + 65}" y2="${height / 2 - 25}" stroke="#38bdf8" stroke-width="6" stroke-linecap="round" />
        <line x1="${width / 2}" y1="${height / 2 + 70}" x2="${width / 2 - 45}" y2="${height / 2 + 150}" stroke="#ffffff" stroke-width="6" stroke-linecap="round" />
        <line x1="${width / 2}" y1="${height / 2 + 70}" x2="${width / 2 + 45}" y2="${height / 2 + 150}" stroke="#ffffff" stroke-width="6" stroke-linecap="round" />
        <circle cx="${width / 2 + 75}" cy="${height / 2 - 120}" r="22" fill="#fbbf24" opacity="0.9" />
        <text x="${width / 2 + 75}" y="${height / 2 - 114}" font-size="20" text-anchor="middle" fill="#000" font-weight="bold">💡</text>
      `;
      break;
    }
    case '3d_cartoon': {
      bgGradient = `
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4c1d95" />
          <stop offset="50%" stop-color="#312e81" />
          <stop offset="100%" stop-color="#1e1b4b" />
        </linearGradient>
      `;
      accentColor = '#a855f7';
      illustrationSvg = `
        <circle cx="${width / 2}" cy="${height / 2}" r="110" fill="#8b5cf6" opacity="0.3" filter="blur(20px)" />
        <circle cx="${width / 2}" cy="${height / 2 - 30}" r="75" fill="url(#sphereGlow)" />
        <circle cx="${width / 2 - 50}" cy="${height / 2 + 60}" r="45" fill="#ec4899" opacity="0.8" />
        <circle cx="${width / 2 + 65}" cy="${height / 2 + 50}" r="55" fill="#06b6d4" opacity="0.8" />
        <defs>
          <radialGradient id="sphereGlow" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#f472b6" />
            <stop offset="60%" stop-color="#9333ea" />
            <stop offset="100%" stop-color="#4338ca" />
          </radialGradient>
        </defs>
      `;
      break;
    }
    case 'cinematic': {
      bgGradient = `
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="50%" stop-color="#111827" />
          <stop offset="100%" stop-color="#030712" />
        </linearGradient>
      `;
      accentColor = '#f59e0b';
      illustrationSvg = `
        <ellipse cx="${width / 2}" cy="${height / 2 - 40}" rx="${width * 0.4}" ry="3" fill="#f59e0b" opacity="0.8" />
        <circle cx="${width / 2}" cy="${height / 2 - 40}" r="70" fill="#f59e0b" opacity="0.15" />
        <polygon points="${width / 2 - 90},${height / 2 + 100} ${width / 2},${height / 2 - 60} ${width / 2 + 90},${height / 2 + 100}" fill="#38bdf8" opacity="0.15" />
        <circle cx="${width / 2}" cy="${height / 2 - 40}" r="35" stroke="#f59e0b" stroke-width="2" fill="none" opacity="0.7" />
      `;
      break;
    }
    case 'whiteboard': {
      bgGradient = `
        <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#f8fafc" />
          <stop offset="100%" stop-color="#e2e8f0" />
        </linearGradient>
      `;
      accentColor = '#0284c7';
      illustrationSvg = `
        <rect x="${width / 2 - 90}" y="${height / 2 - 70}" width="180" height="110" rx="8" stroke="#1e293b" stroke-width="5" stroke-dasharray="8 4" fill="none" />
        <circle cx="${width / 2 - 40}" cy="${height / 2 - 15}" r="22" stroke="#0284c7" stroke-width="4" fill="none" />
        <circle cx="${width / 2 + 40}" cy="${height / 2 - 15}" r="22" stroke="#ef4444" stroke-width="4" fill="none" />
        <line x1="${width / 2 - 18}" y1="${height / 2 - 15}" x2="${width / 2 + 18}" y2="${height / 2 - 15}" stroke="#1e293b" stroke-width="4" />
        <text x="${width / 2}" y="${height / 2 + 90}" font-family="sans-serif" font-weight="bold" font-size="16" fill="#334155" text-anchor="middle">Step by Step Analysis</text>
      `;
      break;
    }
    case 'anime': {
      bgGradient = `
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e1b4b" />
          <stop offset="40%" stop-color="#581c87" />
          <stop offset="100%" stop-color="#db2777" />
        </linearGradient>
      `;
      accentColor = '#f43f5e';
      illustrationSvg = `
        <circle cx="${width / 2}" cy="${height / 2 - 10}" r="80" fill="#fda4af" opacity="0.6" />
        <path d="M ${width / 2 - 120} ${height / 2 + 120} Q ${width / 2} ${height / 2 + 30} ${width / 2 + 120} ${height / 2 + 120} Z" fill="#0f172a" />
        <circle cx="${width / 2 - 70}" cy="${height / 2 - 80}" r="8" fill="#fbcfe8" opacity="0.8" />
        <circle cx="${width / 2 + 85}" cy="${height / 2 - 95}" r="11" fill="#f472b6" opacity="0.7" />
      `;
      break;
    }
    default: {
      bgGradient = `
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="50%" stop-color="#1e293b" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
      `;
      accentColor = '#10b981';
      illustrationSvg = `
        <circle cx="${width / 2}" cy="${height / 2 - 40}" r="40" fill="#10b981" opacity="0.2" stroke="#10b981" stroke-width="4" />
        <circle cx="${width / 2 - 80}" cy="${height / 2 + 30}" r="28" fill="#3b82f6" opacity="0.2" stroke="#3b82f6" stroke-width="4" />
        <circle cx="${width / 2 + 80}" cy="${height / 2 + 30}" r="28" fill="#f59e0b" opacity="0.2" stroke="#f59e0b" stroke-width="4" />
        <line x1="${width / 2 - 25}" y1="${height / 2 - 20}" x2="${width / 2 - 60}" y2="${height / 2 + 10}" stroke="#64748b" stroke-width="3" stroke-dasharray="4" />
        <line x1="${width / 2 + 25}" y1="${height / 2 - 20}" x2="${width / 2 + 60}" y2="${height / 2 + 10}" stroke="#64748b" stroke-width="3" stroke-dasharray="4" />
      `;
      break;
    }
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        ${bgGradient}
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${style === 'whiteboard' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'}" stroke-width="1"/>
        </pattern>
      </defs>

      <rect width="${width}" height="${height}" fill="url(#bg)" />
      <rect width="${width}" height="${height}" fill="url(#grid)" />

      <g transform="translate(24, 28)">
        <rect width="110" height="32" rx="16" fill="${style === 'whiteboard' ? '#0f172a' : 'rgba(255,255,255,0.12)'}" />
        <text x="55" y="21" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="1">SCENE ${sceneNum.toString().padStart(2, '0')}</text>
      </g>

      <g transform="translate(${width - 134}, 28)">
        <rect width="110" height="32" rx="16" fill="${accentColor}" opacity="0.9" />
        <text x="55" y="21" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="#000000" text-anchor="middle" letter-spacing="0.5">${style.toUpperCase()}</text>
      </g>

      <g id="illustration">
        ${illustrationSvg}
      </g>

      <g transform="translate(${width * 0.08}, ${height - 180})">
        <rect width="${width * 0.84}" height="76" rx="16" fill="${style === 'whiteboard' ? '#0f172a' : 'rgba(0,0,0,0.75)'}" stroke="${accentColor}" stroke-width="2" />
        <text x="${(width * 0.84) / 2}" y="45" font-family="system-ui, -apple-system, sans-serif" font-size="${width < 600 ? '18' : '22'}" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="0.5">${headline}</text>
      </g>

      <text x="${width / 2}" y="${height - 40}" font-family="system-ui, sans-serif" font-size="11" fill="${style === 'whiteboard' ? '#64748b' : '#94a3b8'}" text-anchor="middle" font-weight="500">
        ${cleanPrompt}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DUNNING_KRUGER_STAGES = [
  {
    stage: 1,
    title: 'Stage 1: Beginner Overconfidence',
    subtitle: 'Beginner feels very confident (Peak of Ignorance)',
    url: '/samples/dunning_kruger_1.jpg',
    narration: 'At first, beginners may feel very confident because they do not yet know how difficult the subject is.',
  },
  {
    stage: 2,
    title: 'Stage 2: Discovery of Difficulty',
    subtitle: 'Discovers new things they still need to understand',
    url: '/samples/dunning_kruger_2.jpg',
    narration: 'But as they learn more, they discover many new things they still need to understand.',
  },
  {
    stage: 3,
    title: 'Stage 3: Confidence Drops',
    subtitle: 'Realizes how much they do not know (Valley of Despair)',
    url: '/samples/dunning_kruger_3.jpg',
    narration: 'Then their confidence drops because they finally see how much they do not know.',
  },
  {
    stage: 4,
    title: 'Stage 4: Humility & Patience',
    subtitle: 'Understands real learning takes time and patience',
    url: '/samples/dunning_kruger_4.jpg',
    narration: 'They become more humble and understand that real learning takes time, practice, and patience.',
  },
  {
    stage: 5,
    title: 'Stage 5: Sustainable Mastery',
    subtitle: 'Real skill and confidence grow together realistically',
    url: '/samples/dunning_kruger_5.jpg',
    narration: 'With experience, their skill grows, and their confidence becomes more realistic.',
  },
];

export const SAMPLE_IMAGES = [
  {
    id: 'dk_1',
    title: 'Stage 1: Peak of Overconfidence',
    url: '/samples/dunning_kruger_1.jpg',
    description: 'Beginner feels very confident on the 9:16 vertical illustration',
  },
  {
    id: 'dk_2',
    title: 'Stage 2: Discovering Complexity',
    url: '/samples/dunning_kruger_2.jpg',
    description: 'Discovers the subject is difficult on the 9:16 vertical illustration',
  },
  {
    id: 'dk_3',
    title: 'Stage 3: Valley of Despair',
    url: '/samples/dunning_kruger_3.jpg',
    description: 'Confidence drops realizing how much they do not know',
  },
  {
    id: 'dk_4',
    title: 'Stage 4: Slope of Humility',
    url: '/samples/dunning_kruger_4.jpg',
    description: 'Becomes humble, continuing with patience and practice',
  },
  {
    id: 'dk_5',
    title: 'Stage 5: Real Skill & Mastery',
    url: '/samples/dunning_kruger_5.jpg',
    description: 'Real skill and confidence grow together realistically',
  },
];

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Selected file must be an image (PNG, JPG, WEBP).'));
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

export class OpenAIImageGenerationService implements ImageGenerationService {
  async generateImage(params: GenerateImageParams, forceRegenerate = false): Promise<string> {
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: params.prompt,
          style: params.style,
          aspectRatio: params.aspectRatio,
          sceneNumber: params.sceneNumber,
          onScreenText: params.onScreenText,
          forceRegenerate: forceRegenerate || params.forceRegenerate,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.imageUrl) {
        return data.imageUrl;
      }

      if (data.error) {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.warn('OpenAI Image generation notice:', err.message);
      // If server error or offline, fallback to procedural SVG so user isn't blocked
      if (err.message && (err.message.includes('quota') || err.message.includes('balance') || err.message.includes('missing') || err.message.includes('failed'))) {
        throw err;
      }
    }

    // High fidelity procedural visual fallback matching style and aspect ratio
    await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 200));
    return createProceduralSvg(params);
  }

  async generateBatch(
    items: GenerateImageParams[],
    onProgress?: (current: number, total: number) => void
  ): Promise<string[]> {
    const results: string[] = [];
    for (let i = 0; i < items.length; i++) {
      if (onProgress) {
        onProgress(i + 1, items.length);
      }
      const img = await this.generateImage({
        ...items[i],
        sceneNumber: i + 1,
      });
      results.push(img);
    }
    return results;
  }
}

export const imageGenerationService: ImageGenerationService = new OpenAIImageGenerationService();
