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
  VolumeX,
  X,
  Disc3,
  Sliders,
  ShieldCheck,
  Sparkles,
  Info,
} from 'lucide-react';

interface MusicDrawerProps {
  selectedTrackId?: string;
  musicVolume: number;
  voiceVolume?: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectTrack: (trackId: string) => void;
  onVolumeChange: (newVolume: number) => void;
  onVoiceVolumeChange?: (newVolume: number) => void;
}

export const MusicDrawer: React.FC<MusicDrawerProps> = ({
  selectedTrackId,
  musicVolume,
  voiceVolume = 0.95,
  isOpen,
  onClose,
  onSelectTrack,
  onVolumeChange,
  onVoiceVolumeChange,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(musicVolume === 0);
  const [lastVolume, setLastVolume] = useState<number>(musicVolume > 0 ? musicVolume : 0.25);

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
      musicPlayer.playTrack(track, (isMuted ? 0 : musicVolume) * 0.45);
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

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      onVolumeChange(lastVolume);
      if (previewTrackId) {
        musicPlayer.setVolume(lastVolume * 0.45);
      }
    } else {
      setLastVolume(musicVolume > 0 ? musicVolume : 0.25);
      setIsMuted(true);
      onVolumeChange(0);
      if (previewTrackId) {
        musicPlayer.setVolume(0);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl rounded-3xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Disc3 className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">Free Educational Music Library</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> 100% Royalty Free / CC0
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Safe for YouTube Shorts, Instagram Reels, TikTok, and educational courses. Automatic audio ducking active.
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

        {/* Dual Audio Volume Mixers (Music + Voiceover) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Music Volume & Mute */}
          <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold text-white">
                <Music className="w-4 h-4 text-indigo-400" />
                <span>Background Music Volume:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-400">
                  {isMuted ? 'MUTED' : `${Math.round(musicVolume * 100)}%`}
                </span>
                <button
                  onClick={toggleMute}
                  className={`p-1 rounded-lg border text-xs transition-colors ${
                    isMuted
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
                  }`}
                  title={isMuted ? 'Unmute music' : 'Mute music'}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : musicVolume}
              onChange={(e) => {
                const val = Number(e.target.value);
                setIsMuted(val === 0);
                onVolumeChange(val);
                if (previewTrackId) {
                  musicPlayer.setVolume(val * 0.45);
                }
              }}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-neutral-500">
              <span>Auto-ducked during voiceover</span>
              <span>Fade-in / Fade-out: ON</span>
            </div>
          </div>

          {/* Voiceover Volume */}
          <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold text-white">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Voiceover Master Volume:</span>
              </div>
              <span className="font-mono text-xs font-bold text-amber-400">
                {Math.round(voiceVolume * 100)}%
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={voiceVolume}
              onChange={(e) => onVoiceVolumeChange?.(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-neutral-500">
              <span>Voiceover stays dominant</span>
              <span>Clarity filter: Active</span>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveCategory('All')}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
              activeCategory === 'All'
                ? 'bg-indigo-600 text-white font-bold'
                : 'bg-neutral-800 text-neutral-300 hover:text-white'
            }`}
          >
            All Tracks ({MUSIC_TRACKS.length})
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
        <div className="space-y-2.5 max-h-[42vh] overflow-y-auto pr-1">
          {filteredTracks.map((track) => {
            const isSelected = selectedTrackId === track.id;
            const isPlaying = previewTrackId === track.id;

            return (
              <div
                key={track.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/50'
                    : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {/* Play preview button & info */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <button
                    onClick={() => handleTogglePreview(track)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform active:scale-95 shrink-0 mt-0.5 ${
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-white truncate">{track.title}</h4>
                      <span className="px-2 py-0.5 rounded bg-neutral-800 text-[10px] font-semibold text-indigo-300 uppercase">
                        {track.category}
                      </span>
                      {track.audioUrl && (
                        <span className="px-1.5 py-0.5 rounded bg-neutral-800/80 text-[9px] font-mono text-neutral-400">
                          HQ MP3
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
                      <span>{Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}</span>
                      <span>•</span>
                      <span>{track.bpm} BPM</span>
                      <span>•</span>
                      <span className="capitalize">{track.energy} energy</span>
                    </div>

                    {/* License & Source Info */}
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-neutral-400">
                      <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="text-emerald-400/90 font-medium">{track.license || 'Royalty-Free'}</span>
                      <span>—</span>
                      <span className="truncate">{track.attribution || 'No attribution required'}</span>
                    </div>
                  </div>
                </div>

                {/* Waveform graphic & Select button */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800/80">
                  {/* Waveform bars */}
                  <div className="flex items-center gap-1 h-6 w-20">
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
        <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <span>All tracks stored in <code className="text-indigo-400">public/music/</code></span>
          <button
            onClick={() => {
              musicPlayer.stop();
              onClose();
            }}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
