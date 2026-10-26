import type { ReactNode } from 'react';

import type { DragEndEvent } from '@dnd-kit/core';
import { closestCenter, DndContext, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Image from 'next/image';
type SortableImageGridProps = {
    images: string[];
    mainImage: string;
    onReorder: (from: number, to: number) => void;
    onRemove: (index: number) => void;

    children?: ReactNode;
};
function SortableImageItem({
    src,
    index,
    isMain,
    onRemove,
}: {
    src: string;
    index: number;
    isMain: boolean;
    onRemove: (index: number) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: src });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={`relative aspect-square overflow-hidden rounded-lg border-2 border-border ${isMain ? 'border-warning' : ''}`}
        >
            {/* «Ручка»: listeners только здесь — палец на картинке таскает, на кнопках жмёт */}
            <button
                type="button"
                {...listeners}
                className="relative block h-full w-full cursor-grab"
            >
                <Image
                    src={src}
                    alt={`Фото ${index + 1}`}
                    fill
                    className="object-cover"
                />
            </button>

            {isMain && (
                <div className="absolute top-1 left-1 z-[5] rounded bg-warning px-2 py-0.5 text-[10px] font-semibold text-warning-foreground">
                    Заглавная
                </div>
            )}

            <div className="absolute top-1 right-1 z-10 flex flex-col gap-1">
                <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-none bg-black/60 p-0 text-white/80"
                    aria-label="Удалить фото"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}

export function SortableImageGrid({ images, mainImage, onReorder, onRemove, children }: SortableImageGridProps) {
    const mouseSensor = useSensor(MouseSensor, {
        activationConstraint: {
            distance: 10,
        },
    });
    const touchSensor = useSensor(TouchSensor, {
        // Press delay of 250ms, with tolerance of 5px of movement
        activationConstraint: {
            delay: 250,
            tolerance: 5,
        },
    });
    // При инициализации датчиков с помощью useSensor убедитесь, что вы передали датчики в функцию useSensors перед передачей их в функцию DndContext:

    const sensors = useSensors(mouseSensor, touchSensor);
    // В других примерах документации вы также можете увидеть датчики, инициализированные без промежуточных переменных, что эквивалентно приведенному выше синтаксису:

    function handleDragEnd(event: DragEndEvent) {
        const active = event.active;
        const over = event.over;

        if (!over || over.id === active.id) {
            return;
        }

        const oldIndex = images.indexOf(String(active.id));
        const newIndex = images.indexOf(String(over.id));
        onReorder(oldIndex, newIndex);
    }
    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={images}
                strategy={rectSortingStrategy}
            >
                <div className="grid grid-cols-4 gap-3 max-[480px]:grid-cols-2 max-lg:grid-cols-3 max-md:grid-cols-3">
                    {images.map((src, index) => (
                        <SortableImageItem
                            key={src}
                            src={src}
                            index={index}
                            isMain={mainImage === src}
                            onRemove={onRemove}
                        />
                    ))}

                    {children}
                </div>
            </SortableContext>
        </DndContext>
    );
}
