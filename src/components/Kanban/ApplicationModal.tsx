import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { JobApplication, ApplicationStatus } from '../../types';
import { STATUS_LABELS, ALL_STATUSES } from '../../types';
import './Kanban.css';

// Det fönstret tar emot: ev. ansökan att redigera, vilken status som ska vara förvald,
// samt funktioner som körs när man sparar respektive stänger.
interface ApplicationModalProps {
  application?: JobApplication | null;
  defaultStatus?: ApplicationStatus;
  onSave: (data: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

// Modalfönstret med formuläret för att skapa eller redigera en ansökan.
export function ApplicationModal({ application, defaultStatus = 'to-apply', onSave, onClose }: ApplicationModalProps) {
  // En egen ruta att hålla värdet i för varje formulärfält. Datumet börjar på dagens datum.
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>(defaultStatus);
  const [applicationDate, setApplicationDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [url, setUrl] = useState('');

  // Vid redigering: fyll formuläret med den befintliga ansökans värden.
  useEffect(() => {
    if (application) {
      setJobTitle(application.jobTitle);
      setCompany(application.company);
      setLocation(application.location);
      setStatus(application.status);
      setApplicationDate(application.applicationDate);
      setNotes(application.notes);
      setTagsInput(application.tags.join(', '));
      setUrl(application.url || '');
    }
  }, [application]);

  // Skickar formuläret: bygger ihop ansökningsobjektet och stänger sedan modalen.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      jobTitle,
      company,
      location,
      status,
      applicationDate,
      notes,
      // Dela upp taggsträngen på komma, trimma och släng tomma värden.
      tags: tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      url: url || undefined,
      // Behåll käll-id och historik från originalansökan vid redigering.
      sourceId: application?.sourceId,
      statusHistory: application?.statusHistory || [],
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* Själva rutan. Ett klick inuti den stängs inte vidare till bakgrunden, så fönstret blir kvar. */}
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{application ? 'Redigera ansökan' : 'Ny ansökan'}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {/* Obligatoriskt: jobbtitel. */}
          <div className="form-group">
            <label htmlFor="jobTitle">Jobbtitel *</label>
            <input
              id="jobTitle"
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              required
              placeholder="t.ex. Frontend-utvecklare"
            />
          </div>
          {/* Obligatoriskt: företag. */}
          <div className="form-group">
            <label htmlFor="company">Företag *</label>
            <input
              id="company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
              placeholder="t.ex. Spotify"
            />
          </div>
          {/* Rad med plats + status (rullgardin med alla statusar). */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="location">Plats</label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="t.ex. Stockholm"
              />
            </div>
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Rad med datum + taggar. */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="applicationDate">Datum</label>
              <input
                id="applicationDate"
                type="date"
                value={applicationDate}
                onChange={(e) => setApplicationDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="tags">Taggar</label>
              <input
                id="tags"
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="t.ex. React, Distans, Heltid"
              />
            </div>
          </div>
          {/* Länk till annonsen. */}
          <div className="form-group">
            <label htmlFor="url">Länk</label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          {/* Fritextanteckningar. */}
          <div className="form-group">
            <label htmlFor="notes">Anteckningar</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Egna anteckningar..."
            />
          </div>
          {/* Knappar: avbryt eller spara. */}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Avbryt
            </button>
            <button type="submit" className="btn btn-primary">
              {application ? 'Spara' : 'Lägg till'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
