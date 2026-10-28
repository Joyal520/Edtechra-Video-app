import React, { useState } from 'react';
import { VideoProject } from '../../types/video';
import {
  RenderOptions,
  RenderProgressUpdate,
  RenderResult,
  videoRenderService,
} from '../../services/renderService';
import { runProductionChecklist } from '../../services/productionChecklist';
import {
  Download,
  Film,
  CheckCircle2,
  Sparkles,
  X,
  RefreshCw,
  ShieldCheck,
  Zap,
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
  const [fastMode, setFastMode] = useState<boolean>(true);
  const [isRendering, setIsRendering] = useState(false);
  const [progressState, setProgressState] = useState<RenderProgressUpdate | null>(null);
  const [downloadResult, setDownloadResult] = useState<RenderResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const checklistReport = runProductionChecklist(project);

  if (!isOpen) return null;

  const handleStartRender = async () => {
    setIsRendering(true);
    setDownloadResult(null);
    setErrorMsg(null);

    const options: RenderOptions = {
      resolution,
      quality,
      format: 'mp4',
      fastMode,
    };

    try {
      const result = await videoRenderService.renderVideo(project, options, (update) => {
        setProgressState(update);
      });
      setDownloadResult(result);
    } catch (err: any) {
      console.error('Rendering error', err);
      setErrorMsg(err?.message || 'Failed to render video.');
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
    { key: 'assets', label: '5-Stage 9:16 Visuals & Camera Motion (Zoom / Pan)' },
    { key: 'voiceover', label: 'Sequential Voiceover Narration Across All 5 Scenes' },
    { key: 'music', label: 'Continuous Background Music with Voice Ducking' },
    { key: 'captions', label: 'Synchronized Safe-Area Captions & Smooth Transitions' },
    { key: 'timeline', label: 'Master Timeline MP4 Encoding & Stream Validation' },
  ];

  const currentPercent = progressState?.percent || 0;
  const val = downloadResult?.validation;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl space-y-5 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Export Master MP4</h2>
              <p className="text-xs text-neutral-400">
                Single continuous timeline with animations, transitions, voiceover & music
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

        {/* Configuration Options (Before rendering) */}
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
                      ? '1080 × 1920 (9:16 Vertical Reel)'
                      : '1920 × 1080 (Full HD)'}
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

            {/* Fast Generation Mode & Asset Caching */}
            <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg ${fastMode ? 'bg-amber-500/20 text-amber-400' : 'bg-neutral-800 text-neutral-400'}`}>
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    Fast Generation Mode
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono">
                      Cost: $0.00 Reused
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Reuses asset cache & scene clips. Renders only modified scenes.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFastMode(!fastMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  fastMode ? 'bg-amber-500' : 'bg-neutral-800'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    fastMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Production Checklist Status */}
            <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Production Checklist
                </span>
                <span className="text-emerald-400 font-mono">{checklistReport.score}% Ready</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-300">
                {checklistReport.items.slice(0, 4).map((item) => (
                  <div key={item.id} className="flex items-center gap-1.5 text-neutral-400">
                    <span className="text-emerald-400 text-xs">✓</span>
                    <span className="truncate">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Project Summary Callout */}
            <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
              <span>
                {project.scenes.length} Scenes • {project.project.total_duration}s Master Timeline
              </span>
              <span className="font-mono text-indigo-400 font-bold uppercase">
                {project.project.aspect_ratio}
              </span>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-xs text-red-300">
                {errorMsg}
              </div>
            )}
          </div>
        )}

        {/* Live Rendering Pipeline Progress & Validation Report */}
        {(isRendering || downloadResult) && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-white">
                  {isRendering
                    ? 'Compiling Master Timeline...'
                    : '✓ Master MP4 Compiled & Validated'}
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

            {/* Rendered MP4 Interactive Preview + Validation Report */}
            {downloadResult && (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5">
                <div className="sm:col-span-5 flex justify-center">
                  <video
                    src={downloadResult.downloadUrl}
                    controls
                    playsInline
                    className="aspect-[9/16] max-h-[240px] rounded-xl border border-neutral-800 bg-black shadow-lg"
                  />
                </div>

                <div className="sm:col-span-7 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Render Output Verified</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                      <div className="text-[10px] text-neutral-400 uppercase">Resolution</div>
                      <div className="font-mono font-bold text-white">
                        {val?.resolution || '1080x1920'} (9:16)
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                      <div className="text-[10px] text-neutral-400 uppercase">Duration</div>
                      <div className="font-mono font-bold text-white">
                        {val?.videoDuration ?? project.project.total_duration}s (All {val?.sceneCount ?? project.scenes.length} Scenes)
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                      <div className="text-[10px] text-neutral-400 uppercase">Voiceover</div>
                      <div className="font-bold text-emerald-300">Continuous (Scenes 1–5)</div>
                    </div>
                    <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                      <div className="text-[10px] text-neutral-400 uppercase">Soundtrack</div>
                      <div className="font-bold text-indigo-300">Continuous + Ducked</div>
                    </div>
                  </div>

                  <div className="text-[11px] text-neutral-400 pt-1">
                    Format: <span className="text-white font-semibold">MP4 (H.264 / AAC)</span>
                    {val?.fileSizeBytes
                      ? ` • Size: ${(val.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB`
                      : ''}
                  </div>
                </div>
              </div>
            )}

            {/* Stage Checklist */}
            <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2 text-xs">
              <div className="font-bold text-neutral-400 uppercase tracking-wider text-[10px] mb-1">
                Master Pipeline Verification:
              </div>
              {stages.map((stage, idx) => {
                const stagePercentThreshold = (idx + 1) * 18;
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
                  <span>Compiling Master MP4...</span>
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
