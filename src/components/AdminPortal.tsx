import React, { useState, useEffect } from 'react';
import { EducationalModule, QuizQuestion, User, WithdrawalBatch, WithdrawalRequest, FraudCluster } from '../types';
import { store } from '../services/store';
import { AntiCheatSecurityPanel } from './AntiCheatSecurityPanel';
import {
  ShieldCheck,
  ShieldAlert,
  Plus,
  Trash2,
  Edit,
  Save,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Link as LinkIcon,
  Globe,
  Award,
  Layers,
  Clock,
  Eye,
  ExternalLink,
  ArrowUpRight,
  Download,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Wallet,
  Users,
  Filter,
  RefreshCw,
  Send,
  Flame,
  AtSign,
  Sparkles,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  FileText,
  Play,
  CheckCheck,
  AlertTriangle,
  CheckSquare,
  Square,
  Trash,
  Code,
  Zap,
  X,
} from 'lucide-react';

interface AdminPortalProps {
  currentUser: User | null;
  setActiveTab: (tab: string) => void;
  adminSection?: 'withdrawals' | 'security' | 'claims' | 'quizzes';
  setAdminSection?: (section: 'withdrawals' | 'security' | 'claims' | 'quizzes') => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentUser,
  setActiveTab,
  adminSection: propAdminSection,
  setAdminSection: propSetAdminSection,
}) => {
  const [internalAdminSection, setInternalAdminSection] = useState<'withdrawals' | 'security' | 'claims' | 'quizzes'>('withdrawals');
  
  const adminSection = propAdminSection ?? internalAdminSection;
  const setAdminSection = (sec: 'withdrawals' | 'security' | 'claims' | 'quizzes') => {
    setInternalAdminSection(sec);
    if (propSetAdminSection) {
      propSetAdminSection(sec);
    }
  };
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // --- COMMUNITY CLAIM STATS ---
  const communityStats = store.getCommunityClaimStats();
  const fraudClusters = store.getFraudClusters();
  const activeThreatsCount = fraudClusters.filter((c) => !c.isFullyBlocked).length;

  // --- WITHDRAWAL STATE ---
  const [selectedBatchId, setSelectedBatchId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [copiedMultisend, setCopiedMultisend] = useState(false);
  const [copiedAddressesOnly, setCopiedAddressesOnly] = useState(false);
  const [copiedWalletId, setCopiedWalletId] = useState<string | null>(null);

  // 24H Bulk Transfer Modal State
  const [bulkModalBatch, setBulkModalBatch] = useState<WithdrawalBatch | null>(null);
  const [bulkModalFormat, setBulkModalFormat] = useState<'comma' | 'space' | 'tab' | 'addresses_only' | 'amounts_only' | 'json'>('comma');
  const [copiedModalBulk, setCopiedModalBulk] = useState(false);
  const [batchToApproveModal, setBatchToApproveModal] = useState<WithdrawalBatch | null>(null);
  const [showApproveAllModal, setShowApproveAllModal] = useState(false);
  const [cycleCountdown, setCycleCountdown] = useState<string>(store.get24HourCycleTimeRemaining().formatted);

  // Live 24H countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCycleCountdown(store.get24HourCycleTimeRemaining().formatted);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Reject Modal State
  const [rejectingRequest, setRejectingRequest] = useState<WithdrawalRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('Invalid Solana wallet address / Verification needed');

  // Single Approve Modal State
  const [approvingRequest, setApprovingRequest] = useState<WithdrawalRequest | null>(null);
  const [customTxHash, setCustomTxHash] = useState('');

  // Batches & Requests data
  const batches = store.get24HourWithdrawalBatches();
  const allWithdrawals = store.getAllWithdrawals();

  // Selected Batch data
  const currentBatch = selectedBatchId !== 'all' ? batches.find((b) => b.batchId === selectedBatchId) : null;

  // Filtered requests list
  const filteredWithdrawals = allWithdrawals.filter((w) => {
    if (selectedBatchId !== 'all' && w.batchId !== selectedBatchId) return false;
    if (statusFilter !== 'all' && w.status !== statusFilter) return false;
    return true;
  });

  const pendingInSelectedBatch = filteredWithdrawals.filter((w) => w.status === 'pending');
  const totalPendingAmountInBatch = pendingInSelectedBatch.reduce((sum, w) => sum + w.amount, 0);

  // --- QUIZ & MODULES STATE ---
  const modules = store.getAllModulesForAdmin();
  const [isEditingId, setIsEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [categoryPreset, setCategoryPreset] = useState('Solana & Blockchain');
  const [customCategory, setCustomCategory] = useState('');
  const [summary, setSummary] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [readTimeMinutes, setReadTimeMinutes] = useState<number>(4);
  const [passingScorePercentage, setPassingScorePercentage] = useState<number>(75);
  const [completionBonus, setCompletionBonus] = useState<number>(20);
  const [perQuestionReward, setPerQuestionReward] = useState<number>(2);
  const [durationHours, setDurationHours] = useState<number>(24);
  const [isPublished, setIsPublished] = useState<boolean>(true);
  const [autoDeletePrevious, setAutoDeletePrevious] = useState<boolean>(false);
  const [quizFilter, setQuizFilter] = useState<'all' | 'active' | 'expired' | 'drafts'>('all');
  const [quizSearchQuery, setQuizSearchQuery] = useState('');
  const [copiedLinkQuizId, setCopiedLinkQuizId] = useState<string | null>(null);
  const [selectedQuizIds, setSelectedQuizIds] = useState<string[]>([]);
  const [quizToDelete, setQuizToDelete] = useState<EducationalModule | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState<boolean>(false);
  const [showDeleteSelectedModal, setShowDeleteSelectedModal] = useState<boolean>(false);

  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      id: 'q-1',
      question: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0,
      explanation: '',
      rewardAmount: 2,
    },
  ]);

  const POPULAR_SOURCES = [
    { label: 'Solana Docs', url: 'https://docs.solana.com/introduction' },
    { label: 'Solana Whitepaper', url: 'https://solana.com/solana-whitepaper.pdf' },
    { label: 'Solana Developers', url: 'https://solana.com/developers' },
    { label: 'Solana Pay Specs', url: 'https://docs.solanapay.com' },
    { label: 'Solana Security', url: 'https://solana.com/security' },
    { label: 'Eldra Cluster', url: 'https://docs.solana.com/cluster/overview' },
  ];

  const SAMPLE_TEMPLATES = [
    {
      name: 'Solana High-Speed Architecture',
      title: 'Solana High-Throughput Architecture & Proof of History',
      category: 'Solana & Blockchain',
      summary: 'Explore how Solana achieves sub-second finality, 65,000+ TPS throughput, and fractional-cent fees through Proof of History (PoH) and Tower BFT consensus.',
      externalUrl: 'https://docs.solana.com/introduction',
      readTimeMinutes: 4,
      passingScorePercentage: 75,
      completionBonus: 20,
      perQuestionReward: 2,
      durationHours: 24,
      questions: [
        {
          id: 't-1',
          question: 'What core cryptographic innovation allows Solana to order transactions without waiting for global validator agreement?',
          options: ['Proof of Work (PoW)', 'Proof of History (PoH)', 'Proof of Space', 'Delegated Byzantine Mining'],
          correctOptionIndex: 1,
          explanation: 'Proof of History creates a verifiable delay function (VDF) timestamping transactions before consensus.',
          rewardAmount: 2,
        },
        {
          id: 't-2',
          question: 'Approximately how fast is block confirmation (slot time) on Solana mainnet?',
          options: ['10 minutes', '1 minute', '~400 milliseconds', '15 seconds'],
          correctOptionIndex: 2,
          explanation: 'Solana produces blocks roughly every 400 milliseconds, enabling near-instant transaction finality.',
          rewardAmount: 2,
        },
        {
          id: 't-3',
          question: 'Why are transaction fees on Solana typically under $0.001 per transfer?',
          options: ['Subsidized by miners', 'Parallelized Sealevel smart contracts engine & Gulf Stream', 'Because Solana does not execute smart contracts', 'Because only 1 node validates'],
          correctOptionIndex: 1,
          explanation: 'Parallel transaction execution via Sealevel prevents network congestion, maintaining ultra-low fees.',
          rewardAmount: 2,
        },
        {
          id: 't-4',
          question: 'What is the native utility and gas token powering the Solana blockchain?',
          options: ['ETH', 'BTC', 'SOL', 'USDC'],
          correctOptionIndex: 2,
          explanation: 'SOL is the native utility and gas token powering the Solana blockchain.',
          rewardAmount: 2,
        },
      ],
    },
    {
      name: 'Eldra Tokenomics & Faucet System',
      title: 'Eldra Token Distribution, Faucets & Community Incentives',
      category: 'Eldra Tokenomics',
      summary: 'Learn about Eldra Coin tokenomics, daily faucet claims, referral multiplier mechanics, quiz rewards, and 24-hour batch withdrawal settlement.',
      externalUrl: 'https://docs.solana.com/cluster/overview',
      readTimeMinutes: 3,
      passingScorePercentage: 75,
      completionBonus: 20,
      perQuestionReward: 2,
      durationHours: 24,
      questions: [
        {
          id: 't-1',
          question: 'How often can an active Eldra member claim tokens from the Daily Faucet?',
          options: ['Every 1 hour', 'Every 12 hours', 'Once every 24 hours', 'Once a week'],
          correctOptionIndex: 2,
          explanation: 'The daily faucet can be claimed exactly once every 24 hours per member.',
          rewardAmount: 2,
        },
        {
          id: 't-2',
          question: 'How many ELDRA tokens does a member earn for successfully inviting a verified friend?',
          options: ['1 ELDRA', '5 ELDRA', '10 ELDRA', '25 ELDRA'],
          correctOptionIndex: 1,
          explanation: 'Referrers earn a 5 ELDRA bonus for each friend who registers with their referral handle or code.',
          rewardAmount: 2,
        },
        {
          id: 't-3',
          question: 'What bonus jackpot is rewarded upon scoring at or above the passing grade on educational quizzes?',
          options: ['5 ELDRA', '10 ELDRA', '20 ELDRA', '50 ELDRA'],
          correctOptionIndex: 2,
          explanation: 'Passing the educational chapter quiz awards a +20 ELDRA completion jackpot on top of question rewards.',
          rewardAmount: 2,
        },
        {
          id: 't-4',
          question: 'How are Solana user withdrawals processed by administrators?',
          options: ['Manual 1-by-1 paper checks', 'Compiled into daily 24-hour batches for bulk disperse payout', 'Instant automated smart contract liquidation only', 'Never processed'],
          correctOptionIndex: 1,
          explanation: 'Withdrawals are organized into 24-hour compilation batches for secure bulk multisend and CSV export.',
          rewardAmount: 2,
        },
      ],
    },
    {
      name: 'Solana Pay & Fast Merchant Settlement',
      title: 'Solana Pay: Decentralized Point-of-Sale & Commerce',
      category: 'Solana DeFi & Pay',
      summary: 'Discover how Solana Pay enables direct peer-to-merchant token transfers with zero intermediary fees and sub-second payment confirmation.',
      externalUrl: 'https://docs.solanapay.com',
      readTimeMinutes: 4,
      passingScorePercentage: 75,
      completionBonus: 20,
      perQuestionReward: 2,
      durationHours: 48,
      questions: [
        {
          id: 't-1',
          question: 'What is Solana Pay?',
          options: ['A centralized credit card processor', 'An open, decentralized payment standard for digital asset commerce on Solana', 'A hardware wallet device', 'A fiat banking license'],
          correctOptionIndex: 1,
          explanation: 'Solana Pay is an open-source protocol facilitating direct, frictionless crypto payments between consumers and merchants.',
          rewardAmount: 2,
        },
        {
          id: 't-2',
          question: 'What format is commonly used by customers to trigger a Solana Pay transaction?',
          options: ['Paper check', 'QR Code scan with Solana wallet', 'Magnetic stripe swipe', 'Manual wire transfer form'],
          correctOptionIndex: 1,
          explanation: 'Customers simply scan a QR code specifying the transfer request with their Solana mobile wallet.',
          rewardAmount: 2,
        },
        {
          id: 't-3',
          question: 'What is a key merchant advantage of using Solana Pay over traditional credit card rails?',
          options: ['3% to 5% processing fees', 'Instant settlement with virtually zero intermediary chargeback fees', '3-day pending bank holds', 'Mandatory terminal rental contracts'],
          correctOptionIndex: 1,
          explanation: 'Merchants receive funds in seconds with sub-cent network fees and no merchant interchange fees.',
          rewardAmount: 2,
        },
      ],
    },
    {
      name: 'Web3 & Wallet Security Best Practices',
      title: 'Securing Your Solana Wallet, Seed Phrases & Phishing Defense',
      category: 'Web3 Security & Wallets',
      summary: 'Essential security guidelines for protecting your private keys, secret recovery seed phrases, avoiding malicious dApps, and using hardware wallets.',
      externalUrl: 'https://solana.com/security',
      readTimeMinutes: 5,
      passingScorePercentage: 80,
      completionBonus: 20,
      perQuestionReward: 2,
      durationHours: 168,
      questions: [
        {
          id: 't-1',
          question: 'Who should you share your 12 or 24-word Secret Recovery Seed Phrase with?',
          options: ['Support staff on Discord/Telegram', 'Anyone offering free tokens', 'Nobody — never share your seed phrase with anyone', 'Web browser extensions requesting verification'],
          correctOptionIndex: 2,
          explanation: 'Never share your seed phrase. Anyone with access to your seed phrase can steal all your assets permanently.',
          rewardAmount: 2,
        },
        {
          id: 't-2',
          question: 'What is the most secure way to store high-value crypto assets?',
          options: ['Screenshot on smartphone camera roll', 'Text file on desktop', 'Hardware wallet (cold storage device) kept offline', 'Email draft to yourself'],
          correctOptionIndex: 2,
          explanation: 'Hardware cold storage wallets keep private keys completely isolated from internet-connected devices.',
          rewardAmount: 2,
        },
        {
          id: 't-3',
          question: 'What should you always verify before approving a transaction or connecting your wallet to a dApp?',
          options: ['Check that the background color is pretty', 'Verify the exact browser URL and transaction simulation details', 'Click approve as quickly as possible', 'Send double tokens to receive triple'],
          correctOptionIndex: 1,
          explanation: 'Always inspect the exact domain name and simulate transaction permissions before signing.',
          rewardAmount: 2,
        },
      ],
    },
  ];

  // --- USER MANAGEMENT MODAL STATES ---
  const [selectedUserForAction, setSelectedUserForAction] = useState<User | null>(null);
  const [userBalanceInput, setUserBalanceInput] = useState<number>(0);
  const [balanceAdjustReason, setBalanceAdjustReason] = useState<string>('Admin grant / correction');
  const [grantAmountInput, setGrantAmountInput] = useState<number>(10);
  const [showDeleteUserConfirm, setShowDeleteUserConfirm] = useState<boolean>(false);

  // --- CSV DOWNLOAD HELPER ---
  const downloadCsv = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadBatchCsv = () => {
    const batchIdParam = selectedBatchId !== 'all' ? selectedBatchId : undefined;
    const csvData = store.generateWithdrawalsCsv(statusFilter, batchIdParam);
    const filename = `eldra_withdrawals_${selectedBatchId !== 'all' ? selectedBatchId : 'all'}_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsv(csvData, filename);
    setSuccessMsg('Withdrawals CSV generated and downloaded successfully! 📥');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleCopyBulkMultisend = () => {
    const batchIdParam = selectedBatchId !== 'all' ? selectedBatchId : undefined;
    const multisendText = store.generateBulkMultisendText(statusFilter, batchIdParam);
    if (!multisendText.trim()) {
      setErrorMsg('No withdrawal records found matching the current batch/filter.');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    navigator.clipboard.writeText(multisendText);
    setCopiedMultisend(true);
    setSuccessMsg(`Copied ${multisendText.split('\n').length} recipient lines in standard (wallet_address,amount) format for bulk sending! 📋`);
    setTimeout(() => {
      setCopiedMultisend(false);
      setSuccessMsg(null);
    }, 4000);
  };

  const handleCopyBulkAddressesOnly = () => {
    const batchIdParam = selectedBatchId !== 'all' ? selectedBatchId : undefined;
    const addressesText = store.generateBulkAddressesOnly(statusFilter, batchIdParam);
    if (!addressesText.trim()) {
      setErrorMsg('No wallet addresses found matching the current batch/filter.');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    navigator.clipboard.writeText(addressesText);
    setCopiedAddressesOnly(true);
    const count = addressesText.split('\n').filter((l) => l.trim()).length;
    setSuccessMsg(`Copied all ${count} Solana wallet addresses all together for bulk transfer! 📋`);
    setTimeout(() => {
      setCopiedAddressesOnly(false);
      setSuccessMsg(null);
    }, 4000);
  };

  const handleCopyWalletAddress = (address: string, id: string) => {
    navigator.clipboard.writeText(address);
    setCopiedWalletId(id);
    setTimeout(() => setCopiedWalletId(null), 2000);
  };

  // --- BATCH APPROVAL ACTION ---
  const handleApproveSpecificBatch = (targetBatchId: string) => {
    const batch = batches.find((b) => b.batchId === targetBatchId);
    if (!batch || batch.pendingCount === 0) {
      setErrorMsg('There are no pending withdrawals in this batch badge to approve.');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    if (
      window.confirm(
        `Bulk Payout Confirmation:\n\nApprove ALL ${batch.pendingCount} pending withdrawals (${batch.totalAmount} ELDRA total) in ${batch.batchDate}?\n\nThis will automatically mark all requests in this withdrawal badge as approved and update all user balances!`
      )
    ) {
      const res = store.approveBatchWithdrawals(targetBatchId, currentUser?.email);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        setErrorMsg(res.message);
        setTimeout(() => setErrorMsg(null), 3000);
      }
    }
  };

  const handleApproveWholeBatch = () => {
    if (selectedBatchId === 'all') {
      // If "all" is selected, approve all pending batches
      const allPending = allWithdrawals.filter((w) => w.status === 'pending');
      if (allPending.length === 0) {
        setErrorMsg('There are no pending withdrawals to approve.');
        setTimeout(() => setErrorMsg(null), 3000);
        return;
      }

      if (
        window.confirm(
          `Approve ALL ${allPending.length} pending withdrawals across all batches (${totalPendingAllTime} ELDRA total)?`
        )
      ) {
        // Approve each pending batch
        const pendingBatches = batches.filter((b) => b.pendingCount > 0);
        let totalCount = 0;
        pendingBatches.forEach((b) => {
          const res = store.approveBatchWithdrawals(b.batchId, currentUser?.email);
          if (res.success) totalCount += res.count;
        });
        setSuccessMsg(`Successfully approved all ${totalCount} pending withdrawals across all badges! 🚀`);
        setTimeout(() => setSuccessMsg(null), 5000);
      }
      return;
    }

    handleApproveSpecificBatch(selectedBatchId);
  };

  // --- SINGLE APPROVE ACTION ---
  const handleConfirmSingleApprove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingRequest) return;

    const res = store.approveWithdrawal(
      approvingRequest.id,
      currentUser?.email,
      customTxHash.trim() || undefined
    );

    if (res.success) {
      setSuccessMsg(res.message);
      setApprovingRequest(null);
      setCustomTxHash('');
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(res.message);
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  // --- SINGLE REJECT ACTION ---
  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRequest) return;

    const res = store.rejectWithdrawal(rejectingRequest.id, rejectReason);
    if (res.success) {
      setSuccessMsg(res.message);
      setRejectingRequest(null);
      setRejectReason('Invalid Solana wallet address / Verification needed');
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(res.message);
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  // --- QUIZ HANDLERS ---
  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: `q-${Date.now()}-${prev.length + 1}`,
        question: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        explanation: '',
        rewardAmount: perQuestionReward || 2,
      },
    ]);
  };

  const handleDuplicateQuestion = (index: number) => {
    const orig = questions[index];
    if (!orig) return;
    const duplicated: QuizQuestion = {
      ...orig,
      id: `q-${Date.now()}-${questions.length + 1}`,
      question: `${orig.question} (Copy)`,
      options: [...orig.options],
    };
    const updated = [...questions];
    updated.splice(index + 1, 0, duplicated);
    setQuestions(updated);
    setSuccessMsg(`Question #${index + 1} duplicated.`);
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const handleMoveQuestionUp = (index: number) => {
    if (index === 0) return;
    setQuestions((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleMoveQuestionDown = (index: number) => {
    if (index === questions.length - 1) return;
    setQuestions((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 1) {
      setErrorMsg('A quiz must contain at least one question.');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuestionTextChange = (index: number, text: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], question: text };
      return copy;
    });
  };

  const handleOptionChange = (qIndex: number, optIndex: number, text: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const newOptions = [...copy[qIndex].options];
      newOptions[optIndex] = text;
      copy[qIndex] = { ...copy[qIndex], options: newOptions };
      return copy;
    });
  };

  const handleCorrectOptionChange = (qIndex: number, optIndex: number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], correctOptionIndex: optIndex };
      return copy;
    });
  };

  const handleExplanationChange = (qIndex: number, text: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], explanation: text };
      return copy;
    });
  };

  const handleQuestionRewardChange = (qIndex: number, reward: number) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], rewardAmount: reward };
      return copy;
    });
  };

  const resetForm = () => {
    setIsEditingId(null);
    setTitle('');
    setCategoryPreset('Solana & Blockchain');
    setCustomCategory('');
    setSummary('');
    setExternalUrl('');
    setReadTimeMinutes(4);
    setPassingScorePercentage(75);
    setCompletionBonus(20);
    setPerQuestionReward(2);
    setDurationHours(24);
    setIsPublished(true);
    setAutoDeletePrevious(false);
    setQuestions([
      {
        id: `q-${Date.now()}-1`,
        question: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        explanation: '',
        rewardAmount: 2,
      },
    ]);
  };

  const handleEditModule = (m: EducationalModule) => {
    setIsEditingId(m.id);
    setTitle(m.title);
    
    // Check if category is standard
    const standardCategories = ['Solana & Blockchain', 'Eldra Tokenomics', 'Solana DeFi & Pay', 'Web3 Security & Wallets', 'Smart Contracts'];
    if (standardCategories.includes(m.category)) {
      setCategoryPreset(m.category);
      setCustomCategory('');
    } else {
      setCategoryPreset('Custom');
      setCustomCategory(m.category);
    }

    setSummary(m.summary);
    setExternalUrl(m.externalUrl || '');
    setReadTimeMinutes(m.readTimeMinutes || 4);
    setPassingScorePercentage(m.passingScorePercentage || 75);
    setCompletionBonus(m.completionBonus !== undefined ? m.completionBonus : 20);
    setIsPublished(m.isPublished !== false);

    // Calculate duration
    if (m.expiresAt && m.createdAt) {
      const created = new Date(m.createdAt).getTime();
      const diffHours = Math.round((m.expiresAt - created) / (1000 * 60 * 60));
      if (diffHours >= 160) setDurationHours(168);
      else if (diffHours >= 40) setDurationHours(48);
      else setDurationHours(24);
    } else {
      setDurationHours(0); // Permanent
    }

    setQuestions(
      m.questions?.length
        ? m.questions.map((q, idx) => ({
            id: q.id || `q-${Date.now()}-${idx + 1}`,
            question: q.question,
            options: q.options && q.options.length >= 4 ? q.options : [q.options?.[0] || '', q.options?.[1] || '', q.options?.[2] || '', q.options?.[3] || ''],
            correctOptionIndex: q.correctOptionIndex !== undefined ? q.correctOptionIndex : 0,
            explanation: q.explanation || '',
            rewardAmount: q.rewardAmount || 2,
          }))
        : [
            {
              id: `q-${Date.now()}-1`,
              question: '',
              options: ['', '', '', ''],
              correctOptionIndex: 0,
              explanation: '',
              rewardAmount: 2,
            },
          ]
    );

    window.scrollTo({ top: 300, behavior: 'smooth' });
    setSuccessMsg(`Loaded "${m.title}" into editor.`);
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const handleDeleteModule = (id: string) => {
    const target = modules.find((m) => m.id === id);
    if (target) {
      setQuizToDelete(target);
    } else {
      store.deleteEducationalModule(id);
      if (isEditingId === id) resetForm();
      setSelectedQuizIds((prev) => prev.filter((item) => item !== id));
      setSuccessMsg('Quiz & article deleted successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const handleConfirmDeleteSingleQuiz = (m: EducationalModule) => {
    store.deleteEducationalModule(m.id);
    if (isEditingId === m.id) resetForm();
    setSelectedQuizIds((prev) => prev.filter((item) => item !== m.id));
    setQuizToDelete(null);
    setSuccessMsg(`"${m.title}" was permanently deleted.`);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleToggleSelectQuiz = (id: string) => {
    setSelectedQuizIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisibleQuizzes = (visibleIds: string[]) => {
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedQuizIds.includes(id));
    if (allSelected) {
      setSelectedQuizIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedQuizIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleConfirmDeleteSelected = () => {
    if (selectedQuizIds.length === 0) return;
    const count = store.deleteMultipleModules(selectedQuizIds);
    if (isEditingId && selectedQuizIds.includes(isEditingId)) {
      resetForm();
    }
    setSelectedQuizIds([]);
    setShowDeleteSelectedModal(false);
    setSuccessMsg(`Successfully deleted ${count} selected quiz articles.`);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleConfirmDeleteAll = () => {
    store.deleteAllModules();
    resetForm();
    setSelectedQuizIds([]);
    setShowDeleteAllModal(false);
    setSuccessMsg('All quizzes and article links have been deleted.');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleRenewModule = (id: string, hours: number = 24) => {
    const success = store.renewModule(id, hours);
    if (success) {
      setSuccessMsg(`Quiz renewed successfully for +${hours} hours! ⚡`);
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  const handleTogglePublish = (id: string) => {
    store.togglePublishModule(id);
    setSuccessMsg('Quiz publish status updated.');
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const handleDuplicateQuiz = (id: string) => {
    const cloned = store.duplicateModule(id);
    if (cloned) {
      setSuccessMsg(`Quiz duplicated: "${cloned.title}"`);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const handleResetAttempts = (moduleId: string, moduleTitle: string) => {
    if (confirm(`Reset all user attempts for "${moduleTitle}"? Users will be able to take this quiz again.`)) {
      const resetCount = store.adminResetModuleAttempts(moduleId);
      setSuccessMsg(`Cleared ${resetCount} recorded attempt(s). Members can retake the quiz!`);
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  const handleRestoreDefaults = () => {
    if (confirm('Restore default official Solana & Eldra quizzes? This will refresh initial educational chapters.')) {
      store.restoreDefaultModules();
      setSuccessMsg('Default official educational modules restored! 🎉');
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  const handleLoadTemplate = (templateIndex: number) => {
    const t = SAMPLE_TEMPLATES[templateIndex];
    if (!t) return;
    setTitle(t.title);
    setCategoryPreset(t.category);
    setCustomCategory('');
    setSummary(t.summary);
    setExternalUrl(t.externalUrl);
    setReadTimeMinutes(t.readTimeMinutes);
    setPassingScorePercentage(t.passingScorePercentage);
    setCompletionBonus(t.completionBonus);
    setPerQuestionReward(t.perQuestionReward);
    setDurationHours(t.durationHours);
    setQuestions(
      t.questions.map((q, idx) => ({
        id: `q-${Date.now()}-${idx + 1}`,
        question: q.question,
        options: [...q.options],
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation,
        rewardAmount: q.rewardAmount,
      }))
    );
    setSuccessMsg(`Loaded preset template: "${t.name}"!`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleSelectPopularSource = (url: string) => {
    setExternalUrl(url);
  };

  const handleTestUrl = (urlToTest: string) => {
    let cleanUrl = urlToTest.trim();
    if (!cleanUrl) {
      setErrorMsg('Please enter a valid URL first.');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }
    window.open(cleanUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyQuizLink = (quizUrl: string, quizId: string) => {
    navigator.clipboard.writeText(quizUrl);
    setCopiedLinkQuizId(quizId);
    setTimeout(() => setCopiedLinkQuizId(null), 2500);
  };

  const handleSaveModule = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setErrorMsg('Please enter a Quiz & Chapter Title.');
      window.scrollTo({ top: 200, behavior: 'smooth' });
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }
    if (!externalUrl.trim()) {
      setErrorMsg('Please provide the External Educational Link URL for learners to read.');
      window.scrollTo({ top: 300, behavior: 'smooth' });
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }
    if (!summary.trim()) {
      setErrorMsg('Please provide a brief Overview Summary / Learning Objectives.');
      window.scrollTo({ top: 400, behavior: 'smooth' });
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    const effectiveCategory = categoryPreset === 'Custom' 
      ? (customCategory.trim() || 'General Web3')
      : categoryPreset;

    if (!questions || questions.length === 0) {
      setErrorMsg('Please add at least 1 comprehension question for this quiz.');
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setErrorMsg(`Question #${i + 1} is missing question text.`);
        setTimeout(() => setErrorMsg(null), 4000);
        return;
      }
      if (q.options.some((opt) => !opt.trim())) {
        setErrorMsg(`Question #${i + 1} has empty options. Please fill in all 4 choices (A, B, C, D).`);
        setTimeout(() => setErrorMsg(null), 4000);
        return;
      }
    }

    const now = Date.now();
    const expiresAt = durationHours > 0 ? now + durationHours * 60 * 60 * 1000 : undefined;

    let cleanUrl = externalUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    if (isEditingId) {
      store.updateEducationalModule(isEditingId, {
        title: title.trim(),
        category: effectiveCategory,
        summary: summary.trim(),
        externalUrl: cleanUrl,
        readTimeMinutes: Number(readTimeMinutes) || 4,
        completionBonus: Number(completionBonus) || 20,
        passingScorePercentage: Number(passingScorePercentage) || 75,
        questions,
        expiresAt,
        isPublished,
      });
      setSuccessMsg('Educational article link & quiz updated successfully! 🎓');
    } else {
      store.addEducationalModule(
        {
          title: title.trim(),
          category: effectiveCategory,
          summary: summary.trim(),
          externalUrl: cleanUrl,
          readTimeMinutes: Number(readTimeMinutes) || 4,
          completionBonus: Number(completionBonus) || 20,
          passingScorePercentage: Number(passingScorePercentage) || 75,
          questions,
          expiresAt,
          isPublished,
        },
        autoDeletePrevious
      );
      setSuccessMsg(
        autoDeletePrevious
          ? 'New quiz published! Previous quizzes replaced. Learners can now read and earn (+20 ELDRA Bonus) 🎉'
          : 'New educational article link & quiz posted successfully! (+20 ELDRA Bonus) 🎉'
      );
    }

    resetForm();
    window.scrollTo({ top: 350, behavior: 'smooth' });
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const totalPendingAllTime = allWithdrawals.filter((w) => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0);
  const totalApprovedAllTime = allWithdrawals.filter((w) => w.status === 'approved').reduce((sum, w) => sum + w.amount, 0);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1c1a24] via-[#15141d] to-[#0c1017] border border-amber-500/40 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Super Administrator Portal &bull; Solana Network</span>
            </div>
            <h1 className="font-cinzel text-2xl sm:text-3xl font-extrabold text-zinc-100">
              Admin Operations & Bulk Disperse
            </h1>
            <p className="text-zinc-400 text-sm mt-1 max-w-xl">
              Compile 24-hour user withdrawals, export CSV / bulk multisend formats for Solana payouts, approve full batch units together, and manage educational quizzes.
            </p>
          </div>

            {/* Section Switcher Tabs */}
            <div className="flex flex-wrap items-center gap-2 bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800">
              <button
                id="admin-tab-withdrawals"
                onClick={() => setAdminSection('withdrawals')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  adminSection === 'withdrawals'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>24H Withdrawals ({allWithdrawals.filter((w) => w.status === 'pending').length} Pending)</span>
              </button>
              <button
                id="admin-tab-security"
                onClick={() => setAdminSection('security')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  adminSection === 'security'
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                    : activeThreatsCount > 0
                    ? 'text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ShieldAlert className={`w-4 h-4 ${activeThreatsCount > 0 ? 'text-red-400 animate-pulse' : 'text-zinc-400'}`} />
                <span>Anti-Cheat & Clones ({activeThreatsCount > 0 ? `${activeThreatsCount} Threats` : `${fraudClusters.length} Badges`})</span>
                {activeThreatsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-extrabold animate-bounce">
                    {activeThreatsCount}
                  </span>
                )}
              </button>
              <button
                id="admin-tab-claims"
                onClick={() => setAdminSection('claims')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  adminSection === 'claims'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Manage Users & Activity ({communityStats.totalRegisteredUsers} Members)</span>
              </button>
              <button
                id="admin-tab-quizzes"
                onClick={() => setAdminSection('quizzes')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  adminSection === 'quizzes'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Quiz & Article Links Manager ({modules.length})</span>
              </button>
            </div>
          </div>

          {/* Global Summary Stats */}
          <div className="mt-6 pt-6 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-zinc-900/80 p-3 rounded-2xl border border-amber-500/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
              <span className="text-[10px] uppercase font-bold text-amber-400 block">Total Claimed by Users</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-cinzel text-lg font-bold text-amber-300">
                  {communityStats.totalClaimedCoins.toLocaleString()}
                </span>
                <span className="text-[10px] font-semibold text-amber-400/80">ELDRA</span>
              </div>
              <span className="text-[10px] text-zinc-400 block mt-0.5">
                Faucet + Ref + Quizzes
              </span>
            </div>

            <div className="bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Treasury Reserve</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-cinzel text-lg font-bold text-emerald-400">
                  {(currentUser?.balance || 5000000).toLocaleString()}
                </span>
                <span className="text-[10px] font-semibold text-emerald-400/80">ELDRA</span>
              </div>
              <span className="text-[10px] text-emerald-400/70 block mt-0.5">
                Treasury Ready &bull; Active
              </span>
            </div>

            <div className="bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Registered Members</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-cinzel text-lg font-bold text-cyan-300">
                  {communityStats.totalRegisteredUsers}
                </span>
                <span className="text-[10px] text-zinc-400">Users</span>
              </div>
              <span className="text-[10px] text-zinc-400 block mt-0.5">
                {communityStats.totalUserHoldingBalance.toLocaleString()} ELDRA held
              </span>
            </div>

            <div className="bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Pending Payouts</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-cinzel text-lg font-bold text-yellow-300">
                  {totalPendingAllTime.toLocaleString()}
                </span>
                <span className="text-[10px] font-semibold text-yellow-400/80">ELDRA</span>
              </div>
              <span className="text-[10px] text-zinc-400 block mt-0.5">
                {allWithdrawals.filter((w) => w.status === 'pending').length} requests
              </span>
            </div>

            <div className="bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Dispersed Payouts</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-cinzel text-lg font-bold text-emerald-400">
                  {totalApprovedAllTime.toLocaleString()}
                </span>
                <span className="text-[10px] font-semibold text-emerald-400/80">ELDRA</span>
              </div>
              <span className="text-[10px] text-zinc-400 block mt-0.5">
                {allWithdrawals.filter((w) => w.status === 'approved').length} completed
              </span>
            </div>

            <div className="bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Active Quizzes</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-cinzel text-lg font-bold text-zinc-200">
                  {modules.length}
                </span>
                <span className="text-[10px] text-zinc-400">Modules</span>
              </div>
              <span className="text-[10px] text-amber-400 block mt-0.5">
                +20 ELDRA Pass
              </span>
            </div>
          </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-300 text-sm font-semibold flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION: ANTI-CHEAT SECURITY & MULTI-ACCOUNT DETECTION BADGES            */}
      {/* ========================================================================= */}
      {adminSection === 'security' && (
        <AntiCheatSecurityPanel currentUser={currentUser} />
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: 24-HOUR WITHDRAWAL BATCHES & BULK MULTISEND / CSV DISPERSE    */}
      {/* ========================================================================= */}
      {adminSection === 'withdrawals' && (
        <div className="space-y-6">
          {/* 24-Hour Batches & Cycle Status Banner */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-500/10 via-[#121722] to-amber-500/5 p-4 sm:p-5 rounded-2xl border border-amber-500/30">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                  <h2 className="font-cinzel text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
                    <span>24-Hour Withdrawal Units & Batch Payouts</span>
                  </h2>
                </div>
                <p className="text-xs text-zinc-400">
                  User withdrawals are automatically grouped into 24-hour batch cycles for multi-send Solana transfers.
                </p>
              </div>

              {/* Live 24H Cycle Countdown Clock */}
              <div className="flex items-center gap-3 bg-[#0b0e14]/90 px-4 py-2.5 rounded-xl border border-amber-500/40">
                <Clock className="w-4 h-4 text-amber-400 animate-spin-slow" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block leading-none">
                    Current 24H Cycle Closes In
                  </span>
                  <span className="font-mono text-sm font-extrabold text-amber-300">
                    {cycleCountdown}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* All Batches Card */}
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
                      All Batches (Master Log)
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
                <div className="mt-3 pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400 flex items-center justify-between">
                  <span>Pending: {allWithdrawals.filter((w) => w.status === 'pending').length}</span>
                  <span className="text-amber-300 font-semibold">View All &rarr;</span>
                </div>
              </div>

              {/* Dynamic 24-Hour Batch Cards */}
              {batches.map((batch) => {
                const isSelected = selectedBatchId === batch.batchId;
                const isCurrentActive = batch.batchDate.includes('Active');

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
                        {isCurrentActive && (
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
                          <span className="text-xs text-amber-400/80 font-bold">ELDRA</span>
                        </div>
                        <span className="text-xs text-zinc-400 font-mono">
                          {batch.totalRequests} {batch.totalRequests === 1 ? 'req' : 'reqs'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-zinc-800/80 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        {batch.pendingCount > 0 ? (
                          <span className="text-yellow-400 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" />
                            {batch.pendingCount} Pending Payouts
                          </span>
                        ) : batch.approvedCount > 0 ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" /> All Approved ({batch.approvedCount})
                          </span>
                        ) : (
                          <span className="text-zinc-500">No requests</span>
                        )}

                        <span className="text-amber-400 font-semibold text-[10px] font-mono">
                          {batch.batchId}
                        </span>
                      </div>

                      {/* Batch Quick Action Bar: Copy Bulk Transfer & 1-Click Approve */}
                      {batch.pendingCount > 0 && (
                        <div className="pt-1 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            id={`btn-open-bulk-modal-${batch.batchId}`}
                            onClick={() => {
                              setBulkModalBatch(batch);
                            }}
                            className="flex-1 py-1.5 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm"
                            title="Open bulk transfer format dispatcher (address,amount or address only)"
                          >
                            <Copy className="w-3 h-3 text-amber-400" />
                            <span>Copy Bulk</span>
                          </button>

                          <button
                            id={`btn-approve-badge-direct-${batch.batchId}`}
                            onClick={() => setBatchToApproveModal(batch)}
                            className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[10px] flex items-center justify-center gap-1 shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
                            title="1-Button approval for this whole 24-hour withdrawal batch"
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
          </div>

          {/* Bulk Actions & Batch Controls Bar */}
          <div className="rounded-3xl bg-[#101520] border border-amber-500/30 p-5 sm:p-6 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <h3 className="font-cinzel text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <span>
                    {selectedBatchId === 'all'
                      ? 'All Historical Withdrawals'
                      : `Withdrawal Badge / Batch: ${currentBatch?.batchDate || selectedBatchId}`}
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Copy addresses and amounts in bulk transfer formats (Solana multisend, Solflare, CLI), or 1-click approve the batch.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* 1-Click Approve All In Selected Badge */}
                {((selectedBatchId !== 'all' && (currentBatch?.pendingCount || 0) > 0) ||
                  (selectedBatchId === 'all' && allWithdrawals.some((w) => w.status === 'pending'))) && (
                  <button
                    id="admin-btn-approve-batch"
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
                        ? `1-Click Approve All Pending (${allWithdrawals.filter((w) => w.status === 'pending').length} Requests)`
                        : `1-Click Approve Badge (${currentBatch?.pendingCount || 0} Pending)`}
                    </span>
                  </button>
                )}

                {/* Open Full Bulk Dispatcher Modal */}
                <button
                  id="admin-btn-open-dispatcher"
                  onClick={() => {
                    setBulkModalBatch(currentBatch || batches[0] || null);
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  title="Open Bulk Transfer & Payout Dispatcher with multiple copy formats"
                >
                  <Code className="w-4 h-4 text-amber-400" />
                  <span>Bulk Transfer Dispatcher</span>
                </button>

                {/* Copy All Destination Wallet Addresses Only (Clean List for Bulk Transfer) */}
                <button
                  id="admin-btn-copy-addresses-only"
                  onClick={handleCopyBulkAddressesOnly}
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  title="Copy all destination wallet addresses together (one per line) ready for bulk sending"
                >
                  {copiedAddressesOnly ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied Addresses!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-amber-400" />
                      <span>Copy Addresses Only</span>
                    </>
                  )}
                </button>

                {/* Copy Bulk Multisend Format (address,amount) */}
                <button
                  id="admin-btn-copy-multisend"
                  onClick={handleCopyBulkMultisend}
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold font-mono flex items-center gap-2 transition-colors cursor-pointer"
                  title="Copy formatted wallet_address,amount lines ready for Solana bulk multisend tools (Solflare, Squads, Disperse)"
                >
                  {copiedMultisend ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied (Address,Amount)!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-amber-400" />
                      <span>Copy (Address,Amount)</span>
                    </>
                  )}
                </button>

                {/* Download CSV */}
                <button
                  id="admin-btn-download-csv"
                  onClick={handleDownloadBatchCsv}
                  className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold text-xs shadow-md shadow-amber-500/15 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                      statusFilter === filter
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {filter === 'all' ? 'All Status' : filter}
                  </button>
                ))}
              </div>

              <span className="text-xs text-zinc-400 font-mono">
                Showing <strong className="text-amber-300">{filteredWithdrawals.length}</strong> withdrawal records
              </span>
            </div>

            {/* Interactive Withdrawals Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">User</th>
                    <th className="py-3 px-3">Destination Solana Wallet Address</th>
                    <th className="py-3 px-3 text-right">Amount</th>
                    <th className="py-3 px-3">Date & 24H Unit</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredWithdrawals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-500">
                        No withdrawal requests found matching this batch or status filter.
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
                          className="hover:bg-zinc-800/30 transition-colors font-medium"
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
                                <Check className="w-3 h-3" /> Approved & Paid
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/15 text-red-300 border border-red-500/40 flex items-center gap-1 w-fit">
                                <XCircle className="w-3 h-3" /> Rejected (Refunded)
                              </span>
                            )}
                          </td>

                          {/* User Handle & Name */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-amber-300">
                                @{req.userHandle}
                              </span>
                              <span className="text-zinc-400 truncate max-w-[120px]">
                                ({req.userName})
                              </span>
                            </div>
                            <span className="text-[11px] text-zinc-500 block truncate max-w-[180px]">
                              {req.userEmail}
                            </span>
                          </td>

                          {/* Wallet Address */}
                          <td className="py-3.5 px-3 font-mono">
                            <div className="flex items-center gap-2">
                              <span
                                className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-semibold hover:border-amber-500/40 transition-colors"
                                title={req.walletAddress}
                              >
                                {req.walletAddress.slice(0, 8)}...{req.walletAddress.slice(-8)}
                              </span>
                              <button
                                onClick={() => handleCopyWalletAddress(req.walletAddress, req.id)}
                                className="p-1 rounded-md text-zinc-400 hover:text-amber-300 hover:bg-zinc-800 transition-colors"
                                title="Copy Full Wallet Address"
                              >
                                {copiedWalletId === req.id ? (
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

                          {/* Actions */}
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            {isPending ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setApprovingRequest(req)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-colors cursor-pointer"
                                  title="Approve single withdrawal"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => setRejectingRequest(req)}
                                  className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold transition-colors cursor-pointer"
                                  title="Reject and refund coins to user balance"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : isApproved ? (
                              <div className="text-left text-[11px]">
                                <span className="text-emerald-400 font-semibold block">
                                  Approved
                                </span>
                                {req.txHash && (
                                  <span className="text-[10px] text-zinc-500 font-mono">
                                    Ref: {req.txHash}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="text-left text-[11px]">
                                <span className="text-red-400 font-semibold block">Declined</span>
                                {req.rejectionReason && (
                                  <span className="text-[10px] text-zinc-500 block truncate max-w-[140px]" title={req.rejectionReason}>
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

      {/* ========================================================================= */}
      {/* SECTION 2: USER CLAIM VELOCITY, TOTAL CLAIMED COINS & COMMUNITY METRICS  */}
      {/* ========================================================================= */}
      {adminSection === 'claims' && (
        <div className="space-y-6">
          {/* Claim Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-[#101520] border border-amber-500/40 relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-amber-400">Total User Claimed Coins</span>
                <Flame className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="font-cinzel text-2xl sm:text-3xl font-extrabold text-amber-300">
                  {communityStats.totalClaimedCoins.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-amber-400/80">ELDRA</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Aggregated claims from all registered community members
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-[#101520] border border-zinc-800 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-zinc-400">Daily Faucet Claims</span>
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="font-cinzel text-2xl sm:text-3xl font-extrabold text-yellow-300">
                  {communityStats.totalDailyClaims.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-yellow-400/80">ELDRA</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Total claimed from 24h faucet (1 ELDRA/day)
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-[#101520] border border-zinc-800 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-zinc-400">Referral Rewards</span>
                <Users className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="font-cinzel text-2xl sm:text-3xl font-extrabold text-cyan-300">
                  {communityStats.totalReferralClaims.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-cyan-400/80">ELDRA</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Bonus awarded for referring active members (5 ELDRA/invite)
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-[#101520] border border-zinc-800 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-zinc-400">Educational Quiz Jackpots</span>
                <Award className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="font-cinzel text-2xl sm:text-3xl font-extrabold text-emerald-400">
                  {communityStats.totalQuizClaims.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-emerald-400/80">ELDRA</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Earned passing 24h educational quizzes (20 ELDRA bonus)
              </p>
            </div>
          </div>

          {/* Member Claims Column & Table */}
          <div className="rounded-3xl bg-[#101520] border border-zinc-800 p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
              <div>
                <h2 className="font-cinzel text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  <span>Registered Users & Claim Velocity Tracker</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Monitor each user&apos;s total claimed coins, faucet activity, referral bonuses, and wallet status in real-time.
                </p>
              </div>

              {/* Search Bar & Clear Action */}
              <div className="flex items-center gap-2">
                <div className="relative min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Search by handle or email..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                  />
                  <Filter className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-3 pointer-events-none" />
                </div>

                {communityStats.users.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Delete all registered non-admin users and reset all device blocks?')) {
                        communityStats.users.forEach((u) => {
                          store.adminDeleteUser(u.id);
                        });
                        store.unblockCurrentDevice();
                        setSuccessMsg('All registered test users deleted and device blocks cleared successfully.');
                        setTimeout(() => setSuccessMsg(null), 4000);
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    title="Delete all registered test members and clear device registrations"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>Delete All Registered Users</span>
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Community Member</th>
                    <th className="py-3 px-3 text-amber-400 font-extrabold bg-amber-500/10">Total Claimed Coins</th>
                    <th className="py-3 px-3">Daily Faucet (1 ELDRA)</th>
                    <th className="py-3 px-3">Referral Earned (5 ELDRA)</th>
                    <th className="py-3 px-3">Quiz Bonus (20 ELDRA)</th>
                    <th className="py-3 px-3">Current Balance</th>
                    <th className="py-3 px-3">Solana Wallet Address</th>
                    <th className="py-3 px-3">Joined Date</th>
                    <th className="py-3 px-3 text-right">User Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {communityStats.users.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-zinc-400 font-sans">
                        <Users className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                        <p className="font-semibold text-zinc-300">No community members have registered yet</p>
                        <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                          As soon as real users register and claim coins through the daily faucet, referrals, or quizzes, their live claim velocity and balances will be displayed here.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    communityStats.users
                      .filter((u) => {
                        if (!userSearchQuery) return true;
                        const q = userSearchQuery.toLowerCase();
                        return (
                          u.username?.toLowerCase().includes(q) ||
                          u.email.toLowerCase().includes(q) ||
                          u.displayName?.toLowerCase().includes(q) ||
                          u.walletAddress?.toLowerCase().includes(q)
                        );
                      })
                      .map((u) => {
                        const totalClaimed = (u.dailyClaimBalance || 0) + (u.referralBalance || 0) + (u.quizBalance || 0);
                        return (
                          <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors">
                            <td className="py-3.5 px-3">
                              <div className="font-sans font-bold text-zinc-200">
                                @{u.username || 'member'}
                              </div>
                              <div className="text-[11px] text-zinc-500 font-mono">{u.email}</div>
                            </td>

                            {/* Total Claimed Column */}
                            <td className="py-3.5 px-3 bg-amber-500/10">
                              <div className="font-cinzel text-sm font-extrabold text-amber-300">
                                {totalClaimed.toLocaleString()} ELDRA
                              </div>
                              <span className="text-[10px] text-amber-400/80 font-sans font-semibold">
                                Total Claim Velocity
                              </span>
                            </td>

                            {/* Faucet */}
                            <td className="py-3.5 px-3 text-yellow-300 font-semibold">
                              {(u.dailyClaimBalance || 0).toLocaleString()} ELDRA
                            </td>

                            {/* Referrals */}
                            <td className="py-3.5 px-3 text-cyan-300 font-semibold">
                              {(u.referralBalance || 0).toLocaleString()} ELDRA
                            </td>

                            {/* Quiz */}
                            <td className="py-3.5 px-3 text-emerald-400 font-semibold">
                              {(u.quizBalance || 0).toLocaleString()} ELDRA
                            </td>

                            {/* Current Balance */}
                            <td className="py-3.5 px-3 font-bold text-zinc-100">
                              {(u.balance || 0).toLocaleString()} ELDRA
                            </td>

                            {/* Wallet */}
                            <td className="py-3.5 px-3 text-zinc-400 text-[11px]">
                              {u.walletAddress ? (
                                <span className="font-mono text-amber-400/90 truncate block max-w-[130px]" title={u.walletAddress}>
                                  {u.walletAddress}
                                </span>
                              ) : (
                                <span className="text-zinc-600 italic">Not set</span>
                              )}
                            </td>

                            {/* Joined */}
                            <td className="py-3.5 px-3 text-zinc-400 text-[11px] whitespace-nowrap">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-3 text-right">
                              <button
                                onClick={() => {
                                  setSelectedUserForAction(u);
                                  setUserBalanceInput(u.balance);
                                  setShowDeleteUserConfirm(false);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all hover:scale-105 cursor-pointer font-sans"
                              >
                                Manage User
                              </button>
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

      {/* ========================================================================= */}
      {/* SECTION 3: ARTICLES & QUIZ BUILDER (+20 ELDRA JACKPOT)                   */}
      {/* ========================================================================= */}
      {adminSection === 'quizzes' && (
        <div className="space-y-8">
          {/* Top Quick Stats & Global Actions */}
          <div className="p-6 rounded-3xl bg-[#101520] border border-zinc-800 shadow-xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="font-cinzel text-xl font-bold text-zinc-100 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                  <span>Educational Academy & Quiz Manager</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Create and manage external learning source articles, Solana knowledge guides, and comprehension quizzes with ELDRA token rewards.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleRestoreDefaults}
                  className="px-3.5 py-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-[1.02] cursor-pointer"
                  title="Restore standard official Solana & Eldra starter quizzes"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Restore Official Default Quizzes</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Quiz & Link</span>
                </button>
              </div>
            </div>

            {/* Quick Templates Selector */}
            <div className="pt-3 border-t border-zinc-800/80">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Load Sample Topic Template:</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {SAMPLE_TEMPLATES.map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleLoadTemplate(idx)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-amber-500/15 border border-zinc-800 hover:border-amber-500/40 text-zinc-300 hover:text-amber-300 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3 h-3 text-amber-400" />
                    <span>{tpl.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Create / Edit Form */}
          <form
            onSubmit={handleSaveModule}
            noValidate
            className={`rounded-3xl bg-[#101520] border p-4 sm:p-6 lg:p-8 space-y-6 shadow-2xl transition-all ${
              isEditingId ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-amber-500/30'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                    isEditingId ? 'bg-amber-500 text-black' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {isEditingId ? 'EDITING MODE' : 'NEW CHAPTER CREATION'}
                  </span>
                  <h2 className="font-cinzel text-lg sm:text-xl font-bold text-zinc-100">
                    {isEditingId ? 'Update Educational Link & Quiz' : 'Post New External Educational Link & Quiz'}
                  </h2>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Provide an authoritative external link (Solana docs, whitepaper, GitBook) and quiz questions to reward members for reading.
                </p>
              </div>

              {isEditingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
                >
                  Cancel Edit & Clear
                </button>
              )}
            </div>

            {/* Basic Article Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Topic / Chapter Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Solana High-Throughput Architecture & Proof of History"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#090c12] border border-zinc-700 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Category *
                </label>
                <select
                  value={categoryPreset}
                  onChange={(e) => setCategoryPreset(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090c12] border border-zinc-700 text-sm text-zinc-100 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="Solana & Blockchain">Solana & Blockchain</option>
                  <option value="Eldra Tokenomics">Eldra Tokenomics</option>
                  <option value="Solana DeFi & Pay">Solana DeFi & Pay</option>
                  <option value="Web3 Security & Wallets">Web3 Security & Wallets</option>
                  <option value="Smart Contracts">Smart Contracts</option>
                  <option value="Custom">Custom Category...</option>
                </select>
                {categoryPreset === 'Custom' && (
                  <input
                    type="text"
                    placeholder="Enter custom category name..."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full mt-2 px-3.5 py-2 rounded-xl bg-[#090c12] border border-amber-500/50 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                  />
                )}
              </div>
            </div>

            {/* External URL with Test Button & Quick Sources */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1 flex items-center justify-between flex-wrap gap-2">
                <span className="flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-amber-400" />
                  Educational Source Link URL (External Article / Documentation) *
                </span>
                <span className="text-[11px] text-amber-400 font-normal">
                  Learners will visit this link before taking the comprehension quiz
                </span>
              </label>

              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <div className="relative flex-1">
                  <Globe className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="https://docs.solana.com/introduction or solana.com/..."
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090c12] border border-zinc-700 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleTestUrl(externalUrl)}
                  disabled={!externalUrl.trim()}
                  className="px-4 py-2.5 rounded-xl bg-zinc-850 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  title="Verify link by opening in a new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Test Link ↗</span>
                </button>
              </div>

              {/* Popular Source Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] text-zinc-500 font-semibold">Quick Source Links:</span>
                {POPULAR_SOURCES.map((src, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPopularSource(src.url)}
                    className={`text-[11px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                      externalUrl === src.url
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    {src.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Overview Summary / Learning Objectives *
              </label>
              <textarea
                rows={3}
                placeholder="Write a clear summary highlighting key concepts covered in the external article..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#090c12] border border-zinc-700 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 resize-none leading-relaxed"
              />
            </div>

            {/* Reading & Quiz Parameters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Read Time
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={readTimeMinutes}
                    onChange={(e) => setReadTimeMinutes(parseInt(e.target.value) || 4)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#090c12] border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-xs text-zinc-500">min</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Passing Score
                </label>
                <select
                  value={passingScorePercentage}
                  onChange={(e) => setPassingScorePercentage(parseInt(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#090c12] border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value={50}>50% (Easy)</option>
                  <option value={60}>60% (Moderate)</option>
                  <option value={75}>75% (Standard - Recommended)</option>
                  <option value={80}>80% (Advanced)</option>
                  <option value={100}>100% (Mastery)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Pass Jackpot Bonus
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={500}
                    value={completionBonus}
                    onChange={(e) => setCompletionBonus(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#090c12] border border-zinc-700 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-xs text-amber-400 font-bold">ELDRA</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Per-Question Reward
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={perQuestionReward}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setPerQuestionReward(val);
                      setQuestions((prev) => prev.map((q) => ({ ...q, rewardAmount: val })));
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#090c12] border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-xs text-zinc-400">ELDRA</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Duration / Expiry
                </label>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(parseInt(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#090c12] border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value={24}>24 Hours (Daily Chapter)</option>
                  <option value={48}>48 Hours (2 Days)</option>
                  <option value={168}>7 Days (Weekly Special)</option>
                  <option value={0}>Permanent (Never Expires)</option>
                </select>
              </div>
            </div>

            {/* Questions Builder */}
            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-cinzel text-base font-bold text-zinc-200 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                    <span>Comprehension Quiz Questions Builder ({questions.length})</span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Define multiple-choice questions based on the external article link. Mark the correct answer for automated scoring.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Question</span>
                </button>
              </div>

              {questions.map((q, qIndex) => (
                <div
                  key={q.id || qIndex}
                  className="p-4 sm:p-5 rounded-2xl bg-[#090c12] border border-zinc-800 space-y-3.5 relative group hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-400 font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        Question #{qIndex + 1}
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        ({q.rewardAmount || perQuestionReward || 2} ELDRA on correct answer)
                      </span>
                    </div>

                    {/* Question Action Buttons: Up, Down, Duplicate, Remove */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveQuestionUp(qIndex)}
                        disabled={qIndex === 0}
                        className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-400 hover:text-zinc-200 text-xs cursor-pointer transition-colors"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveQuestionDown(qIndex)}
                        disabled={qIndex === questions.length - 1}
                        className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-400 hover:text-zinc-200 text-xs cursor-pointer transition-colors"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateQuestion(qIndex)}
                        className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs cursor-pointer transition-colors"
                        title="Duplicate Question"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIndex)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs cursor-pointer transition-colors"
                          title="Remove Question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <div>
                    <input
                      type="text"
                      placeholder={`Enter Question #${qIndex + 1} text...`}
                      value={q.question}
                      onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-medium"
                    />
                  </div>

                  {/* 4 Options Grid */}
                  <div>
                    <div className="text-[11px] text-zinc-400 font-semibold mb-2 flex items-center justify-between">
                      <span>Multiple Choice Options (Select radio to designate Correct Answer):</span>
                      <span className="text-emerald-400 text-[10px]">
                        Correct Answer: Option {['A', 'B', 'C', 'D'][q.correctOptionIndex]}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map((opt, optIndex) => {
                        const isCorrect = q.correctOptionIndex === optIndex;
                        const optLetter = ['A', 'B', 'C', 'D'][optIndex];
                        return (
                          <div
                            key={optIndex}
                            className={`flex items-center gap-2 p-1.5 rounded-xl border transition-all ${
                              isCorrect
                                ? 'bg-emerald-950/30 border-emerald-500/60 ring-1 ring-emerald-500/30'
                                : 'bg-zinc-900/60 border-zinc-800'
                            }`}
                          >
                            <label className="flex items-center gap-1.5 pl-1.5 cursor-pointer select-none">
                              <input
                                type="radio"
                                name={`correct-opt-${qIndex}-${q.id}`}
                                checked={isCorrect}
                                onChange={() => handleCorrectOptionChange(qIndex, optIndex)}
                                className="text-emerald-500 focus:ring-emerald-400 h-4 w-4 bg-zinc-800 border-zinc-700 cursor-pointer"
                                title="Click to designate this option as the correct answer"
                              />
                              <span className={`text-xs font-bold ${isCorrect ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                {optLetter}.
                              </span>
                            </label>
                            <input
                              type="text"
                              placeholder={`Option ${optLetter} text...`}
                              value={opt}
                              onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                              className={`w-full px-2.5 py-1.5 rounded-lg text-xs bg-transparent border-0 focus:outline-none ${
                                isCorrect ? 'text-emerald-300 font-semibold' : 'text-zinc-200'
                              } placeholder-zinc-600`}
                            />
                            {isCorrect && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold shrink-0 mr-1">
                                Correct
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Explanation for Correct Answer */}
                  <div>
                    <input
                      type="text"
                      placeholder="Explanation displayed to learner after answering (e.g. 'Proof of History is a verifiable delay function...')"
                      value={q.explanation || ''}
                      onChange={(e) => handleExplanationChange(qIndex, e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-400 placeholder-zinc-600 focus:outline-none focus:border-amber-500/60"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Publishing Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Auto Delete Previous Option (only if creating new) */}
              {!isEditingId && (
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="auto-delete-previous-check"
                    checked={autoDeletePrevious}
                    onChange={(e) => setAutoDeletePrevious(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded bg-zinc-950 border-zinc-700 text-amber-500 focus:ring-amber-400 cursor-pointer"
                  />
                  <label
                    htmlFor="auto-delete-previous-check"
                    className="text-xs text-zinc-300 cursor-pointer select-none"
                  >
                    <strong className="text-zinc-100 block mb-0.5">
                      Replace all previous quizzes
                    </strong>
                    Keeps the academy focused strictly on the newly published chapter.
                  </label>
                </div>
              )}

              {/* Publish Toggle */}
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="publish-immediately-check"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded bg-zinc-950 border-zinc-700 text-emerald-500 focus:ring-emerald-400 cursor-pointer"
                />
                <label
                  htmlFor="publish-immediately-check"
                  className="text-xs text-zinc-300 cursor-pointer select-none"
                >
                  <strong className="text-emerald-400 block mb-0.5">
                    Publish Immediately (Active for learners)
                  </strong>
                  Uncheck to save as a private draft in the admin manager.
                </label>
              </div>
            </div>

            {/* Form Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-zinc-800 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  {isEditingId ? 'Cancel Edit & Reset' : 'Reset Form'}
                </button>

                {isEditingId && (
                  <button
                    type="button"
                    onClick={() => handleDeleteModule(isEditingId)}
                    className="px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                    <span>Delete This Quiz & Article</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold text-xs shadow-lg shadow-amber-500/25 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>{isEditingId ? 'Save & Update Quiz' : 'Publish Article Link & Quiz (+20 ELDRA)'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Active Quizzes & Educational Links Manager */}
          <div className="rounded-3xl bg-[#101520] border border-zinc-800 p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
              <div>
                <h3 className="font-cinzel text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <span>Published Educational Quizzes & Links ({modules.length})</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Manage active learning chapters, renew expired quizzes, delete manually posted articles, or reset user attempts.
                </p>
              </div>

              {/* Search, Filters and Global Actions */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="relative min-w-[180px]">
                  <input
                    type="text"
                    placeholder="Search quizzes & links..."
                    value={quizSearchQuery}
                    onChange={(e) => setQuizSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                  />
                  <Filter className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5 pointer-events-none" />
                </div>

                <div className="flex items-center rounded-xl bg-zinc-900 border border-zinc-800 p-0.5">
                  {(['all', 'active', 'expired', 'drafts'] as const).map((filterKey) => (
                    <button
                      key={filterKey}
                      onClick={() => setQuizFilter(filterKey)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                        quizFilter === filterKey
                          ? 'bg-amber-500 text-black shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {filterKey}
                    </button>
                  ))}
                </div>

                {modules.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteAllModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Delete all educational quizzes from the database"
                  >
                    <Trash className="w-3.5 h-3.5 text-red-400" />
                    <span>Delete All</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bulk Selection Bar (when 1 or more are selected) */}
            {selectedQuizIds.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 flex-wrap animate-in fade-in">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <CheckSquare className="w-4 h-4 text-amber-400" />
                  <span>
                    {selectedQuizIds.length} Quiz{selectedQuizIds.length > 1 ? 'zes' : ''} Selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedQuizIds([])}
                    className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Deselect All
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteSelectedModal(true)}
                    className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-md shadow-red-600/30 flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Selected ({selectedQuizIds.length})</span>
                  </button>
                </div>
              </div>
            )}

            {/* List of Modules */}
            <div className="space-y-4">
              {modules.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[#090c12] border border-zinc-800 space-y-3">
                  <BookOpen className="w-8 h-8 text-zinc-600 mx-auto" />
                  <h4 className="text-sm font-bold text-zinc-300">No Educational Modules in Database</h4>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    All previous quizzes and articles have been cleared. You can build and publish a new quiz above or restore default official Solana modules.
                  </p>
                  <button
                    onClick={handleRestoreDefaults}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold cursor-pointer transition-colors shadow-lg shadow-amber-500/20"
                  >
                    Restore Official Default Quizzes
                  </button>
                </div>
              ) : (
                (() => {
                  const visibleModules = modules.filter((m) => {
                    const timeInfo = store.getQuizTimeRemaining(m);
                    const isDraft = m.isPublished === false;
                    const isExpired = timeInfo.isExpired;

                    if (quizFilter === 'active' && (isDraft || isExpired)) return false;
                    if (quizFilter === 'expired' && (!isExpired || isDraft)) return false;
                    if (quizFilter === 'drafts' && !isDraft) return false;

                    if (quizSearchQuery) {
                      const q = quizSearchQuery.toLowerCase();
                      return (
                        m.title.toLowerCase().includes(q) ||
                        m.category.toLowerCase().includes(q) ||
                        m.externalUrl.toLowerCase().includes(q) ||
                        m.summary.toLowerCase().includes(q)
                      );
                    }
                    return true;
                  });

                  if (visibleModules.length === 0) {
                    return (
                      <div className="p-6 text-center rounded-2xl bg-[#090c12] border border-zinc-800 text-xs text-zinc-400">
                        No quizzes match your active filter or search query.
                      </div>
                    );
                  }

                  const allVisibleSelected =
                    visibleModules.length > 0 &&
                    visibleModules.every((m) => selectedQuizIds.includes(m.id));

                  return (
                    <>
                      {/* Select All Visible Header */}
                      <div className="flex items-center justify-between px-2 text-xs text-zinc-400">
                        <button
                          type="button"
                          onClick={() => handleSelectAllVisibleQuizzes(visibleModules.map((m) => m.id))}
                          className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 cursor-pointer font-semibold"
                        >
                          {allVisibleSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-400" />
                          ) : (
                            <Square className="w-4 h-4 text-zinc-600" />
                          )}
                          <span>
                            {allVisibleSelected ? 'Deselect All Visible' : `Select All (${visibleModules.length})`}
                          </span>
                        </button>

                        <span className="text-[11px] text-zinc-500">
                          Showing {visibleModules.length} of {modules.length} modules
                        </span>
                      </div>

                      {visibleModules.map((m) => {
                        const timeInfo = store.getQuizTimeRemaining(m);
                        const isDraft = m.isPublished === false;
                        const isExpired = timeInfo.isExpired;
                        const questionsCount = m.questions?.length || 0;
                        const totalEldraReward = questionsCount * 2 + (m.completionBonus || 20);
                        const isSelected = selectedQuizIds.includes(m.id);

                        return (
                          <div
                            key={m.id}
                            className={`p-5 rounded-2xl border transition-all ${
                              isSelected
                                ? 'bg-amber-950/20 border-amber-500/60 ring-1 ring-amber-500/30'
                                : isEditingId === m.id
                                ? 'bg-amber-950/20 border-amber-400'
                                : 'bg-[#090c12] border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                              {/* Left selection + content */}
                              <div className="flex items-start gap-3.5 flex-1">
                                <button
                                  type="button"
                                  onClick={() => handleToggleSelectQuiz(m.id)}
                                  className="mt-1 text-zinc-500 hover:text-amber-400 transition-colors cursor-pointer shrink-0"
                                  title={isSelected ? 'Deselect quiz' : 'Select quiz'}
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-5 h-5 text-amber-400" />
                                  ) : (
                                    <Square className="w-5 h-5 text-zinc-600" />
                                  )}
                                </button>

                                <div className="space-y-2 flex-1 min-w-0">
                                  {/* Badges */}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                                      {m.category}
                                    </span>

                                    {isDraft ? (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                                        Draft (Unpublished)
                                      </span>
                                    ) : isExpired ? (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-950/60 text-red-400 border border-red-800/40 flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-red-400" />
                                        Expired
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-amber-400" />
                                        {timeInfo.formattedTime} Remaining
                                      </span>
                                    )}

                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-800/30">
                                      Pass: {m.passingScorePercentage || 75}%
                                    </span>
                                  </div>

                                  {/* Title & Summary */}
                                  <h4 className="font-cinzel text-base font-bold text-zinc-100">
                                    {m.title}
                                  </h4>
                                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                                    {m.summary}
                                  </p>

                                  {/* External Link Row */}
                                  <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono pt-1">
                                    <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    <a
                                      href={m.externalUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-amber-400 hover:text-amber-300 underline truncate max-w-md block"
                                      title="Open educational source article in new tab"
                                    >
                                      {m.externalUrl}
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyQuizLink(m.externalUrl, m.id)}
                                      className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                                      title="Copy source URL"
                                    >
                                      {copiedLinkQuizId === m.id ? (
                                        <Check className="w-3 h-3 text-emerald-400" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                  </div>

                                  {/* Reward & Details Footer */}
                                  <div className="flex items-center gap-3 text-[11px] text-zinc-500 pt-1 flex-wrap">
                                    <span>{questionsCount} Questions</span>
                                    <span>&bull;</span>
                                    <span>{m.readTimeMinutes || 4} min read</span>
                                    <span>&bull;</span>
                                    <span className="text-amber-400 font-bold">
                                      Up to {totalEldraReward} ELDRA Total (+{m.completionBonus || 20} Jackpot)
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons Toolbar */}
                              <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap shrink-0 pt-2 lg:pt-0">
                                {/* Test Link */}
                                <a
                                  href={m.externalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                  title="Test link in new tab"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                                  <span className="hidden sm:inline">Visit Link</span>
                                </a>

                                {/* Renew Quiz */}
                                <button
                                  type="button"
                                  onClick={() => handleRenewModule(m.id, 24)}
                                  className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                  title="Renew active duration by +24 hours"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>+24h</span>
                                </button>

                                {/* Edit */}
                                <button
                                  type="button"
                                  onClick={() => handleEditModule(m)}
                                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                  title="Edit Quiz & Link"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Edit</span>
                                </button>

                                {/* Duplicate */}
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateQuiz(m.id)}
                                  className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
                                  title="Duplicate this Quiz"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>

                                {/* Publish / Unpublish */}
                                <button
                                  type="button"
                                  onClick={() => handleTogglePublish(m.id)}
                                  className={`p-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                                    m.isPublished !== false
                                      ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300 hover:bg-emerald-950/70'
                                      : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                                  }`}
                                  title={m.isPublished !== false ? 'Published (Click to Unpublish)' : 'Draft (Click to Publish)'}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                {/* Reset Attempts */}
                                <button
                                  type="button"
                                  onClick={() => handleResetAttempts(m.id, m.title)}
                                  className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
                                  title="Reset user attempts (allow retake)"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete Single Quiz Button */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteModule(m.id)}
                                  className="px-2.5 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer hover:scale-105"
                                  title="Permanently Delete Quiz & Article"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* Single Approve Modal */}
      {approvingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#0f141f] border border-emerald-500/40 p-6 shadow-2xl shadow-black relative">
            <h3 className="font-cinzel text-lg font-bold text-zinc-100 flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Approve Withdrawal Payout</span>
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Approving will mark this request as Paid, deduct from pending, and record the payout on @{approvingRequest.userHandle}&apos;s dashboard.
            </p>

            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs space-y-1.5 mb-4">
              <div className="flex justify-between">
                <span className="text-zinc-400">Recipient:</span>
                <span className="text-amber-300 font-bold">@{approvingRequest.userHandle} ({approvingRequest.userName})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Amount:</span>
                <span className="text-emerald-400 font-bold">{approvingRequest.amount} ELDRA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Destination:</span>
                <span className="font-mono text-zinc-300">{approvingRequest.walletAddress.slice(0, 10)}...</span>
              </div>
            </div>

            <form onSubmit={handleConfirmSingleApprove} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Optional Solscan Tx Hash / Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5K2x...SolScanTx"
                  value={customTxHash}
                  onChange={(e) => setCustomTxHash(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setApprovingRequest(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20"
                >
                  Confirm Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#0f141f] border border-red-500/40 p-6 shadow-2xl shadow-black relative">
            <h3 className="font-cinzel text-lg font-bold text-zinc-100 flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <span>Reject & Refund Withdrawal</span>
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Rejecting will automatically refund <strong className="text-amber-300">+{rejectingRequest.amount} ELDRA</strong> back to @{rejectingRequest.userHandle}&apos;s dashboard balance.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Rejection Reason (Visible to user) *
                </label>
                <input
                  type="text"
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Invalid Solana wallet address / Verification needed"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-400"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingRequest(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs shadow-lg shadow-red-500/20"
                >
                  Reject & Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Management Actions Modal */}
      {selectedUserForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#0f141f] border border-amber-500/40 p-6 sm:p-7 shadow-2xl shadow-black relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-cinzel text-base font-bold text-zinc-100">
                    Manage User: @{selectedUserForAction.username || 'member'}
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    {selectedUserForAction.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForAction(null)}
                className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2.5 mb-5 text-center">
              <div className="p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block uppercase font-semibold">Balance</span>
                <span className="font-cinzel font-bold text-amber-300 text-sm">
                  {selectedUserForAction.balance} ELDRA
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block uppercase font-semibold">Total Claims</span>
                <span className="font-cinzel font-bold text-emerald-400 text-sm">
                  {(selectedUserForAction.dailyClaimBalance || 0) + (selectedUserForAction.referralBalance || 0) + (selectedUserForAction.quizBalance || 0)} ELDRA
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block uppercase font-semibold">Solana Wallet</span>
                <span className="font-mono text-zinc-300 text-[10px] truncate block" title={selectedUserForAction.walletAddress || 'None'}>
                  {selectedUserForAction.walletAddress ? `${selectedUserForAction.walletAddress.slice(0, 4)}...${selectedUserForAction.walletAddress.slice(-4)}` : 'Not set'}
                </span>
              </div>
            </div>

            {/* Action 1: Adjust or Set Token Balance */}
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3 mb-4">
              <h4 className="font-bold text-xs text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" />
                <span>Adjust User Token Balance</span>
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">New Balance (ELDRA)</label>
                  <input
                    type="number"
                    min={0}
                    value={userBalanceInput}
                    onChange={(e) => setUserBalanceInput(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-700 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Reason / Note</label>
                  <input
                    type="text"
                    value={balanceAdjustReason}
                    onChange={(e) => setBalanceAdjustReason(e.target.value)}
                    placeholder="Admin adjustment"
                    className="w-full px-3 py-2 rounded-xl bg-black border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const success = store.adminUpdateUserBalance(selectedUserForAction.id, userBalanceInput, balanceAdjustReason);
                  if (success) {
                    setSuccessMsg(`Updated @${selectedUserForAction.username || 'member'}'s balance to ${userBalanceInput} ELDRA.`);
                    setSelectedUserForAction(null);
                    setTimeout(() => setSuccessMsg(null), 4000);
                  }
                }}
                className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-md shadow-amber-500/20 cursor-pointer"
              >
                Save New Balance
              </button>
            </div>

            {/* Action 2: Reset Quiz Progress for this User */}
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2 mb-4">
              <h4 className="font-bold text-xs text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Educational Quiz Attempt</span>
              </h4>
              <p className="text-[11px] text-zinc-400">
                Clears this user&apos;s quiz submission history so they can retake the active educational quiz if they failed.
              </p>
              <button
                type="button"
                onClick={() => {
                  store.adminResetUserQuizProgress(selectedUserForAction.id);
                  setSuccessMsg(`Quiz attempt progress reset for @${selectedUserForAction.username || 'member'}. They can now retake the quiz.`);
                  setSelectedUserForAction(null);
                  setTimeout(() => setSuccessMsg(null), 4000);
                }}
                className="w-full py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold text-xs transition-colors cursor-pointer"
              >
                Reset All Quiz Attempts For User
              </button>
            </div>

            {/* Action 3: Delete User Account */}
            <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/30 space-y-2">
              <h4 className="font-bold text-xs text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete User Account</span>
              </h4>
              <p className="text-[11px] text-zinc-400">
                Permanently removes this member from the database along with their pending withdrawals and stats.
              </p>
              
              {!showDeleteUserConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteUserConfirm(true)}
                  className="w-full py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-bold text-xs transition-colors cursor-pointer"
                >
                  Delete This Account
                </button>
              ) : (
                <div className="space-y-2 pt-1">
                  <p className="text-xs text-red-300 font-bold">Are you sure? This cannot be undone.</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteUserConfirm(false)}
                      className="w-1/2 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const success = store.adminDeleteUser(selectedUserForAction.id);
                        if (success) {
                          setSuccessMsg(`Deleted account for @${selectedUserForAction.username || 'member'}.`);
                          setSelectedUserForAction(null);
                          setTimeout(() => setSuccessMsg(null), 4000);
                        }
                      }}
                      className="w-1/2 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold shadow-lg shadow-red-600/30"
                    >
                      Confirm Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Quiz Confirmation Modal */}
      {quizToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#0f141f] border border-red-500/40 p-6 shadow-2xl shadow-black relative space-y-4">
            <div className="flex items-center gap-2.5 text-red-400">
              <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-cinzel text-base font-bold text-zinc-100">Delete Quiz & Article</h3>
                <p className="text-[11px] text-zinc-400">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                {quizToDelete.category}
              </span>
              <h4 className="font-cinzel text-sm font-bold text-zinc-100">{quizToDelete.title}</h4>
              <p className="text-xs text-zinc-400 line-clamp-2">{quizToDelete.summary}</p>
              <div className="text-[11px] text-zinc-500 pt-1 flex items-center gap-2 font-mono truncate">
                <Globe className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">{quizToDelete.externalUrl}</span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Are you sure you want to permanently remove this educational module? All associated student quiz submissions and progress records for this chapter will also be cleared.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setQuizToDelete(null)}
                className="w-1/2 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDeleteSingleQuiz(quizToDelete)}
                className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold shadow-lg shadow-red-600/30 flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:scale-105"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Quiz</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Bulk Selected Quizzes Confirmation Modal */}
      {showDeleteSelectedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#0f141f] border border-red-500/40 p-6 shadow-2xl shadow-black relative space-y-4">
            <div className="flex items-center gap-2.5 text-red-400">
              <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-cinzel text-base font-bold text-zinc-100">Delete {selectedQuizIds.length} Selected Quizzes</h3>
                <p className="text-[11px] text-zinc-400">Bulk module removal</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              You have selected <strong className="text-red-400">{selectedQuizIds.length} quiz articles</strong>. Deleting them will remove them from the learner academy and clear their attempt records.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteSelectedModal(false)}
                className="w-1/2 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSelected}
                className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold shadow-lg shadow-red-600/30 flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:scale-105"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete ({selectedQuizIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Quizzes Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#0f141f] border border-red-500/50 p-6 shadow-2xl shadow-black relative space-y-4">
            <div className="flex items-center gap-2.5 text-red-400">
              <div className="p-2 rounded-xl bg-red-500/15 border border-red-500/30">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="font-cinzel text-base font-bold text-zinc-100">Delete All Quizzes & Articles?</h3>
                <p className="text-[11px] text-zinc-400">Total count: {modules.length} modules</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-red-400">ALL {modules.length} educational modules and quizzes</strong>? The learning catalog will be completely emptied. You can restore the official Solana defaults at any time.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(false)}
                className="w-1/2 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAll}
                className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold shadow-lg shadow-red-600/30 flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:scale-105"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete All Quizzes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 24-HOUR BATCH MULTI-SEND & BULK TRANSFER DISPATCHER MODAL                 */}
      {/* ========================================================================= */}
      {bulkModalBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl sm:rounded-3xl bg-[#0e131d] border border-amber-500/50 p-4 sm:p-6 shadow-2xl shadow-black relative space-y-4 max-h-[92vh] flex flex-col overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-zinc-800 pb-3 gap-3">
              <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-amber-500/15 border border-amber-500/30 shrink-0 mt-0.5">
                  <Copy className="w-5 h-5 text-amber-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-cinzel text-base sm:text-lg font-bold text-zinc-100 leading-snug">
                      Bulk Transfer & Address Dispatcher
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 whitespace-nowrap">
                      {bulkModalBatch.batchDate}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-zinc-400 mt-1 leading-normal">
                    Formatted for Solana Multisend tools (Solflare, Squads, Disperse, or Solana CLI)
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="admin-close-bulk-modal-btn"
                onClick={() => setBulkModalBatch(null)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center -mr-1 -mt-1"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Batch Overview Stats */}
            <div className="grid grid-cols-3 gap-2 bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Pending</span>
                <span className="font-cinzel text-sm sm:text-base font-extrabold text-amber-300">
                  {bulkModalBatch.pendingCount}
                </span>
                <span className="text-[10px] text-zinc-400 block">wallets</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Volume</span>
                <span className="font-cinzel text-sm sm:text-base font-extrabold text-amber-300">
                  {bulkModalBatch.totalAmount.toLocaleString()}
                </span>
                <span className="text-[10px] text-amber-400/80 block font-bold">ELDRA</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Status</span>
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 mt-0.5 whitespace-nowrap">
                  {bulkModalBatch.pendingCount > 0 ? 'Ready' : 'Settled'}
                </span>
              </div>
            </div>

            {/* Format Selection Tabs */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300 flex items-center justify-between flex-wrap gap-1">
                <span>Select Multi-Send Format:</span>
                <span className="text-[11px] text-amber-400 font-mono">
                  {bulkModalFormat === 'comma' && 'wallet_address,amount'}
                  {bulkModalFormat === 'space' && 'wallet_address amount (Solana CLI)'}
                  {bulkModalFormat === 'tab' && 'TSV (Excel / Google Sheets)'}
                  {bulkModalFormat === 'addresses_only' && 'Wallet Addresses Only (1 per line)'}
                  {bulkModalFormat === 'amounts_only' && 'Amounts Only'}
                  {bulkModalFormat === 'json' && 'JSON Array format'}
                </span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-2">
                {[
                  { id: 'comma', label: 'Address, Amount' },
                  { id: 'space', label: 'Address Amount' },
                  { id: 'tab', label: 'Excel (Tab)' },
                  { id: 'addresses_only', label: 'Addresses Only' },
                  { id: 'amounts_only', label: 'Amounts Only' },
                  { id: 'json', label: 'JSON Array' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setBulkModalFormat(fmt.id as any)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold font-mono transition-all text-center cursor-pointer min-h-[38px] flex items-center justify-center ${
                      bulkModalFormat === fmt.id
                        ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-extrabold'
                        : 'bg-zinc-900/90 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 border border-zinc-800'
                    }`}
                  >
                    <span className="truncate">{fmt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Formatted Code Box */}
            <div className="flex-1 min-h-[150px] flex flex-col space-y-1.5">
              {(() => {
                const formattedContent = store.generateBulkFormattedData(
                  bulkModalFormat,
                  'pending',
                  bulkModalBatch.batchId
                );
                const lineCount = formattedContent.split('\n').filter(Boolean).length;

                return (
                  <>
                    <div className="flex items-center justify-between text-xs text-zinc-400 flex-wrap gap-1">
                      <span className="font-mono text-amber-300/90 font-bold">
                        {lineCount} {lineCount === 1 ? 'entry' : 'entries'} generated
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        Copy and paste directly into your bulk-payout tool
                      </span>
                    </div>

                    <div className="relative flex-1">
                      <textarea
                        readOnly
                        value={formattedContent || '(No pending requests in this batch)'}
                        rows={6}
                        className="w-full h-full bg-[#080b10] text-amber-200 font-mono text-xs p-3 rounded-xl sm:rounded-2xl border border-zinc-800 focus:outline-none focus:border-amber-500/60 resize-none select-all leading-relaxed"
                      />
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-zinc-800">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    const text = store.generateBulkFormattedData(bulkModalFormat, 'pending', bulkModalBatch.batchId);
                    navigator.clipboard.writeText(text);
                    setCopiedModalBulk(true);
                    setTimeout(() => setCopiedModalBulk(false), 2500);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 min-h-[40px]"
                >
                  {copiedModalBulk ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Data</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const text = store.generateBulkFormattedData(bulkModalFormat, 'pending', bulkModalBatch.batchId);
                    const ext = bulkModalFormat === 'json' ? 'json' : bulkModalFormat === 'tab' ? 'tsv' : 'txt';
                    downloadCsv(text, `${bulkModalBatch.batchId}_payouts_${bulkModalFormat}.${ext}`);
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors min-h-[40px]"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Download</span>
                </button>
              </div>

              {/* 1-Click Approve this Badge Button */}
              {bulkModalBatch.pendingCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const b = bulkModalBatch;
                    setBulkModalBatch(null);
                    setBatchToApproveModal(b);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 min-h-[40px]"
                >
                  <Zap className="w-4 h-4 fill-black" />
                  <span>1-Click Approve ({bulkModalBatch.pendingCount})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1-BUTTON 24H BATCH APPROVAL CONFIRMATION MODAL                            */}
      {/* ========================================================================= */}
      {batchToApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#0f1420] border border-emerald-500/50 p-6 shadow-2xl shadow-black relative space-y-4">
            <div className="flex items-center gap-3 text-emerald-400">
              <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30">
                <Zap className="w-7 h-7 text-emerald-400 fill-emerald-400/30" />
              </div>
              <div>
                <h3 className="font-cinzel text-lg font-bold text-zinc-100">
                  1-Click Batch Payout Approval
                </h3>
                <p className="text-xs text-emerald-400/90 font-mono">
                  {batchToApproveModal.batchDate} ({batchToApproveModal.batchId})
                </p>
              </div>
            </div>

            <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Total Users to Approve:</span>
                <span className="font-bold text-zinc-100">{batchToApproveModal.pendingCount} users</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Total Volume:</span>
                <span className="font-cinzel font-bold text-amber-300">
                  {batchToApproveModal.totalAmount.toLocaleString()} ELDRA
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">User Balances:</span>
                <span className="font-bold text-emerald-400">
                  Coins deducted & marked Paid instantly
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Clicking <strong>Confirm 1-Click Approval</strong> will approve all <strong className="text-amber-300">{batchToApproveModal.pendingCount} pending withdrawal requests</strong> in this 24-hour batch. Their coin amounts will be permanently deducted from their pending balances and recorded as complete.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setBatchToApproveModal(null)}
                className="w-1/2 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const bId = batchToApproveModal.batchId;
                  setBatchToApproveModal(null);
                  handleApproveSpecificBatch(bId);
                }}
                className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black text-xs font-extrabold shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:scale-105"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Mark Paid</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1-BUTTON ALL PENDING APPROVAL CONFIRMATION MODAL                          */}
      {/* ========================================================================= */}
      {showApproveAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#0f1420] border border-emerald-500/50 p-6 shadow-2xl shadow-black relative space-y-4">
            <div className="flex items-center gap-3 text-emerald-400">
              <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30">
                <Zap className="w-7 h-7 text-emerald-400 fill-emerald-400/30" />
              </div>
              <div>
                <h3 className="font-cinzel text-lg font-bold text-zinc-100">
                  Approve All Pending Across All Batches
                </h3>
                <p className="text-xs text-emerald-400/90">
                  Master 1-Click Payout Release
                </p>
              </div>
            </div>

            <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Total Pending Requests:</span>
                <span className="font-bold text-zinc-100">
                  {allWithdrawals.filter((w) => w.status === 'pending').length} users
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Total ELDRA to Settle:</span>
                <span className="font-cinzel font-bold text-amber-300">
                  {totalPendingAllTime.toLocaleString()} ELDRA
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              This will approve and mark paid <strong className="text-amber-300">every single pending withdrawal</strong> across all 24-hour batches, instantly updating all user balances and generating verifiable blockchain payment receipts.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowApproveAllModal(false)}
                className="w-1/2 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowApproveAllModal(false);
                  const count = store.approveAllPendingWithdrawals();
                  setSuccessMsg(`1-Click Master Payout complete! Approved ${count} pending withdrawal requests and deducted user balances. ⚡`);
                  setTimeout(() => setSuccessMsg(null), 4500);
                }}
                className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black text-xs font-extrabold shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:scale-105"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm All Payouts</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
