import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';

type PendingStakeholder = {
  stakeholder_id: string;
  name: string;
  category?: string;
  country?: string | null;
};

type PendingTechnology = {
  id: string;
  name: string;
  stakeholder_id?: string;
  country?: string | null;
};

type PendingTechNeed = {
  id: string;
  title: string;
  seeker_id?: string;
  country?: string | null;
};

const ModerationDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pendingStakeholders, setPendingStakeholders] = useState<PendingStakeholder[]>([]);
  const [pendingTechnologies, setPendingTechnologies] = useState<PendingTechnology[]>([]);
  const [pendingTechNeeds, setPendingTechNeeds] = useState<PendingTechNeed[]>([]);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const canModerate = Boolean(user?.role === 'admin' || user?.role === 'co_admin' || user?.isAdmin || user?.isCoAdmin);

  const refreshQueue = async () => {
    const queue = await apiService.getModerationQueue();
    setPendingStakeholders(queue.stakeholders || []);
    setPendingTechnologies(queue.technologies || []);
    setPendingTechNeeds(queue.tech_needs || []);
  };

  useEffect(() => {
    if (!canModerate) {
      navigate('/dashboard');
      return;
    }

    const run = async () => {
      try {
        await refreshQueue();
      } catch (error) {
        console.error('Failed to load moderation queue:', error);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [canModerate, navigate]);

  const moderate = async (
    key: string,
    action: () => Promise<unknown>
  ) => {
    try {
      setBusyKey(key);
      await action();
      await refreshQueue();
    } catch (error) {
      console.error('Moderation action failed:', error);
      alert('Moderation action failed.');
    } finally {
      setBusyKey(null);
    }
  };

  if (!canModerate) return null;
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="text-sm text-slate-500">Loading moderation queue...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-10">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Moderation Dashboard</h1>
        <p className="text-sm text-slate-500 mt-2">
          Review pending content. Co-admin actions are country-scoped.
        </p>
      </div>

      <section className="bg-white border rounded-2xl p-5">
        <h2 className="text-lg font-bold mb-4">Pending Technologies ({pendingTechnologies.length})</h2>
        <div className="space-y-3">
          {pendingTechnologies.map((item) => (
            <div key={item.id} className="border rounded-xl p-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-900">{item.name}</div>
                <div className="text-xs text-slate-500">Country: {item.country || 'Unknown'}</div>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={busyKey === `tech-approve-${item.id}`}
                  onClick={() => moderate(`tech-approve-${item.id}`, () => apiService.approveTechnology(item.id))}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                >
                  Approve
                </button>
                <button
                  disabled={busyKey === `tech-reject-${item.id}`}
                  onClick={() => moderate(`tech-reject-${item.id}`, () => apiService.rejectTechnology(item.id))}
                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
          {pendingTechnologies.length === 0 && <div className="text-sm text-slate-500">No pending technologies.</div>}
        </div>
      </section>

      <section className="bg-white border rounded-2xl p-5">
        <h2 className="text-lg font-bold mb-4">Pending Stakeholders ({pendingStakeholders.length})</h2>
        <div className="space-y-3">
          {pendingStakeholders.map((item) => (
            <div key={item.stakeholder_id} className="border rounded-xl p-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-900">{item.name}</div>
                <div className="text-xs text-slate-500">Country: {item.country || 'Unknown'}</div>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={busyKey === `stake-approve-${item.stakeholder_id}`}
                  onClick={() =>
                    moderate(`stake-approve-${item.stakeholder_id}`, () =>
                      apiService.approveStakeholder(item.stakeholder_id)
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                >
                  Approve
                </button>
                <button
                  disabled={busyKey === `stake-reject-${item.stakeholder_id}`}
                  onClick={() =>
                    moderate(`stake-reject-${item.stakeholder_id}`, () =>
                      apiService.rejectStakeholder(item.stakeholder_id)
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
          {pendingStakeholders.length === 0 && <div className="text-sm text-slate-500">No pending stakeholders.</div>}
        </div>
      </section>

      <section className="bg-white border rounded-2xl p-5">
        <h2 className="text-lg font-bold mb-4">Pending Tech Needs ({pendingTechNeeds.length})</h2>
        <div className="space-y-3">
          {pendingTechNeeds.map((item) => (
            <div key={item.id} className="border rounded-xl p-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-900">{item.title}</div>
                <div className="text-xs text-slate-500">Country: {item.country || 'Unknown'}</div>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={busyKey === `need-approve-${item.id}`}
                  onClick={() => moderate(`need-approve-${item.id}`, () => apiService.approveTechNeed(item.id))}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                >
                  Approve
                </button>
                <button
                  disabled={busyKey === `need-reject-${item.id}`}
                  onClick={() => moderate(`need-reject-${item.id}`, () => apiService.rejectTechNeed(item.id))}
                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
          {pendingTechNeeds.length === 0 && <div className="text-sm text-slate-500">No pending tech needs.</div>}
        </div>
      </section>
    </div>
  );
};

export default ModerationDashboard;
