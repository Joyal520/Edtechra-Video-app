import test from 'node:test';
import assert from 'node:assert/strict';
import { validateVideoPlanJson, normalizeImportedProject } from './schema';
import { generateAIVideoPrompt } from './promptGenerator';

test('schema validator accepts clean valid video plan', () => {
  const sample = {
    project: {
      title: 'Why Do We Procrastinate?',
      description: 'The science behind postponing work.',
      aspect_ratio: '9:16',
      style: 'stickman',
      language: 'English',
      total_duration: 24,
    },
    scenes: [
      {
        id: 1,
        duration: 8,
        narration: 'Have you ever delayed something important until the last minute?',
        image_prompt: 'A minimalist stickman looking overwhelmed at a messy desk with ticking clock.',
        on_screen_text: 'Why do we procrastinate?',
        animation: 'slow_zoom_in',
        transition: 'crossfade',
      },
      {
        id: 2,
        duration: 8,
        narration: 'Scientists found our brains battle between immediate rewards and future pain.',
        image_prompt: 'A stickman brain split in two: one side partying with popcorn, other side weeping with books.',
        on_screen_text: 'The Brain Battle',
        animation: 'pan_left',
        transition: 'slide_left',
      },
    ],
  };

  const res = validateVideoPlanJson(sample);
  assert.equal(res.isValid, true);
  assert.equal(res.errors.length, 0);
  assert.equal(res.summary?.sceneCount, 2);
  assert.equal(res.summary?.totalDuration, 16);
  assert.equal(res.summary?.aspectRatio, '9:16');
});

test('schema validator catches missing narration and missing image_prompt with scene index', () => {
  const invalid = {
    project: { title: 'Test' },
    scenes: [
      {
        id: 1,
        duration: 5,
        narration: 'Good narration',
        image_prompt: 'Good prompt',
      },
      {
        id: 2,
        duration: 5,
        narration: '', // missing narration!
        image_prompt: 'Good prompt',
      },
      {
        id: 3,
        duration: 5,
        narration: 'Has narration',
        // missing image_prompt!
      },
    ],
  };

  const res = validateVideoPlanJson(invalid);
  assert.equal(res.isValid, false);
  assert.equal(res.errors.length, 2);
  assert.ok(res.errors.some((e) => e.message.includes('Scene 2 is missing narration')));
  assert.ok(res.errors.some((e) => e.message.includes('Scene 3 is missing image_prompt')));
});

test('schema validator strips markdown code fences gracefully', () => {
  const rawWithFences = '```json\n{\n  "project": {"title": "Wrapped in Markdown"},\n  "scenes": [\n    {"narration": "Hello", "image_prompt": "World", "duration": 5}\n  ]\n}\n```';
  const res = validateVideoPlanJson(rawWithFences);
  assert.equal(res.isValid, true);
  assert.equal(res.summary?.sceneCount, 1);
});

test('normalizeImportedProject fills sensible defaults and preserves custom extensions', () => {
  const raw = {
    project: {
      title: 'Quick Video',
      aspect_ratio: '16:9',
      style: '3d_cartoon',
    },
    scenes: [
      {
        narration: 'Take a deep breath.',
        image_prompt: 'A stylized 3D forest with sunbeams.',
      },
    ],
  };

  const project = normalizeImportedProject(raw);
  assert.equal(project.project.title, 'Quick Video');
  assert.equal(project.project.aspect_ratio, '16:9');
  assert.equal(project.project.style, '3d_cartoon');
  assert.equal(project.scenes[0].duration, 6);
  assert.equal(project.scenes[0].animation, 'slow_zoom_in');
  assert.equal(project.scenes[0].transition, 'crossfade');
});

test('generateAIVideoPrompt includes strict instructions and aspect ratio', () => {
  const prompt = generateAIVideoPrompt({
    topicOrContent: 'Photosynthesis explained simply',
    style: 'educational',
    sceneCount: 5,
    aspectRatio: '9:16',
    targetDurationSeconds: 45,
    language: 'English',
  });

  assert.ok(prompt.includes('Photosynthesis explained simply'));
  assert.ok(prompt.includes('Return ONLY valid JSON'));
  assert.ok(prompt.includes('Do not include Markdown'));
  assert.ok(prompt.includes('educational'));
  assert.ok(prompt.includes('9:16'));
});
