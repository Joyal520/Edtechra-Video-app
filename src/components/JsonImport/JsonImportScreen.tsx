import React, { useState, useEffect } from 'react';
import {
  ValidationResult,
  VideoProject,
  VideoStyle,
  AspectRatio,
} from '../../types/video';
import { validateVideoPlanJson, normalizeImportedProject } from '../../services/schema';
import { imageGenerationService } from '../../services/imageGenerationService';
import {
  FileJson,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Trash2,
  Layers,
  Clock,
  Smartphone,
  Copy,
  Check,
} from 'lucide-react';

interface JsonImportScreenProps {
  initialTopic?: string;
  initialStyle?: VideoStyle;
  initialRatio?: AspectRatio;
  initialScenesCount?: number;
  initialDuration?: number;
  onBack: () => void;
  onImportComplete: (project: VideoProject) => void;
}

export const JsonImportScreen: React.FC<JsonImportScreenProps> = ({
  initialTopic = 'Why Do We Procrastinate?',
  initialStyle = 'stickman',
  initialRatio = '9:16',
  initialScenesCount = 5,
  initialDuration = 45,
  onBack,
  onImportComplete,
}) => {
  const [jsonText, setJsonText] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');

  // Sample plan builder based on context
  const getExamplePlan = (topic: string, style: VideoStyle, ratio: AspectRatio) => {
    return JSON.stringify(
      {
        project: {
          title: topic || 'The Secret Science of Procrastination',
          description: 'A punchy faceless breakdown explaining why your brain delays essential tasks.',
          aspect_ratio: ratio,
          resolution: ratio === '9:16' ? '1080x1920' : ratio === '16:9' ? '1920x1080' : '1080x1080',
          fps: 30,
          style: style,
          language: 'English',
          total_duration: 38,
        },
        scenes: [
          {
            id: 1,
            duration: 7,
            narration: 'Ever notice how you suddenly feel the urge to clean your desk the exact minute you sit down to study?',
            image_prompt: 'A minimalist stickman staring wide-eyed at a glowing laptop screen with a giant question mark overhead.',
            on_screen_text: 'THE DESK DISTRACTION',
            animation: 'slow_zoom_in',
            transition: 'crossfade',
          },
          {
            id: 2,
            duration: 8,
            narration: 'Scientists discovered procrastination is not a time management flaw—it is an emotional survival reflex.',
            image_prompt: 'A split cartoon brain with one half panicking and the other half relaxing with headphones.',
            on_screen_text: 'NOT LAZINESS',
            animation: 'pan_left',
            transition: 'slide_left',
          },
          {
            id: 3,
            duration: 8,
            narration: 'Your amygdala detects stressful tasks as physical danger, triggering an immediate fight-or-flight escape into short videos.',
            image_prompt: 'Stickman running away from a towering folder labeled DEADLINES toward a glowing smartphone.',
            on_screen_text: 'AMYGDALA HIJACK',
            animation: 'ken_burns',
            transition: 'zoom',
          },
          {
            id: 4,
            duration: 8,
            narration: 'To outsmart this, trick your brain with micro-commitments. Tell yourself you will only do two minutes of work.',
            image_prompt: 'Stickman tapping a digital timer showing 02:00 with a confident smile.',
            on_screen_text: 'THE 2-MINUTE HACK',
            animation: 'floating',
            transition: 'wipe',
          },
          {
            id: 5,
            duration: 7,
            narration: 'Once the timer starts, the psychological friction disappears. Save this for your next study session!',
            image_prompt: 'Triumphant stickman standing with arms raised on a mountain peak with fireworks.',
            on_screen_text: 'SAVE THIS VIDEO',
            animation: 'bounce',
            transition: 'fade',
          },
        ],
      },
      null,
      2
    );
  };

  const handleValidate = () => {
    if (!jsonText.trim()) {
      setValidationResult({
        isValid: false,
        errors: [{ path: 'root', message: 'Please paste your JSON video plan first.' }],
        warnings: [],
      });
      return;
    }

    const result = validateVideoPlanJson(jsonText);
    setValidationResult(result);
  };

  const handleLoadExample = () => {
    const example = getExamplePlan(initialTopic, initialStyle, initialRatio);
    setJsonText(example);
    const result = validateVideoPlanJson(example);
    setValidationResult(result);
  };

  const handleClear = () => {
    setJsonText('');
    setValidationResult(null);
  };

  const handleGenerateWithOpenAI = async () => {
    setIsProcessing(true);
    setProgressMsg('Calling OpenAI to craft video plan...');

    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: initialTopic,
          style: initialStyle,
          aspectRatio: initialRatio,
          sceneCount: initialScenesCount,
          targetDuration: initialDuration,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate plan with OpenAI');
      }

      const data = await res.json();
      const planStr = JSON.stringify(data.plan, null, 2);
      setJsonText(planStr);
      setValidationResult(validateVideoPlanJson(planStr));
    } catch (err: any) {
      setValidationResult({
        isValid: false,
        errors: [{ path: 'root', message: `OpenAI plan generation failed: ${err.message}` }],
        warnings: [],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportAndProceed = async () => {
    const result = validateVideoPlanJson(jsonText);
    if (!result.isValid) {
      setValidationResult(result);
      return;
    }

    setIsProcessing(true);
    setProgressMsg('Parsing and initializing video scenes...');

    try {
      const project = normalizeImportedProject(jsonText);

      // Cost protection: Do not auto-generate images on import.
      // Set thumbnail if first scene has image, or mark ready for studio.
      project.thumbnailUrl = project.scenes[0]?.imageUrl || '/samples/sample_scene_1.jpg';
      project.status = 'ready';

      setProgressMsg('Opening production workspace...');
      await new Promise((r) => setTimeout(r, 200));
      onImportComplete(project);
    } catch (err: any) {
      setValidationResult({
        isValid: false,
        errors: [{ path: 'root', message: `Import failed: ${err.message}` }],
        warnings: [],
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-950 text-neutral-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Generator</span>
          </button>

          <div className="flex items-center gap-3 text-xs">
            <span className="font-semibold px-2.5 py-1 rounded-full bg-neutral-900 text-neutral-400">
              1. Setup
            </span>
            <span className="text-neutral-600">→</span>
            <span className="font-semibold px-2.5 py-1 rounded-full bg-neutral-900 text-neutral-400">
              2. Prompt
            </span>
            <span className="text-neutral-600">→</span>
            <span className="font-semibold px-2.5 py-1 rounded-full bg-indigo-600 text-white">
              3. JSON Import
            </span>
          </div>
        </div>

        {/* Title & Instructions */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <FileJson className="w-3.5 h-3.5" />
            Schema Parser & Validator
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Import AI Video Plan
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Paste the JSON generated by your AI tool below. Our engine will validate every scene, narration timing, and image prompt.
          </p>
        </div>

        {/* Editor Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/60 p-3 rounded-2xl border border-neutral-800">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleGenerateWithOpenAI}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate with OpenAI</span>
            </button>
            <button
              type="button"
              onClick={handleValidate}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Validate JSON</span>
            </button>
            <button
              type="button"
              onClick={handleLoadExample}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Example</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-2 rounded-xl text-xs sm:text-sm text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>

        {/* Main JSON Textarea */}
        <div className="relative rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-2xl focus-within:border-indigo-500/80 transition-all">
          <div className="px-4 py-2 bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-between text-xs text-neutral-400 font-mono">
            <span>video_plan.json</span>
            <span>{jsonText.split('\n').length} lines</span>
          </div>
          <textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              if (validationResult) setValidationResult(null);
            }}
            placeholder={`{\n  "project": {\n    "title": "Why Do We Procrastinate?",\n    "aspect_ratio": "9:16",\n    "style": "stickman"\n  },\n  "scenes": [\n    {\n      "id": 1,\n      "duration": 8,\n      "narration": "Have you ever delayed something important?",\n      "image_prompt": "A simple stickman sitting at a desk...",\n      "on_screen_text": "Why do we procrastinate?",\n      "animation": "slow_zoom_in",\n      "transition": "crossfade"\n    }\n  ]\n}`}
            rows={14}
            className="w-full p-4 font-mono text-xs sm:text-sm text-emerald-300 bg-neutral-900/90 placeholder-neutral-600 focus:outline-none resize-y leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Validation Diagnostic Status Box */}
        {validationResult && (
          <div>
            {validationResult.isValid ? (
              <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200">
                <div className="flex items-center gap-2 font-bold text-base text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>✓ Valid Video Plan</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-3 border-t border-emerald-500/20 text-xs">
                  <div>
                    <span className="text-neutral-400 block">Scenes Detected</span>
                    <span className="font-bold text-sm text-white flex items-center gap-1 mt-0.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      {validationResult.summary?.sceneCount} scenes
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">Total Duration</span>
                    <span className="font-bold text-sm text-white flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      {validationResult.summary?.totalDuration} seconds
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">Aspect Ratio</span>
                    <span className="font-bold text-sm text-white flex items-center gap-1 mt-0.5">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                      {validationResult.summary?.aspectRatio}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block">Visual Style</span>
                    <span className="font-bold text-sm text-white capitalize mt-0.5">
                      {validationResult.summary?.style}
                    </span>
                  </div>
                </div>

                {validationResult.warnings.length > 0 && (
                  <div className="mt-3 text-xs text-amber-300">
                    <span className="font-semibold">Note:</span>{' '}
                    {validationResult.warnings.map((w) => w.message).join(' ')}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-base text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                  <span>JSON Validation Error</span>
                </div>
                <p className="text-xs text-neutral-300">
                  Please review the following requirements before importing:
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs text-rose-300 font-mono pt-1">
                  {validationResult.errors.map((err, i) => (
                    <li key={i}>
                      {err.sceneIndex ? `Scene ${err.sceneIndex}: ` : ''}
                      {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Processing State Banner */}
        {isProcessing && (
          <div className="p-4 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 text-sm flex items-center gap-3 animate-pulse">
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <span>{progressMsg}</span>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="pt-4 flex items-center justify-between border-t border-neutral-800">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            ← Back to Wizard
          </button>

          <button
            type="button"
            disabled={isProcessing || !jsonText.trim()}
            onClick={handleImportAndProceed}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Import & Open Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
