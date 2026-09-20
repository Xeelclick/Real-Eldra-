export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  displayName: string;
  username: string; // unique handle e.g. "satoshi" displayed as @satoshi
  password?: string;
  role: UserRole;
  balance: number; // Total ELDRA tokens
  dailyClaimBalance: number;
  referralBalance: number;
  quizBalance: number;
  lastClaimTimestamp: number | null; // epoch ms
  claimStreak: number;
  referralCode: string;
  referredBy?: string | null;
  createdAt: string;
  walletAddress?: string;
  withdrawnBalance?: number; // Total ELDRA successfully approved and paid
  pendingWithdrawalBalance?: number; // ELDRA in pending withdrawal review
  isBlocked?: boolean; // True if blocked/banned by admin or anti-cheat
  blockedReason?: string;
  blockedAt?: number;
  deviceFingerprint?: string; // Deep composite hardware + canvas + audio hash
  hardwareHash?: string; // Screen + cores + memory + webgl renderer
  cloneAppDetected?: boolean; // True if running in parallel space / virtual app / clone sandbox
  cloneAppDetails?: string; // Details of clone app detection
  lastIpCluster?: string; // Simulated IP cluster / network subnet
  lastLoginTimestamp?: number;
  fraudRiskScore?: number; // 0-100 score
  fraudFlags?: string[]; // e.g. ["CLONE_APP_SANDBOX", "CANVAS_FINGERPRINT_MATCH", "SHARED_SOLANA_WALLET", "SELF_REFERRAL_RING"]
}

export type TransactionType =
  | 'daily_claim'
  | 'referral_bonus'
  | 'quiz_reward'
  | 'quiz_completion_bonus'
  | 'withdrawal_request'
  | 'withdrawal_approved'
  | 'withdrawal_refund';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  timestamp: number;
  description: string;
  moduleTitle?: string;
  status?: 'pending' | 'completed' | 'rejected';
  walletAddress?: string;
  withdrawalId?: string;
}

export type WithdrawalStatus = 'pending' | 'approved' | 'rejected';

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userHandle: string; // e.g. "satoshi"
  walletAddress: string; // Solana destination wallet address
  amount: number; // ELDRA tokens to withdraw
  status: WithdrawalStatus;
  requestedAt: number; // epoch ms
  batchId: string; // e.g. "batch_2026-08-22" (24h compilation unit)
  batchDate: string; // formatted date string e.g. "2026-08-22"
  approvedAt?: number;
  approvedBy?: string;
  rejectionReason?: string;
  txHash?: string; // Optional on-chain Solscan transaction link or reference
}

export interface WithdrawalBatch {
  batchId: string;
  batchDate: string;
  startTimestamp: number;
  endTimestamp: number;
  totalRequests: number;
  totalAmount: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  status: 'pending' | 'partially_approved' | 'approved' | 'empty';
  requests: WithdrawalRequest[];
}

export interface ReferralRecord {
  id: string;
  referrerId: string;
  referredUserId: string;
  referredEmail: string;
  referredName: string;
  timestamp: number;
  rewardAmount: number; // 5 ELDRA
  status: 'completed' | 'pending';
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  username: string;
  email: string;
  referralCount: number;
  totalReferralEldra: number;
  totalBalance: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: [string, string, string, string] | string[];
  correctOptionIndex: number;
  explanation: string;
  rewardAmount: number; // 2 ELDRA per question
}

export interface EducationalModule {
  id: string;
  title: string;
  category: string;
  summary: string;
  externalUrl: string; // URL for users to visit and read external article
  content?: string;
  readTimeMinutes: number;
  completionBonus: number; // 20 ELDRA for passing
  passingScorePercentage: number; // e.g. 75%
  questions: QuizQuestion[];
  createdAt: string;
  expiresAt?: number; // epoch ms (24 hours after creation)
  isPublished: boolean;
  authorEmail?: string;
}

export interface UserQuizProgress {
  moduleId: string;
  userId: string;
  attempted: boolean;
  completed: boolean;
  score: number;
  totalQuestions: number;
  correctAnswersCount: number;
  earnedCoins: number;
  passed: boolean;
  completedAt: string;
  userAnswers: Record<string, number>;
}

export interface BlockedDeviceInfo {
  deviceId: string;
  hardwareHash?: string;
  reason: string;
  blockedAt: number;
  userAgent: string;
  attemptedEmail: string;
  registeredEmail?: string;
  registeredUsername?: string;
  ipCluster?: string;
  cloneAppIndicator?: string;
}

export interface FraudCluster {
  clusterId: string; // e.g. "cluster_hw_7f8a91" or "cluster_clone_dualspace_12"
  badgeName: string; // e.g. "Badge #104: 4 Cloned Accounts"
  primaryFingerprint: string;
  hardwareSummary: string; // e.g. "1080x2400 • 8 Cores • Mali-G78 GPU • Dual Space Cloner"
  detectionType: 'CLONE_APP' | 'HARDWARE_FINGERPRINT' | 'SHARED_WALLET' | 'SELF_REFERRAL' | 'MIXED_SYBIL';
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  totalAccounts: number;
  totalIllicitEldra: number;
  totalPendingWithdrawals: number;
  detectedCloneMethod?: string;
  accounts: User[];
  isFullyBlocked: boolean;
  detectedAt: number;
  sharedWalletAddress?: string;
  evidenceList: string[];
}

export interface DeviceFingerprintData {
  deviceId: string;
  hardwareHash: string;
  canvasHash: string;
  audioHash: string;
  webglRenderer: string;
  screenResolution: string;
  deviceMemory: number;
  cpuCores: number;
  timezone: string;
  language: string;
  platform: string;
  cloneAppDetected: boolean;
  cloneAppType?: string;
  confidenceScore: number;
}


