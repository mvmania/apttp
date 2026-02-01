
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import { useChat } from '../context/ChatContext';
import { TECH_NEEDS, DEMO_USERS, STAKEHOLDERS } from '../mockData';
import {
  ArrowLeft,
  Lightbulb,
  Clock,
  DollarSign,
  Calendar,
  ShieldCheck,
  MessageSquare,
  Building2,
  Loader2,
  AlertTriangle,
  Info,
  CheckCircle2,
  ChevronRight,
  User as UserIcon
} from 'lucide-react';

const NeedDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const { createOrGetChat } = useChat();

  const [need, setNeed] = useState<any | null>(null);
  const [seeker, setSeeker] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [needs, users, stakeholders] = await Promise.all([
          apiService.getTechNeeds(),
          apiService.getUsers(),
          apiService.getStakeholders()
        ]);

        const foundNeed = needs.find((n: any) => n.id === id);
        if (foundNeed) {
          setNeed(foundNeed);
          const foundSeeker = users.find((u: any) => u.id === foundNeed.seeker_id) ||
            stakeholders.find((s: any) => s.stakeholder_id === foundNeed.seeker_id);
          setSeeker(foundSeeker || null);
        }
      } catch (error) {
        console.error('Error fetching need detail:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-apctt-blue"></div>
      </div>
    );
  }

  if (!need) {
    return (
      <div className="max-w-7xl mx-auto py-20 px-4 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Requirement not found</h2>
        <button onClick={() => navigate('/needs')} className="text-indigo-600 font-semibold hover:underline flex items-center justify-center mx-auto">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory
        </button>
      </div>
    );
  }

  const handleProposeSolution = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    if (!user?.is_verified) {
      setShowVerificationAlert(true);
      setTimeout(() => setShowVerificationAlert(false), 5000);
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const chatId = createOrGetChat(
        need.id,
        need.title,
        need.seeker_id,
        user.id,
        'need'
      );
      setIsProcessing(false);
      navigate(`/chat/${chatId}`);
    }, 1500);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {showVerificationAlert && (
        <div className="fixed top-20 right-4 z-[100] animate-in slide-in-from-right-10 duration-300">
          <div className="bg-white border-l-4 border-amber-500 shadow-2xl rounded-2xl p-5 flex items-start gap-4 max-w-sm">
            <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Verified Access Only</h4>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Proposing solutions is restricted to **Verified Partners**. Please complete verification in your dashboard.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Link to="/needs" className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 mb-6 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Tech Needs
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  {need.industry}
                </span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-500 text-xs font-medium uppercase tracking-tight">Open Requirement</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">{need.title}</h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleProposeSolution}
                disabled={isProcessing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-2xl shadow-xl shadow-indigo-100 flex items-center transition-all group disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageSquare className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />}
                Propose Solution
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center border-b pb-4">
                <Info className="w-5 h-5 mr-2 text-indigo-600" /> Need Description
              </h2>
              <p className="text-slate-600 leading-relaxed text-lg mb-8">
                {need.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1 tracking-widest">Industry</span>
                  <span className="text-slate-900 font-bold text-sm">{need.industry}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1 tracking-widest">Budget</span>
                  <span className="text-emerald-600 font-bold text-sm">{need.budget_range || 'Not Disclosed'}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1 tracking-widest">Deadline</span>
                  <span className="text-slate-900 font-bold text-sm">{need.deadline || 'Ongoing'}</span>
                </div>
              </div>
            </section>

            <section className="bg-slate-900 p-8 rounded-[2rem] text-white">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="text-blue-400" />
                <h3 className="text-lg font-bold">Safe & Secure Matchmaking</h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Responding to this need initiates a private consultation between you and the requirement seeker. APCTT Connect provides the framework for NDA exchanges and technical due diligence.
              </p>
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Seeker Information</h2>
              {seeker ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-800 rounded-[1.25rem] flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-slate-200">
                      {(seeker as any).name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg leading-tight">
                        {(seeker as any).name || 'Private User'}
                      </h3>
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                        {(seeker as any).scenario || (seeker as any).category}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-slate-50">
                    <p className="text-xs text-slate-500 leading-relaxed italic">
                      "Contact this seeker if you have a technology solution that aligns with their requirements."
                    </p>
                  </div>

                  {seeker.stakeholder_id && (
                    <Link
                      to={`/stakeholders/${seeker.stakeholder_id}`}
                      className="block w-full text-center py-4 border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all mt-6"
                    >
                      Organization Profile
                    </Link>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 italic">Information unavailable.</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeedDetail;
