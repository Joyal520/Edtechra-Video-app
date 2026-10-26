import React, { useState } from 'react';
import { Scene } from '../../types/video';
import {
  Sparkles,
  Clock,
  Edit3,
  RefreshCw,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Layers,
  Image as ImageIcon,
  Mic,
  Play,
  Pause,
  Upload,
  GripVertical,
  AlertCircle,
} from 'lucide-react';

interface SceneListProps {
  scenes: Scene[];
  activeSceneIndex: number;
  onSelectScene: (index: number) => void;
  onEditScene: (index: number) => void;
  onGenerateSingleImage: (index: number, force?: boolean) => void;
  onGenerateSingleVoice: (index: number, force?: boolean) => void;
  onQuickUploadImage: (index: number, file: File) => void;
  onDuplicateScene: (index: number) => void;
  onDeleteScene: (index: number) => void;
  onMoveScene: (fromIndex: number, toIndex: number) => void;
  onAddScene: () => void;
  isGeneratingAll?: boolean;
}

export const SceneList: React.FC<SceneListProps> = ({
  scenes,
  activeSceneIndex,
  onSelectScene,
  onEditScene,
  onGenerateSingleImage,
  onGenerateSingleVoice,
  onQuickUploadImage,
  onDuplicateScene,
  onDeleteScene,
  onMoveScene,
  onAddScene,
  isGeneratingAll = false,
}) => {
  const [playingSceneId, setPlayingSceneId] = useState<number | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const audioPlayerRef = React.useRef<HTMLAudioElement | null>(null);

  const handleTogglePlayAudio = (e: React.MouseEvent, scene: Scene) => {
    e.stopPropagation();
    if (!scene.audioUrl) return;

    if (playingSceneId === scene.id) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingSceneId(null);
      return;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    const audio = new Audio(scene.audioUrl);
    audio.onended = () => setPlayingSceneId(null);
    audio.onerror = () => setPlayingSceneId(null);
    audioPlayerRef.current = audio;
    audio.play();
    setPlayingSceneId(scene.id);
  };

  // Drag and Drop reordering handlers
  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx);
    e.dataTransfer.setData('text/plain', idx.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIdx !== null && draggedIdx !== targetIdx) {
      onMoveScene(draggedIdx, targetIdx);
    }
    setDraggedIdx(null);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900/60 rounded-3xl border border-neutral-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-bold text-white tracking-wide uppercase">
            Scenes ({scenes.length})
          </h2>
        </div>

        <button
          onClick={onAddScene}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Scene</span>
        </button>
      </div>

      {/* Scrollable Scene Cards List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
        {scenes.map((scene, idx) => {
          const isActive = idx === activeSceneIndex;
          const isGeneratingImg = scene.isGeneratingImage || isGeneratingAll;
          const isGeneratingVoice = scene.isGeneratingAudio;

          return (
            <div
              key={scene.id}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, idx)}
              onClick={() => onSelectScene(idx)}
              className={`rounded-2xl p-3 sm:p-3.5 cursor-pointer transition-all border relative group ${
                isActive
                  ? 'bg-indigo-950/30 border-indigo-500 ring-1 ring-indigo-500/50 shadow-md'
                  : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Drag handle */}
                <div
                  className="pt-2 text-neutral-600 hover:text-neutral-400 cursor-grab active:cursor-grabbing shrink-0"
                  title="Drag to reorder"
                >
                  <GripVertical className="w-4 h-4" />
                </div>

                {/* Thumbnail */}
                <div className="relative w-24 h-28 rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden shrink-0 group/img">
                  {scene.imageUrl ? (
                    <img
                      src={scene.imageUrl}
                      alt={`Scene ${scene.id}`}
                      className={`w-full h-full ${
                        scene.cropMode === 'contain'
                          ? 'object-contain'
                          : scene.cropMode === 'fill'
                          ? 'object-fill'
                          : 'object-cover'
                      } object-center`}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-600 p-2 text-center">
                      <ImageIcon className="w-6 h-6 mb-1" />
                      <span className="text-[10px] text-neutral-500 font-semibold">No Image</span>
                    </div>
                  )}

                  {/* Loading spinner overlay */}
                  {isGeneratingImg && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-indigo-400">
                      <RefreshCw className="w-5 h-5 animate-spin mb-1" />
                      <span className="text-[9px] font-bold">OpenAI Image...</span>
                    </div>
                  )}

                  {/* Scene Number Ribbon */}
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/85 text-[10px] font-mono font-bold text-white shadow">
                    #{idx + 1}
                  </div>

                  {/* Source Badge */}
                  {scene.imageSourceType && (
                    <div
                      className={`absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                        scene.imageSourceType === 'upload'
                          ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-800/60'
                          : scene.imageSourceType === 'sample'
                          ? 'bg-amber-950/90 text-amber-300 border border-amber-800/60'
                          : 'bg-indigo-950/90 text-indigo-300 border border-indigo-800/60'
                      }`}
                    >
                      {scene.imageSourceType}
                    </div>
                  )}
                </div>

                {/* Scene Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    {/* Top Meta Line */}
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-bold text-indigo-400 font-mono">
                        SCENE {scene.id.toString().padStart(2, '0')}
                      </span>
                      <span className="flex items-center gap-1 text-neutral-400 font-mono bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 text-[10px]">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        {scene.duration}s
                      </span>
                    </div>

                    {/* Narration Quote */}
                    <p className="text-xs text-white line-clamp-2 leading-relaxed italic mb-1.5">
                      "{scene.narration}"
                    </p>

                    {/* Overlay text */}
                    {scene.on_screen_text && (
                      <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider line-clamp-1 mb-1.5">
                        Overlay: {scene.on_screen_text}
                      </div>
                    )}
                  </div>

                  {/* Audio Status & Animation Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    {scene.audioUrl ? (
                      <button
                        type="button"
                        onClick={(e) => handleTogglePlayAudio(e, scene)}
                        className="px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-800/50 flex items-center gap-1 font-semibold hover:bg-emerald-900/60 transition-colors"
                      >
                        {playingSceneId === scene.id ? (
                          <>
                            <Pause className="w-2.5 h-2.5 text-amber-400" />
                            <span>Pause Audio</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-2.5 h-2.5" />
                            <span>Audio {scene.audioDuration ? `${scene.audioDuration.toFixed(1)}s` : 'Ready'}</span>
                          </>
                        )}
                      </button>
                    ) : isGeneratingVoice ? (
                      <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-emerald-400 flex items-center gap-1 font-semibold">
                        <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        <span>OpenAI TTS...</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-neutral-800/80 text-neutral-500 flex items-center gap-1">
                        <Mic className="w-2.5 h-2.5" />
                        <span>No Voice</span>
                      </span>
                    )}

                    <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-medium capitalize">
                      {scene.animation.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Error notice if any */}
              {scene.error && (
                <div className="mt-2 p-2 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-[11px] flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="truncate">{scene.error}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onGenerateSingleImage(idx, true);
                    }}
                    className="px-2 py-0.5 rounded bg-rose-800 text-white font-bold text-[10px]"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Scene Action Toolbar */}
              <div className="mt-3 pt-2 border-t border-neutral-800/80 flex items-center justify-between gap-1 text-xs">
                {/* Generation Controls */}
                <div className="flex items-center gap-1">
                  {/* Generate / Regenerate Image */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onGenerateSingleImage(idx, !!scene.imageUrl);
                    }}
                    disabled={isGeneratingImg}
                    className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-300 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
                    title="Generate Image with OpenAI"
                  >
                    <RefreshCw className={`w-3 h-3 ${isGeneratingImg ? 'animate-spin text-indigo-400' : ''}`} />
                    <span>{scene.imageUrl ? 'Regen Img' : 'Gen Img'}</span>
                  </button>

                  {/* Generate / Regenerate Voice */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onGenerateSingleVoice(idx, !!scene.audioUrl);
                    }}
                    disabled={isGeneratingVoice}
                    className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-300 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
                    title="Generate Voice with OpenAI TTS"
                  >
                    <Mic className={`w-3 h-3 ${isGeneratingVoice ? 'animate-pulse text-emerald-400' : ''}`} />
                    <span>{scene.audioUrl ? 'Regen Voice' : 'Gen Voice'}</span>
                  </button>

                  {/* Quick Upload Image */}
                  <label
                    onClick={(e) => e.stopPropagation()}
                    className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 cursor-pointer text-neutral-300 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
                    title="Upload custom image for this scene"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onQuickUploadImage(idx, f);
                      }}
                    />
                  </label>

                  {/* Edit Scene */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditScene(idx);
                    }}
                    className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-indigo-600 text-neutral-300 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
                    title="Configure details"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>

                {/* Ordering & delete controls */}
                <div className="flex items-center gap-0.5 text-neutral-400">
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveScene(idx, idx - 1);
                      }}
                      className="p-1 hover:text-white transition-colors"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {idx < scenes.length - 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveScene(idx, idx + 1);
                      }}
                      className="p-1 hover:text-white transition-colors"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateScene(idx);
                    }}
                    className="p-1 hover:text-white transition-colors"
                    title="Duplicate Scene"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {scenes.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteScene(idx);
                      }}
                      className="p-1 hover:text-rose-400 transition-colors"
                      title="Delete Scene"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
