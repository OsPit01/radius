import { useState } from 'react';

import { useSession } from 'next-auth/react';

import { Calendar, CheckCircle, Close, Home, Hourglass } from '@/components/icons';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { MyBookingCard } from '@/components/profile/my-bookings/MyBookingCard';
import { Modal } from '@/components/ui/Modal';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { isAdminRole } from '@/lib/constants/roles';
import { requireAuth } from '@/server/auth/require-auth';
import { Layout } from '@/shared/ui/layout';
import { api } from '@/trpc/react';
export const getServerSideProps = requireAuth;

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
            <Layout>
                {/* Тип жилья (перспектива: дома, отели…) */}
                <div className="mb-5 px-4 pt-5">
                    <SegmentedTabs
                        className="px-4"
                        tabs={[{ id: 'flat', label: 'Квартиры', Icon: Home }]}
                        active={housingType}
                        onChange={setHousingType}
                    />
                </div>

                {/* Статусы брони гостя */}
                <SegmentedTabs
                    className="px-4"
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
                            <MyBookingCard
                                key={booking.id}
                                booking={booking}
                                apartment={apartment}
                                canDelete={canDelete}
                                onDelete={(id) => setConfirmDeleteId(id)}
                            />
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
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                if (confirmDeleteId !== null) {
                                    deleteBooking.mutate({ bookingId: confirmDeleteId });
                                }
                                setConfirmDeleteId(null);
                            }}
                            className="cursor-pointer rounded-[25px] border border-destructive px-6 py-2.5 text-foreground transition-all duration-300 hover:bg-destructive/90 hover:text-destructive-foreground sm:px-10"
                        >
                            Удалить
                        </button>
                        <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="cursor-pointer rounded-[25px] border border-border px-6 py-2.5 text-foreground transition-all duration-300 hover:bg-muted sm:px-10"
                        >
                            Отмена
                        </button>
                    </div>
                </Modal>
            </Layout>
        </AuthGuard>
    );
}
