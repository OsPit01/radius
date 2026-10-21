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
            <div className="flex flex-col overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white shadow-sm">
                {/* ФОТО. relative + fill + object-cover — картинка заполняет блок 16:9 */}
                <div className="relative aspect-[16/9] w-full bg-[#f0f0f0]">
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
                    <p className="text-lg font-semibold text-[#222]">{item.apartment.title}</p>
                    {/* город + цена. "·" — просто разделитель-точка в тексте */}
                    <p className="text-sm text-[#666]">
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
                    <p className="text-sm break-words text-[#666]">Email: {item.user?.email ?? 'нет данных'}</p>
                    <p className="break-word text-sm text-[#666]">ФИО: {item.user?.name}</p>
                    {/* Юр данные */}
                    <p className="text-sm text-[#666]">
                        {PAYERTYPE.find((p) => p.value === item.apartment.payerType)?.label}
                    </p>
                    <p className="text-[12px] break-words text-[#666]">УНП: {item.apartment.unp ?? 'не указан'}</p>
                    {/* //кнопки: ОДОБРОИТЬ/ОТКЛОНИТь  mt-auto прижимает к низу карточки  */}
                    <div className="mt-auto flex gap-2 pt-4 max-[480px]:flex-col">
                        <button
                            onClick={() => updateStatus.mutate({ id: item.apartment.id, status: 'active' })}
                            className="flex-1 cursor-pointer rounded-[30px] bg-green-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800"
                        >
                            Одобрить
                        </button>
                        <button
                            onClick={() => setRejectOpen(true)}
                            className="flex-1 cursor-pointer rounded-[30px] border border-orange-300 px-5 py-2 text-sm font-medium text-[#666] transition-colors hover:border-orange-600 hover:text-red-900"
                        >
                            Отклонить
                        </button>
                    </div>
                    {/* Кнопки: УДАЛИТЬ/РЕДАКТИРОВАТЬ*/}
                    <div className="mt-auto flex gap-2 pt-4 max-[480px]:flex-col">
                        <button
                            onClick={() => setDeleteOpen(true)}
                            className="flex-1 cursor-pointer rounded-[30px] border border-red-200 px-5 py-2 text-sm font-medium text-[#666] transition-colors hover:border-red-900 hover:text-red-900"
                        >
                            Удалить
                        </button>

                        <Link
                            href={`/my-apartments/${item.apartment.id}/edit`}
                            className="flex-1 max-[480px]:w-full"
                        >
                            <button className="w-full cursor-pointer rounded-[30px] border border-blue-200 px-5 py-2 text-sm font-medium text-[#666] transition-colors hover:border-blue-900 hover:text-blue-900">
                                Редактировать
                            </button>
                        </Link>
                    </div>
                    {/* ID ОБЪЕКТА */}
                    <p className="text-sm text-[#999]">ID: {item.apartment.id}</p>
                    {/*////////////////// Часть Modal //////////////////////*/}
                    <Modal
                        open={deleteOpen}
                        onClose={() => setDeleteOpen(false)}
                        title="Удалить объект"
                    >
                        <p className="mt-2 text-black"> Удалить объект: {item.apartment.title} ? </p>
                        <div className="mt-6 flex justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    deleteApartment.mutate({ id: item.apartment.id });
                                    setDeleteOpen(false);
                                }}
                                className="cursor-pointer rounded-[30px] bg-[#ef4444] px-6 py-2.5 text-base font-semibold text-white transition-colors hover:bg-[#dc2626] disabled:opacity-50"
                            >
                                {' '}
                                Да, удалить
                            </button>
                            <button
                                onClick={() => setDeleteOpen(false)}
                                className="cursor-pointer rounded-[30px] border border-[#ddd] px-6 py-2.5 text-base font-semibold text-[#1a1a2e] transition-colors hover:bg-gray-100"
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
                        <p className="p-2 text-black">Укажите причину</p>
                        {/* текс филд для отправки причины */}
                        <div className="flex flex-col gap-3 p-2 sm:flex-row">
                            <textarea
                                rows={4}
                                placeholder="Напишите причину..."
                                className="w-full rounded-[15px] border border-gray-300 p-3 text-sm"
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
                                className="cursor-pointer rounded-[30px] border border-gray-500 px-10 py-2.5 transition-colors hover:border-green-900"
                            >
                                Отправить
                            </button>
                            {/* кнопка Отменить */}
                            <button
                                onClick={() => setRejectOpen(false)}
                                className="cursor-pointer rounded-[30px] border border-gray-500 px-10 py-2.5 transition-colors hover:border-red-800"
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
