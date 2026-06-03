import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type {
  CollisionDetection,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import type { JobApplication, ApplicationStatus } from '../../types';
import { ALL_STATUSES } from '../../types';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { ApplicationModal } from './ApplicationModal';
import './Kanban.css';

interface KanbanBoardProps {
  applications: JobApplication[];
  getByStatus: (status: ApplicationStatus) => JobApplication[];
  onAdd: (app: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate: (id: string, updates: Partial<JobApplication>) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, status: ApplicationStatus) => void;
}

export function KanbanBoard({
  applications,
  getByStatus,
  onAdd,
  onUpdate,
  onDelete,
  onMove,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<ApplicationStatus>('to-apply');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const collisionDetection: CollisionDetection = useCallback((args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) return pointerCollisions;
    return rectIntersection(args);
  }, []);

  const activeApp = activeId
    ? applications.find((a) => a.id === activeId) || null
    : null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeApp = applications.find((a) => a.id === active.id);
      if (!activeApp) return;

      const overId = over.id as string;

      // Dropping over a column
      if (ALL_STATUSES.includes(overId as ApplicationStatus)) {
        if (activeApp.status !== overId) {
          onMove(activeApp.id, overId as ApplicationStatus);
        }
        return;
      }

      // Dropping over another card
      const overApp = applications.find((a) => a.id === overId);
      if (overApp && activeApp.status !== overApp.status) {
        onMove(activeApp.id, overApp.status);
      }
    },
    [applications, onMove]
  );

  const handleDragEnd = useCallback((_event: DragEndEvent) => {
    setActiveId(null);
  }, []);

  const handleAdd = useCallback((status: ApplicationStatus) => {
    setEditingApp(null);
    setDefaultStatus(status);
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((app: JobApplication) => {
    setEditingApp(app);
    setDefaultStatus(app.status);
    setModalOpen(true);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      if (window.confirm('Är du säker på att du vill ta bort denna ansökan?')) {
        onDelete(id);
      }
    },
    [onDelete]
  );

  const handleSave = useCallback(
    (data: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (editingApp) {
        onUpdate(editingApp.id, data);
      } else {
        onAdd(data);
      }
    },
    [editingApp, onAdd, onUpdate]
  );

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board">
          {ALL_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              applications={getByStatus(status)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAdd={handleAdd}
            />
          ))}
        </div>
        <DragOverlay>
          {activeApp ? (
            <KanbanCard
              application={activeApp}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {modalOpen && (
        <ApplicationModal
          application={editingApp}
          defaultStatus={defaultStatus}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
