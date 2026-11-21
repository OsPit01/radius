import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

import { Calendar, CheckCircle, Close, Home, Hourglass } from '@/components/icons';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { Modal } from '@/components/ui/Modal';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { GUEST_BOOKING_STATUS_LABELS } from '@/lib/constants/booking';
import { cancelledByLabel } from '@/lib/constants/cancel-reasons';
import { formatByn } from '@/lib/constants/currencies';
import { isAdminRole } from '@/lib/constants/roles';
import { requireAuth } from '@/server/auth/require-auth';
import { api } from '@/trpc/react';

export const getServerSideProps = requireAuth;

// «21 ноября 2026 г., 09:45» — дата создания (день + месяц + год + время):
// время нужно, чтобы был виден порядок заявок, созданных в один день.
function formatFullDate(value: Date | string): string {
    return new Date(value).toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// «15 ноября» — даты проживания (день + полный месяц, без года).
function formatShortDate(value: Date | string): string {
    return new Date(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

// Цвет статуса: подтверждена — зелёный, ждёт ответа — жёлтый, отменена — красный.
function statusColor(status: string): string {
    switch (status) {
        case 'approved':
            return 'text-success';
        case 'new':
            return 'text-warning';
        case 'cancelled':
        case 'rejected':
        case 'expired':
            return 'text-destructive';
        default:
            return 'text-foreground';
    }
}

// Подходит ли бронь под фильтр (гость: предстоящие / прошлые / отменённые).
function matchesFilter(status: string, checkInDate: Date, checkOutDate: Date, filter: string, now: Date): boolean {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const isCancelled = status === 'cancelled' || status === 'rejected' || status === 'expired';

    switch (filter) {
        case 'pending': // ждёт подтверждения владельца
            return status === 'new';
        case 'upcoming': // подтверждена и заезд впереди
            return status === 'approved' && checkIn > now;
        case 'past': // уже прожил: выезд был, бронь не отменена
            return checkOut < now && !isCancelled;
        case 'cancelled': // отменена / отклонена / истекла
            return isCancelled;
        case 'all':
        default:
            return true;
    }
}

export default function MyBookingsPage() {
    const utils = api.useUtils();
    // Тип жилья (сейчас только квартиры, дальше — дома, отели…).
    const [housingType, setHousingType] = useState('flat');
    // Статус брони.
    const [tab, setTab] = useState('pending');
    const { data: session } = useSession();
    // Удалять может только админ и выше — крестик виден только ему.
    const canDelete = isAdminRole(session?.user?.role);
    // Какую заявку подтверждаем удалить (null = модалка закрыта).
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    // Мои брони как гостя.
    const { data: bookings, isPending } = api.bookings.listForUser.useQuery();

    // Удаление заявки из БД.
    const deleteBooking = api.bookings.delete.useMutation({
        onSuccess: () => {
            void utils.bookings.listForUser.invalidate();
        },
    });

    const now = new Date();
    const filtered = (bookings ?? []).filter(({ booking }) =>
        matchesFilter(booking.status, booking.checkInDate, booking.checkOutDate, tab, now),
    );

    return (
        <AuthGuard>
            <ClientHeader />
            <div className="mx-auto max-w-[1400px] px-6 py-4 max-md:px-5">
                {/* Тип жилья (перспектива: дома, отели…) */}
                <div className="mb-5 pt-5">
                    <SegmentedTabs
                        tabs={[{ id: 'flat', label: 'Квартиры', Icon: Home }]}
                        active={housingType}
                        onChange={setHousingType}
                    />
                </div>

                {/* Статусы брони гостя */}
                <SegmentedTabs
                    tabs={[
                        { id: 'pending', label: 'Ожидает подтверждения', Icon: Hourglass },
                        { id: 'upcoming', label: 'Предстоящие', Icon: Calendar },
                        { id: 'past', label: 'Прошлые', Icon: CheckCircle },
                        { id: 'cancelled', label: 'Отменённые', Icon: Close },
                    ]}
                    active={tab}
                    onChange={setTab}
                />

                {isPending ? (
                    <p className="py-8 text-center text-muted-foreground">Загрузка…</p>
                ) : filtered.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">По заданным фильтрам ничего не найдено.</p>
                ) : (
                    <ul className="mt-4 flex flex-col gap-3">
                        {filtered.map(({ booking, apartment }) => (
                            <li
                                key={booking.id}
                                className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 max-md:gap-3 max-md:p-4"
                            >
                                {/* Фото + контент — ссылка на детали брони */}
                                <Link
                                    href={`/profile/bookings/${booking.id}`}
                                    className="flex min-w-0 flex-1 items-start gap-4 no-underline max-md:gap-3"
                                >
                                    {/* Фото */}
                                    {apartment.images?.[0] && (
                                        <Image
                                            src={apartment.images[0]}
                                            alt=""
                                            width={80}
                                            height={80}
                                            className="h-20 w-20 shrink-0 rounded-xl object-cover max-md:h-16 max-md:w-16"
                                        />
                                    )}

                                    <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                                        {/* Дата заявки */}
                                        <p className="text-xs text-muted-foreground">
                                            Дата: {formatFullDate(booking.createdAt)}
                                        </p>
                                        {/* Адрес */}
                                        <p className="truncate font-medium text-foreground">
                                            {apartment.street}, {apartment.numberHome}
                                        </p>
                                        {/* Цена */}
                                        <p className="text-sm text-muted-foreground">{formatByn(apartment.price)}</p>

                                        {/* Заезд — Выезд */}
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                                            <span className="text-muted-foreground">Заезд:</span>
                                            <span className="text-foreground">
                                                {formatShortDate(booking.checkInDate)}
                                            </span>
                                            <span className="text-muted-foreground">—</span>
                                            <span className="text-muted-foreground">Выезд:</span>
                                            <span className="text-foreground">
                                                {formatShortDate(booking.checkOutDate)}
                                            </span>
                                        </div>

                                        {/* Статус: отменена → кто и почему; иначе — статус с иконкой */}
                                        {cancelledByLabel(booking.cancelledBy) ? (
                                            <>
                                                <p className={`font-bold ${statusColor(booking.status)}`}>
                                                    {cancelledByLabel(booking.cancelledBy)}
                                                </p>
                                                {booking.cancelReason && (
                                                    <p className="text-sm text-muted-foreground">
                                                        Причина отмены: «{booking.cancelReason}»
                                                    </p>
                                                )}
                                            </>
                                        ) : (
                                            <p
                                                className={`flex items-center gap-1.5 font-bold ${statusColor(booking.status)}`}
                                            >
                                                {booking.status === 'approved' && <CheckCircle className="h-4 w-4" />}
                                                {booking.status === 'new' && <Hourglass className="h-4 w-4" />}
                                                {GUEST_BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
                                            </p>
                                        )}
                                    </div>
                                </Link>

                                {/* Удалить заявку — крестик виден ТОЛЬКО админу и выше.
                                    Клик не удаляет сразу, а открывает модалку подтверждения. */}
                                {canDelete && (
                                    <button
                                        type="button"
                                        onClick={() => setConfirmDeleteId(booking.id)}
                                        aria-label="Удалить заявку"
                                        className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                    >
                                        <Close className="h-5 w-5" />
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}

                {/* Модалка подтверждения удаления */}
                <Modal
                    open={confirmDeleteId !== null}
                    onClose={() => setConfirmDeleteId(null)}
                    title="Удалить заявку?"
                >
                    <p>Вы уверены, что хотите удалить эту заявку? Действие необратимо.</p>
                    <div className="mt-6 flex justify-center gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                if (confirmDeleteId !== null) {
                                    deleteBooking.mutate({ bookingId: confirmDeleteId });
                                }
                                setConfirmDeleteId(null);
                            }}
                            className="cursor-pointer rounded-[25px] border border-destructive px-10 py-2.5 text-foreground transition-all duration-300 hover:bg-destructive/90 hover:text-destructive-foreground"
                        >
                            Удалить
                        </button>
                        <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="cursor-pointer rounded-[25px] border border-border px-10 py-2.5 text-foreground transition-all duration-300 hover:bg-muted"
                        >
                            Отмена
                        </button>
                    </div>
                </Modal>
            </div>
        </AuthGuard>
    );
}
