
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import { ArrowLeft, Save, Info, AlertCircle, ShieldCheck, ExternalLink, Globe, Lock, Handshake, Mail } from 'lucide-react';
import { Technology, UserAccount } from '../types';

const RegisterTechnology: React.FC = () => {
  const { user } = useAuth();
  const config = useConfig();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  const [formData, setFormData] = useState<Partial<Technology>>({
    name: '',
    tech_category_id: config.techCategories[0] || '',
    tech_sub_category_id: '',
    description: '',
    ip_status: config.ipStatusTypes[0] || 'patented',
    ip_owner: '',
    licensing_availability: config.licensingAvailabilities[0] || 'yes',
    geographic_restrictions: config.geographicRestrictions[0] || 'global',
    disclosure_level: config.disclosureLevels[0] || 'public',
    patent_number: ''
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('apctt_user_account');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    } else {
      setCurrentUser(user as UserAccount);
    }
  }, [user]);

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  // 1단계: 이메일 인증 체크
  if (!currentUser.is_email_verified) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-2xl">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Mail size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4">Email Verification Required</h2>
          <p className="text-slate-500 leading-relaxed mb-10">
            To maintain platform integrity, only verified members can post technologies. Please complete the **Email Verification** in your dashboard.
          </p>
          <Link to="/dashboard" className="bg-slate-900 text-white font-bold px-10 py-4 rounded-2xl hover:bg-slate-800 transition-all shadow-xl">
            Go to Verification Center
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newTech = {
        ...formData,
        stakeholder_id: currentUser.stakeholder_id,
        trl_level: 1, // Default TRL level as Number
        ip_status: formData.ip_status || 'patented'
      };
      await apiService.registerTechnology(newTech);
      setLoading(false);
      navigate('/technologies'); // Navigate to technologies list to see the change
    } catch (error) {
      console.error('Error registering technology:', error);
      alert('Failed to register technology. Please try again.');
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
            <div className="p-3 bg-blue-600 rounded-2xl">
              <Info className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold">Register New Technology</h1>
          </div>
          <p className="text-slate-400 text-sm max-w-xl">
            Register your innovation to make it discoverable by potential investors, partners, and adopters across the Asia-Pacific region.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-10">
          {/* General Information */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <span className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mr-3 text-sm">1</span>
              General Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">Technology Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g., Solar-Powered Water Purifier"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">Category</label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={formData.tech_category_id}
                  onChange={e => setFormData({ ...formData, tech_category_id: e.target.value })}
                >
                  {config.techCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">Sub-Category</label>
                <input
                  type="text"
                  placeholder="e.g., Renewable Resources"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={formData.tech_sub_category_id}
                  onChange={e => setFormData({ ...formData, tech_sub_category_id: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Detailed Description</label>
              <textarea
                required
                rows={4}
                placeholder="Describe the problem solved, unique value proposition, and current development stage..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          {/* IP & Licensing Details */}
          <div className="space-y-6 pt-6 border-t border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <span className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mr-3 text-sm">2</span>
              IP & Licensing Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-indigo-600" /> IP Status
                </label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none capitalize"
                  value={formData.ip_status}
                  onChange={e => setFormData({ ...formData, ip_status: e.target.value })}
                >
                  {config.ipStatusTypes.map(status => (
                    <option key={status} value={status}>{status.replace('-', ' ')}</option>
                  ))}
                </select>
              </div>

              {formData.ip_status === 'patented' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                  <label className="block text-sm font-bold text-slate-700">Patent Number</label>
                  <input
                    type="text"
                    placeholder="e.g., US-1234567-B2"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData.patent_number}
                    onChange={e => setFormData({ ...formData, patent_number: e.target.value })}
                  />
                  <p className="text-[10px] text-slate-400 flex items-center mt-1">
                    <ExternalLink className="w-3 h-3 mr-1" /> Linked to Google Patents for verification
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">IP Owner (Entity Name)</label>
                <input
                  required
                  type="text"
                  placeholder="Legal owner of the technology"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={formData.ip_owner}
                  onChange={e => setFormData({ ...formData, ip_owner: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Handshake size={14} className="text-indigo-600" /> Licensing Availability
                </label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none capitalize"
                  value={formData.licensing_availability}
                  onChange={e => setFormData({ ...formData, licensing_availability: e.target.value })}
                >
                  {config.licensingAvailabilities.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Globe size={14} className="text-indigo-600" /> Geographic Restrictions
                </label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none capitalize"
                  value={formData.geographic_restrictions}
                  onChange={e => setFormData({ ...formData, geographic_restrictions: e.target.value })}
                >
                  {config.geographicRestrictions.map(g => (
                    <option key={g} value={g}>{g.replace('-', ' ')}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Lock size={14} className="text-indigo-600" /> Disclosure Level
                </label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none capitalize"
                  value={formData.disclosure_level}
                  onChange={e => setFormData({ ...formData, disclosure_level: e.target.value })}
                >
                  {config.disclosureLevels.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-700 leading-relaxed">
              <strong>Notice:</strong> By registering, you confirm that your organization holds the intellectual property rights or necessary licenses for this technology. Information provided will be visible based on your selected disclosure level.
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
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-blue-100 flex items-center transition-all disabled:bg-blue-300"
            >
              {loading ? 'Submitting...' : (
                <><Save className="w-4 h-4 mr-2" /> Register Technology</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterTechnology;
