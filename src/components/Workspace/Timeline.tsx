import React, { useRef } from 'react';
import { Scene, CaptionSettings } from '../../types/video';
import { Clock, Film, Mic, Music, Subtitles, Image as ImageIcon } from 'lucide-react';

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
}

export const Timeline: React.FC<TimelineProps> = ({
  scenes,
  activeSceneIndex,
  totalDuration,
  currentTime,
  musicTitle = 'Lofi Focus Beat',
  musicVolume = 0.2,
  captions,
  onSelectScene,
  onDurationChange,
  onSeek,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Accumulate scene starts
  const sceneSegments = scenes.map((scene, idx) => {
    const start = scenes.slice(0, idx).reduce((acc, s) => acc + s.duration, 0);
    return {
      index: idx,
      scene,
      start,
      end: start + scene.duration,
      duration: scene.duration,
      widthPercent: (scene.duration / (totalDuration || 1)) * 100,
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
            Multi-Track Timeline
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
        className="relative bg-neutral-950 rounded-2xl border border-neutral-800 p-2 cursor-pointer space-y-2 overflow-hidden"
      >
        {/* Playhead Vertical Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-30 pointer-events-none transition-all duration-75 shadow-[0_0_10px_rgba(251,191,36,0.9)]"
          style={{ left: `${(currentTime / (totalDuration || 1)) * 100}%` }}
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
              {seg.start.toFixed(0)}s
            </div>
          ))}
          <div className="absolute right-0 pr-1 h-3 flex items-center border-r border-neutral-700">
            {totalDuration.toFixed(0)}s
          </div>
        </div>

        {/* TRACK 1: VIDEO / IMAGE VISUAL */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-indigo-400 uppercase tracking-wider">
            <Film className="w-3 h-3" />
            <span>Track 1: Visual / Scenes</span>
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
                  {/* Thumbnail snippet */}
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
                      <span className={`font-mono font-bold ${isActive ? 'text-indigo-200' : 'text-neutral-300'}`}>
                        Scene {seg.index + 1}
                      </span>
                      <span className="font-mono text-neutral-400 text-[9px]">
                        {seg.scene.duration}s
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

        {/* TRACK 2: VOICEOVER */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-400 uppercase tracking-wider">
            <Mic className="w-3 h-3" />
            <span>Track 2: Voiceover (OpenAI TTS)</span>
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
                    {hasAudio ? `🎙 ${seg.scene.narration.slice(0, 20)}...` : 'No voice'}
                  </span>
                  <span className="shrink-0 text-[8px] opacity-75">
                    {hasAudio ? `${seg.scene.duration}s` : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* TRACK 3: BACKGROUND MUSIC */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px] font-mono text-purple-400 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Music className="w-3 h-3" />
              <span>Track 3: Soundtrack</span>
            </div>
            <span className="text-neutral-500">Auto-ducked to {Math.round(musicVolume * 100)}%</span>
          </div>

          <div className="h-6 rounded-lg bg-purple-950/40 border border-purple-800/50 px-2.5 flex items-center justify-between text-[9px] font-mono text-purple-300">
            <span className="truncate">🎵 {musicTitle}</span>
            <span className="text-[8px] text-purple-400/80">Continuous Mix</span>
          </div>
        </div>

        {/* TRACK 4: CAPTIONS */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px] font-mono text-amber-400 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Subtitles className="w-3 h-3" />
              <span>Track 4: Dynamic Subtitles</span>
            </div>
            <span className="text-neutral-500 font-normal capitalize">
              Style: {captions?.style || 'Karaoke'}
            </span>
          </div>

          <div className="relative h-6 flex items-stretch gap-1">
            {sceneSegments.map((seg) => (
              <div
                key={seg.scene.id}
                style={{ width: `${seg.widthPercent}%` }}
                className="rounded-lg bg-amber-950/40 border border-amber-800/40 px-2 flex items-center justify-center overflow-hidden text-[9px] font-bold text-amber-300 truncate"
              >
                {seg.scene.on_screen_text || seg.scene.narration.split(' ').slice(0, 3).join(' ')}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
