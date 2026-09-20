import React, { useState } from 'react';
import { EducationalModule, User } from '../types';
import { store } from '../services/store';
import { QuizModal } from './QuizModal';
import {
  BookOpen,
  Award,
  ExternalLink,
  Clock,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  PlusCircle,
  Search,
  ArrowRight,
  ShieldCheck,
  Globe,
} from 'lucide-react';

interface EducationalHubProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  setActiveTab: (tab: string) => void;
  onNavigateAdmin?: (section?: 'withdrawals' | 'security' | 'claims' | 'quizzes') => void;
}

export const EducationalHub: React.FC<EducationalHubProps> = ({
  currentUser,
  onOpenAuth,
  setActiveTab,
  onNavigateAdmin,
}) => {
  const [selectedModuleForQuiz, setSelectedModuleForQuiz] = useState<EducationalModule | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const modules = store.getModules().filter((m) => m.isPublished !== false);
  const categories = ['all', ...Array.from(new Set(modules.map((m) => m.category)))];

  const filteredModules = modules.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleLaunchQuiz = (module: EducationalModule) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    setSelectedModuleForQuiz(module);
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#171d2b] via-[#111722] to-[#0d1017] border border-amber-500/30 p-6 sm:p-8 lg:p-10 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Learn & Earn &bull; 24-Hour Active Quizzes</span>
            </div>
            <h1 className="font-cinzel text-2xl sm:text-3xl lg:text-4xl font-extrabold text-zinc-100">
              Eldra Academy & Quizzes
            </h1>
            <p className="text-zinc-400 text-sm mt-1.5 max-w-2xl leading-relaxed">
              Study the external learning resources and test your knowledge. Each quiz allows strictly 1 attempt and remains active for 24 hours.
            </p>
          </div>

          {currentUser?.role === 'admin' && (
            <div className="shrink-0 flex items-center gap-2.5 flex-wrap">
              <button
                id="admin-manage-quizzes-direct-btn"
                onClick={() => {
                  if (onNavigateAdmin) onNavigateAdmin('quizzes');
                  else setActiveTab('admin');
                }}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 text-black font-extrabold text-xs shadow-xl shadow-amber-500/25 flex items-center gap-2 hover:scale-105 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Admin: ➕ Post New Quiz & Learning Link</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {cat === 'all' ? 'All Topics' : cat}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Modules Grid or Empty State */}
      {filteredModules.length === 0 ? (
        <div className="rounded-3xl bg-[#101520] border border-zinc-800 p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="font-cinzel text-lg font-bold text-zinc-100">
            No Active Quizzes Found
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {searchQuery || selectedCategory !== 'all'
              ? 'No quizzes matched your filter criteria. Try clearing your search term.'
              : 'New educational articles and quizzes will be published soon by the administration.'}
          </p>
          {currentUser?.role === 'admin' && (
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => {
                  store.restoreDefaultModules();
                }}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all cursor-pointer"
              >
                Restore Default Quizzes
              </button>
              <button
                onClick={() => {
                  if (onNavigateAdmin) onNavigateAdmin('quizzes');
                  else setActiveTab('admin');
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                ➕ Post First Educational Quiz & Link
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((module) => {
            const progress = currentUser ? store.getQuizProgress(module.id, currentUser.id) : undefined;
            const hasAttempted = currentUser ? store.hasUserAttemptedQuiz(module.id, currentUser.id) : false;
            const isPassed = progress?.passed;
            const questionsCount = module.questions?.length || 0;
            const totalPossibleEldra = questionsCount * 2 + (module.completionBonus || 20);
            const timeInfo = store.getQuizTimeRemaining(module);

            return (
              <div
                key={module.id}
                className="rounded-3xl bg-[#101520] border border-zinc-800 hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between p-6 group hover:shadow-xl hover:shadow-amber-500/5 relative overflow-hidden"
              >
                {/* Category, 24h Countdown & Status Badge */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {module.category}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        {timeInfo.formattedTime}
                      </span>
                    </div>

                    {hasAttempted ? (
                      <span className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isPassed
                          ? 'text-emerald-400 bg-emerald-950/60 border-emerald-600/30'
                          : 'text-amber-400 bg-amber-950/40 border-amber-600/30'
                      }`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {isPassed ? `Passed (${progress?.score}%)` : `Attempted (${progress?.score}%)`}
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Up to {totalPossibleEldra} ELDRA
                      </span>
                    )}
                  </div>

                  <h3 className="font-cinzel text-lg font-bold text-zinc-100 group-hover:text-amber-300 transition-colors line-clamp-2">
                    {module.title}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-2 line-clamp-3 leading-relaxed">
                    {module.summary}
                  </p>
                </div>

                {/* Module Metadata & Action Buttons */}
                <div className="mt-6 pt-4 border-t border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      {module.readTimeMinutes} min read
                    </span>
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-zinc-500" />
                      {questionsCount} Questions (1 Attempt)
                    </span>
                  </div>

                  {/* Primary Action Buttons: 1. External Article Link, 2. Take Quiz */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <a
                      href={module.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-amber-500/40 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-center"
                      title="Visit learning article link directly in new tab"
                    >
                      <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">Visit Article</span>
                      <ExternalLink className="w-3 h-3 text-zinc-400 shrink-0" />
                    </a>

                    {hasAttempted ? (
                      <button
                        disabled
                        className="w-full py-2.5 px-3 rounded-xl bg-zinc-850 border border-zinc-700/60 text-zinc-400 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Attempt Used (1/1)</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleLaunchQuiz(module)}
                        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5 shrink-0" />
                        <span>Take Quiz</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quiz Modal */}
      {selectedModuleForQuiz && (
        <QuizModal
          module={selectedModuleForQuiz}
          currentUser={currentUser}
          onClose={() => setSelectedModuleForQuiz(null)}
          onOpenAuth={onOpenAuth}
        />
      )}
    </div>
  );
};
