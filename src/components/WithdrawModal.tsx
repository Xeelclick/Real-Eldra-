import React, { useState } from 'react';
import { User } from '../types';
import { store } from '../services/store';
import {
  ArrowUpRight,
  Wallet,
  Coins,
  CheckCircle,
  AlertCircle,
  X,
  Sparkles,
  Info,
  Clock,
  ShieldCheck,
  Flame,
  ClipboardPaste,
  Check,
} from 'lucide-react';

interface WithdrawModalProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onSuccess,
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

  if (!isOpen) return null;

  const availableBalance = currentUser.balance;
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
      // User can paste normally
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
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 1800);
      } else {
        setErrorMsg(res.message);
      }
    }, 400);
  };

  return (
    <div
      id="withdraw-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="withdraw-modal-card"
        className="w-full max-w-lg rounded-3xl bg-[#0f141f] border border-amber-500/40 p-6 sm:p-8 shadow-2xl shadow-black relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 shadow-lg shadow-amber-500/20">
            <div className="w-full h-full rounded-2xl bg-zinc-950 flex items-center justify-center text-amber-400">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h3 className="font-cinzel text-xl font-bold text-zinc-100 flex items-center gap-2">
              <span>Request ELDRA Withdrawal</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Compiled into 24-hour payout batches &bull; Solana Network
            </p>
          </div>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Available Balance Card */}
        <div className="mb-5 p-4 rounded-2xl bg-[#0b0e14] border border-amber-500/20 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-bold text-zinc-400 block">
              Available to Withdraw
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="font-cinzel text-2xl font-extrabold text-amber-300">
                {availableBalance.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-amber-400/90">ELDRA</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleMaxClick}
            className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold font-mono transition-colors"
          >
            USE MAX
          </button>
        </div>

        {/* Withdrawal Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Destination Wallet Address */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-amber-400" />
                <span>paste your Address</span>
                <span className="text-amber-400">*</span>
              </span>
              <span className="text-[11px] text-zinc-400 font-normal">Base58 / SOL</span>
            </label>

            <div className="relative flex items-center">
              <input
                type="text"
                required
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="paste your Address"
                className="w-full pl-4 pr-24 py-3 rounded-xl bg-[#141b27] border border-zinc-700 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-mono"
              />

              <button
                type="button"
                onClick={handlePasteClipboard}
                className="absolute right-2 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                title="Paste from clipboard"
              >
                {pastedFeedback ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400 text-[11px]">Pasted!</span>
                  </>
                ) : (
                  <>
                    <ClipboardPaste className="w-3 h-3" />
                    <span className="text-[11px]">Paste</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-zinc-400 mt-1">
              Provide your personal Solana SPL token wallet (e.g., Phantom, Solflare, Backpack).
            </p>
          </div>

          {/* Amount to Withdraw */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                Withdrawal Amount (ELDRA)
              </span>
              <span className="text-[11px] text-amber-400/90 font-bold">Min: 50 ELDRA</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="50"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50"
                className="w-full px-4 py-3 rounded-xl bg-[#141b27] border border-zinc-700 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-mono"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-xs text-amber-400">
                ELDRA
              </span>
            </div>

            {/* Quick Amount Selector Chips */}
            <div className="flex items-center gap-2 mt-2">
              {[50, 100, 250, 500, 1000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAmount(val)}
                  disabled={val > availableBalance}
                  className={`flex-1 py-1 rounded-lg text-xs font-mono font-semibold border transition-all ${
                    amount === val.toString()
                      ? 'bg-amber-500 text-black border-amber-400 font-bold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed'
                  }`}
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          {/* 24-Hour Transparency Notice with Live Cycle Countdown */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-zinc-400 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>24-Hour Batch Payout System</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Cycle: {cycleCountdown}
              </span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              Withdrawals are processed in <strong>24-hour batches</strong>. When you confirm, requested coins are safely locked from your active balance. The Admin compiles all requests in this 24-hour cycle and executes bulk Solana transfers.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-3 rounded-2xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || availableBalance < 50 || numAmount > availableBalance || numAmount < 50}
              className="w-1/2 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold text-xs shadow-lg shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Flame className="w-4 h-4 fill-black text-black" />
              <span>{isSubmitting ? 'Processing...' : availableBalance < 50 ? 'Min 50 ELDRA' : 'Confirm Withdrawal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
