import type { JobSearchResponse, JobSearchFilters } from '../types';

// Adressen till Arbetsförmedlingens öppna jobbsöks-API (JobTech).
const BASE_URL = 'https://jobsearch.api.jobtechdev.se';

// Söker jobb mot API:et. offset = var i listan vi börjar, limit = hur många (så vi får sidor).
export async function searchJobs(
  query: string,
  filters: JobSearchFilters = {},
  offset = 0,
  limit = 20
): Promise<JobSearchResponse> {

  // Grundinställningar: startposition, antal träffar, nyast först.
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
    sort: 'pubdate-desc',
  });

  // Lägg bara till sökord och filter som faktiskt är ifyllda.
  if (query.trim()) params.set('q', query.trim());
  if (filters.region) params.set('region', filters.region);
  if (filters.occupationField) params.set('occupation-field', filters.occupationField);
  if (filters.employmentType) params.set('employment-type', filters.employmentType);
  if (filters.remote) params.set('remote', 'true');

  // Skicka förfrågan till API:et.
  const response = await fetch(`${BASE_URL}/search?${params}`, {
    headers: { accept: 'application/json' },
  });

  // Fel om servern svarade med en felkod (t.ex. 500).
  if (!response.ok) {
    throw new Error(`API-fel: ${response.status}`);
  }

  // Tolka svaret som JSON och returnera det.
  return response.json();
}

// Hämtar en enskild annons via dess id.
export async function getJobById(id: string) {
  const response = await fetch(`${BASE_URL}/ad/${id}`, {
    headers: { accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`API-fel: ${response.status}`);
  }

  return response.json();
}
