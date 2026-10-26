import React, { useState, useRef, useEffect } from 'react';
import {
  Scene,
  AnimationEffect,
  TransitionEffect,
  VideoStyle,
  AspectRatio,
  ImageCropMode,
  ImageSourceType,
} from '../../types/video';
import {
  VALID_ANIMATIONS,
  VALID_TRANSITIONS,
  VALID_STYLES,
} from '../../services/schema';
import {
  imageGenerationService,
  fileToDataUrl,
  SAMPLE_IMAGES,
} from '../../services/imageGenerationService';
import {
  voiceGenerationService,
  VOICE_OPTIONS,
} from '../../services/voiceGenerationService';
import {
  X,
  Clock,
  Type,
  ImageIcon,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Check,
  RefreshCw,
  Upload,
  Crop,
  Trash2,
  Mic,
  AlertCircle,
  HelpCircle,
  Sliders,
  Volume2,
} from 'lucide-react';

interface SceneEditorModalProps {
  scene: Scene;
  sceneIndex: number;
  projectStyle: VideoStyle;
  projectAspectRatio: AspectRatio;
  projectVoiceId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedScene: Scene) => void;
}

export const SceneEditorModal: React.FC<SceneEditorModalProps> = ({
  scene,
  sceneIndex,
  projectStyle,
  projectAspectRatio,
  projectVoiceId,
  isOpen,
  onClose,
  onSave,
}) => {
  // Scene metadata state
  const [narration, setNarration] = useState(scene.narration);
  const [duration, setDuration] = useState(scene.duration);
  const [imagePrompt, setImagePrompt] = useState(scene.image_prompt);
  const [onScreenText, setOnScreenText] = useState(scene.on_screen_text || '');
  const [animation, setAnimation] = useState<AnimationEffect>(scene.animation || 'slow_zoom_in');
  const [transition, setTransition] = useState<TransitionEffect>(scene.transition || 'crossfade');

  // Image source state
  const [imageSourceTab, setImageSourceTab] = useState<'ai' | 'upload'>(
    scene.imageSourceType === 'upload' ? 'upload' : 'ai'
  );
  const [imageUrl, setImageUrl] = useState<string | undefined>(scene.imageUrl);
  const [cropMode, setCropMode] = useState<ImageCropMode>(scene.cropMode || 'cover');
  const [imageSourceType, setImageSourceType] = useState<ImageSourceType>(
    scene.imageSourceType || (scene.imageUrl ? 'ai' : 'ai')
  );

  // Audio state
  const [audioUrl, setAudioUrl] = useState<string | undefined>(scene.audioUrl);
  const [audioDuration, setAudioDuration] = useState<number | undefined>(scene.audioDuration);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generation loading & error states
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Re-sync on modal open or scene change
  useEffect(() => {
    if (isOpen) {
      setNarration(scene.narration);
      setDuration(scene.duration);
      setImagePrompt(scene.image_prompt);
      setOnScreenText(scene.on_screen_text || '');
      setAnimation(scene.animation || 'slow_zoom_in');
      setTransition(scene.transition || 'crossfade');
      setImageUrl(scene.imageUrl);
      setCropMode(scene.cropMode || 'cover');
      setImageSourceType(scene.imageSourceType || 'ai');
      setImageSourceTab(scene.imageSourceType === 'upload' ? 'upload' : 'ai');
      setAudioUrl(scene.audioUrl);
      setAudioDuration(scene.audioDuration);
      setImageError(null);
      setVoiceError(null);
      setIsPlayingAudio(false);
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [isOpen, scene]);

  if (!isOpen) return null;

  // Handle Save
  const handleSave = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    onSave({
      ...scene,
      narration: narration.trim(),
      duration: Math.max(2, Number(duration) || 6),
      image_prompt: imagePrompt.trim(),
      on_screen_text: onScreenText.trim() || undefined,
      animation,
      transition,
      imageUrl,
      imageSourceType,
      cropMode,
      audioUrl,
      audioDuration,
    });
    onClose();
  };

  // Image Generation with OpenAI (Cost protection: only on explicit click)
  const handleGenerateImage = async (force = false) => {
    if (isGeneratingImage) return;
    setIsGeneratingImage(true);
    setImageError(null);

    try {
      const generated = await imageGenerationService.generateImage(
        {
          prompt: imagePrompt.trim(),
          aspectRatio: projectAspectRatio,
          style: projectStyle,
          sceneNumber: sceneIndex + 1,
          onScreenText: onScreenText.trim(),
          forceRegenerate: force,
        },
        force
      );

      setImageUrl(generated);
      setImageSourceType('ai');
    } catch (err: any) {
      setImageError(err.message || 'Image generation failed. Please check your API key.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Image Upload Handling (File browse / drag-and-drop / paste)
  const processUploadedFile = async (file: File) => {
    try {
      const dataUrl = await fileToDataUrl(file);
      setImageUrl(dataUrl);
      setImageSourceType('upload');
      setImageSourceTab('upload');
      setImageError(null);
    } catch (err: any) {
      setImageError(err.message || 'Failed to upload image');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            processUploadedFile(file);
            break;
          }
        }
      }
    }
  };

  // Remove Image
  const handleRemoveImage = () => {
    setImageUrl(undefined);
  };

  // Pick sample image
  const handleSelectSample = (sampleUrl: string) => {
    setImageUrl(sampleUrl);
    setImageSourceType('sample');
    setImageError(null);
  };

  // Voiceover Generation with OpenAI TTS
  const handleGenerateVoice = async (force = false) => {
    if (isGeneratingVoice || !narration.trim()) return;
    setIsGeneratingVoice(true);
    setVoiceError(null);

    try {
      const result = await voiceGenerationService.generateVoiceWithDuration(
        {
          text: narration.trim(),
          voiceId: projectVoiceId,
          sceneId: scene.id,
          forceRegenerate: force,
        },
        force
      );

      setAudioUrl(result.audioUrl);
      setAudioDuration(result.duration);

      // Auto-timing: update scene duration naturally to match voice length + 0.3s padding
      const autoDur = Math.max(3, Math.ceil((result.duration + 0.3) * 10) / 10);
      setDuration(autoDur);
    } catch (err: any) {
      setVoiceError(err.message || 'Voice generation failed. Please check your API key.');
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  // Preview Generated Voice
  const handleTogglePlayAudio = () => {
    if (!audioUrl) return;

    if (isPlayingAudio && audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    audio.onended = () => setIsPlayingAudio(false);
    audio.onerror = () => setIsPlayingAudio(false);
    audioRef.current = audio;
    audio.play();
    setIsPlayingAudio(true);
  };

  return (
    <div
      onPaste={handlePaste}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-900/90 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold font-mono text-sm">
              #{sceneIndex + 1}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">
                  Scene Configuration
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-300">
                  {projectAspectRatio}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">Edit Scene Details & Visuals</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* SECTION 1: NARRATION SCRIPT & VOICEOVER */}
          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-emerald-400" />
                <span>Narration Voiceover Script</span>
              </label>

              {audioDuration && (
                <span className="text-[11px] font-mono font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/50">
                  Audio: {audioDuration.toFixed(1)}s
                </span>
              )}
            </div>

            <textarea
              rows={3}
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              placeholder="Spoken narration for this scene. Natural conversational speech works best..."
              className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />

            {/* Voice generation action row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleGenerateVoice(!!audioUrl)}
                  disabled={isGeneratingVoice || !narration.trim()}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingVoice ? 'animate-spin' : ''}`} />
                  <span>
                    {isGeneratingVoice
                      ? 'Generating Audio...'
                      : audioUrl
                      ? 'Regenerate Voice'
                      : 'Generate Voice (OpenAI TTS)'}
                  </span>
                </button>

                {audioUrl && (
                  <button
                    type="button"
                    onClick={handleTogglePlayAudio}
                    className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-all flex items-center gap-1.5"
                  >
                    {isPlayingAudio ? (
                      <>
                        <Pause className="w-3.5 h-3.5 text-amber-400" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Play Audio</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-neutral-400">Duration:</span>
                <div className="flex items-center gap-1 font-mono">
                  <input
                    type="number"
                    min={2}
                    max={60}
                    step={0.5}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value) || 5)}
                    className="w-16 px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-700 text-xs font-bold text-white text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-neutral-400">sec</span>
                </div>
              </div>
            </div>

            {voiceError && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{voiceError}</span>
                </div>
                <button
                  onClick={() => handleGenerateVoice(true)}
                  className="px-2.5 py-1 rounded bg-rose-700 hover:bg-rose-600 text-white font-bold text-[11px]"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* SECTION 2: IMAGE SOURCE SYSTEM (AI GENERATE vs UPLOAD IMAGE) */}
          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800/80 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <span>Image Source</span>
              </label>

              {/* Source Tab Selector */}
              <div className="flex items-center bg-neutral-900 rounded-xl p-1 border border-neutral-800 text-xs">
                <button
                  type="button"
                  onClick={() => setImageSourceTab('ai')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    imageSourceTab === 'ai'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  AI Generate (OpenAI)
                </button>
                <button
                  type="button"
                  onClick={() => setImageSourceTab('upload')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    imageSourceTab === 'upload'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Upload Image
                </button>
              </div>
            </div>

            {/* TAB CONTENT: AI GENERATE */}
            {imageSourceTab === 'ai' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>Image Prompt:</span>
                    <span className="text-[11px] text-neutral-500">Style: {projectStyle}</span>
                  </div>
                  <textarea
                    rows={2}
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="Specific visual description for OpenAI image generation..."
                    className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleGenerateImage(!!imageUrl)}
                    disabled={isGeneratingImage || !imagePrompt.trim()}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingImage ? 'animate-spin' : ''}`} />
                    <span>
                      {isGeneratingImage
                        ? 'Generating Image...'
                        : imageUrl
                        ? 'Regenerate Image'
                        : 'Generate Image (OpenAI)'}
                    </span>
                  </button>

                  {/* Sample presets picker */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-neutral-400">Sample Assets:</span>
                    <div className="flex items-center gap-1">
                      {SAMPLE_IMAGES.map((s, idx) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleSelectSample(s.url)}
                          className="w-6 h-6 rounded bg-neutral-800 hover:ring-2 hover:ring-indigo-400 text-[10px] font-bold text-neutral-300 transition-all"
                          title={s.title}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: UPLOAD IMAGE */}
            {imageSourceTab === 'upload' && (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-6 rounded-2xl border-2 border-dashed cursor-pointer text-center transition-all ${
                    isDragOver
                      ? 'border-indigo-400 bg-indigo-950/30'
                      : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/50'
                  }`}
                >
                  <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white">
                    Click to browse or drag and drop your image
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Supports PNG, JPG, JPEG, WEBP • Paste with Ctrl+V anytime
                  </p>
                </div>
              </div>
            )}

            {imageError && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{imageError}</span>
                </div>
                <button
                  onClick={() => handleGenerateImage(true)}
                  className="px-2.5 py-1 rounded bg-rose-700 hover:bg-rose-600 text-white font-bold text-[11px]"
                >
                  Retry
                </button>
              </div>
            )}

            {/* IMAGE PREVIEW & MANAGEMENT CONTROLS */}
            {imageUrl && (
              <div className="pt-3 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center gap-4">
                <div
                  className={`relative rounded-xl overflow-hidden bg-black border border-neutral-800 shrink-0 ${
                    projectAspectRatio === '9:16'
                      ? 'w-24 h-40'
                      : projectAspectRatio === '16:9'
                      ? 'w-40 h-24'
                      : 'w-28 h-28'
                  }`}
                >
                  <img
                    src={imageUrl}
                    alt={`Scene preview`}
                    className={`w-full h-full ${
                      cropMode === 'contain'
                        ? 'object-contain'
                        : cropMode === 'fill'
                        ? 'object-fill'
                        : 'object-cover'
                    }`}
                  />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono font-bold text-white uppercase">
                    {imageSourceType}
                  </div>
                </div>

                <div className="flex-1 space-y-2.5 w-full">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-neutral-300">Image Management</span>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>

                  {/* Crop mode selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-neutral-400">Crop Mode:</span>
                    <div className="flex items-center gap-1 bg-neutral-900 rounded-lg p-0.5 border border-neutral-800 text-[11px]">
                      {(['cover', 'contain', 'fill'] as ImageCropMode[]).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setCropMode(mode)}
                          className={`px-2.5 py-1 rounded capitalize font-medium transition-colors ${
                            cropMode === mode
                              ? 'bg-indigo-600 text-white font-bold'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    {imageSourceType === 'ai' ? (
                      <button
                        type="button"
                        onClick={() => handleGenerateImage(true)}
                        disabled={isGeneratingImage}
                        className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <RefreshCw className={`w-3 h-3 ${isGeneratingImage ? 'animate-spin' : ''}`} />
                        <span>Regenerate</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Replace Image</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: ON-SCREEN TEXT, ANIMATION & TRANSITION */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* On-screen text */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-amber-400" />
                <span>Overlay Hook</span>
              </label>
              <input
                type="text"
                value={onScreenText}
                onChange={(e) => setOnScreenText(e.target.value)}
                placeholder="HOOK TEXT"
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-bold text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            {/* Animation Effect */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Camera Movement
              </label>
              <select
                value={animation}
                onChange={(e) => setAnimation(e.target.value as AnimationEffect)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 capitalize"
              >
                {VALID_ANIMATIONS.map((anim) => (
                  <option key={anim} value={anim} className="bg-neutral-900 capitalize">
                    {anim.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Transition Effect */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Scene Transition
              </label>
              <select
                value={transition}
                onChange={(e) => setTransition(e.target.value as TransitionEffect)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 capitalize"
              >
                {VALID_TRANSITIONS.map((trans) => (
                  <option key={trans} value={trans} className="bg-neutral-900 capitalize">
                    {trans.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-neutral-800 bg-neutral-900/95 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save & Apply Scene</span>
          </button>
        </div>
      </div>
    </div>
  );
};
