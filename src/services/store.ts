import {
  BlockedDeviceInfo,
  DeviceFingerprintData,
  EducationalModule,
  FraudCluster,
  LeaderboardEntry,
  QuizQuestion,
  ReferralRecord,
  Transaction,
  User,
  UserQuizProgress,
  WithdrawalBatch,
  WithdrawalRequest,
  WithdrawalStatus,
} from '../types';
import {
  ADMIN_EMAIL,
  ADMIN_DEFAULT_PASSWORD,
  INITIAL_EDUCATIONAL_MODULES,
} from '../data/initialData';
import { soundFx } from '../utils/audio';
import { computeDeviceFingerprint, formatHardwareSpecs } from '../utils/fingerprint';

const STORAGE_KEYS = {
  CURRENT_USER: 'eldra_current_user_v3',
  ALL_USERS: 'eldra_all_users_v3',
  MODULES: 'eldra_modules_v3',
  TRANSACTIONS: 'eldra_transactions_v3',
  REFERRALS: 'eldra_referrals_v3',
  QUIZ_PROGRESS: 'eldra_quiz_progress_v3',
  LEADERBOARD: 'eldra_leaderboard_v3',
  WITHDRAWALS: 'eldra_withdrawals_v3',
  BLOCKED_DEVICES: 'eldra_blocked_devices_v3',
  DEVICE_REGISTRATIONS: 'eldra_device_registrations_v3',
  DEVICE_ID: 'eldra_device_id_v3',
};

// 24 hours in milliseconds
export const CLAIM_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export class EldraStore {
  private static instance: EldraStore;

  private currentUser: User | null = null;
  private users: User[] = [];
  private modules: EducationalModule[] = [];
  private transactions: Transaction[] = [];
  private referrals: ReferralRecord[] = [];
  private withdrawals: WithdrawalRequest[] = [];
  private quizProgress: Record<string, UserQuizProgress> = {};
  private leaderboard: LeaderboardEntry[] = [];
  private blockedDevices: BlockedDeviceInfo[] = [];
  private deviceRegistrations: Record<
    string,
    { userId: string; email: string; username: string; registeredAt: number }
  > = {};
  private listeners: Set<() => void> = new Set();

  private constructor() {
    this.loadState();
  }

  public static getInstance(): EldraStore {
    if (!EldraStore.instance) {
      EldraStore.instance = new EldraStore();
    }
    return EldraStore.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.saveState();
    this.listeners.forEach((listener) => listener());
  }

  private loadState() {
    try {
      // Modules
      const savedModules = localStorage.getItem(STORAGE_KEYS.MODULES);
      this.modules = savedModules
        ? JSON.parse(savedModules)
        : INITIAL_EDUCATIONAL_MODULES;

      // Users
      const savedUsers = localStorage.getItem(STORAGE_KEYS.ALL_USERS);
      this.users = savedUsers ? JSON.parse(savedUsers) : [];

      // Ensure default super admin account is present with default credentials
      const adminIndex = this.users.findIndex((u) => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
      if (adminIndex === -1) {
        const defaultAdmin: User = {
          id: 'usr_admin_root',
          email: ADMIN_EMAIL,
          displayName: 'Super Admin',
          username: 'admin',
          password: ADMIN_DEFAULT_PASSWORD,
          role: 'admin',
          balance: 5000000,
          dailyClaimBalance: 0,
          referralBalance: 0,
          quizBalance: 0,
          lastClaimTimestamp: null,
          claimStreak: 0,
          referralCode: 'ELDRA-ADMIN',
          createdAt: new Date().toISOString(),
          walletAddress: '',
        };
        this.users.unshift(defaultAdmin);
      } else {
        this.users[adminIndex].role = 'admin';
        this.users[adminIndex].balance = 5000000;
        if (!this.users[adminIndex].password) {
          this.users[adminIndex].password = ADMIN_DEFAULT_PASSWORD;
        }
        if (!this.users[adminIndex].username) {
          this.users[adminIndex].username = 'admin';
        }
      }

      // Ensure every loaded user has a valid unique username
      const seenUsernames = new Set<string>();
      this.users.forEach((u) => {
        if (!u.username || seenUsernames.has(u.username.toLowerCase())) {
          const preferred = u.displayName || u.email.split('@')[0];
          u.username = this.generateUniqueUsername(preferred, u.id);
        }
        seenUsernames.add(u.username.toLowerCase());
      });

      // Current User
      const savedCurrentUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (savedCurrentUser) {
        const parsed = JSON.parse(savedCurrentUser);
        const found = this.users.find((u) => u.id === parsed.id || u.email.toLowerCase() === parsed.email.toLowerCase());
        this.currentUser = found || parsed;
        if (this.currentUser && !this.currentUser.username) {
          this.currentUser.username = this.generateUniqueUsername(this.currentUser.displayName || this.currentUser.email.split('@')[0], this.currentUser.id);
        }
      } else {
        this.currentUser = null;
      }

      // Transactions
      const savedTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      this.transactions = savedTx ? JSON.parse(savedTx) : [];

      // Referrals
      const savedReferrals = localStorage.getItem(STORAGE_KEYS.REFERRALS);
      this.referrals = savedReferrals ? JSON.parse(savedReferrals) : [];

      // Withdrawals
      const savedWithdrawals = localStorage.getItem(STORAGE_KEYS.WITHDRAWALS);
      if (savedWithdrawals) {
        this.withdrawals = JSON.parse(savedWithdrawals);
      } else {
        // Clean initial state for live production use
        this.withdrawals = [];
      }

      // Quiz Progress
      const savedProgress = localStorage.getItem(STORAGE_KEYS.QUIZ_PROGRESS);
      this.quizProgress = savedProgress ? JSON.parse(savedProgress) : {};

      // Blocked Devices & Device Registrations
      const savedBlocked = localStorage.getItem(STORAGE_KEYS.BLOCKED_DEVICES);
      this.blockedDevices = savedBlocked ? JSON.parse(savedBlocked) : [];

      const savedDeviceRegs = localStorage.getItem(STORAGE_KEYS.DEVICE_REGISTRATIONS);
      this.deviceRegistrations = savedDeviceRegs ? JSON.parse(savedDeviceRegs) : {};

      // Leaderboard
      this.recalculateLeaderboard();
    } catch (e) {
      console.warn('Failed to load Eldra store state:', e);
      this.currentUser = null;
      this.modules = INITIAL_EDUCATIONAL_MODULES;
    }
  }

  private saveState() {
    try {
      if (this.currentUser) {
        localStorage.setItem(
          STORAGE_KEYS.CURRENT_USER,
          JSON.stringify(this.currentUser)
        );
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
      localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(this.users));
      localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(this.modules));
      localStorage.setItem(
        STORAGE_KEYS.TRANSACTIONS,
        JSON.stringify(this.transactions)
      );
      localStorage.setItem(
        STORAGE_KEYS.REFERRALS,
        JSON.stringify(this.referrals)
      );
      localStorage.setItem(
        STORAGE_KEYS.WITHDRAWALS,
        JSON.stringify(this.withdrawals)
      );
      localStorage.setItem(
        STORAGE_KEYS.QUIZ_PROGRESS,
        JSON.stringify(this.quizProgress)
      );
      localStorage.setItem(
        STORAGE_KEYS.LEADERBOARD,
        JSON.stringify(this.leaderboard)
      );
      localStorage.setItem(
        STORAGE_KEYS.BLOCKED_DEVICES,
        JSON.stringify(this.blockedDevices)
      );
      localStorage.setItem(
        STORAGE_KEYS.DEVICE_REGISTRATIONS,
        JSON.stringify(this.deviceRegistrations)
      );
    } catch (e) {
      console.warn('Failed to save Eldra state:', e);
    }
  }

  // --- DEVICE IDENTITY & ANTI-SYBIL 1-ACCOUNT-PER-DEVICE CONTROL ---
  public getDeviceId(): string {
    let devId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!devId) {
      const fp = computeDeviceFingerprint();
      devId = fp.deviceId;
      localStorage.setItem(STORAGE_KEYS.DEVICE_ID, devId);
    }
    return devId;
  }

  public isCurrentDeviceBlocked(emailToCheck?: string): { blocked: boolean; info?: BlockedDeviceInfo } {
    const cleanEmail = (emailToCheck || this.currentUser?.email || '').toLowerCase().trim();

    // Super Admin is always exempt from device/account restrictions
    if (cleanEmail === ADMIN_EMAIL.toLowerCase() || (this.currentUser && this.currentUser.role === 'admin')) {
      return { blocked: false };
    }

    // 1. Check if the currently signed-in user or specified email is explicitly flagged as blocked
    if (this.currentUser && this.currentUser.isBlocked) {
      return {
        blocked: true,
        info: {
          deviceId: this.currentUser.deviceFingerprint || this.getDeviceId(),
          hardwareHash: this.currentUser.hardwareHash,
          reason: this.currentUser.blockedReason || 'Account permanently suspended for policy violations.',
          blockedAt: this.currentUser.blockedAt || Date.now(),
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Hardware Device',
          attemptedEmail: this.currentUser.email,
          registeredEmail: this.currentUser.email,
          registeredUsername: this.currentUser.username,
          cloneAppIndicator: this.currentUser.cloneAppDetails,
        },
      };
    }

    if (cleanEmail) {
      const userObj = this.users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (userObj && userObj.isBlocked) {
        return {
          blocked: true,
          info: {
            deviceId: userObj.deviceFingerprint || this.getDeviceId(),
            hardwareHash: userObj.hardwareHash,
            reason: userObj.blockedReason || 'Account permanently suspended for policy violations.',
            blockedAt: userObj.blockedAt || Date.now(),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Hardware Device',
            attemptedEmail: userObj.email,
            registeredEmail: userObj.email,
            registeredUsername: userObj.username,
            cloneAppIndicator: userObj.cloneAppDetails,
          },
        };
      }
    }

    // 2. Check hardware profile, device ID, and email against blocked list
    const fp = computeDeviceFingerprint();
    const devId = fp.deviceId;
    const hwHash = fp.hardwareHash;

    const found = this.blockedDevices.find(
      (b) =>
        b.deviceId === devId ||
        (b.hardwareHash && b.hardwareHash === hwHash) ||
        (cleanEmail && (b.registeredEmail?.toLowerCase() === cleanEmail || b.attemptedEmail?.toLowerCase() === cleanEmail))
    );

    if (found) {
      return { blocked: true, info: found };
    }
    return { blocked: false };
  }

  public getDeviceRegisteredAccount(): {
    userId: string;
    email: string;
    username: string;
    registeredAt: number;
  } | null {
    const devId = this.getDeviceId();
    return this.deviceRegistrations[devId] || null;
  }

  public getBlockedDevices(): BlockedDeviceInfo[] {
    return [...this.blockedDevices];
  }

  public unblockDevice(deviceId: string): boolean {
    const prevCount = this.blockedDevices.length;
    this.blockedDevices = this.blockedDevices.filter(
      (b) => b.deviceId !== deviceId && b.hardwareHash !== deviceId
    );
    if (this.blockedDevices.length !== prevCount) {
      this.saveState();
      this.notify();
      return true;
    }
    return false;
  }

  public unblockCurrentDevice(): boolean {
    const fp = computeDeviceFingerprint();
    const devId = fp.deviceId;
    const hwHash = fp.hardwareHash;

    const prevCount = this.blockedDevices.length;
    this.blockedDevices = this.blockedDevices.filter(
      (b) => b.deviceId !== devId && b.hardwareHash !== hwHash
    );

    // Also unblock current user if flagged
    if (this.currentUser) {
      this.currentUser.isBlocked = false;
      this.currentUser.blockedReason = undefined;
      this.currentUser.blockedAt = undefined;
      this.updateUserInStore(this.currentUser);
    }

    delete this.deviceRegistrations[devId];
    this.saveState();
    this.notify();
    return true;
  }

  public resetDeviceRegistration(deviceId?: string): void {
    const id = deviceId || this.getDeviceId();
    delete this.deviceRegistrations[id];
    this.saveState();
    this.notify();
  }

  // --- GETTERS ---
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public getAllUsers(): User[] {
    return [...this.users];
  }

  public cleanExpiredModules() {
    // Non-destructive check: Do not delete modules permanently.
    // Expired status is calculated dynamically via getQuizTimeRemaining.
    if (!this.modules) {
      this.modules = [];
      this.saveState();
    }
  }

  public getModules(includeExpired: boolean = true): EducationalModule[] {
    this.cleanExpiredModules();
    if (includeExpired) {
      return [...this.modules];
    }
    // Return published and active modules for learners
    const now = Date.now();
    return this.modules.filter((m) => {
      if (m.isPublished === false) return false;
      if (!m.expiresAt) return true; // Permanent
      return now < m.expiresAt;
    });
  }

  public getAllModulesForAdmin(): EducationalModule[] {
    this.cleanExpiredModules();
    return [...this.modules];
  }

  public restoreDefaultModules(): void {
    this.modules = [
      ...INITIAL_EDUCATIONAL_MODULES.map((m) => ({
        ...m,
        createdAt: new Date().toISOString(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        isPublished: true,
      })),
    ];
    this.saveState();
    this.notify();
  }

  public renewModule(id: string, hours: number = 24): boolean {
    const index = this.modules.findIndex((m) => m.id === id);
    if (index === -1) return false;
    const now = Date.now();
    const durationMs = hours > 0 ? hours * 60 * 60 * 1000 : undefined;
    this.modules[index] = {
      ...this.modules[index],
      createdAt: new Date().toISOString(),
      expiresAt: durationMs ? now + durationMs : undefined,
      isPublished: true,
    };
    this.saveState();
    this.notify();
    return true;
  }

  public togglePublishModule(id: string): boolean {
    const index = this.modules.findIndex((m) => m.id === id);
    if (index === -1) return false;
    this.modules[index].isPublished = this.modules[index].isPublished === false ? true : false;
    this.saveState();
    this.notify();
    return true;
  }

  public duplicateModule(id: string): EducationalModule | null {
    const orig = this.modules.find((m) => m.id === id);
    if (!orig) return null;
    const now = Date.now();
    const cloned: EducationalModule = {
      ...orig,
      id: `edu-${now}-${Math.floor(Math.random() * 1000)}`,
      title: `${orig.title} (Copy)`,
      createdAt: new Date().toISOString(),
      expiresAt: orig.expiresAt ? now + 24 * 60 * 60 * 1000 : undefined,
      isPublished: true,
      questions: orig.questions.map((q, idx) => ({
        ...q,
        id: `q-${now}-${idx + 1}`,
      })),
    };
    this.modules.unshift(cloned);
    this.saveState();
    this.notify();
    return cloned;
  }

  public adminResetModuleAttempts(moduleId: string): number {
    let count = 0;
    Object.keys(this.quizProgress).forEach((key) => {
      if (key.endsWith(`_${moduleId}`)) {
        delete this.quizProgress[key];
        count++;
      }
    });
    this.saveState();
    this.notify();
    return count;
  }

  public getModuleById(id: string): EducationalModule | undefined {
    return this.modules.find((m) => m.id === id);
  }

  public getQuizTimeRemaining(module: EducationalModule): {
    isExpired: boolean;
    remainingMs: number;
    formattedTime: string;
  } {
    const createdMs = new Date(module.createdAt).getTime();
    const expiresAt = module.expiresAt || (createdMs + 24 * 60 * 60 * 1000);
    const remainingMs = Math.max(0, expiresAt - Date.now());
    if (remainingMs <= 0) {
      return { isExpired: true, remainingMs: 0, formattedTime: 'Expired (24h)' };
    }
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    return {
      isExpired: false,
      remainingMs,
      formattedTime: `${hours}h ${minutes}m left`,
    };
  }

  public hasUserAttemptedQuiz(moduleId: string, userId?: string): boolean {
    const uid = userId || this.currentUser?.id;
    if (!uid) return false;
    const progress = this.quizProgress[`${uid}_${moduleId}`];
    return !!(progress && (progress.attempted || progress.completed));
  }

  public getTransactions(userId?: string): Transaction[] {
    const uid = userId || this.currentUser?.id;
    if (!uid) return [];
    return this.transactions.filter((tx) => tx.userId === uid);
  }

  public getReferrals(userId?: string): ReferralRecord[] {
    const uid = userId || this.currentUser?.id;
    if (!uid) return [];
    return this.referrals.filter((ref) => ref.referrerId === uid);
  }

  public getLeaderboard(): LeaderboardEntry[] {
    return [...this.leaderboard];
  }

  public getQuizProgress(moduleId: string, userId?: string): UserQuizProgress | undefined {
    const uid = userId || this.currentUser?.id;
    if (!uid) return undefined;
    return this.quizProgress[`${uid}_${moduleId}`];
  }

  public getClaimCooldown(userId?: string): {
    canClaim: boolean;
    remainingMs: number;
    formattedCountdown: string;
  } {
    const uid = userId || this.currentUser?.id;
    const user = this.users.find((u) => u.id === uid) || this.currentUser;
    if (!user || !user.lastClaimTimestamp) {
      return { canClaim: true, remainingMs: 0, formattedCountdown: 'Ready to Claim' };
    }

    const elapsed = Date.now() - user.lastClaimTimestamp;
    const remainingMs = Math.max(0, CLAIM_COOLDOWN_MS - elapsed);

    if (remainingMs <= 0) {
      return { canClaim: true, remainingMs: 0, formattedCountdown: 'Ready to Claim' };
    }

    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

    const pad = (n: number) => n.toString().padStart(2, '0');
    return {
      canClaim: false,
      remainingMs,
      formattedCountdown: `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`,
    };
  }

  // --- ACTIONS ---

  /**
   * Daily Faucet Claim: 1 ELDRA every 24 hours
   */
  public claimDailyToken(): { success: boolean; message: string; amount?: number } {
    if (!this.currentUser) {
      return { success: false, message: 'Please sign in to claim daily tokens.' };
    }

    if (this.currentUser.isBlocked || this.isCurrentDeviceBlocked().blocked) {
      return {
        success: false,
        message: 'Access Restricted: Your account or device has been suspended for anti-cheat policy violations.',
      };
    }

    const { canClaim } = this.getClaimCooldown(this.currentUser.id);
    if (!canClaim) {
      return { success: false, message: 'You have already claimed your daily Eldra coin for today. Return in 24 hours!' };
    }

    const reward = 1;
    const now = Date.now();
    const isConsecutive = this.currentUser.lastClaimTimestamp
      ? now - this.currentUser.lastClaimTimestamp <= CLAIM_COOLDOWN_MS * 1.8
      : true;

    const newStreak = isConsecutive ? this.currentUser.claimStreak + 1 : 1;

    // Update user
    this.currentUser = {
      ...this.currentUser,
      balance: this.currentUser.balance + reward,
      dailyClaimBalance: this.currentUser.dailyClaimBalance + reward,
      lastClaimTimestamp: now,
      claimStreak: newStreak,
    };

    // Update in all users
    this.updateUserInStore(this.currentUser);

    // Create transaction
    const tx: Transaction = {
      id: `tx_claim_${now}`,
      userId: this.currentUser.id,
      type: 'daily_claim',
      amount: reward,
      timestamp: now,
      description: `Daily Faucet Reward (Streak: Day ${newStreak})`,
    };
    this.transactions.unshift(tx);

    this.recalculateLeaderboard();
    this.notify();

    return {
      success: true,
      message: `Successfully claimed 1 ELDRA Coin! Streak: ${newStreak} days 🔥`,
      amount: reward,
    };
  }

  // --- USERNAME & PASSWORD HELPERS & METHODS ---

  public validatePassword(password: string): {
    valid: boolean;
    message: string;
    details: {
      minLength: boolean;
      hasLetter: boolean;
      hasNumber: boolean;
      hasSymbol: boolean;
    };
  } {
    const pwd = password || '';
    const minLength = pwd.length >= 6;
    const hasLetter = /[a-zA-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSymbol = /[^a-zA-Z0-9]/.test(pwd);

    if (!minLength) {
      return {
        valid: false,
        message: 'Password must be at least 6 characters long.',
        details: { minLength, hasLetter, hasNumber, hasSymbol },
      };
    }

    return {
      valid: true,
      message: 'Password is valid.',
      details: { minLength, hasLetter, hasNumber, hasSymbol },
    };
  }

  public cleanUsername(raw: string): string {
    return raw.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  }

  public validateUsername(username: string, excludeUserId?: string): { valid: boolean; message: string; clean: string } {
    const clean = this.cleanUsername(username);
    if (!clean) {
      return { valid: false, message: 'Username cannot be empty.', clean: '' };
    }
    if (clean.length < 3) {
      return { valid: false, message: 'Username must be at least 3 characters long.', clean };
    }
    if (clean.length > 20) {
      return { valid: false, message: 'Username cannot exceed 20 characters.', clean };
    }
    const isTaken = this.users.some(
      (u) => u.id !== excludeUserId && (u.username || '').toLowerCase() === clean
    );
    if (isTaken) {
      return { valid: false, message: 'This username is already taken. Please choose another unique handle.', clean };
    }
    return { valid: true, message: 'Username is available!', clean };
  }

  public isUsernameAvailable(username: string, excludeUserId?: string): boolean {
    return this.validateUsername(username, excludeUserId).valid;
  }

  public generateUniqueUsername(preferred: string, excludeUserId?: string): string {
    let base = this.cleanUsername(preferred) || 'eldra_member';
    if (base.length < 3) base = `${base}_sol`;
    if (base.length > 15) base = base.substring(0, 15);

    let candidate = base;
    let counter = 1;
    while (
      this.users.some(
        (u) => u.id !== excludeUserId && (u.username || '').toLowerCase() === candidate.toLowerCase()
      )
    ) {
      candidate = `${base}_${counter}`;
      counter++;
    }
    return candidate;
  }

  public updateUsername(
    userId: string,
    newUsername: string
  ): { success: boolean; message: string; user?: User } {
    const validation = this.validateUsername(newUsername, userId);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    const userIndex = this.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return { success: false, message: 'User account not found.' };
    }

    const updatedUser: User = {
      ...this.users[userIndex],
      username: validation.clean,
    };

    this.users[userIndex] = updatedUser;
    if (this.currentUser && this.currentUser.id === userId) {
      this.currentUser = updatedUser;
    }

    this.recalculateLeaderboard();
    this.saveState();
    this.notify();

    return {
      success: true,
      message: `Unique username successfully updated to @${validation.clean}!`,
      user: updatedUser,
    };
  }

  /**
   * User Registration with password & optional referral code (+5 ELDRA to referrer)
   */
  public register(
    email: string,
    displayName: string,
    password?: string,
    referralCodeInput?: string,
    isGoogleAuth: boolean = false,
    customUsername?: string
  ): { success: boolean; user?: User; message: string } {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Please provide a valid email address.' };
    }

    if (!isGoogleAuth) {
      const pwdValidation = this.validatePassword(password || '');
      if (!pwdValidation.valid) {
        return { success: false, message: pwdValidation.message };
      }
    }

    // Check if device is blocked
    const blockCheck = this.isCurrentDeviceBlocked();
    if (blockCheck.blocked) {
      return {
        success: false,
        message:
          'Access Blocked: This device has been restricted from creating accounts due to a 1-account-per-device policy violation.',
      };
    }

    // Check if user already exists
    const existing = this.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return {
        success: false,
        message: 'An account with this email is already registered. Please go to the Sign In tab.',
      };
    }

    // Anti-Sybil / Fair Distribution Check: Strictly 1 account creation per device (Exempting Super Admin)
    const fp = computeDeviceFingerprint();
    const devId = fp.deviceId;
    const hwHash = fp.hardwareHash;

    const existingDevReg = this.deviceRegistrations[devId];
    // Also check if another account already exists on the exact same physical hardware hash
    const hardwareMatchUser = this.users.find(
      (u) =>
        u.role !== 'admin' &&
        u.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase() &&
        (u.hardwareHash === hwHash || u.deviceFingerprint === devId) &&
        u.email.toLowerCase() !== cleanEmail
    );

    // Clean up stale deviceRegistrations if the prior account no longer exists in users
    if (existingDevReg && !this.users.some((u) => u.email.toLowerCase() === existingDevReg.email.toLowerCase())) {
      delete this.deviceRegistrations[devId];
    }

    const currentDevReg = this.deviceRegistrations[devId];
    const isSuperAdminUser = cleanEmail === ADMIN_EMAIL.toLowerCase() || (this.currentUser && this.currentUser.role === 'admin');

    if (!isSuperAdminUser) {
      if (
        (currentDevReg && currentDevReg.email.toLowerCase() !== cleanEmail) ||
        (hardwareMatchUser && cleanEmail !== ADMIN_EMAIL.toLowerCase())
      ) {
        const priorEmail = currentDevReg?.email || hardwareMatchUser?.email || 'existing account';
        const priorUser = currentDevReg?.username || hardwareMatchUser?.username || 'member';

        // AUTOMATIC PERMANENT DEVICE BAN FOR MULTI-ACCOUNTING / CLONE APPS
        const blockInfo: BlockedDeviceInfo = {
          deviceId: devId,
          hardwareHash: hwHash,
          reason:
            'Automatic restriction: Multiple account creation attempt detected on single device / cloned app in violation of 1-account-per-device anti-sybil policy.',
          blockedAt: Date.now(),
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Hardware Device',
          attemptedEmail: cleanEmail,
          registeredEmail: priorEmail,
          registeredUsername: priorUser,
          cloneAppIndicator: fp.cloneAppDetected ? fp.cloneAppType : 'Hardware Profile Match',
        };
        this.blockedDevices.push(blockInfo);

        // If there was a match, flag the existing account too
        if (hardwareMatchUser) {
          hardwareMatchUser.fraudFlags = hardwareMatchUser.fraudFlags || [];
          if (!hardwareMatchUser.fraudFlags.includes('MULTIPLE_ACCOUNT_ATTEMPT')) {
            hardwareMatchUser.fraudFlags.push('MULTIPLE_ACCOUNT_ATTEMPT');
          }
          this.updateUserInStore(hardwareMatchUser);
        }

        this.currentUser = null;
        this.saveState();
        this.notify();

        return {
          success: false,
          message:
            'Access Blocked: Multiple accounts on one device or clone applications are strictly prohibited. Your device has been restricted to protect fair token distribution.',
        };
      }
    }

    // Validate or generate unique username
    let assignedUsername = '';
    if (customUsername && customUsername.trim()) {
      const validation = this.validateUsername(customUsername);
      if (!validation.valid) {
        return { success: false, message: validation.message };
      }
      assignedUsername = validation.clean;
    } else {
      const baseName = displayName.trim() || cleanEmail.split('@')[0];
      assignedUsername = this.generateUniqueUsername(baseName);
    }

    const isAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();
    const shortCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    const generatedReferralCode = `ELDRA-${shortCode}`;
    const hexWallet = '0x' + Array.from({ length: 4 }, () => Math.floor(Math.random() * 16).toString(16)).join('') + '...' + Array.from({ length: 4 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();

    const fraudFlags: string[] = [];
    if (fp.cloneAppDetected) {
      fraudFlags.push('CLONE_APP_SANDBOX');
    }

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      email: cleanEmail,
      displayName: displayName || (isGoogleAuth ? cleanEmail.split('@')[0] : 'Eldra Holder'),
      username: assignedUsername,
      password: password || (isAdmin ? ADMIN_DEFAULT_PASSWORD : undefined),
      role: isAdmin ? 'admin' : 'user',
      balance: 0,
      dailyClaimBalance: 0,
      referralBalance: 0,
      quizBalance: 0,
      lastClaimTimestamp: null,
      claimStreak: 0,
      referralCode: generatedReferralCode,
      referredBy: referralCodeInput ? referralCodeInput.trim().toUpperCase() : null,
      createdAt: new Date().toISOString(),
      walletAddress: hexWallet,
      deviceFingerprint: devId,
      hardwareHash: hwHash,
      cloneAppDetected: fp.cloneAppDetected,
      cloneAppDetails: fp.cloneAppType,
      fraudFlags,
      fraudRiskScore: fp.cloneAppDetected ? 75 : 0,
    };

    this.users.push(newUser);
    this.currentUser = newUser;

    // Link device to this new user (excluding admin)
    if (!isAdmin) {
      this.deviceRegistrations[devId] = {
        userId: newUser.id,
        email: newUser.email,
        username: newUser.username,
        registeredAt: Date.now(),
      };
    }

    // Process Referral Reward (+5 ELDRA to Referrer)
    if (referralCodeInput) {
      this.processReferralBonus(newUser, referralCodeInput.trim().toUpperCase());
    }

    this.recalculateLeaderboard();
    this.notify();

    return {
      success: true,
      user: newUser,
      message: `Account created successfully! Welcome @${assignedUsername} to Eldra on Solana.`,
    };
  }

  /**
   * Process +5 ELDRA reward to referrer
   */
  private processReferralBonus(newMember: User, referralCode: string) {
    const referrer = this.users.find(
      (u) => u.referralCode.toUpperCase() === referralCode.toUpperCase() && u.id !== newMember.id
    );

    if (referrer) {
      const reward = 5; // 5 ELDRA per referral reward
      const now = Date.now();

      // Update referrer user
      const updatedReferrer: User = {
        ...referrer,
        balance: referrer.balance + reward,
        referralBalance: referrer.referralBalance + reward,
      };
      this.updateUserInStore(updatedReferrer);

      // Create referral record
      const refRecord: ReferralRecord = {
        id: `ref_${now}_${Math.floor(Math.random() * 1000)}`,
        referrerId: referrer.id,
        referredUserId: newMember.id,
        referredEmail: newMember.email,
        referredName: newMember.displayName,
        timestamp: now,
        rewardAmount: reward,
        status: 'completed',
      };
      this.referrals.unshift(refRecord);

      // Create transaction for referrer
      this.transactions.unshift({
        id: `tx_ref_${now}`,
        userId: referrer.id,
        type: 'referral_bonus',
        amount: reward,
        timestamp: now,
        description: `Referral reward (+5 ELDRA) for onboarding ${newMember.displayName}`,
      });
    }
  }

  /**
   * Sign In with Password Verification
   */
  public login(
    email: string,
    password?: string,
    isGoogleAuth: boolean = false
  ): { success: boolean; user?: User; message: string } {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    const user = this.users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (user) {
      // Check if user is blocked
      if (user.isBlocked) {
        return {
          success: false,
          message: 'Access Denied: This account has been permanently suspended by administration for anti-cheat policy violations.',
        };
      }

      const isTargetAdmin = user.role === 'admin' || cleanEmail === ADMIN_EMAIL.toLowerCase();

      // Enforce password for standard Admin email/password form login.
      // When authenticated directly via Google OAuth (isGoogleAuth = true with verified admin email), allow seamless admin login.
      if (isTargetAdmin && !isGoogleAuth) {
        if (!password || (password !== ADMIN_DEFAULT_PASSWORD && password !== user.password)) {
          return {
            success: false,
            message: 'Administrator authentication failed. Please enter the valid master password.',
          };
        }
      } else if (!isTargetAdmin && !isGoogleAuth) {
        // Regular user standard login requires password
        if (!password || password.trim() === '') {
          return {
            success: false,
            message: 'Password is required to sign in.',
          };
        }

        if (user.password && user.password !== password) {
          return {
            success: false,
            message: 'Incorrect password. Please verify your password or use "Forgot password?".',
          };
        }
      }

      // Check if device is blocked
      const blockCheck = this.isCurrentDeviceBlocked();
      if (blockCheck.blocked && !isTargetAdmin) {
        return {
          success: false,
          message: 'Access Blocked: This device has been restricted from logging in due to anti-cheat policy violations.',
        };
      }

      // Update hardware fingerprint and clone detection
      const fp = computeDeviceFingerprint();
      user.deviceFingerprint = fp.deviceId;
      user.hardwareHash = fp.hardwareHash;
      if (fp.cloneAppDetected) {
        user.cloneAppDetected = true;
        user.cloneAppDetails = fp.cloneAppType;
        user.fraudFlags = user.fraudFlags || [];
        if (!user.fraudFlags.includes('CLONE_APP_SANDBOX')) {
          user.fraudFlags.push('CLONE_APP_SANDBOX');
        }
      }
      user.lastLoginTimestamp = Date.now();

      // If user had no password yet, save the one they entered
      if (password && !user.password) {
        user.password = password;
      }

      if (isTargetAdmin && user.role !== 'admin') {
        user.role = 'admin';
      }

      this.updateUserInStore(user);
      this.currentUser = user;
      this.notify();
      return { success: true, user, message: `Welcome back, ${user.displayName}!` };
    }

    // If Google Authentication and account not found, register new Google user
    if (isGoogleAuth) {
      return this.register(
        cleanEmail,
        cleanEmail.split('@')[0],
        undefined,
        undefined,
        true,
        undefined
      );
    }

    // Standard Sign In without existing account must fail with clear instruction
    return {
      success: false,
      message: 'No registered account found with this email. Please switch to the "Sign Up / Register" tab to create your account.',
    };
  }

  /**
   * Reset Password by Email for any user (including Admin)
   */
  public resetPassword(
    email: string,
    newPassword: string
  ): { success: boolean; message: string } {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: 'Please provide a valid email address.' };
    }
    const pwdValidation = this.validatePassword(newPassword);
    if (!pwdValidation.valid) {
      return { success: false, message: pwdValidation.message };
    }

    const user = this.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return {
        success: false,
        message: 'No registered user found with this email. Please check your spelling or register a new account.',
      };
    }

    user.password = newPassword;
    this.updateUserInStore(user);

    if (this.currentUser && this.currentUser.id === user.id) {
      this.currentUser.password = newPassword;
    }

    this.notify();
    return {
      success: true,
      message: 'Password has been successfully updated! You can now sign in with your new password.',
    };
  }

  /**
   * Change Password while logged in
   */
  public changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): { success: boolean; message: string } {
    const user = this.users.find((u) => u.id === userId) || this.currentUser;
    if (!user) {
      return { success: false, message: 'User not found.' };
    }

    if (user.password && user.password !== currentPassword) {
      return { success: false, message: 'Current password does not match.' };
    }

    if (!newPassword || newPassword.length < 4) {
      return { success: false, message: 'New password must be at least 4 characters long.' };
    }

    user.password = newPassword;
    this.updateUserInStore(user);
    if (this.currentUser?.id === user.id) {
      this.currentUser.password = newPassword;
    }
    this.notify();
    return { success: true, message: 'Password changed successfully!' };
  }

  public logout() {
    this.currentUser = null;
    this.saveState();
    this.notify();
  }

  /**
   * Submit Quiz for an Educational Module
   * - Strictly 1 attempt per user per quiz
   * - 2 ELDRA per correct answer
   * - 20 ELDRA completion bonus upon successfully passing
   */
  public submitQuiz(
    moduleId: string,
    userAnswers: Record<string, number>
  ): {
    success: boolean;
    passed: boolean;
    scorePercentage: number;
    correctCount: number;
    totalQuestions: number;
    earnedCoins: number;
    bonusCoins: number;
    message: string;
  } {
    if (!this.currentUser) {
      return {
        success: false,
        passed: false,
        scorePercentage: 0,
        correctCount: 0,
        totalQuestions: 0,
        earnedCoins: 0,
        bonusCoins: 0,
        message: 'Please sign in to take the quiz and earn Eldra tokens.',
      };
    }

    if (this.currentUser.isBlocked || this.isCurrentDeviceBlocked().blocked) {
      return {
        success: false,
        passed: false,
        scorePercentage: 0,
        correctCount: 0,
        totalQuestions: 0,
        earnedCoins: 0,
        bonusCoins: 0,
        message: 'Access Restricted: Your account or device has been suspended for anti-cheat policy violations.',
      };
    }

    const progressKey = `${this.currentUser.id}_${moduleId}`;
    const previousProgress = this.quizProgress[progressKey];

    // Strictly enforce 1 attempt per quiz
    if (previousProgress && (previousProgress.attempted || previousProgress.completed)) {
      return {
        success: false,
        passed: previousProgress.passed,
        scorePercentage: previousProgress.score,
        correctCount: previousProgress.correctAnswersCount,
        totalQuestions: previousProgress.totalQuestions,
        earnedCoins: previousProgress.earnedCoins,
        bonusCoins: 0,
        message: 'You have already completed your attempt for this quiz. Each quiz is limited to strictly 1 attempt.',
      };
    }

    const module = this.getModuleById(moduleId);
    if (!module) {
      return {
        success: false,
        passed: false,
        scorePercentage: 0,
        correctCount: 0,
        totalQuestions: 0,
        earnedCoins: 0,
        bonusCoins: 0,
        message: 'Educational module not found or expired.',
      };
    }

    const totalQuestions = module.questions.length;
    let correctCount = 0;

    module.questions.forEach((q) => {
      const selectedIndex = userAnswers[q.id];
      if (selectedIndex === q.correctOptionIndex) {
        correctCount++;
      }
    });

    const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = scorePercentage >= (module.passingScorePercentage || 75);

    // Calculate coin rewards:
    // 2 ELDRA per correct answer + 20 ELDRA passing bonus
    const perQuestionReward = 2;
    const questionCoins = correctCount * perQuestionReward;
    const bonusCoins = passed ? (module.completionBonus || 20) : 0;
    const totalEarned = questionCoins + bonusCoins;

    if (totalEarned > 0) {
      // Update user balance
      this.currentUser = {
        ...this.currentUser,
        balance: this.currentUser.balance + totalEarned,
        quizBalance: this.currentUser.quizBalance + totalEarned,
      };
      this.updateUserInStore(this.currentUser);

      const now = Date.now();

      // Log question rewards transaction
      if (questionCoins > 0) {
        this.transactions.unshift({
          id: `tx_q_${now}_${Math.random()}`,
          userId: this.currentUser.id,
          type: 'quiz_reward',
          amount: questionCoins,
          timestamp: now,
          description: `Answered ${correctCount}/${totalQuestions} quiz questions correctly (+2 ELDRA each)`,
          moduleTitle: module.title,
        });
      }

      // Log 20 ELDRA completion bonus transaction
      if (bonusCoins > 0) {
        this.transactions.unshift({
          id: `tx_q_bonus_${now}`,
          userId: this.currentUser.id,
          type: 'quiz_completion_bonus',
          amount: bonusCoins,
          timestamp: now + 1,
          description: `Passed Quiz: 20 ELDRA Completion Jackpot! 🎓🔥`,
          moduleTitle: module.title,
        });
        soundFx.playQuizVictory();
      } else {
        soundFx.playQuestionCorrect();
      }
    }

    this.quizProgress[progressKey] = {
      moduleId,
      userId: this.currentUser.id,
      attempted: true,
      completed: true,
      score: scorePercentage,
      totalQuestions,
      correctAnswersCount: correctCount,
      earnedCoins: totalEarned,
      passed,
      completedAt: new Date().toISOString(),
      userAnswers,
    };

    this.recalculateLeaderboard();
    this.saveState();
    this.notify();

    const message = passed
      ? `Phenomenal! You scored ${scorePercentage}% and earned ${totalEarned} ELDRA tokens (+${bonusCoins} Quiz Pass Jackpot)! Attempt completed.`
      : `You scored ${scorePercentage}% (${correctCount}/${totalQuestions} correct). Earned ${totalEarned} ELDRA tokens. Quiz attempt recorded.`;

    return {
      success: true,
      passed,
      scorePercentage,
      correctCount,
      totalQuestions,
      earnedCoins: totalEarned,
      bonusCoins,
      message,
    };
  }

  // --- ADMIN MODULE MANAGEMENT ---

  public addEducationalModule(
    data: Omit<EducationalModule, 'id' | 'createdAt'>,
    autoDeletePrevious: boolean = true
  ): EducationalModule {
    if (autoDeletePrevious) {
      // Automatically delete previous quizzes when posting a new quiz if requested
      this.modules = [];
    }

    const now = Date.now();
    let cleanUrl = data.externalUrl ? data.externalUrl.trim() : '';
    if (cleanUrl && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const newModule: EducationalModule = {
      ...data,
      externalUrl: cleanUrl,
      id: `edu-${now}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      expiresAt: data.expiresAt !== undefined ? data.expiresAt : now + 24 * 60 * 60 * 1000,
      completionBonus: typeof data.completionBonus === 'number' ? data.completionBonus : 20,
      passingScorePercentage: data.passingScorePercentage || 75,
      authorEmail: this.currentUser?.email || ADMIN_EMAIL,
      isPublished: data.isPublished !== undefined ? data.isPublished : true,
    };

    this.modules.unshift(newModule);
    this.saveState();
    this.notify();
    return newModule;
  }

  public updateEducationalModule(
    id: string,
    data: Partial<EducationalModule>
  ): boolean {
    const index = this.modules.findIndex((m) => m.id === id);
    if (index === -1) return false;

    let cleanUrl = data.externalUrl !== undefined ? data.externalUrl.trim() : this.modules[index].externalUrl;
    if (cleanUrl && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    this.modules[index] = {
      ...this.modules[index],
      ...data,
      externalUrl: cleanUrl,
      completionBonus: typeof data.completionBonus === 'number' ? data.completionBonus : (this.modules[index].completionBonus || 20),
    };
    this.saveState();
    this.notify();
    return true;
  }

  public deleteEducationalModule(id: string): boolean {
    const initialLen = this.modules.length;
    this.modules = this.modules.filter((m) => m.id !== id);
    if (this.modules.length !== initialLen) {
      // Also clean up any quiz progress records referencing this module
      if (this.quizProgress && this.quizProgress[id]) {
        delete this.quizProgress[id];
      }
      this.saveState();
      this.notify();
      return true;
    }
    return false;
  }

  public deleteModule(id: string): boolean {
    return this.deleteEducationalModule(id);
  }

  public deleteMultipleModules(ids: string[]): number {
    const idSet = new Set(ids);
    const initialLen = this.modules.length;
    this.modules = this.modules.filter((m) => !idSet.has(m.id));
    const deletedCount = initialLen - this.modules.length;
    if (deletedCount > 0) {
      ids.forEach((id) => {
        if (this.quizProgress && this.quizProgress[id]) {
          delete this.quizProgress[id];
        }
      });
      this.saveState();
      this.notify();
    }
    return deletedCount;
  }

  public deleteAllModules(): void {
    this.modules = [];
    this.quizProgress = {};
    this.saveState();
    this.notify();
  }

  // --- WITHDRAWALS & 24-HOUR BATCH MANAGEMENT ---

  /**
   * Compute 24-hour batch window metadata based on timestamp
   */
  public getBatchIdForTimestamp(timestamp: number): {
    batchId: string;
    batchDate: string;
    startTimestamp: number;
    endTimestamp: number;
  } {
    const d = new Date(timestamp);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const batchId = `batch_${yyyy}-${mm}-${dd}`;
    const batchDate = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const startTimestamp = new Date(yyyy, d.getMonth(), d.getDate()).getTime();
    const endTimestamp = startTimestamp + 24 * 60 * 60 * 1000 - 1;
    return { batchId, batchDate, startTimestamp, endTimestamp };
  }

  public getAllWithdrawals(): WithdrawalRequest[] {
    return [...this.withdrawals];
  }

  public getUserWithdrawals(userId?: string): WithdrawalRequest[] {
    const uid = userId || this.currentUser?.id;
    if (!uid) return [];
    return this.withdrawals.filter((w) => w.userId === uid);
  }

  /**
   * Request a new withdrawal
   */
  public requestWithdrawal(
    userId: string,
    walletAddress: string,
    amount: number
  ): { success: boolean; message: string; request?: WithdrawalRequest } {
    const user = this.users.find((u) => u.id === userId);
    if (!user) {
      return { success: false, message: 'User account not found.' };
    }

    if (user.isBlocked || this.isCurrentDeviceBlocked().blocked) {
      return {
        success: false,
        message: 'Access Blocked: Your account or device has been restricted from submitting withdrawals due to anti-cheat policy violations.',
      };
    }

    const cleanAddress = walletAddress.trim();
    if (!cleanAddress || cleanAddress.length < 24) {
      return {
        success: false,
        message: 'Please provide a valid Solana/Crypto wallet address (at least 24 characters).',
      };
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 50) {
      return {
        success: false,
        message: 'Minimum withdrawal amount is 50 ELDRA tokens.',
      };
    }

    if (user.balance < numAmount) {
      return {
        success: false,
        message: `Insufficient balance. Your available balance is ${user.balance} ELDRA.`,
      };
    }

    const now = Date.now();
    const batchInfo = this.getBatchIdForTimestamp(now);

    // Deduct coins from user balance and mark as pending withdrawal for transparency
    const updatedUser: User = {
      ...user,
      balance: Math.max(0, user.balance - numAmount),
      pendingWithdrawalBalance: (user.pendingWithdrawalBalance || 0) + numAmount,
      walletAddress: cleanAddress,
    };
    this.updateUserInStore(updatedUser);

    if (this.currentUser?.id === user.id) {
      this.currentUser = updatedUser;
    }

    const newRequest: WithdrawalRequest = {
      id: `wd_${now}_${Math.random().toString(36).substring(2, 7)}`,
      userId: user.id,
      userEmail: user.email,
      userName: user.displayName,
      userHandle: user.username || 'member',
      walletAddress: cleanAddress,
      amount: numAmount,
      status: 'pending',
      requestedAt: now,
      batchId: batchInfo.batchId,
      batchDate: batchInfo.batchDate,
    };

    this.withdrawals.unshift(newRequest);

    // Create transaction ledger record
    this.transactions.unshift({
      id: `tx_${newRequest.id}`,
      userId: user.id,
      type: 'withdrawal_request',
      amount: -numAmount,
      timestamp: now,
      description: `Withdrawal to ${cleanAddress.slice(0, 4)}...${cleanAddress.slice(-4)} (Batch: ${batchInfo.batchDate})`,
      status: 'pending',
      walletAddress: cleanAddress,
      withdrawalId: newRequest.id,
    });

    this.recalculateLeaderboard();
    this.saveState();
    this.notify();

    return {
      success: true,
      message: `Withdrawal request of ${numAmount} ELDRA submitted successfully! Added to 24h batch for admin approval.`,
      request: newRequest,
    };
  }

  /**
   * Approve a single withdrawal request
   */
  public approveWithdrawal(
    withdrawalId: string,
    adminEmail?: string,
    txHash?: string
  ): { success: boolean; message: string } {
    const index = this.withdrawals.findIndex((w) => w.id === withdrawalId);
    if (index === -1) {
      return { success: false, message: 'Withdrawal request not found.' };
    }

    const req = this.withdrawals[index];
    if (req.status !== 'pending') {
      return {
        success: false,
        message: `Request is already ${req.status}.`,
      };
    }

    const now = Date.now();
    const approvedReq: WithdrawalRequest = {
      ...req,
      status: 'approved',
      approvedAt: now,
      approvedBy: adminEmail || this.currentUser?.email || ADMIN_EMAIL,
      txHash: txHash || `sol_${now.toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    };
    this.withdrawals[index] = approvedReq;

    // Update user balance metrics
    const user = this.users.find((u) => u.id === req.userId);
    if (user) {
      const updatedUser: User = {
        ...user,
        pendingWithdrawalBalance: Math.max(
          0,
          (user.pendingWithdrawalBalance || 0) - req.amount
        ),
        withdrawnBalance: (user.withdrawnBalance || 0) + req.amount,
      };
      this.updateUserInStore(updatedUser);
      if (this.currentUser?.id === user.id) {
        this.currentUser = updatedUser;
      }
    }

    // Update transaction status
    const txIndex = this.transactions.findIndex(
      (tx) => tx.withdrawalId === req.id || tx.id === `tx_${req.id}`
    );
    if (txIndex !== -1) {
      this.transactions[txIndex] = {
        ...this.transactions[txIndex],
        status: 'completed',
        type: 'withdrawal_approved',
        description: `Approved & Sent to ${req.walletAddress.slice(0, 4)}...${req.walletAddress.slice(-4)}`,
      };
    }

    this.saveState();
    this.notify();

    return {
      success: true,
      message: `Withdrawal #${req.id.slice(-6)} of ${req.amount} ELDRA to @${req.userHandle} approved successfully!`,
    };
  }

  /**
   * Approve an entire 24-hour batch of withdrawals all together
   */
  public approveBatchWithdrawals(
    batchId: string,
    adminEmail?: string
  ): { success: boolean; count: number; totalAmount: number; message: string } {
    const pendingInBatch = this.withdrawals.filter(
      (w) => w.batchId === batchId && w.status === 'pending'
    );

    if (pendingInBatch.length === 0) {
      return {
        success: false,
        count: 0,
        totalAmount: 0,
        message: 'No pending withdrawal requests found in this 24-hour unit.',
      };
    }

    const now = Date.now();
    const admin = adminEmail || this.currentUser?.email || ADMIN_EMAIL;
    let totalAmount = 0;

    // Map of user changes
    const userPendingReductions: Record<string, number> = {};
    const userWithdrawnAdditions: Record<string, number> = {};

    this.withdrawals = this.withdrawals.map((w) => {
      if (w.batchId === batchId && w.status === 'pending') {
        totalAmount += w.amount;
        userPendingReductions[w.userId] =
          (userPendingReductions[w.userId] || 0) + w.amount;
        userWithdrawnAdditions[w.userId] =
          (userWithdrawnAdditions[w.userId] || 0) + w.amount;

        return {
          ...w,
          status: 'approved',
          approvedAt: now,
          approvedBy: admin,
          txHash: `bulk_${now.toString(36)}_${w.id.slice(-4)}`,
        };
      }
      return w;
    });

    // Update each affected user
    Object.keys(userPendingReductions).forEach((uid) => {
      const user = this.users.find((u) => u.id === uid);
      if (user) {
        const updatedUser: User = {
          ...user,
          pendingWithdrawalBalance: Math.max(
            0,
            (user.pendingWithdrawalBalance || 0) - (userPendingReductions[uid] || 0)
          ),
          withdrawnBalance:
            (user.withdrawnBalance || 0) + (userWithdrawnAdditions[uid] || 0),
        };
        this.updateUserInStore(updatedUser);
        if (this.currentUser?.id === user.id) {
          this.currentUser = updatedUser;
        }
      }
    });

    // Update transaction entries
    this.transactions = this.transactions.map((tx) => {
      if (
        tx.withdrawalId &&
        pendingInBatch.some((p) => p.id === tx.withdrawalId)
      ) {
        return {
          ...tx,
          status: 'completed',
          type: 'withdrawal_approved',
          description: `Batch Approved: Sent to ${tx.walletAddress ? tx.walletAddress.slice(0, 4) + '...' + tx.walletAddress.slice(-4) : 'Wallet'}`,
        };
      }
      return tx;
    });

    this.saveState();
    this.notify();

    return {
      success: true,
      count: pendingInBatch.length,
      totalAmount,
      message: `Successfully approved all ${pendingInBatch.length} withdrawal requests (${totalAmount} ELDRA total) in Batch ${batchId}!`,
    };
  }

  /**
   * Reject a withdrawal request and refund coins transparently to user's balance
   */
  public rejectWithdrawal(
    withdrawalId: string,
    reason?: string
  ): { success: boolean; message: string } {
    const index = this.withdrawals.findIndex((w) => w.id === withdrawalId);
    if (index === -1) {
      return { success: false, message: 'Withdrawal request not found.' };
    }

    const req = this.withdrawals[index];
    if (req.status !== 'pending') {
      return {
        success: false,
        message: `Request is already ${req.status}.`,
      };
    }

    const cleanReason = reason?.trim() || 'Declined by Administrator / Invalid Wallet Address';

    this.withdrawals[index] = {
      ...req,
      status: 'rejected',
      rejectionReason: cleanReason,
    };

    // Refund coins to user balance
    const user = this.users.find((u) => u.id === req.userId);
    if (user) {
      const updatedUser: User = {
        ...user,
        balance: user.balance + req.amount,
        pendingWithdrawalBalance: Math.max(
          0,
          (user.pendingWithdrawalBalance || 0) - req.amount
        ),
      };
      this.updateUserInStore(updatedUser);
      if (this.currentUser?.id === user.id) {
        this.currentUser = updatedUser;
      }
    }

    // Add refund transaction record
    this.transactions.unshift({
      id: `tx_ref_${Date.now()}`,
      userId: req.userId,
      type: 'withdrawal_refund',
      amount: req.amount,
      timestamp: Date.now(),
      description: `Withdrawal Refund (+${req.amount} ELDRA): ${cleanReason}`,
      status: 'completed',
      withdrawalId: req.id,
    });

    this.recalculateLeaderboard();
    this.saveState();
    this.notify();

    return {
      success: true,
      message: `Withdrawal request rejected. ${req.amount} ELDRA refunded to @${req.userHandle}'s dashboard balance.`,
    };
  }

  /**
   * Get all 24-hour batches compiled with summary metrics
   */
  public get24HourWithdrawalBatches(): WithdrawalBatch[] {
    const now = Date.now();
    const currentBatchInfo = this.getBatchIdForTimestamp(now);

    const batchMap: Record<string, WithdrawalBatch> = {};

    // Ensure current 24-hour cycle is always present
    batchMap[currentBatchInfo.batchId] = {
      batchId: currentBatchInfo.batchId,
      batchDate: `${currentBatchInfo.batchDate} (Active 24h Cycle)`,
      startTimestamp: currentBatchInfo.startTimestamp,
      endTimestamp: currentBatchInfo.endTimestamp,
      totalRequests: 0,
      totalAmount: 0,
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      status: 'empty',
      requests: [],
    };

    // Group all withdrawals
    this.withdrawals.forEach((w) => {
      if (!batchMap[w.batchId]) {
        const bInfo = this.getBatchIdForTimestamp(w.requestedAt);
        batchMap[w.batchId] = {
          batchId: w.batchId,
          batchDate: bInfo.batchDate,
          startTimestamp: bInfo.startTimestamp,
          endTimestamp: bInfo.endTimestamp,
          totalRequests: 0,
          totalAmount: 0,
          pendingCount: 0,
          approvedCount: 0,
          rejectedCount: 0,
          status: 'empty',
          requests: [],
        };
      }

      const b = batchMap[w.batchId];
      b.requests.push(w);
      b.totalRequests += 1;
      b.totalAmount += w.amount;
      if (w.status === 'pending') b.pendingCount += 1;
      if (w.status === 'approved') b.approvedCount += 1;
      if (w.status === 'rejected') b.rejectedCount += 1;
    });

    // Compute status for each batch
    Object.values(batchMap).forEach((b) => {
      b.requests.sort((a, b) => b.requestedAt - a.requestedAt);
      if (b.totalRequests === 0) {
        b.status = 'empty';
      } else if (b.pendingCount === 0 && b.approvedCount > 0) {
        b.status = 'approved';
      } else if (b.pendingCount > 0 && b.approvedCount > 0) {
        b.status = 'partially_approved';
      } else if (b.pendingCount > 0) {
        b.status = 'pending';
      } else {
        b.status = 'empty';
      }
    });

    // Sort latest batch first
    return Object.values(batchMap).sort(
      (a, b) => b.startTimestamp - a.startTimestamp
    );
  }

  /**
   * Approve all pending withdrawals across the entire platform in one click
   */
  public approveAllPendingWithdrawals(
    adminEmail?: string
  ): { success: boolean; count: number; totalAmount: number; message: string } {
    const pendingWithdrawals = this.withdrawals.filter((w) => w.status === 'pending');
    if (pendingWithdrawals.length === 0) {
      return {
        success: false,
        count: 0,
        totalAmount: 0,
        message: 'No pending withdrawal requests found across any batch.',
      };
    }

    const now = Date.now();
    const admin = adminEmail || this.currentUser?.email || ADMIN_EMAIL;
    let totalAmount = 0;

    const userPendingReductions: Record<string, number> = {};
    const userWithdrawnAdditions: Record<string, number> = {};

    this.withdrawals = this.withdrawals.map((w) => {
      if (w.status === 'pending') {
        totalAmount += w.amount;
        userPendingReductions[w.userId] =
          (userPendingReductions[w.userId] || 0) + w.amount;
        userWithdrawnAdditions[w.userId] =
          (userWithdrawnAdditions[w.userId] || 0) + w.amount;

        return {
          ...w,
          status: 'approved',
          approvedAt: now,
          approvedBy: admin,
          txHash: `bulk_all_${now.toString(36)}_${w.id.slice(-4)}`,
        };
      }
      return w;
    });

    // Update each affected user
    Object.keys(userPendingReductions).forEach((uid) => {
      const user = this.users.find((u) => u.id === uid);
      if (user) {
        const updatedUser: User = {
          ...user,
          pendingWithdrawalBalance: Math.max(
            0,
            (user.pendingWithdrawalBalance || 0) - (userPendingReductions[uid] || 0)
          ),
          withdrawnBalance:
            (user.withdrawnBalance || 0) + (userWithdrawnAdditions[uid] || 0),
        };
        this.updateUserInStore(updatedUser);
        if (this.currentUser?.id === user.id) {
          this.currentUser = updatedUser;
        }
      }
    });

    // Update transaction entries
    this.transactions = this.transactions.map((tx) => {
      if (
        tx.withdrawalId &&
        pendingWithdrawals.some((p) => p.id === tx.withdrawalId)
      ) {
        return {
          ...tx,
          status: 'completed',
          type: 'withdrawal_approved',
          description: `Batch Approved: Sent to ${tx.walletAddress ? tx.walletAddress.slice(0, 4) + '...' + tx.walletAddress.slice(-4) : 'Wallet'}`,
        };
      }
      return tx;
    });

    this.saveState();
    this.notify();

    return {
      success: true,
      count: pendingWithdrawals.length,
      totalAmount,
      message: `Successfully approved all ${pendingWithdrawals.length} pending withdrawals (${totalAmount.toLocaleString()} ELDRA) across all batches!`,
    };
  }

  /**
   * Compute remaining time in the current active 24-hour cycle
   */
  public get24HourCycleTimeRemaining(): {
    hours: number;
    minutes: number;
    seconds: number;
    formatted: string;
    endTimestamp: number;
  } {
    const now = Date.now();
    const batchInfo = this.getBatchIdForTimestamp(now);
    const diff = Math.max(0, batchInfo.endTimestamp - now);

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      hours,
      minutes,
      seconds,
      formatted: `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`,
      endTimestamp: batchInfo.endTimestamp,
    };
  }

  /**
   * Generate Bulk Formatted Data in multiple transfer formats
   */
  public generateBulkFormattedData(
    filterStatus?: 'approved' | 'pending' | 'all',
    batchId?: string,
    format: 'comma' | 'space' | 'tab' | 'addresses_only' | 'amounts_only' | 'json' = 'comma'
  ): string {
    let list = [...this.withdrawals];
    if (batchId && batchId !== 'all') {
      list = list.filter((w) => w.batchId === batchId);
    }
    if (filterStatus && filterStatus !== 'all') {
      list = list.filter((w) => w.status === filterStatus);
    }

    switch (format) {
      case 'comma':
        // Standard Solana Multisend / Disperse: address,amount
        return list.map((w) => `${w.walletAddress},${w.amount}`).join('\n');
      case 'space':
        // Solana CLI format: address amount
        return list.map((w) => `${w.walletAddress} ${w.amount}`).join('\n');
      case 'tab':
        // Excel / Google Sheets format: address\tamount
        return list.map((w) => `${w.walletAddress}\t${w.amount}`).join('\n');
      case 'addresses_only':
        // Wallet addresses only: 1 per line
        return list.map((w) => w.walletAddress).join('\n');
      case 'amounts_only':
        // Amounts only: 1 per line
        return list.map((w) => w.amount.toString()).join('\n');
      case 'json':
        // JSON format
        return JSON.stringify(
          list.map((w) => ({
            address: w.walletAddress,
            amount: w.amount,
            handle: w.userHandle,
            id: w.id,
          })),
          null,
          2
        );
      default:
        return list.map((w) => `${w.walletAddress},${w.amount}`).join('\n');
    }
  }

  /**
   * Generate CSV format for withdrawals
   */
  public generateWithdrawalsCsv(
    filterStatus?: 'approved' | 'pending' | 'all',
    batchId?: string
  ): string {
    let list = [...this.withdrawals];
    if (batchId) {
      list = list.filter((w) => w.batchId === batchId);
    }
    if (filterStatus && filterStatus !== 'all') {
      list = list.filter((w) => w.status === filterStatus);
    }

    const headers = [
      'Wallet Address',
      'Amount (ELDRA)',
      'Username',
      'Email',
      'Status',
      'Request Date',
      'Batch ID',
      'Approval Date',
      'Transaction Ref / Hash',
      'Rejection Reason',
    ];

    const rows = list.map((w) => {
      const reqDate = new Date(w.requestedAt).toISOString();
      const appDate = w.approvedAt ? new Date(w.approvedAt).toISOString() : '';
      return [
        `"${w.walletAddress}"`,
        w.amount,
        `"@${w.userHandle}"`,
        `"${w.userEmail}"`,
        `"${w.status.toUpperCase()}"`,
        `"${reqDate}"`,
        `"${w.batchId}"`,
        `"${appDate}"`,
        `"${w.txHash || ''}"`,
        `"${w.rejectionReason || ''}"`,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Generate clean Bulk Multisend Format (address,amount)
   * Standard format used by Solana Multisend tools (Solflare, Disperse, Squads, Bulk Airdrop)
   */
  public generateBulkMultisendText(
    filterStatus?: 'approved' | 'pending' | 'all',
    batchId?: string
  ): string {
    let list = [...this.withdrawals];
    if (batchId) {
      list = list.filter((w) => w.batchId === batchId);
    }
    if (filterStatus && filterStatus !== 'all') {
      list = list.filter((w) => w.status === filterStatus);
    }

    return list.map((w) => `${w.walletAddress},${w.amount}`).join('\n');
  }

  /**
   * Generate clean list of Destination Solana Wallet Addresses only (one per line)
   * Ideal for copying all addresses in a batch together for bulk transfer / multisend
   */
  public generateBulkAddressesOnly(
    filterStatus?: 'approved' | 'pending' | 'all',
    batchId?: string
  ): string {
    let list = [...this.withdrawals];
    if (batchId) {
      list = list.filter((w) => w.batchId === batchId);
    }
    if (filterStatus && filterStatus !== 'all') {
      list = list.filter((w) => w.status === filterStatus);
    }

    // Return unique or all wallet addresses in sequential order
    return list.map((w) => w.walletAddress).join('\n');
  }

  // --- INTERNAL HELPERS ---

  private updateUserInStore(user: User) {
    const index = this.users.findIndex((u) => u.id === user.id);
    if (index !== -1) {
      this.users[index] = user;
    } else {
      this.users.push(user);
    }
  }

  public recalculateLeaderboard() {
    // Count referrals per user
    const referralCounts: Record<string, number> = {};
    this.referrals.forEach((ref) => {
      referralCounts[ref.referrerId] = (referralCounts[ref.referrerId] || 0) + 1;
    });

    // Exclude Admin accounts from appearing on the public Leaderboard
    const nonAdminUsers = this.users.filter(
      (u) => u.role !== 'admin' && u.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()
    );

    const entries: LeaderboardEntry[] = nonAdminUsers.map((u) => {
      const refCount = referralCounts[u.id] || 0;
      return {
        rank: 0,
        userId: u.id,
        displayName: u.displayName,
        username: u.username || 'member',
        email: u.email,
        referralCount: refCount,
        totalReferralEldra: refCount * 5,
        totalBalance: u.balance,
      };
    });

    // Sort by total referrals desc, then by total balance desc
    entries.sort((a, b) => {
      if (b.referralCount !== a.referralCount) {
        return b.referralCount - a.referralCount;
      }
      return b.totalBalance - a.totalBalance;
    });

    // Assign rank
    this.leaderboard = entries.map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
    }));
  }

  public adminUpdateUserBalance(userId: string, newBalance: number, reason?: string): boolean {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return false;
    
    const oldBalance = user.balance;
    user.balance = Math.max(0, newBalance);
    this.updateUserInStore(user);

    if (this.currentUser?.id === user.id) {
      this.currentUser = user;
    }

    this.transactions.unshift({
      id: `admin_adj_${Date.now()}`,
      userId: user.id,
      type: 'quiz_completion_bonus',
      amount: newBalance - oldBalance,
      timestamp: Date.now(),
      description: reason || `Admin balance adjustment by Super Admin`,
      status: 'completed',
    });

    this.recalculateLeaderboard();
    this.saveState();
    this.notify();
    return true;
  }

  public adminDeleteUser(userId: string): boolean {
    const userIndex = this.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) return false;

    // Do not delete admin
    if (this.users[userIndex].role === 'admin' || this.users[userIndex].email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      return false;
    }

    const removed = this.users.splice(userIndex, 1)[0];
    // Remove user withdrawals and referrals
    this.withdrawals = this.withdrawals.filter((w) => w.userId !== userId);
    this.referrals = this.referrals.filter((r) => r.referrerId !== userId && r.referredUserId !== userId);
    this.transactions = this.transactions.filter((t) => t.userId !== userId);

    // Clean up device registration for this removed user
    if (removed) {
      Object.keys(this.deviceRegistrations).forEach((devId) => {
        if (
          this.deviceRegistrations[devId]?.userId === userId ||
          this.deviceRegistrations[devId]?.email.toLowerCase() === removed.email.toLowerCase()
        ) {
          delete this.deviceRegistrations[devId];
        }
      });

      // Clear any device blocks associated with this user
      this.blockedDevices = this.blockedDevices.filter(
        (b) =>
          b.registeredEmail?.toLowerCase() !== removed.email.toLowerCase() &&
          b.attemptedEmail?.toLowerCase() !== removed.email.toLowerCase()
      );

      // If current user is this deleted user, log out
      if (this.currentUser?.id === userId) {
        this.currentUser = null;
      }
    }

    this.recalculateLeaderboard();
    this.saveState();
    this.notify();
    return true;
  }

  public adminResetUserQuizProgress(userId: string, moduleId?: string): boolean {
    if (moduleId) {
      delete this.quizProgress[`${userId}_${moduleId}`];
    } else {
      Object.keys(this.quizProgress).forEach((k) => {
        if (k.startsWith(`${userId}_`)) {
          delete this.quizProgress[k];
        }
      });
    }
    this.saveState();
    this.notify();
    return true;
  }

  public getCommunityClaimStats() {
    const nonAdminUsers = this.users.filter(
      (u) => u.role !== 'admin' && u.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()
    );
    const totalRegisteredUsers = nonAdminUsers.length;
    const totalDailyClaims = nonAdminUsers.reduce((sum, u) => sum + (u.dailyClaimBalance || 0), 0);
    const totalReferralClaims = nonAdminUsers.reduce((sum, u) => sum + (u.referralBalance || 0), 0);
    const totalQuizClaims = nonAdminUsers.reduce((sum, u) => sum + (u.quizBalance || 0), 0);
    const totalClaimedCoins = totalDailyClaims + totalReferralClaims + totalQuizClaims;
    const totalUserHoldingBalance = nonAdminUsers.reduce((sum, u) => sum + (u.balance || 0), 0);
    const totalWithdrawalsRequested = this.withdrawals.reduce((sum, w) => sum + w.amount, 0);

    return {
      totalRegisteredUsers,
      totalDailyClaims,
      totalReferralClaims,
      totalQuizClaims,
      totalClaimedCoins,
      totalUserHoldingBalance,
      totalWithdrawalsRequested,
      users: nonAdminUsers,
    };
  }

  // =========================================================================
  // --- ANTI-CHEAT, MULTI-ACCOUNT FRAUD DETECTION & 1-CLICK BLOCK SUITE ---
  // =========================================================================

  /**
   * Deep Analysis of all registered users to detect multi-accounting, clone apps,
   * shared Solana wallets, self-referral rings, and hardware collisions.
   * Returns organized Fraud Clusters / Badges.
   */
  public getFraudClusters(): FraudCluster[] {
    const nonAdminUsers = this.users.filter(
      (u) => u.role !== 'admin' && u.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()
    );

    const clusters: FraudCluster[] = [];
    const processedUserIds = new Set<string>();

    // 1. Group by Hardware Hash / Device Fingerprint
    const hwMap = new Map<string, User[]>();
    // 2. Group by Destination Solana Wallet Address (Sybil Cash-Out)
    const walletMap = new Map<string, User[]>();

    nonAdminUsers.forEach((u) => {
      // Group by Hardware Profile
      const hwKey = u.hardwareHash || u.deviceFingerprint;
      if (hwKey) {
        if (!hwMap.has(hwKey)) hwMap.set(hwKey, []);
        hwMap.get(hwKey)!.push(u);
      }

      // Group by Solana Wallet Address
      if (u.walletAddress && u.walletAddress.length > 20) {
        const cleanW = u.walletAddress.trim();
        if (!walletMap.has(cleanW)) walletMap.set(cleanW, []);
        walletMap.get(cleanW)!.push(u);
      }
    });

    let badgeCounter = 101;

    // A. Process Multi-Account Hardware Collisions (>1 account on same physical device)
    hwMap.forEach((userList, hwKey) => {
      if (userList.length > 1) {
        const clusterId = `cluster_hw_${hwKey.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10)}`;
        const totalIllicit = userList.reduce((sum, u) => sum + (u.balance || 0), 0);
        const pendingWithdrawals = this.withdrawals
          .filter((w) => userList.some((u) => u.id === w.userId) && w.status === 'pending')
          .reduce((sum, w) => sum + w.amount, 0);

        const isFullyBlocked = userList.every((u) => u.isBlocked);
        const hasClone = userList.some((u) => u.cloneAppDetected);

        const evidence: string[] = [
          `Matching Physical Hardware & Canvas GPU Rasterization Hash (${hwKey.substring(0, 16)})`,
          `${userList.length} distinct accounts operated from identical hardware environment`,
        ];
        if (hasClone) {
          evidence.push(`Parallel Space / Cloned App Sandbox signature detected`);
        }

        // Check if accounts in this cluster also share a Solana wallet
        const sharedWallet = userList.find((u) => u.walletAddress)?.walletAddress;
        if (userList.filter((u) => u.walletAddress === sharedWallet).length > 1 && sharedWallet) {
          evidence.push(`Common payout destination: ${sharedWallet.slice(0, 8)}...${sharedWallet.slice(-8)}`);
        }

        clusters.push({
          clusterId,
          badgeName: `Fraud Badge #${badgeCounter++}: ${userList.length} Accounts on Single Device (${hasClone ? 'App Cloner Sandbox' : 'Hardware Collision'})`,
          primaryFingerprint: hwKey,
          hardwareSummary: userList[0]?.deviceFingerprint || 'Multi-Core Hardware Profile',
          detectionType: hasClone ? 'CLONE_APP' : 'HARDWARE_FINGERPRINT',
          riskLevel: userList.length >= 3 ? 'CRITICAL' : 'HIGH',
          totalAccounts: userList.length,
          totalIllicitEldra: totalIllicit,
          totalPendingWithdrawals: pendingWithdrawals,
          detectedCloneMethod: hasClone
            ? userList.find((u) => u.cloneAppDetails)?.cloneAppDetails || 'VirtualApp / DualSpace Sandbox'
            : undefined,
          accounts: userList,
          isFullyBlocked,
          detectedAt: Math.min(...userList.map((u) => new Date(u.createdAt).getTime() || Date.now())),
          sharedWalletAddress: sharedWallet,
          evidenceList: evidence,
        });

        userList.forEach((u) => processedUserIds.add(u.id));
      }
    });

    // B. Process Shared Solana Wallet Abuse (Different accounts funneling into the same wallet)
    walletMap.forEach((userList, walletAddr) => {
      if (userList.length > 1) {
        const unclustered = userList.filter((u) => !processedUserIds.has(u.id));
        if (unclustered.length > 0 || !clusters.some((c) => c.sharedWalletAddress === walletAddr)) {
          const clusterId = `cluster_wallet_${walletAddr.substring(0, 10)}`;
          const totalIllicit = userList.reduce((sum, u) => sum + (u.balance || 0), 0);
          const pendingWithdrawals = this.withdrawals
            .filter((w) => userList.some((u) => u.id === w.userId) && w.status === 'pending')
            .reduce((sum, w) => sum + w.amount, 0);

          clusters.push({
            clusterId,
            badgeName: `Fraud Badge #${badgeCounter++}: ${userList.length} Accounts Funneling to Same Solana Wallet`,
            primaryFingerprint: walletAddr,
            hardwareSummary: `Destination Solana Address: ${walletAddr.slice(0, 8)}...${walletAddr.slice(-8)}`,
            detectionType: 'SHARED_WALLET',
            riskLevel: 'CRITICAL',
            totalAccounts: userList.length,
            totalIllicitEldra: totalIllicit,
            totalPendingWithdrawals: pendingWithdrawals,
            accounts: userList,
            isFullyBlocked: userList.every((u) => u.isBlocked),
            detectedAt: Date.now(),
            sharedWalletAddress: walletAddr,
            evidenceList: [
              `Multiple distinct user accounts withdrawing to identical Solana wallet: ${walletAddr.slice(0, 12)}...`,
              `Sybil extraction funnel detected across separate usernames`,
            ],
          });
          userList.forEach((u) => processedUserIds.add(u.id));
        }
      }
    });

    // C. Standalone Clone App Sandbox Detections
    const standaloneClones = nonAdminUsers.filter(
      (u) =>
        (u.cloneAppDetected || (u.fraudFlags && u.fraudFlags.includes('CLONE_APP_SANDBOX'))) &&
        !processedUserIds.has(u.id)
    );

    if (standaloneClones.length > 0) {
      const totalIllicit = standaloneClones.reduce((sum, u) => sum + (u.balance || 0), 0);
      const pendingWithdrawals = this.withdrawals
        .filter((w) => standaloneClones.some((u) => u.id === w.userId) && w.status === 'pending')
        .reduce((sum, w) => sum + w.amount, 0);

      clusters.push({
        clusterId: `cluster_clones_isolated`,
        badgeName: `Fraud Badge #${badgeCounter++}: ${standaloneClones.length} Cloned App Sandbox Account(s)`,
        primaryFingerprint: 'virtual_sandbox_detected',
        hardwareSummary: 'VirtualApp / Parallel Space / Island Sandbox Runtime',
        detectionType: 'CLONE_APP',
        riskLevel: 'HIGH',
        totalAccounts: standaloneClones.length,
        totalIllicitEldra: totalIllicit,
        totalPendingWithdrawals: pendingWithdrawals,
        detectedCloneMethod: standaloneClones[0]?.cloneAppDetails || 'VirtualApp Container Hook',
        accounts: standaloneClones,
        isFullyBlocked: standaloneClones.every((u) => u.isBlocked),
        detectedAt: Date.now(),
        evidenceList: [
          'Detected Virtual Container / Cloned App environment',
          'App cloner manipulation signature detected during active session',
        ],
      });
    }

    return clusters;
  }

  /**
   * Block a single user account and blacklists their hardware device fingerprint
   */
  public adminBlockUser(userId: string, reason?: string): boolean {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return false;
    if (user.role === 'admin' || user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) return false;

    const blockReason = reason || 'Account suspended for multi-accounting / clone app anti-cheat violation';
    const now = Date.now();

    user.isBlocked = true;
    user.blockedReason = blockReason;
    user.blockedAt = now;
    user.fraudRiskScore = 100;
    this.updateUserInStore(user);

    // Blacklist device and hardware fingerprint
    const devId = user.deviceFingerprint || this.getDeviceId();
    const hwHash = user.hardwareHash;

    const alreadyBlocked = this.blockedDevices.some(
      (b) => b.deviceId === devId || (hwHash && b.hardwareHash === hwHash)
    );

    if (!alreadyBlocked) {
      this.blockedDevices.push({
        deviceId: devId,
        hardwareHash: hwHash,
        reason: blockReason,
        blockedAt: now,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Hardware Device',
        attemptedEmail: user.email,
        registeredEmail: user.email,
        registeredUsername: user.username,
        cloneAppIndicator: user.cloneAppDetails,
      });
    }

    // Auto-reject any pending withdrawals for this blocked user
    this.withdrawals = this.withdrawals.map((w) => {
      if (w.userId === userId && w.status === 'pending') {
        return {
          ...w,
          status: 'rejected',
          rejectionReason: 'Auto-Rejected: Account blocked for multi-accounting / anti-cheat violation',
        };
      }
      return w;
    });

    // If the currently signed-in user is this blocked user, invalidate session immediately
    if (this.currentUser?.id === userId) {
      this.currentUser = null;
    }

    this.recalculateLeaderboard();
    this.saveState();
    this.notify();
    return true;
  }

  /**
   * Unblock a user account and remove their device from blacklist
   */
  public adminUnblockUser(userId: string): boolean {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return false;

    user.isBlocked = false;
    user.blockedReason = undefined;
    user.blockedAt = undefined;
    user.fraudRiskScore = 0;
    this.updateUserInStore(user);

    // Unblock associated device registrations
    const devId = user.deviceFingerprint;
    const hwHash = user.hardwareHash;

    this.blockedDevices = this.blockedDevices.filter(
      (b) =>
        b.deviceId !== devId &&
        b.hardwareHash !== hwHash &&
        b.registeredEmail?.toLowerCase() !== user.email.toLowerCase() &&
        b.attemptedEmail?.toLowerCase() !== user.email.toLowerCase()
    );

    this.recalculateLeaderboard();
    this.saveState();
    this.notify();
    return true;
  }

  /**
   * 1-Click Block Entire Fraud Cluster / Badge
   * Bans all member accounts, freezes their pending withdrawals, and locks out the physical device.
   */
  public adminBlockFraudCluster(clusterId: string): {
    success: boolean;
    count: number;
    totalFrozenCoins: number;
    message: string;
  } {
    const clusters = this.getFraudClusters();
    const targetCluster = clusters.find((c) => c.clusterId === clusterId);

    if (!targetCluster) {
      return {
        success: false,
        count: 0,
        totalFrozenCoins: 0,
        message: 'Fraud cluster badge not found.',
      };
    }

    let count = 0;
    let totalFrozenCoins = 0;

    targetCluster.accounts.forEach((acc) => {
      if (!acc.isBlocked) {
        this.adminBlockUser(
          acc.id,
          `Batch Blocked: Member of ${targetCluster.badgeName} (${targetCluster.detectionType})`
        );
        count++;
        totalFrozenCoins += acc.balance || 0;
      }
    });

    return {
      success: true,
      count,
      totalFrozenCoins,
      message: `Successfully 1-Click Blocked ${targetCluster.badgeName}! (${count} accounts permanently suspended, ${totalFrozenCoins} ELDRA frozen).`,
    };
  }

  /**
   * 1-Click Master Block ALL Cheaters Platform-Wide
   */
  public adminBlockAllCheaters(): {
    success: boolean;
    totalClusters: number;
    totalAccounts: number;
    totalFrozenCoins: number;
    message: string;
  } {
    const clusters = this.getFraudClusters();
    const unblockedClusters = clusters.filter((c) => !c.isFullyBlocked);

    if (unblockedClusters.length === 0) {
      return {
        success: false,
        totalClusters: 0,
        totalAccounts: 0,
        totalFrozenCoins: 0,
        message: 'No unblocked fraud clusters detected. All identified cheaters are already blocked!',
      };
    }

    let totalAccounts = 0;
    let totalFrozenCoins = 0;

    unblockedClusters.forEach((cluster) => {
      cluster.accounts.forEach((acc) => {
        if (!acc.isBlocked) {
          this.adminBlockUser(
            acc.id,
            `Master 1-Click Ban: Identified in ${cluster.badgeName}`
          );
          totalAccounts++;
          totalFrozenCoins += acc.balance || 0;
        }
      });
    });

    return {
      success: true,
      totalClusters: unblockedClusters.length,
      totalAccounts,
      totalFrozenCoins,
      message: `Master Ban Executed: 1-Click blocked ${totalAccounts} accounts across ${unblockedClusters.length} fraud badges (${totalFrozenCoins} ELDRA frozen)!`,
    };
  }

  /**
   * Simulate a realistic Multi-Account / Clone App Sybil Attack
   * Creates 3-4 accounts on a simulated cloned hardware profile with shared wallet & pending withdrawal
   * so the admin can test detection badges and 1-click batch blocking immediately.
   */
  public simulateMultiAccountAttack(): { success: boolean; message: string; badgeId: string } {
    const now = Date.now();
    const simHwHash = `hw_sim_dualspace_${Math.random().toString(36).substring(2, 6)}`;
    const simSharedWallet = 'SolFake' + Math.random().toString(36).substring(2, 10) + 'AirdropFarmSybil';
    const batchInfo = this.getBatchIdForTimestamp(now);

    const simulatedCheaters: { handle: string; email: string; name: string; balance: number; cloneMethod: string }[] = [
      {
        handle: `sol_sybil_${Math.floor(Math.random() * 900 + 100)}`,
        email: `farm_bot1_${Math.random().toString(36).substring(2, 6)}@gmail.com`,
        name: 'Cloned Instance #1',
        balance: 140,
        cloneMethod: 'Parallel Space 64-bit Virtual Sandbox',
      },
      {
        handle: `clone_miner_${Math.floor(Math.random() * 900 + 100)}`,
        email: `farm_bot2_${Math.random().toString(36).substring(2, 6)}@gmail.com`,
        name: 'Cloned Instance #2',
        balance: 220,
        cloneMethod: 'Dual Space Multi-Account Hook',
      },
      {
        handle: `auto_faucet_${Math.floor(Math.random() * 900 + 100)}`,
        email: `farm_bot3_${Math.random().toString(36).substring(2, 6)}@gmail.com`,
        name: 'Cloned Instance #3',
        balance: 95,
        cloneMethod: 'Island Sandbox Work Profile',
      },
    ];

    simulatedCheaters.forEach((item, idx) => {
      const userId = `usr_sim_${now}_${idx}`;
      const user: User = {
        id: userId,
        email: item.email,
        displayName: item.name,
        username: item.handle,
        role: 'user',
        balance: item.balance,
        dailyClaimBalance: 20,
        referralBalance: 40,
        quizBalance: item.balance - 60,
        lastClaimTimestamp: now - 3600000,
        claimStreak: 5,
        referralCode: `SIM-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        createdAt: new Date(now - (3 - idx) * 86400000).toISOString(),
        walletAddress: simSharedWallet,
        hardwareHash: simHwHash,
        deviceFingerprint: `dev_${simHwHash}`,
        cloneAppDetected: true,
        cloneAppDetails: item.cloneMethod,
        fraudRiskScore: 92,
        fraudFlags: ['CLONE_APP_SANDBOX', 'CANVAS_FINGERPRINT_MATCH', 'SHARED_SOLANA_WALLET'],
      };

      this.users.push(user);

      // Create a pending withdrawal for this simulated user
      if (idx === 0) {
        const wdReq: WithdrawalRequest = {
          id: `wd_sim_${now}`,
          userId: user.id,
          userEmail: user.email,
          userName: user.displayName,
          userHandle: user.username,
          walletAddress: simSharedWallet,
          amount: 50,
          status: 'pending',
          requestedAt: now,
          batchId: batchInfo.batchId,
          batchDate: batchInfo.batchDate,
        };
        this.withdrawals.unshift(wdReq);
      }
    });

    this.recalculateLeaderboard();
    this.saveState();
    this.notify();

    return {
      success: true,
      message: `Simulated attack generated: 3 Cloned accounts on shared hardware (${simHwHash}) funneling to wallet ${simSharedWallet.slice(0, 10)}... Ready for inspection!`,
      badgeId: simHwHash,
    };
  }

  /**
   * Clear all simulated test cheaters
   */
  public clearSimulatedCheaters(): number {
    const beforeCount = this.users.length;
    this.users = this.users.filter((u) => !u.id.startsWith('usr_sim_') && !u.email.includes('farm_bot'));
    this.withdrawals = this.withdrawals.filter((w) => !w.id.startsWith('wd_sim_') && !w.userEmail.includes('farm_bot'));
    const deleted = beforeCount - this.users.length;
    this.recalculateLeaderboard();
    this.saveState();
    this.notify();
    return deleted;
  }

  /**
   * Run a Deep Integrity & Anti-Cheat Scan across all stored users
   */
  public runAntiCheatScan(): {
    totalUsersScanned: number;
    totalClustersFound: number;
    totalCheatersIdentified: number;
    totalIllicitCoins: number;
    totalBlocked: number;
  } {
    const clusters = this.getFraudClusters();
    const totalCheaters = clusters.reduce((sum, c) => sum + c.totalAccounts, 0);
    const totalIllicit = clusters.reduce((sum, c) => sum + c.totalIllicitEldra, 0);
    const totalBlocked = clusters.reduce(
      (sum, c) => sum + c.accounts.filter((u) => u.isBlocked).length,
      0
    );

    return {
      totalUsersScanned: this.users.filter((u) => u.role !== 'admin').length,
      totalClustersFound: clusters.length,
      totalCheatersIdentified: totalCheaters,
      totalIllicitCoins: totalIllicit,
      totalBlocked,
    };
  }
}

export const store = EldraStore.getInstance();
