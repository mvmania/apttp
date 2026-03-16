
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useConfig } from '../context/ConfigContext';
import { apiService } from '../services/apiService';
import { UserScenario, MatchStatus, StakeholderRole, Stakeholder, StakeholderCategory, VerificationStatus, UserAccount, Technology, TechNeed } from '../types';
import {
  Settings,
  Plus,
  LayoutDashboard,
  Cpu,
  Briefcase,
  TrendingUp,
  ExternalLink,
  Edit3,
  MessageSquare,
  ChevronRight,
  ShieldCheck,
  Building2,
  User as UserIcon,
  Users,
  CheckCircle2,
  Lightbulb,
  Clock,
  Megaphone,
  Save,
  Globe,
  Mail,
  Target,
  MoreVertical,
  Phone,
  Lock,
  AlertTriangle,
  Upload,
  FileText,
  XCircle,
  Loader2
} from 'lucide-react';
import { TRL_DEFINITIONS, getTrlColor } from '../constants';

type RoleRequestItem = {
  id: string;
  requested_role: 'co_admin' | 'admin';
  requested_countries?: string[];
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_at?: string;
  note?: string | null;
};

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { chatRooms } = useChat();
  const config = useConfig();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'tech' | 'needs' | 'team' | 'chats' | 'org-profile'>('overview');

  const [orgData, setOrgData] = useState<Stakeholder | null>(null);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [allTechnologies, setAllTechnologies] = useState<Technology[]>([]);
  const [allNeeds, setAllNeeds] = useState<TechNeed[]>([]);
  const [allUsers, setAllUsers] = useState<UserAccount[]>([]);
  const [allStakeholders, setAllStakeholders] = useState<Stakeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [requestedRole, setRequestedRole] = useState<'co_admin' | 'admin'>('co_admin');
  const [requestCountries, setRequestCountries] = useState('');
  const [requestingRole, setRequestingRole] = useState(false);
  const [myRoleRequests, setMyRoleRequests] = useState<RoleRequestItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [techs, needs, usrs, orgs] = await Promise.all([
          apiService.getTechnologies(),
          apiService.getTechNeeds(),
          apiService.getPublicUsers(),
          apiService.getStakeholders()
        ]);
        setAllTechnologies(techs);
        setAllNeeds(needs || []);
        setAllUsers(usrs);
        setAllStakeholders(orgs);

        const savedUser = localStorage.getItem('apctt_user_account');
        if (savedUser) {
          setCurrentUser(JSON.parse(savedUser));
        } else {
          setCurrentUser(user as UserAccount);
        }

        if (user?.stakeholder_id) {
          const found = orgs.find(s => s.stakeholder_id === user.stakeholder_id);
          if (found) setOrgData(found);
        }

        if (!user?.isAdmin && !user?.isMasterAdmin) {
          try {
            const requests = await apiService.getMyRoleRequests();
            setMyRoleRequests(requests || []);
          } catch {
            setMyRoleRequests([]);
          }
        } else {
          setMyRoleRequests([]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-apctt-blue"></div>
      </div>
    );
  }

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const updateLocalUser = (updated: Partial<UserAccount>) => {
    const newUser = { ...currentUser, ...updated };
    setCurrentUser(newUser);
    localStorage.setItem('apctt_user_account', JSON.stringify(newUser));
  };

  const handleVerifyEmail = async () => {
    setIsVerifyingEmail(true);
    try {
      await apiService.resendVerificationEmail();
      setVerificationSent(true);
      setTimeout(() => setVerificationSent(false), 5000);
    } catch (error) {
      console.error('Error sending verification email:', error);
      alert('Failed to send verification email. Please try again.');
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleUploadID = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    try {
      // Logic for new status
      let nextStatus = VerificationStatus.PENDING;
      if (currentUser.verification_status === VerificationStatus.APPROVED ||
        currentUser.verification_status === VerificationStatus.UPDATE_PENDING) {
        nextStatus = VerificationStatus.UPDATE_PENDING;
        // is_id_verified stays true if it was already true
      }

      const updated = await apiService.updateUser(currentUser.id, {
        verification_status: nextStatus,
        id_document_name: file.name
      });
      updateLocalUser(updated);
      alert(nextStatus === VerificationStatus.UPDATE_PENDING
        ? 'Updated document submitted. Your current verified status remains active while admin reviews the new file.'
        : 'Verification document submitted successfully. Platform admin will review it shortly.');
    } catch (error) {
      console.error('Error uploading ID:', error);
      alert('Failed to submit for review.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleRequestRole = async () => {
    setRequestingRole(true);
    try {
      const countries = requestCountries
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c.length > 0);
      if (requestedRole === 'co_admin' && countries.length === 0) {
        alert('Please enter at least one country for a co-admin request.');
        setRequestingRole(false);
        return;
      }
      await apiService.createRoleRequest(requestedRole, countries);
      const requests = await apiService.getMyRoleRequests();
      setMyRoleRequests(requests || []);
      setRequestCountries('');
      alert('Role request submitted. Master admin review is required.');
    } catch (error: any) {
      console.error('Failed to request role:', error);
      alert(error?.message || 'Failed to submit role request.');
    } finally {
      setRequestingRole(false);
    }
  };

  const org = orgData;
  const orgMembers = currentUser.stakeholder_id ? allUsers.filter(u => u.stakeholder_id === currentUser.stakeholder_id) : [];
  const displayedTechs = currentUser.stakeholder_id ? allTechnologies.filter(t => t.stakeholder_id === currentUser.stakeholder_id) : [];
  const myNeeds = allNeeds.filter(n => n.seeker_id === currentUser.id || (currentUser.stakeholder_id && n.seeker_id === currentUser.stakeholder_id));

  const myChats = chatRooms.filter(chat =>
    chat.participant_ids.includes(currentUser.id) || (currentUser.stakeholder_id && chat.participant_ids.includes(currentUser.stakeholder_id))
  ).sort((a, b) => b.last_updated - a.last_updated);

  const isRepresentative = currentUser.scenario === UserScenario.ORG_REPRESENTATIVE;
  const isMember = currentUser.scenario === UserScenario.ORG_MEMBER;
  const isIndividual = currentUser.scenario === UserScenario.INDIVIDUAL;

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgData) return;
    setIsSaving(true);

    try {
      const updated = await apiService.updateStakeholder(orgData.stakeholder_id, orgData);
      setOrgData(updated);

      // Update local stakeholders list for consistency in current session
      const updatedOrgs = allStakeholders.map(s =>
        s.stakeholder_id === orgData.stakeholder_id ? updated : s
      );
      setAllStakeholders(updatedOrgs);

      setActiveTab('overview');
    } catch (error) {
      console.error('Error saving org data:', error);
      alert('Failed to save organization profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleRole = (role: StakeholderRole) => {
    if (!orgData) return;
    const currentRoles = orgData.roles || [];
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];
    setOrgData({ ...orgData, roles: newRoles });
  };

  const getStatusColor = (status: MatchStatus) => {
    switch (status) {
      case MatchStatus.CONTRACT_SIGNED: return 'text-emerald-600 bg-emerald-50';
      case MatchStatus.NEGOTIATION: return 'text-apctt-blue bg-apctt-light';
      default: return 'text-slate-500 bg-slate-50';
    }
  };

  const getRoleBadge = (role: StakeholderRole) => {
    const styles = {
      Provider: 'bg-apctt-light text-apctt-dark border-apctt-light',
      Seeker: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      Investor: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    };
    return (
      <span key={role} className={`px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-widest ${styles[role]}`}>
        {role}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">User Dashboard</h1>
          <p className="text-slate-500">Welcome back, {currentUser.name}. Track your innovation transfers and needs.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={logout} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-red-600 transition-colors">
            Sign Out
          </button>
          <div className="flex gap-2 flex-wrap justify-end">
            <Link
              to="/register-need"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl flex items-center transition-all"
            >
              <Lightbulb className="w-4 h-4 mr-2" /> Post Tech Need
            </Link>
            {(isRepresentative || isMember) && (
              <>
                <Link
                  to="/register-opportunity"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-purple-100 flex items-center transition-all"
                >
                  <Megaphone className="w-4 h-4 mr-2" /> Post Update
                </Link>
                {isRepresentative && (
                  <Link
                    to="/register-tech"
                    className="bg-apctt-blue hover:bg-apctt-dark text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-apctt-light flex items-center transition-all"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Register Tech
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {!currentUser.isAdmin && !currentUser.isMasterAdmin && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Request Governance Role</h2>
          <p className="text-sm text-slate-500 mb-4">
            Request to become co-admin or admin. Only master admin can approve.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Requested Role
              <select
                value={requestedRole}
                onChange={(e) => setRequestedRole(e.target.value as 'co_admin' | 'admin')}
                className="mt-2 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
              >
                <option value="co_admin">Co-Admin</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest md:col-span-2">
              Countries (required for Co-Admin)
              <input
                value={requestCountries}
                onChange={(e) => setRequestCountries(e.target.value)}
                placeholder="India, Japan"
                className="mt-2 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
            </label>
            <button
              disabled={requestingRole}
              onClick={handleRequestRole}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold px-4 py-2.5 rounded-xl text-sm"
            >
              {requestingRole ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-bold text-slate-700 mb-2">My Requests</h3>
            <div className="space-y-2">
              {myRoleRequests.slice(0, 5).map((r) => (
                <div key={r.id} className="border border-slate-100 rounded-xl p-3 text-sm flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-800">{r.requested_role}</span>
                    <span className="text-slate-500 ml-2">{new Date(r.requested_at).toLocaleString()}</span>
                    {Array.isArray(r.requested_countries) && r.requested_countries.length > 0 && (
                      <span className="text-slate-500 ml-2">({r.requested_countries.join(', ')})</span>
                    )}
                  </div>
                  <span className={`text-xs font-black uppercase tracking-widest px-2 py-1 rounded-full self-start ${r.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : r.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                    {r.status}
                  </span>
                </div>
              ))}
              {myRoleRequests.length === 0 && <div className="text-sm text-slate-500">No role requests yet.</div>}
            </div>
          </div>
        </div>
      )}

      {(currentUser.isAdmin || currentUser.isMasterAdmin) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8">
          <p className="text-sm font-semibold text-amber-800">
            Governance role requests are disabled for admin and master admin accounts.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <nav className="flex flex-col gap-1 sticky top-24 bg-white p-2 rounded-2xl border border-slate-200">
            <button onClick={() => setActiveTab('overview')} className={`flex items-center px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'overview' ? 'bg-apctt-blue text-white shadow-lg shadow-apctt-light' : 'text-slate-600 hover:bg-slate-50'}`}>
              <LayoutDashboard className="w-5 h-5 mr-3" /> Overview
            </button>
            {isRepresentative && (
              <button onClick={() => setActiveTab('org-profile')} className={`flex items-center px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'org-profile' ? 'bg-apctt-blue text-white shadow-lg shadow-apctt-light' : 'text-slate-600 hover:bg-slate-50'}`}>
                <Building2 className="w-5 h-5 mr-3" /> Organization Profile
              </button>
            )}
            {(isRepresentative || isMember) && (
              <button onClick={() => setActiveTab('tech')} className={`flex items-center px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'tech' ? 'bg-apctt-blue text-white shadow-lg shadow-apctt-light' : 'text-slate-600 hover:bg-slate-50'}`}>
                <Cpu className="w-5 h-5 mr-3" /> Org Portfolio
              </button>
            )}
            <button onClick={() => setActiveTab('needs')} className={`flex items-center px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'needs' ? 'bg-apctt-blue text-white shadow-lg shadow-apctt-light' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Lightbulb className="w-5 h-5 mr-3" /> My Tech Needs
            </button>
            {(isRepresentative || isMember) && (
              <button onClick={() => setActiveTab('team')} className={`flex items-center px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'team' ? 'bg-apctt-blue text-white shadow-lg shadow-apctt-light' : 'text-slate-600 hover:bg-slate-50'}`}>
                <Users className="w-5 h-5 mr-3" /> Team Management
              </button>
            )}
            <button onClick={() => setActiveTab('chats')} className={`flex items-center px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'chats' ? 'bg-apctt-blue text-white shadow-lg shadow-apctt-light' : 'text-slate-600 hover:bg-slate-50'}`}>
              <MessageSquare className="w-5 h-5 mr-3" /> Discussions
            </button>
            <div className="h-px bg-slate-100 my-2 mx-4"></div>
            <button className="flex items-center px-4 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-all">
              <Settings className="w-5 h-5 mr-3" /> Settings
            </button>
          </nav>
        </aside>

        <div className="lg:col-span-3 space-y-8">

          {activeTab === 'overview' && (
            <>
              {/* Profile Card */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
                <div className={`absolute top-0 right-0 p-10 opacity-5 ${isIndividual ? 'text-indigo-600' : 'text-apctt-blue'}`}>
                  {isIndividual ? <UserIcon size={120} /> : <Building2 size={120} />}
                </div>
                <div className={`w-24 h-24 rounded-[2.2rem] flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 shadow-xl ${isRepresentative ? 'bg-apctt-blue' : isMember ? 'bg-slate-800' : 'bg-indigo-600'}`}>
                  {currentUser.name.charAt(0)}
                </div>
                <div className="flex-grow text-center md:text-left relative z-10">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-slate-900">{currentUser.name}</h2>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest">{currentUser.scenario}</span>
                    {currentUser.is_id_verified && (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                        <ShieldCheck size={12} /> Verified Partner
                      </span>
                    )}
                  </div>
                  {org && (
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                      <p className="text-slate-600 text-sm flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {org.name}</p>
                      <div className="flex gap-1.5">
                        {org.roles?.map(getRoleBadge)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2-Step Verification Center */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-900 p-6 flex items-center justify-between">
                  <h3 className="text-white font-bold flex items-center gap-2">
                    <ShieldCheck className="text-blue-400" /> Account Verification Center
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-12 rounded-full ${currentUser.is_email_verified ? 'bg-apctt-light0' : 'bg-slate-700'}`}></div>
                    <div className={`h-2 w-12 rounded-full ${currentUser.is_id_verified ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                  </div>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Step 1: Email */}
                  <div className={`p-6 rounded-3xl border transition-all ${currentUser.is_email_verified ? 'bg-apctt-light border-apctt-light' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-2xl ${currentUser.is_email_verified ? 'bg-apctt-blue text-white' : 'bg-slate-200 text-slate-400'}`}>
                        <Mail size={24} />
                      </div>
                      {currentUser.is_email_verified ? (
                        <CheckCircle2 className="text-apctt-blue" size={24} />
                      ) : (
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-2 py-1 rounded-lg border">Step 1</span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 mb-1 text-lg">Email Verification</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mb-6">
                      {isIndividual
                        ? 'Verify your email address to gain permission to post technical needs and explore detailed tech profiles.'
                        : 'Verify your corporate email to gain permission to post technical needs and technology assets.'}
                    </p>

                    {!currentUser.is_email_verified ? (
                      <>
                        <button
                          onClick={handleVerifyEmail}
                          disabled={isVerifyingEmail}
                          className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center disabled:opacity-50"
                        >
                          {isVerifyingEmail ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="animate-spin w-4 h-4" />
                              <span>Sending Link...</span>
                            </div>
                          ) : 'Send Verification Link'}
                        </button>
                        {verificationSent && (
                          <p className="mt-3 text-[10px] font-bold text-apctt-blue animate-pulse text-center">
                            Verification link sent to your inbox! (Simulated)
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="text-apctt-blue font-bold text-sm flex items-center gap-2">
                        <CheckCircle2 size={16} /> Posting Permission Active
                      </div>
                    )}
                  </div>

                  {/* Step 2: Org Verification */}
                  <div className={`p-6 rounded-3xl border transition-all ${currentUser.is_id_verified ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-2xl ${currentUser.is_id_verified ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        <FileText size={24} />
                      </div>
                      {currentUser.is_id_verified ? (
                        <CheckCircle2 className="text-emerald-600" size={24} />
                      ) : (
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-2 py-1 rounded-lg border">Step 2</span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 mb-1 text-lg">Entity Verification</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mb-6">Upload business registration for Admin review. Verified partners get higher search visibility and priority matches.</p>

                    {(currentUser.verification_status === VerificationStatus.NONE || currentUser.verification_status === VerificationStatus.REJECTED) && (
                      <label className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer">
                        <Upload size={18} className="mr-2" />
                        {uploadingDoc ? 'Uploading...' : currentUser.verification_status === VerificationStatus.REJECTED ? 'Re-upload Registration' : 'Upload Registration'}
                        <input type="file" className="hidden" onChange={handleUploadID} accept=".pdf,.jpg,.png" />
                      </label>
                    )}

                    {(currentUser.verification_status === VerificationStatus.PENDING || currentUser.verification_status === VerificationStatus.UPDATE_PENDING) && (
                      <div className="space-y-4">
                        <div className="bg-amber-100 text-amber-700 px-4 py-3 rounded-xl flex items-center gap-3 border border-amber-200">
                          <Clock size={18} className="animate-pulse" />
                          <div>
                            <p className="text-[10px] font-black uppercase leading-none">Under Review</p>
                            <p className="text-xs font-medium">Platform admin is checking your documents.</p>
                          </div>
                        </div>
                        <label className="w-full bg-white text-slate-600 border border-slate-200 font-bold py-2 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center cursor-pointer text-xs">
                          <Edit3 size={14} className="mr-2" />
                          Change File
                          <input type="file" className="hidden" onChange={handleUploadID} accept=".pdf,.jpg,.png" />
                        </label>
                      </div>
                    )}

                    {currentUser.verification_status === VerificationStatus.APPROVED && (
                      <div className="space-y-4">
                        <div className="text-emerald-600 font-bold text-sm flex items-center gap-2">
                          <ShieldCheck size={16} /> Official Partner Status Active
                        </div>
                        <label className="w-full bg-white text-slate-600 border border-slate-200 font-bold py-2 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center cursor-pointer text-xs">
                          <Upload size={14} className="mr-2" />
                          Update Document
                          <input type="file" className="hidden" onChange={handleUploadID} accept=".pdf,.jpg,.png" />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Matchmaking Pipeline Preview */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center px-2">
                  <TrendingUp className="w-4 h-4 mr-2 text-emerald-600" /> Active Negotiation Pipeline
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {myChats.slice(0, 2).map(chat => (
                    <div key={chat.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Involved Tech/Need</p>
                          <h4 className="font-bold text-slate-900">{chat.item_name}</h4>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(chat.status)}`}>
                          {chat.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {[MatchStatus.INQUIRY, MatchStatus.NDA_PENDING, MatchStatus.TECHNICAL_DD, MatchStatus.NEGOTIATION, MatchStatus.CONTRACT_SIGNED].map((s, idx) => {
                          const isDone = [MatchStatus.INQUIRY, MatchStatus.NDA_PENDING, MatchStatus.TECHNICAL_DD, MatchStatus.NEGOTIATION, MatchStatus.CONTRACT_SIGNED].indexOf(chat.status) >= idx;
                          return <div key={s} className={`h-1.5 flex-grow rounded-full transition-all ${isDone ? 'bg-apctt-blue' : 'bg-slate-100'}`} title={s} />;
                        })}
                      </div>
                    </div>
                  ))}
                  {myChats.length === 0 && (
                    <div className="p-8 bg-slate-50 border border-dashed rounded-3xl text-center text-slate-400 text-sm">
                      Start a discussion to see your negotiation pipeline.
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-6 flex items-center"><Lightbulb className="w-4 h-4 mr-2 text-indigo-600" /> My Tech Needs</h3>
                  <div className="space-y-3">
                    {myNeeds.map(n => (
                      <div key={n.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="font-bold text-slate-900 text-sm leading-tight">{n.title}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{n.industry}</span>
                          <span className="text-[10px] text-emerald-600 font-bold uppercase">{n.status}</span>
                        </div>
                      </div>
                    ))}
                    {myNeeds.length === 0 && <p className="text-center text-slate-400 text-sm py-4">No open needs.</p>}
                  </div>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-6 flex items-center"><MessageSquare className="w-4 h-4 mr-2 text-apctt-blue" /> Recent Activity</h3>
                  <div className="space-y-4">
                    {myChats.slice(0, 3).map(c => (
                      <Link key={c.id} to={`/chat/${c.id}`} className="block group">
                        <p className="text-xs font-bold text-slate-900 group-hover:text-apctt-blue">New message re: {c.item_name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{new Date(c.last_updated).toLocaleTimeString()}</p>
                      </Link>
                    ))}
                    {myChats.length === 0 && <p className="text-center text-slate-400 text-sm py-4">No recent activity.</p>}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'org-profile' && orgData && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Organization Profile</h2>
                <button
                  onClick={handleSaveOrg}
                  disabled={isSaving}
                  className="bg-apctt-blue text-white font-bold px-6 py-2.5 rounded-xl shadow-lg hover:bg-apctt-dark transition-all flex items-center gap-2"
                >
                  {isSaving ? <Clock className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              {!currentUser.is_id_verified && (
                <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl flex items-start gap-4">
                  <AlertTriangle className="text-amber-500 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-amber-900 text-sm">Official Entity Verification Required</h4>
                    <p className="text-xs text-amber-700 leading-relaxed mt-1">
                      To display the **Verified Partner** badge on your technologies and stakeholders, please upload your organization's business registration document in the Overview tab.
                    </p>
                  </div>
                </div>
              )}

              <form className="space-y-8 bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Organization Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-apctt-light0 focus:outline-none font-medium"
                      value={orgData.name}
                      onChange={e => setOrgData({ ...orgData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Category</label>
                    <select
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-apctt-light0 focus:outline-none font-medium"
                      value={orgData.category}
                      onChange={e => setOrgData({ ...orgData, category: e.target.value as any })}
                    >
                      {config.stakeholderCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Network Roles</label>
                  <p className="text-xs text-slate-500 mb-3">Define how your organization interacts with the APCTT ecosystem.</p>
                  <div className="flex flex-wrap gap-4">
                    {(['Provider', 'Seeker', 'Investor'] as StakeholderRole[]).map(role => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleRole(role)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-bold transition-all ${orgData.roles?.includes(role)
                          ? 'border-apctt-blue bg-apctt-light text-apctt-dark'
                          : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'
                          }`}
                      >
                        {orgData.roles?.includes(role) ? <CheckCircle2 size={16} /> : <div className="w-4 h-4 rounded-full border border-slate-300" />}
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                        <Phone size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Direct WhatsApp Inquiry</p>
                        <p className="text-[10px] text-slate-500">Allow verified users to reach you via WhatsApp</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOrgData({ ...orgData, whatsapp_enabled: !orgData.whatsapp_enabled })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${orgData.whatsapp_enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${orgData.whatsapp_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  {orgData.whatsapp_enabled && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Contact Phone Number</label>
                      <input
                        type="tel"
                        placeholder="e.g., +91 000 000 0000"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        value={orgData.phone || ''}
                        onChange={e => setOrgData({ ...orgData, phone: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Short Description</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-apctt-light0 focus:outline-none"
                    value={orgData.description}
                    onChange={e => setOrgData({ ...orgData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Website</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="url"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-apctt-light0 focus:outline-none"
                        value={orgData.website}
                        onChange={e => setOrgData({ ...orgData, website: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Contact Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-apctt-light0 focus:outline-none"
                        value={orgData.contact_email}
                        onChange={e => setOrgData({ ...orgData, contact_email: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'needs' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">My Technology Needs</h2>
                <Link
                  to="/register-need"
                  className="bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
                >
                  <Plus size={18} /> Post Requirement
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {myNeeds.map(n => (
                  <div key={n.id} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:border-indigo-500 transition-all">
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">{n.industry}</span>
                        <span className="text-slate-300 text-xs flex items-center gap-1"><Clock size={12} /> {new Date(n.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-lg mb-2">{n.title}</h4>
                      <p className="text-slate-500 text-sm line-clamp-2 max-w-2xl">{n.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Budget Range</span>
                        <span className="font-bold text-slate-900">{n.budget_range}</span>
                      </div>
                      <button className="text-indigo-600 text-xs font-bold flex items-center hover:underline mt-2">
                        <Edit3 size={14} className="mr-1" /> Edit
                      </button>
                    </div>
                  </div>
                ))}
                {myNeeds.length === 0 && (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-[2.5rem] p-16 text-center">
                    <Lightbulb className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">Post what you're looking for to receive proactive matches.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tech' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Organization Portfolio</h2>
                {isRepresentative && (
                  <Link to="/register-tech" className="bg-apctt-blue text-white font-bold px-6 py-2.5 rounded-xl shadow-lg flex items-center transition-all">
                    <Plus className="w-4 h-4 mr-2" /> Add Tech
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayedTechs.map(t => (
                  <div key={t.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm group hover:border-apctt-light0 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <span className="bg-apctt-light text-apctt-blue text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider">{t.tech_category_id}</span>
                      <div className="flex gap-2 text-slate-300">
                        <Edit3 size={16} className="hover:text-apctt-blue cursor-pointer transition-colors" />
                        <Link to={`/technologies/${t.id}`}><ExternalLink size={16} className="hover:text-slate-900 transition-colors" /></Link>
                      </div>
                    </div>
                    <h4 className="font-bold text-slate-900 text-lg mb-2">{t.name}</h4>
                    <p className="text-slate-500 text-xs line-clamp-2 mb-4">{t.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="flex flex-col relative group/trl">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">TRL Level</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold text-white ${getTrlColor(t.trl_level || 0)}`}>
                            LVL {t.trl_level || 'N/A'}
                          </span>
                        </div>
                        {/* Compact Tooltip */}
                        <div className="absolute -top-10 left-0 bg-slate-900 text-white text-[9px] px-2 py-1.5 rounded-lg opacity-0 group-hover/trl:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-20 shadow-xl">
                          {TRL_DEFINITIONS.find(def => def.level === Number(t.trl_level))?.title || ''}
                          <div className="absolute -bottom-1 left-3 w-2 h-2 bg-slate-900 rotate-45"></div>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter"><ShieldCheck size={12} /> {t.ip_status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'chats' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <h2 className="text-2xl font-bold text-slate-900">Active Discussions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myChats.map(chat => {
                  const otherId = chat.participant_ids.find(id => id !== currentUser.id && id !== currentUser.stakeholder_id);
                  const otherOrg = allStakeholders.find(s => s.stakeholder_id === otherId);
                  const lastMsg = chat.messages[chat.messages.length - 1];

                  return (
                    <Link key={chat.id} to={`/chat/${chat.id}`} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-indigo-300 transition-all group">
                      <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        {otherOrg?.name.charAt(0) || 'U'}
                      </div>
                      <div className="flex-grow overflow-hidden">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-slate-900 text-sm truncate">{otherOrg?.name || 'Inquiry'}</h4>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${getStatusColor(chat.status)}`}>{chat.status}</span>
                        </div>
                        <p className="text-[10px] font-bold text-indigo-600 uppercase mt-0.5 truncate">{chat.item_name}</p>
                        <p className="text-xs text-slate-500 truncate mt-2 italic">{lastMsg.text}</p>
                      </div>
                    </Link>
                  );
                })}
                {myChats.length === 0 && <p className="col-span-full text-center text-slate-400 py-10">No active discussions.</p>}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
