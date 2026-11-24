import { useState } from 'react';

import Link from 'next/link';

import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { Modal } from '@/components/ui/Modal';
import { formatByn, getMicrodistricts, microdistrictName } from '@/lib/constants';
import { getStatusInfo } from '@/lib/constants/apartment-status';
import { getPayerLabel } from '@/lib/constants/payer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { api, type RouterOutputs } from '@/trpc/react';
type ModerationItem = RouterOutputs['apartment']['getForModeration'][number];

type ModerationCardProps = {
    item: ModerationItem;
    /** true — полные права (админ и выше): «Удалить» и «Редактировать» чужого объекта.
     *  Модератору эти действия запрещены СЕРВЕРОМ (delete/update — admin+),
     *  поэтому кнопки и не показываются: UI не должен обещать то, что сервер отобьёт. */
    canManage: boolean;
};

export function ModerationCard({ item, canManage }: ModerationCardProps) {
    const statusInfo = getStatusInfo(item.apartment.status);
    // ===== Управление кнопками по статусу =====
    // Кнопка бессмысленна, если объект уже в этом статусе:
    // одобрять уже одобренное / отклонять уже отклонённое нельзя — disabled.
    const isActive = item.apartment.status === 'active';
    const isInactive = item.apartment.status === 'inactive';
    const utils = api.useUtils();
    const updateStatus = api.apartment.updateStatus.useMutation({
        onSuccess: () => {
            void utils.apartment.getForModeration.invalidate();
        },
    });
    const deleteApartment = api.apartment.delete.useMutation({
        onSuccess: () => {
            void utils.apartment.getForModeration.invalidate();
        },
    });
    const microdistricts = getMicrodistricts(item.apartment.city);
    const setMicrodistrict = api.apartment.setMicrodistrict.useMutation({
        onSuccess: () => {
            void utils.apartment.getForModeration.invalidate();
        },
    });
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [reason, setReason] = useState('');

    return (
        // Внешняя "коробка" карточки: белый фон, рамка, скругление, тень.
        // overflow-hidden — чтобы фото не вылезало за скруглённые углы
        <>
            <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="relative aspect-[16/10] w-full bg-muted">
                    <ImageWithFallback
                        src={item.apartment.images?.[0]}
                        alt={item.apartment.title}
                        fill
                        className="object-cover"
                    />
                </div>
                {/* ТЕКСТ. Компактные поля p-3 — карточки в 4 колонки узкие, большие
                    отступы съедали место. gap-1.5 — ровный мелкий шаг между строками. */}
                <div className="flex flex-1 flex-col gap-1.5 p-3">
                    {/* заголовок: line-clamp-2 — длинные названия не растягивают карточку */}
                    <p className="line-clamp-2 text-sm leading-[1.3] font-semibold text-foreground">
                        {item.apartment.title}
                    </p>
                    {/* город + цена. "·" — просто разделитель-точка в тексте */}
                    <p className="text-xs text-muted-foreground">
                        {item.apartment.city} · {formatByn(item.apartment.price)}
                    </p>
                    {/* Select выбор районов */}
                    {microdistricts.length > 0 && (
                        <Select
                            value={item.apartment.microdistrict ?? ''}
                            disabled={setMicrodistrict.isPending}
                            onValueChange={(value) =>
                                setMicrodistrict.mutate({ id: item.apartment.id, microdistrict: value || null })
                            }
                        >
                            <SelectTrigger
                                size="sm"
                                className="w-full"
                            >
                                <SelectValue placeholder="Район не выбран" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Не выбран</SelectItem>
                                {microdistricts.map((entry) => (
                                    <SelectItem
                                        key={microdistrictName(entry)}
                                        value={microdistrictName(entry)}
                                    >
                                        {microdistrictName(entry)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    {/* СТАТУС — цветной бейдж. Цвет динамический, поэтому через style,
            а не через Tailwind (Tailwind не умеет динамические цвета). */}
                    <span
                        style={{ background: statusInfo.color }}
                        className="w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide text-white uppercase"
                    >
                        {statusInfo.label}
                    </span>
                    {/* ВЛАДЕЛЕЦ. item.user может быть null (leftJoin), поэтому "?".
                        Мелкий текст xs + truncate — почта не растянет карточку */}
                    <p className="truncate text-xs text-muted-foreground">Email: {item.user?.email ?? 'нет данных'}</p>
                    <p className="truncate text-xs text-muted-foreground">ФИО: {item.user?.name}</p>
                    {/* Юр данные */}
                    <p className="text-xs text-muted-foreground">{getPayerLabel(item.apartment.payerType)}</p>
                    <p className="text-xs break-words text-muted-foreground">
                        УНП: {item.apartment.unp ?? 'не указан'}
                    </p>
                    {/* ===== НИЗ КАРТОЧКИ: единый ритм отступов =====
                        mt-auto ТОЛЬКО здесь — прижимает кнопки к низу карточки.
                        Кнопки компактные (px-2 py-1, text-xs, truncate):
                        в 4 колонках на кнопку ~120px — длинные подписи («Редактировать»)
                        обрезаются многоточием, а не вылезают за границу. */}
                    <div className="mt-auto flex gap-1.5 pt-3">
                        <button
                            onClick={() => updateStatus.mutate({ id: item.apartment.id, status: 'active' })}
                            disabled={isActive}
                            title={isActive ? 'Объект уже одобрен' : undefined}
                            className="flex min-h-6 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-[30px] bg-success px-2 py-1 text-xs font-semibold text-success-foreground transition-colors hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-50 pointer-coarse:min-h-11"
                        >
                            <span className="truncate">Одобрить</span>
                        </button>
                        <button
                            onClick={() => setRejectOpen(true)}
                            disabled={isInactive}
                            title={isInactive ? 'Объект уже отклонён' : undefined}
                            className="flex min-h-6 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-[30px] border border-border px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-warning hover:text-warning disabled:cursor-not-allowed disabled:opacity-50 pointer-coarse:min-h-11"
                        >
                            <span className="truncate">Отклонить</span>
                        </button>
                    </div>
                    {/* Кнопки: УДАЛИТЬ/РЕДАКТИРОВАТЬ — только для админа+ (canManage).
                        Модератору их не показываем: сервер эти действия для него
                        закрывает (delete/update — admin+), кнопки бы просто врали.
                        «Редактировать» — Link со стилями кнопки (не button внутри Link):
                        вложенный интерактив ломает клавиатуру и скринридеры. */}
                    {canManage && (
                        <div className="flex gap-1.5 pt-2">
                            <button
                                onClick={() => setDeleteOpen(true)}
                                className="flex min-h-6 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-[30px] border border-border px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive hover:text-destructive pointer-coarse:min-h-11"
                            >
                                <span className="truncate">Удалить</span>
                            </button>
                            <Link
                                href={`/my-apartments/${item.apartment.id}/edit`}
                                className="flex min-h-6 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-[30px] border border-border px-2 py-1 text-xs font-medium text-muted-foreground no-underline transition-colors hover:border-primary hover:text-primary pointer-coarse:min-h-11"
                            >
                                <span className="truncate">Редактировать</span>
                            </Link>
                        </div>
                    )}
                    {/* ID ОБЪЕКТА — мелкой строкой в общем ритме (gap-2), как ID в «моих объектах» */}
                    <p className="pt-2 text-xs font-bold text-muted-foreground">ID: {item.apartment.id}</p>
                    {/*////////////////// Часть Modal //////////////////////*/}
                    <Modal
                        open={deleteOpen}
                        onClose={() => setDeleteOpen(false)}
                        title="Удалить объект"
                    >
                        <p className="mt-2 wrap-break-word text-foreground">
                            {' '}
                            Удалить объект: {item.apartment.title} ?{' '}
                        </p>
                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    deleteApartment.mutate({ id: item.apartment.id });
                                    setDeleteOpen(false);
                                }}
                                className="cursor-pointer rounded-[30px] bg-destructive px-6 py-2.5 text-base font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
                            >
                                {' '}
                                Да, удалить
                            </button>
                            <button
                                onClick={() => setDeleteOpen(false)}
                                className="cursor-pointer rounded-[30px] border border-border px-6 py-2.5 text-base font-semibold text-foreground transition-colors hover:bg-muted"
                            >
                                Отмена
                            </button>
                        </div>
                    </Modal>
                    <Modal
                        open={rejectOpen}
                        onClose={() => setRejectOpen(false)}
                        title="Отклонить объект"
                    >
                        <p className="p-2 text-foreground">Укажите причину</p>
                        {/* текс филд для отправки причины */}
                        <div className="flex flex-col gap-3 p-2 sm:flex-row">
                            <textarea
                                rows={4}
                                placeholder="Напишите причину..."
                                className="w-full rounded-[15px] border border-border p-3 text-sm"
                                onChange={(e) => setReason(e.target.value)}
                            ></textarea>
                        </div>
                        {/* кнопки отправить/отменить */}
                        <div className="flex flex-wrap justify-center gap-3 text-sm">
                            {/* кнопка отправить */}
                            <button
                                onClick={() => {
                                    updateStatus.mutate({
                                        id: item.apartment.id,
                                        status: 'inactive',
                                        rejectionReason: reason,
                                    });
                                    setRejectOpen(false);
                                }}
                                className="cursor-pointer rounded-[30px] border border-border px-5 py-2.5 transition-colors hover:border-success sm:px-10"
                            >
                                Отправить
                            </button>
                            {/* кнопка Отменить */}
                            <button
                                onClick={() => setRejectOpen(false)}
                                className="cursor-pointer rounded-[30px] border border-border px-5 py-2.5 transition-colors hover:border-destructive sm:px-10"
                            >
                                Отмена
                            </button>
                        </div>
                    </Modal>
                </div>
            </div>
        </>
    );
}
