import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { VideoProject } from '../../types/video';
import {
  buildMasterTimeline,
  getFrameStateAtTime,
  renderMasterFrame,
  buildMasterAudioTrack,
} from '../../services/compositionEngine';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Sparkles,
  Repeat,
} from 'lucide-react';

interface VideoPreviewPlayerProps {
  project: VideoProject;
  activeSceneIndex: number;
  onSceneChange: (index: number) => void;
  externalTime?: number;
  onTimeUpdate?: (time: number) => void;
  onOpenMusicSettings?: () => void;
  onOpenCaptionSettings?: () => void;
}

export const VideoPreviewPlayer: React.FC<VideoPreviewPlayerProps> = ({
  project,
  activeSceneIndex,
  onSceneChange,
  externalTime,
  onTimeUpdate,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.9);
  const [isLooping, setIsLooping] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imagesRevision, setImagesRevision] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageMapRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const masterAudioRef = useRef<HTMLAudioElement | null>(null);
  const masterAudioUrlRef = useRef<string | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const internalTimeRef = useRef<number>(0);

  // Build single-source-of-truth Master Timeline
  const timeline = useMemo(() => buildMasterTimeline(project), [project]);
  const totalDuration = timeline.totalDuration;
  const scenes = project.scenes;

  // Frame state at current master timestamp
  const frameState = useMemo(
    () => getFrameStateAtTime(timeline, currentTime),
    [timeline, currentTime]
  );
  const activeSegment = frameState.activeSegment;
  const activeScene = activeSegment.scene;

  // Canvas logical dimensions matching project aspect ratio
  const canvasDimensions = useMemo(() => {
    switch (project.project.aspect_ratio) {
      case '16:9':
        return { width: 1920, height: 1080 };
      case '1:1':
        return { width: 1080, height: 1080 };
      case '9:16':
      default:
        return { width: 1080, height: 1920 };
    }
  }, [project.project.aspect_ratio]);

  // Keep parent active scene index in sync with master timeline position
  useEffect(() => {
    if (activeSegment.index !== activeSceneIndex) {
      onSceneChange(activeSegment.index);
    }
  }, [activeSegment.index, activeSceneIndex, onSceneChange]);

  // Sync when parent Timeline scrubber seeks to a new externalTime
  useEffect(() => {
    if (
      typeof externalTime === 'number' &&
      Math.abs(externalTime - internalTimeRef.current) > 0.15
    ) {
      const clamped = Math.max(0, Math.min(totalDuration, externalTime));
      internalTimeRef.current = clamped;
      setCurrentTime(clamped);
      if (masterAudioRef.current) {
        masterAudioRef.current.currentTime = clamped;
      }
    }
  }, [externalTime, totalDuration]);

  // 1. Preload all scene images for the Master Composition Canvas
  useEffect(() => {
    let cancelled = false;

    project.scenes.forEach((sc) => {
      if (!sc.imageUrl) return;
      const existing = imageMapRef.current.get(sc.id);
      if (existing && existing.dataset.src === sc.imageUrl && existing.complete) {
        return;
      }

      const loadWithFallback = (srcToTry: string, isRetry = false) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.dataset.src = sc.imageUrl;
        img.onload = () => {
          if (!cancelled) {
            imageMapRef.current.set(sc.id, img);
            setImagesRevision((r) => r + 1);
          }
        };
        img.onerror = () => {
          if (!isRetry && srcToTry.startsWith('/')) {
            loadWithFallback(`.${srcToTry}`, true);
          } else if (!isRetry && srcToTry.startsWith('./')) {
            loadWithFallback(srcToTry.slice(1), true);
          }
        };
        img.src = srcToTry;
      };

      loadWithFallback(sc.imageUrl);
    });

    return () => {
      cancelled = true;
    };
  }, [project.scenes]);

  // 2. Build ONE Continuous Master Audio Track (All 5 Voiceovers + Continuous Ducked Music)
  const audioSignature = useMemo(() => {
    const sceneSig = project.scenes
      .map((s) => `${s.id}:${s.audioUrl || ''}:${s.duration}`)
      .join('|');
    return `${sceneSig}__${project.project.musicTrackId}__${project.project.musicVolume}__${project.project.voiceVolume}`;
  }, [
    project.scenes,
    project.project.musicTrackId,
    project.project.musicVolume,
    project.project.voiceVolume,
  ]);

  useEffect(() => {
    let cancelled = false;

    buildMasterAudioTrack(project, timeline)
      .then((res) => {
        if (cancelled || !res) return;

        const wasPlaying = masterAudioRef.current && !masterAudioRef.current.paused;
        const savedTime = internalTimeRef.current;

        if (masterAudioRef.current) {
          masterAudioRef.current.pause();
        }
        if (masterAudioUrlRef.current) {
          URL.revokeObjectURL(masterAudioUrlRef.current);
        }

        masterAudioUrlRef.current = res.wavBlobUrl;
        const audio = new Audio(res.wavBlobUrl);
        audio.preload = 'auto';
        audio.volume = isMuted ? 0 : volume;
        audio.currentTime = Math.min(res.duration, savedTime);
        masterAudioRef.current = audio;

        if (wasPlaying) {
          audio.play().catch(() => {});
        }
      })
      .catch((err) => {
        console.warn('Master audio track build warning:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [audioSignature, timeline]);

  // Update master audio volume / mute dynamically without interrupting playback
  useEffect(() => {
    if (masterAudioRef.current) {
      masterAudioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [isMuted, volume]);

  // Clean up audio and object URL on unmount
  useEffect(() => {
    return () => {
      if (masterAudioRef.current) {
        masterAudioRef.current.pause();
        masterAudioRef.current = null;
      }
      if (masterAudioUrlRef.current) {
        URL.revokeObjectURL(masterAudioUrlRef.current);
        masterAudioUrlRef.current = null;
      }
    };
  }, []);

  // 3. Draw Master Frame on Canvas whenever currentTime, images, or project changes
  const drawCurrentFrame = useCallback(
    (timeToDraw: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      renderMasterFrame(
        ctx,
        canvasDimensions.width,
        canvasDimensions.height,
        timeToDraw,
        timeline,
        imageMapRef.current,
        project
      );
    },
    [canvasDimensions, timeline, project]
  );

  useEffect(() => {
    drawCurrentFrame(currentTime);
  }, [currentTime, imagesRevision, drawCurrentFrame]);

  // 4. Master Playback Loop (Synchronized with Continuous Master Audio Track)
  useEffect(() => {
    const audio = masterAudioRef.current;

    if (!isPlaying) {
      if (audio && !audio.paused) {
        audio.pause();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      lastTimestampRef.current = null;
      return;
    }

    if (audio) {
      if (Math.abs(audio.currentTime - internalTimeRef.current) > 0.2) {
        audio.currentTime = internalTimeRef.current;
      }
      audio.volume = isMuted ? 0 : volume;
      audio.play().catch(() => {});
    }

    const tick = (now: number) => {
      const activeAudio = masterAudioRef.current;
      let nextTime = internalTimeRef.current;

      if (activeAudio && !activeAudio.paused && !activeAudio.ended) {
        // Lock visual timeline directly to the continuous master audio clock
        nextTime = activeAudio.currentTime;
      } else if (lastTimestampRef.current !== null) {
        const delta = (now - lastTimestampRef.current) / 1000;
        nextTime = internalTimeRef.current + delta;
      }

      lastTimestampRef.current = now;

      if (nextTime >= totalDuration || (activeAudio && activeAudio.ended)) {
        if (isLooping) {
          internalTimeRef.current = 0;
          setCurrentTime(0);
          onTimeUpdate?.(0);
          if (activeAudio) {
            activeAudio.currentTime = 0;
            activeAudio.play().catch(() => {});
          }
        } else {
          internalTimeRef.current = totalDuration;
          setCurrentTime(totalDuration);
          onTimeUpdate?.(totalDuration);
          if (activeAudio) {
            activeAudio.pause();
          }
          setIsPlaying(false);
          return;
        }
      } else {
        internalTimeRef.current = nextTime;
        setCurrentTime(nextTime);
        onTimeUpdate?.(nextTime);
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, totalDuration, isLooping, isMuted, volume, onTimeUpdate]);

  const handleSeek = (newTime: number) => {
    const clamped = Math.min(totalDuration, Math.max(0, newTime));
    internalTimeRef.current = clamped;
    setCurrentTime(clamped);
    onTimeUpdate?.(clamped);

    if (masterAudioRef.current) {
      masterAudioRef.current.currentTime = clamped;
    }
  };

  const handleRestart = () => {
    internalTimeRef.current = 0;
    setCurrentTime(0);
    onTimeUpdate?.(0);
    if (masterAudioRef.current) {
      masterAudioRef.current.currentTime = 0;
      if (isPlaying) {
        masterAudioRef.current.play().catch(() => {});
      }
    }
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (currentTime >= totalDuration - 0.05) {
      handleRestart();
      return;
    }
    setIsPlaying((prev) => !prev);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getAspectRatioClasses = () => {
    switch (project.project.aspect_ratio) {
      case '9:16':
        return 'aspect-[9/16] max-h-[640px] w-auto mx-auto shadow-2xl';
      case '16:9':
        return 'aspect-[16/9] w-full max-h-[500px] shadow-2xl';
      case '1:1':
        return 'aspect-square max-h-[540px] w-auto mx-auto shadow-2xl';
      default:
        return 'aspect-[9/16] max-h-[640px] w-auto mx-auto shadow-2xl';
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col items-center justify-between bg-neutral-950 rounded-3xl border border-neutral-800 p-4 sm:p-6 overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
    >
      {/* Top Media Bar */}
      <div className="w-full flex items-center justify-between text-xs text-neutral-400 mb-3 px-2">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-indigo-400">
            {project.project.aspect_ratio}
          </span>
          <span className="font-semibold text-white truncate max-w-[200px]">
            {project.project.title}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-neutral-400">
            Scene {activeSegment.index + 1} of {scenes.length}
          </span>
          <span className="px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 font-mono">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>
        </div>
      </div>

      {/* Screen Player Frame (Unified Master Canvas) */}
      <div className="relative w-full flex-1 flex items-center justify-center min-h-[320px] overflow-hidden py-2">
        <div
          className={`relative rounded-2xl overflow-hidden bg-black border-2 border-neutral-800 shadow-2xl ${getAspectRatioClasses()}`}
        >
          <canvas
            ref={canvasRef}
            width={canvasDimensions.width}
            height={canvasDimensions.height}
            onClick={togglePlay}
            className="w-full h-full object-contain block cursor-pointer select-none"
          />

          {!activeScene?.imageUrl && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-neutral-900/90 text-neutral-400 pointer-events-none">
              <Sparkles className="w-10 h-10 text-indigo-500 mb-2 animate-spin" />
              <p className="text-sm font-bold text-white">Generating Visual...</p>
              <p className="text-xs text-neutral-500 mt-1">{activeScene?.image_prompt}</p>
            </div>
          )}

          {/* Top Scene HUD indicator inside video */}
          <div className="absolute top-3 left-3 z-20 pointer-events-none flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono font-bold text-white border border-white/10">
              SCENE {activeScene?.id || 1}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-indigo-950/80 backdrop-blur-md text-[10px] font-bold text-indigo-300 border border-indigo-700/40 capitalize">
              {(activeScene?.animation || 'slow_zoom_in').replace(/_/g, ' ')}
            </span>
            {frameState.isTransitioning && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 backdrop-blur-md text-[10px] font-bold text-emerald-300 border border-emerald-600/40 uppercase">
                ⇄ {activeSegment.transitionType.replace(/_/g, ' ')}
              </span>
            )}
            {frameState.glitchIntensity > 0.1 && (
              <span className="px-2 py-0.5 rounded-md bg-red-950/90 backdrop-blur-md text-[10px] font-extrabold text-red-400 border border-red-500/50 uppercase animate-pulse">
                ⚡ GLITCH: {(activeScene?.glitchEffect || 'rgb_split').replace(/_/g, ' ')}
              </span>
            )}
            {activeScene?.sfxLabel && (
              <span className="px-2 py-0.5 rounded-md bg-purple-950/80 backdrop-blur-md text-[10px] font-bold text-purple-300 border border-purple-500/30">
                🔊 {activeScene.sfxLabel}
              </span>
            )}
            {activeScene?.on_screen_text && (
              <span className="px-2 py-0.5 rounded-md bg-neutral-900/90 backdrop-blur-md text-[10px] font-extrabold text-amber-300 border border-amber-500/30">
                {activeScene.on_screen_text}
              </span>
            )}
          </div>

          {/* Big Center Play/Pause button on pause */}
          {!isPlaying && (
            <div
              onClick={togglePlay}
              className="absolute inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center cursor-pointer group z-30 transition-all"
            >
              <div className="w-16 h-16 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-2xl shadow-indigo-600/50 group-hover:scale-110 transition-transform ring-4 ring-white/20">
                <Play className="w-7 h-7 ml-1 fill-white" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scrubber / Master Timeline Bar */}
      <div className="w-full px-2 pt-3">
        <div className="relative group cursor-pointer mb-2">
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = (e.clientX - rect.left) / rect.width;
              handleSeek(pos * totalDuration);
            }}
            className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden relative"
          >
            {/* Scene separator ticks */}
            {timeline.segments.map((seg) => (
              <div
                key={seg.index}
                className="absolute top-0 bottom-0 w-0.5 bg-neutral-950 z-10"
                style={{ left: `${(seg.start / totalDuration) * 100}%` }}
              />
            ))}

            {/* Active filled progress */}
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 relative"
              style={{ width: `${(currentTime / totalDuration) * 100}%` }}
            />
          </div>

          {/* Scrubber Knob */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -ml-2 w-4 h-4 rounded-full bg-white shadow-md shadow-indigo-600/50 pointer-events-none"
            style={{ left: `${(currentTime / totalDuration) * 100}%` }}
          />
        </div>

        {/* Player Controls Dock */}
        <div className="flex items-center justify-between text-neutral-300 pt-2">
          {/* Left Controls: Play, Restart, Time */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md transition-all active:scale-95"
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5 fill-white" />
              )}
            </button>

            <button
              onClick={handleRestart}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Restart Video"
              aria-label="Restart Video"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <span className="text-xs font-mono font-medium text-neutral-400">
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </span>
          </div>

          {/* Center: Quick scene stepper */}
          <div className="hidden sm:flex items-center gap-1.5">
            {timeline.segments.map((seg, idx) => (
              <button
                key={seg.scene.id}
                onClick={() => handleSeek(seg.start)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                  activeSegment.index === idx
                    ? 'bg-indigo-600 text-white'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400'
                }`}
              >
                S{idx + 1}
              </button>
            ))}
          </div>

          {/* Right Controls: Loop, Volume, Fullscreen */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`p-2 rounded-lg transition-colors ${
                isLooping
                  ? 'text-indigo-400 bg-indigo-950/60'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title="Loop Playback"
              aria-label="Loop playback"
            >
              <Repeat className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-16 h-1 accent-indigo-500 hidden sm:block"
              />
            </div>

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Fullscreen"
              aria-label="Toggle fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
