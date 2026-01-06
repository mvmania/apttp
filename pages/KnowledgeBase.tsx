
import React from 'react';
import { KNOWLEDGE_BASE } from '../mockData';
import { BookOpen, Search, Bookmark, ChevronRight } from 'lucide-react';

const KnowledgeBase: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Knowledge Base</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Explore our library of guides, research papers, and toolkits designed to empower your technology transfer journey.
        </p>
      </div>

      <div className="relative mb-12">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search resources, articles, guides..." 
          className="w-full pl-12 pr-6 py-5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-50 focus:border-blue-400 focus:outline-none text-lg"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {KNOWLEDGE_BASE.map(item => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden group hover:border-blue-500 transition-colors">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">
                  {item.category}
                </span>
                <Bookmark className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 leading-snug group-hover:text-blue-600 transition-colors">
                {item.title}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                {item.summary}
              </p>
              <div className="flex items-center text-sm font-semibold text-blue-600 cursor-pointer">
                Read Resource <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </div>
        ))}
        
        {/* Placeholder for more content */}
        <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center p-8 text-center text-slate-400">
          <BookOpen className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm">More specialized content being curated by APCTT experts...</p>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;
