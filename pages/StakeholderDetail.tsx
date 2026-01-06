
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useOpportunities } from '../context/OpportunityContext';
import { StakeholderRole, Stakeholder, Technology } from '../types';
import {
  ArrowLeft,
  Building2,
  Mail,
  Globe,
  BadgeCheck,
  MapPin,
  ExternalLink,
  Cpu,
  Info,
  MessageSquare,
  Globe2,
  FileText,
  ChevronRight,
  ShieldCheck,
  Tag,
  Megaphone,
  Calendar,
  DollarSign,
  Briefcase,
  Target,
  Zap,
  Sparkles,
  TrendingUp,
  Lightbulb,
  Phone,
  AlertTriangle,
  Loader2,
  Users
} from 'lucide-react';

const StakeholderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const { createOrGetChat } = useChat();
  const { getOpportunitiesByStakeholder } = useOpportunities();

  const [stakeholder, setStakeholder] = useState<Stakeholder | null>(null);
  const [orgTechs, setOrgTechs] = useState<Technology[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [techs, stakes] = await Promise.all([
          apiService.getTechnologies(),
          apiService.getStakeholders()
        ]);
        const foundStake = stakes.find((s: Stakeholder) => s.stakeholder_id === id);
        if (foundStake) {
          setStakeholder(foundStake);
          setOrgTechs(techs.filter((t: Technology) => t.stakeholder_id === id));
        }
      } catch (error) {
        console.error('Error fetching stakeholder detail:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const orgUpdates = getOpportunitiesByStakeholder(id || '');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-apctt-blue"></div>
      </div>
    );
  }

  if (!stakeholder) {
    return (
      <div className="max-w-7xl mx-auto py-20 px-4 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Organization not found</h2>
        <button
          onClick={() => navigate('/stakeholders')}
          className="text-apctt-blue font-semibold hover:underline flex items-center justify-center mx-auto"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Stakeholders
        </button>
      </div>
    );
  }

  const handleContact = () => {
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

    // Dynamic Inquiry Logic: Checks if the provider explicitly allowed WhatsApp
    setTimeout(() => {
      if (stakeholder!.phone && stakeholder!.whatsapp_enabled) {
        const message = encodeURIComponent(`Hello, I'm interested in collaborating with "${stakeholder!.name}" through APCTT Connect. Can we discuss further?`);
        const cleanPhone = stakeholder!.phone.replace(/[^0-9]/g, '');
        window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
        setIsProcessing(false);
      } else {
        // Default to secure internal chat if WhatsApp is disabled or number is missing
        const chatId = createOrGetChat(
          stakeholder!.stakeholder_id,
          stakeholder!.name,
          stakeholder!.stakeholder_id,
          user.id,
          'tech' // Using 'tech' type as a general 'item' for now, or we could add 'org'
        );
        setIsProcessing(false);
        navigate(`/chat/${chatId}`);
      }
    }, 1200);
  };

  const getRoleIcon = (role: StakeholderRole) => {
    switch (role) {
      case 'Provider': return <Cpu size={14} className="text-apctt-blue" />;
      case 'Seeker': return <Lightbulb size={14} className="text-indigo-600" />;
      case 'Investor': return <DollarSign size={14} className="text-emerald-600" />;
    }
  };

  const getRoleBadge = (role: StakeholderRole) => {
    const styles = {
      Provider: 'bg-apctt-light text-apctt-dark border-apctt-light',
      Seeker: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      Investor: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    };
    return (
      <span key={role} className={`px-4 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold shadow-sm ${styles[role]}`}>
        {getRoleIcon(role)} {role}
      </span>
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20 relative">
      {/* Verification Alert Overlay */}
      {showVerificationAlert && (
        <div className="fixed top-20 right-4 z-[100] animate-in slide-in-from-right-10 duration-300">
          <div className="bg-white border-l-4 border-amber-500 shadow-2xl rounded-2xl p-5 flex items-start gap-4 max-w-sm">
            <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Verified Access Only</h4>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Direct contact with providers is restricted to **Verified Partners**.
                Please complete your profile verification in the dashboard to proceed.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Header Banner */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Link to="/stakeholders" className="inline-flex items-center text-sm text-slate-500 hover:text-apctt-blue mb-8 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory
          </Link>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="w-32 h-32 bg-apctt-blue rounded-[2.5rem] flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-apctt-light flex-shrink-0">
              {stakeholder.name.charAt(0)}
            </div>

            <div className="flex-grow text-center md:text-left space-y-4">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">{stakeholder.name}</h1>
                {stakeholder.is_verified && (
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3" /> Verified Partner
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                {stakeholder.roles?.map(getRoleBadge)}
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-slate-500 font-medium pt-2">
                <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg text-xs uppercase tracking-tighter">
                  <Building2 className="w-4 h-4 text-slate-400" /> {stakeholder.category}
                </span>
                <span className="flex items-center gap-1.5 text-sm">
                  <MapPin className="w-4 h-4 text-slate-400" /> {stakeholder.legal_address}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
                <a
                  href={stakeholder.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-apctt-blue hover:bg-apctt-dark text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-apctt-light flex items-center transition-all"
                >
                  <Globe className="w-4 h-4 mr-2" /> Visit Website
                </a>
                <button
                  onClick={handleContact}
                  disabled={isProcessing}
                  className="bg-white border border-slate-200 text-slate-700 font-bold px-6 py-2.5 rounded-xl hover:bg-slate-50 transition-all flex items-center shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : stakeholder.phone && stakeholder.whatsapp_enabled ? (
                    <><Phone className="w-4 h-4 mr-2 text-emerald-500" /> WhatsApp Inquiry</>
                  ) : (
                    <><Users className="w-4 h-4 mr-2 text-apctt-blue" /> Start Discussion</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column: Org Details & Updates */}
          <div className="lg:col-span-1 space-y-8">
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                <Info className="w-5 h-5 mr-2 text-apctt-blue" /> About Organization
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-8">
                {stakeholder.description}
              </p>

              <div className="mb-8">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center">
                  <Tag size={12} className="mr-2" /> Core Expertise
                </h3>
                <div className="flex flex-wrap gap-2">
                  {stakeholder.key_tech_areas?.map(area => (
                    <span key={area} className="px-3 py-1.5 bg-apctt-light text-apctt-dark text-xs font-bold rounded-xl border border-apctt-light">
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-slate-50">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 flex-shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Inquiry Email</span>
                    <p className="text-sm font-bold text-slate-900">{stakeholder.contact_email}</p>
                  </div>
                </div>
                {/* 전화번호 필드는 UI에서 제거됨 */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Registration ID</span>
                    <p className="text-sm font-bold text-slate-900">{stakeholder.legal_document_id}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Investor Specific Profile Section */}
            {stakeholder.investor_info && (
              <section className="bg-emerald-900 p-10 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                  <TrendingUp size={120} />
                </div>
                <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
                  <Target className="text-emerald-400" size={28} /> Investment Profile
                </h2>

                <div className="space-y-8 relative z-10">
                  <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                    <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest block mb-2">Investment Range</span>
                    <p className="text-2xl font-black">{stakeholder.investor_info.investment_range}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10">
                      <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest block mb-1">Min. TRL</span>
                      <p className="text-lg font-bold">Level {stakeholder.investor_info.preferred_trl_min}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10">
                      <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest block mb-1">Deal Cycle</span>
                      <p className="text-lg font-bold">{stakeholder.investor_info.typical_deal_cycle || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest block">Funding Modalities</span>
                    <div className="flex flex-wrap gap-2">
                      {stakeholder.investor_info.funding_types.map(type => (
                        <span key={type} className="px-3 py-1 bg-white/20 rounded-lg text-xs font-bold">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Organizations Latest Updates Section */}
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-purple-600" /> Latest Updates
              </h2>
              <div className="space-y-4">
                {orgUpdates.length > 0 ? (
                  orgUpdates.map(op => (
                    <Link to={`/opportunities/${op.id}`} key={op.id} className="block p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-purple-200 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="bg-purple-100 text-purple-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">{op.type}</span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1"><Calendar size={10} /> {op.date}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mb-1 leading-tight">{op.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{op.description}</p>
                    </Link>
                  ))
                ) : (
                  <p className="text-slate-400 text-xs italic text-center py-4">No recent updates shared.</p>
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Technology Portfolio */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Cpu className="text-apctt-blue" /> Technology Portfolio
              </h2>
              <span className="bg-apctt-light text-apctt-blue px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest">
                {orgTechs.length} Assets
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {orgTechs.length > 0 ? (
                orgTechs.map(tech => (
                  <Link
                    key={tech.id}
                    to={`/technologies/${tech.id}`}
                    className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden group hover:border-apctt-light0 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="h-40 bg-slate-100 relative overflow-hidden">
                      {tech.imageUrl ? (
                        <img
                          src={tech.imageUrl}
                          alt={tech.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                          <Cpu size={48} />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider shadow-sm">
                          {tech.tech_category_id}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-1 group-hover:text-apctt-blue transition-colors">
                        {tech.name}
                      </h3>
                      <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed mb-4">
                        {tech.description}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <span className={`text-[10px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded ${tech.ip_status === 'patented' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                          }`}>
                          {tech.ip_status}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-apctt-blue group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full bg-white border border-dashed border-slate-300 rounded-[2.5rem] p-16 text-center">
                  <div className="inline-flex p-4 bg-slate-50 rounded-full mb-4">
                    <Cpu className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-400 font-medium">No technologies registered by this organization yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StakeholderDetail;
