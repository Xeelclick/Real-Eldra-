import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { store } from '../services/store';
import { ELDRA_COIN_IMAGE } from '../assets/eldra_coin';
import confetti from 'canvas-confetti';
import {
  Flame,
  Clock,
  Sparkles,
  CheckCircle2,
  Coins,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

interface DailyClaimCardProps {
  currentUser: User | null;
  onOpenAuth: () => void;
}

export const DailyClaimCard: React.FC<DailyClaimCardProps> = ({
  currentUser,
  onOpenAuth,
}) => {
  const [cooldown, setCooldown] = useState<{
    canClaim: boolean;
    remainingMs: number;
    formattedCountdown: string;
  }>({
    canClaim: true,
    remainingMs: 0,
    formattedCountdown: 'Ready to Claim',
  });

  const [isClaiming, setIsClaiming] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);
  const [claimToast, setClaimToast] = useState<string | null>(null);
  const [showDragonFire, setShowDragonFire] = useState(false);

  // Update timer every second
  useEffect(() => {
    const updateTimer = () => {
      if (!currentUser) return;
      const status = store.getClaimCooldown(currentUser.id);
      setCooldown(status);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleClaim = () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!cooldown.canClaim) {
      setClaimToast(`Daily claim cooldown active! Next claim in ${cooldown.formattedCountdown}`);
      setTimeout(() => setClaimToast(null), 4000);
      return;
    }

    // Trigger Dragon Fire Blast animation (Zero sound / audio)
    setIsClaiming(true);
    setShowDragonFire(true);

    // Confetti effect with fiery dragon ember colors (red, gold, orange, crimson)
    confetti({
      particleCount: 110,
      spread: 85,
      origin: { y: 0.55 },
      colors: ['#ff4500', '#f59e0b', '#dc2626', '#fbbf24', '#ea580c', '#ffd700'],
      shapes: ['circle', 'square'],
      scalar: 1.15,
    });

    setTimeout(() => {
      const res = store.claimDailyToken();
      setIsClaiming(false);
      if (res.success) {
        setJustClaimed(true);
        setClaimToast(res.message);
        setTimeout(() => setJustClaimed(false), 5000);
      } else {
        setClaimToast(res.message);
      }
      setTimeout(() => setClaimToast(null), 5000);
      setTimeout(() => setShowDragonFire(false), 1800);
    }, 700);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#141b26] to-[#0d1117] border border-amber-500/30 p-6 sm:p-8 lg:p-10 shadow-2xl shadow-black/80">
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Proof-of-Flame Faucet
            </span>
            <span className="text-xs text-zinc-400 font-medium">Solana Network</span>
          </div>
          <h2 className="font-cinzel text-2xl sm:text-3xl font-bold text-zinc-100">
            Daily Eldra Coin Claim
          </h2>
          <p className="text-sm text-zinc-400 mt-1 max-w-xl">
            Tap the Eldra Dragon Coin once every 24 hours to claim <span className="text-amber-300 font-semibold">1 ELDRA token</span> directly into your balance.
          </p>
        </div>

        {/* Streak Pill */}
        {currentUser && (
          <div className="flex items-center gap-3 bg-zinc-900/90 border border-amber-500/20 rounded-2xl p-3 sm:px-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shadow-inner">
              <Flame className="w-6 h-6 fill-orange-400 animate-pulse" />
            </div>
            <div>
              <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-bold">
                Daily Streak
              </p>
              <p className="text-lg font-cinzel font-bold text-amber-300">
                {currentUser.claimStreak} {currentUser.claimStreak === 1 ? 'Day' : 'Days'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Interactive Coin Claim Section */}
      <div className="mt-8 sm:mt-10 flex flex-col items-center justify-center">
        {/* The Coin Button Designed with the Eldra coin image and Dragon Fire */}
        <div className="relative group cursor-pointer" onClick={handleClaim}>
          {/* Dragon Fire Aura behind the coin */}
          <div
            className={`absolute -inset-6 rounded-full transition-all duration-700 blur-2xl pointer-events-none ${
              showDragonFire
                ? 'bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 opacity-100 scale-125 animate-dragon-blast'
                : cooldown.canClaim
                ? 'bg-gradient-to-r from-red-500/40 via-amber-500/50 to-orange-600/40 animate-dragon-fire opacity-90'
                : 'bg-zinc-700/20 opacity-30'
            }`}
          />

          {/* Dragon Flame Tongues */}
          {cooldown.canClaim && (
            <>
              {/* Flame Tongue Top Left */}
              <div className="absolute -top-7 left-6 w-8 h-14 bg-gradient-to-t from-orange-600 via-amber-400 to-yellow-200 rounded-full blur-[2px] opacity-75 animate-flame-1 pointer-events-none" />
              {/* Flame Tongue Top Right */}
              <div className="absolute -top-8 right-8 w-9 h-16 bg-gradient-to-t from-red-600 via-orange-500 to-yellow-300 rounded-full blur-[2px] opacity-80 animate-flame-2 pointer-events-none" />
              {/* Flame Tongue Bottom */}
              <div className="absolute -bottom-6 left-1/3 w-10 h-10 bg-gradient-to-b from-amber-500 via-orange-600 to-transparent rounded-full blur-[3px] opacity-60 animate-flame-1 pointer-events-none" />
            </>
          )}

          {/* Dragon Fire Burst Flash on Claim */}
          {showDragonFire && (
            <div className="absolute -inset-10 rounded-full bg-gradient-to-tr from-red-600/40 via-orange-500/60 to-yellow-300/60 blur-xl animate-ping pointer-events-none" />
          )}

          {/* 3D Coin Button Container */}
          <button
            id="eldra-daily-coin-button"
            disabled={isClaiming || (!cooldown.canClaim && !!currentUser)}
            className={`relative w-48 h-48 sm:w-56 sm:h-56 rounded-full p-2.5 transition-all duration-500 select-none ${
              cooldown.canClaim
                ? 'cursor-pointer hover:scale-105 active:scale-95 shadow-[0_0_60px_rgba(239,68,68,0.35),0_0_30px_rgba(245,158,11,0.5)]'
                : 'cursor-not-allowed grayscale-[40%] opacity-85 shadow-lg'
            } ${isClaiming ? 'scale-95 rotate-12 transition-transform duration-500' : ''}`}
            style={{
              background: cooldown.canClaim
                ? 'radial-gradient(circle, #f59e0b 0%, #ea580c 50%, #7f1d1d 100%)'
                : 'radial-gradient(circle, #52525b 0%, #27272a 100%)',
            }}
          >
            {/* Outer embossed bezel */}
            <div className="w-full h-full rounded-full p-1.5 bg-gradient-to-tr from-red-900 via-amber-300 to-orange-800 shadow-inner flex items-center justify-center">
              {/* Inner coin image */}
              <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-amber-400/70 shadow-2xl">
                <img
                  src={ELDRA_COIN_IMAGE}
                  alt="Eldra Dragon Coin"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = '/eldra_coin.jpg';
                  }}
                  className={`w-full h-full object-cover rounded-full transition-transform duration-500 ${
                    cooldown.canClaim ? 'group-hover:scale-105' : ''
                  } ${showDragonFire ? 'brightness-125 contrast-125' : ''}`}
                />

                {/* Shimmer light sweep on hover */}
                {cooldown.canClaim && (
                  <div className="absolute inset-0 shimmer-effect opacity-60 group-hover:opacity-100 transition-opacity" />
                )}

                {/* Overlay status if cooldown active */}
                {!cooldown.canClaim && currentUser && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-3 text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-1" />
                    <span className="text-xs uppercase tracking-wider font-bold text-zinc-300">
                      Claimed for Today
                    </span>
                    <span className="text-sm font-cinzel font-bold text-amber-300 mt-0.5">
                      +1 ELDRA
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Tap Badge Tag with Dragon Fire */}
            {cooldown.canClaim && (
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 text-black font-extrabold text-xs tracking-wider uppercase shadow-xl flex items-center gap-1.5 animate-bounce whitespace-nowrap border border-yellow-300/60">
                <Flame className="w-3.5 h-3.5 fill-black text-black" />
                <span>IGNITE DRAGON FIRE & CLAIM</span>
              </div>
            )}
          </button>
        </div>

        {/* Claim Action Status / Timer */}
        <div className="mt-8 text-center max-w-md w-full">
          {cooldown.canClaim ? (
            <div className="space-y-3">
              <button
                id="claim-cta-button"
                onClick={handleClaim}
                disabled={isClaiming}
                className="w-full max-w-xs mx-auto py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-400 to-red-600 hover:from-orange-500 hover:to-amber-300 text-black font-extrabold text-base tracking-wide shadow-xl shadow-orange-500/25 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-yellow-400/40"
              >
                <Flame className="w-5 h-5 fill-black text-black" />
                <span>{isClaiming ? 'Dragon Fire Ignited...' : 'Claim 1 ELDRA Token'}</span>
              </button>
              <p className="text-xs text-zinc-400 font-medium">
                Proof-of-Flame Daily Reward &bull; Instant Balance Credit
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-center gap-2 text-zinc-400 text-xs">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Next daily claim unlocks in:</span>
              </div>
              <div className="font-mono text-2xl font-bold text-amber-300 tracking-wider">
                {cooldown.formattedCountdown}
              </div>
              <p className="text-xs text-zinc-500">
                You have collected your 1 ELDRA reward for today. Return when the 24-hour timer resets.
              </p>
            </div>
          )}

          {/* Toast alert */}
          {claimToast && (
            <div
              id="claim-toast"
              className="mt-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs sm:text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-200"
            >
              {claimToast}
            </div>
          )}
        </div>
      </div>

      {/* 3 Step Earning Breakdown */}
      <div className="mt-10 pt-8 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
        <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2.5">
            <Coins className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-zinc-100 font-cinzel">1. Daily Faucet</h4>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Click the Eldra Coin every 24 hours to earn <strong className="text-amber-300">1 ELDRA</strong> consistently.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80">
          <div className="w-8 h-8 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center mb-2.5">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-zinc-100 font-cinzel">2. Invite Friends</h4>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Share your referral link. Earn <strong className="text-amber-300">5 ELDRA</strong> for each friend that joins.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-zinc-100 font-cinzel">3. Learn & Quiz</h4>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Earn <strong className="text-amber-300">2 ELDRA</strong> per question + <strong className="text-amber-300">20 ELDRA</strong> quiz pass jackpot.
          </p>
        </div>
      </div>
    </div>
  );
};
