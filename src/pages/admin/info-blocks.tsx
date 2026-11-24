import { useState } from 'react';

import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSession } from 'next-auth/react';

import { InfoBlockForm, type InfoBlockFormState } from '@/components/admin/info-blocks/InfoBlockForm';
import { type InfoBlockRow, SortableBlock } from '@/components/admin/info-blocks/SortableBlock';
import { Plus, Sparkles } from '@/components/icons';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { hasPermission } from '@/lib/constants/roles';
import { requireRole } from '@/server/auth/require-auth';
import { Layout } from '@/shared/ui/layout';
import { api } from '@/trpc/react';

// Не-модератор получает 404 ещё на сервере.
export const getServerSideProps = requireRole('moderator');

// Пустая форма нового блока.
const EMPTY_FORM: InfoBlockFormState = {
    id: '',
    icon: 'info',
    title: '',
    sortOrder: 0,
    items: [],
};

export default function InfoBlocksAdminPage() {
    const { data: session } = useSession();
    const role = session?.user.role;

    // Читаем все блоки из БД.
    const { data: blocks, isPending } = api.infoBlock.list.useQuery();

    // Форма блока: то, что вводит админ.
    const [form, setForm] = useState<InfoBlockFormState>(EMPTY_FORM);

    // Показывать ли форму (true = форма открыта).
    const [showForm, setShowForm] = useState(false);

    // Текст ошибки валидации (null = ошибок нет).
    const [error, setError] = useState<string | null>(null);

    const utils = api.useUtils();

    // Сохранить блок (создать или обновить).
    const upsert = api.infoBlock.upsert.useMutation({
        onSuccess: () => {
            void utils.infoBlock.list.invalidate();
            setShowForm(false);
        },
    });

    // Удалить блок.
    const deleteBlock = api.infoBlock.delete.useMutation({
        onSuccess: () => {
            void utils.infoBlock.list.invalidate();
        },
    });

    // Переупорядочить блоки (стрелки ↑↓ и drag-and-drop).
    const reorder = api.infoBlock.reorder.useMutation({
        onSuccess: () => {
            void utils.infoBlock.list.invalidate();
        },
    });

    // Сенсоры: мышь/палец (drag начинается после сдвига на 5px) + клавиатура.
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    if (!hasPermission(role ?? '', 'moderator')) {
        return (
            <AuthGuard>
                <Layout> У вас нет доступа </Layout>
            </AuthGuard>
        );
    }

    // Открыть форму для СОЗДАНИЯ нового блока.
    function openCreate() {
        setForm(EMPTY_FORM);
        setError(null);
        setShowForm(true);
    }

    // Открыть форму для РЕДАКТИРОВАНИЯ существующего блока.
    function openEdit(block: InfoBlockRow) {
        setForm({
            id: block.id,
            icon: block.icon,
            title: block.title,
            sortOrder: block.sortOrder,
            items: block.items,
        });
        setError(null);
        setShowForm(true);
    }

    // Проверить форму перед сохранением.
    function validate(): boolean {
        if (form.id.trim().length === 0) {
            setError('Укажите id блока (латиницей, например how-it-works)');
            return false;
        }
        if (form.title.trim().length === 0) {
            setError('Укажите заголовок блока');
            return false;
        }
        if (!form.items.some((item) => item.text.trim().length > 0)) {
            setError('Добавьте хотя бы один пункт с текстом');
            return false;
        }
        setError(null);
        return true;
    }

    // Сохранить: сначала валидация, потом запрос.
    function submit() {
        if (!validate()) {
            return;
        }
        upsert.mutate({
            id: form.id.trim(),
            icon: form.icon,
            title: form.title.trim(),
            sortOrder: form.sortOrder,
            items: form.items,
        });
    }

    // Сдвинуть блок вверх/вниз (стрелки).
    function moveBlock(index: number, direction: 'up' | 'down') {
        if (!blocks) {
            return;
        }
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= blocks.length) {
            return;
        }
        const ids = blocks.map((b) => b.id);
        const current = ids[index];
        const target = ids[targetIndex];
        if (current === undefined || target === undefined) {
            return;
        }
        ids[index] = target;
        ids[targetIndex] = current;
        reorder.mutate({ ids });
    }

    // Перетащили блок (drag-and-drop).
    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id || !blocks) {
            return;
        }
        const oldIndex = blocks.findIndex((b) => b.id === active.id);
        const newIndex = blocks.findIndex((b) => b.id === over.id);
        if (oldIndex < 0 || newIndex < 0) {
            return;
        }
        const reordered = arrayMove(blocks, oldIndex, newIndex);
        utils.infoBlock.list.setData(undefined, reordered);
        reorder.mutate({ ids: reordered.map((b) => b.id) });
    }

    return (
        <AuthGuard>
            <Layout>
                <div className="mx-auto max-w-3xl py-6">
                    {/* Приветствие + круглая кнопка «+» */}
                    <div className="mb-6 flex items-center gap-4">
                        <Sparkles className="h-12 w-12 shrink-0 text-primary max-md:h-10 max-md:w-10" />
                        <div className="min-w-0 flex-1">
                            <h1 className="text-3xl font-bold break-words text-foreground max-md:text-2xl">
                                Добро пожаловать, {session?.user?.firstName ?? session?.user?.name ?? 'Арендодатель'}
                            </h1>
                            <p className="mt-1 text-muted-foreground">
                                Здесь собрано всё, что нужно знать для работы с заявками на бронирование.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={openCreate}
                            aria-label="Добавить блок"
                            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-foreground text-background transition-colors hover:bg-primary hover:text-primary-foreground"
                        >
                            <Plus className="h-5 w-5" />
                        </button>
                    </div>

                    {isPending ? (
                        <p className="text-muted-foreground">Загрузка…</p>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={(blocks ?? []).map((b) => b.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="flex flex-col gap-3">
                                    {blocks?.map((block, index) => (
                                        <SortableBlock
                                            key={block.id}
                                            block={block}
                                            index={index}
                                            total={blocks.length}
                                            onEdit={openEdit}
                                            onDelete={(id) => deleteBlock.mutate({ id })}
                                            onMove={moveBlock}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}

                    {/* Форма — видна только когда showForm = true */}
                    {showForm && (
                        <InfoBlockForm
                            form={form}
                            setForm={setForm}
                            error={error}
                            onSubmit={submit}
                            onCancel={() => setShowForm(false)}
                        />
                    )}
                </div>
            </Layout>
        </AuthGuard>
    );
}
