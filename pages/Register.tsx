
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';
import { UserScenario, StakeholderCategory } from '../types';
import {
  Globe,
  User as UserIcon,
  Building2,
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  Briefcase
} from 'lucide-react';

import { apiService } from '../services/apiService';
import { getTurnstileSiteKey } from '../services/turnstileService';
import TurnstileWidget from '../components/TurnstileWidget';

const Register: React.FC = () => {
  const config = useConfig();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [orgErrors, setOrgErrors] = useState<{ orgName?: string; orgCategory?: string; orgWebsite?: string }>({});
  const turnstileSiteKey = getTurnstileSiteKey();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    scenario: UserScenario.ORG_REPRESENTATIVE,
    orgName: '',
    orgCategory: '',
    orgWebsite: ''
  });

  // Set default category when config loads
  React.useEffect(() => {
    if (config.stakeholderCategories.length > 0 && !formData.orgCategory) {
      setFormData(prev => ({ ...prev, orgCategory: config.stakeholderCategories[0] }));
    }
  }, [config.stakeholderCategories]);

  const handleNext = () => {
    if (step === 2) {
      const nextErrors: { orgName?: string; orgCategory?: string; orgWebsite?: string } = {};
      const orgName = formData.orgName.trim();
      const orgCategory = formData.orgCategory.trim();
      const orgWebsite = formData.orgWebsite.trim();

      if (!orgName) {
        nextErrors.orgName = 'Organization name is required.';
      }
      if (!orgCategory) {
        nextErrors.orgCategory = 'Entity category is required.';
      }
      if (!orgWebsite) {
        nextErrors.orgWebsite = 'Official website is required.';
      } else {
        try {
          const parsed = new URL(orgWebsite);
          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            nextErrors.orgWebsite = 'Official website must start with http:// or https://';
          }
        } catch {
          nextErrors.orgWebsite = 'Please enter a valid website URL.';
        }
      }

      setOrgErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) {
        return;
      }
    }

    if (step === 1 && formData.scenario === UserScenario.INDIVIDUAL) {
      setStep(3); // Skip org info for individuals
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step === 3 && formData.scenario === UserScenario.INDIVIDUAL) {
      setStep(1);
    } else {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!turnstileSiteKey) {
        alert('Registration is currently unavailable: CAPTCHA site key is not configured.');
        setLoading(false);
        return;
      }

      if (!captchaToken) {
        alert('Please complete the CAPTCHA challenge before submitting.');
        setLoading(false);
        return;
      }

      await apiService.registerUser(formData, captchaToken);
      setLoading(false);
      alert('Registration successful. Please verify your email, then sign in.');
      navigate('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      alert(error.message || 'Failed to register. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 px-4 py-20">
      <div className="max-w-2xl w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">

        {/* Header */}
        <div className="p-8 text-center bg-slate-900 text-white relative">
          <Link to="/login" className="absolute left-6 top-8 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-4">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-slate-400 mt-1 text-sm">Join the Asia-Pacific Tech Network</p>

          {/* Progress Indicator */}
          <div className="mt-8 flex justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step >= s ? 'bg-blue-500' : 'bg-slate-700'
                  }`}
              />
            ))}
          </div>
        </div>

        <div className="p-10">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Step 1: Select Scenario */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold text-slate-900">Choose your membership type</h2>
                  <p className="text-slate-500 text-sm mt-1">This helps us customize your platform experience.</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {[
                    { id: UserScenario.ORG_REPRESENTATIVE, label: 'Official Representative', desc: 'Manage your organization\'s tech portfolio and team.', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { id: UserScenario.ORG_MEMBER, label: 'Organization Member', desc: 'Contribute to your organization\'s innovation transfer.', icon: Building2, color: 'text-slate-600', bg: 'bg-slate-50' },
                    { id: UserScenario.INDIVIDUAL, label: 'Individual Innovator', desc: 'Participate as an independent researcher or consultant.', icon: UserIcon, color: 'text-indigo-600', bg: 'bg-indigo-50' }
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, scenario: option.id })}
                      className={`w-full p-6 rounded-2xl border-2 text-left transition-all flex items-center gap-5 ${formData.scenario === option.id
                        ? 'border-blue-600 bg-blue-50/30'
                        : 'border-slate-100 hover:border-slate-200'
                        }`}
                    >
                      <div className={`w-12 h-12 ${option.bg} ${option.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <option.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-grow">
                        <p className="font-bold text-slate-900">{option.label}</p>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{option.desc}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formData.scenario === option.id ? 'border-blue-600 bg-blue-600' : 'border-slate-200'}`}>
                        {formData.scenario === option.id && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Org Info (Optional based on step 1) */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold text-slate-900">Tell us about your organization</h2>
                  <p className="text-slate-500 text-sm mt-1">Provide legal entity details for verification.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Organization Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        required
                        type="text"
                        placeholder="e.g., Innovation Lab Corp"
                        className={`w-full pl-12 pr-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none ${orgErrors.orgName ? 'border-red-400' : 'border-slate-200'}`}
                        value={formData.orgName}
                        onChange={e => {
                          setFormData({ ...formData, orgName: e.target.value });
                          if (orgErrors.orgName) setOrgErrors(prev => ({ ...prev, orgName: undefined }));
                        }}
                      />
                    </div>
                    {orgErrors.orgName && <p className="text-xs text-red-600 font-semibold">{orgErrors.orgName}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Entity Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-700 ${orgErrors.orgCategory ? 'border-red-400' : 'border-slate-200'}`}
                      value={formData.orgCategory}
                      onChange={e => {
                        setFormData({ ...formData, orgCategory: e.target.value });
                        if (orgErrors.orgCategory) setOrgErrors(prev => ({ ...prev, orgCategory: undefined }));
                      }}
                    >
                      {config.stakeholderCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    {orgErrors.orgCategory && <p className="text-xs text-red-600 font-semibold">{orgErrors.orgCategory}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Official Website <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        required
                        type="url"
                        placeholder="https://organization.com"
                        className={`w-full pl-12 pr-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none ${orgErrors.orgWebsite ? 'border-red-400' : 'border-slate-200'}`}
                        value={formData.orgWebsite}
                        onChange={e => {
                          setFormData({ ...formData, orgWebsite: e.target.value });
                          if (orgErrors.orgWebsite) setOrgErrors(prev => ({ ...prev, orgWebsite: undefined }));
                        }}
                      />
                    </div>
                    {orgErrors.orgWebsite && <p className="text-xs text-red-600 font-semibold">{orgErrors.orgWebsite}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Account Info */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold text-slate-900">Set up your profile</h2>
                  <p className="text-slate-500 text-sm mt-1">Final step to access the APCTT network.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        required
                        type="text"
                        placeholder="John Doe"
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {formData.scenario === UserScenario.INDIVIDUAL ? 'Personal Email' : 'Work Email'}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        required
                        type="email"
                        placeholder="name@organization.com"
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Security Key (Password)</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        required
                        type="password"
                        placeholder="Min. 8 characters"
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-6 border-t border-slate-50">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-4 font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-grow bg-slate-900 text-white font-bold py-4 rounded-2xl flex items-center justify-center transition-all shadow-xl shadow-slate-200 hover:bg-slate-800"
                >
                  Next Step <ArrowRight className="ml-2 w-4 h-4" />
                </button>
              ) : (
                <div className="flex-grow">
                  <div className="mb-4">
                    {turnstileSiteKey ? (
                      <TurnstileWidget
                        siteKey={turnstileSiteKey}
                        action="register"
                        onTokenChange={setCaptchaToken}
                      />
                    ) : (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 font-medium">
                        CAPTCHA setup is missing. Contact admin and set <code>VITE_TURNSTILE_SITE_KEY</code>.
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !turnstileSiteKey || !captchaToken}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center transition-all shadow-xl shadow-blue-100 disabled:bg-blue-300 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>Complete Registration <ChevronRight className="ml-2 w-4 h-4" /></>
                    )}
                  </button>
                </div>
              )}
            </div>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400 font-medium">
            Already have an account? <Link to="/login" className="text-blue-600 font-bold hover:underline">Sign In Instead</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
