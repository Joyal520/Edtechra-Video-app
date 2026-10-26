import React, { useState, useEffect, useRef } from 'react';
import {
  VideoProject,
  Scene,
  AnimationEffect,
  TransitionEffect,
  CaptionSettings,
} from '../../types/video';
import { MUSIC_TRACKS } from '../../services/musicService';
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
  const [volume, setVolume] = useState(0.85);
  const [isLooping, setIsLooping] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  // Audio References for Master Timeline playback
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const bgMusicAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentSceneIdRef = useRef<number | null>(null);

  const scenes = project.scenes;
  const totalDuration =
    project.project.total_duration ||
    scenes.reduce((acc, s) => acc + (s.duration || 5), 0);

  // Compute accumulated scene start times on master timeline
  const sceneTimeline = scenes.map((s, idx) => {
    const start = scenes.slice(0, idx).reduce((acc, prev) => acc + (prev.duration || 5), 0);
    const dur = s.duration || 5;
    return {
      index: idx,
      scene: s,
      start,
      end: start + dur,
      duration: dur,
    };
  });

  // Identify current active scene based on master currentTime
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

  // Keep parent active scene index in sync
  useEffect(() => {
    if (currentSceneInfo.index !== activeSceneIndex) {
      onSceneChange(currentSceneInfo.index);
    }
  }, [currentSceneInfo.index, activeSceneIndex, onSceneChange]);

  // ==========================================
  // 1. MASTER CONTINUOUS BACKGROUND MUSIC
  // ==========================================
  useEffect(() => {
    const track =
      MUSIC_TRACKS.find((t) => t.id === project.project.musicTrackId) ||
      MUSIC_TRACKS[0];

    if (!track?.audioUrl) return;

    if (isPlaying && !isMuted) {
      const baseVol = project.project.musicVolume ?? 0.22;
      const hasVoice = Boolean(activeScene?.audioUrl || activeScene?.narration);
      const duckFactor = hasVoice ? 0.35 : 1.0;
      const targetVol = baseVol * duckFactor * volume;

      if (!bgMusicAudioRef.current) {
        const audio = new Audio(track.audioUrl);
        audio.loop = true;
        audio.volume = targetVol;
        audio.currentTime = currentTime % (track.duration || 45);
        audio.play().catch(() => {});
        bgMusicAudioRef.current = audio;
      } else {
        // Change track if ID changed
        if (bgMusicAudioRef.current.src !== new URL(track.audioUrl, window.location.href).href) {
          bgMusicAudioRef.current.pause();
          const audio = new Audio(track.audioUrl);
          audio.loop = true;
          audio.volume = targetVol;
          audio.currentTime = currentTime % (track.duration || 45);
          audio.play().catch(() => {});
          bgMusicAudioRef.current = audio;
        } else {
          // Track is already running - ONLY update volume (ducking) and resume if paused!
          // NEVER restart track on scene change!
          bgMusicAudioRef.current.volume = targetVol;
          if (bgMusicAudioRef.current.paused) {
            bgMusicAudioRef.current.play().catch(() => {});
          }
        }
      }
    } else {
      if (bgMusicAudioRef.current) {
        bgMusicAudioRef.current.pause();
      }
    }
  }, [
    isPlaying,
    isMuted,
    volume,
    project.project.musicTrackId,
    project.project.musicVolume,
    activeScene?.audioUrl,
    activeScene?.narration,
  ]);

  // Clean up bg music on unmount
  useEffect(() => {
    return () => {
      if (bgMusicAudioRef.current) {
        bgMusicAudioRef.current.pause();
        bgMusicAudioRef.current = null;
      }
    };
  }, []);

  // ==========================================
  // 2. MASTER CONTINUOUS VOICEOVER PLAYBACK
  // ==========================================
  useEffect(() => {
    if (!isPlaying || isMuted) {
      if (voiceAudioRef.current) {
        voiceAudioRef.current.pause();
        voiceAudioRef.current = null;
      }
      voiceGenerationService.stopSpeech();
      currentSceneIdRef.current = null;
      return;
    }

    // Check if we need to switch scene audio
    if (currentSceneIdRef.current !== activeScene?.id) {
      currentSceneIdRef.current = activeScene?.id ?? null;

      if (activeScene?.audioUrl) {
        voiceGenerationService.stopSpeech();
        if (voiceAudioRef.current) {
          voiceAudioRef.current.pause();
        }
        const audio = new Audio(activeScene.audioUrl);
        audio.volume = (project.project.voiceVolume ?? 1.0) * volume;
        const sceneOffset = Math.max(0, currentTime - currentSceneInfo.start);
        audio.currentTime = sceneOffset;
        audio.play().catch(() => {});
        voiceAudioRef.current = audio;
      } else if (activeScene?.narration) {
        if (voiceAudioRef.current) {
          voiceAudioRef.current.pause();
          voiceAudioRef.current = null;
        }
        voiceGenerationService.speakPreview(activeScene.narration, project.project.voiceId);
      } else {
        if (voiceAudioRef.current) {
          voiceAudioRef.current.pause();
          voiceAudioRef.current = null;
        }
        voiceGenerationService.stopSpeech();
      }
    }
  }, [
    activeScene?.id,
    isPlaying,
    isMuted,
    volume,
    project.project.voiceId,
    project.project.voiceVolume,
  ]);

  // Clean up voice audio on unmount
  useEffect(() => {
    return () => {
      if (voiceAudioRef.current) {
        voiceAudioRef.current.pause();
        voiceAudioRef.current = null;
      }
      voiceGenerationService.stopSpeech();
    };
  }, []);

  // ==========================================
  // 3. MASTER PLAYBACK TIMER LOOP
  // ==========================================
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
              handleRestart();
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
      handleRestart();
      return;
    }
    setIsPlaying((prev) => !prev);
  };

  const handleSeek = (newTime: number) => {
    const clamped = Math.min(totalDuration, Math.max(0, newTime));
    setCurrentTime(clamped);

    // Sync Background Music time without restarting
    if (bgMusicAudioRef.current) {
      const track =
        MUSIC_TRACKS.find((t) => t.id === project.project.musicTrackId) ||
        MUSIC_TRACKS[0];
      bgMusicAudioRef.current.currentTime = clamped % (track.duration || 45);
    }

    // Sync Scene Voice Audio time
    const targetInfo =
      sceneTimeline.find((st) => clamped >= st.start && clamped < st.end) ||
      sceneTimeline[sceneTimeline.length - 1];

    if (targetInfo) {
      const offset = Math.max(0, clamped - targetInfo.start);
      if (voiceAudioRef.current && targetInfo.scene.audioUrl) {
        if (targetInfo.scene.id === activeScene?.id) {
          voiceAudioRef.current.currentTime = offset;
        } else {
          voiceAudioRef.current.pause();
          const audio = new Audio(targetInfo.scene.audioUrl);
          audio.volume = (project.project.voiceVolume ?? 1.0) * volume;
          audio.currentTime = offset;
          if (isPlaying && !isMuted) audio.play().catch(() => {});
          voiceAudioRef.current = audio;
          currentSceneIdRef.current = targetInfo.scene.id;
        }
      }
    }
  };

  const handleRestart = () => {
    setCurrentTime(0);
    if (bgMusicAudioRef.current) {
      bgMusicAudioRef.current.currentTime = 0;
    }
    if (voiceAudioRef.current) {
      voiceAudioRef.current.currentTime = 0;
    }
    currentSceneIdRef.current = null;
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

  // ==========================================
  // 4. ANIMATION TRANSFORM FOR SCENE
  // ==========================================
  const getAnimationTransform = (anim: AnimationEffect, progress: number): string => {
    switch (anim) {
      case 'slow_zoom_in':
        return `scale(${1.0 + progress * 0.10})`;
      case 'slow_zoom_out':
        return `scale(${1.10 - progress * 0.10})`;
      case 'pan_left':
        return `scale(1.10) translateX(${-(progress * 5)}%)`;
      case 'pan_right':
        return `scale(1.10) translateX(${progress * 5 - 2.5}%)`;
      case 'pan_up':
        return `scale(1.10) translateY(${-(progress * 5)}%)`;
      case 'pan_down':
        return `scale(1.10) translateY(${progress * 5 - 2.5}%)`;
      case 'ken_burns':
        return `scale(${1.04 + progress * 0.08}) translate(${-(progress * 3)}%, ${progress * 2}%)`;
      case 'floating':
        return `translateY(${Math.sin(progress * Math.PI * 2) * 6}px) scale(1.03)`;
      case 'parallax':
        return `scale(${1.02 + progress * 0.05}) rotate(${Math.sin(progress * Math.PI) * 1.2}deg)`;
      case 'none':
      default:
        return 'scale(1.02)';
    }
  };

  // Transition calculation between outgoing and incoming scenes
  const transitionDurationSec = 0.45;
  const timeIntoScene = currentTime - currentSceneInfo.start;
  const isTransitioning = currentSceneInfo.index > 0 && timeIntoScene < transitionDurationSec;
  const transProgress = isTransitioning ? timeIntoScene / transitionDurationSec : 1;
  const prevScene = isTransitioning ? scenes[currentSceneInfo.index - 1] : null;

  // Render Subtitles / Captions
  const renderCaptions = () => {
    const { captions } = project;
    if (!captions.enabled || !activeScene?.narration) return null;

    const words = activeScene.narration.split(' ');
    const activeWordIndex = Math.min(
      words.length - 1,
      Math.floor(sceneProgress * words.length)
    );

    const maxWords = captions.maxWordsPerLine || 5;
    const currentLineStart = Math.floor(activeWordIndex / maxWords) * maxWords;
    const visibleWords = words.slice(currentLineStart, currentLineStart + maxWords);

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
          <div className="inline-block px-4 py-2 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 shadow-2xl">
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
                        ? 'text-amber-300 scale-110 drop-shadow-[0_0_12px_rgba(250,204,21,0.85)] font-black'
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

    // Default stylized
    return (
      <div className={`absolute left-0 right-0 px-6 ${posClass} z-20 pointer-events-none text-center`}>
        <div className="inline-block px-4 py-1.5 rounded-lg bg-black/75 backdrop-blur-sm shadow-md border border-white/10">
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
          {/* Transition Base Layer: Outgoing previous scene during transition */}
          {isTransitioning && prevScene?.imageUrl && (
            <div className="absolute inset-0 z-0 overflow-hidden">
              <img
                src={prevScene.imageUrl}
                alt={`Scene ${prevScene.id}`}
                className="w-full h-full object-cover object-center select-none"
                style={{
                  transform: getAnimationTransform(prevScene.animation || 'slow_zoom_in', 1.0),
                  opacity: 1 - transProgress,
                  transition: 'opacity 0.05s linear',
                }}
              />
            </div>
          )}

          {/* Incoming Active Scene Layer */}
          <div
            className="w-full h-full relative z-10 overflow-hidden"
            style={{
              opacity: isTransitioning ? transProgress : 1,
              transform:
                isTransitioning && activeScene?.transition === 'slide_left'
                  ? `translateX(${(1 - transProgress) * 100}%)`
                  : isTransitioning && activeScene?.transition === 'slide_right'
                  ? `translateX(${-(1 - transProgress) * 100}%)`
                  : isTransitioning && activeScene?.transition === 'zoom'
                  ? `scale(${0.85 + transProgress * 0.15})`
                  : 'none',
              transition: 'opacity 0.05s linear',
            }}
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
                  transition: 'transform 0.08s linear',
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
            <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono font-bold text-white border border-white/10">
              SCENE {activeScene?.id || 1}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-indigo-950/80 backdrop-blur-md text-[10px] font-bold text-indigo-300 border border-indigo-700/40 capitalize">
              {activeScene?.animation.replace(/_/g, ' ')}
            </span>
            {activeScene?.on_screen_text && (
              <span className="px-2 py-0.5 rounded-md bg-neutral-900/90 backdrop-blur-md text-[10px] font-extrabold text-amber-300 border border-amber-500/30">
                {activeScene.on_screen_text}
              </span>
            )}
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
