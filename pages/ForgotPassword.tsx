import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react';
import { apiService } from '../services/apiService';

type Step = 1 | 2 | 3;

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearFeedback = () => {
    setMessage('');
    setError('');
  };

  const handleSendOtp = async () => {
    clearFeedback();
    if (!email.trim()) {
      setError('Enter your email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiService.forgotPassword(email.trim());
      setMessage(response.message || 'Reset OTP sent to your email.');
      setStep(2);
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    clearFeedback();
    if (!otp.trim()) {
      setError('Enter the OTP sent to your email.');
      return;
    }

    setMessage('OTP entered. Set your new password now.');
    setStep(3);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    if (!email.trim() || !otp.trim() || !newPassword || !confirmPassword) {
      setError('Complete all fields first.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiService.resetPassword(email.trim(), otp.trim(), newPassword);
      setMessage(response.message || 'Password reset successful.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 px-4 py-20">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-8 text-center bg-slate-900 text-white relative">
          <Link to="/login" className="absolute left-6 top-8 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-slate-400 mt-2 text-sm">Secure account recovery with email OTP</p>

          <div className="mt-6 flex justify-center gap-2">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className={`h-1.5 w-12 rounded-full ${step >= item ? 'bg-blue-500' : 'bg-slate-700'}`}
              />
            ))}
          </div>
        </div>

        <form onSubmit={handleResetPassword} className="p-8 space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-lg font-bold text-slate-900">Step 1: Enter Email</h2>
                <p className="text-sm text-slate-500 mt-1">We will send a 6-digit OTP to your registered email.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@organization.com"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl disabled:opacity-60"
              >
                {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-lg font-bold text-slate-900">Step 2: Verify OTP</h2>
                <p className="text-sm text-slate-500 mt-1">Enter the 6-digit code sent to {email}.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email OTP</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="6-digit OTP"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleVerifyOtp}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isSubmitting}
                className="w-full text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Resend OTP
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-lg font-bold text-slate-900">Step 3: Create New Password</h2>
                <p className="text-sm text-slate-500 mt-1">Set a strong new password for your account.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Confirm Password</label>
                <div className="relative">
                  <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl disabled:opacity-60"
              >
                {isSubmitting ? 'Updating Password...' : 'Save New Password'}
              </button>
            </div>
          )}

          {(message || error) && (
            <div className={`rounded-xl px-4 py-3 text-sm font-medium ${error ? 'border border-red-200 bg-red-50 text-red-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
              {error || message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
