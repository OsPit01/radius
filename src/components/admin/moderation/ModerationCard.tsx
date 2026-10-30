import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { Modal } from '@/components/ui/Modal';
import { getStatusInfo } from '@/lib/constants/apartment-status';
import { PAYERTYPE } from '@/lib/constants/info-company';
import { api, type RouterOutputs } from '@/trpc/react';
type ModerationItem = RouterOutputs['apartment']['getForModeration'][number];

export function ModerationCard({ item }: { item: ModerationItem }) {
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
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [reason, setReason] = useState('');

    return (
        // Внешняя "коробка" карточки: белый фон, рамка, скругление, тень.
        // overflow-hidden — чтобы фото не вылезало за скруглённые углы
        <>
            <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {/* ФОТО. relative + fill + object-cover — картинка заполняет блок 16:9 */}
                <div className="relative aspect-[16/9] w-full bg-muted">
                    <Image
                        src={item.apartment.image}
                        alt={item.apartment.title}
                        fill
                        className="object-cover"
                    ></Image>
                </div>
                {/* ТЕКСТ. flex flex-col gap-2 — всё столбиком с промежутком 0.5rem.
          flex-1 — растягивает блок, чтобы кнопки прижимались к низу карточки. */}
                <div className="flex flex-1 flex-col gap-2 p-5">
                    {/* заголовок */}
                    <p className="text-lg font-semibold text-foreground">{item.apartment.title}</p>
                    {/* город + цена. "·" — просто разделитель-точка в тексте */}
                    <p className="text-sm text-muted-foreground">
                        {item.apartment.city} · {item.apartment.price} {item.apartment.currency}
                    </p>
                    {/* СТАТУС — цветной бейдж. Цвет динамический, поэтому через style,
            а не через Tailwind (Tailwind не умеет динамические цвета). */}
                    <span
                        style={{ background: statusInfo.color }}
                        className="w-fit rounded-full px-3 py-1 text-xs font-semibold tracking-wide text-white uppercase"
                    >
                        {statusInfo.label}
                    </span>
                    {/* ВЛАДЕЛЕЦ. item.user может быть null (leftJoin), поэтому "?" */}
                    <p className="text-sm break-words text-muted-foreground">
                        Email: {item.user?.email ?? 'нет данных'}
                    </p>
                    <p className="break-word text-sm text-muted-foreground">ФИО: {item.user?.name}</p>
                    {/* Юр данные */}
                    <p className="text-sm text-muted-foreground">
                        {PAYERTYPE.find((p) => p.value === item.apartment.payerType)?.label}
                    </p>
                    <p className="text-[12px] break-words text-muted-foreground">
                        УНП: {item.apartment.unp ?? 'не указан'}
                    </p>
                    {/* //кнопки: ОДОБРОИТЬ/ОТКЛОНИТЬ  mt-auto прижимает к низу карточки.
                        disabled: «Одобрить» не активна для уже одобренных,
                        «Отклонить» — для уже отклонённых (бессмысленные действия). */}
                    <div className="mt-auto flex gap-2 pt-4 max-[480px]:flex-col">
                        <button
                            onClick={() => updateStatus.mutate({ id: item.apartment.id, status: 'active' })}
                            disabled={isActive}
                            // title — подсказка при наведении: ЧЕМУ кнопка не активна
                            title={isActive ? 'Объект уже одобрен' : undefined}
                            className="flex-1 cursor-pointer rounded-[30px] bg-success px-5 py-2 text-sm font-semibold text-success-foreground transition-colors hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Одобрить
                        </button>
                        <button
                            onClick={() => setRejectOpen(true)}
                            disabled={isInactive}
                            title={isInactive ? 'Объект уже отклонён' : undefined}
                            className="flex-1 cursor-pointer rounded-[30px] border border-border px-5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-warning hover:text-warning disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Отклонить
                        </button>
                    </div>
                    {/* Кнопки: УДАЛИТЬ/РЕДАКТИРОВАТЬ*/}
                    <div className="mt-auto flex gap-2 pt-4 max-[480px]:flex-col">
                        <button
                            onClick={() => setDeleteOpen(true)}
                            className="flex-1 cursor-pointer rounded-[30px] border border-border px-5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                        >
                            Удалить
                        </button>

                        <Link
                            href={`/my-apartments/${item.apartment.id}/edit`}
                            className="flex-1 max-[480px]:w-full"
                        >
                            <button className="w-full cursor-pointer rounded-[30px] border border-border px-5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                                Редактировать
                            </button>
                        </Link>
                    </div>
                    {/* ID ОБЪЕКТА */}
                    <p className="text-sm text-muted-foreground">ID: {item.apartment.id}</p>
                    {/*////////////////// Часть Modal //////////////////////*/}
                    <Modal
                        open={deleteOpen}
                        onClose={() => setDeleteOpen(false)}
                        title="Удалить объект"
                    >
                        <p className="mt-2 text-foreground"> Удалить объект: {item.apartment.title} ? </p>
                        <div className="mt-6 flex justify-center gap-3">
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
                        <div className="ml-2 flex justify-center gap-3 text-sm">
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
                                className="cursor-pointer rounded-[30px] border border-border px-10 py-2.5 transition-colors hover:border-success"
                            >
                                Отправить
                            </button>
                            {/* кнопка Отменить */}
                            <button
                                onClick={() => setRejectOpen(false)}
                                className="cursor-pointer rounded-[30px] border border-border px-10 py-2.5 transition-colors hover:border-destructive"
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
