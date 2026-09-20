import React, { useState, useEffect } from 'react';
import { FraudCluster, User, BlockedDeviceInfo } from '../types';
import { store } from '../services/store';
import {
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Cpu,
  Fingerprint,
  Ban,
  UserX,
  Layers,
  Radio,
  HardDrive,
  Terminal,
  Sliders,
  Search,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Play,
  Trash2,
  Eye,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
  Flame,
  Wallet,
  Clock,
  Sparkles,
  Users,
} from 'lucide-react';
import { computeDeviceFingerprint, formatHardwareSpecs } from '../utils/fingerprint';

interface AntiCheatSecurityPanelProps {
  currentUser: User | null;
  onRefresh?: () => void;
}

export const AntiCheatSecurityPanel: React.FC<AntiCheatSecurityPanelProps> = ({
  currentUser,
  onRefresh,
}) => {
  const [fraudClusters, setFraudClusters] = useState<FraudCluster[]>([]);
  const [blockedDevices, setBlockedDevices] = useState<BlockedDeviceInfo[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unblocked' | 'blocked' | 'clones'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Success / Error notification
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Modal States
  const [clusterToBlock, setClusterToBlock] = useState<FraudCluster | null>(null);
  const [userToBlock, setUserToBlock] = useState<User | null>(null);
  const [blockReasonInput, setBlockReasonInput] = useState('Operating multiple accounts / Cloned app sandbox detected');
  const [showMasterBlockModal, setShowMasterBlockModal] = useState(false);
  const [selectedInspectUser, setSelectedInspectUser] = useState<User | null>(null);

  const loadSecurityData = () => {
    const clusters = store.getFraudClusters();
    const blocked = store.getBlockedDevices();
    const stats = store.getCommunityClaimStats();
    setFraudClusters(clusters);
    setBlockedDevices(blocked);
    setAllUsers(stats.users);
    if (onRefresh) onRefresh();
  };

  useEffect(() => {
    loadSecurityData();
    const unsubscribe = store.subscribe(() => {
      loadSecurityData();
    });
    return () => unsubscribe();
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const notifySuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const notifyError = (msg: string) => {
    setActionError(msg);
    setTimeout(() => setActionError(null), 4000);
  };

  // Run deep scan
  const handleDeepScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const scanResults = store.runAntiCheatScan();
      loadSecurityData();
      setIsScanning(false);
      notifySuccess(
        `Deep Anti-Cheat Scan complete! Scanned ${scanResults.totalUsersScanned} accounts: Found ${scanResults.totalClustersFound} fraud badges, ${scanResults.totalCheatersIdentified} suspicious accounts (${scanResults.totalIllicitCoins} ELDRA).`
      );
    }, 900);
  };

  // 1-Click Block Entire Cluster
  const handleConfirmBlockCluster = () => {
    if (!clusterToBlock) return;
    const res = store.adminBlockFraudCluster(clusterToBlock.clusterId);
    setClusterToBlock(null);
    if (res.success) {
      notifySuccess(res.message);
      loadSecurityData();
    } else {
      notifyError(res.message);
    }
  };

  // 1-Click Master Ban All
  const handleConfirmMasterBlock = () => {
    const res = store.adminBlockAllCheaters();
    setShowMasterBlockModal(false);
    if (res.success) {
      notifySuccess(res.message);
      loadSecurityData();
    } else {
      notifyError(res.message);
    }
  };

  // Single User Block
  const handleConfirmBlockSingleUser = () => {
    if (!userToBlock) return;
    const success = store.adminBlockUser(userToBlock.id, blockReasonInput.trim());
    setUserToBlock(null);
    if (success) {
      notifySuccess(`Account @${userToBlock.username} and device fingerprint permanently blocked.`);
      loadSecurityData();
    } else {
      notifyError('Failed to block user.');
    }
  };

  // Single User Unblock
  const handleUnblockSingleUser = (userId: string, username: string) => {
    const success = store.adminUnblockUser(userId);
    if (success) {
      notifySuccess(`Account @${username} and device unblocked successfully.`);
      loadSecurityData();
    } else {
      notifyError('Failed to unblock user.');
    }
  };

  // Unblock Device Fingerprint
  const handleUnblockDevice = (deviceId: string) => {
    const success = store.unblockDevice(deviceId);
    if (success) {
      notifySuccess(`Device ${deviceId.slice(0, 16)}... unblocked from blacklist.`);
      loadSecurityData();
    } else {
      notifyError('Failed to unblock device.');
    }
  };

  // Simulate Multi-Account Attack
  const handleSimulateAttack = () => {
    const res = store.simulateMultiAccountAttack();
    loadSecurityData();
    notifySuccess(res.message);
  };

  // Clear Simulated Cheaters
  const handleClearSimulated = () => {
    const count = store.clearSimulatedCheaters();
    loadSecurityData();
    notifySuccess(`Removed ${count} simulated test accounts.`);
  };

  // Metrics
  const totalCheaterAccounts = fraudClusters.reduce((sum, c) => sum + c.totalAccounts, 0);
  const totalIllicitCoins = fraudClusters.reduce((sum, c) => sum + c.totalIllicitEldra, 0);
  const totalPendingAtRisk = fraudClusters.reduce((sum, c) => sum + c.totalPendingWithdrawals, 0);
  const unblockedClustersCount = fraudClusters.filter((c) => !c.isFullyBlocked).length;
  const blockedAccountsCount = allUsers.filter((u) => u.isBlocked).length;

  // Filtered clusters
  const filteredClusters = fraudClusters.filter((c) => {
    if (activeFilter === 'unblocked' && c.isFullyBlocked) return false;
    if (activeFilter === 'blocked' && !c.isFullyBlocked) return false;
    if (activeFilter === 'clones' && c.detectionType !== 'CLONE_APP') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchBadge = c.badgeName.toLowerCase().includes(q);
      const matchFp = c.primaryFingerprint.toLowerCase().includes(q);
      const matchUser = c.accounts.some(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.walletAddress && u.walletAddress.toLowerCase().includes(q))
      );
      if (!matchBadge && !matchFp && !matchUser) return false;
    }
    return true;
  });

  return (
    <div id="anti-cheat-security-panel" className="space-y-6 animate-in fade-in">
      {/* Alert Banners */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-300 text-sm font-semibold flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Security Overview & Control Command Header */}
      <div className="rounded-3xl bg-gradient-to-br from-[#1b1118] via-[#14121b] to-[#0d1117] border border-red-500/30 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-bold mb-3">
              <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
              <span>Anti-Sybil Engine &bull; Deep Hardware & Clone App Detector</span>
            </div>
            <h2 className="font-cinzel text-2xl sm:text-3xl font-extrabold text-zinc-100 flex items-center gap-3">
              Multi-Account & Clone Detection Badges
            </h2>
            <p className="text-zinc-400 text-sm mt-1 max-w-2xl leading-relaxed">
              Detects users running multiple accounts on a single physical device, operating inside Parallel Space / DualSpace clone app sandboxes, or funneling Eldra tokens to shared Solana payout addresses.
            </p>
          </div>

          {/* Quick Action Commands */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-run-deep-scan"
              onClick={handleDeepScan}
              disabled={isScanning}
              className="px-4 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
            >
              <RefreshCw className={`w-4 h-4 text-amber-400 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning Network...' : 'Run Deep Scan'}</span>
            </button>

            {unblockedClustersCount > 0 && (
              <button
                id="btn-master-block-all"
                onClick={() => setShowMasterBlockModal(true)}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-extrabold shadow-xl shadow-red-600/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
              >
                <Ban className="w-4 h-4" />
                <span>1-Click Block All Cheaters ({unblockedClustersCount} Badges)</span>
              </button>
            )}
          </div>
        </div>

        {/* Security Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-zinc-800/80">
          <div className="bg-black/40 p-3.5 rounded-2xl border border-red-500/20">
            <span className="text-[10px] uppercase font-bold text-red-400 block flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-red-400" /> Fraud Badges
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-cinzel text-xl font-bold text-red-300">
                {fraudClusters.length}
              </span>
              <span className="text-[10px] text-zinc-500">Clusters</span>
            </div>
            <span className="text-[10px] text-red-400/80 block mt-0.5">
              {unblockedClustersCount} Active Threat{unblockedClustersCount !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="bg-black/40 p-3.5 rounded-2xl border border-zinc-800">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block flex items-center gap-1.5">
              <UserX className="w-3 h-3 text-amber-400" /> Flagged Accounts
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-cinzel text-xl font-bold text-amber-300">
                {totalCheaterAccounts}
              </span>
              <span className="text-[10px] text-zinc-500">Users</span>
            </div>
            <span className="text-[10px] text-zinc-400 block mt-0.5">
              Across all badges
            </span>
          </div>

          <div className="bg-black/40 p-3.5 rounded-2xl border border-zinc-800">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block flex items-center gap-1.5">
              <Flame className="w-3 h-3 text-red-400" /> Illicit Eldra Coins
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-cinzel text-xl font-bold text-red-300">
                {totalIllicitCoins.toLocaleString()}
              </span>
              <span className="text-[10px] text-red-400/80">ELDRA</span>
            </div>
            <span className="text-[10px] text-zinc-400 block mt-0.5">
              Held by suspicious accounts
            </span>
          </div>

          <div className="bg-black/40 p-3.5 rounded-2xl border border-zinc-800">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-yellow-400" /> Pending Payouts Frozen
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-cinzel text-xl font-bold text-yellow-300">
                {totalPendingAtRisk.toLocaleString()}
              </span>
              <span className="text-[10px] text-yellow-400/80">ELDRA</span>
            </div>
            <span className="text-[10px] text-zinc-400 block mt-0.5">
              Auto-halted from dispatch
            </span>
          </div>

          <div className="bg-black/40 p-3.5 rounded-2xl border border-zinc-800">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block flex items-center gap-1.5">
              <Ban className="w-3 h-3 text-red-400" /> Permanently Blocked
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-cinzel text-xl font-bold text-zinc-200">
                {blockedAccountsCount}
              </span>
              <span className="text-[10px] text-zinc-500">Accounts</span>
            </div>
            <span className="text-[10px] text-emerald-400 block mt-0.5">
              Restricted from website
            </span>
          </div>

          <div className="bg-black/40 p-3.5 rounded-2xl border border-zinc-800">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block flex items-center gap-1.5">
              <HardDrive className="w-3 h-3 text-cyan-400" /> Blacklisted Devices
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="font-cinzel text-xl font-bold text-cyan-300">
                {blockedDevices.length}
              </span>
              <span className="text-[10px] text-cyan-400/80">Hardware IDs</span>
            </div>
            <span className="text-[10px] text-zinc-400 block mt-0.5">
              GPU & Canvas Hashes
            </span>
          </div>
        </div>

        {/* Simulation & Test Lab Bar for Admin */}
        <div className="mt-4 pt-4 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-400">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Sybil Attack Test Lab:</strong> Simulate multi-account attacks on cloned hardware to test badge grouping and 1-click batch bans.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-simulate-sybil-attack"
              onClick={handleSimulateAttack}
              className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Simulate Cloned App Attack</span>
            </button>
            <button
              id="btn-clear-simulated-cheaters"
              onClick={handleClearSimulated}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Test Bots</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/80 p-4 rounded-3xl border border-zinc-800">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            All Badges ({fraudClusters.length})
          </button>
          <button
            onClick={() => setActiveFilter('unblocked')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'unblocked'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Active Threats ({unblockedClustersCount})</span>
          </button>
          <button
            onClick={() => setActiveFilter('clones')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'clones'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            Clone App Sandboxes
          </button>
          <button
            onClick={() => setActiveFilter('blocked')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'blocked'
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            Fully Blocked ({fraudClusters.filter((c) => c.isFullyBlocked).length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search badge, user, wallet, hash..."
            className="w-full pl-9 pr-4 py-2 bg-black/60 border border-zinc-800 focus:border-red-500/50 rounded-2xl text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Fraud Clusters / Badges List */}
      {filteredClusters.length === 0 ? (
        <div className="text-center py-16 px-4 bg-zinc-900/40 rounded-3xl border border-zinc-800/80 space-y-3">
          <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="font-cinzel text-lg font-bold text-zinc-200">
            No Multi-Account Violations Detected
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            All registered users are operating from distinct physical hardware devices with clean fingerprint signatures.
          </p>
          <button
            onClick={handleSimulateAttack}
            className="mt-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Test Cloned Attack Cluster</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClusters.map((cluster) => {
            const isExpanded = expandedClusterId === cluster.clusterId;
            const unblockedMembers = cluster.accounts.filter((u) => !u.isBlocked);

            return (
              <div
                key={cluster.clusterId}
                className={`rounded-3xl border transition-all overflow-hidden ${
                  cluster.isFullyBlocked
                    ? 'bg-zinc-900/60 border-zinc-800 opacity-90'
                    : cluster.riskLevel === 'CRITICAL'
                    ? 'bg-[#150f16]/90 border-red-500/50 shadow-xl shadow-red-950/20'
                    : 'bg-[#14121a]/90 border-amber-500/40 shadow-xl shadow-amber-950/20'
                }`}
              >
                {/* Cluster / Badge Card Header */}
                <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase ${
                          cluster.isFullyBlocked
                            ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                            : cluster.riskLevel === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {cluster.isFullyBlocked ? 'Fully Blocked' : `${cluster.riskLevel} RISK`}
                      </span>

                      <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-semibold border border-zinc-700">
                        {cluster.detectionType === 'CLONE_APP'
                          ? 'Clone App Sandbox'
                          : cluster.detectionType === 'SHARED_WALLET'
                          ? 'Shared Solana Wallet'
                          : 'Hardware Collisions'}
                      </span>

                      <span className="text-xs text-zinc-400 font-mono">
                        ID: {cluster.clusterId}
                      </span>
                    </div>

                    <h3 className="font-cinzel text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
                      {cluster.badgeName}
                    </h3>

                    {/* Evidence & Details */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-zinc-400" />
                        <strong className="text-zinc-200">{cluster.totalAccounts}</strong> Accounts on same device
                      </span>
                      <span className="flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-red-400" />
                        <strong className="text-amber-300">{cluster.totalIllicitEldra.toLocaleString()}</strong> ELDRA holding
                      </span>
                      {cluster.totalPendingWithdrawals > 0 && (
                        <span className="flex items-center gap-1 text-yellow-300 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-yellow-400" />
                          {cluster.totalPendingWithdrawals.toLocaleString()} ELDRA pending payout
                        </span>
                      )}
                      {cluster.sharedWalletAddress && (
                        <span className="flex items-center gap-1 font-mono text-[11px] text-cyan-300">
                          <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                          {cluster.sharedWalletAddress.slice(0, 8)}...{cluster.sharedWalletAddress.slice(-6)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 1-Click Block & Actions */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {!cluster.isFullyBlocked ? (
                      <button
                        id={`btn-block-cluster-${cluster.clusterId}`}
                        onClick={() => setClusterToBlock(cluster)}
                        className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-extrabold shadow-lg shadow-red-600/30 flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
                      >
                        <Ban className="w-4 h-4" />
                        <span>1-Click Block Entire Badge ({unblockedMembers.length} Accounts)</span>
                      </button>
                    ) : (
                      <div className="px-3.5 py-2 rounded-2xl bg-zinc-800/80 border border-zinc-700 text-zinc-400 text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>All Accounts Blocked</span>
                      </div>
                    )}

                    <button
                      onClick={() => setExpandedClusterId(isExpanded ? null : cluster.clusterId)}
                      className="px-3.5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>{isExpanded ? 'Hide Accounts' : `View ${cluster.totalAccounts} Accounts`}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Evidence List Accordion / Summary */}
                <div className="px-5 sm:px-6 py-2.5 bg-black/40 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-zinc-400 font-semibold flex items-center gap-1">
                      <Fingerprint className="w-3.5 h-3.5 text-amber-400" />
                      Hardware Hash:
                    </span>
                    <code className="text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800 font-mono text-[11px]">
                      {cluster.primaryFingerprint}
                    </code>
                    <button
                      onClick={() => handleCopy(cluster.primaryFingerprint, `hw_${cluster.clusterId}`)}
                      className="text-zinc-400 hover:text-amber-300 transition-colors cursor-pointer"
                      title="Copy Hardware Hash"
                    >
                      {copiedText === `hw_${cluster.clusterId}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {cluster.detectedCloneMethod && (
                    <span className="text-[11px] text-purple-300 bg-purple-950/40 px-2.5 py-0.5 rounded-full border border-purple-800/40 flex items-center gap-1">
                      <Cpu className="w-3 h-3" />
                      {cluster.detectedCloneMethod}
                    </span>
                  )}
                </div>

                {/* Expanded Member Accounts Details */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 bg-black/70 border-t border-zinc-800/90 space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Accounts Operating on this Physical Device / Clone Container:
                      </h4>
                      <span className="text-xs text-zinc-400">
                        Total {cluster.accounts.length} linked accounts
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {cluster.accounts.map((user) => {
                        const isUserBlocked = user.isBlocked;

                        return (
                          <div
                            key={user.id}
                            className={`p-4 rounded-2xl border transition-all ${
                              isUserBlocked
                                ? 'bg-zinc-900/50 border-zinc-800 text-zinc-400'
                                : 'bg-zinc-900/90 border-red-500/30 shadow-lg'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-sm text-zinc-100">
                                    @{user.username || 'member'}
                                  </span>
                                  {isUserBlocked && (
                                    <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 text-[9px] font-bold">
                                      BLOCKED
                                    </span>
                                  )}
                                  {user.cloneAppDetected && (
                                    <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[9px] font-bold">
                                      CLONE
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-zinc-400 block mt-0.5 break-all">
                                  {user.email}
                                </span>
                              </div>

                              <div className="text-right">
                                <span className="font-cinzel text-sm font-bold text-amber-300 block">
                                  {user.balance.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-zinc-400">ELDRA</span>
                              </div>
                            </div>

                            {/* Wallet and details */}
                            <div className="mt-3 pt-3 border-t border-zinc-800/80 space-y-1.5 text-xs text-zinc-400">
                              <div className="flex items-center justify-between">
                                <span>Solana Wallet:</span>
                                <span className="font-mono text-[11px] text-zinc-300">
                                  {user.walletAddress
                                    ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
                                    : 'Not set'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Joined:</span>
                                <span className="text-zinc-300">
                                  {new Date(user.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              {user.cloneAppDetails && (
                                <div className="flex items-center justify-between text-[11px] text-purple-300">
                                  <span>Sandbox:</span>
                                  <span>{user.cloneAppDetails}</span>
                                </div>
                              )}
                            </div>

                            {/* User-Level Action */}
                            <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between gap-2">
                              <button
                                onClick={() => setSelectedInspectUser(user)}
                                className="text-xs text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
                              >
                                View Specs
                              </button>

                              {!isUserBlocked ? (
                                <button
                                  id={`btn-block-user-${user.id}`}
                                  onClick={() => setUserToBlock(user)}
                                  className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Block User</span>
                                </button>
                              ) : (
                                <button
                                  id={`btn-unblock-user-${user.id}`}
                                  onClick={() => handleUnblockSingleUser(user.id, user.username)}
                                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Unblock</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Permanently Blacklisted Physical Hardware Registry */}
      <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-cinzel text-lg font-bold text-zinc-100 flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-red-400" />
              Blacklisted Devices & Physical Hardware Signatures ({blockedDevices.length})
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              These hardware devices and cloned containers are strictly forbidden from creating accounts, claiming daily tokens, taking quizzes, or logging into the website.
            </p>
          </div>
        </div>

        {blockedDevices.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400 bg-black/40 rounded-2xl border border-zinc-800/60">
            No devices currently blacklisted.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-zinc-800">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-black/60 uppercase text-[10px] text-zinc-400 font-bold tracking-wider">
                <tr>
                  <th className="p-3.5">Device Fingerprint / Hardware Hash</th>
                  <th className="p-3.5">Linked Email</th>
                  <th className="p-3.5">Ban Reason</th>
                  <th className="p-3.5">Date Blocked</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 bg-zinc-950/40">
                {blockedDevices.map((dev, idx) => (
                  <tr key={idx} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="p-3.5 font-mono text-[11px]">
                      <div className="text-red-400 font-semibold">{dev.deviceId}</div>
                      {dev.hardwareHash && (
                        <div className="text-zinc-500 text-[10px]">Hash: {dev.hardwareHash}</div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <div className="text-zinc-200 font-semibold">{dev.attemptedEmail || dev.registeredEmail || 'N/A'}</div>
                      {dev.registeredUsername && (
                        <div className="text-zinc-400 text-[10px]">@{dev.registeredUsername}</div>
                      )}
                    </td>
                    <td className="p-3.5 max-w-xs text-zinc-400 break-words">
                      {dev.reason}
                    </td>
                    <td className="p-3.5 text-zinc-400 text-[11px]">
                      {new Date(dev.blockedAt).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleUnblockDevice(dev.deviceId)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold cursor-pointer transition-colors"
                      >
                        Unban Device
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1-CLICK BLOCK FRAUD CLUSTER / BADGE CONFIRMATION MODAL                   */}
      {/* ========================================================================= */}
      {clusterToBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#140e15] border border-red-500/50 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30">
                <Ban className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <h3 className="font-cinzel text-lg font-bold text-zinc-100">
                  1-Click Block Entire Fraud Badge
                </h3>
                <p className="text-xs text-red-300">
                  Permanently blacklist all multi-accounts on this physical device
                </p>
              </div>
            </div>

            <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Badge:</span>
                <span className="font-bold text-zinc-100">{clusterToBlock.badgeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Total Accounts to Block:</span>
                <span className="font-bold text-red-400">{clusterToBlock.totalAccounts} accounts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Total ELDRA to Freeze:</span>
                <span className="font-cinzel font-bold text-amber-300">
                  {clusterToBlock.totalIllicitEldra.toLocaleString()} ELDRA
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Hardware Profile:</span>
                <span className="font-mono text-[11px] text-zinc-300">{clusterToBlock.primaryFingerprint}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">
                Accounts in this Badge:
              </label>
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {clusterToBlock.accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="p-2 rounded-xl bg-black/50 border border-zinc-800 text-xs flex justify-between items-center"
                  >
                    <div>
                      <span className="font-bold text-zinc-200">@{acc.username}</span>
                      <span className="text-zinc-400 text-[11px] block">{acc.email}</span>
                    </div>
                    <span className="font-cinzel text-amber-300 font-bold">{acc.balance} ELDRA</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              This will permanently revoke website access for all {clusterToBlock.totalAccounts} accounts, auto-reject any pending withdrawals, and blacklist the physical hardware fingerprint from accessing Eldra Coin.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setClusterToBlock(null)}
                className="w-1/2 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-block-cluster"
                onClick={handleConfirmBlockCluster}
                className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-extrabold shadow-lg shadow-red-600/30 flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:scale-105"
              >
                <Ban className="w-4 h-4" />
                <span>Confirm 1-Click Block</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1-CLICK MASTER BAN ALL CONFIRMATION MODAL                                  */}
      {/* ========================================================================= */}
      {showMasterBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#170e17] border border-red-500/60 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 rounded-2xl bg-red-500/20 border border-red-500/40">
                <ShieldAlert className="w-7 h-7 text-red-400 animate-pulse" />
              </div>
              <div>
                <h3 className="font-cinzel text-lg font-bold text-zinc-100">
                  Master 1-Click Ban All Cheaters
                </h3>
                <p className="text-xs text-red-300">
                  Platform-Wide Sybil & Clone App Enforcement
                </p>
              </div>
            </div>

            <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Unblocked Fraud Badges:</span>
                <span className="font-bold text-red-400">{unblockedClustersCount} Badges</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Total Cheater Accounts:</span>
                <span className="font-bold text-zinc-100">{totalCheaterAccounts} Users</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Total Illicit ELDRA Frozen:</span>
                <span className="font-cinzel font-bold text-amber-300">
                  {totalIllicitCoins.toLocaleString()} ELDRA
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to 1-Click ban <strong>all identified multi-accounting rings and clone app sandboxes</strong> across the platform? All accounts will be immediately blocked and their hardware fingerprints blacklisted.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowMasterBlockModal(false)}
                className="w-1/2 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-master-ban"
                onClick={handleConfirmMasterBlock}
                className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-extrabold shadow-lg shadow-red-600/30 flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:scale-105"
              >
                <Ban className="w-4 h-4" />
                <span>Execute Master Ban</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SINGLE USER BLOCK MODAL                                                   */}
      {/* ========================================================================= */}
      {userToBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#140f16] border border-red-500/50 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30">
                <UserX className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <h3 className="font-cinzel text-lg font-bold text-zinc-100">
                  Block User @{userToBlock.username}
                </h3>
                <p className="text-xs text-red-300">
                  Revoke account access & blacklist device
                </p>
              </div>
            </div>

            <div className="bg-zinc-900/90 p-3.5 rounded-2xl border border-zinc-800 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Email:</span>
                <span className="text-zinc-200 font-semibold">{userToBlock.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Current Balance:</span>
                <span className="font-cinzel font-bold text-amber-300">{userToBlock.balance} ELDRA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Hardware Fingerprint:</span>
                <span className="font-mono text-[11px] text-zinc-300">
                  {userToBlock.hardwareHash || userToBlock.deviceFingerprint || 'Unknown'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Reason for Permanent Suspension:
              </label>
              <textarea
                value={blockReasonInput}
                onChange={(e) => setBlockReasonInput(e.target.value)}
                rows={2}
                className="w-full p-3 bg-black/60 border border-zinc-700 rounded-xl text-xs text-zinc-200 focus:border-red-500 outline-none"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setUserToBlock(null)}
                className="w-1/2 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-block-single-user"
                onClick={handleConfirmBlockSingleUser}
                className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-extrabold shadow-lg shadow-red-600/30 flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:scale-105"
              >
                <Ban className="w-4 h-4" />
                <span>Confirm Block</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* USER HARDWARE INSPECTION MODAL                                           */}
      {/* ========================================================================= */}
      {selectedInspectUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#12141c] border border-zinc-700 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30">
                  <Fingerprint className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-cinzel text-lg font-bold text-zinc-100">
                    Hardware & Telemetry Profile
                  </h3>
                  <p className="text-xs text-zinc-400">
                    @{selectedInspectUser.username} ({selectedInspectUser.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInspectUser(null)}
                className="text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-black/60 p-4 rounded-2xl border border-zinc-800 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Device ID:</span>
                <span className="font-mono text-zinc-300">
                  {selectedInspectUser.deviceFingerprint || 'Not registered'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Hardware GPU Hash:</span>
                <span className="font-mono text-amber-300">
                  {selectedInspectUser.hardwareHash || 'Computed on next action'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Cloned App Detected:</span>
                <span className={selectedInspectUser.cloneAppDetected ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                  {selectedInspectUser.cloneAppDetected ? `YES (${selectedInspectUser.cloneAppDetails})` : 'NO (Clean Device)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Fraud Risk Score:</span>
                <span className="font-bold text-amber-400">
                  {selectedInspectUser.fraudRiskScore || 0}/100
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Account Status:</span>
                <span className={selectedInspectUser.isBlocked ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                  {selectedInspectUser.isBlocked ? 'PERMANENTLY BLOCKED' : 'ACTIVE & VERIFIED'}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedInspectUser(null)}
                className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
