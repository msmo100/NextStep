import type { PointerEvent } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, Edit3, Calendar, MapPin } from 'lucide-react';
import type { JobApplication } from '../../types';
import './Kanban.css';

// Det ett kort tar emot: ansökan som ska visas + funktioner för att redigera och ta bort den.
interface KanbanCardProps {
  application: JobApplication;
  onEdit: (app: JobApplication) => void;
  onDelete: (id: string) => void;
}

// Ett enskilt ansökningskort i kanban-tavlan. Är dragbart.
export function KanbanCard({ application, onEdit, onDelete }: KanbanCardProps) {
  // Gör kortet dragbart och ger oss info om var det är och om det dras just nu.
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: application.id });

  // Stil som flyttar kortet under drag och gör det halvgenomskinligt medan det dras.
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Ser till att ett tryck på en knapp inte startar ett drag (annars går knapparna inte att klicka).
  const stopDragPointer = (e: PointerEvent) => e.stopPropagation();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="kanban-card"
      {...attributes}
      {...listeners}
    >
      {/* Knappar: redigera och ta bort. (De stoppar dragstarten så att klicket går fram.) */}
      <div className="kanban-card-header">
        <div className="kanban-card-actions">
          <button
            onClick={() => onEdit(application)}
            onPointerDown={stopDragPointer}
            title="Redigera"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => onDelete(application.id)}
            onPointerDown={stopDragPointer}
            title="Ta bort"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {/* Innehållet: titel och företag. */}
      <h4 className="kanban-card-title">{application.jobTitle}</h4>
      <p className="kanban-card-company">{application.company}</p>
      {/* Plats visas bara om den finns. */}
      {application.location && (
        <p className="kanban-card-meta">
          <MapPin size={12} />
          {application.location}
        </p>
      )}
      {/* Ansökningsdatum, formaterat på svenska. */}
      <p className="kanban-card-meta">
        <Calendar size={12} />
        {new Date(application.applicationDate).toLocaleDateString('sv-SE')}
      </p>
      {/* Taggar visas bara om det finns några. */}
      {application.tags.length > 0 && (
        <div className="kanban-card-tags">
          {application.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}
      {/* Anteckningar visas bara om de finns. */}
      {application.notes && (
        <p className="kanban-card-notes">{application.notes}</p>
      )}
    </div>
  );
}
