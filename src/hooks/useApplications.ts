import { useState, useCallback, useEffect } from 'react';
import type { JobApplication, ApplicationStatus, FilterState, SortOption } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchApplications,
  insertApplication,
  updateApplicationRow,
  deleteApplicationRow,
} from '../services/applicationsApi';

export function useApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterState>({
    status: 'all',
    company: '',
    tag: '',
    sortBy: 'date',
    sortDirection: 'desc',
  });

  const reload = useCallback(async () => {
    if (!user) {
      setApplications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setApplications(await fetchApplications());
    } catch (err) {
      console.error('Kunde inte hämta ansökningar:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Sync applications with Supabase whenever the signed-in user changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  const addApplication = useCallback(
    async (app: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!user) return;
      try {
        const created = await insertApplication(user.id, {
          ...app,
          statusHistory: app.statusHistory || [],
        });
        setApplications((prev) => [...prev, created]);
        return created;
      } catch (err) {
        console.error('Kunde inte spara ansökan:', err);
      }
    },
    [user]
  );

  const updateApplication = useCallback(
    async (id: string, updates: Partial<JobApplication>) => {
      const existing = applications.find((a) => a.id === id);
      if (!existing) return;

      const statusHistory = [...existing.statusHistory];
      if (updates.status && updates.status !== existing.status) {
        statusHistory.push({
          from: existing.status,
          to: updates.status,
          timestamp: new Date().toISOString(),
        });
      }
      const merged = { ...existing, ...updates, statusHistory };

      // Optimistic update, reconcile on failure.
      setApplications((prev) => prev.map((a) => (a.id === id ? merged : a)));
      try {
        await updateApplicationRow(id, { ...updates, statusHistory });
      } catch (err) {
        console.error('Kunde inte uppdatera ansökan:', err);
        reload();
      }
    },
    [applications, reload]
  );

  const deleteApplication = useCallback(
    async (id: string) => {
      const prev = applications;
      setApplications((p) => p.filter((a) => a.id !== id));
      try {
        await deleteApplicationRow(id);
      } catch (err) {
        console.error('Kunde inte ta bort ansökan:', err);
        setApplications(prev);
      }
    },
    [applications]
  );

  const moveApplication = useCallback(
    (id: string, newStatus: ApplicationStatus) => updateApplication(id, { status: newStatus }),
    [updateApplication]
  );

  const getFilteredApplications = useCallback(() => {
    let filtered = [...applications];

    if (filter.status !== 'all') {
      filtered = filtered.filter((app) => app.status === filter.status);
    }
    if (filter.company) {
      filtered = filtered.filter((app) =>
        app.company.toLowerCase().includes(filter.company.toLowerCase())
      );
    }
    if (filter.tag) {
      filtered = filtered.filter((app) =>
        app.tags.some((t) => t.toLowerCase().includes(filter.tag.toLowerCase()))
      );
    }

    const sortFns: Record<SortOption, (a: JobApplication, b: JobApplication) => number> = {
      date: (a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime(),
      title: (a, b) => a.jobTitle.localeCompare(b.jobTitle, 'sv'),
      company: (a, b) => a.company.localeCompare(b.company, 'sv'),
    };

    filtered.sort(sortFns[filter.sortBy]);
    if (filter.sortDirection === 'asc') filtered.reverse();

    return filtered;
  }, [applications, filter]);

  const getApplicationsByStatus = useCallback(
    (status: ApplicationStatus) => applications.filter((app) => app.status === status),
    [applications]
  );

  return {
    applications,
    loading,
    filter,
    setFilter,
    addApplication,
    updateApplication,
    deleteApplication,
    moveApplication,
    getFilteredApplications,
    getApplicationsByStatus,
  };
}
