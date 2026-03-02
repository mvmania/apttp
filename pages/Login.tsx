import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Globe, Lock, Mail, ArrowRight } from 'lucide-react';
import { getTurnstileSiteKey } from '../services/turnstileService';
import TurnstileWidget from '../components/TurnstileWidget';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const turnstileSiteKey = getTurnstileSiteKey();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (turnstileSiteKey && !captchaToken) {
      alert('Please complete the CAPTCHA challenge.');
      return;
    }

    const success = await login(email, password, captchaToken || undefined);
    if (success) {
      navigate('/dashboard');
    } else {
      alert('Invalid credentials or captcha verification failed.');
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

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center transition-all shadow-xl shadow-blue-100"
          >
            Sign In <ArrowRight className="ml-2 w-4 h-4" />
          </button>
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
