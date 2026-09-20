import React, { useState } from 'react';
import { EducationalModule, User } from '../types';
import { store } from '../services/store';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  BookOpen,
  X,
  Flame,
  Check,
} from 'lucide-react';

interface QuizModalProps {
  module: EducationalModule;
  currentUser: User | null;
  onClose: () => void;
  onOpenAuth: () => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  module,
  currentUser,
  onClose,
  onOpenAuth,
}) => {
  const existingProgress = currentUser ? store.getQuizProgress(module.id, currentUser.id) : undefined;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>(
    existingProgress?.userAnswers || {}
  );
  const [isSubmitted, setIsSubmitted] = useState(!!(existingProgress?.attempted || existingProgress?.completed));
  const [quizResult, setQuizResult] = useState<{
    passed: boolean;
    scorePercentage: number;
    correctCount: number;
    totalQuestions: number;
    earnedCoins: number;
    bonusCoins: number;
    message: string;
  } | null>(
    existingProgress
      ? {
          passed: existingProgress.passed,
          scorePercentage: existingProgress.score,
          correctCount: existingProgress.correctAnswersCount,
          totalQuestions: existingProgress.totalQuestions,
          earnedCoins: existingProgress.earnedCoins,
          bonusCoins: existingProgress.passed ? 20 : 0,
          message: existingProgress.passed
            ? `You scored ${existingProgress.score}% and earned ${existingProgress.earnedCoins} ELDRA! Attempt recorded.`
            : `You scored ${existingProgress.score}%. Your 1 attempt has been recorded.`,
        }
      : null
  );

  const questions = module.questions || [];
  const currentQ = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    // Submit to store
    const result = store.submitQuiz(module.id, selectedAnswers);
    setQuizResult(result);
    setIsSubmitted(true);

    if (result.passed) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#f59e0b', '#fbbf24', '#10b981', '#34d399', '#fef08a'],
      });
    }
  };

  const allAnswered = questions.every((q) => selectedAnswers[q.id] !== undefined);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#0f141d] border border-amber-500/40 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="border-b border-zinc-800 pb-4 pr-8">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {module.category}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
              Strictly 1 Attempt
            </span>
            <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> +2 ELDRA / Q &bull; +20 ELDRA Pass Jackpot
            </span>
          </div>
          <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-zinc-100">
            {module.title}
          </h2>
        </div>

        {/* Main Quiz Flow */}
        {!isSubmitted ? (
          <div className="mt-6 space-y-6">
            {/* Progress bar */}
            <div className="flex items-center justify-between text-xs text-zinc-400 font-medium mb-1">
              <span>
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
              <span className="text-amber-400 font-semibold">
                Reward: 2 ELDRA
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
                style={{
                  width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
                }}
              />
            </div>

            {/* Question Card */}
            {currentQ && (
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-zinc-100 leading-snug">
                  {currentQ.question}
                </h3>

                {/* Options List */}
                <div className="space-y-2.5 pt-2">
                  {currentQ.options.map((option, idx) => {
                    const isSelected = selectedAnswers[currentQ.id] === idx;
                    const optionLetter = String.fromCharCode(65 + idx); // A, B, C, D

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(currentQ.id, idx)}
                        className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center gap-3.5 ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-md shadow-amber-500/10'
                            : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:bg-zinc-800/60'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-colors ${
                            isSelected
                              ? 'bg-amber-400 text-black font-extrabold'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}
                        >
                          {optionLetter}
                        </span>
                        <span className="flex-1 leading-relaxed">{option}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Navigation & Submit controls */}
            <div className="flex items-center justify-between pt-6 border-t border-zinc-800">
              <button
                onClick={handlePrev}
                disabled={currentQuestionIndex === 0}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  currentQuestionIndex === 0
                    ? 'text-zinc-600 cursor-not-allowed'
                    : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900'
                }`}
              >
                Previous
              </button>

              {currentQuestionIndex < totalQuestions - 1 ? (
                <button
                  onClick={handleNext}
                  disabled={selectedAnswers[currentQ?.id] === undefined}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    selectedAnswers[currentQ?.id] !== undefined
                      ? 'bg-amber-500 hover:bg-amber-400 text-black font-extrabold shadow-lg shadow-amber-500/20'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={!allAnswered}
                  className={`px-6 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                    allAnswered
                      ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 text-black shadow-xl shadow-amber-500/30 hover:scale-105'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Submit Quiz (+20 ELDRA Bonus)</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Quiz Results View */
          quizResult && (
            <div className="mt-6 space-y-6 text-center animate-in zoom-in-95 duration-200">
              {/* Victory / Result Badge */}
              <div className="w-20 h-20 rounded-full mx-auto p-1 bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 shadow-2xl flex items-center justify-center">
                {quizResult.passed ? (
                  <div className="w-full h-full rounded-full bg-[#0f141d] flex items-center justify-center">
                    <Award className="w-10 h-10 text-amber-400 animate-bounce" />
                  </div>
                ) : (
                  <div className="w-full h-full rounded-full bg-[#0f141d] flex items-center justify-center">
                    <RotateCcw className="w-10 h-10 text-amber-500" />
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-cinzel text-2xl font-bold text-zinc-100">
                  {quizResult.passed ? 'Quiz Mastered!' : 'Quiz Attempt Completed'}
                </h3>
                <p className="text-sm text-zinc-400 mt-1.5 max-w-md mx-auto leading-relaxed">
                  {quizResult.message}
                </p>
              </div>

              {/* Reward Score Breakdown */}
              <div className="grid grid-cols-3 gap-3 bg-zinc-900/90 border border-amber-500/30 rounded-2xl p-4 text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Score</span>
                  <span className="font-cinzel text-xl font-extrabold text-zinc-100">
                    {quizResult.scorePercentage}%
                  </span>
                  <span className="text-[10px] text-zinc-500 block">
                    {quizResult.correctCount}/{quizResult.totalQuestions} correct
                  </span>
                </div>
                <div className="border-x border-zinc-800">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Question Payout</span>
                  <span className="font-cinzel text-xl font-extrabold text-amber-300">
                    +{quizResult.correctCount * 2} ELDRA
                  </span>
                  <span className="text-[10px] text-zinc-500 block">2 ELDRA each</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Pass Jackpot</span>
                  <span className="font-cinzel text-xl font-extrabold text-amber-300">
                    {quizResult.passed ? `+${quizResult.bonusCoins} ELDRA` : '0 ELDRA'}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold block">
                    {quizResult.passed ? 'Unlocked! 🎓' : 'Requires Pass'}
                  </span>
                </div>
              </div>

              {/* Question Review Breakdown with Explanations */}
              <div className="text-left space-y-3 pt-2">
                <h4 className="font-cinzel text-sm font-bold text-zinc-300">
                  Question Review & Explanations:
                </h4>
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {questions.map((q, idx) => {
                    const userAns = selectedAnswers[q.id];
                    const isCorrect = userAns === q.correctOptionIndex;
                    return (
                      <div
                        key={q.id}
                        className={`p-3 rounded-xl border text-xs ${
                          isCorrect
                            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                            : 'bg-red-950/30 border-red-500/30 text-red-200'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {isCorrect ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                          )}
                          <div>
                            <p className="font-semibold text-zinc-100">
                              {idx + 1}. {q.question}
                            </p>
                            <p className="mt-1 text-[11px] text-zinc-400">
                              Your answer: <strong className="text-zinc-200">{q.options[userAns]}</strong>
                            </p>
                            {!isCorrect && (
                              <p className="text-[11px] text-emerald-400 mt-0.5">
                                Correct answer: <strong>{q.options[q.correctOptionIndex]}</strong>
                              </p>
                            )}
                            {q.explanation && (
                              <p className="mt-1 text-[11px] text-zinc-400/90 italic">
                                💡 {q.explanation}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-800">
                <span className="text-[11px] text-zinc-500 italic">
                  🔒 Attempt limit reached (1/1 attempts used)
                </span>
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold text-xs shadow-lg hover:scale-105 transition-all"
                >
                  Done & Back to Academy
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};
