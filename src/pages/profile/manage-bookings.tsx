import { useState } from 'react';

import { useSession } from 'next-auth/react';

import { AuthGuard } from '@/components/layout/AuthGuard';
import { InfoTab } from '@/components/profile/manage-bookings/InfoTab';
import { ManageBookingRow } from '@/components/profile/manage-bookings/ManageBookingRow';
import { FilterTabs } from '@/components/ui/FilterTabs';
import { Modal } from '@/components/ui/Modal';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
// Одна функция фильтрации на обе страницы — счётчики и списки не разойдутся.
import { matchesBookingFilter as matchesFilter } from '@/lib/booking-filters';
import { isAdminRole } from '@/lib/constants/roles';
import { requireRole } from '@/server/auth/require-auth';
import { Layout } from '@/shared/ui/layout';
import { api } from '@/trpc/react';
// Страница доступна только арендодателю и выше (lessor+).
// Обычному пользователю (role "user") отдаётся 404 ещё на сервере.
export const getServerSideProps = requireRole('lessor');

// Набор фильтров — один список: и для вкладок, и для счётчиков.
const FILTERS = [
    { id: 'all', label: 'Все' },
    { id: 'pending', label: 'Для подтверждения' },
    { id: 'upcoming', label: 'Предстоящие' },
    { id: 'staying', label: 'Проживают' },
    { id: 'past', label: 'Прошлые' },
    { id: 'cancelled', label: 'Отменённые' },
] as const;

export default function ManageBookingsPage() {
    // ===== СОСТОЯНИЕ СТРАНИЦЫ (useState) =====
    // tab — какая из ВЕРХНИХ вкладок открыта (Информация / Мои заявки / Календарь / Настройки).
    const [tab, setTab] = useState('requests');
    // underTab — какой ФИЛЬТР выбран внутри «Моих заявок».
    const [underTab, setUnderTab] = useState('all');
    const { data: session } = useSession();
    // Удалять может только админ и выше — крестик виден только ему.
    const canDelete = isAdminRole(session?.user?.role);
    // Какую заявку подтверждаем удалить (null = модалка закрыта).
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    // ===== ДАННЫЕ С СЕРВЕРА =====
    // listForOwner возвращает заявки НА МОИ КВАРТИРЫ (я — владелец).
    const { data: bookings, isPending } = api.bookings.listForOwner.useQuery();

    // ===== УДАЛЕНИЕ ЗАЯВКИ =====
    const utils = api.useUtils();
    const deleteBooking = api.bookings.delete.useMutation({
        onSuccess: () => {
            void utils.bookings.listForOwner.invalidate();
        },
    });

    // «Сейчас» — одна дата для всей страницы (фильтры сравнивают с ней заезд/выезд).
    const now = new Date();

    // Счётчики: сколько заявок подходит под каждый фильтр.
    const counts = FILTERS.map((f) => {
        const count = (bookings ?? []).filter(({ booking }) =>
            matchesFilter(booking.status, booking.checkInDate, booking.checkOutDate, f.id, now),
        ).length;
        return { id: f.id, label: f.label, count };
    });

    // Отфильтрованный список под выбранный фильтр.
    const filtered = (bookings ?? []).filter(({ booking }) =>
        matchesFilter(booking.status, booking.checkInDate, booking.checkOutDate, underTab, now),
    );

    return (
        <AuthGuard>
            <Layout>
                <div className="mx-auto max-w-7xl p-4">
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
                            {/* ФИЛЬТРЫ-ТАБЛЕТКИ: tabs={counts} — фильтры со счётчиками. */}
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
                                    {/* Шапка таблицы (на мобилке скрыта) */}
                                    <div className="hidden border-b border-border px-2 pb-2 text-sm font-medium text-muted-foreground md:grid md:grid-cols-[150px_1fr_180px_200px] md:gap-4">
                                        <span>Дата</span>
                                        <span>Объект</span>
                                        <span>Проживание</span>
                                        <span>Статус</span>
                                    </div>

                                    {filtered.map(({ booking, apartment }) => (
                                        <ManageBookingRow
                                            key={booking.id}
                                            booking={booking}
                                            apartment={apartment}
                                            canDelete={canDelete}
                                            onDelete={(id) => setConfirmDeleteId(id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* Остальные вкладки — заглушки «в разработке» */}
                    {tab === 'calendar' && <p>Календарь — в разработке</p>}
                    {tab === 'info' && (
                        <InfoTab name={session?.user?.firstName ?? session?.user?.name ?? 'Арендодатель'} />
                    )}
                    {tab === 'settings' && <p>Настройки — в разработке</p>}
                </div>

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
