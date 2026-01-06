
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Globe, Lock, Mail, ArrowRight, Building2, User as UserIcon, ShieldCheck, ChevronRight, Settings } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email);
    if (success) {
      navigate('/dashboard');
    } else {
      alert('Invalid email or user not found. (Use any of: admin@apctt.org, j.chen@greenfuture.com, e.wong@greenfuture.com)');
    }
  };

  const handleDemoLogin = async (e: string, dest: string) => {
    await login(e);
    navigate(dest);
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
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center transition-all shadow-xl shadow-blue-100"
          >
            Sign In <ArrowRight className="ml-2 w-4 h-4" />
          </button>

          <div className="relative flex items-center justify-center py-4">
            <div className="border-t border-slate-100 w-full"></div>
            <span className="bg-white px-4 text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] absolute">Select Demo Scenario</span>
          </div>

          <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2 scrollbar-hide">
            <button
              type="button"
              onClick={() => handleDemoLogin('admin@apctt.org', '/admin')}
              className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-3.5 px-4 rounded-xl border border-indigo-200 transition-all flex items-center justify-between group shadow-sm"
            >
              <div className="flex items-center">
                <Settings className="w-5 h-5 mr-3 text-indigo-600" />
                <div className="text-left">
                  <p className="text-sm">Platform Admin</p>
                  <p className="text-[10px] text-indigo-400 font-normal italic">APCTT Internal Staff</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-indigo-300 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('j.chen@greenfuture.com', '/dashboard')}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-4 rounded-xl border border-slate-200 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center">
                <ShieldCheck className="w-5 h-5 mr-3 text-blue-600" />
                <div className="text-left">
                  <p className="text-sm">Official Representative</p>
                  <p className="text-[10px] text-slate-400 font-normal">GreenFuture Tech CEO</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('e.wong@greenfuture.com', '/dashboard')}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-4 rounded-xl border border-slate-200 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center">
                <Building2 className="w-5 h-5 mr-3 text-slate-400" />
                <div className="text-left">
                  <p className="text-sm">Organization Member</p>
                  <p className="text-[10px] text-slate-400 font-normal">Internal Staff Access</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
            </button>
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
