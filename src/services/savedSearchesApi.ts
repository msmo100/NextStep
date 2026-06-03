import { supabase } from './supabase';
import type { SavedSearch, JobSearchFilters } from '../types';

interface SavedSearchRow {
  id: string;
  user_id: string;
  name: string;
  query: string | null;
  filters: JobSearchFilters | null;
  created_at: string;
}

function rowToSavedSearch(row: SavedSearchRow): SavedSearch {
  return {
    id: row.id,
    name: row.name,
    query: row.query ?? '',
    filters: row.filters ?? {},
    createdAt: row.created_at,
  };
}

export async function fetchSavedSearches(): Promise<SavedSearch[]> {
  const { data, error } = await supabase
    .from('saved_searches')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as SavedSearchRow[]).map(rowToSavedSearch);
}

export async function insertSavedSearch(
  userId: string,
  search: Omit<SavedSearch, 'id' | 'createdAt'>
): Promise<SavedSearch> {
  const { data, error } = await supabase
    .from('saved_searches')
    .insert({
      user_id: userId,
      name: search.name,
      query: search.query,
      filters: search.filters,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToSavedSearch(data as SavedSearchRow);
}

export async function deleteSavedSearchRow(id: string): Promise<void> {
  const { error } = await supabase.from('saved_searches').delete().eq('id', id);
  if (error) throw error;
}
