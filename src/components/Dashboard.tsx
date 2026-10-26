import React, { useState } from 'react';
import {
  VideoProject,
  VideoStyle,
  AspectRatio,
} from '../types/video';
import {
  Plus,
  Search,
  Sparkles,
  Play,
  Clock,
  Layers,
  Copy,
  Trash2,
  ExternalLink,
  Flame,
  Zap,
  BookOpen,
  Film,
} from 'lucide-react';

interface TemplateStarter {
  title: string;
  topic: string;
  style: VideoStyle;
  aspectRatio: AspectRatio;
  duration: number;
  scenesCount: number;
  category: string;
}

const TEMPLATE_STARTERS: TemplateStarter[] = [
  {
    title: '5 Daily Habits for Hyper-Focus',
    topic: '5 daily scientific habits that elite performers use to achieve uninterrupted deep focus, including the 90-minute ultradian rhythm and phone quarantines.',
    style: 'stickman',
    aspectRatio: '9:16',
    duration: 45,
    scenesCount: 5,
    category: 'Productivity',
  },
  {
    title: 'How Black Holes Warp Time & Space',
    topic: 'An awe-inspiring breakdown of gravitational time dilation near the event horizon of a supermassive black hole, where 1 hour equals 7 earth years.',
    style: 'cinematic',
    aspectRatio: '16:9',
    duration: 60,
    scenesCount: 6,
    category: 'Science',
  },
  {
    title: 'The Psychology of First Impressions',
    topic: 'Why human brains decide if they trust someone within the first 7 seconds, exploring thin-slicing and subconscious micro-expressions.',
    style: '3d_cartoon',
    aspectRatio: '9:16',
    duration: 40,
    scenesCount: 5,
    category: 'Psychology',
  },
  {
    title: 'The 80/20 Rule in 60 Seconds',
    topic: 'How the Pareto Principle governs wealth, software bugs, company profits, and daily productivity, with actionable advice to discard the trivial 80%.',
    style: 'minimal_illustration',
    aspectRatio: '9:16',
    duration: 50,
    scenesCount: 5,
    category: 'Business',
  },
  {
    title: 'The Secret History of Coffee',
    topic: 'How dancing Ethiopian goats discovered coffee beans in the 9th century, sparking the Ottoman coffeehouse revolution and modern enlightenment.',
    style: 'whiteboard',
    aspectRatio: '9:16',
    duration: 45,
    scenesCount: 5,
    category: 'History',
  },
];

interface DashboardProps {
  projects: VideoProject[];
  onCreateNew: () => void;
  onOpenProject: (project: VideoProject) => void;
  onDuplicateProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onSelectTemplate: (template: TemplateStarter) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  onCreateNew,
  onOpenProject,
  onDuplicateProject,
  onDeleteProject,
  onSelectTemplate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'completed' | 'draft' | 'templates'>('all');

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.originalTopic.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterTab === 'completed') return p.status === 'completed';
    if (filterTab === 'draft') return p.status === 'draft' || p.status === 'ready';
    return true;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-950 text-neutral-100 pb-16">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden border-b border-neutral-800/60 bg-gradient-to-b from-indigo-950/40 via-neutral-900/40 to-neutral-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.15),transparent_50%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Automated AI Video Production Pipeline
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              Create Viral Faceless Videos <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-amber-300 bg-clip-text text-transparent">
                in Minutes with AI
              </span>
            </h1>
            <p className="mt-3 text-neutral-400 text-sm sm:text-base max-w-2xl leading-relaxed">
              Generate structured video production plans, tailored visual scenes, natural voiceovers, dynamic captions, and export high-retention Shorts, Reels, and YouTube content.
            </p>
          </div>

          <button
            onClick={onCreateNew}
            className="group flex items-center gap-3 px-6 py-3.5 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.03] active:scale-[0.98] ring-1 ring-white/20 whitespace-nowrap"
          >
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <span>+ Create New Video</span>
          </button>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Controls Bar: Search & Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-900 border border-neutral-800 text-xs sm:text-sm font-medium">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                filterTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All Projects ({projects.length})
            </button>
            <button
              onClick={() => setFilterTab('completed')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                filterTab === 'completed'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Completed ({projects.filter((p) => p.status === 'completed').length})
            </button>
            <button
              onClick={() => setFilterTab('draft')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                filterTab === 'draft'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Drafts ({projects.filter((p) => p.status !== 'completed').length})
            </button>
            <button
              onClick={() => setFilterTab('templates')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                filterTab === 'templates'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Templates
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search projects or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Section: Templates Shelf (Visible if Templates tab or at top of All) */}
        {(filterTab === 'templates' || (filterTab === 'all' && !searchQuery)) && (
          <section className="mt-8 mb-12">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white tracking-tight">
                  High-Retention Video Templates
                </h2>
                <span className="text-xs text-neutral-400 hidden sm:inline">
                  — 1-click starters for popular faceless niches
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {TEMPLATE_STARTERS.map((tmpl, idx) => (
                <div
                  key={idx}
                  onClick={() => onSelectTemplate(tmpl)}
                  className="group relative cursor-pointer rounded-2xl bg-gradient-to-b from-neutral-900 to-neutral-900/60 border border-neutral-800 hover:border-indigo-500/50 p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-2">
                      <span className="px-2 py-0.5 rounded bg-neutral-800 text-indigo-300 font-semibold uppercase tracking-wider">
                        {tmpl.category}
                      </span>
                      <span className="text-neutral-400 font-mono">
                        {tmpl.aspectRatio}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
                      {tmpl.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      {tmpl.topic}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-400">
                    <span className="capitalize text-neutral-300">
                      {tmpl.style.replace('_', ' ')}
                    </span>
                    <span className="inline-flex items-center gap-1 text-indigo-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                      Use <Sparkles className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section: Project Cards */}
        {filterTab !== 'templates' && (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Film className="w-5 h-5 text-indigo-400" />
                Recent Projects
              </h2>
              <span className="text-xs text-neutral-400">
                {filteredProjects.length} project{filteredProjects.length === 1 ? '' : 's'}
              </span>
            </div>

            {filteredProjects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 p-12 text-center">
                <BookOpen className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-white">No projects found</h3>
                <p className="text-sm text-neutral-400 mt-1 max-w-sm mx-auto">
                  {searchQuery
                    ? `No results matching "${searchQuery}". Try a different keyword.`
                    : 'Start creating your first faceless AI video with one click.'}
                </p>
                <button
                  onClick={onCreateNew}
                  className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProjects.map((proj) => {
                  const isDemo = proj.id === 'demo_procrastination_project';
                  return (
                    <div
                      key={proj.id}
                      className="group rounded-2xl bg-neutral-900 border border-neutral-800/80 hover:border-neutral-700 transition-all duration-200 hover:shadow-2xl hover:shadow-black/50 overflow-hidden flex flex-col justify-between"
                    >
                      {/* Thumbnail Container */}
                      <div
                        onClick={() => onOpenProject(proj)}
                        className="relative w-full aspect-[16/10] bg-neutral-950 overflow-hidden cursor-pointer flex items-center justify-center group-hover:opacity-95"
                      >
                        {proj.thumbnailUrl || proj.scenes[0]?.imageUrl ? (
                          <img
                            src={proj.thumbnailUrl || proj.scenes[0]?.imageUrl}
                            alt={proj.project.title}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-neutral-600 gap-2">
                            <Film className="w-8 h-8" />
                            <span className="text-xs">No thumbnail</span>
                          </div>
                        )}

                        {/* Aspect Ratio Badge */}
                        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-mono font-bold text-white border border-white/10">
                          {proj.project.aspect_ratio}
                        </div>

                        {/* Status Tag */}
                        <div className="absolute top-2.5 right-2.5">
                          {proj.status === 'completed' ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-bold text-emerald-300">
                              Ready
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-500/40 text-[10px] font-bold text-amber-300">
                              Draft
                            </span>
                          )}
                        </div>

                        {/* Quick Play Hover Button */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/50 scale-90 group-hover:scale-100 transition-transform">
                            <Play className="w-5 h-5 ml-0.5 fill-white" />
                          </div>
                        </div>

                        {/* Duration Pill */}
                        <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 text-[11px] font-medium text-white flex items-center gap-1">
                          <Clock className="w-3 h-3 text-neutral-400" />
                          {proj.project.total_duration}s
                        </div>
                      </div>

                      {/* Info & Meta Body */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[11px] font-semibold uppercase text-indigo-400">
                              {proj.project.style.replace('_', ' ')}
                            </span>
                            <span className="text-neutral-600">•</span>
                            <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                              <Layers className="w-3 h-3" />
                              {proj.scenes.length} scenes
                            </span>
                            {isDemo && (
                              <span className="ml-auto text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                                Seed Demo
                              </span>
                            )}
                          </div>

                          <h3
                            onClick={() => onOpenProject(proj)}
                            className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors cursor-pointer line-clamp-1"
                            title={proj.project.title}
                          >
                            {proj.project.title}
                          </h3>
                          <p className="mt-1 text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                            {proj.originalTopic || proj.project.description}
                          </p>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                          <button
                            onClick={() => onOpenProject(proj)}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-neutral-800 hover:bg-indigo-600 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Open Editor
                          </button>

                          <button
                            onClick={() => onDuplicateProject(proj.id)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                            title="Duplicate Project"
                            aria-label="Duplicate Project"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {!isDemo && (
                            <button
                              onClick={() => onDeleteProject(proj.id)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
                              title="Delete Project"
                              aria-label="Delete Project"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};
