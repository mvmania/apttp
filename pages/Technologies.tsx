
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { Stakeholder, Technology } from '../types';
import { useConfig } from '../context/ConfigContext';
import { Search, Filter, Tag, Building2, Video, Image as ImageIcon, Gauge, Info, X, ChevronRight } from 'lucide-react';
import { TRL_DEFINITIONS, getTrlColor } from '../constants';
import { SidebarFilter, FilterSection, FilterChip, FilterDropdown } from '../components/SidebarFilter';

const Technologies: React.FC = () => {
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [trlFilters, setTrlFilters] = useState<number[]>([]);
  const [disclosureFilters, setDisclosureFilters] = useState<string[]>([]);
  const [ipStatusFilters, setIpStatusFilters] = useState<string[]>([]);
  const [licensingFilters, setLicensingFilters] = useState<string[]>([]);
  const [geoFilters, setGeoFilters] = useState<string[]>([]);
  const [showTrlGuide, setShowTrlGuide] = useState(false);
  const config = useConfig();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [techs, stakes] = await Promise.all([
          apiService.getTechnologies(),
          apiService.getStakeholders()
        ]);
        setTechnologies(techs);
        setStakeholders(stakes);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleReset = () => {
    setCategoryFilters([]);
    setTrlFilters([]);
    setDisclosureFilters([]);
    setIpStatusFilters([]);
    setLicensingFilters([]);
    setGeoFilters([]);
    setSearchTerm('');
  };

  const toggleFilter = (current: string[], value: string, setter: (val: string[]) => void) => {
    if (current.includes(value)) {
      setter(current.filter(v => v !== value));
    } else {
      setter([...current, value]);
    }
  };

  const toggleTrlFilter = (lvl: number) => {
    if (trlFilters.includes(lvl)) {
      setTrlFilters(trlFilters.filter(l => l !== lvl));
    } else {
      setTrlFilters([...trlFilters, lvl]);
    }
  };

  const activeCount = categoryFilters.length + trlFilters.length + disclosureFilters.length + ipStatusFilters.length + licensingFilters.length + geoFilters.length;

  const filteredTechs = technologies.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Case-insensitive category match
    const matchesCat = categoryFilters.length === 0 ||
      categoryFilters.some(filter => filter.toLowerCase() === t.tech_category_id?.toLowerCase());

    const matchesTrl = trlFilters.length === 0 || (t.trl_level && trlFilters.some(lvl => t.trl_level && t.trl_level >= lvl));

    // Case-insensitive matches for dropdowns
    const matchesDisclosure = disclosureFilters.length === 0 ||
      disclosureFilters.some(f => f.toLowerCase() === t.disclosure_level?.toLowerCase());

    const matchesIpStatus = ipStatusFilters.length === 0 ||
      ipStatusFilters.some(f => f.toLowerCase() === t.ip_status?.toLowerCase());

    const matchesLicensing = licensingFilters.length === 0 ||
      licensingFilters.some(f => f.toLowerCase() === t.licensing_availability?.toLowerCase());

    const matchesGeo = geoFilters.length === 0 ||
      geoFilters.some(f => f.toLowerCase() === t.geographic_restrictions?.toLowerCase());

    return matchesSearch && matchesCat && matchesTrl && matchesDisclosure && matchesIpStatus && matchesLicensing && matchesGeo;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-apctt-blue"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* TRL Guide Modal */}
      {showTrlGuide && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Gauge className="text-blue-400" /> TRL Level Guide
                </h2>
                <p className="text-slate-400 text-sm mt-1">Technology Readiness Levels (Standard EU/NASA)</p>
              </div>
              <button onClick={() => setShowTrlGuide(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X />
              </button>
            </div>
            <div className="p-8 max-h-[60vh] overflow-y-auto">
              <div className="space-y-6">
                {TRL_DEFINITIONS.map((trl) => (
                  <div key={trl.level} className="flex gap-6 items-start group">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black flex-shrink-0 transition-transform group-hover:scale-110 ${getTrlColor(trl.level)}`}>
                      {trl.level}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{trl.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">{trl.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t flex justify-center">
              <button
                onClick={() => setShowTrlGuide(false)}
                className="bg-slate-900 text-white font-bold px-8 py-3 rounded-2xl hover:bg-slate-800 transition-all"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-2">Technology Directory</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-500 font-medium">Discover regional innovations ready for transfer.</p>
            <button
              onClick={() => setShowTrlGuide(true)}
              className="text-apctt-blue text-xs font-bold flex items-center gap-1 hover:underline"
            >
              <Info size={14} /> What is TRL?
            </button>
          </div>
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
                placeholder="Find innovations..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-apctt-blue/20 focus:bg-white transition-all text-sm font-bold placeholder:font-medium placeholder:text-slate-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </FilterSection>

          <FilterSection label="Primary Categories">
            <div className="flex flex-wrap gap-2">
              <FilterChip
                label="All"
                selected={categoryFilters.length === 0}
                onClick={() => setCategoryFilters([])}
              />
              {config.techCategories.map(cat => (
                <FilterChip
                  key={cat}
                  label={cat}
                  selected={categoryFilters.includes(cat)}
                  onClick={() => toggleFilter(categoryFilters, cat, setCategoryFilters)}
                />
              ))}
            </div>
          </FilterSection>

          <FilterSection label="Rediness (TRL+)" badge="Live">
            <div className="flex flex-wrap gap-2">
              <FilterChip
                label="All"
                selected={trlFilters.length === 0}
                onClick={() => setTrlFilters([])}
              />
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(lvl => (
                <FilterChip
                  key={lvl}
                  label={`TRL ${lvl}`}
                  selected={trlFilters.includes(lvl)}
                  onClick={() => toggleTrlFilter(lvl)}
                />
              ))}
            </div>
          </FilterSection>

          <div className="space-y-6 pt-2">
            <FilterDropdown
              label="Disclosure Level"
              options={config.disclosureLevels}
              selected={disclosureFilters}
              onChange={(val) => toggleFilter(disclosureFilters, val, setDisclosureFilters)}
              placeholder="Select visibility..."
            />

            <FilterDropdown
              label="IP Status"
              options={config.ipStatusTypes}
              selected={ipStatusFilters}
              onChange={(val) => toggleFilter(ipStatusFilters, val, setIpStatusFilters)}
              placeholder="Select IP status..."
            />

            <FilterDropdown
              label="Licensing"
              options={config.licensingAvailabilities}
              selected={licensingFilters}
              onChange={(val) => toggleFilter(licensingFilters, val, setLicensingFilters)}
              placeholder="Select availability..."
            />

            <FilterDropdown
              label="Regionality"
              options={config.geographicRestrictions}
              selected={geoFilters}
              onChange={(val) => toggleFilter(geoFilters, val, setGeoFilters)}
              placeholder="Select restrictions..."
            />
          </div>
        </SidebarFilter>

        {/* Content Area */}
        <div className="flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredTechs.map(tech => {
              const provider = stakeholders.find(s => s.stakeholder_id === tech.stakeholder_id);
              return (
                <div key={tech.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group">
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    {tech.imageUrl ? (
                      <img
                        src={tech.imageUrl}
                        alt={tech.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ImageIcon className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="bg-apctt-dark text-white text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-lg">
                        {tech.tech_category_id}
                      </span>
                    </div>
                  </div>

                  <div className="p-8 flex-grow flex flex-col">
                    <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-apctt-blue transition-colors leading-tight tracking-tight uppercase">{tech.name}</h3>
                    <p className="text-slate-500 text-sm mb-6 line-clamp-3 leading-relaxed font-medium">
                      {tech.description}
                    </p>

                    {tech.trl_level && (
                      <div className="mb-6 bg-slate-50 p-5 rounded-2xl border border-slate-100 relative group/trl">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Scale of Readiness</span>
                          </div>
                          <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg text-white ${getTrlColor(tech.trl_level)} shadow-sm`}>
                            LEVEL {tech.trl_level}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden mb-2 shadow-inner">
                          <div
                            className={`h-full ${getTrlColor(tech.trl_level)} transition-all duration-1000 shadow-lg`}
                            style={{ width: `${(Number(tech.trl_level) / 9) * 100}%` }}
                          ></div>
                        </div>
                        {/* Tooltip */}
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-4 py-2 rounded-xl opacity-0 group-hover/trl:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-20 shadow-2xl">
                          {TRL_DEFINITIONS.find(t => t.level === Number(tech.trl_level))?.title || 'Description unavailable'}
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45"></div>
                        </div>
                      </div>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-100">
                      <div className="flex items-center text-slate-400 text-[10px] font-black uppercase tracking-widest flex-grow mr-4">
                        <Building2 className="w-3.5 h-3.5 mr-2 text-slate-300 flex-shrink-0" />
                        {provider?.name}
                      </div>
                      <Link
                        to={`/technologies/${tech.id}`}
                        className="p-2 bg-slate-50 text-apctt-blue hover:bg-apctt-blue hover:text-white rounded-xl transition-all duration-300"
                      >
                        <ChevronRight size={18} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Technologies;
