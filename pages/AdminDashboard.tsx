
import React, { useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { VerificationStatus, UserAccount, Technology, Stakeholder, StakeholderRole } from '../types';
import {
  ShieldCheck,
  Settings,
  Database,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Cpu,
  Globe,
  Search,
  X,
  Lock,
  ChevronRight,
  Target,
  Megaphone,
  Building2,
  FileText,
  UserCheck,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  Clock,
  ExternalLink,
  Users
} from 'lucide-react';

import { useSiteContent } from '../context/SiteContentContext';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const config = useConfig();
  const { updateContent } = useSiteContent(); // Use context

  const [activeTab, setActiveTab] = useState<'stats' | 'config' | 'stakeholders' | 'verifications' | 'users' | 'content'>('verifications');
  const [newItemName, setNewItemName] = useState('');
  const [addingTo, setAddingTo] = useState<{ key: string, label: string } | null>(null);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [coAdminScopes, setCoAdminScopes] = useState<Array<{ user_id: string; country: string }>>([]);
  const [coAdminCountryInput, setCoAdminCountryInput] = useState<Record<string, string>>({});
  const [pendingRoleRequests, setPendingRoleRequests] = useState<any[]>([]);
  const [masterTransferTarget, setMasterTransferTarget] = useState('');
  const [processingMasterAction, setProcessingMasterAction] = useState(false);
  const [contentList, setContentList] = useState<any[]>([]);
  const [editingContent, setEditingContent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingStakeholder, setEditingStakeholder] = useState<Stakeholder | null>(null);
  const [isUpdatingPermissions, setIsUpdatingPermissions] = useState(false);
  const isMasterAdminUser = Boolean(user?.role === 'master_admin' || user?.isMasterAdmin);

  // Security check & Data fetch
  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate('/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        const [t, s, u, c] = await Promise.all([
          apiService.getTechnologies(),
          apiService.getStakeholders(),
          apiService.getUsers(),
          apiService.getAdminContent()
        ]);
        setTechnologies(t);
        setStakeholders(s);
        setUsers(u);
        setContentList(c);

        if (isMasterAdminUser) {
          const [scopes, requests] = await Promise.all([
            apiService.getCoAdminScopes(),
            apiService.getPendingRoleRequests()
          ]);
          setCoAdminScopes(scopes || []);
          setPendingRoleRequests(requests || []);
        } else {
          setCoAdminScopes([]);
          setPendingRoleRequests([]);
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, navigate, isMasterAdminUser]);

  if (!user || !user.isAdmin) return null;
  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !addingTo) return;
    config.addItem(addingTo.key, newItemName);
    setNewItemName('');
    setAddingTo(null);
  };

  const handleApproveVerification = async (userToApprove: UserAccount) => {
    try {
      await apiService.updateUser(userToApprove.id, {
        verification_status: VerificationStatus.APPROVED,
        is_id_verified: true,
        is_verified: true
      });

      if (userToApprove.stakeholder_id && userToApprove.stakeholder_id.trim() !== "") {
        try {
          await apiService.updateStakeholder(userToApprove.stakeholder_id, {
            is_verified: true
          });
        } catch (stakeholderError) {
          console.warn('Note: Stakeholder associated with user not found, only user status updated.', stakeholderError);
        }
      }

      const [u, s] = await Promise.all([
        apiService.getUsers(),
        apiService.getStakeholders()
      ]);
      setUsers(u);
      setStakeholders(s);
      alert(`${userToApprove.name}'s identity has been successfully approved.`);
    } catch (error) {
      console.error('Approval error:', error);
      alert('Failed to approve identity. Please check your connection to the backend.');
    }
  };

  const handleRejectVerification = async (userToReject: UserAccount) => {
    try {
      // 1. Update user: revoke all verification flags
      await apiService.updateUser(userToReject.id, {
        verification_status: VerificationStatus.REJECTED,
        is_id_verified: false,
        is_verified: false
      });

      // 2. Also revoke stakeholder verification if applicable
      if (userToReject.stakeholder_id && userToReject.stakeholder_id.trim() !== "") {
        try {
          await apiService.updateStakeholder(userToReject.stakeholder_id, {
            is_verified: false
          });
        } catch (stakeholderError) {
          console.warn('Stakeholder update skipped during revocation.', stakeholderError);
        }
      }

      // 3. Refresh lists
      const [u, s] = await Promise.all([
        apiService.getUsers(),
        apiService.getStakeholders()
      ]);
      setUsers(u);
      setStakeholders(s);
      alert(`${userToReject.name}'s identity has been rejected and organization verification revoked.`);
    } catch (error) {
      console.error('Rejection error:', error);
      alert('Failed to reject identity.');
    }
  };

  const handleUpdateStakeholderPermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStakeholder) return;
    setIsUpdatingPermissions(true);
    try {
      // 1. Update the stakeholder record
      await apiService.updateStakeholder(editingStakeholder.stakeholder_id, editingStakeholder);

      // 2. Sync associated users if we just revoked verification
      if (!editingStakeholder.is_verified) {
        const associatedUsers = users.filter(u => u.stakeholder_id === editingStakeholder.stakeholder_id);
        for (const u of associatedUsers) {
          await apiService.updateUser(u.id, {
            is_verified: false,
            is_id_verified: false,
            verification_status: VerificationStatus.REJECTED
          });
        }
      } else {
        // If we manually verified them, ensure their user flags match
        const associatedUsers = users.filter(u => u.stakeholder_id === editingStakeholder.stakeholder_id);
        for (const u of associatedUsers) {
          await apiService.updateUser(u.id, {
            is_verified: true,
            is_id_verified: true,
            verification_status: VerificationStatus.APPROVED
          });
        }
      }

      // 3. Refresh everything
      const [u, s] = await Promise.all([
        apiService.getUsers(),
        apiService.getStakeholders()
      ]);
      setUsers(u);
      setStakeholders(s);
      setEditingStakeholder(null);
      alert('Stakeholder permissions and associated user accounts updated successfully.');
    } catch (error) {
      console.error('Error updating permissions:', error);
      alert('Failed to update permissions.');
    } finally {
      setIsUpdatingPermissions(false);
    }
  };

  const handleUpdateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContent) return;
    try {
      await updateContent(editingContent.key, editingContent.content); // Use context method
      // Refresh admin list specifically to get updated descriptions if needed, 
      // though content is main thing.
      const updatedList = await apiService.getAdminContent();
      setContentList(updatedList);
      setEditingContent(null);
      alert('Content updated successfully.');
    } catch (error) {
      console.error('Error updating content:', error);
      alert('Failed to update content.');
    }
  };

  const toggleStakeholderRole = (role: StakeholderRole) => {
    if (!editingStakeholder) return;
    const currentRoles = editingStakeholder.roles || [];
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];
    setEditingStakeholder({ ...editingStakeholder, roles: newRoles });
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await apiService.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      alert('User deleted successfully.');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user.');
    }
  };

  const handleToggleAdmin = async (u: UserAccount) => {
    try {
      const updated = await apiService.updateUser(u.id, { isAdmin: !u.isAdmin });
      setUsers(users.map(user => user.id === u.id ? updated : user));
      alert(`${u.name}'s administrator privileges have been ${updated.isAdmin ? 'granted' : 'revoked'}.`);
    } catch (error) {
      console.error('Error toggling admin:', error);
      alert('Failed to update admin status.');
    }
  };

  const handleAssignCoAdmin = async (u: UserAccount) => {
    const raw = coAdminCountryInput[u.id] || '';
    const countries = raw
      .split(',')
      .map((x) => x.trim())
      .filter((x) => x.length > 0);

    if (countries.length === 0) {
      alert('Please provide at least one country (comma-separated).');
      return;
    }

    try {
      await apiService.assignCoAdmin(u.id, countries);
      const [updatedUsers, scopes] = await Promise.all([
        apiService.getUsers(),
        apiService.getCoAdminScopes()
      ]);
      setUsers(updatedUsers);
      setCoAdminScopes(scopes);
      setCoAdminCountryInput((prev) => ({ ...prev, [u.id]: '' }));
      alert(`${u.name} is now a co-admin.`);
    } catch (error) {
      console.error('Error assigning co-admin:', error);
      alert('Failed to assign co-admin.');
    }
  };

  const handleRevokeCoAdmin = async (u: UserAccount) => {
    try {
      await apiService.revokeCoAdmin(u.id);
      const [updatedUsers, scopes] = await Promise.all([
        apiService.getUsers(),
        apiService.getCoAdminScopes()
      ]);
      setUsers(updatedUsers);
      setCoAdminScopes(scopes);
      alert(`${u.name} is no longer a co-admin.`);
    } catch (error) {
      console.error('Error revoking co-admin:', error);
      alert('Failed to revoke co-admin.');
    }
  };

  const refreshMasterPanels = async () => {
    if (user?.role !== 'master_admin') return;
    const [updatedUsers, scopes, requests] = await Promise.all([
      apiService.getUsers(),
      apiService.getCoAdminScopes(),
      apiService.getPendingRoleRequests()
    ]);
    setUsers(updatedUsers);
    setCoAdminScopes(scopes || []);
    setPendingRoleRequests(requests || []);
  };

  const handleApproveRoleRequest = async (requestId: string) => {
    try {
      setProcessingMasterAction(true);
      await apiService.approveRoleRequest(requestId);
      await refreshMasterPanels();
      alert('Role request approved.');
    } catch (error) {
      console.error('Error approving role request:', error);
      alert('Failed to approve role request.');
    } finally {
      setProcessingMasterAction(false);
    }
  };

  const handleRejectRoleRequest = async (requestId: string) => {
    try {
      setProcessingMasterAction(true);
      await apiService.rejectRoleRequest(requestId);
      await refreshMasterPanels();
      alert('Role request rejected.');
    } catch (error) {
      console.error('Error rejecting role request:', error);
      alert('Failed to reject role request.');
    } finally {
      setProcessingMasterAction(false);
    }
  };

  const handleTransferMasterRole = async () => {
    if (!masterTransferTarget.trim()) {
      alert('Please enter a target user ID.');
      return;
    }
    if (!window.confirm('Transfer master admin role now? This action has a 7-day cooldown.')) return;

    try {
      setProcessingMasterAction(true);
      await apiService.transferMasterAdmin(masterTransferTarget.trim());
      alert('Master admin role transferred. Please re-login.');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error transferring master role:', error);
      alert('Failed to transfer master role.');
    } finally {
      setProcessingMasterAction(false);
    }
  };

  const handleViewDocument = (fileName: string) => {
    // Determine base URL (handles different dev/prod port scenarios)
    const baseUrl = window.location.origin;
    // In Vite, public files are at the root
    const fileUrl = `${baseUrl}/uploads/verifications/${fileName}`;

    // Attempt to open in new tab
    const win = window.open(fileUrl, '_blank');
    if (!win) {
      alert('Pop-up blocked. Please allow pop-ups for this site to view documents.');
    }
  };

  const ConfigSection = ({ title, list, listKey, icon: Icon }: { title: string, list: string[], listKey: string, icon?: any }) => (
    <div className="space-y-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 group transition-all hover:border-indigo-200">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          {Icon && <Icon size={12} className="text-indigo-400" />}
          {title}
        </h3>
        <button
          onClick={() => setAddingTo({ key: listKey, label: title })}
          className="p-1.5 bg-white border border-slate-200 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
        {list.map(item => (
          <div key={item} className="flex items-center justify-between py-2 px-3 bg-white rounded-xl border border-slate-100 group/item hover:border-indigo-100">
            <span className="text-xs font-bold text-slate-700 capitalize">{item.replace('-', ' ')}</span>
            <button
              onClick={() => config.removeItem(listKey, item)}
              className="text-slate-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest rounded">Admin Privilege</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{user.name}</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <ShieldCheck className="text-indigo-600" size={32} /> Platform Governance
          </h1>
        </div>

        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          {[
            { id: 'stats', label: 'Insights', icon: BarChart3 },
            { id: 'config', label: 'Master Data', icon: Database },
            { id: 'verifications', label: 'Identity Reviews', icon: UserCheck },
            { id: 'users', label: 'User Directory', icon: Users },
            { id: 'stakeholders', label: 'Partners', icon: Building2 },
            { id: 'content', label: 'Content Editor', icon: FileText }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10">
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-2">
            {[
              { label: 'Technologies', value: technologies.length, icon: Cpu, color: 'text-apctt-blue bg-apctt-light' },
              { label: 'Stakeholders', value: stakeholders.length, icon: Globe, color: 'text-indigo-600 bg-indigo-50' },
              { label: 'Awaiting Review', value: users.filter(u => u.verification_status === VerificationStatus.PENDING).length, icon: AlertCircle, color: 'text-amber-600 bg-amber-50' },
              { label: 'Regional Coverage', value: `${new Set(stakeholders.map(s => s.legal_address.split(',').pop()?.trim())).size}+`, icon: Target, color: 'text-emerald-600 bg-emerald-50' },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm transition-all hover:shadow-xl group">
                <div className={`inline-flex p-3 rounded-2xl mb-4 transition-transform group-hover:scale-110 ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <div className="text-3xl font-black text-slate-900 mb-1">{stat.value}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 mb-10 border-b pb-8">
                <div className="p-4 bg-indigo-900 text-white rounded-3xl shadow-xl shadow-indigo-100">
                  <Database size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">Master Database Entries</h2>
                  <p className="text-sm text-slate-500">Manage all dynamic lists used throughout the platform forms.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <ConfigSection title="Tech Categories" list={config.techCategories} listKey="category" icon={Cpu} />
                <ConfigSection title="Industry Sectors" list={config.industries} listKey="industry" icon={Globe} />
                <ConfigSection title="Funding Modalities" list={config.fundingTypes} listKey="funding" icon={Target} />
                <ConfigSection title="IP Status Options" list={config.ipStatusTypes} listKey="ip" icon={ShieldCheck} />
                <ConfigSection title="Geographic Scopes" list={config.geographicRestrictions} listKey="geo" icon={Globe} />
                <ConfigSection title="Disclosure Levels" list={config.disclosureLevels} listKey="disclosure" icon={Lock} />
                <ConfigSection title="Licensing Terms" list={config.licensingAvailabilities} listKey="licensing" icon={ChevronRight} />
                <ConfigSection title="Opportunity Types" list={config.opportunityTypes} listKey="opportunity" icon={Megaphone} />
                <ConfigSection title="Org Categories" list={config.stakeholderCategories} listKey="stakeholder" icon={Building2} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'verifications' && (
          <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
            <div className="p-10 border-b">
              <h2 className="text-2xl font-black text-slate-900">Pending User Identity Reviews</h2>
              <p className="text-sm text-slate-500">Review business registration documents to grant Official Partner status.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                  <tr>
                    <th className="px-10 py-6">Applicant</th>
                    <th className="px-10 py-6">Organization</th>
                    <th className="px-10 py-6">Document</th>
                    <th className="px-10 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.filter(u => u.verification_status === VerificationStatus.PENDING || u.verification_status === VerificationStatus.UPDATE_PENDING).map(u => (
                    <tr key={u.id}>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-500">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{u.name}</p>
                            <p className="text-[10px] text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <span className="text-xs font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border">{stakeholders.find(s => s.stakeholder_id === u.stakeholder_id)?.name || 'Independent'}</span>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex flex-col gap-1">
                          <button
                            disabled={!u.id_document_name}
                            onClick={() => handleViewDocument(u.id_document_name!)}
                            className={`flex items-center gap-2 text-xs font-bold transition-colors ${u.id_document_name ? 'text-indigo-600 hover:text-indigo-800 hover:underline' : 'text-slate-300 cursor-not-allowed'}`}
                          >
                            <FileText size={14} /> {u.id_document_name || '(No file uploaded)'}
                          </button>
                          <span className={`text-[8px] font-black uppercase tracking-widest self-start px-1 rounded ${u.verification_status === VerificationStatus.UPDATE_PENDING ? 'bg-amber-50 text-amber-600' : 'bg-apctt-light text-apctt-blue'}`}>
                            {u.verification_status === VerificationStatus.UPDATE_PENDING ? 'Document Update' : 'New Request'}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApproveVerification(u)}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"
                            title="Approve Identity"
                          >
                            <ThumbsUp size={18} />
                          </button>
                          <button
                            onClick={() => handleRejectVerification(u)}
                            className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                            title="Reject / Request More"
                          >
                            <ThumbsDown size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.filter(u => u.verification_status === VerificationStatus.PENDING || u.verification_status === VerificationStatus.UPDATE_PENDING).length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-10 py-16 text-center text-slate-400 italic">
                        No pending identity reviews at this moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
            <div className="p-10 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900">User Management Console</h2>
                <p className="text-sm text-slate-500">View and manage all registered users and their privileges.</p>
              </div>
            </div>

            {isMasterAdminUser && (
              <div className="px-10 py-8 border-b border-slate-100 space-y-6 bg-slate-50/40">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-3">Pending Role Requests</h3>
                  <div className="space-y-2">
                    {pendingRoleRequests.map((request) => (
                      <div key={request.id} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="text-sm">
                          <span className="font-bold text-slate-900">{request.name}</span>
                          <span className="text-slate-500 ml-2">{request.email}</span>
                          <span className="ml-3 text-xs font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2 py-1 rounded-full">
                            {request.requested_role}
                          </span>
                          {Array.isArray(request.requested_countries) && request.requested_countries.length > 0 && (
                            <span className="text-slate-500 ml-2">({request.requested_countries.join(', ')})</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            disabled={processingMasterAction}
                            onClick={() => handleApproveRoleRequest(request.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                          >
                            Approve
                          </button>
                          <button
                            disabled={processingMasterAction}
                            onClick={() => handleRejectRoleRequest(request.id)}
                            className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                    {pendingRoleRequests.length === 0 && (
                      <div className="text-sm text-slate-500">No pending role requests.</div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-2">Transfer Master Role (Weekly)</h3>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      value={masterTransferTarget}
                      onChange={(e) => setMasterTransferTarget(e.target.value)}
                      placeholder="Target user id"
                      className="px-3 py-2 rounded-xl border border-slate-200 text-sm min-w-[220px]"
                    />
                    <button
                      disabled={processingMasterAction}
                      onClick={handleTransferMasterRole}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold"
                    >
                      Transfer Master Role
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-10 py-6">User Identity</th>
                    <th className="px-10 py-6">Status</th>
                    <th className="px-10 py-6">Administrative Level</th>
                    <th className="px-10 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map(u => (
                    <tr key={u.id} className="group hover:bg-slate-50/80 transition-all">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 ${u.isAdmin ? 'bg-indigo-900' : 'bg-slate-100'} text-${u.isAdmin ? 'white' : 'slate-500'} rounded-2xl flex items-center justify-center font-black shadow-lg shadow-indigo-100`}>
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{u.name}</span>
                            <span className="text-[10px] text-slate-400 font-bold">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex flex-col gap-1.5">
                          <span className={`text-[8px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-full inline-block self-start ${u.is_email_verified ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                            {u.is_email_verified ? 'Email Verified' : 'Email Unverified'}
                          </span>
                          <span className={`text-[8px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-full inline-block self-start ${u.is_id_verified ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                            {u.is_id_verified ? 'ID Verified' : 'ID Not Verified'}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={16} className={u.isAdmin ? 'text-indigo-600' : u.isCoAdmin ? 'text-emerald-600' : 'text-slate-300'} />
                          <span className={`text-xs font-black uppercase tracking-widest ${u.isAdmin ? 'text-indigo-600' : u.isCoAdmin ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {u.isAdmin ? 'Administrator' : u.isCoAdmin ? 'Co-Admin' : 'Standard User'}
                          </span>
                        </div>
                        {u.isCoAdmin && (
                          <div className="mt-2 text-[10px] text-slate-500 font-bold">
                            Scope: {coAdminScopes.filter((s) => s.user_id === u.id).map((s) => s.country).join(', ') || 'No countries'}
                          </div>
                        )}
                      </td>
                      <td className="px-10 py-8 text-right">
                        <div className="flex justify-end gap-3 items-center">
                          <button
                            onClick={() => handleToggleAdmin(u)}
                            className={`p-2 rounded-xl transition-all ${u.isAdmin ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                            title={u.isAdmin ? "Revoke Admin" : "Grant Admin"}
                          >
                            <Lock size={18} />
                          </button>
                          {isMasterAdminUser && !u.isAdmin && (
                            <>
                              <input
                                value={coAdminCountryInput[u.id] || ''}
                                onChange={(e) => setCoAdminCountryInput((prev) => ({ ...prev, [u.id]: e.target.value }))}
                                placeholder="India, Japan"
                                className="px-3 py-2 text-xs rounded-xl border border-slate-200 min-w-[170px]"
                              />
                              {u.isCoAdmin ? (
                                <button
                                  onClick={() => handleRevokeCoAdmin(u)}
                                  className="p-2 rounded-xl transition-all bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white"
                                  title="Revoke Co-Admin"
                                >
                                  <XCircle size={18} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleAssignCoAdmin(u)}
                                  className="p-2 rounded-xl transition-all bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                                  title="Assign Co-Admin"
                                >
                                  <ShieldCheck size={18} />
                                </button>
                              )}
                            </>
                          )}
                          <button
                            disabled={u.id === user.id}
                            onClick={() => handleDeleteUser(u.id)}
                            className={`p-2 rounded-xl transition-all ${u.id === user.id ? 'bg-slate-50 text-slate-200 cursor-not-allowed' : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'}`}
                            title="Delete User"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'stakeholders' && (
          <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
            <div className="p-10 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Partner Directory</h2>
                <p className="text-sm text-slate-500">Authorized review of regional stakeholder credentials.</p>
              </div>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search network..."
                  className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-10 py-6">Organization Identity</th>
                    <th className="px-10 py-6">Sector</th>
                    <th className="px-10 py-6">Verification</th>
                    <th className="px-10 py-6 text-right">Administrative Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stakeholders.map(s => (
                    <tr key={s.stakeholder_id} className="group hover:bg-slate-50/80 transition-all">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-900 text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-indigo-100">
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block group-hover:text-indigo-600 transition-colors">{s.name}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">{s.legal_document_id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <span className="text-xs font-bold text-slate-600 px-3 py-1 bg-white border border-slate-200 rounded-lg">{s.category}</span>
                      </td>
                      <td className="px-10 py-8">
                        {s.is_verified ? (
                          <div className="flex items-center gap-2 text-emerald-600">
                            <CheckCircle2 size={16} />
                            <span className="text-xs font-black uppercase tracking-widest">Verified Partner</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-amber-500 animate-pulse">
                            <AlertCircle size={16} />
                            <span className="text-xs font-black uppercase tracking-widest">Unverified</span>
                          </div>
                        )}
                      </td>
                      <td className="px-10 py-8 text-right">
                        <button
                          onClick={() => setEditingStakeholder(s)}
                          className="inline-flex items-center gap-1 text-indigo-600 font-black uppercase text-[10px] tracking-widest hover:underline"
                        >
                          Modify Permissions <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
            <div className="p-10 border-b">
              <h2 className="text-2xl font-black text-slate-900">Site Content Editor</h2>
              <p className="text-sm text-slate-500">Modify text content across the Landing Page, Footer, and About Page.</p>
            </div>
            <div className="divide-y divide-slate-100">
              {contentList.map(item => (
                <div key={item.key} className="p-8 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg mb-1">{item.key}</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.description}</p>
                    </div>
                    <button
                      onClick={() => setEditingContent(item)}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-600 transition-all"
                    >
                      Edit Content
                    </button>
                  </div>
                  <div className="bg-slate-100 p-4 rounded-xl text-sm text-slate-600 font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap">
                    {item.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Editing Content Modal */}
      {editingContent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900 leading-none">Edit Content</h3>
                <p className="text-xs text-slate-500 mt-2">Editing key: <span className="font-bold text-indigo-600 font-mono">{editingContent.key}</span></p>
              </div>
              <button onClick={() => setEditingContent(null)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateContent} className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HTML Content</label>
                <textarea
                  required
                  rows={8}
                  className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 text-sm font-mono text-slate-800"
                  value={editingContent.content}
                  onChange={e => setEditingContent({ ...editingContent, content: e.target.value })}
                />
                <p className="text-[10px] text-slate-400 italic">Supports HTML tags. Be careful with syntax.</p>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setEditingContent(null)}
                  className="flex-grow py-4 text-sm font-black text-slate-500 hover:bg-slate-50 rounded-[1.5rem] transition-all uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-grow bg-indigo-600 text-white py-4 rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals section */}
      {editingStakeholder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900 leading-none">Administrative Access</h3>
                <p className="text-xs text-slate-500 mt-2">Managing permissions for <span className="font-bold text-indigo-600">{editingStakeholder.name}</span></p>
              </div>
              <button onClick={() => setEditingStakeholder(null)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateStakeholderPermissions} className="p-10 space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification Override</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setEditingStakeholder({ ...editingStakeholder, is_verified: true })}
                    className={`flex-grow py-4 rounded-2xl border-2 font-bold transition-all ${editingStakeholder.is_verified ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                  >
                    Verified Partner
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingStakeholder({ ...editingStakeholder, is_verified: false })}
                    className={`flex-grow py-4 rounded-2xl border-2 font-bold transition-all ${!editingStakeholder.is_verified ? 'border-red-600 bg-red-50 text-red-700' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                  >
                    Unverified
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Roles</label>
                <div className="flex flex-wrap gap-3">
                  {(['Provider', 'Seeker', 'Investor'] as StakeholderRole[]).map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleStakeholderRole(role)}
                      className={`px-4 py-2 rounded-xl border-2 font-bold text-xs transition-all ${editingStakeholder.roles?.includes(role) ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingStakeholder(null)}
                  className="flex-grow py-4 text-sm font-black text-slate-500 hover:bg-slate-50 rounded-[1.5rem] transition-all uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPermissions}
                  className="flex-grow bg-indigo-600 text-white py-4 rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center"
                >
                  {isUpdatingPermissions ? <Clock className="animate-spin" size={16} /> : 'Apply Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {addingTo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900 leading-none">Add Master Entry</h3>
                <p className="text-xs text-slate-500 mt-2">New item for <span className="font-bold text-indigo-600">{addingTo.label}</span></p>
              </div>
              <button onClick={() => setAddingTo(null)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddItem} className="p-10 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">New Item Name</label>
                <input
                  autoFocus
                  required
                  type="text"
                  className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] focus:outline-none focus:ring-8 focus:ring-indigo-50 focus:border-indigo-500 text-lg font-bold text-slate-800"
                  placeholder="Enter name..."
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setAddingTo(null)}
                  className="flex-grow py-5 text-sm font-black text-slate-500 hover:bg-slate-50 rounded-[1.5rem] transition-all uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-grow bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Confirm Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
