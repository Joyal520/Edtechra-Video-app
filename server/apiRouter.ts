import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';
import { renderVideoWithFfmpeg } from './ffmpegRenderer.ts';

function getEnvKey(key: string): string {
  if (process.env[key]) return process.env[key]!.trim();

  const envFiles = ['.env', 'env..txt'];
  for (const f of envFiles) {
    try {
      const p = path.resolve(process.cwd(), f);
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf8');
        const lines = content.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith(`${key}=`)) {
            let val = trimmed.slice(key.length + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            return val.trim();
          }
        }
      }
    } catch {
      // ignore
    }
  }
  return '';
}

function getOpenAIKey(): string {
  return getEnvKey('OPENAI_API_KEY');
}

function getGeminiKey(): string {
  return getEnvKey('GEMINI_API_KEY');
}

async function readJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(new Error('Invalid JSON request body'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, payload: any) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
}

// Map app voice IDs to OpenAI TTS voice names
function mapToOpenAIVoice(voiceId: string): 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' {
  switch (voiceId) {
    case 'female_friendly':
      return 'nova';
    case 'female_educational':
      return 'shimmer';
    case 'female_storyteller':
      return 'alloy';
    case 'male_friendly':
      return 'echo';
    case 'male_educational':
      return 'onyx';
    case 'male_storyteller':
      return 'fable';
    default:
      if (['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'].includes(voiceId)) {
        return voiceId as any;
      }
      return 'nova';
  }
}

export function apiRouterMiddleware() {
  const imagesDir = path.resolve(process.cwd(), 'public/generated/images');
  const audioDir = path.resolve(process.cwd(), 'public/generated/audio');

  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
  if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url || '';

    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end();
      return;
    }

    if (!url.startsWith('/api/')) {
      return next();
    }

    try {
      // 1. Health check
      if (url === '/api/health') {
        const openAIKey = getOpenAIKey();
        const geminiKey = getGeminiKey();
        return sendJson(res, 200, {
          status: 'ok',
          hasOpenAIKey: !!openAIKey,
          hasGeminiKey: !!geminiKey,
          provider: openAIKey ? 'openai' : geminiKey ? 'gemini' : 'mock',
          version: '2.5.0',
        });
      }

      // 2. Sample Images List
      if (url === '/api/sample-images') {
        const samples = [
          {
            id: 'sample_1',
            title: 'Scene 1: Desk Dilemma',
            url: '/samples/sample_scene_1.jpg',
            aspectRatio: '9:16',
          },
          {
            id: 'sample_2',
            title: 'Scene 2: Emotional Clash',
            url: '/samples/sample_scene_2.jpg',
            aspectRatio: '9:16',
          },
          {
            id: 'sample_3',
            title: 'Scene 3: Dopamine Monkey',
            url: '/samples/sample_scene_3.jpg',
            aspectRatio: '9:16',
          },
          {
            id: 'sample_4',
            title: 'Scene 4: Avoidance Threat',
            url: '/samples/sample_scene_4.jpg',
            aspectRatio: '9:16',
          },
          {
            id: 'sample_5',
            title: 'Scene 5: 2-Minute Victory',
            url: '/samples/sample_scene_5.jpg',
            aspectRatio: '9:16',
          },
        ];
        return sendJson(res, 200, { samples });
      }

      // 3. AI Video Plan Generation via OpenAI (or Gemini fallback)
      if (url === '/api/generate-plan' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const {
          topic = 'Why Do People Procrastinate?',
          style = 'stickman',
          sceneCount = 5,
          aspectRatio = '9:16',
          targetDuration = 45,
          language = 'English',
          voicePersona = 'Engaging, clear, conversational',
        } = body;

        const openAIKey = getOpenAIKey();
        if (!openAIKey) {
          return sendJson(res, 400, {
            error: 'OPENAI_API_KEY is not configured on the server. Please check your .env file.',
            code: 'KEY_MISSING',
          });
        }

        const systemPrompt = `You are a viral faceless short-form video creator and scriptwriter (for TikTok, Reels, YouTube Shorts).
Your job is to generate high-retention video plans with punchy narration, natural cadence, and descriptive image prompts.
Strictly return a JSON object with this exact structure:
{
  "project": {
    "title": "Short punchy video title",
    "description": "1-sentence hook summary",
    "aspect_ratio": "${aspectRatio}",
    "resolution": "${aspectRatio === '9:16' ? '1080x1920' : aspectRatio === '16:9' ? '1920x1080' : '1080x1080'}",
    "fps": 30,
    "style": "${style}",
    "language": "${language}",
    "total_duration": ${targetDuration}
  },
  "scenes": [
    {
      "id": 1,
      "duration": ${Math.round(targetDuration / sceneCount)},
      "narration": "Natural conversational spoken hook...",
      "image_prompt": "Detailed visual description adhering to ${style}...",
      "on_screen_text": "HOOK OVERLAY",
      "animation": "slow_zoom_in",
      "transition": "crossfade"
    }
  ]
}

RULES:
- "animation" must be one of: ["slow_zoom_in", "slow_zoom_out", "pan_left", "pan_right", "pan_up", "pan_down", "ken_burns", "floating", "parallax", "shake", "bounce"].
- "transition" must be one of: ["fade", "crossfade", "slide_left", "slide_right", "zoom", "blur", "wipe", "push"].
- Exactly ${sceneCount} scenes.
- Total duration roughly ${targetDuration} seconds.`;

        const userPrompt = `Create a high-retention video plan for:
TOPIC/CONTENT: """${topic}"""
VISUAL STYLE: ${style}
ASPECT RATIO: ${aspectRatio}
TARGET SCENES: ${sceneCount}
LANGUAGE: ${language}
VOICE PERSONA: ${voicePersona}`;

        const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openAIKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
          }),
        });

        if (!openAiRes.ok) {
          const errText = await openAiRes.text();
          let parsedErr: any;
          try {
            parsedErr = JSON.parse(errText);
          } catch {
            parsedErr = { error: { message: errText } };
          }
          return sendJson(res, openAiRes.status, {
            error: parsedErr.error?.message || 'OpenAI plan generation failed',
            code: openAiRes.status === 401 ? 'AUTH_FAILED' : openAiRes.status === 429 ? 'RATE_LIMIT' : 'API_ERROR',
          });
        }

        const data = await openAiRes.json();
        const content = data.choices?.[0]?.message?.content;
        let plan = JSON.parse(content);

        return sendJson(res, 200, { success: true, plan });
      }

      // 4. OpenAI Image Generation
      if (url === '/api/generate-image' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const {
          prompt = '',
          style = 'stickman',
          aspectRatio = '9:16',
          sceneNumber = 1,
          forceRegenerate = false,
        } = body;

        if (!prompt || typeof prompt !== 'string') {
          return sendJson(res, 400, { error: 'Prompt is required for image generation', code: 'INVALID_INPUT' });
        }

        const openAIKey = getOpenAIKey();
        if (!openAIKey) {
          return sendJson(res, 400, {
            error: 'OPENAI_API_KEY is not configured on the server. Please check your .env file.',
            code: 'KEY_MISSING',
          });
        }

        // Cost protection & caching: hash prompt + style + ratio
        const hash = crypto.createHash('md5').update(`${prompt}_${style}_${aspectRatio}`).digest('hex');
        const filename = `img_${hash}.png`;
        const filePath = path.join(imagesDir, filename);
        const publicUrl = `/generated/images/${filename}`;

        if (!forceRegenerate && fs.existsSync(filePath)) {
          return sendJson(res, 200, {
            success: true,
            imageUrl: publicUrl,
            cached: true,
            provider: 'openai',
          });
        }

        // Enhance prompt with style and composition instructions
        let enhancedPrompt = `${prompt}. Style: ${style}. Clean composition, high quality, suitable for short-form video scene ${sceneNumber}. No text watermarks.`;
        if (aspectRatio === '9:16') {
          enhancedPrompt += ' Vertical framing.';
        } else if (aspectRatio === '16:9') {
          enhancedPrompt += ' Widescreen cinematic framing.';
        }

        const openAiRes = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openAIKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-image-1-mini',
            prompt: enhancedPrompt,
            n: 1,
          }),
        });

        if (!openAiRes.ok) {
          const errText = await openAiRes.text();
          let parsedErr: any;
          try {
            parsedErr = JSON.parse(errText);
          } catch {
            parsedErr = { error: { message: errText } };
          }
          return sendJson(res, openAiRes.status, {
            error: parsedErr.error?.message || 'OpenAI image generation failed',
            code: openAiRes.status === 401 ? 'AUTH_FAILED' : openAiRes.status === 429 ? 'RATE_LIMIT' : 'API_ERROR',
          });
        }

        const imgData = await openAiRes.json();
        const item = imgData.data?.[0];

        let finalUrl = publicUrl;
        if (item?.b64_json) {
          const buf = Buffer.from(item.b64_json, 'base64');
          fs.writeFileSync(filePath, buf);
        } else if (item?.url) {
          // Download URL and cache locally so it stays permanent
          const fetchImg = await fetch(item.url);
          const buf = Buffer.from(await fetchImg.arrayBuffer());
          fs.writeFileSync(filePath, buf);
        } else {
          return sendJson(res, 500, { error: 'No image data returned from OpenAI', code: 'NO_IMAGE_DATA' });
        }

        return sendJson(res, 200, {
          success: true,
          imageUrl: finalUrl,
          cached: false,
          provider: 'openai',
        });
      }

      // 5. OpenAI Voiceover Generation via TTS
      if (url === '/api/generate-voice' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const {
          text = '',
          voiceId = 'female_educational',
          language = 'English',
          forceRegenerate = false,
        } = body;

        if (!text || typeof text !== 'string') {
          return sendJson(res, 400, { error: 'Narration text is required for voice generation', code: 'INVALID_INPUT' });
        }

        const openAIKey = getOpenAIKey();
        if (!openAIKey) {
          return sendJson(res, 400, {
            error: 'OPENAI_API_KEY is not configured on the server. Please check your .env file.',
            code: 'KEY_MISSING',
          });
        }

        const openAiVoice = mapToOpenAIVoice(voiceId);
        const hash = crypto.createHash('md5').update(`${text}_${openAiVoice}_${language}`).digest('hex');
        const filename = `voice_${hash}.mp3`;
        const filePath = path.join(audioDir, filename);
        const publicUrl = `/generated/audio/${filename}`;

        if (!forceRegenerate && fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          // Estimate duration: MP3 @ 128kbps = 16000 bytes per second
          const estimatedDuration = Math.max(2, Math.round((stats.size / 16000) * 10) / 10);
          return sendJson(res, 200, {
            success: true,
            audioUrl: publicUrl,
            duration: estimatedDuration,
            voice: openAiVoice,
            cached: true,
            provider: 'openai',
          });
        }

        const openAiRes = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openAIKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'tts-1',
            input: text,
            voice: openAiVoice,
            response_format: 'mp3',
          }),
        });

        if (!openAiRes.ok) {
          const errText = await openAiRes.text();
          let parsedErr: any;
          try {
            parsedErr = JSON.parse(errText);
          } catch {
            parsedErr = { error: { message: errText } };
          }
          return sendJson(res, openAiRes.status, {
            error: parsedErr.error?.message || 'OpenAI voice generation failed',
            code: openAiRes.status === 401 ? 'AUTH_FAILED' : openAiRes.status === 429 ? 'RATE_LIMIT' : 'API_ERROR',
          });
        }

        const audioBuffer = Buffer.from(await openAiRes.arrayBuffer());
        fs.writeFileSync(filePath, audioBuffer);

        const duration = Math.max(2, Math.round((audioBuffer.length / 16000) * 10) / 10);

        return sendJson(res, 200, {
          success: true,
          audioUrl: publicUrl,
          duration,
          voice: openAiVoice,
          cached: false,
          provider: 'openai',
        });
      }

      // 5. Server-side high-quality FFmpeg MP4 Video Render
      if (req.method === 'POST' && url === '/api/render-video') {
        const body = await readJsonBody(req);
        const { project, options } = body;

        if (!project || !project.scenes || project.scenes.length === 0) {
          return sendJson(res, 400, { error: 'Project and scenes are required for rendering.' });
        }

        const renderRes = await renderVideoWithFfmpeg(project, options || { resolution: '1080p', quality: 'high', format: 'mp4' });
        if (renderRes.success) {
          return sendJson(res, 200, renderRes);
        } else {
          return sendJson(res, 500, {
            error: renderRes.error || 'FFmpeg rendering failed',
            fallback: true,
          });
        }
      }

      return sendJson(res, 404, { error: `Endpoint ${url} not found` });
    } catch (err: any) {
      console.error('API Error:', err);
      return sendJson(res, 500, {
        error: err.message || 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  };
}
