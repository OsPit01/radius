import { useState } from 'react';

import Image from 'next/image';

import { Close } from '@/components/icons';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { FilterTabs } from '@/components/ui/FilterTabs';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { BOOKING_STATUS_LABELS } from '@/lib/constants/booking';
import { formatByn } from '@/lib/constants/currencies';
import { requireRole } from '@/server/auth/require-auth';
import { api } from '@/trpc/react';

export const getServerSideProps = requireRole('lessor');

// «15 ноября 2026» — дата заявки (день + полный месяц + год).
function formatFullDate(value: Date | string): string {
    return new Date(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

// «15 ноября» — даты проживания (день + полный месяц, без года).
function formatShortDate(value: Date | string): string {
    return new Date(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

// Подходит ли заявка под выбранный фильтр. Одна функция — и для счётчиков,
// и для списка: правило живёт в одном месте, разъехаться не может.
function matchesFilter(status: string, checkInDate: Date, checkOutDate: Date, filter: string, now: Date): boolean {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const isPast = checkOut < now; // выезд уже был
    const isCancelled = status === 'cancelled' || status === 'rejected' || status === 'expired';

    switch (filter) {
        case 'pending': // ждёт ответа владельца
            return status === 'new';
        case 'upcoming': // подтверждена и ещё не началась
            return status === 'approved' && checkIn > now;
        case 'staying': // гости живут прямо сейчас
            return status === 'approved' && checkIn <= now && now <= checkOut;
        case 'past': // выезд был, заявка не отменена
            return isPast && !isCancelled;
        case 'cancelled': // отменена / отклонена / истекла
            return isCancelled;
        case 'all':
        default:
            return true;
    }
}

// Набор фильтров — один список: и для счётчиков, и для вкладок.
const FILTERS = [
    { id: 'all', label: 'Все' },
    { id: 'pending', label: 'Для подтверждения' },
    { id: 'upcoming', label: 'Предстоящие' },
    { id: 'staying', label: 'Проживают' },
    { id: 'past', label: 'Прошлые' },
    { id: 'cancelled', label: 'Отменённые' },
] as const;

export default function ManageBookingsPage() {
    const utils = api.useUtils();
    const [tab, setTab] = useState('requests');
    const [underTab, setUnderTab] = useState('all');
    // Заявки на мои квартиры (я — владелец).
    const { data: bookings, isPending } = api.bookings.listForOwner.useQuery();

    // Удаление заявки из БД.
    const deleteBooking = api.bookings.delete.useMutation({
        onSuccess: () => {
            void utils.bookings.listForOwner.invalidate();
        },
    });

    const now = new Date();

    // Счётчики: сколько заявок подходит под каждый фильтр.
    const counts = FILTERS.map((f) => {
        const count = (bookings ?? []).filter(({ booking }) =>
            matchesFilter(booking.status, booking.checkInDate, booking.checkOutDate, f.id, now),
        ).length;
        return { id: f.id, label: f.label, count };
    });

    // Список под выбранный фильтр.
    const filtered = (bookings ?? []).filter(({ booking }) =>
        matchesFilter(booking.status, booking.checkInDate, booking.checkOutDate, underTab, now),
    );

    return (
        <AuthGuard>
            <ClientHeader />
            <div className="mx-auto max-w-[1400px] px-6 py-4 max-md:px-5">
                <SegmentedTabs
                    tabs={[
                        { id: 'info', label: 'Информация' },
                        { id: 'requests', label: 'Мои заявки' },
                        { id: 'calendar', label: 'Календарь' },
                        { id: 'settings', label: 'Настройки' },
                    ]}
                    active={tab}
                    onChange={setTab}
                />

                {tab === 'requests' && (
                    <>
                        <FilterTabs
                            tabs={counts}
                            active={underTab}
                            onChange={setUnderTab}
                        />

                        {isPending ? (
                            <p className="py-8 text-center text-muted-foreground">Загрузка…</p>
                        ) : filtered.length === 0 ? (
                            <p className="py-8 text-center text-muted-foreground">
                                По заданным фильтрам ничего не найдено.
                            </p>
                        ) : (
                            <div className="mt-4">
                                {/* Шапка таблицы — тот же grid, что и у строк, чтобы колонки совпали */}
                                <div className="hidden border-b border-border px-2 pb-2 text-sm font-medium text-muted-foreground md:grid md:grid-cols-[150px_1fr_180px_200px] md:gap-4">
                                    <span>Дата</span>
                                    <span>Объект</span>
                                    <span>Проживание</span>
                                    <span>Статус</span>
                                </div>

                                {filtered.map(({ booking, apartment }) => (
                                    <div
                                        key={booking.id}
                                        className="grid grid-cols-1 gap-3 border-b border-border px-3 py-4 md:grid-cols-[150px_1fr_180px_200px] md:items-center md:gap-4 md:px-2 md:py-3"
                                    >
                                        {/* Дата заявки */}
                                        <span className="text-sm text-muted-foreground">
                                            {formatFullDate(booking.createdAt)}
                                        </span>

                                        {/* Объект: фото + заголовок + цена */}
                                        <div className="flex min-w-0 items-center gap-3">
                                            {apartment.images?.[0] && (
                                                <Image
                                                    src={apartment.images[0]}
                                                    alt=""
                                                    width={48}
                                                    height={48}
                                                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                                                />
                                            )}
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-foreground">
                                                    {apartment.title}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatByn(apartment.price)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Проживание: даты заезда/выезда */}
                                        <span className="text-sm text-muted-foreground">
                                            {formatShortDate(booking.checkInDate)} —{' '}
                                            {formatShortDate(booking.checkOutDate)}
                                        </span>

                                        {/* Статус + причина + удаление */}
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-foreground">
                                                    {BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
                                                </p>
                                                {booking.cancelReason && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Причина: {booking.cancelReason}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => deleteBooking.mutate({ bookingId: booking.id })}
                                                aria-label="Удалить заявку"
                                                className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                <Close className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {tab === 'calendar' && <p>Календарь — в разработке</p>}
                {tab === 'info' && <p>Информация — в разработке</p>}
                {tab === 'settings' && <p>Настройки — в разработке</p>}
            </div>
        </AuthGuard>
    );
}
