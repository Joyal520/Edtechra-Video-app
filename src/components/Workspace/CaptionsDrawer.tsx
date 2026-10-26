import React from 'react';
import { CaptionSettings, CaptionStyle, CaptionPosition } from '../../types/video';
import {
  Subtitles,
  X,
  Check,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

interface CaptionsDrawerProps {
  captions: CaptionSettings;
  isOpen: boolean;
  onClose: () => void;
  onUpdateCaptions: (newCaptions: CaptionSettings) => void;
}

const CAPTION_STYLES: Array<{ id: CaptionStyle; label: string; desc: string }> = [
  {
    id: 'KARAOKE',
    label: 'Karaoke Glow',
    desc: 'Dynamic word-by-word yellow highlight synchronized to spoken words',
  },
  {
    id: 'POP',
    label: 'Pop Dynamic',
    desc: 'High-contrast energetic text with animated border outline',
  },
  {
    id: 'BOLD',
    label: 'Bold Punch',
    desc: 'Uppercase bold typography in high-contrast solid card',
  },
  {
    id: 'MINIMAL',
    label: 'Minimal Clean',
    desc: 'Understated elegant typography with subtle drop shadow',
  },
  {
    id: 'NORMAL',
    label: 'Standard Subtitle',
    desc: 'Classic translucent background subtitle bar',
  },
];

export const CaptionsDrawer: React.FC<CaptionsDrawerProps> = ({
  captions,
  isOpen,
  onClose,
  onUpdateCaptions,
}) => {
  if (!isOpen) return null;

  const update = (partial: Partial<CaptionSettings>) => {
    onUpdateCaptions({ ...captions, ...partial });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-3xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Subtitles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Caption & Subtitle Styling</h2>
              <p className="text-xs text-neutral-400">
                Optimized viral subtitle layouts for Shorts, TikTok & Reels
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Enable/Disable Toggle */}
        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {captions.enabled ? (
              <Eye className="w-5 h-5 text-indigo-400" />
            ) : (
              <EyeOff className="w-5 h-5 text-neutral-500" />
            )}
            <div>
              <div className="text-sm font-bold text-white">Enable Synchronized Captions</div>
              <div className="text-xs text-neutral-400">
                Overlay speech text with animated word timing
              </div>
            </div>
          </div>

          <button
            onClick={() => update({ enabled: !captions.enabled })}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              captions.enabled ? 'bg-indigo-600' : 'bg-neutral-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                captions.enabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Caption Presets */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold text-white uppercase tracking-wider">
            Caption Animation & Style Preset
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {CAPTION_STYLES.map((style) => {
              const isSelected = captions.style === style.id;
              return (
                <div
                  key={style.id}
                  onClick={() => update({ style: style.id })}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/50 text-white'
                      : 'bg-neutral-950/80 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs uppercase">{style.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-snug">{style.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Position & Size Configuration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Position */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-white uppercase tracking-wider">
              Vertical Position
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['top', 'center', 'bottom'] as CaptionPosition[]).map((pos) => (
                <button
                  key={pos}
                  onClick={() => update({ position: pos })}
                  className={`py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                    captions.position === pos
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-white uppercase tracking-wider">
              Font Size
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => update({ fontSize: size })}
                  className={`py-2 rounded-xl text-xs font-bold uppercase transition-all border ${
                    captions.fontSize === size
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Max Words per Line */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span className="uppercase tracking-wider">Max Words per Caption Line:</span>
            <span className="font-mono text-indigo-400">{captions.maxWordsPerLine || 5} words</span>
          </div>
          <input
            type="range"
            min={2}
            max={8}
            value={captions.maxWordsPerLine || 5}
            onChange={(e) => update({ maxWordsPerLine: Number(e.target.value) })}
            className="w-full accent-indigo-500"
          />
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-neutral-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            Apply Captions
          </button>
        </div>
      </div>
    </div>
  );
};
