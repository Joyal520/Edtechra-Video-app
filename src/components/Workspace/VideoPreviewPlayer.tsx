import React, { useState, useEffect, useRef } from 'react';
import {
  VideoProject,
  Scene,
  AnimationEffect,
  TransitionEffect,
  CaptionSettings,
} from '../../types/video';
import { musicPlayer, MUSIC_TRACKS } from '../../services/musicService';
import { voiceGenerationService } from '../../services/voiceGenerationService';
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
  onOpenMusicSettings?: () => void;
  onOpenCaptionSettings?: () => void;
}

export const VideoPreviewPlayer: React.FC<VideoPreviewPlayerProps> = ({
  project,
  activeSceneIndex,
  onSceneChange,
  onOpenMusicSettings,
  onOpenCaptionSettings,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isLooping, setIsLooping] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  const scenes = project.scenes;
  const totalDuration = project.project.total_duration || scenes.reduce((acc, s) => acc + s.duration, 0);

  // Compute accumulated scene start times
  const sceneTimeline = scenes.map((s, idx) => {
    const start = scenes.slice(0, idx).reduce((acc, prev) => acc + prev.duration, 0);
    return {
      index: idx,
      scene: s,
      start,
      end: start + s.duration,
      duration: s.duration,
    };
  });

  // Identify current active scene based on currentTime
  const currentSceneInfo =
    sceneTimeline.find((st) => currentTime >= st.start && currentTime < st.end) ||
    sceneTimeline[sceneTimeline.length - 1] || {
      index: 0,
      scene: scenes[0],
      start: 0,
      end: scenes[0]?.duration || 6,
      duration: scenes[0]?.duration || 6,
    };

  const activeScene = currentSceneInfo.scene;
  const sceneProgress = Math.min(
    1,
    Math.max(0, (currentTime - currentSceneInfo.start) / currentSceneInfo.duration)
  );

  // Keep parent's active scene index in sync when time advances
  useEffect(() => {
    if (currentSceneInfo.index !== activeSceneIndex) {
      onSceneChange(currentSceneInfo.index);
    }
  }, [currentSceneInfo.index, activeSceneIndex, onSceneChange]);

  // Audio & Background Music sync
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const track = MUSIC_TRACKS.find((t) => t.id === project.project.musicTrackId) || MUSIC_TRACKS[0];

    if (isPlaying && !isMuted) {
      // Audio ducking: when voice is present, duck background music
      const hasVoice = Boolean(activeScene?.audioUrl || activeScene?.narration);
      const duckFactor = hasVoice ? 0.35 : 1.0;
      const targetMusicVol = (project.project.musicVolume ?? 0.25) * duckFactor * volume;
      musicPlayer.playTrack(track, targetMusicVol);
    } else {
      musicPlayer.stop();
    }

    return () => {
      musicPlayer.stop();
    };
  }, [isPlaying, isMuted, volume, project.project.musicTrackId, project.project.musicVolume, activeScene?.id]);

  // Scene Voice Audio Sync
  useEffect(() => {
    if (!isPlaying || isMuted) {
      if (voiceAudioRef.current) {
        voiceAudioRef.current.pause();
        voiceAudioRef.current = null;
      }
      voiceGenerationService.stopSpeech();
      return;
    }

    if (activeScene?.audioUrl) {
      voiceGenerationService.stopSpeech();
      if (!voiceAudioRef.current || voiceAudioRef.current.src !== activeScene.audioUrl) {
        if (voiceAudioRef.current) {
          voiceAudioRef.current.pause();
        }
        const audio = new Audio(activeScene.audioUrl);
        audio.volume = (project.project.voiceVolume ?? 1.0) * volume;
        const sceneOffset = Math.max(0, currentTime - currentSceneInfo.start);
        audio.currentTime = sceneOffset;
        audio.play().catch(() => {});
        voiceAudioRef.current = audio;
      }
    } else if (activeScene?.narration) {
      if (voiceAudioRef.current) {
        voiceAudioRef.current.pause();
        voiceAudioRef.current = null;
      }
      voiceGenerationService.speakPreview(activeScene.narration, project.project.voiceId);
    }

    return () => {
      if (voiceAudioRef.current) {
        voiceAudioRef.current.pause();
      }
      voiceGenerationService.stopSpeech();
    };
  }, [activeScene?.id, isPlaying, isMuted, volume, project.project.voiceId, project.project.voiceVolume]);

  // Main playback timer loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      lastTimestampRef.current = null;
      return;
    }

    const tick = (now: number) => {
      if (lastTimestampRef.current !== null) {
        const delta = (now - lastTimestampRef.current) / 1000;
        setCurrentTime((prev) => {
          const next = prev + delta;
          if (next >= totalDuration) {
            if (isLooping) {
              return 0;
            } else {
              setIsPlaying(false);
              return totalDuration;
            }
          }
          return next;
        });
      }
      lastTimestampRef.current = now;
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, totalDuration, isLooping]);

  const togglePlay = () => {
    if (currentTime >= totalDuration) {
      setCurrentTime(0);
    }
    setIsPlaying((prev) => !prev);
  };

  const handleSeek = (newTime: number) => {
    setCurrentTime(Math.min(totalDuration, Math.max(0, newTime)));
  };

  const handleRestart = () => {
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Compute CSS style transformation for current scene animation
  const getAnimationTransform = (anim: AnimationEffect, progress: number): string => {
    switch (anim) {
      case 'slow_zoom_in':
        return `scale(${1 + progress * 0.12})`;
      case 'slow_zoom_out':
        return `scale(${1.12 - progress * 0.12})`;
      case 'pan_left':
        return `scale(1.08) translateX(${-progress * 4}%)`;
      case 'pan_right':
        return `scale(1.08) translateX(${progress * 4 - 2}%)`;
      case 'pan_up':
        return `scale(1.08) translateY(${-progress * 4}%)`;
      case 'pan_down':
        return `scale(1.08) translateY(${progress * 4 - 2}%)`;
      case 'ken_burns':
        return `scale(${1.05 + progress * 0.1}) translate(${-progress * 3}%, ${progress * 2}%)`;
      case 'floating':
        return `translateY(${Math.sin(progress * Math.PI * 2) * 8}px) scale(1.02)`;
      case 'parallax':
        return `scale(${1 + progress * 0.05}) rotate(${Math.sin(progress * Math.PI) * 1.5}deg)`;
      case 'shake':
        return `translate(${Math.sin(progress * 20) * 4}px, ${Math.cos(progress * 15) * 3}px)`;
      case 'bounce':
        return `scale(${1 + Math.abs(Math.sin(progress * Math.PI * 3)) * 0.06})`;
      case 'none':
      default:
        return 'scale(1)';
    }
  };

  // Compute transition opacity or offset during scene entry
  const getTransitionStyle = (trans: TransitionEffect, progress: number): React.CSSProperties => {
    const entryRatio = 0.15; // first 15% of scene
    if (progress > entryRatio) {
      return { opacity: 1, transform: 'none' };
    }
    const t = progress / entryRatio;

    switch (trans) {
      case 'fade':
      case 'crossfade':
        return { opacity: t };
      case 'slide_left':
        return { transform: `translateX(${(1 - t) * 100}%)`, opacity: 0.8 + t * 0.2 };
      case 'slide_right':
        return { transform: `translateX(${-(1 - t) * 100}%)`, opacity: 0.8 + t * 0.2 };
      case 'zoom':
        return { transform: `scale(${0.75 + t * 0.25})`, opacity: t };
      case 'blur':
        return { filter: `blur(${(1 - t) * 12}px)`, opacity: t };
      default:
        return { opacity: 1 };
    }
  };

  // Render Subtitles / Captions based on caption settings
  const renderCaptions = () => {
    const { captions } = project;
    if (!captions.enabled || !activeScene?.narration) return null;

    const words = activeScene.narration.split(' ');
    const activeWordIndex = Math.min(
      words.length - 1,
      Math.floor(sceneProgress * words.length)
    );

    // Group words into lines according to maxWordsPerLine
    const maxWords = captions.maxWordsPerLine || 5;
    const currentLineStart = Math.floor(activeWordIndex / maxWords) * maxWords;
    const visibleWords = words.slice(currentLineStart, currentLineStart + maxWords);

    // Positioning
    const posClass =
      captions.position === 'top'
        ? 'top-8'
        : captions.position === 'center'
        ? 'top-1/2 -translate-y-1/2'
        : 'bottom-16';

    const sizeClass =
      captions.fontSize === 'xl'
        ? 'text-xl sm:text-2xl font-black'
        : captions.fontSize === 'lg'
        ? 'text-base sm:text-lg font-extrabold'
        : captions.fontSize === 'sm'
        ? 'text-xs sm:text-sm font-semibold'
        : 'text-sm sm:text-base font-bold';

    if (captions.style === 'KARAOKE') {
      return (
        <div className={`absolute left-0 right-0 px-6 ${posClass} z-20 pointer-events-none text-center`}>
          <div className="inline-block px-4 py-2 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 shadow-2xl">
            <div className={`flex flex-wrap items-center justify-center gap-1.5 ${sizeClass} tracking-wide`}>
              {visibleWords.map((word, idx) => {
                const globalIdx = currentLineStart + idx;
                const isHighlighted = globalIdx === activeWordIndex;
                const isPassed = globalIdx < activeWordIndex;

                return (
                  <span
                    key={idx}
                    className={`transition-all duration-100 ${
                      isHighlighted
                        ? 'text-amber-300 scale-110 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)] font-black'
                        : isPassed
                        ? 'text-white'
                        : 'text-neutral-400 opacity-80'
                    }`}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    if (captions.style === 'POP') {
      return (
        <div className={`absolute left-0 right-0 px-6 ${posClass} z-20 pointer-events-none text-center`}>
          <div className="inline-block px-4 py-2 rounded-xl bg-black/80 border-2 border-indigo-500 shadow-xl animate-pulse">
            <p className={`text-white uppercase ${sizeClass} tracking-wider`}>
              {visibleWords.join(' ')}
            </p>
          </div>
        </div>
      );
    }

    if (captions.style === 'BOLD') {
      return (
        <div className={`absolute left-0 right-0 px-6 ${posClass} z-20 pointer-events-none text-center`}>
          <div className="inline-block px-4 py-2 rounded-lg bg-black text-white font-black uppercase tracking-widest shadow-2xl">
            <p className={sizeClass}>{visibleWords.join(' ')}</p>
          </div>
        </div>
      );
    }

    if (captions.style === 'MINIMAL') {
      return (
        <div className={`absolute left-0 right-0 px-6 ${posClass} z-20 pointer-events-none text-center`}>
          <p className={`text-white/95 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] ${sizeClass}`}>
            {visibleWords.join(' ')}
          </p>
        </div>
      );
    }

    // NORMAL
    return (
      <div className={`absolute left-0 right-0 px-6 ${posClass} z-20 pointer-events-none text-center`}>
        <div className="inline-block px-4 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm shadow-md">
          <p className={`text-white ${sizeClass}`}>{visibleWords.join(' ')}</p>
        </div>
      </div>
    );
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Determine aspect ratio container dimensions
  const getAspectRatioClasses = () => {
    switch (project.project.aspect_ratio) {
      case '9:16':
        return 'aspect-[9/16] max-h-[640px] w-auto mx-auto shadow-2xl';
      case '16:9':
        return 'aspect-[16/9] w-full max-h-[500px] shadow-2xl';
      case '1:1':
        return 'aspect-square max-h-[540px] w-auto mx-auto shadow-2xl';
      case '4:5':
        return 'aspect-[4/5] max-h-[580px] w-auto mx-auto shadow-2xl';
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
            Scene {currentSceneInfo.index + 1} of {scenes.length}
          </span>
          <span className="px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 font-mono">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>
        </div>
      </div>

      {/* Screen Player Frame */}
      <div className="relative w-full flex-1 flex items-center justify-center min-h-[320px] overflow-hidden py-2">
        <div
          className={`relative rounded-2xl overflow-hidden bg-black border-2 border-neutral-800 shadow-2xl ${getAspectRatioClasses()}`}
        >
          {/* Visual Scene Canvas / Image Layer */}
          <div
            className="w-full h-full relative overflow-hidden transition-all duration-300"
            style={getTransitionStyle(activeScene?.transition || 'fade', sceneProgress)}
          >
            {activeScene?.imageUrl ? (
              <img
                src={activeScene.imageUrl}
                alt={`Scene ${activeScene.id}`}
                className="w-full h-full object-cover object-center select-none"
                style={{
                  transform: getAnimationTransform(
                    activeScene.animation || 'slow_zoom_in',
                    sceneProgress
                  ),
                  transition: 'transform 0.1s linear',
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-neutral-900 text-neutral-400">
                <Sparkles className="w-10 h-10 text-indigo-500 mb-2 animate-spin" />
                <p className="text-sm font-bold text-white">Generating Visual...</p>
                <p className="text-xs text-neutral-500 mt-1">{activeScene?.image_prompt}</p>
              </div>
            )}
          </div>

          {/* Subtitles / Captions */}
          {renderCaptions()}

          {/* Top Scene HUD indicator inside video */}
          <div className="absolute top-3 left-3 z-20 pointer-events-none flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-mono font-bold text-white border border-white/10">
              SCENE {activeScene?.id || 1}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-indigo-950/80 backdrop-blur-md text-[10px] font-bold text-indigo-300 border border-indigo-700/40 capitalize">
              {activeScene?.animation.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Big Center Play/Pause button on hover / pause */}
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

      {/* Scrubber / Timeline Bar */}
      <div className="w-full px-2 pt-3">
        <div className="relative group cursor-pointer mb-2">
          {/* Progress bar background */}
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pos = (e.clientX - rect.left) / rect.width;
              handleSeek(pos * totalDuration);
            }}
            className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden relative"
          >
            {/* Scene separator ticks */}
            {sceneTimeline.map((st) => (
              <div
                key={st.index}
                className="absolute top-0 bottom-0 w-0.5 bg-neutral-950 z-10"
                style={{ left: `${(st.start / totalDuration) * 100}%` }}
              />
            ))}

            {/* Active filled progress */}
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 relative transition-all duration-75"
              style={{ width: `${(currentTime / totalDuration) * 100}%` }}
            />
          </div>

          {/* Scrubber Knob */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -ml-2 w-4 h-4 rounded-full bg-white shadow-md shadow-indigo-600/50 pointer-events-none transition-transform"
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
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5 fill-white" />}
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
            {scenes.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => {
                  const targetTime = sceneTimeline[idx]?.start || 0;
                  handleSeek(targetTime);
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                  activeSceneIndex === idx
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
