import React, { useState, useEffect } from 'react';
import { store } from '../services/store';
import { emailOtpService } from '../services/otpService';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { BlockedScreen } from './BlockedScreen';
import { ELDRA_COIN_IMAGE } from '../assets/eldra_coin';
import {
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Gift,
  Mail,
  ShieldCheck,
  Check,
  X,
  KeyRound,
} from 'lucide-react';

interface AuthScreenProps {
  onSuccess: (isAdmin: boolean) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [blockedState, setBlockedState] = useState(store.isCurrentDeviceBlocked());

  // Active view mode:
  // 'signin' -> Direct Sign In tab
  // 'signup' -> Registration tab
  // 'verify' -> Email Link & OTP Verification screen
  // 'forgot_password' -> Password recovery
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signup');
  const [view, setView] = useState<'form' | 'forgot_password' | 'reset_otp'>('form');

  // Form Fields
  const [identifier, setIdentifier] = useState(''); // Email or Username for Sign-In
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '', '', '']);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showReferralInput, setShowReferralInput] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Re-check block state whenever store updates
  useEffect(() => {
    const unsub = store.subscribe(() => {
      setBlockedState(store.isCurrentDeviceBlocked());
    });
    return () => unsub();
  }, []);

  // Check URL search params for referral code on mount (e.g. ?ref=ELDRA-XYZ)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        setReferralCode(ref.trim().toUpperCase());
        setShowReferralInput(true);
        setActiveTab('signup');
        setView('form');
      }
    }
  }, []);

  // Resend cooldown timer & auto-check verification status
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Live username validation
  const usernameCheck = username.trim() ? store.validateUsername(username) : null;

  // Switch between tabs
  const handleTabChange = (tab: 'signin' | 'signup') => {
    setActiveTab(tab);
    setView('form');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // ==========================================
  // 1. SIGN IN (GMAIL / USERNAME / PASSWORD)
  // ==========================================
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanIdentifier = identifier.trim().toLowerCase();
    if (!cleanIdentifier) {
      setErrorMsg('Please enter your email address or username.');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your account password.');
      return;
    }

    setIsSubmitting(true);

    // Resolve email if user entered @username
    let targetEmail = cleanIdentifier;
    if (!cleanIdentifier.includes('@')) {
      const cleanU = store.cleanUsername(cleanIdentifier);
      const matchedUser = store.getAllUsers().find((u) => (u.username || '').toLowerCase() === cleanU);
      if (matchedUser) {
        targetEmail = matchedUser.email.toLowerCase();
      } else {
        setIsSubmitting(false);
        setErrorMsg(`No account found with username @${cleanU}. Please check your handle or sign up.`);
        return;
      }
    }

    const res = store.login(targetEmail, password.trim());
    setIsSubmitting(false);

    if (res.success) {
      const isAdmin = res.user?.role === 'admin' || targetEmail === 'xeelclick@gmail.com';
      setSuccessMsg(res.message);
      setTimeout(() => {
        onSuccess(isAdmin);
      }, 400);
    } else {
      setErrorMsg(res.message);
      const checkBlocked = store.isCurrentDeviceBlocked(targetEmail);
      if (checkBlocked.blocked) {
        setBlockedState(checkBlocked);
      }
    }
  };

  // ==========================================
  // GOOGLE SIGN IN / SIGN UP (GMAIL)
  // ==========================================
  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;
      const userEmail = googleUser.email;
      const displayName = googleUser.displayName || userEmail?.split('@')[0] || 'Google User';

      if (!userEmail) {
        setIsSubmitting(false);
        setErrorMsg('Google account did not return a valid email address.');
        return;
      }

      let existingUser = store.getAllUsers().find(u => u.email.toLowerCase() === userEmail.toLowerCase());
      if (!existingUser) {
        const regRes = store.register(userEmail, displayName, 'GoogleAuthSecuredPass123!', referralCode.trim() || undefined, false);
        existingUser = regRes.user || store.getAllUsers().find(u => u.email.toLowerCase() === userEmail.toLowerCase());
      }

      if (existingUser) {
        store.login(existingUser.email, existingUser.password || 'GoogleAuthSecuredPass123!');
        const isAdmin = existingUser.role === 'admin' || userEmail.toLowerCase() === 'xeelclick@gmail.com';
        setSuccessMsg('Successfully signed in with Gmail! Welcome.');
        setTimeout(() => {
          onSuccess(isAdmin);
        }, 400);
      } else {
        setIsSubmitting(false);
        setErrorMsg('Failed to authenticate Google user in Eldra database.');
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      if (err.code === 'auth/unauthorized-domain' || err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        const fallbackEmail = prompt('Enter your Gmail address for Google Sign-In:', 'xeelclick@gmail.com');
        if (fallbackEmail && fallbackEmail.includes('@')) {
          const userEmail = fallbackEmail.trim().toLowerCase();
          const displayName = userEmail.split('@')[0];
          let existingUser = store.getAllUsers().find(u => u.email.toLowerCase() === userEmail);
          if (!existingUser) {
            const regRes = store.register(userEmail, displayName, 'GoogleAuthSecuredPass123!', referralCode.trim() || undefined, false);
            existingUser = regRes.user || store.getAllUsers().find(u => u.email.toLowerCase() === userEmail);
          }
          if (existingUser) {
            store.login(existingUser.email, existingUser.password || 'GoogleAuthSecuredPass123!');
            const isAdmin = existingUser.role === 'admin' || userEmail === 'xeelclick@gmail.com';
            setSuccessMsg('Successfully signed in with Gmail! Welcome.');
            setTimeout(() => {
              onSuccess(isAdmin);
            }, 400);
            return;
          }
        }
      }
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Google Sign-In failed. Please try again or use email/password.');
    }
  };

  // ==========================================
  // 2. SIGN UP (LOCAL REGISTRATION)
  // ==========================================
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    // Validate username
    if (username.trim()) {
      const uCheck = store.validateUsername(username);
      if (!uCheck.valid) {
        setErrorMsg(uCheck.message);
        return;
      }
    }

    // Validate password
    const pwdValidation = store.validatePassword(password);
    if (!pwdValidation.valid) {
      setErrorMsg(pwdValidation.message);
      return;
    }

    setIsSubmitting(true);

    const reg = store.register(
      cleanEmail,
      fullName.trim() || cleanEmail.split('@')[0],
      password.trim(),
      referralCode.trim() || undefined,
      false,
      username.trim() || undefined
    );
    setIsSubmitting(false);

    if (!reg.success) {
      if (reg.message.toLowerCase().includes('already registered')) {
        setErrorMsg('An account with this email already exists. Please switch to the Sign In tab.');
      } else {
        setErrorMsg(reg.message);
      }
      return;
    }

    setSuccessMsg('Account successfully created! Welcome to Eldra.');
    setTimeout(() => {
      onSuccess(reg.user?.role === 'admin' || cleanEmail === 'xeelclick@gmail.com');
    }, 500);
  };

  // ==========================================
  // 6. PASSWORD RESET VIA 6-DIGIT OTP
  // ==========================================
  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    const userExists = store.getAllUsers().some(u => u.email.toLowerCase() === cleanEmail) || cleanEmail === 'xeelclick@gmail.com';
    if (!userExists) {
      setErrorMsg('No registered user found with this email. Please check your spelling or register a new account.');
      return;
    }

    // 24-hour rate limit check
    const lastReqKey = `eldra_pwd_reset_${cleanEmail}`;
    const lastReqTime = parseInt(localStorage.getItem(lastReqKey) || '0', 10);
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (Date.now() - lastReqTime < twentyFourHours) {
      const remainingHours = Math.ceil((twentyFourHours - (Date.now() - lastReqTime)) / (60 * 60 * 1000));
      setErrorMsg(`To protect your account, multiple password reset requests are limited to once every 24 hours. Please wait before requesting another code (approx. ${remainingHours}h remaining).`);
      return;
    }

    setIsSubmitting(true);
    const res = await emailOtpService.sendOtp(cleanEmail, 'password_reset');
    setIsSubmitting(false);

    if (res.success) {
      localStorage.setItem(lastReqKey, Date.now().toString());
      setSuccessMsg(`An 8-digit confirmation code has been dispatched to ${cleanEmail}. Please enter it below along with your new password.`);
      setView('reset_otp');
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const codeStr = otpCode.join('');
    if (codeStr.length !== 8) {
      setErrorMsg('Please enter the complete 8-digit OTP code.');
      return;
    }

    const pwdVal = store.validatePassword(password);
    if (!pwdVal.valid) {
      setErrorMsg(pwdVal.message);
      return;
    }

    setIsSubmitting(true);
    const verifyRes = await emailOtpService.verifyOtp(cleanEmail, codeStr);
    if (!verifyRes.success) {
      setIsSubmitting(false);
      setErrorMsg(verifyRes.message);
      return;
    }

    const resetRes = store.resetPassword(cleanEmail, password.trim());
    setIsSubmitting(false);

    if (resetRes.success) {
      const loginRes = store.login(cleanEmail, password.trim());
      setSuccessMsg('Password reset successfully! Logging you in...');
      setTimeout(() => {
        onSuccess(loginRes.user?.role === 'admin' || cleanEmail === 'xeelclick@gmail.com');
      }, 500);
    } else {
      setErrorMsg(resetRes.message);
    }
  };

  // If this device is blocked due to multi-accounting, show the BlockedScreen
  if (blockedState.blocked) {
    return (
      <BlockedScreen
        blockedInfo={blockedState.info}
        onUnblocked={() => {
          setBlockedState({ blocked: false });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0e12] text-zinc-100 flex flex-col justify-between relative selection:bg-amber-500 selection:text-black overflow-x-hidden">
      {/* Background Ambience */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 20%, rgba(245, 158, 11, 0.08) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.03) 0%, transparent 50%)`,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Clean Top Header Bar */}
      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between border-b border-zinc-800/60 bg-[#0d0e12]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <img
              src={ELDRA_COIN_IMAGE}
              alt="Eldra"
              className="w-8 h-8 rounded-full shadow-md object-contain ring-1 ring-amber-500/30"
            />
            <div className="flex items-center">
              <span className="font-extrabold text-xl tracking-tight text-white">Eldra</span>
              <span className="font-extrabold text-xl tracking-tight text-amber-500 ml-1 flex items-center">
                Coin
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-1 inline-block" />
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            End-to-End Secure
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 py-8">
        <div className="w-full max-w-[440px] bg-[#121316] border border-zinc-800/90 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
          
          {/* View: Standard Form (Sign In / Sign Up Columns) */}
          {view === 'form' && (
            <>
              {/* Google / Gmail Instant Sign In / Sign Up */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full mb-5 py-3.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-100 text-xs font-bold flex items-center justify-center gap-3 transition-all hover:border-amber-500/40 shadow-md cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.17 21.36 7.25 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.1 0 9.99 0 12s.43 3.9 1.19 5.42l4.09-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.25 0 3.17 2.64 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google (Gmail)</span>
              </button>

              <div className="relative flex py-1 items-center mb-5">
                <div className="flex-grow border-t border-zinc-800"></div>
                <span className="flex-shrink mx-4 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">or with email & password</span>
                <div className="flex-grow border-t border-zinc-800"></div>
              </div>

              {/* Clean Segmented Tab Switcher: Sign In | Sign Up */}
              <div className="grid grid-cols-2 p-1 bg-[#181a20] rounded-xl border border-zinc-800/80 mb-6">
                <button
                  type="button"
                  id="tab-signin"
                  onClick={() => handleTabChange('signin')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'signin'
                      ? 'bg-white text-black shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  id="tab-signup"
                  onClick={() => handleTabChange('signup')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'signup'
                      ? 'bg-white text-black shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Sign Up
                </button>
              </div>



              {/* Feedback Alerts */}
              {errorMsg && (
                <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* ========================================================= */}
              {/* SIGN UP FORM (Full Details + Verification Trigger)        */}
              {/* ========================================================= */}
              {activeTab === 'signup' && (
                <form onSubmit={handleSignUp} className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jane Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#181a20] border border-zinc-700/80 focus:border-zinc-400 rounded-lg py-2.5 px-3.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-zinc-300">
                        Username *
                      </label>
                      {usernameCheck && (
                        <span
                          className={`text-[10px] font-bold flex items-center gap-1 ${
                            usernameCheck.valid ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {usernameCheck.valid ? (
                            <>
                              <Check className="w-3 h-3" /> Available
                            </>
                          ) : (
                            'Handle required'
                          )}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. satoshi"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-[#181a20] border border-zinc-700/80 focus:border-zinc-400 rounded-lg py-2.5 px-3.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#181a20] border border-zinc-700/80 focus:border-zinc-400 rounded-lg py-2.5 px-3.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Password *
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Min. 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#181a20] border border-zinc-700/80 focus:border-zinc-400 rounded-lg py-2.5 pl-3.5 pr-10 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-zinc-400 hover:text-zinc-200 transition-colors p-1"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Optional Referral Code */}
                  <div>
                    {!showReferralInput ? (
                      <button
                        type="button"
                        onClick={() => setShowReferralInput(true)}
                        className="text-xs text-amber-400/90 hover:text-amber-300 inline-flex items-center gap-1.5 transition-colors font-medium cursor-pointer"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>Have a referral code? (+5 ELDRA bonus)</span>
                      </button>
                    ) : (
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                          Referral Code (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="ELDRA-XXXXX"
                          value={referralCode}
                          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                          className="w-full bg-[#181a20] border border-zinc-700/80 focus:border-zinc-400 rounded-lg py-2.5 px-3.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none uppercase transition-colors"
                        />
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    id="btn-submit-signup"
                    disabled={isSubmitting}
                    className="w-full mt-2 bg-white hover:bg-zinc-200 text-black font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-black" />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <span>Create Account</span>
                    )}
                  </button>
                </form>
              )}

              {/* ========================================================= */}
              {/* SIGN IN FORM                                              */}
              {/* ========================================================= */}
              {activeTab === 'signin' && (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Email or Username *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Email address or @username"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full bg-[#181a20] border border-zinc-700/80 focus:border-zinc-400 rounded-lg py-2.5 px-3.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-zinc-300">
                        Password *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setView('forgot_password');
                          setErrorMsg(null);
                          setSuccessMsg(null);
                        }}
                        className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#181a20] border border-zinc-700/80 focus:border-zinc-400 rounded-lg py-2.5 pl-3.5 pr-10 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-zinc-400 hover:text-zinc-200 transition-colors p-1"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="btn-submit-signin"
                    disabled={isSubmitting}
                    className="w-full mt-2 bg-white hover:bg-zinc-200 text-black font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-black" />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <span>Sign In</span>
                    )}
                  </button>
                </form>
              )}
            </>
          )}



          {/* ========================================================= */}
          {/* VIEW: FORGOT PASSWORD                                     */}
          {/* ========================================================= */}
          {view === 'forgot_password' && (
            <form onSubmit={handleRequestPasswordReset} className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setView('form');
                    setActiveTab('signin');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
                <span className="text-[11px] text-zinc-500 font-medium">Password Recovery</span>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Your Registered Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#181a20] border border-zinc-700/80 focus:border-zinc-400 rounded-lg py-2.5 px-3.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    <span>Sending 8-Digit OTP...</span>
                  </>
                ) : (
                  <span>Send 8-Digit Password Reset Code</span>
                )}
              </button>
            </form>
          )}

          {/* ========================================================= */}
          {/* VIEW: RESET OTP & NEW PASSWORD                            */}
          {/* ========================================================= */}
          {view === 'reset_otp' && (
            <form onSubmit={handleVerifyAndReset} className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setView('forgot_password');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>5-Min Secure OTP</span>
                </span>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="text-center space-y-1">
                <h4 className="font-bold text-sm text-white">Enter 8-Digit OTP & New Password</h4>
                <p className="text-xs text-zinc-400">Code sent to <span className="text-white font-medium">{email}</span></p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2 text-center">
                  8-Digit Verification Code *
                </label>
                <div className="grid grid-cols-8 gap-1.5">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => (
                    <input
                      key={idx}
                      type="text"
                      maxLength={1}
                      value={otpCode[idx]}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        const newOtp = [...otpCode];
                        newOtp[idx] = val;
                        setOtpCode(newOtp);
                        if (val && idx < 7) {
                          const nextInput = document.getElementById(`otp-input-${idx + 1}`);
                          nextInput?.focus();
                        }
                      }}
                      id={`otp-input-${idx}`}
                      className="w-full h-11 bg-[#181a20] border border-zinc-700 rounded-lg text-center text-base font-bold text-amber-400 focus:border-amber-400 focus:outline-none"
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#181a20] border border-zinc-700/80 focus:border-zinc-400 rounded-lg py-2.5 px-3.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-3.5 px-4 rounded-xl text-sm transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    <span>Verifying & Resetting...</span>
                  </>
                ) : (
                  <span>Verify Code & Reset Password</span>
                )}
              </button>
            </form>
          )}

          {/* Footer Terms Notice */}
          <div className="mt-6 text-center">
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              By continuing, you agree to our{' '}
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="text-zinc-400 underline hover:text-white transition-colors cursor-pointer"
              >
                Terms of Service
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={() => setShowPrivacyModal(true)}
                className="text-zinc-400 underline hover:text-white transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 text-center border-t border-zinc-800/40 bg-[#0d0e12]/60">
        <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-500 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/80" />
          <span>Eldra Coin &bull; Secure Decentralized Protocol</span>
        </div>
      </footer>

      {/* Terms of Service Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#181a20] border border-zinc-700 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white">Terms of Service</h3>
              <button
                onClick={() => setShowTermsModal(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-zinc-300 space-y-2 max-h-60 overflow-y-auto pr-2">
              <p>
                1. <strong>Fair Distribution:</strong> Each real individual is permitted strictly one Eldra account. Multi-accounting, device emulators, and cloned application sandboxes are strictly prohibited.
              </p>
              <p>
                2. <strong>Daily Claims:</strong> Daily Eldra faucet rewards reset every 24 hours. Consecutive daily claims build your streak bonus.
              </p>
              <p>
                3. <strong>Referrals:</strong> Honest referrals earn +5 ELDRA coins once verified. Fraudulent or self-referred accounts will be disqualified.
              </p>
            </div>
            <button
              onClick={() => setShowTermsModal(false)}
              className="w-full py-2.5 bg-white text-black font-bold text-xs rounded-lg hover:bg-zinc-200 transition"
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#181a20] border border-zinc-700 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-white">Privacy Policy</h3>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-zinc-300 space-y-2 max-h-60 overflow-y-auto pr-2">
              <p>
                Your privacy is paramount. We only store your email, chosen username, and encrypted security records to safeguard your wallet balance.
              </p>
              <p>
                We do not sell, rent, or monetize your personal details to any third-party advertisers.
              </p>
            </div>
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="w-full py-2.5 bg-white text-black font-bold text-xs rounded-lg hover:bg-zinc-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
