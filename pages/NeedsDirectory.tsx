
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { useConfig } from '../context/ConfigContext';
import { TechNeed, Stakeholder, UserAccount } from '../types';
import { Search, Filter, Lightbulb, Clock, DollarSign, ChevronRight, User as UserIcon } from 'lucide-react';
import { SidebarFilter, FilterSection, FilterChip, FilterDropdown } from '../components/SidebarFilter';
import { Pagination } from '../components/Pagination';

const NeedsDirectory: React.FC = () => {
  const [needs, setNeeds] = useState<TechNeed[]>([]);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilters, setIndustryFilters] = useState<string[]>([]);
  const [budgetFilters, setBudgetFilters] = useState<string[]>([]);
  const [deadlineFilters, setDeadlineFilters] = useState<string[]>([]);
  const config = useConfig();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [n, s, u] = await Promise.all([
          apiService.getTechNeeds(),
          apiService.getStakeholders(),
          apiService.getPublicUsers()
        ]);
        setNeeds(n);
        setStakeholders(s);
        setUsers(u);
      } catch (error) {
        console.error('Error fetching tech needs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleReset = () => {
    setIndustryFilters([]);
    setBudgetFilters([]);
    setDeadlineFilters([]);
    setSearchTerm('');
  };

  const toggleFilter = (current: string[], value: string, setter: (val: string[]) => void) => {
    if (current.includes(value)) {
      setter(current.filter(v => v !== value));
    } else {
      setter([...current, value]);
    }
  };

  const activeCount = industryFilters.length + budgetFilters.length + deadlineFilters.length + (searchTerm !== '' ? 1 : 0);

  const isWithinTimeframe = (deadlineStr: string | undefined, timeframe: string) => {
    if (!deadlineStr) return false;
    const deadline = new Date(deadlineStr);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (timeframe) {
      case 'Within 1 Month': return diffDays >= 0 && diffDays <= 30;
      case 'Within 3 Months': return diffDays >= 0 && diffDays <= 90;
      case 'Within 6 Months': return diffDays >= 0 && diffDays <= 180;
      case 'Over 6 Months': return diffDays > 180;
      default: return true;
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Fewer items per page as cards are wider

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, industryFilters, budgetFilters, deadlineFilters]);

  const filteredNeeds = needs.filter(n => {
    const matchesSearch = (n.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (n.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesIndustry = industryFilters.length === 0 || industryFilters.includes(n.industry);
    const matchesBudget = budgetFilters.length === 0 || (n.budget_range && budgetFilters.includes(n.budget_range));
    const matchesDeadline = deadlineFilters.length === 0 || deadlineFilters.some(tf => isWithinTimeframe(n.deadline, tf));

    return matchesSearch && matchesIndustry && matchesBudget && matchesDeadline;
  });

  const totalPages = Math.ceil(filteredNeeds.length / itemsPerPage);
  const currentNeeds = filteredNeeds.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-apctt-blue"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-2">Technology Needs</h1>
          <p className="text-slate-500 font-medium">Global challenges seeking technical solutions. Can you help?</p>
        </div>
        <div className="text-sm font-bold text-slate-500 bg-slate-100 px-4 py-2 rounded-xl">
          Showing {Math.min(filteredNeeds.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredNeeds.length, currentPage * itemsPerPage)} of {filteredNeeds.length}
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
                placeholder="Search requirements..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-apctt-blue/20 focus:bg-white transition-all text-sm font-bold placeholder:font-medium placeholder:text-slate-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </FilterSection>

          <FilterSection label="Industry Sectors">
            <div className="flex flex-wrap gap-2">
              <FilterChip
                label="All"
                selected={industryFilters.length === 0}
                onClick={() => setIndustryFilters([])}
              />
              {config.industries.map(ind => (
                <FilterChip
                  key={ind}
                  label={ind}
                  selected={industryFilters.includes(ind)}
                  onClick={() => toggleFilter(industryFilters, ind, setIndustryFilters)}
                />
              ))}
            </div>
          </FilterSection>

          <div className="space-y-6 pt-2">
            <FilterDropdown
              label="Budget Range"
              options={["Under $10k", "$10k - $50k", "$50k - $100k", "$100k - $500k", "Over $500k", "To be discussed"]}
              selected={budgetFilters}
              onChange={(val) => toggleFilter(budgetFilters, val, setBudgetFilters)}
              placeholder="Select budget..."
            />

            <FilterDropdown
              label="Target Deadline"
              options={["Within 1 Month", "Within 3 Months", "Within 6 Months", "Over 6 Months"]}
              selected={deadlineFilters}
              onChange={(val) => toggleFilter(deadlineFilters, val, setDeadlineFilters)}
              placeholder="Select timeframe..."
            />
          </div>
        </SidebarFilter>

        {/* Content Area */}
        <div className="flex-grow space-y-6">
          <div className="space-y-6">
            {currentNeeds.map(need => {
              const seeker = users.find(u => u.id === need.seeker_id) || stakeholders.find(s => s.stakeholder_id === need.seeker_id);
              const seekerName = seeker ? (seeker as any).name : 'Confidential Entity';

              return (
                <Link
                  key={need.id}
                  to={`/needs/${need.id}`}
                  className="block bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-apctt-blue/30 transition-all duration-300 group"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="bg-apctt-dark text-white text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-lg">
                          {need.industry}
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                          <Clock className="w-3.5 h-3.5" /> {new Date(need.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 group-hover:text-apctt-blue transition-colors mb-3 uppercase tracking-tight">
                        {need.title}
                      </h3>
                      <p className="text-slate-500 text-sm line-clamp-2 max-w-3xl font-medium leading-relaxed">
                        {need.description}
                      </p>
                    </div>

                    <div className="flex-shrink-0 w-12 h-12 bg-slate-50 flex items-center justify-center rounded-2xl group-hover:bg-apctt-blue group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-lg group-hover:-translate-x-2">
                      <ChevronRight className="w-6 h-6" />
                    </div>
                  </div>
                </Link>
              );
            })}
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

export default NeedsDirectory;
