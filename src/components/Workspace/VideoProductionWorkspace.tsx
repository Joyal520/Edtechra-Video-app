import React, { useState } from 'react';
import {
  VideoProject,
  Scene,
  CaptionSettings,
  AspectRatio,
} from '../../types/video';
import {
  imageGenerationService,
  fileToDataUrl,
} from '../../services/imageGenerationService';
import { voiceGenerationService } from '../../services/voiceGenerationService';
import { storageService } from '../../services/storageService';
import { MUSIC_TRACKS } from '../../services/musicService';
import { VideoPreviewPlayer } from './VideoPreviewPlayer';
import { SceneList } from './SceneList';
import { Timeline } from './Timeline';
import { SceneEditorModal } from './SceneEditorModal';
import { MusicDrawer } from './MusicDrawer';
import { CaptionsDrawer } from './CaptionsDrawer';
import { ExportModal } from './ExportModal';
import {
  ArrowLeft,
  Sparkles,
  Download,
  Music,
  Subtitles,
  Edit2,
  Check,
  RefreshCw,
  Film,
  Layers,
  Smartphone,
  Mic,
  AlertCircle,
} from 'lucide-react';

interface VideoProductionWorkspaceProps {
  project: VideoProject;
  onBackToDashboard: () => void;
  onUpdateProject: (updated: VideoProject) => void;
}

export const VideoProductionWorkspace: React.FC<VideoProductionWorkspaceProps> = ({
  project: initialProject,
  onBackToDashboard,
  onUpdateProject,
}) => {
  const [project, setProject] = useState<VideoProject>(initialProject);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [editingSceneIndex, setEditingSceneIndex] = useState<number | null>(null);
  const [previewTime, setPreviewTime] = useState(0);

  // Modals & Drawers state
  const [isMusicDrawerOpen, setIsMusicDrawerOpen] = useState(false);
  const [isCaptionsDrawerOpen, setIsCaptionsDrawerOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Batch Generation States
  const [isGeneratingAllImages, setIsGeneratingAllImages] = useState(false);
  const [imageProgress, setImageProgress] = useState<{ current: number; total: number } | null>(null);
  const [isGeneratingAllVoices, setIsGeneratingAllVoices] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState<{ current: number; total: number } | null>(null);

  // Inline Title Edit
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(project.project.title);

  // Mobile Tab state ('preview' | 'scenes')
  const [mobileTab, setMobileTab] = useState<'preview' | 'scenes'>('preview');

  // Sync internal project changes with storage and parent
  const updateAndSaveProject = (updated: VideoProject) => {
    setProject(updated);
    storageService.saveProject(updated);
    onUpdateProject(updated);
  };

  // Scene Selection
  const handleSelectScene = (index: number) => {
    const validIdx = Math.max(0, Math.min(project.scenes.length - 1, index));
    setActiveSceneIndex(validIdx);
    const startOffset = project.scenes.slice(0, validIdx).reduce((acc, s) => acc + s.duration, 0);
    setPreviewTime(startOffset);
  };

  // Scene Save from Modal
  const handleSaveScene = (updatedScene: Scene) => {
    const updatedScenes = [...project.scenes];
    if (editingSceneIndex !== null && editingSceneIndex >= 0) {
      updatedScenes[editingSceneIndex] = updatedScene;
      const totalDur = updatedScenes.reduce((acc, s) => acc + s.duration, 0);
      updateAndSaveProject({
        ...project,
        scenes: updatedScenes,
        thumbnailUrl: editingSceneIndex === 0 && updatedScene.imageUrl ? updatedScene.imageUrl : project.thumbnailUrl,
        project: {
          ...project.project,
          total_duration: totalDur,
        },
      });
    }
  };

  // Generate Single Scene Image via OpenAI
  const handleGenerateSingleImage = async (sceneIndex: number, force = false) => {
    const targetScene = project.scenes[sceneIndex];
    if (!targetScene || targetScene.isGeneratingImage) return;

    const updating = [...project.scenes];
    updating[sceneIndex] = { ...targetScene, isGeneratingImage: true, error: undefined };
    setProject({ ...project, scenes: updating });

    try {
      const newImageUrl = await imageGenerationService.generateImage(
        {
          prompt: targetScene.image_prompt,
          aspectRatio: project.project.aspect_ratio,
          style: project.project.style,
          sceneNumber: targetScene.id,
          onScreenText: targetScene.on_screen_text,
          forceRegenerate: force,
        },
        force
      );

      const finalScenes = [...project.scenes];
      finalScenes[sceneIndex] = {
        ...targetScene,
        imageUrl: newImageUrl,
        imageSourceType: 'ai',
        isGeneratingImage: false,
        error: undefined,
      };

      updateAndSaveProject({
        ...project,
        scenes: finalScenes,
        thumbnailUrl: sceneIndex === 0 ? newImageUrl : project.thumbnailUrl,
      });
    } catch (err: any) {
      const finalScenes = [...project.scenes];
      finalScenes[sceneIndex] = {
        ...targetScene,
        isGeneratingImage: false,
        error: `Image generation failed: ${err.message}`,
      };
      setProject({ ...project, scenes: finalScenes });
    }
  };

  // Generate Single Scene Voice via OpenAI TTS
  const handleGenerateSingleVoice = async (sceneIndex: number, force = false) => {
    const targetScene = project.scenes[sceneIndex];
    if (!targetScene || targetScene.isGeneratingAudio || !targetScene.narration.trim()) return;

    const updating = [...project.scenes];
    updating[sceneIndex] = { ...targetScene, isGeneratingAudio: true, error: undefined };
    setProject({ ...project, scenes: updating });

    try {
      const result = await voiceGenerationService.generateVoiceWithDuration(
        {
          text: targetScene.narration,
          voiceId: project.project.voiceId,
          sceneId: targetScene.id,
          forceRegenerate: force,
        },
        force
      );

      // Auto-timing: recalculate scene duration naturally based on speech + 0.3s padding
      const autoDuration = Math.max(3, Math.ceil((result.duration + 0.3) * 10) / 10);
      const finalScenes = [...project.scenes];
      finalScenes[sceneIndex] = {
        ...targetScene,
        audioUrl: result.audioUrl,
        audioDuration: result.duration,
        duration: autoDuration,
        isGeneratingAudio: false,
        error: undefined,
      };

      const newTotal = finalScenes.reduce((acc, s) => acc + s.duration, 0);
      updateAndSaveProject({
        ...project,
        scenes: finalScenes,
        project: {
          ...project.project,
          total_duration: newTotal,
        },
      });
    } catch (err: any) {
      const finalScenes = [...project.scenes];
      finalScenes[sceneIndex] = {
        ...targetScene,
        isGeneratingAudio: false,
        error: `Voiceover failed: ${err.message}`,
      };
      setProject({ ...project, scenes: finalScenes });
    }
  };

  // Quick Upload Image for a Scene
  const handleQuickUploadImage = async (sceneIndex: number, file: File) => {
    const targetScene = project.scenes[sceneIndex];
    if (!targetScene) return;

    try {
      const dataUrl = await fileToDataUrl(file);
      const updated = [...project.scenes];
      updated[sceneIndex] = {
        ...targetScene,
        imageUrl: dataUrl,
        imageSourceType: 'upload',
        cropMode: 'cover',
        error: undefined,
      };

      updateAndSaveProject({
        ...project,
        scenes: updated,
        thumbnailUrl: sceneIndex === 0 ? dataUrl : project.thumbnailUrl,
      });
    } catch (err: any) {
      const updated = [...project.scenes];
      updated[sceneIndex] = { ...targetScene, error: err.message };
      setProject({ ...project, scenes: updated });
    }
  };

  // Batch Image Generation (OpenAI)
  const handleBatchGenerateImages = async () => {
    if (isGeneratingAllImages) return;
    setIsGeneratingAllImages(true);
    setImageProgress({ current: 0, total: project.scenes.length });

    const currentScenes = [...project.scenes];
    for (let i = 0; i < currentScenes.length; i++) {
      setImageProgress({ current: i + 1, total: currentScenes.length });
      const s = currentScenes[i];
      try {
        const url = await imageGenerationService.generateImage({
          prompt: s.image_prompt,
          aspectRatio: project.project.aspect_ratio,
          style: project.project.style,
          sceneNumber: s.id,
          onScreenText: s.on_screen_text,
          forceRegenerate: true,
        });
        currentScenes[i] = { ...s, imageUrl: url, imageSourceType: 'ai', error: undefined };
      } catch (err: any) {
        currentScenes[i] = { ...s, error: `Image failed: ${err.message}` };
      }
    }

    setIsGeneratingAllImages(false);
    setImageProgress(null);

    updateAndSaveProject({
      ...project,
      scenes: currentScenes,
      thumbnailUrl: currentScenes[0]?.imageUrl || project.thumbnailUrl,
    });
  };

  // Batch Voice Generation (OpenAI TTS)
  const handleBatchGenerateVoices = async () => {
    if (isGeneratingAllVoices) return;
    setIsGeneratingAllVoices(true);
    setVoiceProgress({ current: 0, total: project.scenes.length });

    const currentScenes = [...project.scenes];
    for (let i = 0; i < currentScenes.length; i++) {
      setVoiceProgress({ current: i + 1, total: currentScenes.length });
      const s = currentScenes[i];
      try {
        const res = await voiceGenerationService.generateVoiceWithDuration(
          {
            text: s.narration,
            voiceId: project.project.voiceId,
            sceneId: s.id,
            forceRegenerate: true,
          },
          true
        );
        const autoDuration = Math.max(3, Math.ceil((res.duration + 0.3) * 10) / 10);
        currentScenes[i] = {
          ...s,
          audioUrl: res.audioUrl,
          audioDuration: res.duration,
          duration: autoDuration,
          error: undefined,
        };
      } catch (err: any) {
        currentScenes[i] = { ...s, error: `Voice failed: ${err.message}` };
      }
    }

    setIsGeneratingAllVoices(false);
    setVoiceProgress(null);

    const newTotal = currentScenes.reduce((acc, s) => acc + s.duration, 0);
    updateAndSaveProject({
      ...project,
      scenes: currentScenes,
      project: {
        ...project.project,
        total_duration: newTotal,
      },
    });
  };

  const handleAddScene = async () => {
    const newId = project.scenes.length + 1;
    const defaultNarration = 'Here is the next key insight to remember.';
    const defaultPrompt = `Expressive ${project.project.style} visual illustrating a key concept`;

    const newScene: Scene = {
      id: newId,
      duration: 6,
      narration: defaultNarration,
      image_prompt: defaultPrompt,
      on_screen_text: `TAKEAWAY ${newId}`,
      animation: 'slow_zoom_in',
      transition: 'crossfade',
      imageSourceType: 'ai',
      cropMode: 'cover',
    };

    const updatedScenes = [...project.scenes, newScene];
    const totalDur = updatedScenes.reduce((acc, s) => acc + s.duration, 0);

    updateAndSaveProject({
      ...project,
      scenes: updatedScenes,
      project: {
        ...project.project,
        total_duration: totalDur,
      },
    });

    setActiveSceneIndex(updatedScenes.length - 1);
  };

  const handleDuplicateScene = (index: number) => {
    const original = project.scenes[index];
    if (!original) return;

    const copy: Scene = {
      ...original,
      id: project.scenes.length + 1,
    };

    const updatedScenes = [...project.scenes];
    updatedScenes.splice(index + 1, 0, copy);
    const totalDur = updatedScenes.reduce((acc, s) => acc + s.duration, 0);

    updateAndSaveProject({
      ...project,
      scenes: updatedScenes,
      project: {
        ...project.project,
        total_duration: totalDur,
      },
    });
  };

  const handleDeleteScene = (index: number) => {
    if (project.scenes.length <= 1) return;
    const updatedScenes = project.scenes.filter((_, idx) => idx !== index);
    const totalDur = updatedScenes.reduce((acc, s) => acc + s.duration, 0);

    updateAndSaveProject({
      ...project,
      scenes: updatedScenes,
      project: {
        ...project.project,
        total_duration: totalDur,
      },
    });

    if (activeSceneIndex >= updatedScenes.length) {
      setActiveSceneIndex(Math.max(0, updatedScenes.length - 1));
    }
  };

  const handleMoveScene = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= project.scenes.length) return;
    const updatedScenes = [...project.scenes];
    const [moved] = updatedScenes.splice(fromIndex, 1);
    updatedScenes.splice(toIndex, 0, moved);

    updateAndSaveProject({
      ...project,
      scenes: updatedScenes,
    });

    setActiveSceneIndex(toIndex);
  };

  const handleDurationChange = (index: number, newDuration: number) => {
    const updatedScenes = [...project.scenes];
    if (updatedScenes[index]) {
      updatedScenes[index] = { ...updatedScenes[index], duration: newDuration };
      const totalDur = updatedScenes.reduce((acc, s) => acc + s.duration, 0);

      updateAndSaveProject({
        ...project,
        scenes: updatedScenes,
        project: {
          ...project.project,
          total_duration: totalDur,
        },
      });
    }
  };

  const handleSaveTitle = () => {
    if (titleInput.trim()) {
      updateAndSaveProject({
        ...project,
        project: {
          ...project.project,
          title: titleInput.trim(),
        },
      });
    }
    setIsEditingTitle(false);
  };

  const currentTrack =
    MUSIC_TRACKS.find((t) => t.id === project.project.musicTrackId) || MUSIC_TRACKS[0];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-950 text-neutral-100 flex flex-col justify-between">
      {/* Workspace Top Toolbar */}
      <header className="border-b border-neutral-800 bg-neutral-950 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Back & Project Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBackToDashboard}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors shrink-0"
            title="Back to Projects"
            aria-label="Back to projects"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            {isEditingTitle ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                  }}
                  autoFocus
                  className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-700 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleSaveTitle}
                  className="p-1 rounded-lg bg-indigo-600 text-white"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1
                  onClick={() => setIsEditingTitle(true)}
                  className="font-bold text-base sm:text-lg text-white hover:text-indigo-300 cursor-pointer truncate max-w-[240px] sm:max-w-md"
                  title="Click to rename project"
                >
                  {project.project.title}
                </h1>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-white transition-opacity"
                  title="Rename"
                  aria-label="Rename project"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
              <span className="font-mono text-indigo-400 font-semibold uppercase">
                {project.project.aspect_ratio}
              </span>
              <span>•</span>
              <span className="capitalize">{project.project.style.replace(/_/g, ' ')}</span>
              <span>•</span>
              <span>{project.project.total_duration}s total</span>
            </div>
          </div>
        </div>

        {/* Center / Right: Tool buttons & Primary Actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Music Drawer button */}
          <button
            onClick={() => setIsMusicDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
          >
            <Music className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Soundtrack:</span>
            <span className="text-white truncate max-w-[90px]">{currentTrack.title}</span>
          </button>

          {/* Captions Drawer button */}
          <button
            onClick={() => setIsCaptionsDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
          >
            <Subtitles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Captions:</span>
            <span className="text-white uppercase">{project.captions.style}</span>
          </button>

          {/* Batch Generate Voices */}
          <button
            onClick={handleBatchGenerateVoices}
            disabled={isGeneratingAllVoices}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-emerald-400 hover:text-white transition-colors disabled:opacity-50"
            title="Generate OpenAI TTS voiceovers for all scenes"
          >
            <Mic className={`w-3.5 h-3.5 ${isGeneratingAllVoices ? 'animate-pulse text-emerald-300' : ''}`} />
            <span>
              {isGeneratingAllVoices && voiceProgress
                ? `Voices ${voiceProgress.current}/${voiceProgress.total}...`
                : 'Generate All Voices'}
            </span>
          </button>

          {/* Batch Generate Images */}
          <button
            onClick={handleBatchGenerateImages}
            disabled={isGeneratingAllImages}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-indigo-400 hover:text-white transition-colors disabled:opacity-50"
            title="Generate OpenAI visuals for all scenes"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAllImages ? 'animate-spin' : ''}`} />
            <span>
              {isGeneratingAllImages && imageProgress
                ? `Images ${imageProgress.current}/${imageProgress.total}...`
                : 'Generate All Images'}
            </span>
          </button>

          {/* Primary Export CTA */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            <span>Export MP4</span>
          </button>
        </div>
      </header>

      {/* Mobile Switcher (Visible on mobile only) */}
      <div className="flex md:hidden border-b border-neutral-800 bg-neutral-900 px-4 py-1.5 gap-2 text-xs">
        <button
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
            mobileTab === 'preview' ? 'bg-indigo-600 text-white' : 'text-neutral-400'
          }`}
        >
          Video Preview
        </button>
        <button
          onClick={() => setMobileTab('scenes')}
          className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
            mobileTab === 'scenes' ? 'bg-indigo-600 text-white' : 'text-neutral-400'
          }`}
        >
          Scenes ({project.scenes.length})
        </button>
      </div>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Scenes List */}
        <section
          className={`md:col-span-5 lg:col-span-4 h-[720px] ${
            mobileTab === 'scenes' ? 'block' : 'hidden md:block'
          }`}
        >
          <SceneList
            scenes={project.scenes}
            activeSceneIndex={activeSceneIndex}
            onSelectScene={handleSelectScene}
            onEditScene={(idx) => setEditingSceneIndex(idx)}
            onGenerateSingleImage={handleGenerateSingleImage}
            onGenerateSingleVoice={handleGenerateSingleVoice}
            onQuickUploadImage={handleQuickUploadImage}
            onDuplicateScene={handleDuplicateScene}
            onDeleteScene={handleDeleteScene}
            onMoveScene={handleMoveScene}
            onAddScene={handleAddScene}
            isGeneratingAll={isGeneratingAllImages}
          />
        </section>

        {/* Right Column: Preview Player & Timeline */}
        <section
          className={`md:col-span-7 lg:col-span-8 flex flex-col gap-6 ${
            mobileTab === 'preview' ? 'block' : 'hidden md:block'
          }`}
        >
          {/* Video Preview Player */}
          <VideoPreviewPlayer
            project={project}
            activeSceneIndex={activeSceneIndex}
            onSceneChange={(idx) => setActiveSceneIndex(idx)}
            onOpenMusicSettings={() => setIsMusicDrawerOpen(true)}
            onOpenCaptionSettings={() => setIsCaptionsDrawerOpen(true)}
          />

          {/* Timeline Bar */}
          <Timeline
            scenes={project.scenes}
            activeSceneIndex={activeSceneIndex}
            totalDuration={project.project.total_duration}
            currentTime={previewTime}
            musicTitle={currentTrack.title}
            musicVolume={project.project.musicVolume}
            captions={project.captions}
            onSelectScene={handleSelectScene}
            onDurationChange={handleDurationChange}
            onSeek={(t) => setPreviewTime(t)}
          />
        </section>
      </main>

      {/* Scene Editor Modal */}
      {editingSceneIndex !== null && project.scenes[editingSceneIndex] && (
        <SceneEditorModal
          scene={project.scenes[editingSceneIndex]}
          sceneIndex={editingSceneIndex}
          projectStyle={project.project.style}
          projectAspectRatio={project.project.aspect_ratio}
          projectVoiceId={project.project.voiceId}
          isOpen={editingSceneIndex !== null}
          onClose={() => setEditingSceneIndex(null)}
          onSave={handleSaveScene}
        />
      )}

      {/* Music Selector Drawer */}
      <MusicDrawer
        selectedTrackId={project.project.musicTrackId}
        musicVolume={project.project.musicVolume}
        isOpen={isMusicDrawerOpen}
        onClose={() => setIsMusicDrawerOpen(false)}
        onSelectTrack={(trackId) => {
          updateAndSaveProject({
            ...project,
            project: {
              ...project.project,
              musicTrackId: trackId,
            },
          });
        }}
        onVolumeChange={(newVol) => {
          updateAndSaveProject({
            ...project,
            project: {
              ...project.project,
              musicVolume: newVol,
            },
          });
        }}
      />

      {/* Captions Styling Drawer */}
      <CaptionsDrawer
        captions={project.captions}
        isOpen={isCaptionsDrawerOpen}
        onClose={() => setIsCaptionsDrawerOpen(false)}
        onUpdateCaptions={(newCaptions) => {
          updateAndSaveProject({
            ...project,
            captions: newCaptions,
          });
        }}
      />

      {/* Video Export Modal */}
      <ExportModal
        project={project}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
};
