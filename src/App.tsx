/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { store } from './services/store';
import { User } from './types';
import { ELDRA_COIN_IMAGE } from './assets/eldra_coin';
import { Navbar } from './components/Navbar';
import { DailyClaimCard } from './components/DailyClaimCard';
import { Dashboard } from './components/Dashboard';
import { ReferralCenter } from './components/ReferralCenter';
import { Leaderboard } from './components/Leaderboard';
import { EducationalHub } from './components/EducationalHub';
import { AdminPortal } from './components/AdminPortal';
import { AuthScreen } from './components/AuthScreen';
import { BlockedScreen } from './components/BlockedScreen';
import { WithdrawalPage } from './components/WithdrawalPage';
import { WithdrawalProcessingPage } from './components/WithdrawalProcessingPage';
import {
  Coins,
  ShieldCheck,
  Flame,
  Sparkles,
  Users,
  Award,
  BookOpen,
  ArrowUpRight,
  ExternalLink,
  Globe,
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(store.getCurrentUser());
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [adminSection, setAdminSection] = useState<'withdrawals' | 'security' | 'claims' | 'quizzes'>('withdrawals');
  const [blockedState, setBlockedState] = useState(store.isCurrentDeviceBlocked());

  const navigateToAdmin = (section: 'withdrawals' | 'security' | 'claims' | 'quizzes' = 'withdrawals') => {
    setAdminSection(section);
    setActiveTab('admin');
  };

  // Subscribe to store updates
  useEffect(() => {
    const unsubscribeStore = store.subscribe(() => {
      const user = store.getCurrentUser();
      setCurrentUser(user);
      setBlockedState(store.isCurrentDeviceBlocked());
    });

    return () => {
      unsubscribeStore();
    };
  }, []);

  // If this device is blocked due to multi-accounting, show the BlockedScreen
  if (blockedState.blocked) {
    return (
      <BlockedScreen
        blockedInfo={blockedState.info}
        onUnblocked={() => setBlockedState(store.isCurrentDeviceBlocked())}
      />
    );
  }

  // If user is not authenticated, gate the entire app behind the AuthScreen
  if (!currentUser) {
    return (
      <AuthScreen
        onSuccess={(isAdminOrUser) => {
          const user = store.getCurrentUser();
          setCurrentUser(user);
          const isAdmin =
            typeof isAdminOrUser === 'boolean'
              ? isAdminOrUser
              : user?.role === 'admin' || (isAdminOrUser as any)?.role === 'admin';
          if (isAdmin) {
            setActiveTab('admin');
          } else {
            setActiveTab('dashboard');
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#090b10] text-[#e2e8f0]">
      {/* Top Header Navbar */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => {}}
        onNavigateAdmin={navigateToAdmin}
      />

      {/* Super Admin Quick Access Ribbon (Visible strictly to Admin) */}
      {currentUser.role === 'admin' && activeTab !== 'admin' && (
        <div className="bg-gradient-to-r from-amber-950/90 via-[#181f2c] to-amber-950/90 border-b border-amber-500/40 py-2.5 px-4 text-center sticky top-20 z-30 shadow-lg">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-semibold">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Super Admin Mode &bull; Logged in as <strong className="text-white">{currentUser.email}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                id="quick-admin-post-quiz-btn"
                onClick={() => navigateToAdmin('quizzes')}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 text-black font-extrabold text-xs shadow-md shadow-amber-500/25 hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>➕ Post Quiz & Learning Link</span>
              </button>

              <button
                id="quick-admin-portal-btn"
                onClick={() => navigateToAdmin('withdrawals')}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                <span>24H Batch Payouts</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 overflow-hidden">
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <Dashboard
              currentUser={currentUser}
              setActiveTab={setActiveTab}
              onOpenAuth={() => {}}
            />
            {/* Quick Faucet Teaser in Dashboard */}
            <div className="pt-2">
              <DailyClaimCard
                currentUser={currentUser}
                onOpenAuth={() => {}}
              />
            </div>
          </div>
        )}

        {activeTab === 'claim' && (
          <div className="animate-in fade-in duration-300">
            <DailyClaimCard
              currentUser={currentUser}
              onOpenAuth={() => {}}
            />
          </div>
        )}

        {activeTab === 'learn' && (
          <div className="animate-in fade-in duration-300">
            <EducationalHub
              currentUser={currentUser}
              onOpenAuth={() => {}}
              setActiveTab={setActiveTab}
              onNavigateAdmin={navigateToAdmin}
            />
          </div>
        )}

        {activeTab === 'referrals' && (
          <div className="animate-in fade-in duration-300">
            <ReferralCenter
              currentUser={currentUser}
              onOpenAuth={() => {}}
              setActiveTab={setActiveTab}
            />
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="animate-in fade-in duration-300">
            <Leaderboard
              currentUser={currentUser}
              setActiveTab={setActiveTab}
            />
          </div>
        )}

        {(activeTab === 'withdraw' || activeTab === 'withdrawal-processing') && (
          <div className="animate-in fade-in duration-300">
            <WithdrawalProcessingPage
              currentUser={currentUser}
              setActiveTab={setActiveTab}
            />
          </div>
        )}

        {activeTab === 'admin' && currentUser?.role === 'admin' && (
          <div className="animate-in fade-in duration-300">
            <AdminPortal
              currentUser={currentUser}
              setActiveTab={setActiveTab}
              adminSection={adminSection}
              setAdminSection={setAdminSection}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-800/80 bg-[#07090d] py-8 px-4 sm:px-6 lg:px-8 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src={ELDRA_COIN_IMAGE}
              alt="Eldra Coin"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src = '/eldra_coin.jpg';
              }}
              className="w-8 h-8 rounded-full object-cover border border-amber-500/40"
            />
            <div>
              <p className="font-cinzel font-bold text-sm text-zinc-300 flex items-center gap-2">
                <span>Eldra Coin ($ELDRA)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-amber-300/90 border border-zinc-700">
                  2026
                </span>
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                &copy; 2026 Eldra Coin. Built on Solana Network &bull; All rights reserved.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-zinc-400 font-medium">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="hover:text-amber-300 transition-colors cursor-pointer"
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('claim')}
              className="hover:text-amber-300 transition-colors cursor-pointer"
            >
              Daily Claim (1 ELDRA)
            </button>
            <button
              onClick={() => setActiveTab('referrals')}
              className="hover:text-amber-300 transition-colors cursor-pointer"
            >
              Referral Program (5 ELDRA)
            </button>
            <button
              onClick={() => setActiveTab('learn')}
              className="hover:text-amber-300 transition-colors cursor-pointer"
            >
              Academy & Quizzes (20 ELDRA)
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className="hover:text-amber-300 transition-colors cursor-pointer"
            >
              Leaderboard
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-amber-500/30 text-[11px] text-amber-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Solana Mainnet Ready &bull; 2026</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
