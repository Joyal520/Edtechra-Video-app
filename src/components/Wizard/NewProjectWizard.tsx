import React, { useState } from 'react';
import {
  VideoStyle,
  AspectRatio,
  VoiceOption,
  VideoProject,
} from '../../types/video';
import { VOICE_OPTIONS, voiceGenerationService } from '../../services/voiceGenerationService';
import { generateAIVideoPrompt } from '../../services/promptGenerator';
import { aiPlannerService } from '../../services/aiPlannerService';
import {
  DUNNING_KRUGER_PROJECT,
  MOTHMAN_MYSTERY_PROJECT,
} from '../../services/storageService';
import {
  Sparkles,
  ArrowRight,
  Volume2,
  Clock,
  Layers,
  Palette,
  Check,
  Smartphone,
  Tv,
  Square,
  Instagram,
  RefreshCw,
  Copy,
  ArrowLeft,
  FileCode2,
  AlertCircle,
} from 'lucide-react';

interface StyleCardConfig {
  id: VideoStyle;
  label: string;
  tagline: string;
  bgPreview: string;
  badgeColor: string;
}

const STYLE_CARDS: StyleCardConfig[] = [
  {
    id: 'creepy_legend',
    label: 'Creepy Legend',
    tagline: 'Dark folklore, red eyes, fog & VHS glitches',
    bgPreview: 'from-red-950/90 to-neutral-950 border-red-500/50',
    badgeColor: 'text-red-300 bg-red-950/80',
  },
  {
    id: 'stickman',
    label: 'Stickman',
    tagline: 'Minimalist humor & high viral retention',
    bgPreview: 'from-neutral-900 to-sky-950 border-sky-500/40',
    badgeColor: 'text-sky-400 bg-sky-950/70',
  },
  {
    id: '3d_cartoon',
    label: '3D Cartoon',
    tagline: 'Pixar-like vibrant lighting & characters',
    bgPreview: 'from-purple-950 to-indigo-950 border-purple-500/40',
    badgeColor: 'text-purple-400 bg-purple-950/70',
  },
  {
    id: 'cinematic',
    label: 'Cinematic',
    tagline: 'Moody 35mm film & dramatic lighting',
    bgPreview: 'from-amber-950/80 to-neutral-950 border-amber-500/40',
    badgeColor: 'text-amber-400 bg-amber-950/70',
  },
  {
    id: 'minimal_illustration',
    label: 'Minimal Illustration',
    tagline: 'Sophisticated modern editorial visuals',
    bgPreview: 'from-emerald-950 to-slate-900 border-emerald-500/40',
    badgeColor: 'text-emerald-400 bg-emerald-950/70',
  },
  {
    id: 'whiteboard',
    label: 'Whiteboard',
    tagline: 'Hand-drawn marker doodle explanations',
    bgPreview: 'from-slate-800 to-slate-950 border-slate-500/40',
    badgeColor: 'text-slate-300 bg-slate-800/80',
  },
  {
    id: 'anime',
    label: 'Anime',
    tagline: 'Expressive Shinkai & Ghibli aesthetic',
    bgPreview: 'from-rose-950 to-indigo-950 border-rose-500/40',
    badgeColor: 'text-rose-400 bg-rose-950/70',
  },
  {
    id: 'paper_cut',
    label: 'Paper Cut',
    tagline: 'Tactile layered craft collage with shadows',
    bgPreview: 'from-orange-950 to-amber-950 border-orange-500/40',
    badgeColor: 'text-orange-400 bg-orange-950/70',
  },
  {
    id: 'flat_vector',
    label: 'Flat Vector',
    tagline: 'Crisp geometric tech diagrams & icons',
    bgPreview: 'from-teal-950 to-neutral-950 border-teal-500/40',
    badgeColor: 'text-teal-400 bg-teal-950/70',
  },
  {
    id: 'educational',
    label: 'Educational',
    tagline: 'Data charts, labeled nodes & science schemas',
    bgPreview: 'from-blue-950 to-indigo-950 border-blue-500/40',
    badgeColor: 'text-blue-400 bg-blue-950/70',
  },
  {
    id: 'custom',
    label: 'Custom Style',
    tagline: 'Describe your own bespoke visual aesthetic',
    bgPreview: 'from-neutral-900 to-neutral-950 border-neutral-700',
    badgeColor: 'text-neutral-300 bg-neutral-800',
  },
];

interface AspectRatioCard {
  id: AspectRatio;
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  frameStyle: string;
}

const RATIO_CARDS: AspectRatioCard[] = [
  {
    id: '9:16',
    label: '9:16 Vertical',
    sub: 'YouTube Shorts, TikTok, Instagram Reels',
    icon: Smartphone,
    frameStyle: 'w-6 h-10 rounded border-2',
  },
  {
    id: '16:9',
    label: '16:9 Widescreen',
    sub: 'YouTube standard landscape, TV, Courses',
    icon: Tv,
    frameStyle: 'w-10 h-6 rounded border-2',
  },
  {
    id: '1:1',
    label: '1:1 Square',
    sub: 'Instagram feed posts, LinkedIn carousels',
    icon: Square,
    frameStyle: 'w-7 h-7 rounded border-2',
  },
  {
    id: '4:5',
    label: '4:5 Portrait',
    sub: 'Instagram & Facebook portrait feeds',
    icon: Instagram,
    frameStyle: 'w-7 h-9 rounded border-2',
  },
];

const SCENE_OPTIONS = [3, 5, 7, 10];
const DURATION_OPTIONS = [
  { label: '30s', value: 30 },
  { label: '45s', value: 45 },
  { label: '60s', value: 60 },
  { label: '90s', value: 90 },
  { label: '2 min', value: 120 },
];

const LANGUAGES = [
  'English',
  'Tamil',
  'Sinhala',
  'Spanish',
  'French',
  'German',
  'Hindi',
  'Japanese',
];

interface NewProjectWizardProps {
  initialTopic?: string;
  initialStyle?: VideoStyle;
  initialRatio?: AspectRatio;
  initialDuration?: number;
  initialScenes?: number;
  onBack: () => void;
  onDirectCreateProject?: (project: VideoProject) => void;
  onContinueToJsonImport: (promptText: string, metadata: {
    topic: string;
    style: VideoStyle;
    aspectRatio: AspectRatio;
    scenesCount: number;
    targetDuration: number;
    language: string;
    voiceId: string;
  }) => void;
}

export const NewProjectWizard: React.FC<NewProjectWizardProps> = ({
  initialTopic = '',
  initialStyle = 'stickman',
  initialRatio = '9:16',
  initialDuration = 45,
  initialScenes = 5,
  onBack,
  onDirectCreateProject,
  onContinueToJsonImport,
}) => {
  // Wizard state
  const [topic, setTopic] = useState(initialTopic);
  const [selectedStyle, setSelectedStyle] = useState<VideoStyle>(initialStyle);
  const [customStylePrompt, setCustomStylePrompt] = useState('');
  const [sceneCount, setSceneCount] = useState<number>(initialScenes);
  const [isCustomScenes, setIsCustomScenes] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(initialRatio);
  const [targetDuration, setTargetDuration] = useState<number>(initialDuration);
  const [language, setLanguage] = useState<string>('English');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('female_educational');

  // Stage: 'form' | 'prompt_preview'
  const [stage, setStage] = useState<'form' | 'prompt_preview'>('form');
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);

  // Direct AI generation state
  const [isGeneratingDirect, setIsGeneratingDirect] = useState(false);
  const [directError, setDirectError] = useState<string | null>(null);

  const selectedVoice = VOICE_OPTIONS.find((v) => v.id === selectedVoiceId) || VOICE_OPTIONS[1];

  const handleDirectGeneratePlan = async () => {
    if (!topic.trim() || isGeneratingDirect) return;
    setIsGeneratingDirect(true);
    setDirectError(null);

    try {
      const project = await aiPlannerService.generatePlan({
        topic: topic.trim(),
        style: selectedStyle,
        sceneCount,
        aspectRatio,
        targetDuration,
        language,
        voicePersona: `${selectedVoice.gender} - ${selectedVoice.persona}`,
      });

      if (onDirectCreateProject) {
        onDirectCreateProject(project);
      } else {
        onContinueToJsonImport(JSON.stringify(project, null, 2), {
          topic,
          style: selectedStyle,
          aspectRatio,
          scenesCount: sceneCount,
          targetDuration,
          language,
          voiceId: selectedVoiceId,
        });
      }
    } catch (err: any) {
      setDirectError(err.message || 'OpenAI plan generation failed. Try manual prompt.');
    } finally {
      setIsGeneratingDirect(false);
    }
  };

  const handleGeneratePrompt = () => {
    if (!topic.trim()) return;

    const promptText = generateAIVideoPrompt({
      topicOrContent: topic.trim(),
      style: selectedStyle,
      customStylePrompt: selectedStyle === 'custom' ? customStylePrompt : undefined,
      sceneCount,
      aspectRatio,
      targetDurationSeconds: targetDuration,
      language,
      voicePersona: `${selectedVoice.gender} - ${selectedVoice.persona}`,
    });

    setGeneratedPrompt(promptText);
    setStage('prompt_preview');
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback
      setIsCopied(true);
    }
  };

  const handlePreviewVoice = (v: VoiceOption) => {
    setPreviewingVoiceId(v.id);
    voiceGenerationService.speakPreview(v.previewSample, v.id);
    setTimeout(() => {
      setPreviewingVoiceId(null);
    }, 3500);
  };

  const handleContinue = () => {
    onContinueToJsonImport(generatedPrompt, {
      topic,
      style: selectedStyle,
      aspectRatio,
      scenesCount: sceneCount,
      targetDuration,
      language,
      voiceId: selectedVoiceId,
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-950 text-neutral-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Top Stepper Breadcrumb */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-800">
          <button
            onClick={() => {
              if (stage === 'prompt_preview') setStage('form');
              else onBack();
            }}
            className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{stage === 'prompt_preview' ? 'Back to Setup' : 'Back to Dashboard'}</span>
          </button>

          <div className="flex items-center gap-3 text-xs">
            <span
              className={`font-semibold px-2.5 py-1 rounded-full ${
                stage === 'form'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              1. Project Setup
            </span>
            <span className="text-neutral-600">→</span>
            <span
              className={`font-semibold px-2.5 py-1 rounded-full ${
                stage === 'prompt_preview'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              2. AI Production Prompt
            </span>
            <span className="text-neutral-600">→</span>
            <span className="font-semibold px-2.5 py-1 rounded-full bg-neutral-900 text-neutral-500">
              3. JSON Import
            </span>
          </div>
        </div>

        {stage === 'form' ? (
          <div className="space-y-10">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Faceless Video Creator Studio
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Configure Your Video Project
              </h1>
              <p className="text-sm text-neutral-400 mt-1">
                Enter your topic or script, select your artistic style, and we will formulate the structured AI production instructions.
              </p>
            </div>

            {/* 1. Topic / Script Input */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
                <span>1. What should the video be about? *</span>
                <span className="text-xs font-normal text-neutral-400">
                  Topic, lesson, notes, or complete script
                </span>
              </label>

              <textarea
                rows={4}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Why do humans procrastinate? Explain the emotional conflict between the prefrontal cortex and the limbic system, with practical tips to overcome it..."
                className="w-full p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm leading-relaxed"
              />

              {/* Quick Prompt Starters */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (onDirectCreateProject) {
                      onDirectCreateProject(MOTHMAN_MYSTERY_PROJECT);
                    } else {
                      setTopic('The Mothman Mystery: Point Pleasant 1966–1967');
                      setSelectedStyle('creepy_legend');
                      setAspectRatio('9:16');
                      setSceneCount(5);
                      setTargetDuration(60);
                    }
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-600/30 border border-red-500/50 text-red-200 font-bold hover:bg-red-600 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-red-300" />
                  <span>🦇 Creepy Legend Preset: The Mothman Mystery (56.9s)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDirectCreateProject) {
                      onDirectCreateProject(DUNNING_KRUGER_PROJECT);
                    } else {
                      setTopic('The Dunning–Kruger Effect: The 5 Stages of Learning');
                      setSelectedStyle('stickman');
                      setAspectRatio('9:16');
                      setSceneCount(5);
                      setTargetDuration(28);
                    }
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600/30 border border-indigo-500/50 text-indigo-200 font-bold hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>🧠 5-Stage Psychology Preset: Dunning–Kruger Effect</span>
                </button>
                <span className="text-xs text-neutral-500 pl-1">Other starters:</span>
                {[
                  'Why deep work is the superpower of the 21st century',
                  'The psychological illusion of luck',
                  'How dopamine loops control social media habits',
                ].map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTopic(s)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-indigo-500/50 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Video Visual Style Cards */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-400" />
                2. Visual & Animation Style
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {STYLE_CARDS.map((style) => {
                  const isSelected = selectedStyle === style.id;
                  return (
                    <div
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`relative cursor-pointer rounded-2xl p-3.5 border transition-all duration-200 flex flex-col justify-between ${
                        isSelected
                          ? `bg-gradient-to-b ${style.bgPreview} ring-2 ring-indigo-500 shadow-lg shadow-indigo-500/20`
                          : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.badgeColor}`}
                          >
                            {style.label}
                          </span>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                              <Check className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-snug line-clamp-2">
                          {style.tagline}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedStyle === 'custom' && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={customStylePrompt}
                    onChange={(e) => setCustomStylePrompt(e.target.value)}
                    placeholder="Describe your custom visual style (e.g. Cyberpunk vaporwave neon pixel art)..."
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              )}
            </div>

            {/* 3. Aspect Ratio Selector */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-white uppercase tracking-wider">
                3. Video Aspect Ratio & Format
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {RATIO_CARDS.map((ratio) => {
                  const isSelected = aspectRatio === ratio.id;
                  const Icon = ratio.icon;
                  return (
                    <div
                      key={ratio.id}
                      onClick={() => setAspectRatio(ratio.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/50 shadow-md'
                          : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`${ratio.frameStyle} flex items-center justify-center ${
                            isSelected
                              ? 'border-indigo-400 bg-indigo-500/20 text-indigo-300'
                              : 'border-neutral-600 text-neutral-500'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="font-bold text-sm text-white">{ratio.label}</div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">{ratio.sub}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Number of Scenes & Target Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Scenes */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Number of Scenes / Images
                </label>
                <div className="flex items-center gap-2">
                  {SCENE_OPTIONS.map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => {
                        setSceneCount(count);
                        setIsCustomScenes(false);
                      }}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                        sceneCount === count && !isCustomScenes
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsCustomScenes(true)}
                    className={`px-3 py-2.5 rounded-xl font-semibold text-xs border transition-all ${
                      isCustomScenes
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Custom
                  </button>
                </div>
                {isCustomScenes && (
                  <div className="pt-2 flex items-center gap-3">
                    <input
                      type="range"
                      min={2}
                      max={15}
                      value={sceneCount}
                      onChange={(e) => setSceneCount(Number(e.target.value))}
                      className="flex-1 accent-indigo-500"
                    />
                    <span className="font-mono text-sm font-bold text-indigo-400 px-2 py-1 bg-neutral-900 rounded-lg border border-neutral-800">
                      {sceneCount} scenes
                    </span>
                  </div>
                )}
              </div>

              {/* Target Duration */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  Target Duration
                </label>
                <div className="flex items-center gap-2">
                  {DURATION_OPTIONS.map((dur) => (
                    <button
                      key={dur.value}
                      type="button"
                      onClick={() => setTargetDuration(dur.value)}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all border ${
                        targetDuration === dur.value
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 5. Language & Voice Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Language */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-white uppercase tracking-wider">
                  Script Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang} className="bg-neutral-900 text-white">
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              {/* Voice Persona */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
                  <span>Narration Voice (Gemini Ready)</span>
                  <span className="text-[11px] font-normal text-indigo-400">
                    6 Studio Personas
                  </span>
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {VOICE_OPTIONS.map((v) => {
                    const isSelected = selectedVoiceId === v.id;
                    const isPlaying = previewingVoiceId === v.id;
                    return (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVoiceId(v.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                          isSelected
                            ? 'bg-indigo-950/40 border-indigo-500 text-white'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                              v.gender === 'Female'
                                ? 'bg-pink-950 text-pink-300'
                                : 'bg-blue-950 text-blue-300'
                            }`}
                          >
                            {v.gender[0]}
                          </div>
                          <div>
                            <div className="text-xs font-bold">
                              {v.name} ({v.gender})
                            </div>
                            <div className="text-[10px] text-neutral-400">{v.persona}</div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewVoice(v);
                          }}
                          className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1 ${
                            isPlaying
                              ? 'bg-indigo-600 text-white border-indigo-500'
                              : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
                          }`}
                          title="Preview Speech Sample"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Preview</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Error banner if direct generation fails */}
            {directError && (
              <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{directError}</span>
              </div>
            )}

            {/* Bottom Submit Action */}
            <div className="pt-6 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={onBack}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-neutral-400 hover:text-white transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  disabled={!topic.trim() || isGeneratingDirect}
                  onClick={handleGeneratePrompt}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-neutral-300 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 transition-colors flex items-center gap-1.5"
                >
                  <FileCode2 className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Review Prompt First</span>
                </button>

                <button
                  type="button"
                  disabled={!topic.trim() || isGeneratingDirect}
                  onClick={handleDirectGeneratePlan}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Sparkles className={`w-4 h-4 ${isGeneratingDirect ? 'animate-spin' : ''}`} />
                  <span>
                    {isGeneratingDirect ? 'Generating Plan with OpenAI...' : 'Create Video Plan (OpenAI)'}
                  </span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Prompt Preview Screen */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
                  <Check className="w-3.5 h-3.5" />
                  Prompt Ready For AI Tool
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Copy Production Prompt to Your AI Model
                </h2>
                <p className="text-sm text-neutral-400 mt-1">
                  Paste this into ChatGPT, Claude, Gemini, or DeepSeek. Then copy the resulting JSON back into Step 3.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGeneratePrompt}
                  className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                  title="Regenerate Prompt"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-semibold transition-all border border-neutral-700"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Prompt</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Instruction Warning Box */}
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs leading-relaxed flex items-start gap-3">
              <span className="text-base">💡</span>
              <div>
                <span className="font-bold">Prompt Instruction Included:</span> The prompt explicitly asks the external AI model to return <strong>ONLY valid JSON</strong> with no Markdown formatting, no code blocks, and no extra conversational text so you can seamlessly paste it into the editor.
              </div>
            </div>

            {/* Code Box */}
            <div className="relative rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-2xl">
              <div className="px-4 py-2.5 bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-between text-xs text-neutral-400 font-mono">
                <div className="flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-indigo-400" />
                  <span>video_production_prompt.txt</span>
                </div>
                <span>{generatedPrompt.length} chars</span>
              </div>
              <pre className="p-5 text-xs text-neutral-300 font-mono whitespace-pre-wrap overflow-x-auto max-h-[460px] leading-relaxed">
                {generatedPrompt}
              </pre>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setStage('form')}
                className="text-sm text-neutral-400 hover:text-white transition-colors"
              >
                ← Edit Video Settings
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleContinue}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Continue to JSON Import</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
