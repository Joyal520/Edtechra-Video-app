import React from 'react';
import { Film, Plus, Sparkles, LayoutGrid, HelpCircle } from 'lucide-react';

interface NavbarProps {
  currentView: 'dashboard' | 'wizard' | 'json_import' | 'workspace';
  onNavigate: (view: 'dashboard' | 'wizard' | 'json_import' | 'workspace') => void;
  projectTitle?: string;
  onOpenHelp?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  projectTitle,
  onOpenHelp,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-amber-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white font-sans">
                Faceless<span className="text-indigo-400">.ai</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                Studio
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 hidden sm:block">
              AI Video Creator & Production Engine
            </p>
          </div>
        </div>

        {/* Center Breadcrumb / Context */}
        <div className="hidden md:flex items-center gap-2 text-sm text-neutral-400">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              currentView === 'dashboard'
                ? 'text-white bg-neutral-800/80 font-medium'
                : 'hover:text-neutral-200'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Projects
          </button>
          <span>/</span>
          {currentView === 'wizard' && (
            <span className="text-white font-medium flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              New Video Setup
            </span>
          )}
          {currentView === 'json_import' && (
            <span className="text-white font-medium">Import AI Plan</span>
          )}
          {currentView === 'workspace' && (
            <span className="text-white font-medium truncate max-w-[240px]">
              {projectTitle || 'Production Workspace'}
            </span>
          )}
        </div>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-3">
          {onOpenHelp && (
            <button
              onClick={onOpenHelp}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-colors"
              title="How It Works"
              aria-label="How it works"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          )}

          {currentView !== 'wizard' && (
            <button
              onClick={() => onNavigate('wizard')}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline sm:inline">New Video</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
