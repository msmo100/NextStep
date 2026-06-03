import type { PointerEvent } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, Edit3, Calendar, MapPin } from 'lucide-react';
import type { JobApplication } from '../../types';
import './Kanban.css';

interface KanbanCardProps {
  application: JobApplication;
  onEdit: (app: JobApplication) => void;
  onDelete: (id: string) => void;
}

export function KanbanCard({ application, onEdit, onDelete }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: application.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const stopDragPointer = (e: PointerEvent) => e.stopPropagation();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="kanban-card"
      {...attributes}
      {...listeners}
    >
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
      <h4 className="kanban-card-title">{application.jobTitle}</h4>
      <p className="kanban-card-company">{application.company}</p>
      {application.location && (
        <p className="kanban-card-meta">
          <MapPin size={12} />
          {application.location}
        </p>
      )}
      <p className="kanban-card-meta">
        <Calendar size={12} />
        {new Date(application.applicationDate).toLocaleDateString('sv-SE')}
      </p>
      {application.tags.length > 0 && (
        <div className="kanban-card-tags">
          {application.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}
      {application.notes && (
        <p className="kanban-card-notes">{application.notes}</p>
      )}
    </div>
  );
}
