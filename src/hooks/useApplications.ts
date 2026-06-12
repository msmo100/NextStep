import { useState, useCallback, useEffect } from 'react';
import type { JobApplication, ApplicationStatus, FilterState, SortOption } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchApplications,
  insertApplication,
  updateApplicationRow,
  deleteApplicationRow,
} from '../services/applicationsApi';

// All hantering av ansökningar på ett ställe: hämta, lägg till, ändra, ta bort, flytta, filtrera, sortera.
export function useApplications() {
  const { user } = useAuth();
  // listan vi har nu, om vi håller på att hämta, och den valda filtreringen.
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterState>({
    status: 'all',
    company: '',
    tag: '',
    sortBy: 'date',
    sortDirection: 'desc',
  });

  // Hämtar ansökningarna från databasen. Tom lista om ingen är inloggad.
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

  // Ladda vid start och varje gång användaren byts (in-/utloggning).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  // Ny ansökan: sparas i databasen och läggs sist i listan.
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

  // Ändrar en ansökan. Ändras statusen loggas bytet i historiken.
  const updateApplication = useCallback(
    async (id: string, updates: Partial<JobApplication>) => {
      const existing = applications.find((a) => a.id === id);
      if (!existing) return;

      // Lägg till en post i historiken om statusen faktiskt ändrades.
      const statusHistory = [...existing.statusHistory];
      if (updates.status && updates.status !== existing.status) {
        statusHistory.push({
          from: existing.status,
          to: updates.status,
          timestamp: new Date().toISOString(),
        });
      }
      const merged = { ...existing, ...updates, statusHistory };

      // Visa ändringen direkt på skärmen (känns snabbt), spara sedan i databasen.
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

  // Tar bort en ansökan. Försvinner direkt, läggs tillbaka om databasen klagar.
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

  // Flyttar en ansökan till ny status (vid dra-och-släpp i kanban).
  const moveApplication = useCallback(
    (id: string, newStatus: ApplicationStatus) => updateApplication(id, { status: newStatus }),
    [updateApplication]
  );

  // Ger listan filtrerad (status/företag/tagg) och sorterad.
  const getFilteredApplications = useCallback(() => {
    let filtered = [...applications];

    // Filtrera bort det som inte matchar vald status, företag eller tagg.
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

    // Ett sätt att sortera per val: datum nyast först, titel/företag i bokstavsordning.
    const sortFns: Record<SortOption, (a: JobApplication, b: JobApplication) => number> = {
      date: (a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime(),
      title: (a, b) => a.jobTitle.localeCompare(b.jobTitle, 'sv'),
      company: (a, b) => a.company.localeCompare(b.company, 'sv'),
    };

    // Sortera, och vänd om man valt stigande ordning (annars fallande).
    filtered.sort(sortFns[filter.sortBy]);
    if (filter.sortDirection === 'asc') filtered.reverse();

    return filtered;
  }, [applications, filter]);

  // Plockar ut ansökningarna med en viss status (fyller kanban-kolumnerna).
  const getApplicationsByStatus = useCallback(
    (status: ApplicationStatus) => applications.filter((app) => app.status === status),
    [applications]
  );

  // Allt som resten av appen får använda härifrån.
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
