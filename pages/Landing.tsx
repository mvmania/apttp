
import React from 'react';
import { Link } from 'react-router-dom';
import { TECHNOLOGIES, STAKEHOLDERS } from '../mockData';
import { useOpportunities } from '../context/OpportunityContext';
import {
  ArrowRight,
  Cpu,
  Globe,
  Users,
  ShieldCheck,
  Zap,
  ChevronRight,
  Clock,
  Calendar,
  Building2,
  Sparkles,
  TrendingUp,
  Image as ImageIcon
} from 'lucide-react';

import { useSiteContent } from '../context/SiteContentContext';

const Landing: React.FC = () => {
  const { opportunities } = useOpportunities();
  const { content } = useSiteContent();

  // Get latest 3 items for each section
  const recentTechs = TECHNOLOGIES.slice(0, 3);
  const recentUpdates = opportunities.slice(0, 3);
  const featuredStakeholders = STAKEHOLDERS.slice(0, 4);

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 pt-24 pb-32 text-white">
        {/* Background Gradients - UN Blue theme */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-apctt-blue/20 blur-[120px] rounded-full"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-apctt-blue/10 blur-[120px] rounded-full"></div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-apctt-blue/10 border border-apctt-blue/20 rounded-full text-apctt-blue text-xs font-black uppercase tracking-widest mb-8 uppercase tracking-[0.2em]">
              <Sparkles size={14} /> Regional Innovation Gateway
            </div>
            <h1
              className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-[1.05]"
              dangerouslySetInnerHTML={{ __html: content['home_hero_title'] || 'Accelerating <span class="text-apctt-blue italic">Innovation</span> across Asia-Pacific.' }}
            />
            <p
              className="text-xl text-slate-400 mb-12 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: content['home_hero_subtitle'] || 'The official APCTT platform connecting technology providers, seekers, and investors. Bridging the gap between groundbreaking innovation and regional development.' }}
            />
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/technologies"
                className="bg-apctt-blue hover:bg-apctt-dark text-white font-black px-8 py-5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-2xl shadow-apctt-blue/30 active:scale-95 text-lg"
              >
                Explore Technologies <ArrowRight size={20} />
              </Link>
              <Link
                to="/register"
                className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-5 rounded-2xl border border-white/10 flex items-center justify-center transition-all backdrop-blur-md"
              >
                Join the Network
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Strategic Partnership Banner */}
      <section className="bg-slate-900 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/5"></div>
        <div className="max-w-7xl mx-auto px-4 py-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-12 text-center md:text-left">
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">
              Jointly Developed By
            </span>
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
              <div className="flex items-center gap-3 group cursor-default">
                <img src="/apctt_escap_logo.png" alt="APCTT ESCAP Logo" className="h-12 w-auto object-contain drop-shadow-sm bg-white rounded-lg p-1" />
              </div>
              <div className="hidden md:block w-px h-8 bg-white/10"></div>
              <div className="flex items-center gap-3 group cursor-default">
                <img src="/rh_istc_logo.webp" alt="RH ISTC Logo" className="w-10 h-10 object-contain drop-shadow-lg bg-white/90 rounded-lg p-0.5 shadow-sm" />
                <div>
                  <div className="text-white font-bold leading-none tracking-tight mb-1">RH ISTC</div>
                  <div className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">Russian House of Int. Sci & Tech Coop</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-b border-slate-100 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: content['landing_stats_innovations_label'] || 'Innovations', value: content['landing_stats_innovations_value'] || '1,200+', icon: Cpu, color: 'text-apctt-blue' },
              { label: content['landing_stats_countries_label'] || 'Countries', value: content['landing_stats_countries_value'] || '45+', icon: Globe, color: 'text-apctt-blue' },
              { label: content['landing_stats_partners_label'] || 'Partners', value: content['landing_stats_partners_value'] || '800+', icon: Users, color: 'text-emerald-600' },
              { label: content['landing_stats_transfers_label'] || 'Transfers', value: content['landing_stats_transfers_value'] || '150+', icon: Zap, color: 'text-amber-600' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className={`inline-flex p-3 rounded-2xl bg-white shadow-sm mb-4 ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <div className="text-3xl font-black text-slate-900 mb-1">{stat.value}</div>
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Technologies */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2
                className="text-3xl font-black text-slate-900 mb-2"
                dangerouslySetInnerHTML={{ __html: content['landing_recent_tech_title'] || 'Recently Added Technologies' }}
              />
              <p
                className="text-slate-500"
                dangerouslySetInnerHTML={{ __html: content['landing_recent_tech_subtitle'] || 'The latest technical assets ready for licensing and collaboration.' }}
              />
            </div>
            <Link to="/technologies" className="text-blue-600 font-bold flex items-center gap-1 hover:underline">
              View Directory <ChevronRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {recentTechs.map(tech => (
              <Link
                key={tech.id}
                to={`/technologies/${tech.id}`}
                className="group bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-2xl hover:border-blue-400 transition-all duration-500 flex flex-col"
              >
                <div className="h-48 overflow-hidden bg-slate-100 relative">
                  {tech.imageUrl ? (
                    <img src={tech.imageUrl} alt={tech.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={48} /></div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur-md text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider text-slate-900 shadow-sm">
                      {tech.tech_category_id}
                    </span>
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">{tech.name}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-2">{tech.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TRL Level {tech.trl_level}</span>
                    </div>
                    <ArrowRight size={16} className="text-slate-300 group-hover:translate-x-1 group-hover:text-blue-600 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Updates & Opportunities Section */}
      <section className="py-24 bg-slate-50 border-y border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-4">
              <div className="inline-flex p-3 bg-blue-600 text-white rounded-2xl mb-6 shadow-xl shadow-blue-100">
                <Calendar size={24} />
              </div>
              <h2
                className="text-4xl font-black text-slate-900 mb-6 leading-tight"
                dangerouslySetInnerHTML={{ __html: content['landing_updates_title'] || 'Latest Network <br /> Updates' }}
              />
              <p
                className="text-slate-500 text-lg leading-relaxed mb-8"
                dangerouslySetInnerHTML={{ __html: content['landing_updates_subtitle'] || 'Stay informed about regional forums, site tours, and technical support programs organized by our members.' }}
              />
              <Link to="/opportunities" className="bg-slate-900 text-white font-bold px-8 py-4 rounded-2xl inline-flex items-center gap-2 hover:bg-slate-800 transition-all">
                View All Updates <ArrowRight size={18} />
              </Link>
            </div>

            <div className="lg:col-span-8">
              <div className="space-y-6">
                {recentUpdates.length > 0 ? recentUpdates.map(opp => {
                  const dateParts = opp.date.split('-');
                  return (
                    <Link
                      key={opp.id}
                      to={`/opportunities/${opp.id}`}
                      className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-6 group hover:border-blue-400 hover:shadow-xl transition-all"
                    >
                      <div className="flex-shrink-0 w-16 h-16 bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
                        <span className="text-[10px] font-black uppercase leading-none">{dateParts[1]}</span>
                        <span className="text-2xl font-black leading-none my-0.5">{dateParts[2]}</span>
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-1.5 py-0.5 rounded uppercase">{opp.type}</span>
                          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><Clock size={10} /> {opp.date}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors line-clamp-1">{opp.title}</h4>
                      </div>
                      <ChevronRight className="text-slate-200 group-hover:text-blue-600 transition-colors" />
                    </Link>
                  );
                }) : (
                  <div className="bg-white p-12 rounded-[2rem] border border-dashed border-slate-200 text-center text-slate-400">
                    No recent updates found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Stakeholders */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2
            className="text-3xl font-black text-slate-900 mb-2"
            dangerouslySetInnerHTML={{ __html: content['landing_featured_stakeholders_title'] || 'Our Verified Network' }}
          />
          <p
            className="text-slate-500 mb-16"
            dangerouslySetInnerHTML={{ __html: content['landing_featured_stakeholders_subtitle'] || 'Leading organizations driving regional technology transfer.' }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredStakeholders.map(s => (
              <Link
                key={s.stakeholder_id}
                to={`/stakeholders/${s.stakeholder_id}`}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-500 transition-all group"
              >
                <div className="w-20 h-20 bg-slate-50 rounded-[1.8rem] flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all text-slate-400">
                  <span className="text-3xl font-black group-hover:text-white">{s.name.charAt(0)}</span>
                </div>
                <h3 className="font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{s.name}</h3>
                <div className="flex items-center justify-center gap-1.5 mb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {s.is_verified && <ShieldCheck size={14} className="text-blue-500" />}
                  {s.category}
                </div>
                <div className="text-blue-600 text-xs font-bold flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  View Organization <ArrowRight size={14} />
                </div>
              </Link>
            ))}
          </div>

          <Link to="/stakeholders" className="mt-16 bg-slate-100 text-slate-700 font-bold px-8 py-4 rounded-2xl inline-flex items-center gap-2 hover:bg-slate-200 transition-all">
            Browse Full Directory <Users size={18} />
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden shadow-2xl shadow-blue-200">
            <div className="absolute top-0 right-0 p-20 opacity-10">
              <Sparkles size={300} />
            </div>
            <div className="relative z-10 max-w-2xl">
              <h2
                className="text-4xl md:text-5xl font-black mb-8 leading-tight"
                dangerouslySetInnerHTML={{ __html: content['landing_cta_title'] || 'Ready to expand your technical reach?' }}
              />
              <p
                className="text-xl text-blue-100 mb-12 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: content['landing_cta_subtitle'] || 'Join hundreds of organizations across the Asia-Pacific. Register your technology or post your technical needs today.' }}
              />
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register" className="bg-white text-blue-600 font-bold px-10 py-5 rounded-2xl text-center hover:bg-blue-50 transition-all shadow-xl">
                  Create Partner Account
                </Link>
                <Link to="/about" className="bg-white/10 border border-white/20 text-white font-bold px-10 py-5 rounded-2xl text-center hover:bg-white/20 transition-all backdrop-blur-md">
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
