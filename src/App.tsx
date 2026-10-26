import React, { useState, useEffect } from 'react';
import { VideoProject, VideoStyle, AspectRatio } from './types/video';
import { storageService, SEED_DEMO_PROJECT } from './services/storageService';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { NewProjectWizard } from './components/Wizard/NewProjectWizard';
import { JsonImportScreen } from './components/JsonImport/JsonImportScreen';
import { VideoProductionWorkspace } from './components/Workspace/VideoProductionWorkspace';
import {
  HelpCircle,
  X,
  Sparkles,
  ArrowRight,
  Film,
  FileCode2,
  Sliders,
  Download,
} from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'wizard' | 'json_import' | 'workspace'>('dashboard');
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [activeProject, setActiveProject] = useState<VideoProject>(SEED_DEMO_PROJECT);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const navigateTo = (view: 'dashboard' | 'wizard' | 'json_import' | 'workspace') => {
    setCurrentView(view);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };
  const [wizardDraft, setWizardDraft] = useState<{
    topic: string;
    style: VideoStyle;
    aspectRatio: AspectRatio;
    scenesCount: number;
    targetDuration: number;
    language: string;
    voiceId: string;
  }>({
    topic: '',
    style: 'stickman',
    aspectRatio: '9:16',
    scenesCount: 5,
    targetDuration: 45,
    language: 'English',
    voiceId: 'female_educational',
  });

  // Load projects from storage on mount
  useEffect(() => {
    const list = storageService.getProjects();
    setProjects(list);
    const activeId = storageService.getActiveProjectId();
    const found = list.find((p) => p.id === activeId) || list[0] || SEED_DEMO_PROJECT;
    setActiveProject(found);
  }, []);

  const refreshProjectList = () => {
    setProjects(storageService.getProjects());
  };

  const handleOpenProject = (project: VideoProject) => {
    setActiveProject(project);
    storageService.setActiveProjectId(project.id);
    navigateTo('workspace');
  };

  const handleCreateNew = () => {
    setWizardDraft({
      topic: '',
      style: 'stickman',
      aspectRatio: '9:16',
      scenesCount: 5,
      targetDuration: 45,
      language: 'English',
      voiceId: 'female_educational',
    });
    navigateTo('wizard');
  };

  const handleSelectTemplate = (tmpl: any) => {
    setWizardDraft({
      topic: tmpl.topic,
      style: tmpl.style,
      aspectRatio: tmpl.aspectRatio,
      scenesCount: tmpl.scenesCount,
      targetDuration: tmpl.duration,
      language: 'English',
      voiceId: 'female_educational',
    });
    navigateTo('wizard');
  };

  const handleDuplicateProject = (id: string) => {
    const copy = storageService.duplicateProject(id);
    if (copy) {
      refreshProjectList();
    }
  };

  const handleDeleteProject = (id: string) => {
    storageService.deleteProject(id);
    refreshProjectList();
  };

  const handleWizardContinueToJson = (
    _promptText: string,
    metadata: typeof wizardDraft
  ) => {
    setWizardDraft(metadata);
    navigateTo('json_import');
  };

  const handleImportComplete = (importedProject: VideoProject) => {
    // Preserve any preferred voice from draft if applicable
    if (wizardDraft.voiceId) {
      importedProject.project.voiceId = wizardDraft.voiceId;
    }
    storageService.saveProject(importedProject);
    storageService.setActiveProjectId(importedProject.id);
    setActiveProject(importedProject);
    refreshProjectList();
    navigateTo('workspace');
  };

  return (
    <div className="min-h-screen bg-neutral-950 font-sans antialiased text-neutral-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Universal Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        projectTitle={activeProject?.project.title}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Main Routed View */}
      <div className="flex-1">
        {currentView === 'dashboard' && (
          <Dashboard
            projects={projects}
            onCreateNew={handleCreateNew}
            onOpenProject={handleOpenProject}
            onDuplicateProject={handleDuplicateProject}
            onDeleteProject={handleDeleteProject}
            onSelectTemplate={handleSelectTemplate}
          />
        )}

        {currentView === 'wizard' && (
          <NewProjectWizard
            initialTopic={wizardDraft.topic}
            initialStyle={wizardDraft.style}
            initialRatio={wizardDraft.aspectRatio}
            initialDuration={wizardDraft.targetDuration}
            initialScenes={wizardDraft.scenesCount}
            onBack={() => setCurrentView('dashboard')}
            onDirectCreateProject={handleImportComplete}
            onContinueToJsonImport={handleWizardContinueToJson}
          />
        )}

        {currentView === 'json_import' && (
          <JsonImportScreen
            initialTopic={wizardDraft.topic}
            initialStyle={wizardDraft.style}
            initialRatio={wizardDraft.aspectRatio}
            initialScenesCount={wizardDraft.scenesCount}
            initialDuration={wizardDraft.targetDuration}
            onBack={() => setCurrentView('wizard')}
            onImportComplete={handleImportComplete}
          />
        )}

        {currentView === 'workspace' && (
          <VideoProductionWorkspace
            project={activeProject}
            onBackToDashboard={() => {
              refreshProjectList();
              setCurrentView('dashboard');
            }}
            onUpdateProject={(updated) => {
              setActiveProject(updated);
              refreshProjectList();
            }}
          />
        )}
      </div>

      {/* Help / How It Works Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-3xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">How Faceless AI Video Works</h3>
              </div>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-neutral-300">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Enter Content & Style</h4>
                  <p className="text-neutral-400 mt-0.5">
                    Provide any topic or lesson, choose from 10 artistic visual styles (Stickman, 3D Cartoon, Whiteboard, etc.), and select aspect ratio.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Generate AI Production Prompt</h4>
                  <p className="text-neutral-400 mt-0.5">
                    We formulate a strict schema prompt. Copy and run it in ChatGPT, Claude, Gemini, or DeepSeek.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Paste & Validate JSON</h4>
                  <p className="text-neutral-400 mt-0.5">
                    Paste the AI output. Our engine validates every scene, auto-recovers formatting issues, and generates tailored visuals.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Real-Time Preview & MP4 Export</h4>
                  <p className="text-neutral-400 mt-0.5">
                    Audition animations, word-by-word karaoke captions, and background music in the timeline. Export directly to 1080p MP4.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsHelpOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                Got It, Let’s Create!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
