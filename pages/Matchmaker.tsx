
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Loader2, BrainCircuit, ChevronRight, Target, AlertTriangle } from 'lucide-react';
import { getSmartMatches, MatchResult } from '../services/geminiService';
import { apiService } from '../services/apiService';
import { Technology, TechNeed, Stakeholder } from '../types';

const Matchmaker: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [needs, setNeeds] = useState<TechNeed[]>([]);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [t, n, s] = await Promise.all([
          apiService.getTechnologies(),
          apiService.getTechNeeds(),
          apiService.getStakeholders()
        ]);
        setTechnologies(t);
        setNeeds(n || []);
        setStakeholders(s);
      } catch (error) {
        console.error('Error fetching data for matchmaker:', error);
      }
    };
    fetchData();
  }, []);

  const handleMatch = async () => {
    if (!query.trim()) return;
    setIsMatching(true);
    setErrorMsg(null);
    try {
      const matches = await getSmartMatches(query, technologies, needs, stakeholders);
      setResults(matches);
      if (matches.length === 0) {
        setErrorMsg('No relevant matches found for your query. Try broadening your description.');
      }
    } catch (error: any) {
      console.error('Matchmaking error:', error);
      setErrorMsg(error.message || 'AI Matchmaking failed. Please ensure your API key is valid.');
    } finally {
      setIsMatching(false);
    }
  };

  const getMatchLink = (res: MatchResult) => {
    if (res.matchType === 'Technology') {
      return `/technologies/${res.id}`;
    } else if (res.matchType === 'Requirement') {
      return `/needs/${res.id}`;
    }
    return `/stakeholders/${res.id}`;
  };

  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center p-4 bg-apctt-light rounded-[2rem] mb-8 shadow-inner">
          <BrainCircuit className="w-12 h-12 text-apctt-blue" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tighter">AI Smart Matchmaker</h1>
        <p className="text-slate-500 text-xl max-w-2xl mx-auto leading-relaxed">
          Describe what you are looking for, and our AI will find the best matches from all registered innovations across the Asia-Pacific.
        </p>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl p-10 border border-slate-100 mb-16 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <Target size={120} className="text-apctt-blue" />
        </div>

        <textarea
          className="w-full h-48 p-8 bg-slate-50 rounded-3xl border border-slate-200 focus:ring-4 focus:ring-apctt-blue/10 focus:border-apctt-blue focus:outline-none text-slate-800 text-lg leading-relaxed mb-8 placeholder:text-slate-300 transition-all font-medium"
          placeholder="e.g., 'I am looking for a water purification technology for a disaster relief project in Vietnam...'"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <button
          onClick={handleMatch}
          disabled={isMatching || !query.trim()}
          className="w-full bg-apctt-blue hover:bg-apctt-dark disabled:bg-slate-300 text-white font-black py-5 rounded-2xl flex items-center justify-center transition-all shadow-xl shadow-apctt-blue/20 active:scale-[0.98] text-lg uppercase tracking-widest"
        >
          {isMatching ? (
            <>
              <Loader2 className="animate-spin mr-3" />
              Analyzing APCTT Database...
            </>
          ) : (
            <>
              <Sparkles className="mr-3 text-white" />
              Find Best Matches
            </>
          )}
        </button>
      </div>

      {errorMsg && (
        <div className="mb-12 p-6 bg-amber-50 border border-amber-200 rounded-3xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="p-2 bg-amber-100 rounded-xl text-amber-600 flex-shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h4 className="font-black text-amber-900 mb-1 leading-none uppercase tracking-widest text-xs">Configuration Issue</h4>
            <p className="text-amber-700 leading-relaxed font-medium">{errorMsg}</p>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center gap-3 px-4 mb-4">
            <div className="p-2 bg-apctt-blue text-white rounded-lg">
              <ChevronRight size={16} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">AI Suggested Matches</h2>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {results.map((res, idx) => (
              <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 hover:border-apctt-blue/30 transition-all shadow-sm group hover:shadow-xl hover:-translate-y-1">
                <div className="flex justify-between items-start mb-6">
                  <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] ${res.matchType === 'Technology' ? 'bg-emerald-50 text-emerald-700' :
                    res.matchType === 'Requirement' ? 'bg-amber-50 text-amber-700' :
                      'bg-apctt-light text-apctt-blue'
                    }`}>
                    {res.matchType}
                  </span>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Confidence</span>
                    <span className="text-lg font-black text-apctt-blue">{Math.round(res.confidenceScore * 100)}%</span>
                  </div>
                </div>

                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight group-hover:text-apctt-blue transition-colors line-clamp-1">{res.name}</h3>
                <p className="text-slate-500 leading-relaxed mb-8 text-lg">{res.reason}</p>

                <Link to={getMatchLink(res)} className="group/link inline-flex items-center text-apctt-blue font-black text-sm uppercase tracking-widest hover:text-apctt-dark transition-all">
                  View Detail Profile
                  <ChevronRight className="w-4 h-4 ml-2 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Matchmaker;
