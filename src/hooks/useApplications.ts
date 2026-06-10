import { useState, useCallback, useEffect } from 'react';
import type { JobApplication, ApplicationStatus, FilterState, SortOption } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchApplications,
  insertApplication,
  updateApplicationRow,
  deleteApplicationRow,
} from '../services/applicationsApi';

// Samlar all hantering av ansökningar på ett ställe: hämta, lägg till, ändra, ta bort,
// flytta, filtrera och sortera. Allt sparas i databasen via applicationsApi.
export function useApplications() {
  const { user } = useAuth();
  // applications = listan vi har just nu, loading = om vi håller på att hämta, filter = vald filtrering.
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterState>({
    status: 'all',
    company: '',
    tag: '',
    sortBy: 'date',
    sortDirection: 'desc',
  });

  // Hämtar om ansökningarna från databasen. Tom lista om ingen är inloggad.
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

  // Ladda datan vid start och varje gång användaren byts (in-/utloggning).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  // Lägger till en ny ansökan: sparar i databasen och lägger den sist i listan.
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

  // Uppdaterar en ansökan. Om statusen ändras loggas bytet i statusHistory.
  const updateApplication = useCallback(
    async (id: string, updates: Partial<JobApplication>) => {
      const existing = applications.find((a) => a.id === id);
      if (!existing) return;

      // Bygg ny historik och lägg till en post om statusen faktiskt ändrades.
      const statusHistory = [...existing.statusHistory];
      if (updates.status && updates.status !== existing.status) {
        statusHistory.push({
          from: existing.status,
          to: updates.status,
          timestamp: new Date().toISOString(),
        });
      }
      const merged = { ...existing, ...updates, statusHistory };

      // Visa ändringen direkt på skärmen så det känns snabbt, och spara sedan i databasen.
      setApplications((prev) => prev.map((a) => (a.id === id ? merged : a)));
      try {
        await updateApplicationRow(id, { ...updates, statusHistory });
      } catch (err) {
        // Gick sparandet fel: hämta om från databasen så att skärmen inte visar fel data.
        console.error('Kunde inte uppdatera ansökan:', err);
        reload();
      }
    },
    [applications, reload]
  );

  // Tar bort en ansökan. Försvinner direkt från skärmen och läggs tillbaka om databasen klagar.
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

  // Flyttar en ansökan till en ny status (används vid dra-och-släpp i kanban).
  const moveApplication = useCallback(
    (id: string, newStatus: ApplicationStatus) => updateApplication(id, { status: newStatus }),
    [updateApplication]
  );

  // Ger tillbaka listan filtrerad (på status/företag/tagg) och sorterad enligt vald filtrering.
  const getFilteredApplications = useCallback(() => {
    let filtered = [...applications];

    // Filtrera bort allt som inte matchar valda status, företag respektive tagg.
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

    // Sorteringsfunktioner per alternativ (datum nyast först, titel/företag alfabetiskt).
    const sortFns: Record<SortOption, (a: JobApplication, b: JobApplication) => number> = {
      date: (a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime(),
      title: (a, b) => a.jobTitle.localeCompare(b.jobTitle, 'sv'),
      company: (a, b) => a.company.localeCompare(b.company, 'sv'),
    };

    // Sortera och vänd vid stigande ordning (standard är fallande).
    filtered.sort(sortFns[filter.sortBy]);
    if (filter.sortDirection === 'asc') filtered.reverse();

    return filtered;
  }, [applications, filter]);

  // Plockar ut alla ansökningar med en viss status (används för att fylla kanban-kolumnerna).
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
