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

// Props som tavlan tar emot: datan och callbacks för att lägga till/ändra/ta bort/flytta.
interface KanbanBoardProps {
  applications: JobApplication[];
  getByStatus: (status: ApplicationStatus) => JobApplication[];
  onAdd: (app: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate: (id: string, updates: Partial<JobApplication>) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, status: ApplicationStatus) => void;
}

// Kanban-tavlan: kolumner med kort, dra-och-släpp samt formulär-modalen.
export function KanbanBoard({
  applications,
  getByStatus,
  onAdd,
  onUpdate,
  onDelete,
  onMove,
}: KanbanBoardProps) {
  // activeId = kortet som dras just nu. Resten styr formulär-modalen.
  const [activeId, setActiveId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<ApplicationStatus>('to-apply');

  // Kräver att muspekaren flyttas 5px innan drag startar – så vanliga klick inte tolkas som drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Avgör vilken kolumn/kort muspekaren är över. Föredrar pekarträff, faller tillbaka på ytöverlapp.
  const collisionDetection: CollisionDetection = useCallback((args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) return pointerCollisions;
    return rectIntersection(args);
  }, []);

  // Det kort som dras just nu (för att kunna visa "spökkortet").
  const activeApp = activeId
    ? applications.find((a) => a.id === activeId) || null
    : null;

  // När ett drag börjar: kom ihåg vilket kort det gäller.
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  // Medan kortet dras över något: flytta det till den kolumn/det korts status man hovrar över.
  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeApp = applications.find((a) => a.id === active.id);
      if (!activeApp) return;

      const overId = over.id as string;

      // Hovrar man direkt över en kolumn → byt till den statusen.
      if (ALL_STATUSES.includes(overId as ApplicationStatus)) {
        if (activeApp.status !== overId) {
          onMove(activeApp.id, overId as ApplicationStatus);
        }
        return;
      }

      // Hovrar man över ett annat kort → ta över det kortets status.
      const overApp = applications.find((a) => a.id === overId);
      if (overApp && activeApp.status !== overApp.status) {
        onMove(activeApp.id, overApp.status);
      }
    },
    [applications, onMove]
  );

  // När draget släpps: nollställ det aktiva kortet (flytten har redan skett i handleDragOver).
  const handleDragEnd = useCallback((_event: DragEndEvent) => {
    setActiveId(null);
  }, []);

  // Öppnar modalen för en ny ansökan i vald kolumn.
  const handleAdd = useCallback((status: ApplicationStatus) => {
    setEditingApp(null);
    setDefaultStatus(status);
    setModalOpen(true);
  }, []);

  // Öppnar modalen för att redigera en befintlig ansökan.
  const handleEdit = useCallback((app: JobApplication) => {
    setEditingApp(app);
    setDefaultStatus(app.status);
    setModalOpen(true);
  }, []);

  // Tar bort en ansökan efter en bekräftelsefråga.
  const handleDelete = useCallback(
    (id: string) => {
      if (window.confirm('Är du säker på att du vill ta bort denna ansökan?')) {
        onDelete(id);
      }
    },
    [onDelete]
  );

  // Sparar modalens formulär: uppdaterar om vi redigerar, annars skapas en ny.
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
      {/* DndContext kopplar ihop hela dra-och-släpp-systemet. */}
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* En kolumn per status, fylld med just den statusens ansökningar. */}
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
        {/* "Spökkortet" som följer muspekaren medan man drar. */}
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

      {/* Formuläret (modalen) visas bara när modalOpen är sant. */}
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
