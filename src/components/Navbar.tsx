import React, { useState } from 'react';
import { User } from '../types';
import { store } from '../services/store';
import { ELDRA_COIN_IMAGE } from '../assets/eldra_coin';
import {
  Flame,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  Sparkles,
  Award,
  BookOpen,
  Users,
  LayoutDashboard,
  Coins,
  ChevronDown,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowUpRight,
  Wallet,
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuth: () => void;
  onNavigateAdmin?: (section?: 'withdrawals' | 'security' | 'claims' | 'quizzes') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenAuth,
  onNavigateAdmin,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!newPassword || newPassword.length < 4) {
      setPasswordError('New password must be at least 4 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match. Please verify.');
      return;
    }

    if (!currentUser) return;

    // Use resetPassword directly by email or changePassword
    const res = store.resetPassword(currentUser.email, newPassword);
    if (res.success) {
      setPasswordSuccess(res.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(null);
      }, 1500);
    } else {
      setPasswordError(res.message);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'claim', label: 'Daily Faucet', icon: Coins, highlight: true },
    { id: 'learn', label: 'Learn & Quiz', icon: BookOpen },
    { id: 'referrals', label: 'Referrals', icon: Users },
    { id: 'leaderboard', label: 'Leaderboard', icon: Award },
    { id: 'withdraw', label: 'Withdraw', icon: ArrowUpRight },
    ...(currentUser?.role === 'admin'
      ? [{ id: 'admin', label: 'Admin Portal', icon: ShieldCheck, adminBadge: true }]
      : []),
  ];

  const getInitials = (name: string, email: string) => {
    if (name && name.trim().length > 0) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0c1017]/95 backdrop-blur-md border-b border-amber-500/20 shadow-xl shadow-black/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo in top corner as requested */}
          <div
            id="eldra-brand-logo"
            onClick={() => setActiveTab(currentUser?.role === 'admin' && activeTab === 'admin' ? 'admin' : 'dashboard')}
            className="flex items-center gap-3.5 cursor-pointer group select-none"
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-amber-600 via-amber-300 to-yellow-600 shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-all duration-300">
                <img
                  src={ELDRA_COIN_IMAGE}
                  alt="Eldra Coin Logo"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = '/eldra_coin.jpg';
                  }}
                  className="w-full h-full rounded-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#0c1017] rounded-full flex items-center justify-center text-[8px] font-bold text-black" title="Solana Mainnet Active">
                ✓
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-cinzel text-xl font-extrabold tracking-wider bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                  ELDRA
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  COIN
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium tracking-wide">
                Solana Network Ecosystem
              </p>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {navItems.map((item: any) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-btn-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                    item.adminBadge
                      ? isActive
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold shadow-lg shadow-amber-500/25 border border-amber-400'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30 font-bold'
                      : isActive
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                  } ${item.highlight && !isActive && !item.adminBadge ? 'text-amber-400/90 font-semibold' : ''}`}
                >
                  <Icon className={`w-4 h-4 ${item.adminBadge ? (isActive ? 'text-black' : 'text-amber-400') : isActive ? 'text-amber-400' : item.highlight ? 'text-amber-400' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                  {item.adminBadge && (
                    <span className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-black text-amber-300' : 'bg-amber-500 text-black'}`}>
                      Admin
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right side: Balance Pill & User Info */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <>
                {/* Balance Pill */}
                <div
                  id="user-balance-pill"
                  onClick={() => setActiveTab('dashboard')}
                  className="cursor-pointer flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-950/60 to-zinc-900/90 border border-amber-500/30 hover:border-amber-400 transition-colors shadow-inner"
                  title="Your Eldra Coin Balance"
                >
                  <img
                    src={ELDRA_COIN_IMAGE}
                    alt="Coin"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = '/eldra_coin.jpg';
                    }}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <div className="flex items-baseline gap-1">
                    <span className="font-cinzel font-bold text-amber-300 text-sm sm:text-base">
                      {currentUser.balance.toLocaleString()}
                    </span>
                    <span className="text-[11px] font-semibold text-amber-400/80">
                      ELDRA
                    </span>
                  </div>
                  {currentUser.claimStreak > 0 && (
                    <span className="hidden sm:flex items-center text-[11px] font-bold text-orange-400 bg-orange-950/60 border border-orange-600/30 px-1.5 py-0.5 rounded-full ml-1" title={`${currentUser.claimStreak} Day Claim Streak`}>
                      <Flame className="w-3 h-3 mr-0.5 fill-orange-400" />
                      {currentUser.claimStreak}d
                    </span>
                  )}
                </div>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    id="user-profile-menu-btn"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 pl-2.5 rounded-full bg-zinc-900/90 border border-zinc-700/60 hover:border-amber-500/40 transition-all text-left"
                  >
                    {/* Monogram Badge instead of image icon */}
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-600 to-yellow-600 flex items-center justify-center font-bold text-xs text-black shadow-sm">
                      {getInitials(currentUser.displayName, currentUser.email)}
                    </div>
                    <span className="text-xs font-medium text-zinc-300 hidden sm:inline-block max-w-[100px] truncate">
                      {currentUser.displayName}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400 mr-1" />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div
                      id="user-profile-dropdown"
                      className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#0f141d] border border-amber-500/30 shadow-2xl shadow-black/80 py-3 px-3 z-50 animate-in fade-in zoom-in-95 duration-150"
                    >
                      <div className="pb-3 border-b border-zinc-800 px-2">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm text-zinc-100 truncate">
                            {currentUser.displayName}
                          </p>
                          {currentUser.role === 'admin' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              Super Admin
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-amber-400/90 font-mono font-bold">
                          <span>@{currentUser.username || 'member'}</span>
                        </div>
                        <p className="text-xs text-zinc-400 truncate mt-0.5">
                          {currentUser.email}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-xs bg-zinc-900/90 rounded-lg p-2 border border-zinc-800">
                          <span className="text-zinc-400">Referral Code:</span>
                          <span className="font-mono font-bold text-amber-300">
                            {currentUser.referralCode}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs bg-zinc-900/90 rounded-lg p-2 border border-zinc-800">
                          <span className="text-zinc-400">Network:</span>
                          <span className="font-mono text-[11px] text-emerald-400 font-semibold">
                            Solana Network
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 space-y-1">
                        <button
                          onClick={() => {
                            setActiveTab('withdraw');
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-amber-300 hover:bg-amber-500/15 font-semibold transition-colors cursor-pointer"
                        >
                          <ArrowUpRight className="w-4 h-4 text-amber-400" />
                          Withdrawal Center
                        </button>
                        {currentUser.role === 'admin' && (
                          <>
                            <button
                              id="admin-user-menu-post-quiz"
                              onClick={() => {
                                if (onNavigateAdmin) onNavigateAdmin('quizzes');
                                else setActiveTab('admin');
                                setShowUserMenu(false);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-amber-300 hover:bg-amber-500/20 font-bold transition-colors cursor-pointer"
                            >
                              <BookOpen className="w-4 h-4 text-amber-400" />
                              <span>➕ Post Quiz & Learning Link</span>
                            </button>
                            <button
                              id="admin-user-menu-portal"
                              onClick={() => {
                                if (onNavigateAdmin) onNavigateAdmin('withdrawals');
                                else setActiveTab('admin');
                                setShowUserMenu(false);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-amber-300 hover:bg-amber-500/15 font-semibold transition-colors cursor-pointer"
                            >
                              <ShieldCheck className="w-4 h-4 text-amber-400" />
                              <span>👑 Super Admin Portal</span>
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setShowPasswordModal(true);
                            setShowUserMenu(false);
                            setPasswordError(null);
                            setPasswordSuccess(null);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-zinc-300 hover:text-amber-300 hover:bg-zinc-800/60 font-medium transition-colors cursor-pointer"
                        >
                          <KeyRound className="w-4 h-4 text-amber-400" />
                          Change Password
                        </button>
                        <button
                          id="dropdown-logout-btn"
                          onClick={() => {
                            store.logout();
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/15 font-bold transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-red-400" />
                          Log Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Log Out Button in Top Header */}
                <button
                  id="direct-header-logout-btn"
                  onClick={() => store.logout()}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-950/70 border border-red-500/30 hover:border-red-500/60 text-red-300 hover:text-red-200 text-xs font-bold transition-all cursor-pointer shadow-sm"
                  title="Log out of your account"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-400" />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <button
                id="sign-in-btn"
                onClick={onOpenAuth}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
              >
                <Sparkles className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2.5 border-t border-zinc-800/60 overflow-x-auto gap-1">
          {navItems.map((item: any) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors shrink-0 ${
                  item.adminBadge
                    ? isActive
                      ? 'text-amber-300 font-extrabold bg-amber-500/20 rounded-xl px-2'
                      : 'text-amber-400 font-bold'
                    : isActive
                    ? 'text-amber-300 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${item.adminBadge ? 'text-amber-400' : isActive ? 'text-amber-400' : ''}`} />
                <span className="text-[11px] whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}

          {/* Mobile Log Out Action */}
          {currentUser && (
            <button
              id="mobile-nav-logout-btn"
              onClick={() => store.logout()}
              className="flex flex-col items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-red-400 hover:text-red-300 transition-colors shrink-0 cursor-pointer"
              title="Log out"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span className="text-[11px] whitespace-nowrap font-bold">Log Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Reset / Change Password Modal */}
      {showPasswordModal && currentUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0f141d] border border-amber-500/30 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 relative">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-100 text-base">
                    {currentUser.role === 'admin' ? 'Reset Admin Password' : 'Change Password'}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    {currentUser.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}
            {passwordSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordReset} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#141b27] border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#141b27] border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-black text-xs font-bold shadow-md shadow-amber-500/20 hover:scale-[1.02] transition-all cursor-pointer"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
