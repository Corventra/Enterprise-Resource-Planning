import { useState } from 'react';
import { closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

interface UseFormBuilderDndInput {
  fieldIds: string[];
  onReorder: (nextFieldIds: string[]) => void;
}

export const useFormBuilderDnd = ({ fieldIds, onReorder }: UseFormBuilderDndInput) => {
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [overFieldId, setOverFieldId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveFieldId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveFieldId(null);
      setOverFieldId(null);
      return;
    }

    const oldIndex = fieldIds.indexOf(String(active.id));
    const newIndex = fieldIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) {
      setActiveFieldId(null);
      setOverFieldId(null);
      return;
    }

    onReorder(arrayMove(fieldIds, oldIndex, newIndex));
    setActiveFieldId(null);
    setOverFieldId(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverFieldId(over ? String(over.id) : null);
  };

  return {
    sensors,
    collisionDetection: closestCenter,
    activeFieldId,
    overFieldId,
    handleDragStart,
    handleDragOver,
    handleDragEnd
  };
};
