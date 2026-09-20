import React, { useState, useEffect } from 'react';
import { User, WithdrawalRequest, WithdrawalBatch } from '../types';
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
  ExternalLink,
  CheckCircle,
  XCircle,
  Zap,
  Code,
  Download,
  FileText,
  Filter,
  RefreshCw,
  Layers,
  Send,
  Search,
  Info,
  Ban,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

interface WithdrawalProcessingPageProps {
  currentUser: User;
  setActiveTab: (tab: string) => void;
}

const COMMON_DECLINE_REASONS = [
  'Invalid Solana wallet address (malformed or unrecognized Base58 string)',
  'Suspected multi-account / anti-cheat policy violation (linked hardware / clone sandbox)',
  'Failed Sybil verification / suspicious rapid referral ring activity',
  'Incorrect network address provided (Ethereum/BSC EVM address instead of Solana)',
  'Duplicate or simultaneous withdrawal request submission',
  'Temporary manual security audit hold by Super Admin',
];

export const WithdrawalProcessingPage: React.FC<WithdrawalProcessingPageProps> = ({
  currentUser,
  setActiveTab,
}) => {
  const isAdmin = currentUser.role === 'admin';

  // State for user withdrawal form
  const [walletAddress, setWalletAddress] = useState('');
  const [amount, setAmount] = useState<string>('50');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userErrorMsg, setUserErrorMsg] = useState<string | null>(null);
  const [userSuccessMsg, setUserSuccessMsg] = useState<string | null>(null);
  const [pastedFeedback, setPastedFeedback] = useState(false);

  // Admin Batch and Filter State
  const [selectedBatchId, setSelectedBatchId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cycleCountdown, setCycleCountdown] = useState<string>(
    store.get24HourCycleTimeRemaining().formatted
  );

  // Admin Modals State
  const [bulkModalBatch, setBulkModalBatch] = useState<WithdrawalBatch | null>(null);
  const [bulkFormat, setBulkFormat] = useState<
    'comma' | 'space' | 'tab' | 'addresses_only' | 'amounts_only' | 'csv' | 'json'
  >('comma');
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  // Batch Approval Modal State
  const [batchToApproveModal, setBatchToApproveModal] = useState<WithdrawalBatch | null>(null);
  const [showApproveAllModal, setShowApproveAllModal] = useState(false);
  const [txHashInput, setTxHashInput] = useState('');
  const [isApprovingBatch, setIsApprovingBatch] = useState(false);

  // Single Approve Modal
  const [approvingSingleReq, setApprovingSingleReq] = useState<WithdrawalRequest | null>(null);
  const [singleTxHashInput, setSingleTxHashInput] = useState('');

  // Single Decline Modal State
  const [decliningReq, setDecliningReq] = useState<WithdrawalRequest | null>(null);
  const [selectedDeclineReason, setSelectedDeclineReason] = useState<string>(COMMON_DECLINE_REASONS[0]);
  const [customDeclineReason, setCustomDeclineReason] = useState<string>('');
  const [isDeclining, setIsDeclining] = useState(false);

  // General Notification
  const [adminFeedback, setAdminFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Store data
  const [batches, setBatches] = useState<WithdrawalBatch[]>(store.get24HourWithdrawalBatches());
  const [allWithdrawals, setAllWithdrawals] = useState<WithdrawalRequest[]>(store.getAllWithdrawals());
  const userWithdrawals = store.getUserWithdrawals(currentUser.id);

  // Sync with store
  useEffect(() => {
    const handleUpdate = () => {
      setBatches(store.get24HourWithdrawalBatches());
      setAllWithdrawals(store.getAllWithdrawals());
    };
    const unsubscribe = store.subscribe(handleUpdate);
    return () => unsubscribe();
  }, []);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCycleCountdown(store.get24HourCycleTimeRemaining().formatted);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const availableBalance = currentUser.balance;
  const pendingWithdrawalSum = currentUser.pendingWithdrawalBalance || 0;
  const totalWithdrawnSum = currentUser.withdrawnBalance || 0;
  const numAmount = parseFloat(amount) || 0;

  // Selected Batch
  const currentBatch = selectedBatchId === 'all'
    ? null
    : batches.find((b) => b.batchId === selectedBatchId);

  // Filtered withdrawals list for admin view
  const filteredWithdrawals = (
    selectedBatchId === 'all'
      ? allWithdrawals
      : currentBatch?.requests || []
  ).filter((w) => {
    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      w.walletAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.userHandle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalPendingAcrossPlatform = allWithdrawals.filter((w) => w.status === 'pending').length;
  const totalPendingEldraAcrossPlatform = allWithdrawals
    .filter((w) => w.status === 'pending')
    .reduce((sum, w) => sum + w.amount, 0);

  // --------------------------------------------------------------------------
  // USER ACTIONS
  // --------------------------------------------------------------------------
  const handleMaxClick = () => {
    setAmount(availableBalance.toString());
    setUserErrorMsg(null);
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
    setUserErrorMsg(null);
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
      // Fallback
    }
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserErrorMsg(null);
    setUserSuccessMsg(null);

    const cleanWallet = walletAddress.trim();
    if (!cleanWallet || cleanWallet.length < 24) {
      setUserErrorMsg('Please paste your Address (valid Solana wallet address of at least 24 characters).');
      return;
    }

    if (numAmount < 50) {
      setUserErrorMsg('Minimum withdrawal amount is 50 ELDRA tokens.');
      return;
    }

    if (numAmount > availableBalance) {
      setUserErrorMsg(`Insufficient balance. You currently have ${availableBalance} ELDRA available.`);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const res = store.requestWithdrawal(currentUser.id, cleanWallet, numAmount);
      setIsSubmitting(false);

      if (res.success) {
        setUserSuccessMsg(res.message);
        setAmount('50');
      } else {
        setUserErrorMsg(res.message);
      }
    }, 400);
  };

  // --------------------------------------------------------------------------
  // ADMIN BATCH & BULK ACTIONS
  // --------------------------------------------------------------------------
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(label);
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  const getBulkTextForBatch = (
    batch: WithdrawalBatch | null,
    fmt: typeof bulkFormat,
    statusOnly: 'pending' | 'approved' | 'all' = 'pending'
  ): string => {
    const targetBatchId = batch ? batch.batchId : selectedBatchId;
    if (fmt === 'csv') {
      return store.generateWithdrawalsCsv(statusOnly, targetBatchId === 'all' ? undefined : targetBatchId);
    }
    return store.generateBulkFormattedData(
      statusOnly,
      targetBatchId === 'all' ? undefined : targetBatchId,
      fmt === 'csv' ? 'comma' : fmt
    );
  };

  const handleApproveBatch = () => {
    if (!batchToApproveModal) return;
    setIsApprovingBatch(true);

    setTimeout(() => {
      const res = store.approveBatchWithdrawals(
        batchToApproveModal.batchId,
        currentUser.email
      );
      setIsApprovingBatch(false);
      setBatchToApproveModal(null);
      setTxHashInput('');

      if (res.success) {
        setAdminFeedback({
          type: 'success',
          message: `Batch Approved! ${res.count} requests totaling ${res.totalAmount.toLocaleString()} ELDRA marked as paid and dispersed.`,
        });
      } else {
        setAdminFeedback({ type: 'error', message: res.message });
      }
    }, 400);
  };

  const handleApproveAllPending = () => {
    setIsApprovingBatch(true);
    setTimeout(() => {
      const res = store.approveAllPendingWithdrawals(currentUser.email);
      setIsApprovingBatch(false);
      setShowApproveAllModal(false);
      setTxHashInput('');

      if (res.success) {
        setAdminFeedback({
          type: 'success',
          message: `Platform-Wide Approval! ${res.count} requests (${res.totalAmount.toLocaleString()} ELDRA) marked as completed and sent.`,
        });
      } else {
        setAdminFeedback({ type: 'error', message: res.message });
      }
    }, 400);
  };

  const handleApproveSingle = () => {
    if (!approvingSingleReq) return;
    const res = store.approveWithdrawal(
      approvingSingleReq.id,
      currentUser.email,
      singleTxHashInput.trim() || undefined
    );
    setApprovingSingleReq(null);
    setSingleTxHashInput('');

    if (res.success) {
      setAdminFeedback({ type: 'success', message: res.message });
    } else {
      setAdminFeedback({ type: 'error', message: res.message });
    }
  };

  const handleDeclineSingle = () => {
    if (!decliningReq) return;
    const finalReason =
      selectedDeclineReason === 'Custom Reason'
        ? customDeclineReason.trim() || 'Declined by Administrator'
        : selectedDeclineReason;

    setIsDeclining(true);
    setTimeout(() => {
      const res = store.rejectWithdrawal(decliningReq.id, finalReason);
      setIsDeclining(false);
      setDecliningReq(null);
      setCustomDeclineReason('');

      if (res.success) {
        setAdminFeedback({
          type: 'success',
          message: `Withdrawal request declined. ${decliningReq.amount} ELDRA refunded immediately back to @${decliningReq.userHandle}'s dashboard balance.`,
        });
      } else {
        setAdminFeedback({ type: 'error', message: res.message });
      }
    }, 300);
  };

  const handleDownloadCsv = (batchId?: string) => {
    const csvContent = store.generateWithdrawalsCsv('all', batchId === 'all' ? undefined : batchId);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `eldra_withdrawals_${batchId || 'all'}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* --------------------------------------------------------------------- */}
      {/* TOP HEADER: 24-HOUR WITHDRAWAL PROCESSING INDICATOR & NOTICE          */}
      {/* --------------------------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#161c28] via-[#101520] to-[#0c1017] border border-amber-500/40 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-1 bg-gradient-to-tr from-amber-600 via-amber-300 to-yellow-600 shadow-xl shadow-amber-500/25 shrink-0">
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
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-cinzel text-2xl sm:text-3xl font-extrabold text-zinc-100">
                  24-Hour Withdrawal Processing
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Solana SPL
                </span>
                {isAdmin && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-red-500/20 text-red-300 border border-red-500/40">
                    👑 Super Admin Console
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-2xl leading-relaxed">
                <strong>Withdrawal processing is completed within 24 Hours.</strong> All submitted requests are grouped into daily 24-hour batch units for Solana on-chain multi-send distribution and transparent settlement.
              </p>
            </div>
          </div>

          {/* Right Side: 24h Cycle Countdown Badge */}
          <div className="bg-[#0b0e14]/95 border border-amber-500/40 rounded-2xl p-5 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-extrabold text-zinc-400 block tracking-wider">
                  Active 24H Batch Window
                </span>
                <span className="font-mono text-base sm:text-lg font-extrabold text-amber-300">
                  {cycleCountdown}
                </span>
                <span className="text-[10px] text-zinc-500 block font-mono">
                  Cycles close daily at 23:59:59
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 24-HOUR BATCH PROCESSING GUARANTEE BANNER                             */}
      {/* --------------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-amber-500/15 via-[#121824] to-yellow-500/10 rounded-2xl border border-amber-500/40 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-cinzel text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
              <span>24-Hour Settlement Guarantee</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                Zero Fees &bull; Auto Refund On Decline
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Every withdrawal request submitted enters the active 24-hour cycle. The administration compiles all wallets into bulk transfers, executes on-chain payouts, or declines invalid requests with full token refunds.
            </p>
          </div>
        </div>

        {isAdmin && totalPendingAcrossPlatform > 0 && (
          <button
            id="admin-top-approve-all-btn"
            onClick={() => setShowApproveAllModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all hover:scale-105 cursor-pointer shrink-0"
          >
            <Zap className="w-4 h-4 fill-black" />
            <span>1-Click Approve All ({totalPendingAcrossPlatform} Pending &bull; {totalPendingEldraAcrossPlatform.toLocaleString()} ELDRA)</span>
          </button>
        )}
      </div>

      {/* Admin Feedback Notifications */}
      {adminFeedback && (
        <div
          className={`p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between gap-3 animate-in fade-in ${
            adminFeedback.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              : 'bg-red-500/20 border-red-500/40 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {adminFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span>{adminFeedback.message}</span>
          </div>
          <button
            onClick={() => setAdminFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* SECTION FOR SUPER ADMIN: 24-HOUR BATCH ARRANGER & DISPATCHER         */}
      {/* --------------------------------------------------------------------- */}
      {isAdmin && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <h2 className="font-cinzel text-xl font-bold text-zinc-100">
                  Admin 24-Hour Batch Arranger & Bulk Sender
                </h2>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                All member withdrawals arranged in 24-hour batches. Copy bulk formats, 1-click approve entire badges, or decline invalid requests with reasons.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                id="btn-global-bulk-modal"
                onClick={() => setBulkModalBatch(currentBatch || batches[0] || null)}
                className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Code className="w-4 h-4 text-amber-400" />
                <span>Crypto Bulk Dispatcher</span>
              </button>

              <button
                id="btn-download-all-csv"
                onClick={() => handleDownloadCsv(selectedBatchId)}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* 24-Hour Batch Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Master Log Badge */}
            <div
              onClick={() => setSelectedBatchId('all')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                selectedBatchId === 'all'
                  ? 'bg-amber-500/15 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                  : 'bg-[#101520] border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    All Batches (Master View)
                  </span>
                  <Layers className="w-4 h-4 text-amber-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="font-cinzel text-2xl font-bold text-zinc-100">
                    {allWithdrawals.length}
                  </span>
                  <span className="text-xs text-zinc-400">Total Requests</span>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-zinc-800/80 text-xs text-zinc-400 flex items-center justify-between">
                <span className="text-yellow-400 font-semibold">
                  {totalPendingAcrossPlatform} Pending Payouts
                </span>
                <span className="text-amber-300 font-bold">Select &rarr;</span>
              </div>
            </div>

            {/* Individual 24-Hour Cycle Badges */}
            {batches.map((batch) => {
              const isSelected = selectedBatchId === batch.batchId;
              const isActiveCycle = batch.batchDate.includes('Active');

              return (
                <div
                  key={batch.batchId}
                  onClick={() => setSelectedBatchId(batch.batchId)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative group ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                      : 'bg-[#101520] border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-zinc-200 truncate">
                        {batch.batchDate}
                      </span>
                      {isActiveCycle && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-orange-500/20 text-orange-300 border border-orange-500/40 uppercase animate-pulse">
                          Active 24H
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex items-baseline justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="font-cinzel text-2xl font-bold text-amber-300">
                          {batch.totalAmount.toLocaleString()}
                        </span>
                        <span className="text-xs text-amber-400 font-bold">ELDRA</span>
                      </div>
                      <span className="text-xs text-zinc-400 font-mono">
                        {batch.totalRequests} {batch.totalRequests === 1 ? 'order' : 'orders'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-zinc-800/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      {batch.pendingCount > 0 ? (
                        <span className="text-yellow-400 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" />
                          {batch.pendingCount} Pending
                        </span>
                      ) : batch.approvedCount > 0 ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> All Dispersed ({batch.approvedCount})
                        </span>
                      ) : (
                        <span className="text-zinc-500">Empty Batch</span>
                      )}

                      <span className="text-amber-400/90 font-mono text-[10px]">
                        {batch.batchId}
                      </span>
                    </div>

                    {/* Batch Actions: 1-Click Copy Bulk & 1-Click Approve */}
                    {batch.pendingCount > 0 && (
                      <div
                        className="pt-1 flex items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setBulkModalBatch(batch)}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                          title="Copy batch in crypto bulk format (address,amount)"
                        >
                          <Copy className="w-3 h-3 text-amber-400" />
                          <span>Copy Bulk</span>
                        </button>

                        <button
                          onClick={() => setBatchToApproveModal(batch)}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[10px] flex items-center justify-center gap-1 shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
                          title="1-Click Approve & mark entire 24h batch as sent"
                        >
                          <Zap className="w-3 h-3" />
                          <span>1-Click Approve</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Batch Control Panel */}
          <div className="rounded-3xl bg-[#101520] border border-amber-500/30 p-5 sm:p-6 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <h3 className="font-cinzel text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <span>
                    {selectedBatchId === 'all'
                      ? 'Master Ledger (All 24H Batches)'
                      : `24H Batch Badge: ${currentBatch?.batchDate || selectedBatchId}`}
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Use the quick buttons below to copy the whole batch for crypto bulk multisend tools or approve all in 1-click.
                </p>
              </div>

              {/* Fast Bulk Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* 1-Click Approve for currently viewed batch */}
                {((selectedBatchId !== 'all' && (currentBatch?.pendingCount || 0) > 0) ||
                  (selectedBatchId === 'all' && totalPendingAcrossPlatform > 0)) && (
                  <button
                    id="admin-btn-approve-current-batch"
                    onClick={() => {
                      if (selectedBatchId === 'all') {
                        setShowApproveAllModal(true);
                      } else if (currentBatch) {
                        setBatchToApproveModal(currentBatch);
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                  >
                    <Zap className="w-4 h-4 fill-black" />
                    <span>
                      {selectedBatchId === 'all'
                        ? `1-Click Approve All Pending (${totalPendingAcrossPlatform} Orders)`
                        : `1-Click Approve Entire Batch (${currentBatch?.pendingCount || 0} Pending)`}
                    </span>
                  </button>
                )}

                {/* Copy Bulk (address,amount) */}
                <button
                  id="admin-btn-copy-bulk-badge"
                  onClick={() => {
                    const text = getBulkTextForBatch(currentBatch || null, 'comma', 'pending');
                    if (!text || text.trim().length === 0) {
                      setAdminFeedback({
                        type: 'error',
                        message: 'No pending withdrawal records in this batch to copy.',
                      });
                      return;
                    }
                    handleCopyText(text, 'batch_multisend');
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold font-mono flex items-center gap-2 transition-colors cursor-pointer"
                  title="Copy full batch in standard crypto multisend format: address,amount"
                >
                  {copiedFormat === 'batch_multisend' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copied (address,amount)!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-amber-400" />
                      <span>Copy Crypto Bulk (address,amount)</span>
                    </>
                  )}
                </button>

                {/* Copy Addresses Only */}
                <button
                  id="admin-btn-copy-addresses-only"
                  onClick={() => {
                    const text = getBulkTextForBatch(currentBatch || null, 'addresses_only', 'pending');
                    if (!text || text.trim().length === 0) {
                      setAdminFeedback({
                        type: 'error',
                        message: 'No pending wallet addresses in this batch to copy.',
                      });
                      return;
                    }
                    handleCopyText(text, 'batch_addresses');
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  title="Copy all destination wallet addresses (one per line)"
                >
                  {copiedFormat === 'batch_addresses' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copied Addresses!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-amber-400" />
                      <span>Copy Addresses Only</span>
                    </>
                  )}
                </button>

                {/* Open Full Dispatcher Drawer */}
                <button
                  onClick={() => setBulkModalBatch(currentBatch || batches[0] || null)}
                  className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Code className="w-4 h-4 text-amber-400" />
                  <span>Format Dispatcher</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 flex-wrap">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                      statusFilter === f
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {f === 'all' ? 'All Statuses' : f === 'rejected' ? 'Declined' : f}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[240px]">
                <input
                  type="text"
                  placeholder="Search by wallet, @handle, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-mono"
                />
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Batch Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Recipient Member</th>
                    <th className="py-3 px-3">Destination Solana Wallet Address</th>
                    <th className="py-3 px-3 text-right">Amount</th>
                    <th className="py-3 px-3">24H Batch & Timestamp</th>
                    <th className="py-3 px-3 text-center">Admin Settlement Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-medium">
                  {filteredWithdrawals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-500">
                        No withdrawal requests found matching this batch filter.
                      </td>
                    </tr>
                  ) : (
                    filteredWithdrawals.map((req) => {
                      const isPending = req.status === 'pending';
                      const isApproved = req.status === 'approved';
                      const isRejected = req.status === 'rejected';

                      return (
                        <tr
                          key={req.id}
                          className="hover:bg-zinc-800/30 transition-colors"
                        >
                          {/* Status Badge */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            {isPending ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-yellow-500/15 text-yellow-300 border border-yellow-500/40 flex items-center gap-1.5 w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" />
                                Pending 24H Review
                              </span>
                            ) : isApproved ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 w-fit">
                                <Check className="w-3 h-3" /> Dispersed & Paid
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/15 text-red-300 border border-red-500/40 flex items-center gap-1 w-fit">
                                <XCircle className="w-3 h-3" /> Declined (Refunded)
                              </span>
                            )}
                          </td>

                          {/* Member Handle */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-amber-300">
                                @{req.userHandle}
                              </span>
                              <span className="text-zinc-400 truncate max-w-[110px]">
                                ({req.userName})
                              </span>
                            </div>
                            <span className="text-[11px] text-zinc-500 block truncate max-w-[160px]">
                              {req.userEmail}
                            </span>
                          </td>

                          {/* Wallet Address with 1-Click Copy */}
                          <td className="py-3.5 px-3 font-mono">
                            <div className="flex items-center gap-2">
                              <span
                                className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-semibold hover:border-amber-500/40 transition-colors"
                                title={req.walletAddress}
                              >
                                {req.walletAddress.slice(0, 8)}...{req.walletAddress.slice(-8)}
                              </span>
                              <button
                                onClick={() => handleCopyText(req.walletAddress, `wallet_${req.id}`)}
                                className="p-1 rounded-md text-zinc-400 hover:text-amber-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                                title="Copy Full Solana Wallet Address"
                              >
                                {copiedFormat === `wallet_${req.id}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Amount */}
                          <td className="py-3.5 px-3 text-right whitespace-nowrap">
                            <span className="font-cinzel text-base font-bold text-amber-300">
                              {req.amount.toLocaleString()}
                            </span>
                            <span className="text-xs text-amber-400/80 font-bold ml-1">ELDRA</span>
                          </td>

                          {/* Date & 24H Unit */}
                          <td className="py-3.5 px-3 text-zinc-400 text-[11px] whitespace-nowrap">
                            <div>{new Date(req.requestedAt).toLocaleString()}</div>
                            <span className="text-[10px] text-amber-400/80 font-mono font-semibold">
                              {req.batchId}
                            </span>
                          </td>

                          {/* Admin Actions (Approve & Decline with reason) */}
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            {isPending ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  id={`btn-approve-single-${req.id}`}
                                  onClick={() => setApprovingSingleReq(req)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all hover:scale-105 cursor-pointer flex items-center gap-1"
                                  title="Approve single withdrawal and mark as paid"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  id={`btn-decline-single-${req.id}`}
                                  onClick={() => {
                                    setDecliningReq(req);
                                    setSelectedDeclineReason(COMMON_DECLINE_REASONS[0]);
                                    setCustomDeclineReason('');
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold transition-all hover:scale-105 cursor-pointer flex items-center gap-1"
                                  title="Decline request with reason and refund coins to user"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Decline</span>
                                </button>
                              </div>
                            ) : isApproved ? (
                              <div className="text-center text-[11px]">
                                <span className="text-emerald-400 font-semibold flex items-center justify-center gap-1">
                                  <CheckCircle className="w-3.5 h-3.5" /> Dispersed
                                </span>
                                {req.txHash && (
                                  <span className="text-[10px] text-zinc-500 font-mono block">
                                    Ref: {req.txHash}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="text-center text-[11px]">
                                <span className="text-red-400 font-semibold flex items-center justify-center gap-1">
                                  <XCircle className="w-3.5 h-3.5" /> Declined (Refunded)
                                </span>
                                {req.rejectionReason && (
                                  <span
                                    className="text-[10px] text-zinc-500 block truncate max-w-[160px] mx-auto"
                                    title={req.rejectionReason}
                                  >
                                    {req.rejectionReason}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* USER WITHDRAWAL SUBMISSION FORM & PERSONAL HISTORY                   */}
      {/* --------------------------------------------------------------------- */}
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
                  Request 24H Batch Withdrawal
                </h2>
                <p className="text-xs text-zinc-400">
                  Enter your Solana destination wallet and desired token amount
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

          {/* User Feedback */}
          {userErrorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              <span>{userErrorMsg}</span>
            </div>
          )}

          {userSuccessMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <div>
                <p className="font-bold">{userSuccessMsg}</p>
                <p className="text-[11px] text-emerald-400/90 font-normal mt-0.5">
                  Your coins are now entered into the active 24-hour review batch.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleUserSubmit} className="space-y-6">
            {/* Wallet Address */}
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
                Supports Phantom, Solflare, Backpack, or any Solana SPL wallet address.
              </p>
            </div>

            {/* Withdrawal Amount */}
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

              {/* Quick Amounts */}
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

            {/* 24-Hour Notice */}
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>24-Hour Settlement Schedule</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                When you click Submit, requested tokens are locked and deducted from your balance. The administration processes batch payouts within 24 hours.
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

        {/* Right Column: 24-Hour Processing Guide (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#101520] border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-xl">
            <h3 className="font-cinzel text-lg font-bold text-zinc-100 flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>How 24-Hour Batch Payouts Work</span>
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">Paste your Address & Submit</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    Enter your recipient Solana wallet and request any amount from 50 ELDRA up to your full balance.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-lg bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">Daily 24-Hour Compilation</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    Withdrawals are grouped into 24-hour batch cycles, allowing efficient multi-send distribution without high individual gas fees.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">Admin Bulk Transfer & Approval</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    The Super Admin copies the bulk batch, executes on-chain payouts, and 1-click approves the completed settlement.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 font-bold text-xs flex items-center justify-center shrink-0">
                  4
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">Declined Request Auto-Refund</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    If an invalid address is provided or a policy is violated, the admin declines with a stated reason and coins are immediately refunded to your balance.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Balance Summary */}
          <div className="bg-[#101520] border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-3">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Your Wallet Summary
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-zinc-400">Available to Withdraw:</span>
                <span className="font-mono font-bold text-amber-300">{availableBalance.toLocaleString()} ELDRA</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-zinc-400">In 24h Review Batch:</span>
                <span className="font-mono font-bold text-yellow-400">{pendingWithdrawalSum} ELDRA</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-zinc-400">Successfully Received:</span>
                <span className="font-mono font-bold text-emerald-400">{totalWithdrawnSum} ELDRA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* USER PERSONAL WITHDRAWAL REQUESTS AUDIT LOG                           */}
      {/* --------------------------------------------------------------------- */}
      <div className="rounded-3xl bg-[#101520] border border-zinc-800 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5 mb-6">
          <div>
            <h3 className="font-cinzel text-xl font-bold text-zinc-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>Your Personal Withdrawal Requests & 24H Settlement Status</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Real-time audit record of all your submitted withdrawal requests, batch cycle assignments, and payout receipts.
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
              Paste your Solana wallet address in the form above to submit your first withdrawal.
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
                            Declined (Refunded to Balance)
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 mt-1.5 text-xs text-zinc-400 font-mono">
                        <span className="text-zinc-500">24H Batch: {req.batchDate || req.batchId}</span>
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
                        <p className="text-xs text-red-300 mt-1 font-sans">
                          Reason: <strong>{req.rejectionReason}</strong> (Tokens automatically credited back to your balance)
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
                        ? 'Pending 24H Review'
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

      {/* --------------------------------------------------------------------- */}
      {/* MODAL 1: CRYPTO BULK TRANSFER FORMAT DISPATCHER                       */}
      {/* --------------------------------------------------------------------- */}
      {bulkModalBatch && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121824] border border-amber-500/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-cinzel text-lg font-bold text-zinc-100">
                    Crypto Bulk Multisend Dispatcher
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Batch: <strong>{bulkModalBatch.batchDate}</strong> ({bulkModalBatch.batchId})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setBulkModalBatch(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Format Selection Tabs */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                Choose Output Format for Bulk Tool:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'comma', label: 'address,amount', desc: 'Solana Disperse / Squads' },
                  { id: 'space', label: 'address amount', desc: 'Solana CLI' },
                  { id: 'addresses_only', label: 'Addresses Only', desc: '1 address per line' },
                  { id: 'amounts_only', label: 'Amounts Only', desc: '1 amount per line' },
                  { id: 'csv', label: 'Full CSV', desc: 'Excel / Spreadsheets' },
                  { id: 'json', label: 'JSON Array', desc: 'Scripts & Web3 APIs' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setBulkFormat(f.id as any)}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      bulkFormat === f.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10'
                        : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div className="font-mono text-xs font-bold">{f.label}</div>
                    <div className="text-[10px] text-zinc-500">{f.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea Preview */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-zinc-400 uppercase">
                  Formatted Payload Preview ({bulkModalBatch.requests.length} total entries):
                </span>
                <span className="text-[11px] text-amber-400 font-mono font-bold">
                  Total: {bulkModalBatch.totalAmount.toLocaleString()} ELDRA
                </span>
              </div>
              <textarea
                readOnly
                rows={8}
                value={getBulkTextForBatch(bulkModalBatch, bulkFormat, 'all')}
                className="w-full p-4 rounded-2xl bg-[#090c12] border border-zinc-700 text-xs font-mono text-amber-300 focus:outline-none select-all"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setBulkModalBatch(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                onClick={() => {
                  const text = getBulkTextForBatch(bulkModalBatch, bulkFormat, 'all');
                  handleCopyText(text, 'modal_bulk');
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {copiedFormat === 'modal_bulk' ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy All in Selected Format</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL 2: 1-CLICK APPROVE ENTIRE BATCH CONFIRMATION                    */}
      {/* --------------------------------------------------------------------- */}
      {batchToApproveModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121824] border border-emerald-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-cinzel text-lg font-bold text-zinc-100">
                  1-Click Approve Entire 24H Batch
                </h3>
                <p className="text-xs text-zinc-400">
                  {batchToApproveModal.batchDate} ({batchToApproveModal.batchId})
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300">Pending Requests to Authorize:</span>
                <span className="font-mono font-extrabold text-emerald-400 text-sm">
                  {batchToApproveModal.pendingCount} Orders
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-300">Total ELDRA Token Settlement:</span>
                <span className="font-mono font-extrabold text-amber-300 text-sm">
                  {batchToApproveModal.totalAmount.toLocaleString()} ELDRA
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 pt-1 border-t border-emerald-500/20">
                This will mark all pending orders in this 24h batch as completed and approved, moving them to successfully paid status.
              </p>
            </div>

            {/* Optional Tx Hash */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Optional On-Chain Transaction Hash / Solscan Reference:
              </label>
              <input
                type="text"
                value={txHashInput}
                onChange={(e) => setTxHashInput(e.target.value)}
                placeholder="e.g. 5x9K... or bulk multisend signature"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-400 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setBatchToApproveModal(null)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                disabled={isApprovingBatch}
                onClick={handleApproveBatch}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isApprovingBatch ? 'Approving Batch...' : 'Confirm 1-Click Batch Approval'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL 3: 1-CLICK APPROVE ALL PENDING PLATFORM-WIDE                    */}
      {/* --------------------------------------------------------------------- */}
      {showApproveAllModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121824] border border-teal-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-cinzel text-lg font-bold text-zinc-100">
                  Approve All Pending Platform Withdrawals
                </h3>
                <p className="text-xs text-zinc-400">
                  Authorize and settle all outstanding withdrawal orders across all batches
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300">Total Pending Orders:</span>
                <span className="font-mono font-extrabold text-teal-300 text-sm">
                  {totalPendingAcrossPlatform} Requests
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-300">Total ELDRA Token Volume:</span>
                <span className="font-mono font-extrabold text-amber-300 text-sm">
                  {totalPendingEldraAcrossPlatform.toLocaleString()} ELDRA
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 pt-1 border-t border-teal-500/20">
                Are you sure you have sent the tokens on-chain? Clicking confirm will mark every pending withdrawal as completed.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowApproveAllModal(false)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                disabled={isApprovingBatch}
                onClick={handleApproveAllPending}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 text-black font-extrabold text-xs shadow-lg shadow-teal-500/25 flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isApprovingBatch ? 'Processing...' : 'Authorize All Pending Payouts'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL 4: APPROVE SINGLE WITHDRAWAL                                   */}
      {/* --------------------------------------------------------------------- */}
      {approvingSingleReq && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121824] border border-emerald-500/40 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-cinzel text-base font-bold text-zinc-100">
                  Approve Individual Withdrawal
                </h3>
                <p className="text-xs text-zinc-400">
                  @{approvingSingleReq.userHandle} &bull; {approvingSingleReq.amount} ELDRA
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1 text-xs">
              <div className="text-zinc-400">Recipient Solana Wallet:</div>
              <div className="font-mono text-amber-300 font-bold break-all text-[11px]">
                {approvingSingleReq.walletAddress}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Payout Tx Hash / Reference (Optional):
              </label>
              <input
                type="text"
                value={singleTxHashInput}
                onChange={(e) => setSingleTxHashInput(e.target.value)}
                placeholder="e.g. sol_tx_9f8..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-400 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setApprovingSingleReq(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveSingle}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                Approve & Mark Sent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL 5: DECLINE WITHDRAWAL WITH REASON & AUTO REFUND                 */}
      {/* --------------------------------------------------------------------- */}
      {decliningReq && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121824] border border-red-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <Ban className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-cinzel text-lg font-bold text-zinc-100">
                  Decline Withdrawal Request
                </h3>
                <p className="text-xs text-zinc-400">
                  @{decliningReq.userHandle} ({decliningReq.userEmail}) &bull; {decliningReq.amount} ELDRA
                </p>
              </div>
            </div>

            {/* Auto Refund Guarantee Notice */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Automatic Token Refund to User Balance</span>
              </div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                When you decline this withdrawal, <strong>{decliningReq.amount} ELDRA</strong> will be immediately refunded back to @{decliningReq.userHandle}&apos;s dashboard balance along with your specified decline reason.
              </p>
            </div>

            {/* Reason Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Select Reason for Declining:
              </label>

              <div className="space-y-2">
                {COMMON_DECLINE_REASONS.map((reason, idx) => (
                  <label
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer text-xs ${
                      selectedDeclineReason === reason
                        ? 'bg-red-500/15 border-red-500/60 text-zinc-100'
                        : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="declineReason"
                      value={reason}
                      checked={selectedDeclineReason === reason}
                      onChange={() => setSelectedDeclineReason(reason)}
                      className="mt-0.5 accent-red-500 shrink-0"
                    />
                    <span className="leading-snug">{reason}</span>
                  </label>
                ))}

                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer text-xs ${
                    selectedDeclineReason === 'Custom Reason'
                      ? 'bg-red-500/15 border-red-500/60 text-zinc-100'
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="declineReason"
                    value="Custom Reason"
                    checked={selectedDeclineReason === 'Custom Reason'}
                    onChange={() => setSelectedDeclineReason('Custom Reason')}
                    className="mt-0.5 accent-red-500 shrink-0"
                  />
                  <span>Other / Custom Reason</span>
                </label>
              </div>

              {selectedDeclineReason === 'Custom Reason' && (
                <div className="pt-2">
                  <textarea
                    rows={3}
                    placeholder="Enter specific explanation for the user..."
                    value={customDeclineReason}
                    onChange={(e) => setCustomDeclineReason(e.target.value)}
                    className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-400"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDecliningReq(null)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                disabled={isDeclining}
                onClick={handleDeclineSingle}
                className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-extrabold text-xs shadow-lg shadow-red-500/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Ban className="w-4 h-4" />
                <span>{isDeclining ? 'Declining...' : 'Decline & Refund Tokens'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
