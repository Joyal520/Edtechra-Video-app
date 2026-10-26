import React, { useState } from 'react';
import { MusicCategory, MusicTrack } from '../../types/video';
import {
  MUSIC_CATEGORIES,
  MUSIC_TRACKS,
  musicPlayer,
} from '../../services/musicService';
import {
  Music,
  Play,
  Pause,
  Check,
  Volume2,
  X,
  Disc3,
  Sliders,
} from 'lucide-react';

interface MusicDrawerProps {
  selectedTrackId?: string;
  musicVolume: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectTrack: (trackId: string) => void;
  onVolumeChange: (newVolume: number) => void;
}

export const MusicDrawer: React.FC<MusicDrawerProps> = ({
  selectedTrackId,
  musicVolume,
  isOpen,
  onClose,
  onSelectTrack,
  onVolumeChange,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredTracks =
    activeCategory === 'All'
      ? MUSIC_TRACKS
      : MUSIC_TRACKS.filter((t) => t.category === activeCategory);

  const handleTogglePreview = (track: MusicTrack) => {
    if (previewTrackId === track.id) {
      musicPlayer.stop();
      setPreviewTrackId(null);
    } else {
      musicPlayer.playTrack(track, musicVolume * 0.4);
      setPreviewTrackId(track.id);
    }
  };

  const handleSelect = (trackId: string) => {
    onSelectTrack(trackId);
    if (previewTrackId) {
      musicPlayer.stop();
      setPreviewTrackId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-3xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Disc3 className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Background Music Library</h2>
              <p className="text-xs text-neutral-400">
                Royalty-free ambient soundtracks with automated audio ducking
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              musicPlayer.stop();
              onClose();
            }}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Volume Slider Section */}
        <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>Music Mix Volume:</span>
            <span className="font-mono text-indigo-400">{Math.round(musicVolume * 100)}%</span>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-xs">
            <Volume2 className="w-4 h-4 text-neutral-400" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={musicVolume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveCategory('All')}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
              activeCategory === 'All'
                ? 'bg-indigo-600 text-white font-bold'
                : 'bg-neutral-800 text-neutral-300 hover:text-white'
            }`}
          >
            All Tracks
          </button>
          {MUSIC_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-neutral-800 text-neutral-300 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Tracks List */}
        <div className="space-y-2.5 max-h-[45vh] overflow-y-auto pr-1">
          {filteredTracks.map((track) => {
            const isSelected = selectedTrackId === track.id;
            const isPlaying = previewTrackId === track.id;

            return (
              <div
                key={track.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-indigo-950/30 border-indigo-500 ring-1 ring-indigo-500/50'
                    : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {/* Play preview button & info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <button
                    onClick={() => handleTogglePreview(track)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform active:scale-95 shrink-0 ${
                      isPlaying
                        ? 'bg-indigo-600 text-white'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                    }`}
                    title={isPlaying ? 'Pause Preview' : 'Play Preview'}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5 fill-white" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white truncate">{track.title}</h4>
                      <span className="px-2 py-0.5 rounded bg-neutral-800 text-[10px] font-semibold text-indigo-300 uppercase">
                        {track.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
                      <span>{Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}</span>
                      <span>•</span>
                      <span>{track.bpm} BPM</span>
                      <span>•</span>
                      <span className="capitalize">{track.energy} energy</span>
                    </div>
                  </div>
                </div>

                {/* Waveform graphic & Select button */}
                <div className="flex items-center gap-4 shrink-0">
                  {/* Waveform bars */}
                  <div className="hidden sm:flex items-center gap-1 h-6 w-24">
                    {(track.waveformPattern || [20, 40, 60, 80, 50, 70, 90, 60, 40, 30]).map(
                      (h, i) => (
                        <div
                          key={i}
                          className={`w-1 rounded-full transition-all ${
                            isPlaying
                              ? 'bg-indigo-400 animate-pulse'
                              : isSelected
                              ? 'bg-indigo-500'
                              : 'bg-neutral-700'
                          }`}
                          style={{ height: `${h}%` }}
                        />
                      )
                    )}
                  </div>

                  <button
                    onClick={() => handleSelect(track.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-neutral-800 hover:bg-indigo-600 text-neutral-300 hover:text-white'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Selected</span>
                      </>
                    ) : (
                      <span>Select Track</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-neutral-800 flex items-center justify-end">
          <button
            onClick={() => {
              musicPlayer.stop();
              onClose();
            }}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
