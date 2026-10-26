import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import type { IncomingMessage, ServerResponse } from 'http';

function getApiKey(): string {
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY.trim();
  }
  const envFiles = ['.env', 'env..txt'];
  for (const f of envFiles) {
    try {
      const p = path.resolve(process.cwd(), f);
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf8').trim();
        const match = content.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)["']?/);
        if (match && match[1]) {
          return match[1].trim();
        }
        if (content && !content.includes('=')) {
          return content.trim();
        }
      }
    } catch {
      // ignore
    }
  }
  return '';
}

let cachedGenAI: GoogleGenAI | null = null;
function getGenAIClient(): GoogleGenAI | null {
  if (cachedGenAI) return cachedGenAI;
  const key = getApiKey();
  if (!key) return null;
  cachedGenAI = new GoogleGenAI({ apiKey: key });
  return cachedGenAI;
}

function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitDepth = 16): Buffer {
  const byteRate = sampleRate * numChannels * (bitDepth / 8);
  const blockAlign = numChannels * (bitDepth / 8);
  const buffer = Buffer.alloc(44 + pcmBuffer.length);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + pcmBuffer.length, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitDepth, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(pcmBuffer.length, 40);
  pcmBuffer.copy(buffer, 44);

  return buffer;
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

export function geminiApiMiddleware() {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url || '';

    // Handle preflight CORS
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
        const hasKey = !!getApiKey();
        return sendJson(res, 200, {
          status: 'ok',
          hasGeminiKey: hasKey,
          version: '2.0.0',
        });
      }

      // 2. Sample Images list
      if (url === '/api/sample-images') {
        const samples = [
          {
            id: 'sample_1',
            title: 'Desk Procrastination (Scene 1)',
            url: '/samples/sample_scene_1.jpg',
            aspectRatio: '9:16',
          },
          {
            id: 'sample_2',
            title: 'Limbic Battle (Scene 2)',
            url: '/samples/sample_scene_2.jpg',
            aspectRatio: '9:16',
          },
          {
            id: 'sample_3',
            title: 'Instant Gratification Monkey (Scene 3)',
            url: '/samples/sample_scene_3.jpg',
            aspectRatio: '9:16',
          },
          {
            id: 'sample_4',
            title: 'Emotional Threat Avoidance (Scene 4)',
            url: '/samples/sample_scene_4.jpg',
            aspectRatio: '9:16',
          },
          {
            id: 'sample_5',
            title: 'The 2-Minute Victory (Scene 5)',
            url: '/samples/sample_scene_5.jpg',
            aspectRatio: '9:16',
          },
        ];
        return sendJson(res, 200, { samples });
      }

      // 3. AI Plan Generation via Gemini 3.5 Flash
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

        const ai = getGenAIClient();
        if (!ai) {
          return sendJson(res, 400, {
            error: 'GEMINI_API_KEY is not configured on the server.',
          });
        }

        const prompt = `You are a viral faceless short-form video director and scriptwriter (for TikTok, Reels, YouTube Shorts).
Create a high-retention video plan based on:
TOPIC/CONTENT: """${topic}"""

SPECIFICATIONS:
- Number of scenes: exactly ${sceneCount}
- Aspect ratio: "${aspectRatio}"
- Visual style: "${style}"
- Language: "${language}"
- Tone/Persona: "${voicePersona}"
- Total target duration: approximately ${targetDuration} seconds

SCENE REQUIREMENTS:
- narration: Punchy, spoken naturally (no robotic textbook language), smooth transitions.
- image_prompt: Detailed prompt in the visual style "${style}" representing the scene.
- on_screen_text: Bold short hook or headline for caption overlay (1-5 words).
- animation: One of ["slow_zoom_in", "slow_zoom_out", "pan_left", "pan_right", "pan_up", "pan_down", "ken_burns", "floating", "parallax", "shake", "bounce"].
- transition: One of ["fade", "crossfade", "slide_left", "slide_right", "zoom", "blur", "wipe", "push"].
- duration: Average ${Math.round(targetDuration / sceneCount)} seconds.

Format your output ONLY as JSON matching this schema:
{
  "project": {
    "title": "Short punchy title",
    "description": "1-sentence hook",
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
      "narration": "...",
      "image_prompt": "...",
      "on_screen_text": "...",
      "animation": "slow_zoom_in",
      "transition": "crossfade"
    }
  ]
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text || '{}';
        let parsed: any;
        try {
          parsed = JSON.parse(rawText);
        } catch {
          const match = rawText.match(/\{[\s\S]*\}/);
          if (match) {
            parsed = JSON.parse(match[0]);
          } else {
            throw new Error('Failed to parse Gemini JSON output');
          }
        }

        return sendJson(res, 200, { success: true, plan: parsed });
      }

      // 4. Voiceover Generation via Gemini TTS
      if (url === '/api/generate-voice' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const { text, voiceId = 'female_educational', language = 'English' } = body;

        if (!text || typeof text !== 'string') {
          return sendJson(res, 400, { error: 'Text is required for voice generation' });
        }

        const ai = getGenAIClient();
        if (!ai) {
          return sendJson(res, 400, { error: 'GEMINI_API_KEY is not configured on the server.' });
        }

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-preview-tts',
          contents: text,
          config: {
            responseModalities: ['AUDIO'],
          },
        });

        const candidate = response.candidates?.[0];
        const audioPart = candidate?.content?.parts?.find((p) => p.inlineData?.mimeType?.startsWith('audio/'));

        if (!audioPart || !audioPart.inlineData?.data) {
          return sendJson(res, 500, { error: 'No audio returned from Gemini TTS model' });
        }

        const pcmBuffer = Buffer.from(audioPart.inlineData.data, 'base64');
        const wavBuffer = pcmToWav(pcmBuffer, 24000);
        const durationSec = Math.round((pcmBuffer.length / (24000 * 2)) * 100) / 100;
        const dataUrl = `data:audio/wav;base64,${wavBuffer.toString('base64')}`;

        return sendJson(res, 200, {
          success: true,
          audioUrl: dataUrl,
          duration: durationSec,
          sampleRate: 24000,
        });
      }

      // 5. Image Generation via Gemini or curated AI style illustrations
      if (url === '/api/generate-image' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const { prompt = '', style = 'stickman', aspectRatio = '9:16', sceneNumber = 1 } = body;

        const ai = getGenAIClient();
        // If Gemini Image model is active, attempt it; if quota exceeded, gracefully return null
        let generatedDataUrl: string | null = null;

        if (ai) {
          try {
            const imgRes = await ai.models.generateContent({
              model: 'gemini-2.5-flash-image',
              contents: `Illustration in ${style} visual style, ${aspectRatio} aspect ratio: ${prompt}`,
              config: {
                responseModalities: ['IMAGE', 'TEXT'],
              },
            });

            const imgPart = imgRes.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.mimeType?.startsWith('image/'));
            if (imgPart?.inlineData?.data) {
              generatedDataUrl = `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`;
            }
          } catch (e: any) {
            // Quota or model fallback is normal on free-tier, we handle gracefully
          }
        }

        // Return result or flag to use fallback
        return sendJson(res, 200, {
          success: true,
          imageUrl: generatedDataUrl,
          hasFallback: !generatedDataUrl,
        });
      }

      return sendJson(res, 404, { error: `Endpoint ${url} not found` });
    } catch (error: any) {
      console.error('API Error:', error);
      return sendJson(res, 500, {
        error: error.message || 'Internal server error',
      });
    }
  };
}
