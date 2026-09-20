import React from 'react';
import { LeaderboardEntry, User } from '../types';
import { store } from '../services/store';
import {
  Award,
  Crown,
  Medal,
  Users,
  Coins,
  TrendingUp,
  Sparkles,
  Flame,
  ShieldCheck,
} from 'lucide-react';

interface LeaderboardProps {
  currentUser: User | null;
  setActiveTab: (tab: string) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  currentUser,
  setActiveTab,
}) => {
  const leaderboard = store.getLeaderboard();
  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  const currentUserRank = leaderboard.find((entry) => entry.userId === currentUser?.id);

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

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#171e2c] via-[#121824] to-[#0c1017] border border-amber-500/30 p-6 sm:p-8 lg:p-10 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold mb-2.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Top Eldra Community Referrers &bull; Solana</span>
            </div>
            <h1 className="font-cinzel text-2xl sm:text-3xl lg:text-4xl font-extrabold text-zinc-100">
              Referral Leaderboard
            </h1>
            <p className="text-zinc-400 text-sm mt-1.5 max-w-xl leading-relaxed">
              Top referrers on the Eldra network. Every confirmed friend you refer grants <span className="text-amber-300 font-semibold">5 ELDRA tokens</span> with zero reward ceiling.
            </p>
          </div>

          {/* Current User's Standings if logged in */}
          {currentUserRank && (
            <div className="bg-zinc-900/90 border border-amber-500/30 rounded-2xl p-4 sm:px-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-cinzel text-xl font-extrabold">
                #{currentUserRank.rank}
              </div>
              <div>
                <p className="text-[11px] uppercase font-bold text-zinc-400">Your Current Rank</p>
                <p className="text-sm font-bold text-zinc-100">{currentUserRank.referralCount} Referrals</p>
                <p className="text-xs font-cinzel font-bold text-amber-300">+{currentUserRank.totalReferralEldra} ELDRA Earned</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
        {/* 2nd Place (Left) */}
        {top2 && (
          <div className="order-2 md:order-1 rounded-3xl bg-[#111722] border border-zinc-700/80 p-6 flex flex-col items-center text-center relative overflow-hidden shadow-xl">
            <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-900 font-extrabold text-sm flex items-center justify-center mb-3 shadow-md">
              2
            </div>
            <div className="relative mb-3">
              <div className="w-18 h-18 rounded-2xl bg-zinc-800 border-2 border-slate-400 flex items-center justify-center font-cinzel font-bold text-xl text-slate-200 shadow-xl">
                {getInitials(top2.displayName, top2.email)}
              </div>
              <Medal className="w-6 h-6 text-slate-300 absolute -bottom-2 -right-2 fill-slate-400" />
            </div>
            <h3 className="font-cinzel text-base font-bold text-zinc-100 truncate max-w-full">
              {top2.displayName}
            </h3>
            <p className="text-xs text-amber-400/90 font-mono font-bold mt-0.5">@{top2.username || 'member'}</p>
            <p className="text-[11px] text-zinc-400 font-mono truncate">{top2.email}</p>

            <div className="mt-4 w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 flex justify-around">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Referrals</span>
                <span className="font-bold text-zinc-200 text-base">{top2.referralCount}</span>
              </div>
              <div className="border-l border-zinc-800 pl-4">
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Reward</span>
                <span className="font-cinzel font-bold text-amber-300 text-base">+{top2.totalReferralEldra} ELDRA</span>
              </div>
            </div>
          </div>
        )}

        {/* 1st Place (Center - Prominent Gold) */}
        {top1 && (
          <div className="order-1 md:order-2 rounded-3xl bg-gradient-to-b from-[#1c2433] via-[#141a26] to-[#0e131d] border-2 border-amber-500/60 p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden shadow-2xl shadow-amber-500/20 md:-translate-y-3">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-black font-extrabold text-base flex items-center justify-center mb-3 shadow-lg shadow-amber-500/40">
              <Crown className="w-6 h-6 fill-black" />
            </div>
            <div className="relative mb-3">
              <div className="w-22 h-22 rounded-2xl bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 border-2 border-amber-300 flex items-center justify-center font-cinzel font-extrabold text-2xl text-black shadow-2xl">
                {getInitials(top1.displayName, top1.email)}
              </div>
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-amber-500 text-black font-extrabold text-[10px] uppercase tracking-wider">
                #1 Top Referrer
              </span>
            </div>
            <h3 className="font-cinzel text-lg font-extrabold text-amber-300 mt-1 truncate max-w-full">
              {top1.displayName}
            </h3>
            <p className="text-xs text-yellow-300 font-mono font-bold mt-0.5">@{top1.username || 'member'}</p>
            <p className="text-[11px] text-zinc-400 font-mono truncate">{top1.email}</p>

            <div className="mt-4 w-full bg-zinc-900/90 border border-amber-500/30 rounded-2xl p-3.5 flex justify-around">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Referrals</span>
                <span className="font-bold text-zinc-100 text-lg">{top1.referralCount}</span>
              </div>
              <div className="border-l border-zinc-800 pl-4">
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Commission</span>
                <span className="font-cinzel font-extrabold text-amber-300 text-lg">+{top1.totalReferralEldra} ELDRA</span>
              </div>
            </div>
          </div>
        )}

        {/* 3rd Place (Right) */}
        {top3 && (
          <div className="order-3 md:order-3 rounded-3xl bg-[#111722] border border-amber-900/60 p-6 flex flex-col items-center text-center relative overflow-hidden shadow-xl">
            <div className="w-8 h-8 rounded-full bg-amber-800 text-amber-200 font-extrabold text-sm flex items-center justify-center mb-3 shadow-md">
              3
            </div>
            <div className="relative mb-3">
              <div className="w-18 h-18 rounded-2xl bg-zinc-800 border-2 border-amber-700 flex items-center justify-center font-cinzel font-bold text-xl text-amber-400 shadow-xl">
                {getInitials(top3.displayName, top3.email)}
              </div>
              <Medal className="w-6 h-6 text-amber-600 absolute -bottom-2 -right-2 fill-amber-700" />
            </div>
            <h3 className="font-cinzel text-base font-bold text-zinc-100 truncate max-w-full">
              {top3.displayName}
            </h3>
            <p className="text-xs text-amber-400/90 font-mono font-bold mt-0.5">@{top3.username || 'member'}</p>
            <p className="text-[11px] text-zinc-400 font-mono truncate">{top3.email}</p>

            <div className="mt-4 w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 flex justify-around">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Referrals</span>
                <span className="font-bold text-zinc-200 text-base">{top3.referralCount}</span>
              </div>
              <div className="border-l border-zinc-800 pl-4">
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Reward</span>
                <span className="font-cinzel font-bold text-amber-300 text-base">+{top3.totalReferralEldra} ELDRA</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Full Leaderboard Table */}
      <div className="rounded-3xl bg-[#101520] border border-zinc-800 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div>
            <h3 className="font-cinzel text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              Complete Rankings ({leaderboard.length} Members)
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Ranked in real-time by confirmed referrals (5 ELDRA per referral) and total balance.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('referrals')}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 transition-colors cursor-pointer"
          >
            + Invite Friends to Climb
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-zinc-800/80 text-zinc-400 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-16 text-center">Rank</th>
                <th className="py-3 px-3">User</th>
                <th className="py-3 px-3 text-center">Referrals</th>
                <th className="py-3 px-3">5 ELDRA Commissions</th>
                <th className="py-3 px-3 text-right">Total Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    <p className="text-sm font-semibold text-zinc-400">No member referrals registered yet.</p>
                    <p className="text-xs text-zinc-500 mt-1">Be the first to share your referral link and secure the #1 top spot!</p>
                  </td>
                </tr>
              ) : (
                leaderboard.map((entry) => {
                const isCurrent = currentUser?.id === entry.userId;
                return (
                  <tr
                    key={entry.userId}
                    className={`transition-colors ${
                      isCurrent
                        ? 'bg-amber-500/10 border-l-2 border-amber-500 font-semibold'
                        : 'hover:bg-zinc-800/30'
                    }`}
                  >
                    <td className="py-3.5 px-3 text-center">
                      {entry.rank === 1 ? (
                        <span className="w-7 h-7 rounded-full bg-amber-400/20 text-amber-300 font-bold flex items-center justify-center mx-auto border border-amber-400/40">
                          🥇
                        </span>
                      ) : entry.rank === 2 ? (
                        <span className="w-7 h-7 rounded-full bg-slate-300/20 text-slate-300 font-bold flex items-center justify-center mx-auto border border-slate-400/40">
                          🥈
                        </span>
                      ) : entry.rank === 3 ? (
                        <span className="w-7 h-7 rounded-full bg-amber-800/20 text-amber-500 font-bold flex items-center justify-center mx-auto border border-amber-700/40">
                          🥉
                        </span>
                      ) : (
                        <span className="font-mono text-zinc-400 font-bold">#{entry.rank}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-amber-400">
                          {getInitials(entry.displayName, entry.email)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-zinc-100">{entry.displayName}</span>
                            <span className="text-xs text-amber-400/90 font-mono font-bold">
                              @{entry.username || 'member'}
                            </span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500 text-black font-bold uppercase">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-zinc-400 font-mono">{entry.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center font-bold text-zinc-200">
                      {entry.referralCount}
                    </td>

                    <td className="py-3.5 px-3 font-cinzel font-bold text-amber-300">
                      +{entry.totalReferralEldra} ELDRA
                    </td>

                    <td className="py-3.5 px-3 text-right font-cinzel font-bold text-zinc-200">
                      {entry.totalBalance.toLocaleString()} ELDRA
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
