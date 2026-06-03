export type ApplicationStatus =
  | 'to-apply'
  | 'applied'
  | 'interview'
  | 'rejected'
  | 'offer';

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  'to-apply': 'Att söka',
  applied: 'Ansökt',
  interview: 'Intervju',
  rejected: 'Avslag',
  offer: 'Erbjudande',
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  'to-apply': '#6366f1',
  applied: '#ec4899',
  interview: '#f59e0b',
  rejected: '#ef4444',
  offer: '#22c55e',
};

export const ALL_STATUSES: ApplicationStatus[] = [
  'to-apply',
  'applied',
  'interview',
  'rejected',
  'offer',
];

export interface StatusChange {
  from: ApplicationStatus;
  to: ApplicationStatus;
  timestamp: string;
}

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

export interface JobSearchResponse {
  total: {
    value: number;
  };
  hits: JobSearchResult[];
}

export interface JobSearchFilters {
  region?: string;
  occupationField?: string;
  employmentType?: string;
  remote?: boolean;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: JobSearchFilters;
  createdAt: string;
}

export type SortOption = 'date' | 'title' | 'company';
export type SortDirection = 'asc' | 'desc';

export interface FilterState {
  status: ApplicationStatus | 'all';
  company: string;
  tag: string;
  sortBy: SortOption;
  sortDirection: SortDirection;
}
