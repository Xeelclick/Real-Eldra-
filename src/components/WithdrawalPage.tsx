import React, { useState } from 'react';
import { User, WithdrawalRequest } from '../types';
import { store } from '../services/store';
import { ELDRA_COIN_IMAGE } from '../assets/eldra_coin';
import {
  ArrowUpRight,
  Wallet,
  Coins,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Flame,
  ArrowRight,
  Copy,
  Check,
  ClipboardPaste,
  HelpCircle,
  ExternalLink,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface WithdrawalPageProps {
  currentUser: User;
  setActiveTab: (tab: string) => void;
}

export const WithdrawalPage: React.FC<WithdrawalPageProps> = ({
  currentUser,
  setActiveTab,
}) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [pastedFeedback, setPastedFeedback] = useState(false);
  const [cycleCountdown, setCycleCountdown] = useState<string>(store.get24HourCycleTimeRemaining().formatted);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCycleCountdown(store.get24HourCycleTimeRemaining().formatted);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const availableBalance = currentUser.balance;
  const pendingWithdrawalSum = currentUser.pendingWithdrawalBalance || 0;
  const totalWithdrawnSum = currentUser.withdrawnBalance || 0;
  const userWithdrawals = store.getUserWithdrawals(currentUser.id);
  const numAmount = parseFloat(amount) || 0;

  const handleMaxClick = () => {
    setAmount(availableBalance.toString());
    setErrorMsg(null);
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
    setErrorMsg(null);
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim().length > 0) {
          setWalletAddress(text.trim());
          setPastedFeedback(true);
          setTimeout(() => setPastedFeedback(false), 2000);
        }
      }
    } catch {
      // Browser permission might prevent clipboard read, user can paste normally
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanWallet = walletAddress.trim();
    if (!cleanWallet || cleanWallet.length < 24) {
      setErrorMsg('Please paste your Address (valid Solana wallet address of at least 24 characters).');
      return;
    }

    if (numAmount < 50) {
      setErrorMsg('Minimum withdrawal amount is 50 ELDRA tokens.');
      return;
    }

    if (numAmount > availableBalance) {
      setErrorMsg(`Insufficient balance. You currently have ${availableBalance} ELDRA available.`);
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const res = store.requestWithdrawal(currentUser.id, cleanWallet, numAmount);
      setIsSubmitting(false);

      if (res.success) {
        setSuccessMsg(res.message);
        setAmount('50');
      } else {
        setErrorMsg(res.message);
      }
    }, 400);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#161c28] via-[#101520] to-[#0c1017] border border-amber-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-1 bg-gradient-to-tr from-amber-600 via-amber-300 to-yellow-600 shadow-xl shadow-amber-500/20 shrink-0">
              <img
                src={ELDRA_COIN_IMAGE}
                alt="Eldra Coin"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = '/eldra_coin.jpg';
                }}
                className="w-full h-full rounded-2xl object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-cinzel text-2xl sm:text-3xl font-extrabold text-zinc-100">
                  Withdrawal Center
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Solana SPL
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl leading-relaxed">
                Request your earned ELDRA tokens for batch payout directly to your personal Solana wallet address. All requests are compiled into 24-hour cycles.
              </p>
            </div>
          </div>

          {/* Balance Breakdown Pills */}
          <div className="bg-[#0b0e14]/90 border border-amber-500/30 rounded-2xl p-5 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 shadow-inner">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-zinc-400 block">
                Available to Withdraw
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-cinzel text-3xl sm:text-4xl font-extrabold text-amber-300">
                  {availableBalance.toLocaleString()}
                </span>
                <span className="font-bold text-amber-400 text-sm">ELDRA</span>
              </div>
            </div>

            <div className="border-t sm:border-t-0 sm:border-l border-zinc-800 pt-3 sm:pt-0 sm:pl-5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <span className="text-zinc-400">In 24h Review:</span>
                <span className="font-mono font-bold text-yellow-400">{pendingWithdrawalSum} ELDRA</span>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <span className="text-zinc-400">Total Paid Out:</span>
                <span className="font-mono font-bold text-emerald-400">{totalWithdrawnSum} ELDRA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 24-Hour Processing Cycle Notice & Live Timer */}
      <div className="bg-gradient-to-r from-amber-500/10 via-[#101520] to-yellow-500/5 rounded-2xl border border-amber-500/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-cinzel text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
              <span>24-Hour Batch Withdrawal System</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                Daily Payouts
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              All member withdrawals are compiled and paid out in <strong>24-hour cycles</strong>. Submitting a request locks your requested coins safely into pending review until batch execution.
            </p>
          </div>
        </div>

        <div className="bg-[#090d14] px-4 py-2.5 rounded-xl border border-amber-500/40 flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 block leading-none">
              Current Batch Closes In
            </span>
            <span className="font-mono text-sm font-extrabold text-amber-300">
              {cycleCountdown}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Withdrawal Form & 24h Processing Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Fixed Withdrawal Submission Card (7 cols) */}
        <div className="lg:col-span-7 bg-[#101520] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-cinzel text-lg font-bold text-zinc-100">
                  Request New Withdrawal
                </h2>
                <p className="text-xs text-zinc-400">
                  Provide your recipient Solana address and amount
                </p>
              </div>
            </div>

            <button
              onClick={handleMaxClick}
              type="button"
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold font-mono transition-colors cursor-pointer"
            >
              MAX ({availableBalance})
            </button>
          </div>

          {/* Feedback banners */}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <div>
                <p className="font-bold">{successMsg}</p>
                <p className="text-[11px] text-emerald-400/90 font-normal mt-0.5">
                  Your coins have been deducted and moved to the 24-hour review batch below.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* DESTINATION WALLET ADDRESS COLUMN */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-extrabold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-amber-400" />
                  <span>paste your Address</span>
                  <span className="text-amber-400">*</span>
                </label>
                <span className="text-[11px] text-zinc-400 font-mono">Solana / Base58</span>
              </div>

              <div className="relative flex items-center">
                <input
                  type="text"
                  required
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="paste your Address"
                  className="w-full pl-4 pr-24 py-3.5 rounded-2xl bg-[#141b27] border border-zinc-700 hover:border-zinc-600 focus:border-amber-400 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none font-mono transition-colors"
                />

                {/* Direct 1-Click Paste Button */}
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="absolute right-2 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Paste from clipboard"
                >
                  {pastedFeedback ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Pasted!</span>
                    </>
                  ) : (
                    <>
                      <ClipboardPaste className="w-3.5 h-3.5" />
                      <span>Paste</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-zinc-400 mt-2">
                Paste your Solana address from Phantom, Solflare, Backpack, or any SPL-compatible wallet.
              </p>
            </div>

            {/* WITHDRAWAL AMOUNT */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-extrabold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>Withdrawal Amount (ELDRA)</span>
                  <span className="text-amber-400">*</span>
                </label>
                <span className="text-[11px] text-amber-400 font-semibold">Min: 50 ELDRA</span>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="50"
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="50"
                  className="w-full px-4 py-3.5 rounded-2xl bg-[#141b27] border border-zinc-700 hover:border-zinc-600 focus:border-amber-400 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none font-mono transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-xs text-amber-400">
                  ELDRA
                </span>
              </div>

              {/* Quick Amount Pills */}
              <div className="grid grid-cols-5 gap-2 mt-2.5">
                {[50, 100, 250, 500, 1000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickAmount(val)}
                    disabled={val > availableBalance}
                    className={`py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                      amount === val.toString()
                        ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed'
                    }`}
                  >
                    +{val}
                  </button>
                ))}
              </div>
            </div>

            {/* Transparent Notice */}
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>24-Hour Batch Review & Transparent Coin Lock</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                When you click Confirm, requested tokens are locked and deducted from your available balance. All approved batch payouts are sent during the daily 24-hour cycle.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                isSubmitting ||
                availableBalance < 50 ||
                numAmount > availableBalance ||
                numAmount < 50
              }
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold text-sm shadow-xl shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Flame className="w-4 h-4 fill-black text-black" />
              <span>
                {isSubmitting
                  ? 'Submitting Request...'
                  : availableBalance < 50
                  ? 'Min 50 ELDRA Required to Withdraw'
                  : 'Submit Withdrawal Request'}
              </span>
            </button>
          </form>
        </div>

        {/* Right Column: How 24h Batch Withdrawals Work (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Rules & Process Card */}
          <div className="bg-[#101520] border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-xl">
            <h3 className="font-cinzel text-lg font-bold text-zinc-100 flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>How Batch Payouts Work</span>
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">Paste your Address & Submit</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    Enter any valid Solana wallet address (Phantom, Solflare, etc.) and specify your desired withdrawal amount (Min: 50 ELDRA).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-lg bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">24-Hour Cycle Compilation</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    Requests from all members are compiled together into daily 24-hour batch units for network efficiency.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">Admin Approval & Bulk Disperse</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    The Super Admin reviews and authorizes the batch, executing multi-send Solana payouts directly on-chain.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                  4
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">Refund Safety Guard</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    If an invalid address is provided or a request is declined, tokens are automatically credited back to your balance immediately.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts Card */}
          <div className="bg-[#101520] border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-xl">
            <h3 className="font-cinzel text-base font-bold text-zinc-100 mb-3">
              Need More ELDRA Tokens?
            </h3>
            <div className="space-y-2.5">
              <button
                onClick={() => setActiveTab('claim')}
                className="w-full p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/30 flex items-center justify-between text-xs text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="font-bold text-zinc-200">Claim Daily Dragon Faucet</span>
                </div>
                <span className="text-amber-400 font-semibold flex items-center gap-1">
                  1 ELDRA <ArrowRight className="w-3 h-3" />
                </span>
              </button>

              <button
                onClick={() => setActiveTab('referrals')}
                className="w-full p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-yellow-500/30 flex items-center justify-between text-xs text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span className="font-bold text-zinc-200">Invite Friends & Earn</span>
                </div>
                <span className="text-yellow-400 font-semibold flex items-center gap-1">
                  +5 / Invite <ArrowRight className="w-3 h-3" />
                </span>
              </button>

              <button
                onClick={() => setActiveTab('learn')}
                className="w-full p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/30 flex items-center justify-between text-xs text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-zinc-200">Take Educational Quizzes</span>
                </div>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  +20 Jackpot <ArrowRight className="w-3 h-3" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Withdrawal History & Requests Table */}
      <div className="rounded-3xl bg-[#101520] border border-zinc-800 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5 mb-6">
          <div>
            <h3 className="font-cinzel text-xl font-bold text-zinc-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>Your Withdrawal Requests & Batch Payout Status</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Real-time audit log of all your submitted withdrawal orders, batch review statuses, and payout receipts.
            </p>
          </div>

          <span className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-amber-300 font-bold">
            Total Requests: {userWithdrawals.length}
          </span>
        </div>

        {userWithdrawals.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-sm">
            <Wallet className="w-12 h-12 mx-auto text-zinc-700 mb-3" />
            <p className="font-semibold text-zinc-400">No withdrawal requests submitted yet</p>
            <p className="text-xs text-zinc-600 mt-1">
              Use the form above to paste your Address and submit your first withdrawal.
            </p>
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
                  className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-800/20 px-3 rounded-2xl transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
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
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-bold text-sm text-zinc-200 font-mono">
                          {req.walletAddress.slice(0, 8)}...{req.walletAddress.slice(-8)}
                        </span>
                        {isPending && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">
                            In 24h Batch Review
                          </span>
                        )}
                        {isApproved && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            Approved & Dispersed
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-300 border border-red-500/30">
                            Declined (Refunded)
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 mt-1.5 text-xs text-zinc-400 font-mono">
                        <span className="text-zinc-500">Batch: {req.batchDate || req.batchId}</span>
                        <span>&bull;</span>
                        <span>Requested: {new Date(req.requestedAt).toLocaleString()}</span>
                        {req.txHash && (
                          <>
                            <span>&bull;</span>
                            <span className="text-amber-400/90 font-bold">Payout Ref: {req.txHash}</span>
                          </>
                        )}
                      </div>

                      {req.rejectionReason && (
                        <p className="text-xs text-red-300 mt-1">
                          Reason: {req.rejectionReason} (Coins automatically credited back to your balance)
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right sm:shrink-0">
                    <span className="font-cinzel font-extrabold text-xl text-amber-300 block">
                      -{req.amount} ELDRA
                    </span>
                    <span className="text-[11px] text-zinc-400 font-medium">
                      {isPending
                        ? 'Pending 24h Review'
                        : isApproved
                        ? 'Deducted & Paid Out'
                        : 'Refunded to Balance'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
