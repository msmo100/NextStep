import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { JobApplication, ApplicationStatus } from '../../types';
import { STATUS_LABELS, STATUS_COLORS } from '../../types';
import { KanbanCard } from './KanbanCard';
import './Kanban.css';

interface KanbanColumnProps {
  status: ApplicationStatus;
  applications: JobApplication[];
  onEdit: (app: JobApplication) => void;
  onDelete: (id: string) => void;
  onAdd: (status: ApplicationStatus) => void;
}

export function KanbanColumn({ status, applications, onEdit, onDelete, onAdd }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column ${isOver ? 'kanban-column-over' : ''}`}
    >
      <div className="kanban-column-header" style={{ borderTopColor: STATUS_COLORS[status] }}>
        <div className="kanban-column-title">
          <span
            className="kanban-column-dot"
            style={{ backgroundColor: STATUS_COLORS[status] }}
          />
          <h3>{STATUS_LABELS[status]}</h3>
          <span className="kanban-column-count">{applications.length}</span>
        </div>
        <button className="kanban-add-btn" onClick={() => onAdd(status)} title="Lägg till">
          <Plus size={16} />
        </button>
      </div>
      <div className="kanban-column-body">
        <SortableContext items={applications.map((a) => a.id)} strategy={verticalListSortingStrategy}>
          {applications.map((app) => (
            <KanbanCard key={app.id} application={app} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </SortableContext>
        {applications.length === 0 && (
          <p className="kanban-empty">Inga ansökningar</p>
        )}
      </div>
    </div>
  );
}
