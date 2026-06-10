import { supabase } from './supabase';
import type { JobApplication } from '../types';

// Hur en rad ser ut i databasens "applications"-tabell. Kolumnnamnen skrivs med
// understreck (job_title), och fält kan sakna värde (null), till skillnad från i appen.
interface ApplicationRow {
  id: string;
  user_id: string;
  job_title: string;
  company: string;
  location: string | null;
  status: JobApplication['status'];
  application_date: string | null;
  notes: string | null;
  tags: string[] | null;
  url: string | null;
  source_id: string | null;
  status_history: JobApplication['statusHistory'] | null;
  created_at: string;
  updated_at: string;
}

// Översätter en rad från databasen till appens format: byter understreck-namn (job_title)
// mot appens namn (jobTitle), och gör om saknade värden (null) till tomma texter/listor.
function rowToApp(row: ApplicationRow): JobApplication {
  return {
    id: row.id,
    jobTitle: row.job_title,
    company: row.company,
    location: row.location ?? '',
    status: row.status,
    applicationDate: row.application_date ?? '',
    notes: row.notes ?? '',
    tags: row.tags ?? [],
    url: row.url ?? undefined,
    sourceId: row.source_id ?? undefined,
    statusHistory: row.status_history ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Motsatsen till rowToApp: gör om en ansökan (eller delar av en) till databasens kolumnnamn.
// Bara fält som faktiskt skickats med tas med, så att en uppdatering inte råkar tömma resten.
function appToColumns(
  app: Partial<Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>>
): Record<string, unknown> {
  const cols: Record<string, unknown> = {};
  if (app.jobTitle !== undefined) cols.job_title = app.jobTitle;
  if (app.company !== undefined) cols.company = app.company;
  if (app.location !== undefined) cols.location = app.location;
  if (app.status !== undefined) cols.status = app.status;
  if (app.applicationDate !== undefined) cols.application_date = app.applicationDate || null;
  if (app.notes !== undefined) cols.notes = app.notes;
  if (app.tags !== undefined) cols.tags = app.tags;
  if (app.url !== undefined) cols.url = app.url ?? null;
  if (app.sourceId !== undefined) cols.source_id = app.sourceId ?? null;
  if (app.statusHistory !== undefined) cols.status_history = app.statusHistory;
  return cols;
}

// Hämtar alla ansökningar för den inloggade användaren, äldst först.
// (Att man bara ser sina egna sköts av säkerhetsreglerna i databasen.)
export async function fetchApplications(): Promise<JobApplication[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as ApplicationRow[]).map(rowToApp);
}

// Sparar en ny ansökan kopplad till användaren och returnerar den skapade raden.
export async function insertApplication(
  userId: string,
  app: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>
): Promise<JobApplication> {
  const { data, error } = await supabase
    .from('applications')
    .insert({ user_id: userId, ...appToColumns(app) })
    .select()
    .single();
  if (error) throw error;
  return rowToApp(data as ApplicationRow);
}

// Uppdaterar en befintlig ansökan och sätter updated_at till nu.
export async function updateApplicationRow(
  id: string,
  updates: Partial<Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<JobApplication> {
  const { data, error } = await supabase
    .from('applications')
    .update({ ...appToColumns(updates), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return rowToApp(data as ApplicationRow);
}

// Tar bort raden med angivet id.
export async function deleteApplicationRow(id: string): Promise<void> {
  const { error } = await supabase.from('applications').delete().eq('id', id);
  if (error) throw error;
}
