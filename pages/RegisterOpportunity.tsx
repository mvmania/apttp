
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { useOpportunities } from '../context/OpportunityContext';
import { useConfig } from '../context/ConfigContext';
import { ArrowLeft, Save, Bell, Info, Calendar, Megaphone, Image as ImageIcon, Globe } from 'lucide-react';
import { Opportunity } from '../types';
import { getTurnstileSiteKey } from '../services/turnstileService';
import TurnstileWidget from '../components/TurnstileWidget';

const RegisterOpportunity: React.FC = () => {
  const { user } = useAuth();
  const { addOpportunity } = useOpportunities();
  const config = useConfig();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const turnstileSiteKey = getTurnstileSiteKey();

  const [formData, setFormData] = useState<Partial<Opportunity>>({
    // Fix: Cast string from config to the specific union type required by Opportunity
    type: (config.opportunityTypes[0] as Opportunity['type']) || 'Event',
    title: '',
    description: '',
    date: '',
    imageUrl: ''
  });

  if (!user || !user.stakeholder_id) {
    navigate('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (turnstileSiteKey && !captchaToken) {
        alert('Please complete the CAPTCHA challenge.');
        setLoading(false);
        return;
      }

      const newOpp = {
        type: formData.type as any,
        title: formData.title!,
        description: formData.description!,
        date: formData.date!,
        stakeholder_id: user.stakeholder_id!,
        imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200'
      };

      await apiService.registerOpportunity(newOpp, captchaToken || undefined);
      // Also update context for immediate UI feedback if needed, 
      // but the backend is the source of truth now.
      addOpportunity(newOpp);

      setLoading(false);
      navigate('/opportunities');
    } catch (error) {
      console.error('Error registering opportunity:', error);
      alert('Failed to publish update. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link to="/dashboard" className="inline-flex items-center text-sm text-slate-500 hover:text-blue-600 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-8 bg-slate-900 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-600 rounded-2xl">
              <Megaphone className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold">Share Opportunity & Updates</h1>
          </div>
          <p className="text-slate-400 text-sm max-w-xl">
            Promote events, technical tours, or support programs to the entire APCTT network.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-10">
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <span className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mr-3 text-sm">1</span>
              Announcement Content
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">Type of Update</label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium capitalize"
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                >
                  {config.opportunityTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">Primary Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    required
                    type="date"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Headline / Title</label>
              <input
                required
                type="text"
                placeholder="e.g., Annual Tech Innovation Summit 2024"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Detailed Description</label>
              <textarea
                required
                rows={6}
                placeholder="Describe the opportunity, target audience, and how to participate..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Header Image URL</label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  value={formData.imageUrl}
                  onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Tip: Use Unsplash URLs for better visuals in the demo.</p>
            </div>
          </div>

          <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex gap-4">
            <Info className="w-5 h-5 text-purple-600 flex-shrink-0" />
            <p className="text-sm text-purple-700 leading-relaxed">
              <strong>Network Reach:</strong> This update will be visible to all registered technology providers, seekers, and investors in the Asia-Pacific region.
            </p>
          </div>

          {turnstileSiteKey && (
            <div className="pt-2">
              <TurnstileWidget
                siteKey={turnstileSiteKey}
                action="opportunity_submit"
                onTokenChange={setCaptchaToken}
              />
            </div>
          )}

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
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-purple-100 flex items-center transition-all disabled:bg-purple-300"
            >
              {loading ? 'Publishing...' : (
                <><Megaphone className="w-4 h-4 mr-2" /> Publish Update</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterOpportunity;
