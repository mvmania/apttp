import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Globe, Lock, Mail, ArrowRight, ChevronRight, ShieldCheck, Building2 } from 'lucide-react';
import { getTurnstileSiteKey } from '../services/turnstileService';
import TurnstileWidget from '../components/TurnstileWidget';
import { apiService } from '../services/apiService';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const turnstileSiteKey = getTurnstileSiteKey();
  const demoScenarios = [
    { label: 'Platform Admin', subtitle: 'APCTT Internal Staff', icon: ShieldCheck, email: 'admin@apctt.org' },
    { label: 'Official Representative', subtitle: 'GreenFuture Tech CEO', icon: ShieldCheck, email: 'rep@greenfuture.org' },
    { label: 'Organization Member', subtitle: 'Internal Staff Access', icon: Building2, email: 'member@greenfuture.org' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (turnstileSiteKey && !captchaToken) {
      setLoginError('Please complete the CAPTCHA challenge.');
      return;
    }

    const result = await login(email, password, captchaToken || undefined);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setLoginError(result.error || 'Invalid credentials or captcha verification failed.');
    }
  };

  const handleSendResetCode = async () => {
    setRecoveryMessage('');
    setRecoveryError('');
    if (!email.trim()) {
      setRecoveryError('Enter your email address first.');
      return;
    }

    setIsSendingReset(true);
    try {
      const response = await apiService.forgotPassword(email.trim());
      setRecoveryMessage(response.message || 'If the email exists, a reset OTP has been sent.');
    } catch (error: any) {
      setRecoveryError(error?.message || 'Failed to send reset OTP.');
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleResetPassword = async () => {
    setRecoveryMessage('');
    setRecoveryError('');

    if (!email.trim() || !resetCode.trim() || !newPassword || !confirmPassword) {
      setRecoveryError('Complete email, OTP, and both password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setRecoveryError('New password and confirm password do not match.');
      return;
    }

    setIsResettingPassword(true);
    try {
      const response = await apiService.resetPassword(email.trim(), resetCode.trim(), newPassword);
      setRecoveryMessage(response.message || 'Password reset successful. You can sign in now.');
      setPassword('');
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
      setIsRecoveryMode(false);
    } catch (error: any) {
      setRecoveryError(error?.message || 'Failed to reset password.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 px-4 py-20">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-8 text-center bg-slate-900 text-white">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-900/20">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">User Portal</h1>
          <p className="text-slate-400 mt-2 text-sm">Join the APCTT Innovation Network</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@organization.com"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Security Key</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="********"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {turnstileSiteKey && (
            <TurnstileWidget
              siteKey={turnstileSiteKey}
              action="login"
              onTokenChange={setCaptchaToken}
            />
          )}

          {loginError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {loginError}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center transition-all shadow-xl shadow-blue-100"
          >
            Sign In <ArrowRight className="ml-2 w-4 h-4" />
          </button>

          <Link to="/forgot-password" className="block w-full text-center text-sm font-semibold text-blue-600 hover:text-blue-700">
            Forgot password? Reset with OTP
          </Link>

          {isRecoveryMode && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-600">
                Enter your email, request the OTP, then set a new password.
              </p>
              <button
                type="button"
                onClick={handleSendResetCode}
                disabled={isSendingReset}
                className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {isSendingReset ? 'Sending OTP...' : 'Send Reset OTP'}
              </button>
              <input
                type="text"
                inputMode="numeric"
                placeholder="6-digit OTP"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
              />
              <input
                type="password"
                placeholder="New password"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <input
                type="password"
                placeholder="Confirm new password"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={isResettingPassword}
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {isResettingPassword ? 'Resetting Password...' : 'Reset Password'}
              </button>
              {recoveryMessage && (
                <p className="text-xs font-semibold text-emerald-700">{recoveryMessage}</p>
              )}
              {recoveryError && (
                <p className="text-xs font-semibold text-red-700">{recoveryError}</p>
              )}
            </div>
          )}

          <div className="pt-6 border-t border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center mb-4">
              Select Demo Scenario
            </p>
            <div className="space-y-2.5">
              {demoScenarios.map((scenario) => (
                <button
                  key={scenario.label}
                  type="button"
                  onClick={() => setEmail(scenario.email)}
                  className="w-full border border-slate-200 hover:border-blue-300 rounded-xl px-3 py-2.5 flex items-center justify-between transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <scenario.icon className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">{scenario.label}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{scenario.subtitle}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              ))}
            </div>
          </div>
        </form>

        <div className="p-6 bg-slate-50 text-center border-t border-slate-100">
          <p className="text-xs text-slate-500 font-medium">
            New to the platform? <Link to="/register" className="text-blue-600 font-bold hover:underline">Create an Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
