// De fem lägen en ansökan kan ha (= kanban-kolumnerna).
export type ApplicationStatus =
  | 'to-apply'
  | 'applied'
  | 'interview'
  | 'rejected'
  | 'offer';

// Svenska namn för varje status (visas i appen).
export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  'to-apply': 'Att söka',
  applied: 'Ansökt',
  interview: 'Intervju',
  rejected: 'Avslag',
  offer: 'Erbjudande',
};

// Färgkod för varje status (prickar, kolumnkanter, diagram).
export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  'to-apply': '#6366f1',
  applied: '#ec4899',
  interview: '#f59e0b',
  rejected: '#ef4444',
  offer: '#22c55e',
};

// Statusarna i rätt ordning – för att gå igenom alla kolumner.
export const ALL_STATUSES: ApplicationStatus[] = [
  'to-apply',
  'applied',
  'interview',
  'rejected',
  'offer',
];

// Ett statusbyte (från → till, med tidpunkt). Sparas i historiken för att mäta tid per steg.
export interface StatusChange {
  from: ApplicationStatus;
  to: ApplicationStatus;
  timestamp: string;
}

// En jobbansökan – appens centrala datamodell.
export interface JobApplication {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  status: ApplicationStatus;
  applicationDate: string;
  notes: string;
  tags: string[];
  url?: string;
  sourceId?: string;
  statusHistory: StatusChange[];
  createdAt: string;
  updatedAt: string;
}

// En jobbträff från Arbetsförmedlingens API, i den form API:et skickar den.
export interface JobSearchResult {
  id: string;
  headline: string;
  employer: {
    name: string;
  };
  workplace_address?: {
    municipality?: string;
    region?: string;
    city?: string;
  };
  publication_date: string;
  application_deadline?: string;
  description?: {
    text?: string;
    text_formatted?: string;
  };
  employment_type?: {
    label?: string;
  };
  working_hours_type?: {
    label?: string;
  };
  webpage_url?: string;
  logo_url?: string;
  application_details?: {
    url?: string;
    email?: string;
  };
}

// Svaret från sök-API:et: totalt antal träffar + själva träffarna.
export interface JobSearchResponse {
  total: {
    value: number;
  };
  hits: JobSearchResult[];
}

// Valbara filter för en jobbsökning.
export interface JobSearchFilters {
  region?: string;
  occupationField?: string;
  employmentType?: string;
  remote?: boolean;
}

// En sparad sökning (sökord + filter) som användaren kan köra igen.
export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: JobSearchFilters;
  createdAt: string;
}

// Alternativ för sortering av ansökningslistan.
export type SortOption = 'date' | 'title' | 'company';
export type SortDirection = 'asc' | 'desc';

// Hur listan just nu är filtrerad och sorterad.
export interface FilterState {
  status: ApplicationStatus | 'all';
  company: string;
  tag: string;
  sortBy: SortOption;
  sortDirection: SortDirection;
}
