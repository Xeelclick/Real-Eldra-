import React from 'react';
import { store } from '../services/store';
import { BlockedDeviceInfo } from '../types';
import {
  ShieldAlert,
  AlertTriangle,
  Lock,
  Info,
} from 'lucide-react';
import { ELDRA_COIN_IMAGE } from '../assets/eldra_coin';

interface BlockedScreenProps {
  blockedInfo?: BlockedDeviceInfo;
  onUnblocked?: () => void;
}

export const BlockedScreen: React.FC<BlockedScreenProps> = ({
  blockedInfo,
}) => {
  const deviceId = blockedInfo?.deviceId || store.getDeviceId();
  const blockedDate = blockedInfo?.blockedAt
    ? new Date(blockedInfo.blockedAt).toLocaleString()
    : new Date().toLocaleString();

  return (
    <div className="min-h-screen bg-[#07090e] text-[#e2e8f0] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-2xl w-full mx-auto relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Branding Card */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-bold uppercase tracking-wider mb-4 shadow-lg shadow-red-950/50">
            <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
            <span>Anti-Sybil Security Enforcement</span>
          </div>

          <div className="flex items-center justify-center gap-3 mb-2">
            <img
              src={ELDRA_COIN_IMAGE}
              alt="Eldra Coin"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src = '/eldra_coin.jpg';
              }}
              className="w-10 h-10 rounded-full object-cover border border-amber-500/40 shadow-md shadow-amber-500/20"
            />
            <h1 className="font-cinzel text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
              Access Restricted
            </h1>
          </div>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            This device has been automatically blocked from accessing Eldra Coin services due to a policy violation.
          </p>
        </div>

        {/* Main Violation Card */}
        <div className="bg-[#0f141f] border border-red-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black relative overflow-hidden mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0 text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-red-200 mb-1">
                Violation: Multiple Account Creation Detected
              </h2>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Our automated integrity monitor detected an attempt to create more than one account on this physical device. To maintain trust, fairness, and reward transparency for all holders, each device is strictly restricted to a single account.
              </p>
            </div>
          </div>

          {/* Audit Details */}
          <div className="bg-black/60 rounded-2xl p-4 border border-zinc-800 space-y-2.5 font-mono text-xs mb-6">
            <div className="flex justify-between items-center text-zinc-400 border-b border-zinc-800/80 pb-2">
              <span>Restriction Reason:</span>
              <span className="text-red-400 font-semibold font-sans text-right max-w-[260px] truncate">
                1-Account-Per-Device Violation
              </span>
            </div>
            <div className="flex justify-between items-center text-zinc-400 border-b border-zinc-800/80 pb-2">
              <span>Device Identifier:</span>
              <span className="text-amber-300 font-bold truncate max-w-[200px]" title={deviceId}>
                {deviceId}
              </span>
            </div>
            {blockedInfo?.registeredEmail && (
              <div className="flex justify-between items-center text-zinc-400 border-b border-zinc-800/80 pb-2">
                <span>Existing Registered Email:</span>
                <span className="text-zinc-200">{blockedInfo.registeredEmail}</span>
              </div>
            )}
            {blockedInfo?.attemptedEmail && (
              <div className="flex justify-between items-center text-zinc-400 border-b border-zinc-800/80 pb-2">
                <span>Attempted New Email:</span>
                <span className="text-red-300 font-bold">{blockedInfo.attemptedEmail}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-zinc-400">
              <span>Timestamp:</span>
              <span className="text-zinc-300">{blockedDate}</span>
            </div>
          </div>

          {/* Transparency & Policy Info */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs space-y-2 text-zinc-300 mb-6">
            <h3 className="font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Info className="w-4 h-4 text-amber-400" />
              <span>Transparency & Community Trust Statement</span>
            </h3>
            <p className="text-zinc-300 leading-relaxed">
              Eldra Coin rewards genuine community members through daily claims, quizzes, and referral bonuses distributed in real Solana transactions. Preventing bot nets, multi-accounting, and sybil farming ensures every token remains valuable and genuinely distributed.
            </p>
          </div>

          {/* Strict Ban Notice */}
          <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-4 text-xs space-y-2 text-red-200 mb-6">
            <h3 className="font-bold text-red-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <Lock className="w-4 h-4 text-red-400" />
              <span>Permanent Device & Account Restriction</span>
            </h3>
            <p className="text-zinc-300 leading-relaxed">
              This device and any associated accounts have been permanently restricted from accessing the platform. Users cannot bypass this restriction.
            </p>
          </div>
        </div>

        {/* Footer Support Info */}
        <div className="text-center text-xs text-zinc-500">
          <p>
            If you believe this restriction was made in error, please contact community administrators with your Device ID.
          </p>
        </div>
      </div>
    </div>
  );
};
