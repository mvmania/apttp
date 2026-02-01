
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { Technology, Stakeholder } from '../types';
import {
  ArrowLeft,
  Building2,
  Mail,
  Globe,
  BadgeCheck,
  Share2,
  MessageSquare,
  ShieldCheck,
  FileText,
  Lock,
  Map,
  Handshake,
  ExternalLink,
  AlertTriangle,
  Loader2,
  Users,
  Info,
  CheckCircle2,
  Globe2,
  Play,
  Phone
} from 'lucide-react';
import { TRL_DEFINITIONS, getTrlColor } from '../constants';

const TechnologyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const { createOrGetChat } = useChat();

  const [tech, setTech] = useState<Technology | null>(null);
  const [provider, setProvider] = useState<Stakeholder | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);
  const [activeMedia, setActiveMedia] = useState<'image' | 'video'>('image');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [techs, stakes] = await Promise.all([
          apiService.getTechnologies(),
          apiService.getStakeholders()
        ]);
        const foundTech = techs.find((t: Technology) => t.id === id);
        if (foundTech) {
          setTech(foundTech);
          const foundProvider = stakes.find((s: Stakeholder) => s.stakeholder_id === foundTech.stakeholder_id);
          setProvider(foundProvider || null);
        }
      } catch (error) {
        console.error('Error fetching technology detail:', error);
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

  if (!tech) {
    return (
      <div className="max-w-7xl mx-auto py-20 px-4 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Technology not found</h2>
        <button
          onClick={() => navigate('/technologies')}
          className="text-apctt-blue font-semibold hover:underline flex items-center justify-center mx-auto"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory
        </button>
      </div>
    );
  }

  const handleStartDiscussion = () => {
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
      if (provider?.phone && provider?.whatsapp_enabled) {
        const message = encodeURIComponent(`Hello, I'm interested in the "${tech.name}" technology (ID: ${tech.id}) listed on APCTT Connect. Can we discuss further?`);
        const cleanPhone = provider.phone.replace(/[^0-9]/g, '');
        window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
        setIsProcessing(false);
      } else {
        // Default to secure internal chat if WhatsApp is disabled or number is missing
        const chatId = createOrGetChat(
          tech.id,
          tech.name,
          provider!.stakeholder_id,
          user.id,
          'tech'
        );
        setIsProcessing(false);
        navigate(`/chat/${chatId}`);
      }
    }, 1200);
  };

  const getIPStatusColor = (status: string) => {
    switch (status) {
      case 'patented': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'filed': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'know-how': return 'bg-apctt-light text-apctt-dark border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPatentSearchUrl = (patentNum: string) => {
    return `https://patentscope.wipo.int/search/en/result.jsf?query=${encodeURIComponent(patentNum.trim())}`;
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
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

      {/* Breadcrumbs & Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Link to="/technologies" className="inline-flex items-center text-sm text-slate-500 hover:text-apctt-blue mb-6 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Technology Directory
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-apctt-blue text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  {tech.tech_category_id}
                </span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-500 text-xs font-medium uppercase tracking-tight">
                  {tech.tech_sub_category_id || 'General Tech'}
                </span>
                <div className={`ml-2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide ${getIPStatusColor(tech.ip_status)}`}>
                  <ShieldCheck className="w-3 h-3" />
                  {tech.ip_status || 'Unspecified'}
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">{tech.name}</h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleShare}
                className="p-3 border border-slate-200 rounded-2xl hover:bg-slate-50 text-slate-600 transition-all shadow-sm"
                title="Share this technology"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={handleStartDiscussion}
                className="bg-apctt-blue hover:bg-apctt-dark text-white font-bold px-8 py-3 rounded-2xl shadow-xl shadow-apctt-light flex items-center transition-all group"
              >
                <MessageSquare className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" /> Inquiry
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">

            {/* Media Gallery Section */}
            {(tech.imageUrl || tech.videoUrl) && (
              <section className="bg-white p-4 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="relative aspect-video bg-slate-100 rounded-[2rem] overflow-hidden group">
                  {activeMedia === 'image' ? (
                    <img
                      src={tech.imageUrl || 'https://via.placeholder.com/1200x675'}
                      alt={tech.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <iframe
                      src={tech.videoUrl}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  )}

                  {/* Media Toggle Controls */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center bg-black/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/20">
                    {tech.imageUrl && (
                      <button
                        onClick={() => setActiveMedia('image')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeMedia === 'image' ? 'bg-white text-slate-900 shadow-lg' : 'text-white hover:bg-white/10'}`}
                      >
                        Photo
                      </button>
                    )}
                    {tech.videoUrl && (
                      <button
                        onClick={() => setActiveMedia('video')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeMedia === 'video' ? 'bg-white text-slate-900 shadow-lg' : 'text-white hover:bg-white/10'}`}
                      >
                        <Play className="w-3 h-3 fill-current" /> Video
                      </button>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* 1. Technology Overview */}
            <section className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <Info className="w-32 h-32" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center border-b pb-4">
                <Info className="w-5 h-5 mr-2 text-apctt-blue" /> Technology Overview
              </h2>
              <div className="prose prose-slate max-w-none">
                <div className="text-slate-600 leading-relaxed text-lg">
                  {(() => {
                    const desc = tech.description || '';
                    // Check if it follows our new structured format
                    if (desc.includes('VALUE PROPOSITION') || desc.includes('APPLICATIONS') || desc.includes('ADVANTAGES')) {
                      const sections = desc.split(/(VALUE PROPOSITION|APPLICATIONS|ADVANTAGES)/g);
                      return sections.map((part, index) => {
                        if (['VALUE PROPOSITION', 'APPLICATIONS', 'ADVANTAGES'].includes(part.trim())) {
                          return (
                            <h3 key={index} className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-8 mb-3 border-b border-slate-100 pb-1">
                              {part}
                            </h3>
                          );
                        } else if (part.trim()) {
                          return <p key={index} className="mb-4 whitespace-pre-wrap">{part.trim()}</p>;
                        }
                        return null;
                      });
                    }
                    // Fallback for standard descriptions
                    return <div className="whitespace-pre-wrap">{desc}</div>;
                  })()}
                </div>
              </div>

              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group/trl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1 tracking-widest">Readiness Level</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${getTrlColor(tech.trl_level || 0)} transition-transform group-hover/trl:scale-110`}>
                      LVL {tech.trl_level || 'N/A'}
                    </span>
                  </div>
                  {/* Tooltip */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-3 py-2 rounded-xl opacity-0 group-hover/trl:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-20 shadow-xl">
                    {TRL_DEFINITIONS.find(t => t.level === Number(tech.trl_level))?.title || 'Description unavailable'}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1 tracking-widest">Stage</span>
                  <span className="text-slate-900 font-bold text-lg">Prototype</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1 tracking-widest">Verified</span>
                  <span className="text-emerald-600 font-bold text-lg flex items-center">Yes <CheckCircle2 className="w-4 h-4 ml-1" /></span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1 tracking-widest">Language</span>
                  <span className="text-slate-900 font-bold text-lg">English</span>
                </div>
              </div>
            </section>

            {/* 2. Intellectual Property & Rights */}
            <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-900 p-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <ShieldCheck className="w-6 h-6 mr-3 text-blue-400" /> Intellectual Property & Rights
                </h2>
                <div className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold text-blue-300 uppercase tracking-widest border border-white/10">
                  Legal Data
                </div>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-apctt-light rounded-2xl flex items-center justify-center flex-shrink-0 text-apctt-blue shadow-sm">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-widest mb-1">Patent Information</span>
                      <p className="font-bold text-slate-900 text-lg">{tech.patent_number || 'No Patent Listed'}</p>
                      {tech.patent_number && (
                        <a
                          href={getPatentSearchUrl(tech.patent_number)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs text-apctt-blue hover:text-apctt-dark font-semibold mt-2 group/patent"
                        >
                          View on WIPO Patentscope <ExternalLink className="w-3 h-3 ml-1 opacity-50 group-hover/patent:opacity-100 transition-opacity" />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center flex-shrink-0 text-indigo-600 shadow-sm">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-widest mb-1">IP Holder / Owner</span>
                      <p className="font-bold text-slate-900 text-lg leading-tight">
                        {tech.ip_owner || (provider ? provider.name : 'Organization Proprietary')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center flex-shrink-0 text-purple-600 shadow-sm">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-widest mb-1">Disclosure Level</span>
                      <p className="font-black text-apctt-blue text-lg uppercase tracking-tight">
                        {tech.disclosure_level || 'Non-Confidential'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">Information accessibility level</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0 text-emerald-600 shadow-sm">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-widest mb-1">IP Status</span>
                      <p className="font-bold text-slate-900 text-lg capitalize">{tech.ip_status || 'Filed'}</p>
                    </div>
                  </div>
                </div>

                {/* Additional Legal Info Row */}
                <div className="md:col-span-2 pt-10 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center flex-shrink-0 text-amber-600 shadow-sm">
                      <Handshake className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-widest mb-1">Licensing Availability</span>
                      <p className="font-bold text-slate-900 text-lg">{tech.licensing_availability || 'Inquire for Details'}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0 text-blue-600 shadow-sm">
                      <Map className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-widest mb-1">Geographic Restrictions</span>
                      <p className="font-bold text-slate-900 text-lg">{tech.geographic_restrictions || 'None'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar - Provider & CTA */}
          <div className="space-y-6">
            <section className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Provider Organization</h2>
              {provider ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-apctt-blue rounded-[1.25rem] flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-apctt-light">
                      {provider.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg leading-tight flex items-center gap-1">
                        {provider.name}
                        {provider.is_verified && <BadgeCheck className="w-5 h-5 text-apctt-light0" />}
                      </h3>
                      <span className="text-xs font-semibold text-apctt-blue bg-apctt-light px-2 py-0.5 rounded-full mt-1 inline-block">
                        {provider.category}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-slate-50">
                    <div className="flex items-start text-sm text-slate-600">
                      <Mail className="w-4 h-4 mr-3 text-slate-400 mt-0.5" />
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Email</span>
                        {provider.contact_email}
                      </div>
                    </div>
                    <div className="flex items-start text-sm text-slate-600">
                      <Globe2 className="w-4 h-4 mr-3 text-slate-400 mt-0.5" />
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Website</span>
                        <a href={provider.website} target="_blank" rel="noopener noreferrer" className="hover:text-apctt-blue transition-colors">
                          {provider.website.replace('https://', '')}
                        </a>
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/stakeholders/${provider.stakeholder_id}`}
                    className="block w-full text-center py-4 border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all mt-6"
                  >
                    Organization Profile
                  </Link>
                </div>
              ) : (
                <p className="text-slate-400 italic">Information unavailable.</p>
              )}
            </section>

            <div className="bg-indigo-600 p-8 rounded-[2rem] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Globe className="w-48 h-48" />
              </div>
              <h3 className="text-2xl font-bold mb-3 flex items-center gap-2 relative z-10">
                Start Discussion
                {isProcessing && <Loader2 className="w-5 h-5 animate-spin" />}
              </h3>
              <p className="text-indigo-100 text-sm mb-8 leading-relaxed relative z-10">
                Directly communicate with the technology owner for licensing, partnerships, or technical deep-dives.
              </p>

              <div className="space-y-4 relative z-10">
                <button
                  onClick={handleStartDiscussion}
                  disabled={isProcessing}
                  className="w-full bg-white text-indigo-700 font-extrabold py-4 rounded-2xl hover:bg-indigo-50 transition-all shadow-xl flex items-center justify-center disabled:opacity-50 active:scale-95"
                >
                  {isProcessing ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (provider?.phone && provider?.whatsapp_enabled) ? (
                    <><Phone className="w-5 h-5 mr-2" /> WhatsApp Inquiry</>
                  ) : (
                    <><Users className="w-5 h-5 mr-2" /> Start Discussion</>
                  )}
                </button>
              </div>

              {!isLoggedIn && (
                <p className="mt-6 text-[10px] text-center text-indigo-200 uppercase tracking-widest font-black bg-white/10 py-2 rounded-lg">
                  Authentication Required
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnologyDetail;
