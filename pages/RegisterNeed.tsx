
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import { ArrowLeft, Save, Lightbulb, AlertCircle, Info, Clock, DollarSign, Briefcase } from 'lucide-react';
import { TechNeed } from '../types';

const RegisterNeed: React.FC = () => {
  const { user } = useAuth();
  const config = useConfig();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<Partial<TechNeed>>({
    title: '',
    description: '',
    industry: config.industries[0] || '',
    budget_range: '',
    deadline: '',
  });

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newNeed = {
        ...formData,
        seeker_id: user.id,
        status: 'open'
      };
      await apiService.registerNeed(newNeed);
      setLoading(false);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error registering tech need:', error);
      alert('Failed to post requirement. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link to="/dashboard" className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-8 bg-slate-900 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-600 rounded-2xl">
              <Lightbulb className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold">Post Technology Requirement</h1>
          </div>
          <p className="text-slate-400 text-sm max-w-xl">
            Describe the technical challenge your organization is facing. Technology providers will reach out to propose tailored solutions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-10">
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <span className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mr-3 text-sm">1</span>
              Requirement Details
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">Requirement Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g., Efficient Carbon Capture System for Manufacturing"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Briefcase size={14} className="text-indigo-600" /> Industry Sector
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={formData.industry}
                    onChange={e => setFormData({ ...formData, industry: e.target.value })}
                  >
                    {config.industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">Estimated Budget Range</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={formData.budget_range}
                      onChange={e => setFormData({ ...formData, budget_range: e.target.value })}
                    >
                      <option value="">Select Range...</option>
                      <option value="Under $10k">Under $10k</option>
                      <option value="$10k - $50k">$10k - $50k</option>
                      <option value="$50k - $100k">$50k - $100k</option>
                      <option value="$100k - $500k">$100k - $500k</option>
                      <option value="Over $500k">Over $500k</option>
                      <option value="To be discussed">To be discussed</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">Detailed Description & Specifications</label>
                <textarea
                  required
                  rows={6}
                  placeholder="What is the specific problem? What are the required performance metrics or technical constraints?"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">Target Deadline</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={formData.deadline}
                    onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex gap-4">
            <AlertCircle className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <p className="text-sm text-indigo-700 leading-relaxed">
              <strong>Notice:</strong> Your requirement will be listed in the public directory. Interested technology providers will be able to initiate a discussion. We recommend not sharing highly confidential details at this stage.
            </p>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-indigo-100 flex items-center transition-all disabled:bg-indigo-300"
            >
              {loading ? 'Publishing...' : (
                <><Save className="w-4 h-4 mr-2" /> Post Requirement</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterNeed;
