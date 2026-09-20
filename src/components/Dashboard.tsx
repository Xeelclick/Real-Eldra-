import React, { useState } from 'react';
import { Transaction, User, WithdrawalRequest } from '../types';
import { store } from '../services/store';
import { ELDRA_COIN_IMAGE } from '../assets/eldra_coin';
import {
  Coins,
  Users,
  Award,
  Flame,
  Clock,
  Copy,
  Check,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Edit3,
  AtSign,
  X,
  Sparkles,
  UserCheck,
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Wallet,
} from 'lucide-react';
import { WithdrawModal } from './WithdrawModal';

interface DashboardProps {
  currentUser: User | null;
  setActiveTab: (tab: string) => void;
  onOpenAuth: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  setActiveTab,
  onOpenAuth,
}) => {
  const [copiedRef, setCopiedRef] = useState(false);
  const [activeViewMode, setActiveViewMode] = useState<'all_activity' | 'withdrawals'>('all_activity');
  const [txFilter, setTxFilter] = useState<'all' | 'daily_claim' | 'referral_bonus' | 'quiz'>('all');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [newUsernameInput, setNewUsernameInput] = useState('');
  const [usernameFeedback, setUsernameFeedback] = useState<{ success?: boolean; message?: string } | null>(null);

  const transactions = currentUser ? store.getTransactions(currentUser.id) : [];
  const referrals = currentUser ? store.getReferrals(currentUser.id) : [];
  const userWithdrawals = currentUser ? store.getUserWithdrawals(currentUser.id) : [];

  const filteredTransactions = transactions.filter((tx) => {
    if (txFilter === 'all') return true;
    if (txFilter === 'quiz') {
      return tx.type === 'quiz_reward' || tx.type === 'quiz_completion_bonus';
    }
    return tx.type === txFilter;
  });

  const handleCopyReferral = () => {
    if (!currentUser) return;
    const url = `${window.location.origin}/?ref=${currentUser.referralCode}`;
    navigator.clipboard.writeText(url);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleOpenUsernameModal = () => {
    if (!currentUser) return;
    setNewUsernameInput(currentUser.username || '');
    setUsernameFeedback(null);
    setShowUsernameModal(true);
  };

  const handleSaveUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const res = store.updateUsername(currentUser.id, newUsernameInput);
    if (res.success) {
      setUsernameFeedback({ success: true, message: res.message });
      setTimeout(() => {
        setShowUsernameModal(false);
        setUsernameFeedback(null);
      }, 1000);
    } else {
      setUsernameFeedback({ success: false, message: res.message });
    }
  };

  const liveModalValidation =
    newUsernameInput.trim() && currentUser
      ? store.validateUsername(newUsernameInput, currentUser.id)
      : null;

  const getInitials = (name: string, email: string) => {
    if (name && name.trim().length > 0) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  if (!currentUser) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-20 h-20 rounded-full mx-auto p-1 bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-2xl shadow-amber-500/30 mb-6">
          <img
            src={ELDRA_COIN_IMAGE}
            alt="Eldra Coin"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = '/eldra_coin.jpg';
            }}
            className="w-full h-full object-cover rounded-full"
          />
        </div>
        <h2 className="font-cinzel text-3xl font-bold text-zinc-100 mb-3">
          Access Your Eldra Dashboard
        </h2>
        <p className="text-zinc-400 max-w-md mx-auto text-sm mb-8 leading-relaxed">
          Sign in or register to view your balances, claim daily tokens, invite friends for 5 ELDRA bonuses, and earn through educational quizzes on Solana.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold text-base shadow-xl shadow-amber-500/25 hover:scale-105 transition-all cursor-pointer"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  const pendingWithdrawalSum = currentUser.pendingWithdrawalBalance || 0;
  const totalWithdrawnSum = currentUser.withdrawnBalance || 0;

  return (
    <div className="space-y-8">
      {/* Welcome & Top Summary Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#161c28] via-[#101520] to-[#0c1017] border border-amber-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* User Info with Unique Username */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-amber-600 via-yellow-600 to-amber-700 flex items-center justify-center font-cinzel font-extrabold text-2xl text-black border-2 border-amber-400/60 shadow-xl">
                {getInitials(currentUser.displayName, currentUser.email)}
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 border-2 border-[#101520] rounded-full flex items-center justify-center text-[10px] font-bold text-black">
                ★
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-cinzel text-xl sm:text-2xl font-bold text-zinc-100">
                  {currentUser.displayName}
                </h1>
                {currentUser.role === 'admin' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Super Admin
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                    Solana Member
                  </span>
                )}
              </div>

              {/* Username Badge with Quick Edit */}
              <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
                <div
                  id="user-unique-handle"
                  onClick={handleOpenUsernameModal}
                  className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 hover:border-amber-400/60 text-amber-300 text-xs font-mono font-bold cursor-pointer transition-all shadow-sm"
                  title="Click to customize your unique username"
                >
                  <AtSign className="w-3.5 h-3.5 text-amber-400" />
                  <span>{currentUser.username || 'member'}</span>
                  <Edit3 className="w-3 h-3 text-amber-400/60 group-hover:text-amber-300 ml-1 transition-colors" />
                </div>

                <span className="text-xs text-zinc-400 font-mono">{currentUser.email}</span>
              </div>

              {/* Referral Tag */}
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <button
                  id="dash-copy-referral-btn"
                  onClick={handleCopyReferral}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-700/80 text-amber-300 hover:border-amber-500/50 hover:bg-zinc-800/80 text-xs font-mono font-semibold transition-all cursor-pointer"
                  title="Copy your referral link"
                >
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>Referral Code: {currentUser.referralCode}</span>
                  {copiedRef ? (
                    <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-bold ml-1">
                      <Check className="w-3.5 h-3.5" /> Copied!
                    </span>
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-zinc-400 ml-1" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Large Total Available Balance & Withdrawal CTA */}
          <div className="bg-[#0b0e14]/90 border border-amber-500/30 rounded-2xl p-5 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between lg:justify-end gap-5 shadow-inner">
            <div className="text-left lg:text-right">
              <p className="text-xs uppercase font-bold tracking-wider text-zinc-400">
                Available Eldra Balance
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-cinzel text-3xl sm:text-4xl font-extrabold text-amber-300 tracking-tight">
                  {currentUser.balance.toLocaleString()}
                </span>
                <span className="font-bold text-amber-400 text-sm">ELDRA</span>
              </div>

              {/* Status Breakdown for full transparency */}
              <div className="flex flex-wrap items-center gap-2 mt-1.5 lg:justify-end">
                {pendingWithdrawalSum > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">
                    {pendingWithdrawalSum} ELDRA in 24h Review
                  </span>
                )}
                {totalWithdrawnSum > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    {totalWithdrawnSum} ELDRA Paid Out
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 w-full sm:w-auto">
              <button
                id="dash-open-withdraw-btn"
                onClick={() => setActiveTab('withdraw')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4 text-black" />
                <span>Withdraw</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Dedicated Metric Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Column 1: Daily Faucet Claims */}
        <div
          id="stat-card-daily-claims"
          onClick={() => setActiveTab('claim')}
          className="group cursor-pointer rounded-2xl bg-[#101520] border border-zinc-800 hover:border-amber-500/40 p-5 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-zinc-400 tracking-wider">
                Daily Faucet
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="font-cinzel text-2xl font-bold text-zinc-100 group-hover:text-amber-300 transition-colors">
                {currentUser.dailyClaimBalance}
              </span>
              <span className="text-xs font-semibold text-amber-400/80">ELDRA</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <span>Rate: 1 ELDRA / Day</span>
            <span className="text-amber-400 font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Claim <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Column 2: Referral Rewards */}
        <div
          id="stat-card-referrals"
          onClick={() => setActiveTab('referrals')}
          className="group cursor-pointer rounded-2xl bg-[#101520] border border-zinc-800 hover:border-amber-500/40 p-5 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-zinc-400 tracking-wider">
                Referral Rewards
              </span>
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 text-yellow-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="font-cinzel text-2xl font-bold text-zinc-100 group-hover:text-amber-300 transition-colors">
                {currentUser.referralBalance}
              </span>
              <span className="text-xs font-semibold text-amber-400/80">ELDRA</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <span>{referrals.length} Friends Invited (+5 each)</span>
            <span className="text-amber-400 font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Invite <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Column 3: Quiz Rewards */}
        <div
          id="stat-card-quiz"
          onClick={() => setActiveTab('learn')}
          className="group cursor-pointer rounded-2xl bg-[#101520] border border-zinc-800 hover:border-amber-500/40 p-5 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-zinc-400 tracking-wider">
                Quiz Earnings
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="font-cinzel text-2xl font-bold text-zinc-100 group-hover:text-amber-300 transition-colors">
                {currentUser.quizBalance}
              </span>
              <span className="text-xs font-semibold text-amber-400/80">ELDRA</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <span>+2/Q &bull; +20 Jackpot</span>
            <span className="text-amber-400 font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              Learn <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Column 4: Claim Streak */}
        <div
          id="stat-card-streak"
          onClick={() => setActiveTab('claim')}
          className="group cursor-pointer rounded-2xl bg-[#101520] border border-zinc-800 hover:border-orange-500/40 p-5 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-zinc-400 tracking-wider">
                Active Streak
              </span>
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Flame className="w-4 h-4 fill-orange-400" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="font-cinzel text-2xl font-bold text-zinc-100 group-hover:text-orange-400 transition-colors">
                {currentUser.claimStreak}
              </span>
              <span className="text-xs font-semibold text-orange-400">
                {currentUser.claimStreak === 1 ? 'Day' : 'Days'}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <span>Proof-of-Flame</span>
            <span className="text-orange-400 font-semibold">Streak Active</span>
          </div>
        </div>
      </div>

      {/* 4 Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Quick Action 1: Daily Faucet */}
        <button
          id="dash-action-claim"
          onClick={() => setActiveTab('claim')}
          className="p-4.5 rounded-2xl bg-gradient-to-r from-amber-500/15 to-yellow-500/5 border border-amber-500/30 hover:border-amber-400 flex items-center gap-3 text-left group transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-sm text-zinc-100 group-hover:text-amber-300">
              Claim Daily ELDRA
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">24h dragon faucet</p>
          </div>
        </button>

        {/* Quick Action 2: Referrals */}
        <button
          id="dash-action-referral"
          onClick={() => setActiveTab('referrals')}
          className="p-4.5 rounded-2xl bg-gradient-to-r from-yellow-500/15 to-amber-500/5 border border-yellow-500/30 hover:border-yellow-400 flex items-center gap-3 text-left group transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-yellow-500/20 text-yellow-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-sm text-zinc-100 group-hover:text-yellow-300">
              Invite Friends (+5)
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">5 ELDRA per signup</p>
          </div>
        </button>

        {/* Quick Action 3: Quizzes */}
        <button
          id="dash-action-quiz"
          onClick={() => setActiveTab('learn')}
          className="p-4.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 to-teal-500/5 border border-emerald-500/30 hover:border-emerald-400 flex items-center gap-3 text-left group transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-sm text-zinc-100 group-hover:text-emerald-300">
              Pass Quizzes (+20)
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">Web3 lessons & tests</p>
          </div>
        </button>

        {/* Quick Action 4: Withdraw */}
        <button
          id="dash-action-withdraw"
          onClick={() => setActiveTab('withdraw')}
          className="p-4.5 rounded-2xl bg-gradient-to-r from-amber-600/20 via-yellow-600/15 to-amber-700/20 border border-amber-400/40 hover:border-amber-300 flex items-center gap-3 text-left group transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/25 text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-sm text-amber-300 group-hover:text-amber-200">
              Request Withdrawal
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">24-hour Solana batches</p>
          </div>
        </button>
      </div>

      {/* Activity & Withdrawals Section */}
      <div className="rounded-3xl bg-[#101520] border border-zinc-800 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
          <div>
            <h3 className="font-cinzel text-xl font-bold text-zinc-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>Activity & Transaction History</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Transparent ledger of all your faucet claims, referral bonuses, quiz payouts, and 24-hour withdrawal requests.
            </p>
          </div>

          {/* Sub-Tabs: All Activity vs Withdrawal Payouts */}
          <div className="flex items-center gap-2 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveViewMode('all_activity')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeViewMode === 'all_activity'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Activity ({transactions.length})
            </button>
            <button
              onClick={() => setActiveViewMode('withdrawals')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeViewMode === 'withdrawals'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Withdrawals ({userWithdrawals.length})
            </button>
          </div>
        </div>

        {/* VIEW 1: All Activity */}
        {activeViewMode === 'all_activity' && (
          <div className="mt-5 space-y-4">
            {/* Filter Pills for Activity */}
            <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 w-fit">
              {(['all', 'daily_claim', 'referral_bonus', 'quiz'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTxFilter(filter)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    txFilter === filter
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {filter === 'all'
                    ? 'All'
                    : filter === 'daily_claim'
                    ? 'Daily'
                    : filter === 'referral_bonus'
                    ? 'Referral'
                    : 'Quiz'}
                </button>
              ))}
            </div>

            <div className="divide-y divide-zinc-800/60">
              {filteredTransactions.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 text-sm">
                  No transactions recorded yet. Claim daily tokens, share your referral code, or pass quizzes to get started!
                </div>
              ) : (
                filteredTransactions.map((tx) => {
                  const isQuiz = tx.type === 'quiz_reward' || tx.type === 'quiz_completion_bonus';
                  const isReferral = tx.type === 'referral_bonus';
                  const isClaim = tx.type === 'daily_claim';
                  const isWithdrawal = tx.type === 'withdrawal_request' || tx.type === 'withdrawal_approved';
                  const isRefund = tx.type === 'withdrawal_refund';

                  return (
                    <div
                      key={tx.id}
                      className="py-3.5 flex items-center justify-between gap-4 hover:bg-zinc-800/20 px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            isClaim
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : isReferral
                              ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                              : isWithdrawal
                              ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                              : isRefund
                              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isClaim ? (
                            <Coins className="w-4 h-4" />
                          ) : isReferral ? (
                            <Users className="w-4 h-4" />
                          ) : isWithdrawal ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : isRefund ? (
                            <Coins className="w-4 h-4" />
                          ) : (
                            <Award className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-zinc-200">
                            {tx.description}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500">
                            <span>{new Date(tx.timestamp).toLocaleString()}</span>
                            {tx.moduleTitle && (
                              <>
                                <span>&bull;</span>
                                <span className="text-zinc-400 truncate max-w-xs">{tx.moduleTitle}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-cinzel font-bold text-base sm:text-lg ${
                            tx.amount < 0 ? 'text-orange-400' : 'text-amber-300'
                          }`}
                        >
                          {tx.amount > 0 ? `+${tx.amount}` : tx.amount} ELDRA
                        </span>
                        <span
                          className={`block text-[11px] font-semibold ${
                            tx.status === 'completed'
                              ? 'text-emerald-400'
                              : tx.status === 'pending'
                              ? 'text-yellow-400'
                              : 'text-zinc-400'
                          }`}
                        >
                          {tx.status === 'completed'
                            ? 'Confirmed'
                            : tx.status === 'pending'
                            ? 'Pending 24h Review'
                            : tx.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: Dedicated Withdrawals & Payouts Table */}
        {activeViewMode === 'withdrawals' && (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-medium">
                Showing your submitted withdrawal requests and 24-hour batch payout statuses.
              </span>
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>New Withdrawal</span>
              </button>
            </div>

            {userWithdrawals.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-sm">
                No withdrawal requests submitted yet. When you request a withdrawal, it will appear here for 24-hour batch processing.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/60">
                {userWithdrawals.map((req) => {
                  const isPending = req.status === 'pending';
                  const isApproved = req.status === 'approved';
                  const isRejected = req.status === 'rejected';

                  return (
                    <div
                      key={req.id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-800/20 px-3 rounded-xl transition-colors"
                    >
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isPending
                              ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                              : isApproved
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/15 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {isPending ? (
                            <Clock className="w-5 h-5" />
                          ) : isApproved ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <XCircle className="w-5 h-5" />
                          )}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-zinc-200">
                              Withdrawal to {req.walletAddress.slice(0, 6)}...{req.walletAddress.slice(-6)}
                            </span>
                            {isPending && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">
                                In 24h Batch Review
                              </span>
                            )}
                            {isApproved && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                Approved & Paid
                              </span>
                            )}
                            {isRejected && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-300 border border-red-500/30">
                                Declined (Refunded)
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-zinc-400 font-mono">
                            <span>Batch: {req.batchDate || req.batchId}</span>
                            <span>&bull;</span>
                            <span>Requested: {new Date(req.requestedAt).toLocaleString()}</span>
                            {req.txHash && (
                              <>
                                <span>&bull;</span>
                                <span className="text-zinc-500">Ref: {req.txHash}</span>
                              </>
                            )}
                          </div>

                          {req.rejectionReason && (
                            <p className="text-xs text-red-300 mt-1">
                              Reason: {req.rejectionReason} (Coins refunded to balance)
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right sm:shrink-0">
                        <span className="font-cinzel font-extrabold text-lg text-amber-300 block">
                          -{req.amount} ELDRA
                        </span>
                        <span className="text-[11px] text-zinc-400 font-medium">
                          {isPending ? 'Pending Deduction' : isApproved ? 'Deducted & Paid' : 'Refunded to Balance'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Withdraw Modal */}
      <WithdrawModal
        currentUser={currentUser}
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
      />

      {/* Edit Username Modal */}
      {showUsernameModal && (
        <div
          id="edit-username-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            id="edit-username-modal"
            className="w-full max-w-md rounded-3xl bg-[#0f141d] border border-amber-500/40 p-6 sm:p-7 shadow-2xl shadow-black relative"
          >
            <button
              onClick={() => setShowUsernameModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                <AtSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-cinzel text-lg font-bold text-zinc-100">
                  Choose Your Unique Username
                </h3>
                <p className="text-xs text-zinc-400">
                  Visible on your dashboard, leaderboard, and referral channels.
                </p>
              </div>
            </div>

            {usernameFeedback && (
              <div
                className={`mb-4 p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  usernameFeedback.success
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/15 border-red-500/30 text-red-300'
                }`}
              >
                {usernameFeedback.success ? (
                  <Check className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{usernameFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSaveUsername} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    New Unique Username
                  </label>
                  {liveModalValidation && (
                    <span
                      className={`text-[11px] font-bold flex items-center gap-1 ${
                        liveModalValidation.valid ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {liveModalValidation.valid && <Check className="w-3 h-3" />}
                      {liveModalValidation.message}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <span className="text-amber-400 font-bold text-sm absolute left-3.5 top-1/2 -translate-y-1/2">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    value={newUsernameInput}
                    onChange={(e) =>
                      setNewUsernameInput(store.cleanUsername(e.target.value))
                    }
                    placeholder="satoshi_nakamoto"
                    className={`w-full pl-8 pr-4 py-3 rounded-xl bg-[#141b27] border text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none ${
                      liveModalValidation
                        ? liveModalValidation.valid
                          ? 'border-emerald-500/60 focus:border-emerald-400'
                          : 'border-amber-500/60 focus:border-amber-400'
                        : 'border-zinc-700 focus:border-amber-400'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-zinc-400 mt-1.5">
                  3–20 characters. Letters, numbers, and underscores allowed.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUsernameModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={liveModalValidation ? !liveModalValidation.valid : false}
                  className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  Save Username
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
