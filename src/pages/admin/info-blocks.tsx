import { useRef, useState } from 'react';

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
import { AccessDenied } from '@/components/ui/AccessDenied';
import { canManageInfoBlocks, isAdminRole } from '@/lib/constants/roles';
import { requireCan } from '@/server/auth/require-auth';
import { Layout } from '@/shared/ui/layout';
import { api } from '@/trpc/react';

// Доступ: модератор+ и legalAdmin (точечное право). Остальным — 404 на сервере.
export const getServerSideProps = requireCan(canManageInfoBlocks);

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

    const formRef = useRef<HTMLDivElement>(null);
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

    if (!canManageInfoBlocks(role)) {
        return (
            <AuthGuard>
                <Layout>
                    <AccessDenied />
                </Layout>
            </AuthGuard>
        );
    }

    // Открыть форму для СОЗДАНИЯ нового блока.
    function openCreate() {
        setForm(EMPTY_FORM);
        setError(null);
        setShowForm(true);
        setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
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
        setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
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
                <div className="mx-auto max-w-3xl px-4 py-6">
                    {/* Приветствие: десктоп — иконка слева, текст, кнопка справа (в строку).
                        Мобилка — столбик: иконка по центру, текст по центру, кнопка справа внизу. */}
                    <div className="mb-6 flex items-center gap-4 max-md:flex-col max-md:items-center">
                        <Sparkles className="h-12 w-12 shrink-0 text-primary max-md:h-8 max-md:w-8" />

                        <div className="min-w-0 flex-1 max-md:w-full max-md:text-center">
                            <h1 className="text-3xl font-bold break-words text-foreground max-md:text-xl">
                                Добро пожаловать, {session?.user?.firstName ?? session?.user?.name ?? 'Арендодатель'}
                            </h1>
                            <p className="mt-1 text-muted-foreground max-md:text-sm">
                                Здесь собрано всё, что нужно знать для работы с заявками на бронирование.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={openCreate}
                            aria-label="Добавить блок"
                            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-foreground text-background transition-colors hover:bg-primary hover:text-primary-foreground max-md:h-8 max-md:w-8 max-md:self-end"
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
                                    {blocks?.map((block) => (
                                        <SortableBlock
                                            key={block.id}
                                            block={block}
                                            canDelete={isAdminRole(role)}
                                            onEdit={openEdit}
                                            onDelete={(id) => deleteBlock.mutate({ id })}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}

                    {/* Форма — видна только когда showForm = true */}
                    {showForm && (
                        <div ref={formRef}>
                            <InfoBlockForm
                                form={form}
                                setForm={setForm}
                                error={error}
                                onSubmit={submit}
                                onCancel={() => setShowForm(false)}
                            />
                        </div>
                    )}
                </div>
            </Layout>
        </AuthGuard>
    );
}
