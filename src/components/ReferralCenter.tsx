import React, { useState } from 'react';
import { User } from '../types';
import { store } from '../services/store';
import {
  Users,
  Copy,
  Check,
  Share2,
  Gift,
  Coins,
  Send,
  MessageSquare,
  Twitter,
  Mail,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

interface ReferralCenterProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  setActiveTab: (tab: string) => void;
}

export const ReferralCenter: React.FC<ReferralCenterProps> = ({
  currentUser,
  onOpenAuth,
  setActiveTab,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const referrals = currentUser ? store.getReferrals(currentUser.id) : [];
  const referralCode = currentUser?.referralCode || 'ELDRA-XXXXX';
  const referralUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?ref=${referralCode}`
    : `https://eldra.io/?ref=${referralCode}`;

  const totalReferralEarnings = currentUser?.referralBalance || referrals.length * 5;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(
      `Join me on Eldra Coin ($ELDRA) on Solana! Claim free daily tokens, pass quizzes to earn 20 ELDRA, and join the community! 🔥🪙 Sign up with my link:\n${referralUrl}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(
      `Join me on Eldra Coin ($ELDRA) on Solana! Claim 1 token every day, take crypto educational quizzes, and earn rewards! ${referralUrl}`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${text}`, '_blank');
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Hey! Check out Eldra Coin ($ELDRA) on Solana. Claim free tokens daily and take educational quizzes to earn 20 ELDRA. Use my referral link: ${referralUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent('Join Eldra Coin on Solana - Daily Token Rewards & Quizzes');
    const body = encodeURIComponent(
      `Hi there,\n\nI'd like to invite you to join Eldra Coin ($ELDRA) on the Solana Network. You can claim 1 free ELDRA token every day, learn crypto through interactive quizzes, and earn rewards!\n\nSign up with my link to get a starter bonus:\n${referralUrl}\n\nReferral Code: ${referralCode}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="space-y-8">
      {/* Referral Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#161c28] via-[#111722] to-[#0d1017] border border-amber-500/30 p-6 sm:p-8 lg:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-300 border border-yellow-500/30 text-xs font-bold mb-3">
              <Gift className="w-3.5 h-3.5 text-yellow-400" />
              <span>5 ELDRA Per Successful Referral &bull; Solana</span>
            </div>
            <h1 className="font-cinzel text-2xl sm:text-4xl font-extrabold text-zinc-100 leading-tight">
              Eldra Referral Program
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base mt-2 leading-relaxed">
              Grow the Eldra ecosystem together. Share your personal invite link and receive <span className="text-amber-300 font-bold">5 ELDRA coins</span> directly into your balance for every companion that registers with their Gmail or Email.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex flex-row lg:flex-col gap-4 bg-zinc-900/90 border border-amber-500/20 p-5 rounded-2xl">
            <div>
              <p className="text-xs uppercase font-bold text-zinc-400">Total Referrals</p>
              <p className="font-cinzel text-2xl sm:text-3xl font-extrabold text-zinc-100 mt-0.5">
                {referrals.length} <span className="text-xs font-sans text-zinc-400 font-normal">invited</span>
              </p>
            </div>
            <div className="border-t border-zinc-800 lg:pt-3">
              <p className="text-xs uppercase font-bold text-zinc-400">Referral Commissions</p>
              <p className="font-cinzel text-2xl sm:text-3xl font-extrabold text-amber-300 mt-0.5">
                +{totalReferralEarnings} <span className="text-xs font-sans text-amber-400/80 font-normal">ELDRA</span>
              </p>
            </div>
          </div>
        </div>

        {/* Share & Copy Bar */}
        {currentUser ? (
          <div className="mt-8 pt-6 border-t border-zinc-800/80 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Referral Link Box */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  Your Unique Referral Link
                </label>
                <div className="flex items-center gap-2 bg-[#090c12] border border-amber-500/30 rounded-xl p-2 pl-3.5 focus-within:border-amber-400">
                  <span className="text-xs text-amber-200/90 font-mono truncate select-all flex-1">
                    {referralUrl}
                  </span>
                  <button
                    id="copy-referral-link-btn"
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Referral Code Box */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  Referral Code
                </label>
                <div className="flex items-center gap-2 bg-[#090c12] border border-amber-500/30 rounded-xl p-2 pl-3.5 focus-within:border-amber-400">
                  <span className="text-sm text-amber-300 font-mono font-bold tracking-wider truncate select-all flex-1">
                    {referralCode}
                  </span>
                  <button
                    id="copy-referral-code-btn"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <span className="text-xs text-zinc-400 font-medium mr-1 flex items-center gap-1">
                <Share2 className="w-3.5 h-3.5 text-amber-400" /> Share via:
              </span>

              <button
                onClick={handleShareTwitter}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-sky-400/60 text-zinc-200 text-xs font-semibold hover:text-sky-400 transition-colors cursor-pointer"
              >
                <Twitter className="w-3.5 h-3.5" />
                <span>X / Twitter</span>
              </button>

              <button
                onClick={handleShareTelegram}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-blue-400/60 text-zinc-200 text-xs font-semibold hover:text-blue-400 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Telegram</span>
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-emerald-400/60 text-zinc-200 text-xs font-semibold hover:text-emerald-400 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={handleShareEmail}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-amber-400/60 text-zinc-200 text-xs font-semibold hover:text-amber-400 transition-colors cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </button>

              <button
                onClick={() => setActiveTab('leaderboard')}
                className="ml-auto flex items-center gap-1 text-xs font-bold text-amber-300 hover:text-amber-200 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30 transition-colors cursor-pointer"
              >
                <span>View Top Referrers Leaderboard</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 pt-6 border-t border-zinc-800 flex items-center justify-between">
            <p className="text-xs text-zinc-400">Sign in to generate your unique 5 ELDRA referral link.</p>
            <button
              onClick={onOpenAuth}
              className="px-5 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors cursor-pointer"
            >
              Sign In to Get Referral Link
            </button>
          </div>
        )}
      </div>

      {/* Referrals List Table */}
      <div className="rounded-3xl bg-[#101520] border border-zinc-800 p-6 sm:p-8">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <h3 className="font-cinzel text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            Your Invited Companions ({referrals.length})
          </h3>
          <span className="text-xs text-zinc-400 font-medium">5 ELDRA Credited per user</span>
        </div>

        <div className="mt-4 overflow-x-auto">
          {referrals.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-sm">
              <Users className="w-8 h-8 mx-auto text-zinc-600 mb-2 opacity-50" />
              No referrals registered yet. Share your code <span className="text-amber-300 font-mono font-bold">{referralCode}</span> with friends to earn 5 ELDRA per companion!
            </div>
          ) : (
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-zinc-800/80 text-zinc-400 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Companions</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Join Date</th>
                  <th className="py-3 px-3">Commission</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {referrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3.5 px-3 font-medium text-zinc-200 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[11px] font-bold text-amber-300">
                        {ref.referredName.charAt(0).toUpperCase()}
                      </div>
                      <span>{ref.referredName}</span>
                    </td>
                    <td className="py-3.5 px-3 text-zinc-400 font-mono text-xs">{ref.referredEmail}</td>
                    <td className="py-3.5 px-3 text-zinc-500 text-xs">
                      {new Date(ref.timestamp).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-3 font-cinzel font-bold text-amber-300">
                      +{ref.rewardAmount} ELDRA
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <Check className="w-3 h-3" /> Paid
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
