
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { STAKEHOLDERS } from '../mockData';
import { useOpportunities } from '../context/OpportunityContext';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Building2, 
  Clock, 
  Share2, 
  Megaphone,
  ArrowUpRight,
  Info,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';

const OpportunityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { opportunities } = useOpportunities();

  const opportunity = opportunities.find(o => o.id === id);
  const stakeholder = STAKEHOLDERS.find(s => s.stakeholder_id === opportunity?.stakeholder_id);

  if (!opportunity) {
    return (
      <div className="max-w-7xl mx-auto py-20 px-4 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Update not found</h2>
        <button 
          onClick={() => navigate('/opportunities')}
          className="text-blue-600 font-semibold hover:underline flex items-center justify-center mx-auto"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Updates
        </button>
      </div>
    );
  }

  const dateParts = opportunity.date.split('-');

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link to="/opportunities" className="inline-flex items-center text-sm text-slate-500 hover:text-blue-600 mb-8 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to All Updates
          </Link>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                opportunity.type === 'Event' ? 'bg-purple-100 text-purple-700' : 
                opportunity.type === 'Tour' ? 'bg-amber-100 text-amber-700' :
                opportunity.type === 'Support' ? 'bg-emerald-100 text-emerald-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {opportunity.type}
              </span>
              <div className="flex items-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                <Clock className="w-3 h-3 mr-1" />
                Posted on {opportunity.date}
              </div>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {opportunity.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-10">
        <div className="space-y-10">
          
          {/* Header Image Hero */}
          <div className="relative aspect-video bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden group">
            {opportunity.imageUrl ? (
              <img 
                src={opportunity.imageUrl} 
                alt={opportunity.title} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-100">
                <ImageIcon size={120} />
              </div>
            )}
            <div className="absolute top-8 left-8">
               <div className="bg-white/90 backdrop-blur-md px-6 py-4 rounded-3xl shadow-xl flex flex-col items-center">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{dateParts[1]}</span>
                  <span className="text-4xl font-black text-slate-900">{dateParts[2]}</span>
                  <span className="text-xs font-bold text-slate-500">{dateParts[0]}</span>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-10">
              <section className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b pb-4">
                  <Info className="w-5 h-5 text-blue-600" /> Details & Information
                </h2>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-600 text-lg leading-relaxed whitespace-pre-wrap">
                    {opportunity.description}
                  </p>
                </div>

                <div className="mt-10 p-6 bg-blue-50 rounded-2xl border border-blue-100">
                  <h3 className="text-blue-900 font-bold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> How to participate
                  </h3>
                  <p className="text-blue-800 text-sm">
                    Please reach out to the organizing stakeholder via the platform or visit their official website for registration links and further technical documentation.
                  </p>
                </div>
              </section>
            </div>

            {/* Sidebar Stakeholder Info */}
            <div className="space-y-6">
              <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm sticky top-24">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Host Organization</h3>
                {stakeholder ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-100">
                        {stakeholder.name.charAt(0)}
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-bold text-slate-900 leading-tight">{stakeholder.name}</h4>
                        <span className="text-[10px] text-blue-600 font-bold uppercase">{stakeholder.category}</span>
                      </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-slate-50">
                       <div className="flex items-start gap-3 text-sm text-slate-500">
                          <MapPin size={16} className="mt-0.5 text-slate-300" />
                          <span>{stakeholder.legal_address}</span>
                       </div>
                    </div>

                    <Link 
                      to={`/stakeholders/${stakeholder.stakeholder_id}`}
                      className="block w-full text-center py-4 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                    >
                      View Organization Profile
                    </Link>
                    
                    <a 
                      href={stakeholder.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center py-4 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                    >
                      Official Website <ExternalLink size={12} className="inline ml-1" />
                    </a>
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-sm">Organization data unavailable.</p>
                )}
              </section>

              <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-xl">
                 <h4 className="text-xl font-bold mb-3">Share this Update</h4>
                 <p className="text-purple-100 text-xs mb-6 leading-relaxed">Let your partners and colleagues know about this regional opportunity.</p>
                 <button className="w-full bg-white/20 backdrop-blur-md hover:bg-white/30 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all">
                    <Share2 size={16} /> Copy URL
                 </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpportunityDetail;
