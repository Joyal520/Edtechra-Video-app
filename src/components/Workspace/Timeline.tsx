import React, { useRef } from 'react';
import { Scene, CaptionSettings } from '../../types/video';
import {
  splitNarrationIntoPhrases,
  getCalibratedSceneDuration,
} from '../../services/compositionEngine';
import {
  Clock,
  Film,
  Mic,
  Music,
  Subtitles,
  Volume2,
  Image as ImageIcon,
} from 'lucide-react';

interface TimelineProps {
  scenes: Scene[];
  activeSceneIndex: number;
  totalDuration: number;
  currentTime: number;
  musicTitle?: string;
  musicVolume?: number;
  captions?: CaptionSettings;
  onSelectScene: (index: number) => void;
  onDurationChange: (index: number, newDuration: number) => void;
  onSeek: (time: number) => void;
  onOpenMusicLibrary?: () => void;
  onOpenCaptionsDrawer?: () => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  scenes,
  activeSceneIndex,
  totalDuration: rawTotalDuration,
  currentTime,
  musicTitle = 'Beneath the Heavy Soil',
  musicVolume = 0.30,
  captions,
  onSelectScene,
  onSeek,
  onOpenMusicLibrary,
  onOpenCaptionsDrawer,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const calibratedDurations = scenes.map((s) => getCalibratedSceneDuration(s));
  const totalDuration =
    calibratedDurations.reduce((acc, d) => acc + d, 0) || rawTotalDuration || 1;

  // Accumulate scene starts
  const sceneSegments = scenes.map((scene, idx) => {
    const dur = calibratedDurations[idx];
    const start = calibratedDurations.slice(0, idx).reduce((acc, d) => acc + d, 0);
    const phrases = splitNarrationIntoPhrases(
      scene.narration || '',
      captions?.maxWordsPerLine || 3
    );
    return {
      index: idx,
      scene,
      start,
      end: start + dur,
      duration: dur,
      phraseCount: phrases.length,
      firstPhrase: phrases[0]?.join(' ').toUpperCase() || scene.on_screen_text || '',
      widthPercent: (dur / totalDuration) * 100,
    };
  });

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || totalDuration <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(progress * totalDuration);
  };

  return (
    <div className="w-full bg-neutral-900/90 rounded-3xl border border-neutral-800 p-4 space-y-3 select-none">
      {/* Timeline Header & Time ruler */}
      <div className="flex items-center justify-between text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-white uppercase tracking-wider text-[11px]">
            5-Layer Master Timeline
          </span>
          <span className="text-neutral-500 font-mono">({totalDuration.toFixed(1)}s total)</span>
        </div>

        <div className="font-mono text-neutral-300 text-xs">
          Playhead: <span className="text-amber-400 font-bold">{currentTime.toFixed(1)}s</span>
        </div>
      </div>

      {/* Main Timeline Scrubber Area */}
      <div
        ref={containerRef}
        onClick={handleTimelineClick}
        className="relative bg-neutral-950 rounded-2xl border border-neutral-800 p-2.5 cursor-pointer space-y-2.5 overflow-hidden"
      >
        {/* Playhead Vertical Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-30 pointer-events-none transition-all duration-75 shadow-[0_0_10px_rgba(251,191,36,0.9)]"
          style={{ left: `${Math.min(100, Math.max(0, (currentTime / totalDuration) * 100))}%` }}
        >
          <div className="w-3.5 h-3.5 bg-amber-400 rotate-45 -ml-1.5 -mt-1 shadow-md border border-amber-200" />
        </div>

        {/* TIME RULER */}
        <div className="relative h-4 text-[9px] font-mono text-neutral-500 flex items-center border-b border-neutral-800/80">
          {sceneSegments.map((seg, i) => (
            <div
              key={i}
              className="absolute border-l border-neutral-700 pl-1 h-3 flex items-center"
              style={{ left: `${(seg.start / totalDuration) * 100}%` }}
            >
              {seg.start.toFixed(1)}s
            </div>
          ))}
          <div className="absolute right-0 pr-1 h-3 flex items-center border-r border-neutral-700">
            {totalDuration.toFixed(1)}s
          </div>
        </div>

        {/* LAYER 1: VISUALS */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px] font-mono text-indigo-400 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Film className="w-3 h-3" />
              <span className="font-bold">VISUALS</span>
            </div>
            <span className="text-neutral-500">9:16 Continuous Camera Motion & Transitions</span>
          </div>

          <div className="relative h-14 flex items-stretch gap-1">
            {sceneSegments.map((seg) => {
              const isActive = seg.index === activeSceneIndex;

              return (
                <div
                  key={seg.scene.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectScene(seg.index);
                    onSeek(seg.start);
                  }}
                  style={{ width: `${seg.widthPercent}%` }}
                  className={`relative rounded-xl cursor-pointer transition-all p-1.5 flex items-center gap-2 overflow-hidden border ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-900/80 to-violet-900/80 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                      : 'bg-neutral-900 hover:bg-neutral-850 border-neutral-800'
                  }`}
                >
                  <div className="w-9 h-11 rounded-lg bg-black/60 border border-neutral-800 overflow-hidden shrink-0 flex items-center justify-center">
                    {seg.scene.imageUrl ? (
                      <img
                        src={seg.scene.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-neutral-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span
                        className={`font-mono font-bold ${
                          isActive ? 'text-indigo-200' : 'text-neutral-300'
                        }`}
                      >
                        Scene {seg.index + 1}
                      </span>
                      <span className="font-mono text-neutral-400 text-[9px]">
                        {seg.duration.toFixed(1)}s
                      </span>
                    </div>

                    <div className="text-[9px] text-neutral-400 truncate capitalize">
                      {seg.scene.animation.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* LAYER 2: CAPTIONS */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px] font-mono text-amber-400 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Subtitles className="w-3 h-3" />
              <span className="font-bold">CAPTIONS</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenCaptionsDrawer?.();
              }}
              className="text-amber-300/80 hover:text-amber-200 underline decoration-dotted"
            >
              Montserrat ExtraBold • {captions?.style || 'KARAOKE'} (2–3 words/chunk)
            </button>
          </div>

          <div className="relative h-6 flex items-stretch gap-1">
            {sceneSegments.map((seg) => (
              <div
                key={seg.scene.id}
                style={{ width: `${seg.widthPercent}%` }}
                className="rounded-lg bg-amber-950/40 border border-amber-800/40 px-2 flex items-center justify-between overflow-hidden text-[9px] font-bold text-amber-300"
              >
                <span className="truncate">{seg.firstPhrase}</span>
                <span className="shrink-0 text-[8px] font-mono text-amber-400/80 ml-1">
                  {seg.phraseCount} chunks
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* LAYER 3: VOICEOVER */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px] font-mono text-emerald-400 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Mic className="w-3 h-3" />
              <span className="font-bold">VOICEOVER</span>
            </div>
            <span className="text-neutral-500">Primary Narration (Dominant Audio Stem)</span>
          </div>

          <div className="relative h-7 flex items-stretch gap-1">
            {sceneSegments.map((seg) => {
              const hasAudio = !!seg.scene.audioUrl;
              return (
                <div
                  key={seg.scene.id}
                  style={{ width: `${seg.widthPercent}%` }}
                  className={`rounded-lg px-2 flex items-center justify-between overflow-hidden border text-[9px] font-mono ${
                    hasAudio
                      ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300'
                      : 'bg-neutral-900/60 border-dashed border-neutral-800 text-neutral-500'
                  }`}
                >
                  <span className="truncate">
                    {hasAudio ? `🎙 "${seg.scene.narration.slice(0, 22)}..."` : 'No voice'}
                  </span>
                  <span className="shrink-0 text-[8px] opacity-80">
                    {hasAudio ? `${seg.duration.toFixed(1)}s` : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* LAYER 4: BACKGROUND MUSIC (Independent Continuous Master Layer) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px] font-mono text-purple-400 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Music className="w-3 h-3" />
              <span className="font-bold">BACKGROUND MUSIC</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenMusicLibrary?.();
              }}
              className="text-purple-300 hover:text-white underline decoration-dotted"
            >
              Auto-ducked ~8 dB during speech • {Math.round(musicVolume * 100)}% Vol
            </button>
          </div>

          <div
            onClick={(e) => {
              if (onOpenMusicLibrary) {
                e.stopPropagation();
                onOpenMusicLibrary();
              }
            }}
            title="Click to open Music Library or adjust ducking volume"
            className="relative h-7 rounded-lg bg-gradient-to-r from-purple-950/70 via-indigo-950/60 to-purple-950/70 border border-purple-700/60 px-2.5 flex items-center justify-between text-[9px] font-mono text-purple-200 overflow-hidden hover:border-purple-500 transition-colors"
          >
            {/* Continuous background waveform bars across full timeline */}
            <div className="absolute inset-0 flex items-center justify-between px-2 opacity-20 pointer-events-none">
              {Array.from({ length: 48 }).map((_, i) => {
                const h = 30 + ((i * 19 + 11) % 55);
                return (
                  <div
                    key={i}
                    className="w-0.5 bg-purple-400 rounded-full"
                    style={{ height: `${h}%` }}
                  />
                );
              })}
            </div>

            <span className="relative z-10 truncate font-semibold flex items-center gap-1.5">
              <span>🎵 {musicTitle}</span>
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-purple-900/80 text-purple-200 border border-purple-700/50">
                ONE CONTINUOUS TRACK (0.0s → {totalDuration.toFixed(1)}s)
              </span>
            </span>
            <span className="relative z-10 text-[8px] text-emerald-300 font-bold shrink-0">
              Smooth Ducking Active
            </span>
          </div>
        </div>

        {/* LAYER 5: SFX (Atmospheric Sound Effects Layer) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px] font-mono text-rose-400 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Volume2 className="w-3 h-3" />
              <span className="font-bold">SFX</span>
            </div>
            <span className="text-neutral-500">Atmospheric Sound Effects & Cues</span>
          </div>

          <div className="relative h-6 flex items-stretch gap-1">
            {sceneSegments.map((seg) => {
              const hasSfx = !!(seg.scene.sfxUrl || seg.scene.sfxLabel);
              return (
                <div
                  key={seg.scene.id}
                  style={{ width: `${seg.widthPercent}%` }}
                  className={`rounded-lg px-2 flex items-center justify-between overflow-hidden border text-[8px] font-mono ${
                    hasSfx
                      ? 'bg-rose-950/45 border-rose-800/50 text-rose-300'
                      : 'bg-neutral-900/40 border-dashed border-neutral-800/80 text-neutral-600'
                  }`}
                >
                  <span className="truncate">
                    {hasSfx ? `🔊 ${seg.scene.sfxLabel || 'Scene SFX'}` : 'Ambient'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
