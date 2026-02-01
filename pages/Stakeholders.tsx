
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { useConfig } from '../context/ConfigContext';
import { StakeholderCategory, StakeholderRole, Stakeholder } from '../types';
import { BadgeCheck, ExternalLink, Mail, MapPin, Search, ChevronRight, ShieldCheck, Tag, DollarSign, Cpu, Lightbulb, Building2 } from 'lucide-react';
import { SidebarFilter, FilterSection, FilterChip, FilterDropdown } from '../components/SidebarFilter';
import { Pagination } from '../components/Pagination';

const Stakeholders: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [roleFilters, setRoleFilters] = useState<string[]>([]);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const config = useConfig();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await apiService.getStakeholders();
        setStakeholders(data);
      } catch (error) {
        console.error('Error fetching stakeholders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const categories = ['All', ...config.stakeholderCategories];
  const roles: (StakeholderRole | 'All')[] = ['All', 'Provider', 'Seeker', 'Investor'];

  const handleReset = () => {
    setCategoryFilters([]);
    setRoleFilters([]);
    setSearchTerm('');
  };

  const toggleFilter = (current: string[], value: string, setter: (val: string[]) => void) => {
    if (current.includes(value)) {
      setter(current.filter(v => v !== value));
    } else {
      setter([...current, value]);
    }
  };

  const activeCount = categoryFilters.length + roleFilters.length;

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Adjust based on grid layout

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilters, roleFilters]);

  const filtered = stakeholders.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilters.length === 0 || categoryFilters.includes(s.category);
    const matchesRole = roleFilters.length === 0 || roleFilters.some(role => s.roles?.includes(role as StakeholderRole));
    return matchesSearch && matchesCat && matchesRole;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentStakeholders = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-apctt-blue"></div>
      </div>
    );
  }

  const getRoleStyles = (role: StakeholderRole) => {
    switch (role) {
      case 'Provider': return 'bg-apctt-dark text-white border-apctt-dark shadow-sm';
      case 'Seeker': return 'bg-apctt-blue text-white border-apctt-blue shadow-sm';
      case 'Investor': return 'bg-emerald-600 text-white border-emerald-600 shadow-sm';
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-2">Network Directory</h1>
          <p className="text-slate-500 font-medium">Connecting organizations to fuel the innovation ecosystem across the Asia-Pacific.</p>
        </div>
        <div className="text-sm font-bold text-slate-500 bg-slate-100 px-4 py-2 rounded-xl">
          Showing {Math.min(filtered.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filtered.length, currentPage * itemsPerPage)} of {filtered.length}
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
                placeholder="Search organizations..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-apctt-blue/20 focus:bg-white transition-all text-sm font-bold placeholder:font-medium placeholder:text-slate-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </FilterSection>

          <FilterSection label="Primary Roles">
            <div className="flex flex-wrap gap-2">
              <FilterChip
                label="All"
                selected={roleFilters.length === 0}
                onClick={() => setRoleFilters([])}
              />
              {['Provider', 'Seeker', 'Investor'].map(role => (
                <FilterChip
                  key={role}
                  label={role}
                  selected={roleFilters.includes(role)}
                  onClick={() => toggleFilter(roleFilters, role, setRoleFilters)}
                />
              ))}
            </div>
          </FilterSection>

          <div className="pt-2">
            <FilterDropdown
              label="Stakeholder Categories"
              options={config.stakeholderCategories}
              selected={categoryFilters}
              onChange={(val) => toggleFilter(categoryFilters, val, setCategoryFilters)}
              placeholder="Select category..."
            />
          </div>
        </SidebarFilter>

        {/* Content Area */}
        <div className="flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {currentStakeholders.map(s => (
              <div key={s.stakeholder_id} className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex flex-col gap-8 hover:shadow-xl transition-all duration-300 group overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-[1.5rem] flex items-center justify-center flex-shrink-0 group-hover:bg-apctt-blue group-hover:border-apctt-blue group-hover:rotate-6 transition-all duration-500 shadow-sm">
                    <span className="text-3xl font-black text-apctt-blue group-hover:text-white transition-colors duration-500">{s.name.charAt(0)}</span>
                  </div>
                  {s.is_verified && (
                    <div className="bg-apctt-blue/10 text-apctt-blue p-2 rounded-xl shadow-inner">
                      <ShieldCheck className="w-6 h-6 animate-pulse" />
                    </div>
                  )}
                </div>

                <div className="flex-grow flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-apctt-blue transition-colors uppercase tracking-tight leading-tight">{s.name}</h3>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block">
                      {s.category}
                    </span>
                    <span className="text-slate-200">|</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {s.roles?.map(role => (
                        <span key={role} className={`px-2.5 py-1 border rounded-lg text-[8px] font-black uppercase tracking-widest ${getRoleStyles(role as StakeholderRole)}`}>
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="text-slate-500 text-sm mb-6 leading-relaxed line-clamp-3 font-medium">
                    {s.description}
                  </p>

                  <div className="flex items-center text-slate-400 text-[10px] font-black uppercase tracking-widest mt-auto mb-8">
                    <MapPin className="w-3.5 h-3.5 mr-2 text-apctt-blue" />
                    {s.legal_address}
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                    <Link
                      to={`/stakeholders/${s.stakeholder_id}`}
                      className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] px-8 py-3 rounded-xl hover:bg-apctt-blue transition-all flex items-center shadow-lg active:scale-95 shadow-slate-900/10"
                    >
                      Explore <ChevronRight className="w-4 h-4 ml-2" />
                    </Link>
                    <a href={s.website} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-apctt-blue hover:bg-slate-50 rounded-xl transition-all">
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
};

export default Stakeholders;
