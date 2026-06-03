import type { JobSearchResponse, JobSearchFilters } from '../types';

const BASE_URL = 'https://jobsearch.api.jobtechdev.se';

export async function searchJobs(
  query: string,
  filters: JobSearchFilters = {},
  offset = 0,
  limit = 20
): Promise<JobSearchResponse> {
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
    sort: 'pubdate-desc',
  });

  if (query.trim()) params.set('q', query.trim());
  if (filters.region) params.set('region', filters.region);
  if (filters.occupationField) params.set('occupation-field', filters.occupationField);
  if (filters.employmentType) params.set('employment-type', filters.employmentType);
  if (filters.remote) params.set('remote', 'true');

  const response = await fetch(`${BASE_URL}/search?${params}`, {
    headers: { accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`API-fel: ${response.status}`);
  }

  return response.json();
}

export async function getJobById(id: string) {
  const response = await fetch(`${BASE_URL}/ad/${id}`, {
    headers: { accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`API-fel: ${response.status}`);
  }

  return response.json();
}
