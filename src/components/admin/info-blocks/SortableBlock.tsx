import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { ChevronDown, ChevronUp, Menu } from '@/components/icons';
import { InfoBlockCard } from '@/components/profile/manage-bookings/InfoBlockCard';
import type { RouterOutputs } from '@/trpc/react';

// Один блок, как его возвращает процедура list.
export type InfoBlockRow = RouterOutputs['infoBlock']['list'][number];

// ============================================================
// Один перетаскиваемый блок списка.
// «Ручка» (иконка Menu) слева — за неё тянут. Сам блок — InfoBlockCard.
// ============================================================
type SortableBlockProps = {
    block: InfoBlockRow;
    index: number;
    total: number;
    onEdit: (block: InfoBlockRow) => void;
    onDelete: (id: string) => void;
    onMove: (index: number, direction: 'up' | 'down') => void;
};

export function SortableBlock({ block, index, total, onEdit, onDelete, onMove }: SortableBlockProps) {
    // useSortable подключает блок к drag-and-drop. Возвращает:
    //   setNodeRef — на какой DOM-узел навесить перетаскивание,
    //   attributes/listeners — на «ручку» (именно её тянем),
    //   transform/transition — сдвиг при перетаскивании.
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={isDragging ? 'opacity-60' : undefined}
        >
            <div className="flex items-start gap-2">
                {/* Ручка перетаскивания: за неё тянут. touch-none — чтобы на телефоне
                    жест не конфликтовал со скроллом страницы. */}
                <button
                    type="button"
                    aria-label="Перетащить блок"
                    className="mt-1 flex h-8 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-foreground active:cursor-grabbing"
                    {...attributes}
                    {...listeners}
                >
                    <Menu className="h-4 w-4" />
                </button>

                <div className="min-w-0 flex-1">
                    {/* Превью блока — ровно так он выглядит на странице */}
                    <InfoBlockCard
                        icon={block.icon}
                        title={block.title}
                        items={block.items}
                    />

                    {/* Панель управления блоком — мелкие кнопки под превью */}
                    <div className="mt-2 flex items-center justify-end gap-1">
                        <button
                            type="button"
                            onClick={() => onMove(index, 'up')}
                            disabled={index === 0}
                            aria-label="Переместить вверх"
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => onMove(index, 'down')}
                            disabled={index === total - 1}
                            aria-label="Переместить вниз"
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronDown className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => onEdit(block)}
                            className="ml-1 cursor-pointer rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary"
                        >
                            Редактировать
                        </button>
                        <button
                            type="button"
                            onClick={() => onDelete(block.id)}
                            className="cursor-pointer rounded-lg border border-destructive px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                        >
                            Удалить
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
