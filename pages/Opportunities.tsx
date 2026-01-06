
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { Calendar, Bell, ArrowUpRight, Megaphone, Clock, Image as ImageIcon, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOpportunities } from '../context/OpportunityContext';
import { SidebarFilter, FilterSection, FilterChip } from '../components/SidebarFilter';

const Opportunities: React.FC = () => {
  const { isLoggedIn, user } = useAuth();
  const { opportunities, loading } = useOpportunities();
  const [stakeholders, setStakeholders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilters, setTypeFilters] = useState<string[]>([]);

  useEffect(() => {
    apiService.getStakeholders().then(setStakeholders).catch(console.error);
  }, []);

  const types = ['All', 'Event', 'Tour', 'Support', 'Service'];

  const handleReset = () => {
    setTypeFilters([]);
    setSearchTerm('');
  };

  const toggleFilter = (type: string) => {
    if (typeFilters.includes(type)) {
      setTypeFilters(typeFilters.filter(t => t !== type));
    } else {
      setTypeFilters([...typeFilters, type]);
    }
  };

  const activeCount = typeFilters.length + (searchTerm !== '' ? 1 : 0);

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilters.length === 0 || typeFilters.includes(opp.type);
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-apctt-blue"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none mb-2">Updates & Opportunities</h1>
          <p className="text-slate-500 font-medium tracking-tight">Latest events, tours, services, and support programs from the network.</p>
        </div>
        <div className="hidden md:flex w-16 h-16 bg-slate-50 border border-slate-100 rounded-[1.5rem] items-center justify-center text-apctt-blue shadow-inner">
          <Bell className="w-8 h-8 animate-bounce" />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar */}
        <SidebarFilter onReset={handleReset} activeCount={activeCount}>
          <FilterSection label="Search">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Find updates..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-apctt-blue/20 focus:bg-white transition-all text-sm font-bold placeholder:font-medium placeholder:text-slate-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </FilterSection>

          <FilterSection label="Announcement Type" badge="Hot">
            <div className="flex flex-wrap gap-2">
              <FilterChip
                label="All"
                selected={typeFilters.length === 0}
                onClick={() => setTypeFilters([])}
              />
              {['Event', 'Tour', 'Support', 'Service'].map(type => (
                <FilterChip
                  key={type}
                  label={type}
                  selected={typeFilters.includes(type)}
                  onClick={() => toggleFilter(type)}
                />
              ))}
            </div>
          </FilterSection>
        </SidebarFilter>

        {/* Content Area */}
        <div className="flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredOpportunities.map(opp => {
              const provider = stakeholders.find(s => s.stakeholder_id === opp.stakeholder_id);
              return (
                <Link
                  key={opp.id}
                  to={`/opportunities/${opp.id}`}
                  className="group bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-apctt-blue/30 transition-all duration-300 flex flex-col"
                >
                  <div className="h-48 overflow-hidden bg-slate-100 relative">
                    {opp.imageUrl ? (
                      <img
                        src={opp.imageUrl}
                        alt={opp.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ImageIcon className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-white text-slate-900 shadow-xl border border-slate-100 ${opp.type === 'Event' ? 'border-l-4 border-l-purple-500' :
                        opp.type === 'Tour' ? 'border-l-4 border-l-amber-500' :
                          opp.type === 'Support' ? 'border-l-4 border-l-emerald-500' :
                            'border-l-4 border-l-apctt-blue'
                        }`}>
                        {opp.type}
                      </span>
                    </div>
                  </div>

                  <div className="p-8 flex-grow flex flex-col">
                    <div className="flex items-center gap-2 mb-4 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">
                      <Clock className="w-3.5 h-3.5" />
                      {opp.date}
                    </div>
                    <h2 className="text-xl font-black text-slate-900 mb-3 group-hover:text-apctt-blue transition-colors leading-tight uppercase tracking-tight">
                      {opp.title}
                    </h2>
                    <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3 font-medium">
                      {opp.description}
                    </p>
                    <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex items-center text-[9px] font-black text-slate-400 uppercase tracking-widest flex-grow mr-4">
                        {provider?.name || 'Organization'}
                      </div>
                      <span className="w-10 h-10 flex items-center justify-center bg-slate-50 text-apctt-blue rounded-xl group-hover:bg-apctt-blue group-hover:text-white transition-all">
                        <ArrowUpRight className="w-5 h-5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}

            {filteredOpportunities.length === 0 && (
              <div className="col-span-full text-center py-20 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                <p className="text-slate-400 font-black uppercase tracking-widest">No matching updates found.</p>
              </div>
            )}
          </div>

          <div className="mt-16 bg-gradient-to-br from-slate-900 to-apctt-dark rounded-[3rem] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-apctt-blue/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            <div className="relative z-10">
              <h3 className="text-3xl font-black mb-3 uppercase tracking-tight">Have an Update to Share?</h3>
              <p className="text-slate-400 font-medium max-w-md">Let the APCTT network know about your upcoming events, new services, or site tours.</p>
            </div>
            <Link
              to={isLoggedIn && user?.stakeholder_id ? "/register-opportunity" : "/login"}
              className="relative z-10 bg-apctt-blue text-white font-black uppercase tracking-widest px-10 py-5 rounded-2xl shadow-xl hover:bg-white hover:text-apctt-dark transition-all whitespace-nowrap flex items-center gap-3 active:scale-95"
            >
              <Megaphone className="w-6 h-6" /> Post Update
            </Link>
          </div>
        </div>
      </div>
    </div >
  );
};

export default Opportunities;
