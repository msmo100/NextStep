import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Loader2,
  MapPin,
  Calendar,
  Briefcase,
  Plus,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  X,
} from 'lucide-react';
import { searchJobs } from '../../services/jobSearchApi';
import {
  fetchSavedSearches,
  insertSavedSearch,
  deleteSavedSearchRow,
} from '../../services/savedSearchesApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  OCCUPATION_FIELDS,
  EMPLOYMENT_TYPES,
  REGIONS,
  labelForId,
} from '../../services/taxonomy';
import type {
  JobSearchResult,
  JobSearchResponse,
  JobApplication,
  JobSearchFilters,
  SavedSearch,
} from '../../types';
import './JobSearch.css';

// Det sidan tar emot: en funktion som sparar en annons som ansökan, och en lista
// med id:n på annonser som redan är sparade (så vi kan visa "Sparad" på dem).
interface JobSearchProps {
  onSaveJob: (app: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>) => void;
  savedJobIds: Set<string>;
}

// Tomt filter att börja med (inget valt).
const EMPTY_FILTERS: JobSearchFilters = {};

// Sant om minst ett filter är valt.
function hasAnyFilter(filters: JobSearchFilters): boolean {
  return Boolean(
    filters.region || filters.occupationField || filters.employmentType || filters.remote
  );
}

// Bygger ett läsbart standardnamn för en sökning utifrån sökord och valda filter.
function describeSearch(query: string, filters: JobSearchFilters): string {
  const parts = [
    query.trim(),
    labelForId(filters.region),
    labelForId(filters.occupationField),
    labelForId(filters.employmentType),
    filters.remote ? 'Distans' : undefined,
  ].filter(Boolean);
  return parts.join(' · ') || 'Namnlös sökning';
}

// Sidan för att söka jobb mot API:et, spara sökningar och spara annonser som ansökningar.
export function JobSearch({ onSaveJob, savedJobIds }: JobSearchProps) {
  // Allt sökningen håller reda på: sökord, valda filter, träffarna, totalt antal,
  // var i listan vi är, om vi laddar, ev. felmeddelande och vilket kort som är utfällt.
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<JobSearchFilters>(EMPTY_FILTERS);
  const [results, setResults] = useState<JobSearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Det som hör till sparade sökningar: den inloggade användaren, listan med sparade
  // sökningar och namnet man håller på att skriva när en sökning ska sparas.
  const { user } = useAuth();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [savingName, setSavingName] = useState<string | null>(null);

  // Antal träffar per sida.
  const limit = 20;

  // Hämta användarens sparade sökningar vid start (och töm dem vid utloggning).
  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSavedSearches([]);
      return;
    }
    fetchSavedSearches()
      .then(setSavedSearches)
      .catch((err) => console.error('Kunde inte hämta sparade sökningar:', err));
  }, [user]);

  // Kör en sökning mot API:et och visar träffarna. Gör inget om både sökord och filter är tomma.
  const doSearch = useCallback(
    async (searchQuery: string, searchFilters: JobSearchFilters, searchOffset: number) => {
      if (!searchQuery.trim() && !hasAnyFilter(searchFilters)) return;
      setLoading(true);
      setError(null);
      try {
        const data: JobSearchResponse = await searchJobs(
          searchQuery,
          searchFilters,
          searchOffset,
          limit
        );
        setResults(data.hits);
        setTotal(data.total.value);
        setOffset(searchOffset);
        setHasSearched(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Något gick fel');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // När sökformuläret skickas: kör en ny sökning från första sidan.
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query, filters, 0);
  };

  // Sätter eller rensar ett enskilt filter (tomt värde tar bort nyckeln).
  const updateFilter = <K extends keyof JobSearchFilters>(
    key: K,
    value: JobSearchFilters[K]
  ) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
  };

  // Sökknappen är aktiv bara om det finns ett sökord eller minst ett filter.
  const canSearch = query.trim().length > 0 || hasAnyFilter(filters);

  // Börja spara: föreslå ett namn baserat på den aktuella sökningen.
  const handleStartSave = () => {
    setSavingName(describeSearch(query, filters));
  };

  // Bekräfta sparandet: spara sökningen i databasen och lägg den först i listan.
  const handleConfirmSave = async () => {
    const name = (savingName ?? '').trim();
    if (!name || !user) return;
    setSavingName(null);
    try {
      const created = await insertSavedSearch(user.id, { name, query, filters });
      setSavedSearches((prev) => [created, ...prev]);
    } catch (err) {
      console.error('Kunde inte spara sökningen:', err);
    }
  };

  // Kör en sparad sökning: återställ sökord/filter och sök på nytt.
  const handleRunSaved = (search: SavedSearch) => {
    setQuery(search.query);
    setFilters(search.filters);
    setExpandedId(null);
    doSearch(search.query, search.filters, 0);
  };

  // Ta bort en sparad sökning. Försvinner direkt från skärmen och läggs tillbaka om databasen klagar.
  const handleDeleteSaved = async (id: string) => {
    const prev = savedSearches;
    setSavedSearches((p) => p.filter((s) => s.id !== id));
    try {
      await deleteSavedSearchRow(id);
    } catch (err) {
      console.error('Kunde inte ta bort sökningen:', err);
      setSavedSearches(prev);
    }
  };

  // Sparar en annons som en ny ansökan i kolumnen "Att söka".
  const handleSave = (job: JobSearchResult) => {
    onSaveJob({
      jobTitle: job.headline,
      company: job.employer.name,
      // Välj den mest specifika platsen som finns (stad → kommun → region).
      location:
        job.workplace_address?.city ||
        job.workplace_address?.municipality ||
        job.workplace_address?.region ||
        '',
      status: 'to-apply',
      applicationDate: new Date().toISOString().split('T')[0],
      notes: '',
      tags: [],
      url: job.application_details?.url || job.webpage_url || undefined,
      sourceId: job.id,
      statusHistory: [],
    });
  };

  // Räkna ut hur många sidor av träffar det blir och vilken sida vi är på just nu.
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="job-search">
      {/* Sökfält + sökknapp. */}
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sök jobb"
            className="search-input"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading || !canSearch}>
          {loading ? <Loader2 size={16} className="spinner" /> : 'Sök'}
        </button>
      </form>

      {/* Filterrad: län, yrkesområde, anställningstyp, distans + "spara sökning". */}
      <div className="search-filters">
        <select
          className="filter-select"
          value={filters.region ?? ''}
          onChange={(e) => updateFilter('region', e.target.value || undefined)}
          aria-label="Län"
        >
          <option value="">Alla län</option>
          {REGIONS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={filters.occupationField ?? ''}
          onChange={(e) => updateFilter('occupationField', e.target.value || undefined)}
          aria-label="Yrkesområde"
        >
          <option value="">Alla yrkesområden</option>
          {OCCUPATION_FIELDS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={filters.employmentType ?? ''}
          onChange={(e) => updateFilter('employmentType', e.target.value || undefined)}
          aria-label="Anställningstyp"
        >
          <option value="">Alla anställningstyper</option>
          {EMPLOYMENT_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>

        <label className="filter-toggle">
          <input
            type="checkbox"
            checked={Boolean(filters.remote)}
            onChange={(e) => updateFilter('remote', e.target.checked || undefined)}
          />
          Distans
        </label>

        <button
          type="button"
          className="btn btn-secondary btn-sm filter-save-btn"
          onClick={handleStartSave}
          disabled={!canSearch}
        >
          <Bookmark size={14} /> Spara sökning
        </button>
      </div>

      {/* Namnge-fält som visas när man håller på att spara en sökning. */}
      {savingName !== null && (
        <div className="save-search-row">
          <input
            type="text"
            className="save-search-input"
            value={savingName}
            onChange={(e) => setSavingName(e.target.value)}
            autoFocus
            placeholder="Namnge sökningen"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirmSave();
              if (e.key === 'Escape') setSavingName(null);
            }}
          />
          <button className="btn btn-primary btn-sm" onClick={handleConfirmSave}>
            Spara
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setSavingName(null)}>
            Avbryt
          </button>
        </div>
      )}

      {/* De sparade sökningarna som små knappar. Klick kör sökningen, X tar bort den. */}
      {savedSearches.length > 0 && (
        <div className="saved-searches">
          <span className="saved-searches-label">Sparade sökningar</span>
          <div className="saved-search-chips">
            {savedSearches.map((s) => (
              <div key={s.id} className="saved-search-chip">
                <button
                  className="saved-search-run"
                  onClick={() => handleRunSaved(s)}
                  title="Kör sökning"
                >
                  {s.name}
                </button>
                <button
                  className="saved-search-delete"
                  onClick={() => handleDeleteSaved(s.id)}
                  title="Ta bort"
                  aria-label="Ta bort sparad sökning"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Felmeddelande och antal träffar. */}
      {error && <div className="search-error">{error}</div>}

      {hasSearched && !loading && (
        <p className="search-results-count">
          {total} {total === 1 ? 'jobb' : 'jobb'} hittade
        </p>
      )}

      {/* Resultatlistan: ett kort per jobb. */}
      <div className="search-results">
        {results.map((job) => (
          <div key={job.id} className="job-card">
            <div className="job-card-main">
              {/* Annonsens info: titel, arbetsgivare, plats, datum, anställningstyp. */}
              <div className="job-card-info">
                <h3 className="job-card-title">{job.headline}</h3>
                <p className="job-card-company">{job.employer.name}</p>
                <div className="job-card-details">
                  {(job.workplace_address?.municipality || job.workplace_address?.region) && (
                    <span className="job-card-detail">
                      <MapPin size={14} />
                      {job.workplace_address.municipality || job.workplace_address.region}
                    </span>
                  )}
                  <span className="job-card-detail">
                    <Calendar size={14} />
                    {new Date(job.publication_date).toLocaleDateString('sv-SE')}
                  </span>
                  {job.employment_type?.label && (
                    <span className="job-card-detail">
                      <Briefcase size={14} />
                      {job.employment_type.label}
                    </span>
                  )}
                </div>
              </div>
              {/* Knappar: spara annonsen (inaktiv om redan sparad) + visa mer/dölj. */}
              <div className="job-card-actions">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleSave(job)}
                  disabled={savedJobIds.has(job.id)}
                >
                  {savedJobIds.has(job.id) ? (
                    'Sparad'
                  ) : (
                    <>
                      <Plus size={14} /> Spara
                    </>
                  )}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}
                >
                  {expandedId === job.id ? 'Dölj' : 'Visa mer'}
                </button>
              </div>
            </div>
            {/* Utfälld del: beskrivning, sista ansökningsdag och länk – bara för det öppnade kortet. */}
            {expandedId === job.id && job.description?.text && (
              <div className="job-card-description">
                <p>{job.description.text.substring(0, 600)}...</p>
                {job.application_deadline && (
                  <p className="job-card-deadline">
                    <strong>Sista ansökningsdag:</strong>{' '}
                    {new Date(job.application_deadline).toLocaleDateString('sv-SE')}
                  </p>
                )}
                {(job.application_details?.url || job.webpage_url) && (
                  <a
                    href={job.application_details?.url || job.webpage_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                  >
                    Ansök här
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bläddring mellan sidor: föregående/nästa (visas bara om träffarna inte ryms på en sida). */}
      {totalPages > 1 && (
        <div className="search-pagination">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => doSearch(query, filters, offset - limit)}
            disabled={offset === 0 || loading}
          >
            <ChevronLeft size={16} /> Föregående
          </button>
          <span className="pagination-info">
            Sida {currentPage} av {totalPages}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => doSearch(query, filters, offset + limit)}
            disabled={offset + limit >= total || loading}
          >
            Nästa <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
