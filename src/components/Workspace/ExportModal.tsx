import React, { useState } from 'react';
import { VideoProject } from '../../types/video';
import {
  RenderOptions,
  RenderProgressUpdate,
  videoRenderService,
} from '../../services/renderService';
import {
  Download,
  Film,
  CheckCircle2,
  Sparkles,
  X,
  RefreshCw,
  HardDrive,
  Sliders,
  Play,
} from 'lucide-react';

interface ExportModalProps {
  project: VideoProject;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  project,
  isOpen,
  onClose,
}) => {
  const [resolution, setResolution] = useState<'720p' | '1080p'>('1080p');
  const [quality, setQuality] = useState<'standard' | 'high'>('high');
  const [isRendering, setIsRendering] = useState(false);
  const [progressState, setProgressState] = useState<RenderProgressUpdate | null>(null);
  const [downloadResult, setDownloadResult] = useState<{ downloadUrl: string; filename: string } | null>(null);

  if (!isOpen) return null;

  const handleStartRender = async () => {
    setIsRendering(true);
    setDownloadResult(null);

    const options: RenderOptions = {
      resolution,
      quality,
      format: 'mp4',
    };

    try {
      const result = await videoRenderService.renderVideo(project, options, (update) => {
        setProgressState(update);
      });
      setDownloadResult(result);
    } catch (err) {
      console.error('Rendering error', err);
    } finally {
      setIsRendering(false);
    }
  };

  const handleDownload = () => {
    if (!downloadResult) return;
    const a = document.createElement('a');
    a.href = downloadResult.downloadUrl;
    a.download = downloadResult.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Pipeline stages checklist
  const stages = [
    { key: 'assets', label: 'Scene Assets & Graphics Rasterization' },
    { key: 'voiceover', label: 'AI Voiceover & Speech Alignment' },
    { key: 'music', label: 'Soundtrack Mixing & Smart Audio Ducking' },
    { key: 'captions', label: 'Dynamic Captions & Highlight Burns' },
    { key: 'timeline', label: 'Scene Transitions & Timecode Composition' },
  ];

  const currentPercent = progressState?.percent || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-3xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Export Video</h2>
              <p className="text-xs text-neutral-400">
                Compile video with animations, narration, music, and subtitles
              </p>
            </div>
          </div>

          {!isRendering && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Configuration Options (Disabled while rendering) */}
        {!isRendering && !downloadResult && (
          <div className="space-y-4">
            {/* Resolution Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-white uppercase tracking-wider">
                Video Resolution
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setResolution('1080p')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    resolution === '1080p'
                      ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/50 text-white'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <div className="font-bold text-sm">1080p Full HD</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    {project.project.aspect_ratio === '9:16'
                      ? '1080 × 1920 (Recommended for Shorts)'
                      : '1920 × 1080 (Crisp YouTube)'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setResolution('720p')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    resolution === '720p'
                      ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/50 text-white'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <div className="font-bold text-sm">720p HD</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    Faster compilation, lightweight file
                  </div>
                </button>
              </div>
            </div>

            {/* Quality & Format */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-white uppercase tracking-wider">
                  Quality Bitrate
                </label>
                <div className="flex gap-2">
                  {(['standard', 'high'] as const).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuality(q)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                        quality === q
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-white uppercase tracking-wider">
                  Container Format
                </label>
                <div className="py-2 px-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-bold text-white text-center">
                  MP4 Video (H.264 / AAC)
                </div>
              </div>
            </div>

            {/* Project Summary Callout */}
            <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
              <span>{project.scenes.length} Scenes • {project.project.total_duration}s Duration</span>
              <span className="font-mono text-indigo-400 font-bold uppercase">
                {project.project.aspect_ratio}
              </span>
            </div>
          </div>
        )}

        {/* Live Rendering Pipeline Progress */}
        {(isRendering || downloadResult) && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-white">
                  {isRendering ? 'Rendering in Progress...' : 'Render Completed!'}
                </span>
                <span className="font-mono text-indigo-400">{currentPercent}%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 rounded-full bg-neutral-950 overflow-hidden border border-neutral-800">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${currentPercent}%` }}
                />
              </div>
            </div>

            {/* Stage Checklist */}
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2.5 text-xs">
              <div className="font-bold text-neutral-400 uppercase tracking-wider text-[10px] mb-2">
                Compiler Checklist:
              </div>
              {stages.map((stage, idx) => {
                const stagePercentThreshold = (idx + 1) * 16;
                const isDone = currentPercent >= stagePercentThreshold || !isRendering;

                return (
                  <div key={stage.key} className="flex items-center gap-2.5">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-neutral-700 shrink-0" />
                    )}
                    <span className={isDone ? 'text-white font-medium' : 'text-neutral-500'}>
                      {isDone ? `✓ ${stage.label}` : stage.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {progressState?.message && (
              <p className="text-xs text-center text-neutral-400 italic">
                {progressState.message}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
          <button
            type="button"
            disabled={isRendering}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-neutral-400 hover:text-white disabled:opacity-40"
          >
            {downloadResult ? 'Close' : 'Cancel'}
          </button>

          {!downloadResult ? (
            <button
              type="button"
              disabled={isRendering}
              onClick={handleStartRender}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {isRendering ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Compiling Video...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Render Video MP4</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download MP4</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
